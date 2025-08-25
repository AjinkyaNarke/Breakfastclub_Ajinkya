import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addDays, isSameDay, isAfter, addHours } from 'date-fns';
import { CalendarIcon, Clock, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const createReservationSchema = (t: any) => z.object({
  customer_name: z.string().min(1, t('reservations.validation.nameRequired')),
  customer_email: z.string().email(t('reservations.validation.emailInvalid')),
  customer_phone: z.string().optional(),
  reservation_date: z.date({
    required_error: t('reservations.validation.dateRequired'),
  }).refine((date) => isAfter(date, new Date()), {
    message: t('reservations.validation.dateInPast'),
  }),
  reservation_time: z.string().min(1, t('reservations.validation.timeRequired')),
  party_size: z.number().min(1, t('reservations.validation.partySizeMin')).max(20, t('reservations.validation.partySizeMax')),
  special_requests: z.string().optional(),
});

type ReservationFormData = z.infer<ReturnType<typeof createReservationSchema>>;

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30'
];

export default function Reservations() {
  const { t, i18n } = useTranslation('common');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [reservationDetails, setReservationDetails] = useState<any>(null);

  const schema = createReservationSchema(t);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ReservationFormData>({
    resolver: zodResolver(schema),
  });

  const selectedDate = watch('reservation_date');
  const selectedTime = watch('reservation_time');
  const partySize = watch('party_size');

  const onSubmit = async (data: ReservationFormData) => {
    setIsSubmitting(true);
    
    try {
      // Check if the selected time is at least 2 hours from now
      const reservationDateTime = new Date(`${format(data.reservation_date, 'yyyy-MM-dd')}T${data.reservation_time}`);
      const minBookingTime = addHours(new Date(), 2);
      
      if (reservationDateTime <= minBookingTime) {
        toast({
          title: t('reservations.error.title'),
          description: t('reservations.validation.timeTooSoon'),
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // Create reservation
      const reservationData = {
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        customer_phone: data.customer_phone,
        reservation_date: format(data.reservation_date, 'yyyy-MM-dd'),
        reservation_time: data.reservation_time,
        party_size: data.party_size,
        special_requests: data.special_requests,
        language_preference: i18n.language,
        status: 'pending' as const
      };

      const { data: reservation, error } = await supabase
        .from('reservations')
        .insert(reservationData)
        .select()
        .single();

      if (error) throw error;

      // Send confirmation email via edge function
      const { error: emailError } = await supabase.functions.invoke('send-reservation-confirmation', {
        body: {
          reservation: reservation,
          language: i18n.language
        }
      });

      if (emailError) {
        console.error('Email sending failed:', emailError);
        // Don't fail the reservation if email fails
      }

      setReservationDetails(reservation);
      setShowSuccess(true);
      reset();

      toast({
        title: t('reservations.success.title'),
        description: t('reservations.success.message'),
      });

    } catch (error: any) {
      console.error('Reservation error:', error);
      toast({
        title: t('reservations.error.title'),
        description: t('reservations.error.message'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess && reservationDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-600">
                {t('reservations.success.title')}
              </CardTitle>
              <CardDescription>
                {t('reservations.success.message')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg text-left">
                <h4 className="font-semibold mb-2">{t('reservations.success.details')}</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>{t('reservations.form.name')}:</strong> {reservationDetails.customer_name}</p>
                  <p><strong>{t('reservations.form.date')}:</strong> {format(new Date(reservationDetails.reservation_date), 'PPP')}</p>
                  <p><strong>{t('reservations.form.time')}:</strong> {reservationDetails.reservation_time}</p>
                  <p><strong>{t('reservations.form.partySize')}:</strong> {reservationDetails.party_size} {reservationDetails.party_size === 1 ? t('reservations.partySize.1') : t('reservations.partySize.2')}</p>
                </div>
              </div>
              <Button 
                onClick={() => {
                  setShowSuccess(false);
                  setReservationDetails(null);
                }}
                className="w-full"
              >
                {t('reservations.success.makeAnother')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">
              {t('reservations.title')}
            </CardTitle>
            <CardDescription className="text-lg">
              {t('reservations.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Name and Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer_name">{t('reservations.form.name')}</Label>
                  <Input
                    id="customer_name"
                    {...register('customer_name')}
                    className={errors.customer_name ? 'border-destructive' : ''}
                  />
                  {errors.customer_name && (
                    <p className="text-sm text-destructive">{errors.customer_name.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="customer_email">{t('reservations.form.email')}</Label>
                  <Input
                    id="customer_email"
                    type="email"
                    {...register('customer_email')}
                    className={errors.customer_email ? 'border-destructive' : ''}
                  />
                  {errors.customer_email && (
                    <p className="text-sm text-destructive">{errors.customer_email.message}</p>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="customer_phone">{t('reservations.form.phone')} (Optional)</Label>
                <Input
                  id="customer_phone"
                  type="tel"
                  {...register('customer_phone')}
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('reservations.form.date')}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground",
                          errors.reservation_date && "border-destructive"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => setValue('reservation_date', date!)}
                        disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.reservation_date && (
                    <p className="text-sm text-destructive">{errors.reservation_date.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>{t('reservations.form.time')}</Label>
                  <Select value={selectedTime} onValueChange={(value) => setValue('reservation_time', value)}>
                    <SelectTrigger className={errors.reservation_time ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          <div className="flex items-center">
                            <Clock className="mr-2 h-4 w-4" />
                            {time}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.reservation_time && (
                    <p className="text-sm text-destructive">{errors.reservation_time.message}</p>
                  )}
                </div>
              </div>

              {/* Party Size */}
              <div className="space-y-2">
                <Label>{t('reservations.form.partySize')}</Label>
                <Select value={partySize?.toString()} onValueChange={(value) => setValue('party_size', parseInt(value))}>
                  <SelectTrigger className={errors.party_size ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select number of guests" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 20 }, (_, i) => i + 1).map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        <div className="flex items-center">
                          <Users className="mr-2 h-4 w-4" />
                          {t(`reservations.partySize.${size}`)}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.party_size && (
                  <p className="text-sm text-destructive">{errors.party_size.message}</p>
                )}
              </div>

              {/* Special Requests */}
              <div className="space-y-2">
                <Label htmlFor="special_requests">{t('reservations.form.specialRequests')}</Label>
                <Textarea
                  id="special_requests"
                  placeholder="Any dietary restrictions, special occasions, or other requests..."
                  {...register('special_requests')}
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? t('reservations.form.submitting') : t('reservations.form.submit')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}