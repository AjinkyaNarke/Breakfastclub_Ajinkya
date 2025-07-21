
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, FolderOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';

interface IngredientCategory {
  id: string;
  name: string;
  description?: string;
  display_order: number;
}

export const IngredientCategoryManagement = () => {
  const { t } = useTranslation('admin');
  const [categories, setCategories] = useState<IngredientCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IngredientCategory | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<IngredientCategory>>({
    name: '',
    description: '',
    display_order: 0,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('ingredient_categories')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: t('ingredientCategories.messages.fetchError'),
        description: t('ingredientCategories.messages.fetchError'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: IngredientCategory) => {
    setEditingItem(item);
    setFormData({ ...item });
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      display_order: categories.length,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast({
        title: t('ingredientCategories.messages.fillRequired'),
        description: t('ingredientCategories.messages.fillRequired'),
        variant: "destructive",
      });
      return;
    }

    try {
      const saveData = {
        name: formData.name,
        description: formData.description || '',
        display_order: formData.display_order || 0,
      };

      if (editingItem?.id) {
        const { error } = await supabase
          .from('ingredient_categories')
          .update(saveData)
          .eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('ingredient_categories')
          .insert([saveData]);
        if (error) throw error;
      }

      toast({
        title: editingItem?.id ? t('ingredientCategories.messages.updateSuccess') : t('ingredientCategories.messages.createSuccess'),
        description: editingItem?.id ? t('ingredientCategories.messages.updateSuccess') : t('ingredientCategories.messages.createSuccess'),
      });

      setDialogOpen(false);
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: editingItem?.id ? t('ingredientCategories.messages.updateError') : t('ingredientCategories.messages.createError'),
        description: editingItem?.id ? t('ingredientCategories.messages.updateError') : t('ingredientCategories.messages.createError'),
        variant: "destructive",
      });
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm(t('ingredientCategories.deleteConfirm'))) return;

    try {
      const { error } = await supabase
        .from('ingredient_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: t('ingredientCategories.messages.deleteSuccess'),
        description: t('ingredientCategories.messages.deleteSuccess'),
      });
      
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: t('ingredientCategories.messages.deleteError'),
        description: t('ingredientCategories.messages.deleteError'),
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">{t('ingredientCategories.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('ingredientCategories.title')}</h1>
          <p className="text-muted-foreground">
            {t('ingredientCategories.description')}
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          {t('ingredientCategories.addCategory')}
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <CardDescription>{t('ingredientCategories.order')} {category.display_order}</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                {category.description && (
                  <p className="text-sm text-muted-foreground">
                    {category.description}
                  </p>
                )}
                
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(category)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteCategory(category.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12">
          <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {t('ingredientCategories.noCategories')}
          </p>
          <Button className="mt-4" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            {t('ingredientCategories.addFirstCategory')}
          </Button>
        </div>
      )}

      {/* Category Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem?.id ? t('ingredientCategories.form.editTitle') : t('ingredientCategories.form.createNew')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('ingredientCategories.form.name')} *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('ingredientCategories.form.namePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('ingredientCategories.form.description')}</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('ingredientCategories.form.descriptionPlaceholder')}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order">{t('ingredientCategories.form.displayOrder')}</Label>
              <Input
                id="order"
                type="number"
                value={formData.display_order || 0}
                onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                placeholder={t('ingredientCategories.form.orderPlaceholder')}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                {t('ingredientCategories.form.cancel')}
              </Button>
              <Button onClick={handleSave}>
                {t('ingredientCategories.form.save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
