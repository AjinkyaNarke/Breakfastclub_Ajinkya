
import { Clock, MapPin, Users, Utensils } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-breakfast.jpg";

export default function HeroSection() {
  const [heroVideo, setHeroVideo] = useState<any>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  useEffect(() => {
    const fetchHeroVideo = async () => {
      const { data } = await supabase
        .from('restaurant_videos')
        .select('*')
        .eq('featured_for_hero', true)
        .maybeSingle();
      
      if (data) {
        setHeroVideo(data);
      }
    };

    fetchHeroVideo();
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      {heroVideo && (
        <video
          className="hero-video"
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setIsVideoLoaded(true)}
        >
          <source src={heroVideo.video_url} type="video/mp4" />
        </video>
      )}
      
      {/* Fallback Background Image */}
      {(!heroVideo || !isVideoLoaded) && (
        <div 
          className="hero-video"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}

      {/* Dark Overlay */}
      <div className="video-overlay absolute inset-0 z-10" />

      {/* Main Content */}
      <div className="relative z-20 text-center px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="space-y-8 animate-fade-in">
          {/* Restaurant Badge */}
          <div className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium text-white border border-white/20 restaurant-glow">
            <Utensils className="w-4 h-4 mr-2" />
            Asian Fusion Restaurant • Berlin Kreuzberg
          </div>

          {/* Neon Title */}
          <h1 className="neon-title text-6xl md:text-8xl lg:text-9xl leading-none mb-6">
            fckingbreakfastclub
          </h1>

          {/* Neon Subtitle */}
          <p className="neon-subtitle text-lg md:text-xl lg:text-2xl mb-12">
            Authentic Asian Breakfast in the Heart of Berlin
          </p>

          {/* Restaurant Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto mt-16">
            <Card className="p-4 bg-white/10 backdrop-blur-sm border border-white/20 restaurant-lift">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-white">Weekend Hours</p>
                  <p className="text-xs text-white/70">Fri-Sun 9AM-3PM</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-white/10 backdrop-blur-sm border border-white/20 restaurant-lift">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-secondary/20 rounded-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-white">Student Welcome</p>
                  <p className="text-xs text-white/70">25% off with ID</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-white/10 backdrop-blur-sm border border-white/20 restaurant-lift">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-accent-vibrant/20 rounded-lg">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-white">Location</p>
                  <p className="text-xs text-white/70">Kreuzberg, Berlin</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Status Overlays */}
      <div className="absolute top-6 right-6 z-30">
        <Card className="p-3 bg-white/95 backdrop-blur-sm shadow-lg animate-cherry-float warm-lighting">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Now Open</span>
          </div>
        </Card>
      </div>

      <div className="absolute bottom-6 left-6 z-30">
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
    </section>
  );
}
