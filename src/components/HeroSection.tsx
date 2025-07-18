import { ArrowRight, Clock, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import heroImage from "@/assets/hero-breakfast.jpg";

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center hero-gradient bamboo-pattern">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-4">
              <div className="inline-flex items-center px-4 py-2 bg-accent/30 rounded-full text-sm font-medium text-accent-foreground border border-accent/50">
                <span className="w-2 h-2 bg-accent-vibrant rounded-full mr-2 animate-gentle-bounce"></span>
                Weekend Asian Fusion Breakfast • Berlin
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Where{" "}
                <span className="text-brand">Asian Flavors</span>{" "}
                Meet Berlin Community
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
                Join us every Friday-Sunday for authentic Asian fusion breakfast, 
                cultural exchange, and community connection in the heart of Berlin.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="bamboo" size="xl" className="group">
                Explore Our Menu
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button variant="warm" size="xl">
                Join Community Events
              </Button>
            </div>

            {/* Quick Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
              <Card className="p-4 bg-card/50 backdrop-blur-sm border border-border/50 hover-lift">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Open Hours</p>
                    <p className="text-xs text-muted-foreground">Fri-Sun 9AM-3PM</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-card/50 backdrop-blur-sm border border-border/50 hover-lift">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-accent-vibrant/10 rounded-lg">
                    <Users className="h-5 w-5 text-accent-vibrant" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Student Discount</p>
                    <p className="text-xs text-muted-foreground">25% off with habait</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-card/50 backdrop-blur-sm border border-border/50 hover-lift">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-secondary/20 rounded-lg">
                    <MapPin className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Location</p>
                    <p className="text-xs text-muted-foreground">Kreuzberg, Berlin</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative animate-slide-in">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src={heroImage}
                alt="Asian fusion breakfast spread with traditional and modern dishes"
                className="w-full h-[600px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              
              {/* Floating Elements */}
              <div className="absolute top-6 right-6">
                <Card className="p-3 bg-white/90 backdrop-blur-sm shadow-lg animate-cherry-float">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-accent-vibrant rounded-full"></div>
                    <span className="text-sm font-medium">Live Community</span>
                  </div>
                </Card>
              </div>

              <div className="absolute bottom-6 left-6">
                <Card className="p-4 bg-white/90 backdrop-blur-sm shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 bg-primary rounded-full border-2 border-white"></div>
                      <div className="w-8 h-8 bg-accent-vibrant rounded-full border-2 border-white"></div>
                      <div className="w-8 h-8 bg-secondary rounded-full border-2 border-white"></div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">250+ Members</p>
                      <p className="text-xs text-muted-foreground">Active Community</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}