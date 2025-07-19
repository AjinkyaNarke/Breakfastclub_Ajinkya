
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
        console.log('Hero video data:', data);
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
          autoPlay={heroVideo.autoplay}
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
          {/* Neon Title */}
          <h1 className="neon-title text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black leading-none mb-6 tracking-widest">
            FCKING BREAKFAST CLUB
          </h1>

          {/* Neon Subtitle */}
          <p className="neon-subtitle text-xl md:text-2xl lg:text-3xl mb-12 font-light tracking-wide">
            Authentic Asian Breakfast in the Heart of Berlin
          </p>

          {/* Restaurant Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto mt-16">
            <Card className="p-6 bg-white/10 backdrop-blur-sm border border-white/20 restaurant-lift">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary/20 rounded-lg">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-base text-white">Weekend Hours</p>
                  <p className="text-sm text-white/70">Fri-Sun 9AM-3PM</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white/10 backdrop-blur-sm border border-white/20 restaurant-lift">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-accent-vibrant/20 rounded-lg">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-base text-white">Location</p>
                  <p className="text-sm text-white/70">Wedding, Berlin</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

    </section>
  );
}
