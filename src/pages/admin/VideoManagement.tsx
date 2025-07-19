import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash2, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    thumbnail_url: '',
    is_featured: false,
    featured_for_hero: false,
    autoplay: false,
    show_controls: true,
    display_order: 0
  });
  const [editingVideo, setEditingVideo] = useState<RestaurantVideo | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

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
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
      const { error } = await supabase
        .from('restaurant_videos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchVideos();
      toast({
        title: "Success",
        description: "Video deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "Error",
        description: "Failed to delete video",
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
        description: currentStatus ? "Removed from hero section" : "Set as hero video",
      });
    } catch (error) {
      console.error('Error updating hero video:', error);
      toast({
        title: "Error",
        description: "Failed to update hero video",
        variant: "destructive",
      });
    }
  };

  const uploadFile = async (file: File, bucket: string, path: string) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return publicUrl;
  };

  const handleFileUpload = async (file: File, type: 'video' | 'thumbnail') => {
    if (!file) return;
    
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const bucket = type === 'video' ? 'restaurant-videos' : 'restaurant-images';
      
      const publicUrl = await uploadFile(file, bucket, fileName);
      
      if (type === 'video') {
        setFormData({ ...formData, video_url: publicUrl });
      } else {
        setFormData({ ...formData, thumbnail_url: publicUrl });
      }
      
      toast({
        title: "Success",
        description: `${type === 'video' ? 'Video' : 'Thumbnail'} uploaded successfully`,
      });
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      toast({
        title: "Error",
        description: `Failed to upload ${type}`,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const editVideo = (video: RestaurantVideo) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      description: video.description,
      video_url: video.video_url,
      thumbnail_url: video.thumbnail_url,
      is_featured: video.is_featured,
      featured_for_hero: video.featured_for_hero,
      autoplay: video.autoplay,
      show_controls: video.show_controls,
      display_order: video.display_order
    });
    setIsDialogOpen(true);
  };

  const handleSaveVideo = async () => {
    if (!formData.title || !formData.video_url) {
      toast({
        title: "Error",
        description: "Title and video are required",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingVideo) {
        const { error } = await supabase
          .from('restaurant_videos')
          .update(formData)
          .eq('id', editingVideo.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Video updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('restaurant_videos')
          .insert([formData]);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Video added successfully",
        });
      }
      
      await fetchVideos();
      setIsDialogOpen(false);
      setEditingVideo(null);
      setFormData({
        title: '',
        description: '',
        video_url: '',
        thumbnail_url: '',
        is_featured: false,
        featured_for_hero: false,
        autoplay: false,
        show_controls: true,
        display_order: 0
      });
    } catch (error) {
      console.error('Error saving video:', error);
      toast({
        title: "Error",
        description: "Failed to save video",
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
          <h1 className="text-3xl font-bold">Video Management</h1>
          <p className="text-muted-foreground">
            Manage restaurant videos and promotional content
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Video
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingVideo ? 'Edit Video' : 'Add New Video'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Video title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Video description"
                />
              </div>
              <div>
                <Label htmlFor="video_url">Video</Label>
                <div className="space-y-2">
                  <Input
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'video');
                    }}
                    disabled={uploading}
                  />
                  <div className="text-sm text-muted-foreground">Or paste URL:</div>
                  <Input
                    id="video_url"
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    placeholder="https://example.com/video.mp4"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="thumbnail_url">Thumbnail</Label>
                <div className="space-y-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'thumbnail');
                    }}
                    disabled={uploading}
                  />
                  <div className="text-sm text-muted-foreground">Or paste URL:</div>
                  <Input
                    id="thumbnail_url"
                    value={formData.thumbnail_url}
                    onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                    placeholder="https://example.com/thumbnail.jpg"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: !!checked })}
                  />
                  <Label htmlFor="is_featured">Featured Video</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="featured_for_hero"
                    checked={formData.featured_for_hero}
                    onCheckedChange={(checked) => setFormData({ ...formData, featured_for_hero: !!checked })}
                  />
                  <Label htmlFor="featured_for_hero">Use for Hero Section</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="autoplay"
                    checked={formData.autoplay}
                    onCheckedChange={(checked) => setFormData({ ...formData, autoplay: !!checked })}
                  />
                  <Label htmlFor="autoplay">Autoplay</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show_controls"
                    checked={formData.show_controls}
                    onCheckedChange={(checked) => setFormData({ ...formData, show_controls: !!checked })}
                  />
                  <Label htmlFor="show_controls">Show Controls</Label>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setIsDialogOpen(false);
                  setEditingVideo(null);
                  setFormData({
                    title: '',
                    description: '',
                    video_url: '',
                    thumbnail_url: '',
                    is_featured: false,
                    featured_for_hero: false,
                    autoplay: false,
                    show_controls: true,
                    display_order: 0
                  });
                }}>
                  Cancel
                </Button>
                <Button onClick={handleSaveVideo} disabled={uploading}>
                  {uploading ? 'Uploading...' : editingVideo ? 'Update Video' : 'Add Video'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
                    <Badge variant="secondary">Featured</Badge>
                  )}
                  {video.featured_for_hero && (
                    <Badge className="bg-primary text-primary-foreground">Hero</Badge>
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
                    <Badge variant="outline">Autoplay</Badge>
                  )}
                  {video.show_controls && (
                    <Badge variant="outline">Controls</Badge>
                  )}
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Order: {video.display_order}
                </div>
                
                <div className="flex flex-col gap-2 pt-2">
                  <Button 
                    size="sm" 
                    variant={video.featured_for_hero ? "default" : "outline"}
                    onClick={() => toggleHeroVideo(video.id, video.featured_for_hero)}
                    className="w-full"
                  >
                    {video.featured_for_hero ? "Remove from Hero" : "Set as Hero"}
                  </Button>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => editVideo(video)}>
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
          <p className="text-muted-foreground">No videos found.</p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add your first video
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      )}
    </div>
  );
};