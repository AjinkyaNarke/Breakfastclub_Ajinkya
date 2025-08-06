import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const DynamicFavicon = () => {
  useEffect(() => {
    const loadFavicon = async () => {
      try {
        const { data, error } = await supabase
          .from('site_branding')
          .select('favicon_url')
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading favicon:', error);
          return;
        }

        if (data?.favicon_url) {
          const faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
          if (faviconLink) {
            faviconLink.href = data.favicon_url;
          } else {
            const newFaviconLink = document.createElement('link');
            newFaviconLink.rel = 'icon';
            newFaviconLink.href = data.favicon_url;
            document.head.appendChild(newFaviconLink);
          }
        }
      } catch (error) {
        console.error('Error loading favicon:', error);
      }
    };

    loadFavicon();

    // Listen for changes in site_branding table
    const channel = supabase
      .channel('site_branding_changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'site_branding'
      }, (payload) => {
        const newFaviconUrl = payload.new?.favicon_url;
        if (newFaviconUrl) {
          const faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
          if (faviconLink) {
            faviconLink.href = newFaviconUrl;
          } else {
            const newFaviconLink = document.createElement('link');
            newFaviconLink.rel = 'icon';
            newFaviconLink.href = newFaviconUrl;
            document.head.appendChild(newFaviconLink);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return null; // This component doesn't render anything
};

export default DynamicFavicon;