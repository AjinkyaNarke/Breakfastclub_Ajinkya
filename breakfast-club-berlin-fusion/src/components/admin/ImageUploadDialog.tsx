
import { useState } from 'react';
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
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete: () => void;
}

interface FormData {
  title: string;
  description: string;
  alt_text: string;
  category: string;
  is_featured: boolean;
}

export function ImageUploadDialog({ open, onOpenChange, onUploadComplete }: ImageUploadDialogProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const { toast } = useToast();

  const form = useForm<FormData>({
    defaultValues: {
      title: '',
      description: '',
      alt_text: '',
      category: 'general',
      is_featured: false,
    },
  });

  const categories = [
    'interior', 'seating', 'kitchen', 'community', 'details', 'atmosphere', 'food', 'general'
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      toast({
        title: 'Invalid files',
        description: 'Please select only image files',
        variant: 'destructive',
      });
    }

    setSelectedFiles(imageFiles);
    
    // Generate previews
    const newPreviews = imageFiles.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    setSelectedFiles(imageFiles);
    const newPreviews = imageFiles.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
  };

  const handleUpload = async (data: FormData) => {
    if (selectedFiles.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please select at least one image to upload',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      // Get the highest display order
      const { data: existingImages } = await supabase
        .from('gallery_images')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1);

      let nextDisplayOrder = existingImages?.[0]?.display_order ? existingImages[0].display_order + 1 : 0;

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${i}.${fileExt}`;

        // Upload to storage
        const { data: storageData, error: storageError } = await supabase.storage
          .from('restaurant-images')
          .upload(fileName, file);

        if (storageError) throw storageError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('restaurant-images')
          .getPublicUrl(fileName);

        // Save to database
        const imageData = {
          title: selectedFiles.length === 1 ? data.title : `${data.title} ${i + 1}`,
          description: data.description,
          alt_text: data.alt_text,
          category: data.category,
          is_featured: data.is_featured && i === 0, // Only first image can be featured
          image_url: urlData.publicUrl,
          display_order: nextDisplayOrder + i,
        };

        const { error: dbError } = await supabase
          .from('gallery_images')
          .insert(imageData);

        if (dbError) throw dbError;
      }

      toast({
        title: 'Success',
        description: `${selectedFiles.length} image(s) uploaded successfully`,
      });

      // Reset form
      form.reset();
      setSelectedFiles([]);
      setPreviews([]);
      onUploadComplete();
      onOpenChange(false);

    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload images. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Gallery Images</DialogTitle>
          <DialogDescription>
            Upload multiple images to the restaurant gallery. Fill in the details that will apply to all images.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleUpload)} className="space-y-6">
          {/* File Upload Area */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium">Drop images here or click to browse</p>
              <p className="text-sm text-gray-500 mt-2">Support for multiple image files</p>
            </label>
          </div>

          {/* Image Previews */}
          {previews.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {previews.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                {...form.register('title', { required: 'Title is required' })}
                placeholder="Enter image title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Enter image description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="alt_text">Alt Text (for accessibility)</Label>
            <Input
              id="alt_text"
              {...form.register('alt_text')}
              placeholder="Describe the image for screen readers"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_featured"
              checked={form.watch('is_featured')}
              onCheckedChange={(checked) => form.setValue('is_featured', checked)}
            />
            <Label htmlFor="is_featured">Featured image</Label>
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={uploading || selectedFiles.length === 0}>
              {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} Image(s)`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
