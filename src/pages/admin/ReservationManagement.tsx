import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Calendar, Clock, Users, Mail, Phone, MessageSquare, Check, X, Edit3, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Reservation {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  special_requests?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  admin_notes?: string;
  language_preference: string;
  created_at: string;
  updated_at: string;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800',
  no_show: 'bg-gray-100 text-gray-800',
};

const statusLabels = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed',
  no_show: 'No Show',
};

export default function ReservationManagement() {
  const { t } = useTranslation('common');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<{ [id: string]: string | null }>({}); // { [reservationId]: 'confirm' | 'cancel' | 'complete' | 'no_show' | 'save_notes' | null }

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('reservation_date', { ascending: true })
        .order('reservation_time', { ascending: true });

      if (error) throw error;
      setReservations((data as Reservation[]) || []);
    } catch (error: any) {
      console.error('Error fetching reservations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reservations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateReservationStatus = async (reservationId: string, status: string, notes?: string, actionKey?: string) => {
    setActionLoading(prev => ({ ...prev, [reservationId]: actionKey || status }));
    try {
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      };
      
      if (status === 'confirmed') {
        updateData.confirmed_at = new Date().toISOString();
      } else if (status === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
      }
      
      if (notes !== undefined) {
        updateData.admin_notes = notes;
      }

      const { error } = await supabase
        .from('reservations')
        .update(updateData)
        .eq('id', reservationId);

      if (error) throw error;

      await fetchReservations();
      toast({
        title: 'Success',
        description: `Reservation ${status}`,
      });

      setIsDialogOpen(false);
      setSelectedReservation(null);
    } catch (error: any) {
      console.error('Error updating reservation:', error);
      toast({
        title: 'Error',
        description: 'Failed to update reservation',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [reservationId]: null }));
    }
  };

  const handleQuickAction = (reservation: Reservation, action: string) => {
    updateReservationStatus(reservation.id, action, undefined, action);
  };

  const openDetailDialog = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setAdminNotes(reservation.admin_notes || '');
    setIsDialogOpen(true);
  };

  const filteredReservations = reservations.filter(reservation => {
    const matchesStatus = filterStatus === 'all' || reservation.status === filterStatus;
    const matchesDate = !filterDate || reservation.reservation_date === filterDate;
    return matchesStatus && matchesDate;
  });

  const upcomingReservations = reservations.filter(r => 
    new Date(`${r.reservation_date}T${r.reservation_time}`) > new Date() && 
    r.status === 'confirmed'
  ).length;

  const pendingReservations = reservations.filter(r => r.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-lg">Loading reservations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold">{pendingReservations}</CardTitle>
            <CardDescription>Pending Confirmations</CardDescription>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold">{upcomingReservations}</CardTitle>
            <CardDescription>Upcoming Reservations</CardDescription>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold">{reservations.length}</CardTitle>
            <CardDescription>Total Reservations</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Reservation Management</CardTitle>
          <CardDescription>Manage and track all restaurant reservations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="status-filter">Filter by Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <Label htmlFor="date-filter">Filter by Date</Label>
              <Input
                id="date-filter"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
          </div>

          {/* Reservations Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Party Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservations.map((reservation) => (
                  <TableRow key={reservation.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <div className="font-medium">{reservation.customer_name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {reservation.customer_email}
                        </div>
                        {reservation.customer_phone && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {reservation.customer_phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(reservation.reservation_date), 'MMM dd, yyyy')}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {reservation.reservation_time}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {reservation.party_size}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={statusColors[reservation.status]}>
                        {statusLabels[reservation.status]}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {reservation.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              aria-label="Confirm Reservation"
                              onClick={() => handleQuickAction(reservation, 'confirmed')}
                              className="text-green-600 border-green-200 hover:bg-green-50"
                              disabled={actionLoading[reservation.id] === 'confirmed'}
                            >
                              {actionLoading[reservation.id] === 'confirmed' ? (
                                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-1" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              aria-label="Cancel Reservation"
                              onClick={() => handleQuickAction(reservation, 'cancelled')}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              disabled={actionLoading[reservation.id] === 'cancelled'}
                            >
                              {actionLoading[reservation.id] === 'cancelled' ? (
                                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-1" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </Button>
                          </>
                        )}
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" aria-label="More Actions">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDetailDialog(reservation)}>
                              <Edit3 className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {reservation.status === 'confirmed' && (
                              <DropdownMenuItem onClick={() => handleQuickAction(reservation, 'completed')} aria-label="Mark Completed">
                                {actionLoading[reservation.id] === 'completed' ? (
                                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-1" />
                                ) : (
                                  <Check className="mr-2 h-4 w-4" />
                                )}
                                Mark Completed
                              </DropdownMenuItem>
                            )}
                            {reservation.status === 'confirmed' && (
                              <DropdownMenuItem onClick={() => handleQuickAction(reservation, 'no_show')} aria-label="Mark No Show">
                                {actionLoading[reservation.id] === 'no_show' ? (
                                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-1" />
                                ) : (
                                  <X className="mr-2 h-4 w-4" />
                                )}
                                Mark No Show
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredReservations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No reservations found matching the current filters.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      {selectedReservation && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Reservation Details</DialogTitle>
              <DialogDescription>
                Manage reservation for {selectedReservation.customer_name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Customer Name</Label>
                  <p className="text-sm">{selectedReservation.customer_name}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm">{selectedReservation.customer_email}</p>
                </div>
                
                {selectedReservation.customer_phone && (
                  <div>
                    <Label className="text-sm font-medium">Phone</Label>
                    <p className="text-sm">{selectedReservation.customer_phone}</p>
                  </div>
                )}
                
                <div>
                  <Label className="text-sm font-medium">Language</Label>
                  <p className="text-sm">{selectedReservation.language_preference.toUpperCase()}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Date</Label>
                  <p className="text-sm">{format(new Date(selectedReservation.reservation_date), 'PPP')}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Time</Label>
                  <p className="text-sm">{selectedReservation.reservation_time}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Party Size</Label>
                  <p className="text-sm">{selectedReservation.party_size} guests</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Current Status</Label>
                  <Badge className={statusColors[selectedReservation.status]}>
                    {statusLabels[selectedReservation.status]}
                  </Badge>
                </div>
              </div>
            </div>
            
            {selectedReservation.special_requests && (
              <div>
                <Label className="text-sm font-medium">Special Requests</Label>
                <p className="text-sm bg-muted p-3 rounded-md">{selectedReservation.special_requests}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="admin-notes">Admin Notes</Label>
              <Textarea
                id="admin-notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add internal notes about this reservation..."
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Update Status</Label>
              <div className="flex gap-2">
                <Button
                  onClick={() => updateReservationStatus(selectedReservation.id, 'confirmed', adminNotes, 'confirmed')}
                  disabled={selectedReservation.status === 'confirmed' || actionLoading[selectedReservation.id] === 'confirmed'}
                  variant={selectedReservation.status === 'confirmed' ? 'secondary' : 'default'}
                  aria-label="Confirm Reservation"
                >
                  {actionLoading[selectedReservation.id] === 'confirmed' ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-1" />
                  ) : 'Confirm'}
                </Button>
                <Button
                  onClick={() => updateReservationStatus(selectedReservation.id, 'cancelled', adminNotes, 'cancelled')}
                  disabled={selectedReservation.status === 'cancelled' || actionLoading[selectedReservation.id] === 'cancelled'}
                  variant="destructive"
                  aria-label="Cancel Reservation"
                >
                  {actionLoading[selectedReservation.id] === 'cancelled' ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-1" />
                  ) : 'Cancel'}
                </Button>
                <Button
                  onClick={() => updateReservationStatus(selectedReservation.id, 'completed', adminNotes, 'completed')}
                  disabled={selectedReservation.status === 'completed' || actionLoading[selectedReservation.id] === 'completed'}
                  variant="secondary"
                  aria-label="Mark Completed"
                >
                  {actionLoading[selectedReservation.id] === 'completed' ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-1" />
                  ) : 'Mark Completed'}
                </Button>
                <Button
                  onClick={() => updateReservationStatus(selectedReservation.id, 'no_show', adminNotes, 'no_show')}
                  disabled={selectedReservation.status === 'no_show' || actionLoading[selectedReservation.id] === 'no_show'}
                  variant="outline"
                  aria-label="Mark No Show"
                >
                  {actionLoading[selectedReservation.id] === 'no_show' ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-1" />
                  ) : 'No Show'}
                </Button>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Close
              </Button>
              <Button
                onClick={() => updateReservationStatus(selectedReservation.id, selectedReservation.status, adminNotes, 'save_notes')}
                disabled={actionLoading[selectedReservation.id] === 'save_notes'}
                aria-label="Save Notes"
              >
                {actionLoading[selectedReservation.id] === 'save_notes' ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-1" />
                ) : 'Save Notes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}