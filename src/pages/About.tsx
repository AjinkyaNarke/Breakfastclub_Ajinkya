import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { useLocalization } from "@/hooks/useLocalization";

interface AboutSection {
  id: string;
  section_key: string;
  title: string;
  subtitle: string | null;
  content: string | null;
  title_en?: string | null;
  title_de?: string | null;
  subtitle_en?: string | null;
  subtitle_de?: string | null;
  content_en?: string | null;
  content_de?: string | null;
  section_type: string;
  display_order: number;
  is_published: boolean;
}

interface AboutImage {
  id: string;
  section_id: string;
  image_url: string;
  title: string | null;
  caption: string | null;
  alt_text: string | null;
  title_en?: string | null;
  title_de?: string | null;
  caption_en?: string | null;
  caption_de?: string | null;
  alt_text_en?: string | null;
  alt_text_de?: string | null;
  display_order: number;
}

interface AboutVideo {
  id: string;
  section_id: string;
  video_url: string;
  title: string | null;
  caption: string | null;
  alt_text: string | null;
  title_en?: string | null;
  title_de?: string | null;
  caption_en?: string | null;
  caption_de?: string | null;
  alt_text_en?: string | null;
  alt_text_de?: string | null;
  display_order: number | null;
  thumbnail_url: string | null;
  video_type: string;
  external_video_id: string | null;
  duration: number | null;
  file_size: number | null;
}

const About = () => {
  const { t } = useTranslation('about');
  const { getLocalizedText, currentLanguage } = useLocalization();
  const { data: sections, isLoading: sectionsLoading, error: sectionsError } = useQuery({
    queryKey: ["about-sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("about_sections")
        .select("*")
        .eq("is_published", true)
        .order("display_order");
      
      if (error) throw error;
      return data as AboutSection[];
    },
  });

  const { data: images, isLoading: imagesLoading } = useQuery({
    queryKey: ["about-images"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("about_images")
        .select("*")
        .order("display_order");
      
      if (error) throw error;
      return data as AboutImage[];
    },
  });

  const { data: videos, isLoading: videosLoading } = useQuery({
    queryKey: ["about-videos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("about_videos")
        .select("*")
        .order("display_order");
      
      if (error) throw error;
      return data as AboutVideo[];
    },
  });

  if (sectionsLoading || imagesLoading || videosLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16 space-y-8">
          <Skeleton className="h-20 w-3/4 mx-auto" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-60 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (sectionsError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <Alert variant="destructive">
            <AlertDescription>
              {t('error.loadFailed', 'Failed to load about content. Please try again later.')}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const getSectionImages = (sectionId: string) => {
    return images?.filter(img => img.section_id === sectionId) || [];
  };

  const getSectionVideos = (sectionId: string) => {
    return videos?.filter(video => video.section_id === sectionId) || [];
  };

  // Helper functions for localized content
  const getLocalizedSectionText = (section: AboutSection, field: 'title' | 'subtitle' | 'content'): string => {
    const currentLang = currentLanguage;
    const deField = `${field}_de` as keyof AboutSection;
    const enField = `${field}_en` as keyof AboutSection;
    
    if (currentLang === 'de' && section[deField]) return section[deField] as string;
    if (currentLang === 'en' && section[enField]) return section[enField] as string;
    return section[field] || section[deField] || section[enField] || '';
  };

  const getLocalizedImageText = (image: AboutImage, field: 'title' | 'caption' | 'alt_text'): string => {
    const currentLang = currentLanguage;
    const deField = `${field}_de` as keyof AboutImage;
    const enField = `${field}_en` as keyof AboutImage;
    
    if (currentLang === 'de' && image[deField]) return image[deField] as string;
    if (currentLang === 'en' && image[enField]) return image[enField] as string;
    return image[field] || image[deField] || image[enField] || '';
  };

  const getLocalizedVideoText = (video: AboutVideo, field: 'title' | 'caption' | 'alt_text'): string => {
    const currentLang = currentLanguage;
    const deField = `${field}_de` as keyof AboutVideo;
    const enField = `${field}_en` as keyof AboutVideo;
    
    if (currentLang === 'de' && video[deField]) return video[deField] as string;
    if (currentLang === 'en' && video[enField]) return video[enField] as string;
    return video[field] || video[deField] || video[enField] || '';
  };

  const renderHeroSection = (section: AboutSection) => {
    const localizedTitle = getLocalizedSectionText(section, 'title');
    const localizedSubtitle = getLocalizedSectionText(section, 'subtitle');
    const localizedContent = getLocalizedSectionText(section, 'content');

    return (
      <section key={section.id} className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background/50 to-secondary/20" />
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black mb-6 text-gradient">
            {localizedTitle}
          </h1>
          {localizedSubtitle && (
            <h2 className="text-xl sm:text-2xl md:text-3xl font-light mb-8 text-muted-foreground">
              {localizedSubtitle}
            </h2>
          )}
          {localizedContent && (
            <p className="text-lg sm:text-xl leading-relaxed text-foreground/90 max-w-3xl mx-auto">
              {localizedContent}
            </p>
          )}
        </div>
      </section>
    );
  };

  const renderTextSection = (section: AboutSection) => {
    const sectionImages = getSectionImages(section.id);
    const sectionVideos = getSectionVideos(section.id);
    const hasMedia = sectionImages.length > 0 || sectionVideos.length > 0;
    
    const localizedTitle = getLocalizedSectionText(section, 'title');
    const localizedSubtitle = getLocalizedSectionText(section, 'subtitle');
    const localizedContent = getLocalizedSectionText(section, 'content');
    
    return (
      <section key={section.id} className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-gradient">
                {localizedTitle}
              </h2>
              {localizedSubtitle && (
                <p className="text-xl text-muted-foreground mb-6">
                  {localizedSubtitle}
                </p>
              )}
            </div>
            
            <div className={`grid gap-8 ${hasMedia ? 'lg:grid-cols-2' : 'grid-cols-1'} items-center`}>
              {localizedContent && (
                <div className="space-y-6">
                  <div className="prose prose-lg max-w-none text-foreground">
                    {localizedContent.split('\n').map((paragraph, idx) => (
                      <p key={idx} className="text-lg leading-relaxed mb-4">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              
              {hasMedia && (
                <div className="space-y-6">
                  {/* Videos */}
                  {sectionVideos.length > 0 && (
                    <div className="space-y-4">
                      {sectionVideos.map((video) => (
                        <Card key={video.id} className="overflow-hidden">
                          {video.video_type === 'uploaded' ? (
                            <video
                              src={video.video_url}
                              controls
                              className="w-full h-64 object-cover"
                              poster={video.thumbnail_url || undefined}
                            />
                          ) : (
                            <iframe
                              src={video.video_url}
                              className="w-full h-64"
                              title={video.title || 'Video'}
                              allowFullScreen
                            />
                          )}
                          {(getLocalizedVideoText(video, 'title') || getLocalizedVideoText(video, 'caption')) && (
                            <CardContent className="p-4">
                              {getLocalizedVideoText(video, 'title') && (
                                <h3 className="font-semibold mb-2">{getLocalizedVideoText(video, 'title')}</h3>
                              )}
                              {getLocalizedVideoText(video, 'caption') && (
                                <p className="text-sm text-muted-foreground">
                                  {getLocalizedVideoText(video, 'caption')}
                                </p>
                              )}
                            </CardContent>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                  
                  {/* Images */}
                  {sectionImages.length > 0 && (
                    <div className="space-y-4">
                      {sectionImages.length === 1 ? (
                        <Card className="overflow-hidden">
                          <img
                            src={sectionImages[0].image_url}
                            alt={getLocalizedImageText(sectionImages[0], 'alt_text') || getLocalizedImageText(sectionImages[0], 'title') || localizedTitle}
                            className="w-full h-80 object-cover"
                          />
                          {getLocalizedImageText(sectionImages[0], 'caption') && (
                            <CardContent className="p-4">
                              <p className="text-sm text-muted-foreground">
                                {getLocalizedImageText(sectionImages[0], 'caption')}
                              </p>
                            </CardContent>
                          )}
                        </Card>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          {sectionImages.map((image) => (
                            <Card key={image.id} className="overflow-hidden">
                              <img
                                src={image.image_url}
                                alt={getLocalizedImageText(image, 'alt_text') || getLocalizedImageText(image, 'title') || localizedTitle}
                                className="w-full h-40 object-cover"
                              />
                              {getLocalizedImageText(image, 'caption') && (
                                <CardContent className="p-3">
                                  <p className="text-xs text-muted-foreground">
                                    {getLocalizedImageText(image, 'caption')}
                                  </p>
                                </CardContent>
                              )}
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  };

  const renderGallerySection = (section: AboutSection) => {
    const sectionImages = getSectionImages(section.id);
    const sectionVideos = getSectionVideos(section.id);
    
    const localizedTitle = getLocalizedSectionText(section, 'title');
    const localizedSubtitle = getLocalizedSectionText(section, 'subtitle');
    const localizedContent = getLocalizedSectionText(section, 'content');
    
    return (
      <section key={section.id} className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-gradient">
                {localizedTitle}
              </h2>
              {localizedSubtitle && (
                <p className="text-xl text-muted-foreground mb-6">
                  {localizedSubtitle}
                </p>
              )}
              {localizedContent && (
                <p className="text-lg leading-relaxed text-foreground/90 max-w-3xl mx-auto mb-8">
                  {localizedContent}
                </p>
              )}
            </div>
            
            {/* Videos in Gallery */}
            {sectionVideos.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {sectionVideos.map((video) => (
                  <Card key={video.id} className="overflow-hidden group cursor-pointer transition-transform hover:scale-105">
                    {video.video_type === 'uploaded' ? (
                      <video
                        src={video.video_url}
                        controls
                        className="w-full h-64 object-cover"
                        poster={video.thumbnail_url || undefined}
                      />
                    ) : (
                      <iframe
                        src={video.video_url}
                        className="w-full h-64"
                        title={video.title || 'Video'}
                        allowFullScreen
                      />
                    )}
                    {(getLocalizedVideoText(video, 'title') || getLocalizedVideoText(video, 'caption')) && (
                      <CardContent className="p-4">
                        {getLocalizedVideoText(video, 'title') && (
                          <h3 className="font-semibold mb-2">{getLocalizedVideoText(video, 'title')}</h3>
                        )}
                        {getLocalizedVideoText(video, 'caption') && (
                          <p className="text-sm text-muted-foreground">
                            {getLocalizedVideoText(video, 'caption')}
                          </p>
                        )}
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
            
            {/* Images in Gallery */}
            {sectionImages.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sectionImages.map((image) => (
                  <Card key={image.id} className="overflow-hidden group cursor-pointer transition-transform hover:scale-105">
                    <img
                      src={image.image_url}
                      alt={getLocalizedImageText(image, 'alt_text') || getLocalizedImageText(image, 'title') || localizedTitle}
                      className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {(getLocalizedImageText(image, 'title') || getLocalizedImageText(image, 'caption')) && (
                      <CardContent className="p-4">
                        {getLocalizedImageText(image, 'title') && (
                          <h3 className="font-semibold mb-2">{getLocalizedImageText(image, 'title')}</h3>
                        )}
                        {getLocalizedImageText(image, 'caption') && (
                          <p className="text-sm text-muted-foreground">
                            {getLocalizedImageText(image, 'caption')}
                          </p>
                        )}
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    );
  };

  // Always show translated content first, then database content if available
  return (
    <div className="min-h-screen bg-background">




      {/* Database Content - Show if Available */}
      {sections && sections.length > 0 && (
        <>
          {sections.map((section) => {
            switch (section.section_type) {
              case 'gallery':
                return renderGallerySection(section);
              default:
                return renderTextSection(section);
            }
          })}
        </>
      )}
    </div>
  );


};

export default About;