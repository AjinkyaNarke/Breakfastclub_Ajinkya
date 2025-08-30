import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';

interface RestaurantVideo {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  featured_for_hero: boolean | null;
  is_featured: boolean | null;
  display_order: number | null;
  autoplay: boolean | null;
  show_controls: boolean | null;
  created_at: string;
}

interface VideoEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video: RestaurantVideo | null;
  onVideoUpdated: () => void;
}

interface FormData {
  title: string;
  description: string;
  is_featured: boolean;
  featured_for_hero: boolean;
  autoplay: boolean;
  show_controls: boolean;
  display_order: number;
}

export function VideoEditDialog({ open, onOpenChange, video, onVideoUpdated }: VideoEditDialogProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    is_featured: false,
    featured_for_hero: false,
    autoplay: false,
    show_controls: true,
    display_order: 0,
  });
  const { toast } = useToast();
  const { t } = useTranslation('admin');

  useEffect(() => {
    if (video) {
      setFormData({
        title: video.title || '',
        description: video.description || '',
        is_featured: video.is_featured || false,
        featured_for_hero: video.featured_for_hero || false,
        autoplay: video.autoplay || false,
        show_controls: video.show_controls !== false, // Default to true
        display_order: video.display_order || 0,
      });
    }
  }, [video]);

  const handleSave = async () => {
    if (!video) return;

    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      // If setting as hero video, remove hero status from other videos first
      if (formData.featured_for_hero && !video.featured_for_hero) {
        await supabase
          .from('restaurant_videos')
          .update({ featured_for_hero: false })
          .neq('id', video.id);
      }

      // Update the video
      const { error } = await supabase
        .from('restaurant_videos')
        .update({
          title: formData.title,
          description: formData.description || null,
          is_featured: formData.is_featured,
          featured_for_hero: formData.featured_for_hero,
          autoplay: formData.autoplay,
          show_controls: formData.show_controls,
          display_order: formData.display_order,
        })
        .eq('id', video.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Video updated successfully",
      });

      onVideoUpdated();
      onOpenChange(false);

    } catch (error) {
      console.error('Error updating video:', error);
      toast({
        title: "Error",
        description: "Failed to update video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Video</DialogTitle>
          <DialogDescription>
            Update video information and settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Video Preview */}
          {video?.video_url && (
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              <video
                src={video.video_url}
                controls
                className="w-full h-full object-cover"
                poster={video.thumbnail_url || undefined}
              />
            </div>
          )}

          {/* Basic Information */}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter video title"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter video description"
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => handleInputChange('display_order', parseInt(e.target.value) || 0)}
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          {/* Video Settings */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Video Settings</Label>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="featured_for_hero"
                  checked={formData.featured_for_hero}
                  onCheckedChange={(checked) => handleInputChange('featured_for_hero', checked as boolean)}
                />
                <Label htmlFor="featured_for_hero" className="text-sm font-normal">
                  Use as Hero Video
                  <span className="text-xs text-muted-foreground block">
                    Display prominently on the homepage
                  </span>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => handleInputChange('is_featured', checked as boolean)}
                />
                <Label htmlFor="is_featured" className="text-sm font-normal">
                  Featured Video
                  <span className="text-xs text-muted-foreground block">
                    Mark as featured content
                  </span>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="autoplay"
                  checked={formData.autoplay}
                  onCheckedChange={(checked) => handleInputChange('autoplay', checked as boolean)}
                />
                <Label htmlFor="autoplay" className="text-sm font-normal">
                  Autoplay
                  <span className="text-xs text-muted-foreground block">
                    Start playing automatically (muted)
                  </span>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show_controls"
                  checked={formData.show_controls}
                  onCheckedChange={(checked) => handleInputChange('show_controls', checked as boolean)}
                />
                <Label htmlFor="show_controls" className="text-sm font-normal">
                  Show Controls
                  <span className="text-xs text-muted-foreground block">
                    Display video player controls
                  </span>
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
