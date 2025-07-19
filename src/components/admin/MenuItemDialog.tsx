
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Plus } from 'lucide-react';

interface MenuCategory {
  id: string;
  name: string;
}

interface MenuItem {
  id?: string;
  name: string;
  description: string;
  category_id: string;
  image_url: string;
  regular_price: number;
  student_price: number;
  is_featured: boolean;
  is_available: boolean;
  dietary_tags: string[];
  display_order: number;
}

interface MenuItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: MenuItem | null;
  onSave: () => void;
}

const DIETARY_TAG_OPTIONS = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut-Free', 
  'Spicy', 'Low-Carb', 'High-Protein', 'Organic', 'Local'
];

export const MenuItemDialog = ({ open, onOpenChange, item, onSave }: MenuItemDialogProps) => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [formData, setFormData] = useState<MenuItem>({
    name: '',
    description: '',
    category_id: '',
    image_url: '',
    regular_price: 0,
    student_price: 0,
    is_featured: false,
    is_available: true,
    dietary_tags: [],
    display_order: 0
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newTag, setNewTag] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchCategories();
      if (item) {
        setFormData({ ...item });
      } else {
        setFormData({
          name: '',
          description: '',
          category_id: '',
          image_url: '',
          regular_price: 0,
          student_price: 0,
          is_featured: false,
          is_available: true,
          dietary_tags: [],
          display_order: 0
        });
      }
    }
  }, [open, item]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('id, name')
        .order('display_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to fetch menu categories",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select a valid image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size should be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `menu-item-${Date.now()}.${fileExt}`;
      const filePath = `menu-items/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('restaurant-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('restaurant-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const addDietaryTag = (tag: string) => {
    if (tag && !formData.dietary_tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        dietary_tags: [...prev.dietary_tags, tag]
      }));
    }
    setNewTag('');
  };

  const removeDietaryTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      dietary_tags: prev.dietary_tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.category_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const saveData = {
        name: formData.name,
        description: formData.description,
        category_id: formData.category_id,
        image_url: formData.image_url || null,
        regular_price: formData.regular_price,
        student_price: formData.student_price,
        is_featured: formData.is_featured,
        is_available: formData.is_available,
        dietary_tags: formData.dietary_tags,
        display_order: formData.display_order
      };

      if (item?.id) {
        const { error } = await supabase
          .from('menu_items')
          .update(saveData)
          .eq('id', item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('menu_items')
          .insert([saveData]);
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Menu item ${item?.id ? 'updated' : 'created'} successfully`,
      });

      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast({
        title: "Error",
        description: "Failed to save menu item",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {item?.id ? 'Edit Menu Item' : 'Add New Menu Item'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter item name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
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
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter item description"
              rows={3}
            />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="regular_price">Regular Price (₹)</Label>
              <Input
                id="regular_price"
                type="number"
                step="0.01"
                value={formData.regular_price}
                onChange={(e) => setFormData(prev => ({ ...prev, regular_price: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="student_price">Student Price (₹)</Label>
              <Input
                id="student_price"
                type="number"
                step="0.01"
                value={formData.student_price}
                onChange={(e) => setFormData(prev => ({ ...prev, student_price: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="image">Item Image</Label>
            <div className="flex items-center gap-4">
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="flex-1"
              />
              {uploading && (
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Uploading...</span>
                </div>
              )}
            </div>
            {formData.image_url && (
              <div className="mt-2">
                <img
                  src={formData.image_url}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg border"
                />
              </div>
            )}
          </div>

          {/* Dietary Tags */}
          <div className="space-y-2">
            <Label>Dietary Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.dietary_tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeDietaryTag(tag)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Select onValueChange={addDietaryTag}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Add dietary tag" />
                </SelectTrigger>
                <SelectContent>
                  {DIETARY_TAG_OPTIONS.filter(tag => !formData.dietary_tags.includes(tag)).map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Custom tag"
                  className="w-32"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => addDietaryTag(newTag)}
                  disabled={!newTag}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="featured">Featured Item</Label>
              <Switch
                id="featured"
                checked={formData.is_featured}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="available">Available</Label>
              <Switch
                id="available"
                checked={formData.is_available}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_available: checked }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : item?.id ? 'Update Item' : 'Create Item'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
