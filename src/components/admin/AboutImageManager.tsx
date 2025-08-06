import { useState, useEffect } from 'react';
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
import { Upload, X, Image as ImageIcon, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

interface AboutImage {
  id: string;
  image_url: string;
  title: string | null;
  caption: string | null;
  alt_text: string;
  display_order: number | null;
  section_id: string;
}

interface AboutImageManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionId: string;
  sectionTitle: string;
  onImagesUpdated: () => void;
}

export function AboutImageManager({ 
  open, 
  onOpenChange, 
  sectionId, 
  sectionTitle,
  onImagesUpdated 
}: AboutImageManagerProps) {
  const [images, setImages] = useState<AboutImage[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingImage, setEditingImage] = useState<AboutImage | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    caption: '',
    alt_text: ''
  });
  const { toast } = useToast();

  // Fetch existing images for this section
  useEffect(() => {
    if (open && sectionId) {
      fetchImages();
    }
  }, [open, sectionId]);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('about_images')
        .select('*')
        .eq('section_id', sectionId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error fetching images:', error);
      toast({
        title: "Error",
        description: "Failed to fetch images",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);

    // Create previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    setSelectedFiles(files);

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);
  };

  const uploadImages = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `about/${sectionId}/${Date.now()}-${i}.${fileExt}`;

        // Upload to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('restaurant-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('restaurant-images')
          .getPublicUrl(fileName);

        // Save to database
        const { error: dbError } = await supabase
          .from('about_images')
          .insert({
            section_id: sectionId,
            image_url: urlData.publicUrl,
            title: `Image ${i + 1}`,
            alt_text: `About section image ${i + 1}`,
            display_order: images.length + i + 1
          });

        if (dbError) throw dbError;
      }

      toast({
        title: "Success",
        description: `${selectedFiles.length} image(s) uploaded successfully`,
      });

      // Clear selections and refresh
      setSelectedFiles([]);
      setPreviews([]);
      fetchImages();
      onImagesUpdated();
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: "Error",
        description: "Failed to upload images",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (imageId: string, imageUrl: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      // Extract filename from URL for storage deletion
      const fileName = imageUrl.split('/').pop();
      if (fileName) {
        // Delete from storage
        await supabase.storage
          .from('restaurant-images')
          .remove([`about/${sectionId}/${fileName}`]);
      }

      // Delete from database
      const { error } = await supabase
        .from('about_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Image deleted successfully",
      });

      fetchImages();
      onImagesUpdated();
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive",
      });
    }
  };

  const startEditImage = (image: AboutImage) => {
    setEditingImage(image);
    setEditForm({
      title: image.title || '',
      caption: image.caption || '',
      alt_text: image.alt_text || ''
    });
  };

  const saveImageEdit = async () => {
    if (!editingImage) return;

    try {
      const { error } = await supabase
        .from('about_images')
        .update({
          title: editForm.title || null,
          caption: editForm.caption || null,
          alt_text: editForm.alt_text
        })
        .eq('id', editingImage.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Image updated successfully",
      });

      setEditingImage(null);
      fetchImages();
      onImagesUpdated();
    } catch (error) {
      console.error('Error updating image:', error);
      toast({
        title: "Error",
        description: "Failed to update image",
        variant: "destructive",
      });
    }
  };

  const removePreview = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
    setPreviews(prevs => prevs.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Images - {sectionTitle}</DialogTitle>
          <DialogDescription>
            Upload and manage images for this about section
          </DialogDescription>
        </DialogHeader>

        {/* Upload Section */}
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div
              className="text-center"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Drop images here or click to upload
                  </span>
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                />
              </div>
            </div>
          </div>

          {/* File Previews */}
          {previews.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {previews.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removePreview(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {selectedFiles.length > 0 && (
            <Button 
              onClick={uploadImages} 
              disabled={uploading}
              className="w-full"
            >
              {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} Image(s)`}
            </Button>
          )}
        </div>

        {/* Existing Images */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Existing Images ({images.length})</h3>
          
          {loading ? (
            <div className="text-center py-8">Loading images...</div>
          ) : images.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ImageIcon className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2">No images uploaded yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((image) => (
                <Card key={image.id}>
                  <CardContent className="p-4">
                    <img
                      src={image.image_url}
                      alt={image.alt_text}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                    <div className="space-y-2">
                      <p className="font-medium text-sm">{image.title || 'Untitled'}</p>
                      {image.caption && (
                        <p className="text-sm text-gray-600">{image.caption}</p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEditImage(image)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteImage(image.id, image.image_url)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Edit Image Dialog */}
        {editingImage && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Edit Image</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-caption">Caption</Label>
                  <Textarea
                    id="edit-caption"
                    value={editForm.caption}
                    onChange={(e) => setEditForm({ ...editForm, caption: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-alt">Alt Text</Label>
                  <Input
                    id="edit-alt"
                    value={editForm.alt_text}
                    onChange={(e) => setEditForm({ ...editForm, alt_text: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveImageEdit}>Save</Button>
                  <Button variant="outline" onClick={() => setEditingImage(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}