import { useEffect, useState } from "react";
import { Calendar, Users, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, isTomorrow, isThisWeek } from "date-fns";
import communityImage from "@/assets/community-gathering.jpg";

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
    return format(date, "EEEE"); // e.g., "Saturday"
  } else {
    return format(date, "MMM d"); // e.g., "Jan 25"
  }
};

const formatEventTime = (eventDate: string) => {
  const date = new Date(eventDate);
  return format(date, "h:mm a"); // e.g., "10:00 AM"
};

// Generate simple tags based on event title and description
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

export default function EventsPreview() {
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
        .order('event_date', { ascending: true })
        .limit(3);

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
      <section className="py-20 bg-background restaurant-texture">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-lg text-muted-foreground">Loading events...</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-background restaurant-texture">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center px-6 py-3 bg-secondary/20 rounded-full text-sm font-medium text-secondary-foreground border border-secondary/30 mb-6 restaurant-glow">
            <Calendar className="w-4 h-4 mr-2" />
            Community Events
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Cultural Gatherings &{" "}
            <span className="text-brand">Community</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Join our weekend events that blend traditional Asian breakfast culture 
            with Berlin's vibrant community spirit. Every gathering is a chance to 
            connect, learn, and taste something amazing together.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Events List */}
          <div className="space-y-6 animate-slide-in">
            {events.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No upcoming events</h3>
                  <p className="text-muted-foreground">Check back soon for exciting community events!</p>
                </CardContent>
              </Card>
            ) : (
              events.map((event, index) => {
                const eventTags = generateEventTags(event.title, event.description);
                const isFeatured = index === 0; // Make first event featured
                
                return (
                  <Card 
                    key={event.id} 
                    className={`restaurant-lift transition-all duration-300 warm-lighting ${
                      isFeatured ? 'border-primary bg-primary/5' : ''
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <CardTitle className="text-lg text-primary">{event.title}</CardTitle>
                            {isFeatured && (
                              <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                                Featured Event
                              </Badge>
                            )}
                          </div>
                          
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
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Users className="w-4 h-4 mr-1" />
                            {event.current_participants}/{event.max_participants}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <p className="text-muted-foreground mb-4">{event.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                          {eventTags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs border-secondary/30">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        
                        <Button variant="default" size="sm" className="group">
                          Join Event
                          <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
            
            <div className="text-center pt-6">
              <Button variant="default" size="lg" className="group">
                View All Events
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>

          {/* Featured Image */}
          <div className="relative animate-fade-in">
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              <img 
                src={communityImage}
                alt="Community gathering at Asian fusion breakfast event"
                className="w-full h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
              
              {/* Overlay Content */}
              <div className="absolute bottom-6 left-6 right-6">
                <Card className="p-4 bg-white/95 backdrop-blur-sm shadow-lg warm-lighting">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg text-primary">Last Weekend's Success</h3>
                      <p className="text-sm text-muted-foreground">Korean Breakfast Cultural Exchange</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">45</div>
                      <div className="text-xs text-muted-foreground">Happy Guests</div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
            
            {/* Floating Stats */}
            <div className="absolute -top-4 -right-4">
              <Card className="p-3 bg-primary text-primary-foreground shadow-lg animate-gentle-bounce warm-lighting">
                <div className="text-center">
                  <div className="text-xl font-bold">250+</div>
                  <div className="text-xs opacity-90">Community Members</div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}