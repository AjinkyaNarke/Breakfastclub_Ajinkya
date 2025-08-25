import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2 } from 'lucide-react';

interface VideoUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVideoAdded: () => void;
}

export const VideoUploadDialog = ({ open, onOpenChange, onVideoAdded }: VideoUploadDialogProps) => {
  const [uploading, setUploading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    featured_for_hero: false,
    is_featured: false,
    autoplay: false,
    show_controls: true,
    display_order: 0,
  });
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        toast({
          title: "Invalid file type",
          description: "Please select a video file",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (100MB limit)
      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Video file must be less than 100MB",
          variant: "destructive",
        });
        return;
      }
      
      setVideoFile(file);
    }
  };

  const uploadVideo = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `videos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('restaurant-videos')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('restaurant-videos')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!videoFile) {
      toast({
        title: "Video required",
        description: "Please select a video file to upload",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a video title",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Upload video file
      const videoUrl = await uploadVideo(videoFile);

      // If setting as hero video, remove hero status from other videos
      if (formData.featured_for_hero) {
        await supabase
          .from('restaurant_videos')
          .update({ featured_for_hero: false })
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all existing videos
      }

      // Insert video record
      const { error: insertError } = await supabase
        .from('restaurant_videos')
        .insert({
          title: formData.title,
          description: formData.description,
          video_url: videoUrl,
          thumbnail_url: '', // Could generate thumbnail in the future
          featured_for_hero: formData.featured_for_hero,
          is_featured: formData.is_featured,
          autoplay: formData.autoplay,
          show_controls: formData.show_controls,
          display_order: formData.display_order,
        });

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "Video uploaded successfully",
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        featured_for_hero: false,
        is_featured: false,
        autoplay: false,
        show_controls: true,
        display_order: 0,
      });
      setVideoFile(null);
      
      onVideoAdded();
      onOpenChange(false);

    } catch (error) {
      console.error('Error uploading video:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload Video</DialogTitle>
          <DialogDescription>
            Add a new video to your restaurant collection
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="video-file">Video File</Label>
            <div className="flex items-center gap-2">
              <Input
                id="video-file"
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                disabled={uploading}
              />
              <Upload className="h-4 w-4 text-muted-foreground" />
            </div>
            {videoFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(1)}MB)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter video title"
              disabled={uploading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter video description"
              disabled={uploading}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="display-order">Display Order</Label>
              <Input
                id="display-order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                disabled={uploading}
                min="0"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="hero-toggle">Featured for Hero Section</Label>
              <Switch
                id="hero-toggle"
                checked={formData.featured_for_hero}
                onCheckedChange={(checked) => setFormData({ ...formData, featured_for_hero: checked })}
                disabled={uploading}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="featured-toggle">Tour Video (Featured)</Label>
              <Switch
                id="featured-toggle"
                checked={formData.is_featured}
                onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                disabled={uploading}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="autoplay-toggle">Autoplay</Label>
              <Switch
                id="autoplay-toggle"
                checked={formData.autoplay}
                onCheckedChange={(checked) => setFormData({ ...formData, autoplay: checked })}
                disabled={uploading}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="controls-toggle">Show Controls</Label>
              <Switch
                id="controls-toggle"
                checked={formData.show_controls}
                onCheckedChange={(checked) => setFormData({ ...formData, show_controls: checked })}
                disabled={uploading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button type="submit" disabled={uploading || !videoFile}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload Video'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};