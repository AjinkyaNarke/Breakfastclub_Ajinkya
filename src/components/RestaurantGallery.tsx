
import { useState, useEffect } from "react";
import { Camera, Heart, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

interface GalleryImage {
  id: string;
  title: string;
  description: string;
  image_url: string;
  category: string;
  is_featured: boolean;
  alt_text: string;
  display_order: number;
}

export default function RestaurantGallery() {
  const { t } = useTranslation('homepage');
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGalleryImages = async () => {
      try {
        const { data, error } = await supabase
          .from('gallery_images')
          .select('*')
          .order('display_order', { ascending: true });

        if (error) {
          console.error('Error fetching gallery images:', error);
          return;
        }

        setGalleryImages(data || []);
      } catch (error) {
        console.error('Exception fetching gallery images:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGalleryImages();
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">{t('sections.gallery.loading')}</div>
        </div>
      </section>
    );
  }

  // Fallback to show a message if no images are available
  if (galleryImages.length === 0) {
    return (
      <section className="py-20 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              {t('sections.gallery.experienceOur')}{" "}
              <span className="text-brand">{t('sections.gallery.warmAtmosphere')}</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              {t('sections.gallery.comingSoon')}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center px-6 py-3 bg-primary/10 rounded-full text-sm font-medium text-primary border border-primary/20 mb-6">
            <Camera className="w-4 h-4 mr-2" />
            {t('sections.gallery.restaurantGallery')}
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            {t('sections.gallery.experienceOur')}{" "}
            <span className="text-brand">{t('sections.gallery.warmAtmosphere')}</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t('sections.gallery.description')}
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {galleryImages.map((image, index) => (
            <Card 
              key={image.id}
              className={`group overflow-hidden hover-lift transition-all duration-500 ${
                image.is_featured ? 'md:col-span-2 lg:col-span-1' : ''
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="relative">
                <div className="aspect-[4/3] overflow-hidden">
                  <img 
                    src={image.image_url}
                    alt={image.alt_text || image.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  
                  {/* Warm Red Overlay Effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>

                {/* Featured Badge */}
                {image.is_featured && (
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-primary/90 text-primary-foreground border-0">
                      <Star className="w-3 h-3 mr-1" />
                      {t('sections.gallery.featured')}
                    </Badge>
                  </div>
                )}

                {/* Category Badge */}
                <div className="absolute top-4 right-4">
                  <Badge variant="outline" className="bg-background/90 backdrop-blur-sm">
                    {image.category.charAt(0).toUpperCase() + image.category.slice(1)}
                  </Badge>
                </div>

                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white">
                  <h3 className="text-lg font-bold mb-2 group-hover:text-secondary transition-colors">
                    {image.title}
                  </h3>
                  <p className="text-sm opacity-90 leading-relaxed">
                    {image.description}
                  </p>
                  
                  <div className="flex items-center mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Heart className="w-4 h-4 mr-2 text-primary" />
                    <span className="text-xs">{t('sections.gallery.communityFavorite')}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Restaurant Stats */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="space-y-2">
            <div className="text-4xl font-bold text-primary">250+</div>
            <div className="text-muted-foreground">{t('sections.gallery.stats.happyGuests')}</div>
          </div>
          <div className="space-y-2">
            <div className="text-4xl font-bold text-primary">3</div>
            <div className="text-muted-foreground">{t('sections.gallery.stats.yearsServing')}</div>
          </div>
          <div className="space-y-2">
            <div className="text-4xl font-bold text-primary">15+</div>
            <div className="text-muted-foreground">{t('sections.gallery.stats.signatureDishes')}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
