
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Eye, EyeOff, Search, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MenuItemDialog } from '@/components/admin/MenuItemDialog';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  image_url: string;
  regular_price: number;
  student_price: number;
  is_featured: boolean;
  is_available: boolean;
  dietary_tags: string[];
  display_order: number;
  category_id: string;
  category: {
    name: string;
    id: string;
  };
}

interface MenuCategory {
  id: string;
  name: string;
}

export const MenuManagement = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMenuItems();
    fetchCategories();
  }, []);

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
    }
  };

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select(`
          *,
          category:menu_categories(id, name)
        `)
        .order('display_order');

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast({
        title: "Error",
        description: "Failed to fetch menu items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category?.id === selectedCategory;
    const matchesFeatured = !showFeaturedOnly || item.is_featured;
    const matchesAvailable = !showAvailableOnly || item.is_available;

    return matchesSearch && matchesCategory && matchesFeatured && matchesAvailable;
  });

  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      await fetchMenuItems();
      toast({
        title: "Success",
        description: `Item ${!currentStatus ? 'enabled' : 'disabled'} successfully`,
      });
    } catch (error) {
      console.error('Error updating availability:', error);
      toast({
        title: "Error",
        description: "Failed to update item availability",
        variant: "destructive",
      });
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchMenuItems();
      toast({
        title: "Success",
        description: "Menu item deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: "Failed to delete menu item",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setDialogOpen(true);
  };

  const handleDialogSave = () => {
    fetchMenuItems();
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading menu items...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Menu Management</h1>
          <p className="text-muted-foreground">
            Manage your restaurant menu items and categories
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Menu Item
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-4">
              <Button
                variant={showFeaturedOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
              >
                Featured Only
              </Button>
              
              <Button
                variant={showAvailableOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowAvailableOnly(!showAvailableOnly)}
              >
                Available Only
              </Button>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredItems.length} of {menuItems.length} items
          </div>
        </CardContent>
      </Card>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <div className="aspect-video bg-muted">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No image
                </div>
              )}
            </div>
            
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{item.name}</CardTitle>
                <div className="flex gap-1">
                  {item.is_featured && (
                    <Badge variant="secondary">Featured</Badge>
                  )}
                  <Badge variant={item.is_available ? "default" : "destructive"}>
                    {item.is_available ? "Available" : "Unavailable"}
                  </Badge>
                </div>
              </div>
              <CardDescription className="line-clamp-2">
                {item.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Regular: ₹{item.regular_price}</span>
                  <span>Student: ₹{item.student_price}</span>
                </div>
                
                {item.dietary_tags && item.dietary_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.dietary_tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm text-muted-foreground">
                    {item.category?.name}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleAvailability(item.id, item.is_available)}
                    >
                      {item.is_available ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteItem(item.id)}
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

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {menuItems.length === 0 ? "No menu items found." : "No items match your current filters."}
          </p>
          {menuItems.length === 0 && (
            <Button className="mt-4" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add your first menu item
            </Button>
          )}
        </div>
      )}

      {/* Menu Item Dialog */}
      <MenuItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editingItem}
        onSave={handleDialogSave}
      />
    </div>
  );
};
