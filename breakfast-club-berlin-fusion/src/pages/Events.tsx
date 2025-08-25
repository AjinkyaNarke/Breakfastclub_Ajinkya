
import { useEffect, useState } from "react";
import { Calendar, Users, Clock, ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, isTomorrow, isThisWeek } from "date-fns";
import { useTranslation } from "react-i18next";
import Navigation from "@/components/Navigation";
import { Footer } from "@/components/Footer";

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  max_participants: number;
  current_participants: number;
  image_url: string;
  is_active: boolean;
}

const formatEventDate = (eventDate: string) => {
  const date = new Date(eventDate);
  
  if (isToday(date)) {
    return "Today";
  } else if (isTomorrow(date)) {
    return "Tomorrow";
  } else if (isThisWeek(date)) {
    return format(date, "EEEE");
  } else {
    return format(date, "MMM d, yyyy");
  }
};

const formatEventTime = (eventDate: string) => {
  const date = new Date(eventDate);
  return format(date, "h:mm a");
};

const generateEventTags = (title: string, description: string) => {
  const tags = [];
  const content = (title + " " + description).toLowerCase();
  
  if (content.includes("music") || content.includes("acoustic")) tags.push("Music");
  if (content.includes("workshop") || content.includes("making")) tags.push("Workshop");
  if (content.includes("community") || content.includes("connect")) tags.push("Community");
  if (content.includes("cultural") || content.includes("culture")) tags.push("Cultural Exchange");
  if (content.includes("cooking") || content.includes("dim sum")) tags.push("Cooking");
  if (content.includes("student")) tags.push("Students");
  if (content.includes("traditional")) tags.push("Traditional");
  if (content.includes("breakfast") || content.includes("brunch")) tags.push("Weekend Special");
  
  return tags.length > 0 ? tags : ["Event"];
};

export default function Events() {
  const { t } = useTranslation(['common', 'homepage']);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background restaurant-scrollbar">
        <Navigation />
        <div className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="text-lg text-muted-foreground">Loading events...</div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background restaurant-scrollbar">
      <Navigation />
      
      <main className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center px-6 py-3 bg-secondary/20 rounded-full text-sm font-medium text-secondary-foreground border border-secondary/30 mb-6 restaurant-glow">
              <Calendar className="w-4 h-4 mr-2" />
              {t('navigation.events')}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {t('sections.events.culturalGatherings', { ns: 'homepage' })}{" "}
              <span className="text-brand">{t('sections.events.community', { ns: 'homepage' })}</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {t('sections.events.description', { ns: 'homepage' })}
            </p>
          </div>

          {/* Events Grid */}
          {events.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No upcoming events</h3>
                <p className="text-muted-foreground">Check back soon for exciting community events!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((event, index) => {
                const eventTags = generateEventTags(event.title, event.description);
                const isFeatured = index === 0;
                
                return (
                  <Card 
                    key={event.id} 
                    className={`restaurant-lift transition-all duration-300 warm-lighting h-full ${
                      isFeatured ? 'border-primary bg-primary/5 md:col-span-2 lg:col-span-1' : ''
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {event.image_url && (
                      <div className="relative h-48 rounded-t-lg overflow-hidden">
                        <img 
                          src={event.image_url} 
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                        {isFeatured && (
                          <Badge className="absolute top-4 left-4 bg-primary/90 text-primary-foreground">
                            Featured Event
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <CardHeader className="pb-3">
                      <div className="space-y-2">
                        <CardTitle className="text-lg text-primary">{event.title}</CardTitle>
                        
                        <div className="flex items-center text-sm text-muted-foreground space-x-4">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatEventDate(event.event_date)}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {formatEventTime(event.event_date)}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Users className="w-4 h-4 mr-1" />
                            {event.current_participants}/{event.max_participants} participants
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4 mr-1" />
                            Wedding, Berlin
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0 flex flex-col flex-1">
                      <p className="text-muted-foreground mb-4 flex-1">{event.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                          {eventTags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs border-secondary/30">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        
                        <Button variant="default" size="sm" className="group">
                          {t('buttons.joinEvent')}
                          <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
