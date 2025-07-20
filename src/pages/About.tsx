import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

interface AboutSection {
  id: string;
  section_key: string;
  title: string;
  subtitle: string | null;
  content: string | null;
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
  display_order: number;
}

const About = () => {
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

  if (sectionsLoading || imagesLoading) {
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
              Failed to load about content. Please try again later.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const getSectionImages = (sectionId: string) => {
    return images?.filter(img => img.section_id === sectionId) || [];
  };

  const renderHeroSection = (section: AboutSection) => (
    <section key={section.id} className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background/50 to-secondary/20" />
      <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black mb-6 text-gradient">
          {section.title}
        </h1>
        {section.subtitle && (
          <h2 className="text-xl sm:text-2xl md:text-3xl font-light mb-8 text-muted-foreground">
            {section.subtitle}
          </h2>
        )}
        {section.content && (
          <p className="text-lg sm:text-xl leading-relaxed text-foreground/90 max-w-3xl mx-auto">
            {section.content}
          </p>
        )}
      </div>
    </section>
  );

  const renderTextSection = (section: AboutSection) => {
    const sectionImages = getSectionImages(section.id);
    
    return (
      <section key={section.id} className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-gradient">
                {section.title}
              </h2>
              {section.subtitle && (
                <p className="text-xl text-muted-foreground mb-6">
                  {section.subtitle}
                </p>
              )}
            </div>
            
            <div className={`grid gap-8 ${sectionImages.length > 0 ? 'lg:grid-cols-2' : 'grid-cols-1'} items-center`}>
              {section.content && (
                <div className="space-y-6">
                  <div className="prose prose-lg max-w-none text-foreground">
                    {section.content.split('\n').map((paragraph, idx) => (
                      <p key={idx} className="text-lg leading-relaxed mb-4">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              
              {sectionImages.length > 0 && (
                <div className="space-y-4">
                  {sectionImages.length === 1 ? (
                    <Card className="overflow-hidden">
                      <img
                        src={sectionImages[0].image_url}
                        alt={sectionImages[0].alt_text || sectionImages[0].title || section.title}
                        className="w-full h-80 object-cover"
                      />
                      {sectionImages[0].caption && (
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">
                            {sectionImages[0].caption}
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
                            alt={image.alt_text || image.title || section.title}
                            className="w-full h-40 object-cover"
                          />
                          {image.caption && (
                            <CardContent className="p-3">
                              <p className="text-xs text-muted-foreground">
                                {image.caption}
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
          </div>
        </div>
      </section>
    );
  };

  const renderGallerySection = (section: AboutSection) => {
    const sectionImages = getSectionImages(section.id);
    
    return (
      <section key={section.id} className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-gradient">
                {section.title}
              </h2>
              {section.subtitle && (
                <p className="text-xl text-muted-foreground mb-6">
                  {section.subtitle}
                </p>
              )}
              {section.content && (
                <p className="text-lg leading-relaxed text-foreground/90 max-w-3xl mx-auto mb-8">
                  {section.content}
                </p>
              )}
            </div>
            
            {sectionImages.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sectionImages.map((image) => (
                  <Card key={image.id} className="overflow-hidden group cursor-pointer transition-transform hover:scale-105">
                    <img
                      src={image.image_url}
                      alt={image.alt_text || image.title || section.title}
                      className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {(image.title || image.caption) && (
                      <CardContent className="p-4">
                        {image.title && (
                          <h3 className="font-semibold mb-2">{image.title}</h3>
                        )}
                        {image.caption && (
                          <p className="text-sm text-muted-foreground">
                            {image.caption}
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

  return (
    <div className="min-h-screen bg-background">
      {sections?.map((section) => {
        switch (section.section_type) {
          case 'hero':
            return renderHeroSection(section);
          case 'gallery':
            return renderGallerySection(section);
          default:
            return renderTextSection(section);
        }
      })}
    </div>
  );
};

export default About;