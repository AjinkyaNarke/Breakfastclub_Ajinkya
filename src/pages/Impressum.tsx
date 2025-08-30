
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';


const Impressum = () => {
  const { data: impressumContent, isLoading } = useQuery({
    queryKey: ['content-blocks', 'impressum'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_blocks')
        .select('*')
        .eq('section_name', 'impressum')
        .eq('is_active', true)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      return data;
    },
  });

  const { data: businessInfo, isLoading: businessLoading } = useQuery({
    queryKey: ['content-blocks', 'business_info'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_blocks')
        .select('*')
        .eq('section_name', 'business_info')
        .eq('is_active', true)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      return data;
    },
  });

  const { data: contactInfo, isLoading: contactLoading } = useQuery({
    queryKey: ['content-blocks', 'contact_details'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_blocks')
        .select('*')
        .eq('section_name', 'contact_details')
        .eq('is_active', true)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      return data;
    },
  });

  if (isLoading || businessLoading || contactLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <main>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Impressum</h1>
          
          <div className="prose prose-lg max-w-none space-y-8">
            {impressumContent && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">{impressumContent.title}</h2>
                <div className="whitespace-pre-wrap">{impressumContent.content}</div>
              </div>
            )}
            
            {businessInfo && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">{businessInfo.title || "Geschäftsinformationen"}</h2>
                <div className="whitespace-pre-wrap">{businessInfo.content}</div>
              </div>
            )}
            
            {contactInfo && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">{contactInfo.title || "Kontaktdaten"}</h2>
                <div className="whitespace-pre-wrap">{contactInfo.content}</div>
              </div>
            )}
            
            {!impressumContent && !businessInfo && !contactInfo && (
              <div className="text-center text-muted-foreground py-8">
                <p>Die Impressum-Informationen werden derzeit über das Admin-Panel konfiguriert.</p>
                <p className="text-sm mt-2">Bitte wenden Sie sich an den Administrator, um diese Seite zu vervollständigen.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Impressum;
