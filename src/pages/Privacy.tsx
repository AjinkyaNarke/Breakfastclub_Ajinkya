
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Navigation from "@/components/Navigation";
import { Footer } from "@/components/Footer";

const Privacy = () => {
  const { data: privacyContent, isLoading } = useQuery({
    queryKey: ['content-blocks', 'privacy_policy'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_blocks')
        .select('*')
        .eq('section_name', 'privacy_policy')
        .eq('is_active', true)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      return data;
    },
  });

  const { data: cookieInfo, isLoading: cookieLoading } = useQuery({
    queryKey: ['content-blocks', 'cookie_policy'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_blocks')
        .select('*')
        .eq('section_name', 'cookie_policy')
        .eq('is_active', true)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      return data;
    },
  });

  if (isLoading || cookieLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Datenschutzerklärung</h1>
          
          <div className="prose prose-lg max-w-none space-y-8">
            {privacyContent && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">{privacyContent.title}</h2>
                <div className="whitespace-pre-wrap">{privacyContent.content}</div>
              </div>
            )}
            
            {cookieInfo && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">{cookieInfo.title || "Cookie-Information"}</h2>
                <div className="whitespace-pre-wrap">{cookieInfo.content}</div>
              </div>
            )}
            
            {!privacyContent && !cookieInfo && (
              <div className="text-center text-muted-foreground py-8">
                <p>Die Datenschutzerklärung wird derzeit über das Admin-Panel konfiguriert.</p>
                <p className="text-sm mt-2">Bitte wenden Sie sich an den Administrator, um diese Seite zu vervollständigen.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
