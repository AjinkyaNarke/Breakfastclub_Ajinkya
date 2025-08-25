
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface GalleryImage {
  id: string;
  title: string;
  description: string;
  image_url: string;
  category: string;
  is_featured: boolean;
  alt_text: string;
  display_order: number;
}

interface ImageEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  image: GalleryImage | null;
  onEditComplete: () => void;
}

interface FormData {
  title: string;
  description: string;
  alt_text: string;
  category: string;
  is_featured: boolean;
  display_order: number;
}

export function ImageEditDialog({ open, onOpenChange, image, onEditComplete }: ImageEditDialogProps) {
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    defaultValues: {
      title: '',
      description: '',
      alt_text: '',
      category: 'general',
      is_featured: false,
      display_order: 0,
    },
  });

  const categories = [
    'interior', 'seating', 'kitchen', 'community', 'details', 'atmosphere', 'food', 'general'
  ];

  useEffect(() => {
    if (image) {
      form.reset({
        title: image.title || '',
        description: image.description || '',
        alt_text: image.alt_text || '',
        category: image.category || 'general',
        is_featured: image.is_featured || false,
        display_order: image.display_order || 0,
      });
    }
  }, [image, form]);

  const handleSave = async (data: FormData) => {
    if (!image) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from('gallery_images')
        .update({
          title: data.title,
          description: data.description,
          alt_text: data.alt_text,
          category: data.category,
          is_featured: data.is_featured,
          display_order: data.display_order,
        })
        .eq('id', image.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Image updated successfully',
      });

      onEditComplete();
      onOpenChange(false);

    } catch (error) {
      console.error('Error updating image:', error);
      toast({
        title: 'Error',
        description: 'Failed to update image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Gallery Image</DialogTitle>
          <DialogDescription>
            Update the details for this gallery image.
          </DialogDescription>
        </DialogHeader>

        {image && (
          <div className="space-y-6">
            {/* Image Preview */}
            <div className="flex justify-center">
              <img
                src={image.image_url}
                alt={image.alt_text || image.title}
                className="max-w-full max-h-64 object-contain rounded-lg"
              />
            </div>

            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    {...form.register('title', { required: 'Title is required' })}
                    placeholder="Enter image title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select
                    value={form.watch('category')}
                    onValueChange={(value) => form.setValue('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  {...form.register('description')}
                  placeholder="Enter image description"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-alt-text">Alt Text (for accessibility)</Label>
                <Input
                  id="edit-alt-text"
                  {...form.register('alt_text')}
                  placeholder="Describe the image for screen readers"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-display-order">Display Order</Label>
                  <Input
                    id="edit-display-order"
                    type="number"
                    {...form.register('display_order', { valueAsNumber: true })}
                    placeholder="0"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-8">
                  <Switch
                    id="edit-is-featured"
                    checked={form.watch('is_featured')}
                    onCheckedChange={(checked) => form.setValue('is_featured', checked)}
                  />
                  <Label htmlFor="edit-is-featured">Featured image</Label>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
