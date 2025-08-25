
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUploadDialog } from '@/components/admin/ImageUploadDialog';
import { ImageEditDialog } from '@/components/admin/ImageEditDialog';
import { Plus, Search, Grid, List, Star, Edit, Trash2 } from 'lucide-react';
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
  created_at: string;
}

export function GalleryManagement() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const { toast } = useToast();

  const categories = [
    'Interior', 'Seating', 'Kitchen', 'Community', 'Details', 'Atmosphere', 'Food', 'General'
  ];

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase
        .from('gallery_images')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setImages(data);
    } catch (error) {
      console.error('Error fetching images:', error);
      toast({
        title: 'Error',
        description: 'Failed to load gallery images',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const image = images.find(img => img.id === imageId);
      if (!image) return;

      // Delete from storage
      const imagePath = image.image_url.split('/').pop();
      if (imagePath) {
        await supabase.storage
          .from('restaurant-images')
          .remove([imagePath]);
      }

      // Delete from database
      const { error } = await supabase
        .from('gallery_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      setImages(images.filter(img => img.id !== imageId));
      toast({
        title: 'Success',
        description: 'Image deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete image',
        variant: 'destructive',
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedImages.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedImages.length} images?`)) return;

    try {
      // Delete from storage and database
      for (const imageId of selectedImages) {
        const image = images.find(img => img.id === imageId);
        if (image) {
          const imagePath = image.image_url.split('/').pop();
          if (imagePath) {
            await supabase.storage
              .from('restaurant-images')
              .remove([imagePath]);
          }
        }
      }

      const { error } = await supabase
        .from('gallery_images')
        .delete()
        .in('id', selectedImages);

      if (error) throw error;

      setImages(images.filter(img => !selectedImages.includes(img.id)));
      setSelectedImages([]);
      toast({
        title: 'Success',
        description: `${selectedImages.length} images deleted successfully`,
      });
    } catch (error) {
      console.error('Error deleting images:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete images',
        variant: 'destructive',
      });
    }
  };

  const filteredImages = images.filter(image => {
    const matchesSearch = image.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         image.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || image.category === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading gallery images...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gallery Management</h1>
        <Button onClick={() => setUploadDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Upload Images
        </Button>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search images..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category.toLowerCase()}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 items-center">
          {selectedImages.length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected ({selectedImages.length})
            </Button>
          )}
          
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Image Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredImages.map((image) => (
            <Card key={image.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <img
                  src={image.image_url}
                  alt={image.alt_text || image.title}
                  className="w-full h-48 object-cover"
                />
                
                <div className="absolute top-2 left-2 flex gap-2">
                  <input
                    type="checkbox"
                    checked={selectedImages.includes(image.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedImages([...selectedImages, image.id]);
                      } else {
                        setSelectedImages(selectedImages.filter(id => id !== image.id));
                      }
                    }}
                    className="w-4 h-4"
                  />
                  {image.is_featured && (
                    <Badge className="bg-primary/90">
                      <Star className="w-3 h-3" />
                    </Badge>
                  )}
                </div>

                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setEditingImage(image);
                      setEditDialogOpen(true);
                    }}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteImage(image.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold truncate">{image.title || 'Untitled'}</h3>
                  <Badge variant="outline">{image.category}</Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {image.description || 'No description'}
                </p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredImages.map((image) => (
            <Card key={image.id} className="p-4">
              <div className="flex gap-4">
                <img
                  src={image.image_url}
                  alt={image.alt_text || image.title}
                  className="w-24 h-24 object-cover rounded"
                />
                
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{image.title || 'Untitled'}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {image.description || 'No description'}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{image.category}</Badge>
                        {image.is_featured && (
                          <Badge className="bg-primary/90">
                            <Star className="w-3 h-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <input
                        type="checkbox"
                        checked={selectedImages.includes(image.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedImages([...selectedImages, image.id]);
                          } else {
                            setSelectedImages(selectedImages.filter(id => id !== image.id));
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditingImage(image);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteImage(image.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {filteredImages.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No images found. Upload some images to get started!</p>
        </div>
      )}

      <ImageUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUploadComplete={fetchImages}
      />

      <ImageEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        image={editingImage}
        onEditComplete={fetchImages}
      />
    </div>
  );
}
