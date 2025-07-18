
import { ArrowRight, Clock, MapPin, Users, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import heroImage from "@/assets/hero-breakfast.jpg";

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center hero-gradient restaurant-texture">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-4">
              <div className="inline-flex items-center px-6 py-3 bg-primary/10 rounded-full text-sm font-medium text-primary border border-primary/20 restaurant-glow">
                <Utensils className="w-4 h-4 mr-2" />
                Asian Fusion Restaurant • Berlin Kreuzberg
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Authentic{" "}
                <span className="text-brand">Asian Breakfast</span>{" "}
                in the Heart of Berlin
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
                Experience the warmth of traditional Asian hospitality every weekend. 
                Our cozy restaurant serves authentic fusion breakfast that brings 
                communities together over incredible flavors.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="restaurant" size="xl" className="group">
                View Our Menu
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button variant="golden" size="xl">
                Reserve Your Table
              </Button>
            </div>

            {/* Restaurant Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
              <Card className="p-4 bg-card/70 backdrop-blur-sm border border-border/50 restaurant-lift warm-lighting">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Weekend Hours</p>
                    <p className="text-xs text-muted-foreground">Fri-Sun 9AM-3PM</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-card/70 backdrop-blur-sm border border-border/50 restaurant-lift warm-lighting">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-secondary/20 rounded-lg">
                    <Users className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Student Welcome</p>
                    <p className="text-xs text-muted-foreground">25% off with habait</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-card/70 backdrop-blur-sm border border-border/50 restaurant-lift warm-lighting">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-accent-vibrant/20 rounded-lg">
                    <MapPin className="h-5 w-5 text-accent-vibrant" />
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
                alt="Warm restaurant interior with Asian fusion breakfast"
                className="w-full h-[600px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
              
              {/* Restaurant Atmosphere Overlays */}
              <div className="absolute top-6 right-6">
                <Card className="p-3 bg-white/95 backdrop-blur-sm shadow-lg animate-cherry-float warm-lighting">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Now Open</span>
                  </div>
                </Card>
              </div>

              <div className="absolute bottom-6 left-6">
                <Card className="p-4 bg-white/95 backdrop-blur-sm shadow-lg warm-lighting">
                  <div className="flex items-center space-x-3">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 bg-primary rounded-full border-2 border-white"></div>
                      <div className="w-8 h-8 bg-secondary rounded-full border-2 border-white"></div>
                      <div className="w-8 h-8 bg-accent-vibrant rounded-full border-2 border-white"></div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">150+ This Weekend</p>
                      <p className="text-xs text-muted-foreground">Happy Diners</p>
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
