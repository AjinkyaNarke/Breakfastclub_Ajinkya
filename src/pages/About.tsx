
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ContentBlock {
  id: string;
  section_name: string;
  title: string | null;
  content: string | null;
  image_url: string | null;
  is_active: boolean;
}

const About = () => {
  const { data: contentBlocks, isLoading, error } = useQuery({
    queryKey: ['content-blocks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_blocks')
        .select('*')
        .eq('is_active', true)
        .order('section_name');
      
      if (error) throw error;
      return data as ContentBlock[];
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <Skeleton className="h-12 w-64 mx-auto mb-8" />
          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-8">
                  <Skeleton className="h-8 w-48 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-destructive mb-4">Error Loading Content</h2>
            <p className="text-muted-foreground">Unable to load about us information.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const heroBlock = contentBlocks?.find(block => block.section_name === 'hero');
  const aboutBlock = contentBlocks?.find(block => block.section_name === 'about');
  const valuesBlock = contentBlocks?.find(block => block.section_name === 'values');

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      {heroBlock && (
        <section className="relative py-32 bg-gradient-to-br from-primary/10 via-background to-accent/10">
          <div className="container mx-auto px-4 text-center">
            {heroBlock.title && (
              <h1 className="text-4xl md:text-6xl font-bold text-brand mb-6">
                {heroBlock.title}
              </h1>
            )}
            {heroBlock.content && (
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                {heroBlock.content}
              </p>
            )}
            {heroBlock.image_url && (
              <div className="mt-12">
                <img
                  src={heroBlock.image_url}
                  alt={heroBlock.title || 'Hero image'}
                  className="max-w-2xl mx-auto rounded-lg shadow-2xl"
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* About Section */}
      {aboutBlock && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                {aboutBlock.title && (
                  <h2 className="text-3xl font-bold text-brand mb-6">
                    {aboutBlock.title}
                  </h2>
                )}
                {aboutBlock.content && (
                  <div className="prose prose-lg max-w-none">
                    <p className="text-muted-foreground leading-relaxed">
                      {aboutBlock.content}
                    </p>
                  </div>
                )}
              </div>
              {aboutBlock.image_url && (
                <div>
                  <img
                    src={aboutBlock.image_url}
                    alt={aboutBlock.title || 'About image'}
                    className="rounded-lg shadow-lg w-full h-auto"
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Values Section */}
      {valuesBlock && (
        <section className="py-16 bg-accent/5">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              {valuesBlock.title && (
                <h2 className="text-3xl font-bold text-brand mb-6">
                  {valuesBlock.title}
                </h2>
              )}
              {valuesBlock.content && (
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  {valuesBlock.content}
                </p>
              )}
            </div>
            {valuesBlock.image_url && (
              <div className="text-center">
                <img
                  src={valuesBlock.image_url}
                  alt={valuesBlock.title || 'Values image'}
                  className="max-w-4xl mx-auto rounded-lg shadow-lg"
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Additional Content Blocks */}
      {contentBlocks?.filter(block => 
        !['hero', 'about', 'values'].includes(block.section_name)
      ).map((block) => (
        <section key={block.id} className="py-16">
          <div className="container mx-auto px-4">
            <Card>
              <CardContent className="p-8">
                {block.title && (
                  <h3 className="text-2xl font-bold text-brand mb-4">
                    {block.title}
                  </h3>
                )}
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    {block.content && (
                      <p className="text-muted-foreground leading-relaxed">
                        {block.content}
                      </p>
                    )}
                  </div>
                  {block.image_url && (
                    <div>
                      <img
                        src={block.image_url}
                        alt={block.title || 'Content image'}
                        className="rounded-lg shadow-md w-full h-auto"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      ))}
    </div>
  );
};

export default About;
