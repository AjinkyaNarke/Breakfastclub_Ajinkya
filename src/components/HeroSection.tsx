

import { Clock, MapPin, Users, Utensils } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import heroImage from "@/assets/hero-breakfast.jpg";

export default function HeroSection() {
  const { t } = useTranslation('homepage');
  const [heroVideo, setHeroVideo] = useState<any>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    const fetchHeroVideo = async () => {
      try {
        const { data, error } = await supabase
          .from('restaurant_videos')
          .select('*')
          .eq('featured_for_hero', true)
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching hero video:', error);
          return;
        }
        
        if (data) {
          console.log('Hero video found:', data);
          setHeroVideo(data);
        } else {
          console.log('No hero video found');
        }
      } catch (error) {
        console.error('Exception fetching hero video:', error);
      }
    };

    fetchHeroVideo();
  }, []);

  const handleVideoError = () => {
    console.error('Video failed to load:', heroVideo?.video_url);
    setVideoError(true);
  };

  const handleVideoLoad = () => {
    console.log('Video loaded successfully');
    setIsVideoLoaded(true);
    setVideoError(false);
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      {heroVideo && !videoError && (
        <video
          className="hero-video"
          autoPlay={heroVideo.autoplay}
          loop
          muted
          playsInline
          onLoadedData={handleVideoLoad}
          onError={handleVideoError}
          onCanPlay={() => console.log('Video can play')}
        >
          <source src={heroVideo.video_url} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}
      
      {/* Fallback Background Image */}
      {(!heroVideo || !isVideoLoaded || videoError) && (
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
          {/* Simplified Brand Title */}
          <div className="hero-brand-title">
            <div className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl mb-4 text-center">
              <div className="font-poppins font-light text-white mb-2">My</div>
              <div className="font-russo font-bold text-white neon-glow-red mb-2">fcking BREAKFAST</div>
              <div className="font-kalam text-white neon-glow-cyan">Club</div>
            </div>
          </div>

          {/* Neon Subtitle */}
          <p className="neon-subtitle text-xl md:text-2xl lg:text-3xl mb-12 font-light tracking-wide">
            {t('hero.subtitle')}
          </p>

          {/* Restaurant Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto mt-16">
            <Card className="p-6 bg-white/10 backdrop-blur-sm border border-white/20 restaurant-lift">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary/20 rounded-lg">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-base text-white">{t('hero.weekendHours')}</p>
                  <p className="text-sm text-white/70">{t('hero.hours')}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white/10 backdrop-blur-sm border border-white/20 restaurant-lift">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-accent-vibrant/20 rounded-lg">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-base text-white">{t('hero.location')}</p>
                  <p className="text-sm text-white/70">{t('hero.locationName')}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

    </section>
  );
}

