import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Eye, EyeOff, Search, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EnhancedMenuItemDialog } from '@/components/admin/EnhancedMenuItemDialog';
import { AIUsageDashboard } from '@/components/admin/AIUsageDashboard';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

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
  const [creditsDialogOpen, setCreditsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation('admin');

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
        description: t('menu.messages.fetchError'),
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
        description: t('menu.messages.availabilityUpdated', { 
          status: !currentStatus ? t('menu.messages.enabled') : t('menu.messages.disabled') 
        }),
      });
    } catch (error) {
      console.error('Error updating availability:', error);
      toast({
        title: "Error",
        description: t('menu.messages.availabilityError'),
        variant: "destructive",
      });
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm(t('menu.deleteConfirm'))) return;

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchMenuItems();
      toast({
        title: "Success",
        description: t('menu.messages.deleteSuccess'),
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: t('menu.messages.deleteError'),
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
    return <div className="flex justify-center items-center h-64">{t('menu.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('menu.title')}</h1>
          <p className="text-muted-foreground">
            {t('menu.description')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            asChild
          >
            <Link to="/admin/cost-analysis">
              <TrendingUp className="h-4 w-4 mr-2" />
              {t('menu.costAnalysis')}
            </Link>
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => setCreditsDialogOpen(true)}
          >
            {t('menu.aiImageCredits')}
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            {t('menu.addMenuItem')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('menu.filtersAndSearch')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('menu.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder={t('menu.allCategories')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('menu.allCategories')}</SelectItem>
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
                {t('menu.featuredOnly')}
              </Button>
              
              <Button
                variant={showAvailableOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowAvailableOnly(!showAvailableOnly)}
              >
                {t('menu.availableOnly')}
              </Button>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-muted-foreground">
            {t('menu.showingItems', { count: filteredItems.length, total: menuItems.length })}
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
                  {t('menu.noImage')}
                </div>
              )}
            </div>
            
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{item.name}</CardTitle>
                <div className="flex gap-1">
                  {item.is_featured && (
                    <Badge variant="secondary">{t('menu.featured')}</Badge>
                  )}
                  <Badge variant={item.is_available ? "default" : "destructive"}>
                    {item.is_available ? t('menu.available') : t('menu.unavailable')}
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
                  <span>{t('menu.regular')}: €{item.regular_price}</span>
                  <span>{t('menu.student')}: €{item.student_price}</span>
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
            {menuItems.length === 0 ? t('menu.noItemsFound') : t('menu.noItemsMatch')}
          </p>
          {menuItems.length === 0 && (
            <Button className="mt-4" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              {t('menu.addFirstItem')}
            </Button>
          )}
        </div>
      )}

      {/* Enhanced Menu Item Dialog */}
      <EnhancedMenuItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editingItem}
        onSave={handleDialogSave}
      />

      {/* AI Credits Dialog */}
      <Dialog open={creditsDialogOpen} onOpenChange={setCreditsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('menu.aiUsageTitle')}</DialogTitle>
            <DialogDescription>
              {t('menu.aiUsageDescription')}
            </DialogDescription>
          </DialogHeader>
          <AIUsageDashboard />
        </DialogContent>
      </Dialog>
    </div>
  );
};
