import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Plus, ArrowRight, ArrowLeft, Languages, Loader2, Edit2 } from 'lucide-react';
import { IngredientSelector } from './IngredientSelector';
import { translateText } from '@/integrations/deepseek/translate';
import { useTranslation } from 'react-i18next';

interface MenuCategory {
  id: string;
  name: string;
}

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  category_id: string;
  allergens: string[];
  dietary_properties: string[];
  cost_per_unit?: number;
  category?: {
    name: string;
  };
}

interface SelectedIngredient {
  ingredient_id: string;
  quantity: number;
  unit: string;
  notes?: string;
  ingredient: Ingredient;
}

interface MenuItem {
  id?: string;
  name: string;
  name_de?: string;
  name_en?: string;
  description: string;
  description_de?: string;
  description_en?: string;
  category_id: string;
  regular_price: number;
  student_price: number;
  is_available: boolean;
  is_featured: boolean;
  image_url?: string;
  dietary_tags: string[];
  preparation_time_minutes?: number;
  display_order?: number;
}

interface MenuItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuItem?: MenuItem;
  onSave: () => void;
}

const DIETARY_TAGS = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'spicy', 'healthy'];

const STEP_TITLES = [
  'Basic Information',
  'Review & Translate',
  'Final Details'
];

export function StreamlinedMenuItemDialog({ open, onOpenChange, menuItem, onSave }: MenuItemDialogProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  
  // Form state
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  
  // Categories
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  
  // Basic form data (Step 1)
  const [basicData, setBasicData] = useState({
    name: '',
    description: '',
    category_id: '',
    regular_price: 0,
    preparation_time_minutes: 15
  });
  
  // Translation data (Step 2)
  const [translations, setTranslations] = useState({
    name_de: '',
    name_en: '',
    description_de: '',
    description_en: ''
  });
  
  // Final details (Step 3)
  const [finalData, setFinalData] = useState({
    student_price: 0,
    dietary_tags: [] as string[],
    is_available: true,
    is_featured: false,
    image_url: '',
    display_order: 0
  });
  
  // Ingredients
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredient[]>([]);

  useEffect(() => {
    if (open) {
      fetchCategories();
      if (menuItem) {
        // Populate form with existing data
        setBasicData({
          name: menuItem.name,
          description: menuItem.description,
          category_id: menuItem.category_id,
          regular_price: menuItem.regular_price,
          preparation_time_minutes: menuItem.preparation_time_minutes || 15
        });
        setTranslations({
          name_de: menuItem.name_de || '',
          name_en: menuItem.name_en || '',
          description_de: menuItem.description_de || '',
          description_en: menuItem.description_en || ''
        });
        setFinalData({
          student_price: menuItem.student_price,
          dietary_tags: menuItem.dietary_tags || [],
          is_available: menuItem.is_available,
          is_featured: menuItem.is_featured,
          image_url: menuItem.image_url || '',
          display_order: menuItem.display_order || 0
        });
      } else {
        // Reset form for new item
        resetForm();
      }
    }
  }, [open, menuItem]);

  const resetForm = () => {
    setCurrentStep(0);
    setBasicData({
      name: '',
      description: '',
      category_id: '',
      regular_price: 0,
      preparation_time_minutes: 15
    });
    setTranslations({
      name_de: '',
      name_en: '',
      description_de: '',
      description_en: ''
    });
    setFinalData({
      student_price: 0,
      dietary_tags: [],
      is_available: true,
      is_featured: false,
      image_url: '',
      display_order: 0
    });
    setSelectedIngredients([]);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('menu_categories')
      .select('id, name')
      .order('display_order');
    
    if (error) {
      console.error('Error fetching categories:', error);
      return;
    }
    
    setCategories(data || []);
  };

  const createDefaultCategories = async () => {
    setIsLoading(true);
    try {
      const defaultCategories = [
        { name: 'Breakfast', name_de: 'Frühstück', name_en: 'Breakfast', description: 'Morning favorites to start your day', display_order: 10 },
        { name: 'Brunch', name_de: 'Brunch', name_en: 'Brunch', description: 'Perfect combination of breakfast and lunch', display_order: 20 },
        { name: 'Lunch', name_de: 'Mittagessen', name_en: 'Lunch', description: 'Hearty midday meals', display_order: 30 },
        { name: 'Salads', name_de: 'Salate', name_en: 'Salads', description: 'Fresh and healthy salad options', display_order: 40 },
        { name: 'Mains', name_de: 'Hauptgerichte', name_en: 'Mains', description: 'Satisfying main courses', display_order: 50 },
        { name: 'Beverages', name_de: 'Getränke', name_en: 'Beverages', description: 'Refreshing drinks and beverages', display_order: 60 },
        { name: 'Desserts', name_de: 'Desserts', name_en: 'Desserts', description: 'Sweet endings to your meal', display_order: 70 }
      ];

      const { error } = await supabase
        .from('menu_categories')
        .insert(defaultCategories);

      if (error) throw error;

      await fetchCategories();
      toast({
        title: 'Success',
        description: 'Default menu categories have been created!',
      });
    } catch (error) {
      console.error('Error creating default categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to create default categories. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateTranslations = async () => {
    if (!basicData.name || !basicData.description) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in name and description first.',
        variant: 'destructive'
      });
      return;
    }

    setIsTranslating(true);
    
    try {
      // Detect the likely source language based on content
      const nameHasGermanChars = /[äöüß]/i.test(basicData.name);
      const nameSourceLang = nameHasGermanChars ? 'de' : 'en';
      
      const descHasGermanChars = /[äöüß]/i.test(basicData.description);
      const descSourceLang = descHasGermanChars ? 'de' : 'en';
      
      // Generate translations
      const [nameDE, nameEN, descDE, descEN] = await Promise.all([
        nameSourceLang === 'de' ? 
          Promise.resolve(basicData.name) : 
          translateText({ text: basicData.name, sourceLang: 'en', targetLang: 'de' }),
        nameSourceLang === 'en' ? 
          Promise.resolve(basicData.name) : 
          translateText({ text: basicData.name, sourceLang: 'de', targetLang: 'en' }),
        descSourceLang === 'de' ? 
          Promise.resolve(basicData.description) : 
          translateText({ text: basicData.description, sourceLang: 'en', targetLang: 'de' }),
        descSourceLang === 'en' ? 
          Promise.resolve(basicData.description) : 
          translateText({ text: basicData.description, sourceLang: 'de', targetLang: 'en' })
      ]);

      setTranslations({
        name_de: nameDE,
        name_en: nameEN,
        description_de: descDE,
        description_en: descEN
      });

      toast({
        title: 'Translations Generated',
        description: 'AI translations have been generated. You can edit them if needed.',
      });
    } catch (error) {
      console.error('Translation error:', error);
      toast({
        title: 'Translation Failed',
        description: 'Could not generate translations. Please fill them manually.',
        variant: 'destructive'
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === 0) {
      // Check if categories exist
      if (categories.length === 0) {
        toast({
          title: 'No Categories Available',
          description: 'Please create menu categories first by clicking the "Create Default Categories" button.',
          variant: 'destructive'
        });
        return;
      }

      // Validate basic data
      if (!basicData.name || !basicData.description || !basicData.category_id || basicData.regular_price <= 0) {
        toast({
          title: 'Missing Information',
          description: 'Please fill in all required fields.',
          variant: 'destructive'
        });
        return;
      }
      
      // Auto-generate translations
      await generateTranslations();
      setCurrentStep(1);
    } else if (currentStep === 1) {
      // Set default student price if not set
      if (finalData.student_price === 0) {
        setFinalData(prev => ({
          ...prev,
          student_price: Math.round(basicData.regular_price * 0.8 * 100) / 100
        }));
      }
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      const menuItemData = {
        ...basicData,
        ...translations,
        ...finalData,
        category_id: basicData.category_id,
        regular_price: basicData.regular_price,
        student_price: finalData.student_price || Math.round(basicData.regular_price * 0.8 * 100) / 100
      };

      if (menuItem?.id) {
        // Update existing item
        const { error } = await supabase
          .from('menu_items')
          .update(menuItemData)
          .eq('id', menuItem.id);
        
        if (error) throw error;
      } else {
        // Create new item
        const { data: newItem, error } = await supabase
          .from('menu_items')
          .insert(menuItemData)
          .select()
          .single();
        
        if (error) throw error;

        // Add ingredients if any selected
        if (selectedIngredients.length > 0) {
          const ingredientData = selectedIngredients.map(ing => ({
            menu_item_id: newItem.id,
            ingredient_id: ing.ingredient_id,
            quantity: ing.quantity,
            unit: ing.unit,
            notes: ing.notes
          }));

          const { error: ingError } = await supabase
            .from('menu_item_ingredients')
            .insert(ingredientData);
          
          if (ingError) throw ingError;
        }
      }

      toast({
        title: 'Success',
        description: `Menu item ${menuItem?.id ? 'updated' : 'created'} successfully!`,
      });
      
      onSave();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast({
        title: 'Error',
        description: 'Failed to save menu item. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDietaryTag = (tag: string) => {
    setFinalData(prev => ({
      ...prev,
      dietary_tags: prev.dietary_tags.includes(tag)
        ? prev.dietary_tags.filter(t => t !== tag)
        : [...prev.dietary_tags, tag]
    }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Dish Name *</Label>
              <Input
                id="name"
                value={basicData.name}
                onChange={(e) => setBasicData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Chicken Salad"
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={basicData.description}
                onChange={(e) => setBasicData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the dish..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                {categories.length === 0 ? (
                  <div className="space-y-2">
                    <div className="p-3 border rounded-md bg-muted text-sm text-muted-foreground">
                      No menu categories found. Create default categories to get started.
                    </div>
                    <Button 
                      type="button"
                      onClick={createDefaultCategories}
                      disabled={isLoading}
                      className="w-full"
                      size="sm"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4 mr-2" />
                      )}
                      Create Default Categories
                    </Button>
                  </div>
                ) : (
                  <Select 
                    value={basicData.category_id} 
                    onValueChange={(value) => setBasicData(prev => ({ ...prev, category_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div>
                <Label htmlFor="prep-time">Prep Time (minutes)</Label>
                <Input
                  id="prep-time"
                  type="number"
                  value={basicData.preparation_time_minutes}
                  onChange={(e) => setBasicData(prev => ({ ...prev, preparation_time_minutes: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="price">Regular Price (€) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={basicData.regular_price}
                onChange={(e) => setBasicData(prev => ({ ...prev, regular_price: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Review & Edit Translations</h3>
              <Button
                onClick={generateTranslations}
                disabled={isTranslating}
                variant="outline"
                size="sm"
              >
                {isTranslating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Languages className="w-4 h-4 mr-2" />
                )}
                Regenerate
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Original Input</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><strong>Name:</strong> {basicData.name}</p>
                <p><strong>Description:</strong> {basicData.description}</p>
                <p><strong>Price:</strong> €{basicData.regular_price}</p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center">
                    <Edit2 className="w-4 h-4 mr-2" />
                    German Translation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="name_de">Name (German)</Label>
                    <Input
                      id="name_de"
                      value={translations.name_de}
                      onChange={(e) => setTranslations(prev => ({ ...prev, name_de: e.target.value }))}
                      placeholder="German name..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="description_de">Description (German)</Label>
                    <Textarea
                      id="description_de"
                      value={translations.description_de}
                      onChange={(e) => setTranslations(prev => ({ ...prev, description_de: e.target.value }))}
                      placeholder="German description..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center">
                    <Edit2 className="w-4 h-4 mr-2" />
                    English Translation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="name_en">Name (English)</Label>
                    <Input
                      id="name_en"
                      value={translations.name_en}
                      onChange={(e) => setTranslations(prev => ({ ...prev, name_en: e.target.value }))}
                      placeholder="English name..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="description_en">Description (English)</Label>
                    <Textarea
                      id="description_en"
                      value={translations.description_en}
                      onChange={(e) => setTranslations(prev => ({ ...prev, description_en: e.target.value }))}
                      placeholder="English description..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="student-price">Student Price (€)</Label>
                <Input
                  id="student-price"
                  type="number"
                  step="0.01"
                  value={finalData.student_price}
                  onChange={(e) => setFinalData(prev => ({ ...prev, student_price: parseFloat(e.target.value) || 0 }))}
                  placeholder={`Default: €${Math.round(basicData.regular_price * 0.8 * 100) / 100}`}
                />
              </div>

              <div>
                <Label htmlFor="display-order">Display Order</Label>
                <Input
                  id="display-order"
                  type="number"
                  value={finalData.display_order}
                  onChange={(e) => setFinalData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div>
              <Label>Dietary Tags</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {DIETARY_TAGS.map(tag => (
                  <Badge
                    key={tag}
                    variant={finalData.dietary_tags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleDietaryTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="available"
                  checked={finalData.is_available}
                  onCheckedChange={(checked) => setFinalData(prev => ({ ...prev, is_available: checked }))}
                />
                <Label htmlFor="available">Available</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="featured"
                  checked={finalData.is_featured}
                  onCheckedChange={(checked) => setFinalData(prev => ({ ...prev, is_featured: checked }))}
                />
                <Label htmlFor="featured">Featured</Label>
              </div>
            </div>

            <div>
              <Label>Ingredients</Label>
              <IngredientSelector
                selectedIngredients={selectedIngredients}
                onIngredientsChange={setSelectedIngredients}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {menuItem ? 'Edit Menu Item' : 'Create New Menu Item'}
          </DialogTitle>
          
          {/* Progress Steps */}
          <div className="flex items-center space-x-2 mt-4">
            {STEP_TITLES.map((title, index) => (
              <div key={index} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                  ${index <= currentStep 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                  }
                `}>
                  {index + 1}
                </div>
                <span className={`ml-2 text-sm ${index === currentStep ? 'font-medium' : 'text-muted-foreground'}`}>
                  {title}
                </span>
                {index < STEP_TITLES.length - 1 && (
                  <ArrowRight className="w-4 h-4 mx-2 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </DialogHeader>

        <div className="mt-6">
          {renderStep()}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            
            {currentStep < 2 ? (
              <Button onClick={handleNext} disabled={isTranslating}>
                {isTranslating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {menuItem ? 'Update' : 'Create'} Menu Item
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}