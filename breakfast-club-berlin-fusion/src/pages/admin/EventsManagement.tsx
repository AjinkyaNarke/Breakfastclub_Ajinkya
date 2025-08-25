import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Eye, EyeOff, Search, Calendar, Users, Clock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { EventDialog } from '@/components/admin/EventDialog';
import { format } from 'date-fns';

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  max_participants: number;
  current_participants: number;
  image_url: string;
  is_active: boolean;
  created_at: string;
}

export const EventsManagement = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const { toast } = useToast();
  const [actionLoading, setActionLoading] = useState<{ [id: string]: string | null }>({}); // { [eventId]: 'toggleActive' | 'delete' | null }

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to fetch events. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    setActionLoading(prev => ({ ...prev, [id]: 'delete' }));
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setEvents(events.filter(event => event.id !== id));
      toast({
        title: "Success",
        description: "Event deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "Failed to delete event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  const handleToggleActive = async (event: Event) => {
    setActionLoading(prev => ({ ...prev, [event.id]: 'toggleActive' }));
    try {
      const { error } = await supabase
        .from('events')
        .update({ is_active: !event.is_active })
        .eq('id', event.id);
      if (error) throw error;
      setEvents(events.map(e => 
        e.id === event.id ? { ...e, is_active: !e.is_active } : e
      ));
      toast({
        title: "Success",
        description: `Event ${!event.is_active ? 'activated' : 'deactivated'} successfully.`,
      });
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: "Error",
        description: "Failed to update event status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [event.id]: null }));
    }
  };

  const handleEventSave = () => {
    fetchEvents();
    setDialogOpen(false);
    setEditingEvent(null);
  };

  const now = new Date();
  
  const activeEvents = events.filter(event => {
    const eventDate = new Date(event.event_date);
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && event.is_active && eventDate >= now;
  });

  const pastEvents = events.filter(event => {
    const eventDate = new Date(event.event_date);
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && eventDate < now;
  });

  const filteredEvents = activeTab === 'active' ? activeEvents : pastEvents;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Events Management</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading events...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Events Management</h1>
        <Button 
          onClick={() => {
            setEditingEvent(null);
            setDialogOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Event
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'active' | 'past')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Active Events ({activeEvents.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Past Events ({pastEvents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6">
          <div className="grid gap-6">
            {activeEvents.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No active events found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm ? "No active events match your search criteria." : "Get started by creating your first event."}
                    </p>
                    {!searchTerm && (
                      <Button onClick={() => setDialogOpen(true)} aria-label="Add Event">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Event
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              activeEvents.map((event) => (
                <Card key={event.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-xl">{event.title}</CardTitle>
                          <Badge variant="default">Active</Badge>
                        </div>
                        <CardDescription className="text-base">
                          {event.description}
                        </CardDescription>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(event)}
                          aria-label={event.is_active ? 'Deactivate Event' : 'Activate Event'}
                          disabled={actionLoading[event.id] === 'toggleActive'}
                        >
                          {actionLoading[event.id] === 'toggleActive' ? (
                            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-1" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingEvent(event);
                            setDialogOpen(true);
                          }}
                          aria-label="Edit Event"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteEvent(event.id)}
                          aria-label="Delete Event"
                          disabled={actionLoading[event.id] === 'delete'}
                        >
                          {actionLoading[event.id] === 'delete' ? (
                            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-1" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(event.event_date), 'PPP p')}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{event.current_participants}/{event.max_participants} participants</span>
                          <div className="flex-1 bg-secondary rounded-full h-2 ml-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ 
                                width: `${Math.min((event.current_participants / event.max_participants) * 100, 100)}%` 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {event.image_url && (
                        <div className="relative">
                          <img 
                            src={event.image_url}
                            alt={event.title}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="past" className="space-y-6">
          <div className="grid gap-6">
            {pastEvents.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No past events found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm ? "No past events match your search criteria." : "No past events yet."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              pastEvents.map((event) => (
                <Card key={event.id} className="opacity-60">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-xl">{event.title}</CardTitle>
                          <Badge variant="secondary">Past</Badge>
                        </div>
                        <CardDescription className="text-base">
                          {event.description}
                        </CardDescription>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingEvent(event);
                            setDialogOpen(true);
                          }}
                          aria-label="Edit Event"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteEvent(event.id)}
                          aria-label="Delete Event"
                          disabled={actionLoading[event.id] === 'delete'}
                        >
                          {actionLoading[event.id] === 'delete' ? (
                            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-1" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(event.event_date), 'PPP p')}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{event.current_participants}/{event.max_participants} participants</span>
                          <div className="flex-1 bg-secondary rounded-full h-2 ml-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ 
                                width: `${Math.min((event.current_participants / event.max_participants) * 100, 100)}%` 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {event.image_url && (
                        <div className="relative">
                          <img 
                            src={event.image_url}
                            alt={event.title}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>


      <EventDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingEvent(null);
        }}
        event={editingEvent}
        onSave={handleEventSave}
      />
    </div>
  );
};