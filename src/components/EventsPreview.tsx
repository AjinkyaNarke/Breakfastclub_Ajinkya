import { Calendar, Users, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import communityImage from "@/assets/community-gathering.jpg";

const upcomingEvents = [
  {
    id: 1,
    title: "Acoustic Brunch & Asian Vibes",
    date: "This Saturday",
    time: "10:00 AM - 2:00 PM",
    description: "Live acoustic music with traditional Asian breakfast and cultural exchange",
    attendees: 24,
    maxAttendees: 30,
    tags: ["Music", "Cultural Exchange", "Weekend Special"],
    featured: true
  },
  {
    id: 2,
    title: "Dim Sum Making Workshop",
    date: "Next Sunday",
    time: "11:00 AM - 1:00 PM",
    description: "Learn to make traditional dim sum with our chef from Hong Kong",
    attendees: 18,
    maxAttendees: 20,
    tags: ["Workshop", "Cooking", "Traditional"],
    featured: false
  },
  {
    id: 3,
    title: "Community Connect",
    date: "July 27",
    time: "9:30 AM - 12:00 PM",
    description: "Monthly gathering for international students and Berlin locals",
    attendees: 32,
    maxAttendees: 40,
    tags: ["Networking", "Students", "Community"],
    featured: false
  }
];

export default function EventsPreview() {
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
            {upcomingEvents.map((event, index) => (
              <Card 
                key={event.id} 
                className={`restaurant-lift transition-all duration-300 warm-lighting ${
                  event.featured ? 'border-primary bg-primary/5' : ''
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <CardTitle className="text-lg text-primary">{event.title}</CardTitle>
                        {event.featured && (
                          <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                            Featured Event
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center text-sm text-muted-foreground space-x-4">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {event.date}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {event.time}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="w-4 h-4 mr-1" />
                        {event.attendees}/{event.maxAttendees}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <p className="text-muted-foreground mb-4">{event.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map((tag) => (
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
            ))}
            
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
