
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VideoUploadDialog } from '@/components/admin/VideoUploadDialog';
import { useTranslation } from 'react-i18next';

interface RestaurantVideo {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  is_featured: boolean;
  featured_for_hero: boolean;
  display_order: number;
  autoplay: boolean;
  show_controls: boolean;
  created_at: string;
}

export const VideoManagement = () => {
  const [videos, setVideos] = useState<RestaurantVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation('admin');

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurant_videos')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast({
        title: "Error",
        description: "Failed to fetch videos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteVideo = async (id: string) => {
    if (!confirm(t('videos.messages.deleteConfirm'))) return;

    try {
      // Get video data to delete the file from storage
      const { data: video } = await supabase
        .from('restaurant_videos')
        .select('video_url')
        .eq('id', id)
        .single();

      // Delete from database
      const { error } = await supabase
        .from('restaurant_videos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Delete file from storage if it exists
      if (video?.video_url) {
        const urlParts = video.video_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `videos/${fileName}`;
        
        await supabase.storage
          .from('restaurant-videos')
          .remove([filePath]);
      }
      
      await fetchVideos();
      toast({
        title: "Success",
        description: t('videos.messages.deleteSuccess'),
      });
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "Error",
        description: t('videos.messages.deleteError'),
        variant: "destructive",
      });
    }
  };

  const toggleHeroVideo = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('restaurant_videos')
        .update({ featured_for_hero: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      await fetchVideos();
      toast({
        title: "Success",
        description: currentStatus ? t('videos.messages.heroRemoved') : t('videos.messages.heroSet'),
      });
    } catch (error) {
      console.error('Error updating hero video:', error);
      toast({
        title: "Error",
        description: t('videos.messages.heroUpdateError'),
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading videos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('videos.title')}</h1>
          <p className="text-muted-foreground">
            {t('videos.description')}
          </p>
        </div>
        <Button onClick={() => setShowUploadDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('videos.addVideo')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <Card key={video.id} className="overflow-hidden">
            <div className="aspect-video bg-muted relative">
              {video.thumbnail_url ? (
                <img
                  src={video.thumbnail_url}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Play className="h-12 w-12" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Play className="h-12 w-12 text-white" />
              </div>
            </div>
            
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{video.title}</CardTitle>
                <div className="flex gap-2">
                  {video.is_featured && (
                    <Badge variant="secondary">{t('videos.badges.featured')}</Badge>
                  )}
                  {video.featured_for_hero && (
                    <Badge className="bg-primary text-primary-foreground">{t('videos.badges.hero')}</Badge>
                  )}
                </div>
              </div>
              <CardDescription className="line-clamp-2">
                {video.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {video.autoplay && (
                    <Badge variant="outline">{t('videos.badges.autoplay')}</Badge>
                  )}
                  {video.show_controls && (
                    <Badge variant="outline">{t('videos.badges.controls')}</Badge>
                  )}
                </div>
                
                <div className="text-xs text-muted-foreground">
                  {t('videos.order')} {video.display_order}
                </div>
                
                <div className="flex flex-col gap-2 pt-2">
                  <Button 
                    size="sm" 
                    variant={video.featured_for_hero ? "default" : "outline"}
                    onClick={() => toggleHeroVideo(video.id, video.featured_for_hero)}
                    className="w-full"
                  >
                    {video.featured_for_hero ? t('videos.actions.removeFromHero') : t('videos.actions.setAsHero')}
                  </Button>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteVideo(video.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {videos.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('videos.noVideos')}</p>
          <Button className="mt-4" onClick={() => setShowUploadDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('videos.addFirstVideo')}
          </Button>
        </div>
      )}

      <VideoUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onVideoAdded={fetchVideos}
      />
    </div>
  );
};
