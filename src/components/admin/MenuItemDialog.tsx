

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
import { Languages } from 'lucide-react';
import { MenuItemIngredientSelector, MenuItemComponent } from './MenuItemIngredientSelector';
import { useTranslationCache } from '@/hooks/useTranslationCache';
import { EnhancedVoiceInput } from '@/components/EnhancedVoiceInput';
import { VoiceFeedback } from '@/components/VoiceFeedback';
import { VoiceStatusComponent } from '@/components/VoiceStatus';
import { useTranslation } from 'react-i18next';
import { translateText } from '@/integrations/deepseek/translate';

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
  image_url: string;
  regular_price: number;
  student_price: number;
  is_featured: boolean;
  is_available: boolean;
  dietary_tags: string[];
  display_order: number;
  ingredients?: string;
  cuisine_type?: string;
  ai_generated_image?: boolean;
  ai_prompt_used?: string;
  image_generation_cost?: number;
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

// Helper function to parse dish and ingredients from text
function parseDishAndIngredients(text: string) {
  // Example: "This is Spaghetti Carbonara and it has eggs, bacon, parmesan, pepper."
  const match = text.match(/this is ([^.,]+) and it has ([^.]*)/i);
  if (match) {
    const dishName = match[1].trim();
    const ingredients = match[2].split(',').map(i => i.trim()).filter(Boolean);
    return { dishName, ingredients };
  }
  // Fallback: try to split by 'and it has'
  const [dishPart, ingPart] = text.split(/and it has/i);
  if (dishPart && ingPart) {
    const dishName = dishPart.replace(/this is/i, '').trim();
    const ingredients = ingPart.split(',').map(i => i.trim()).filter(Boolean);
    return { dishName, ingredients };
  }
  return { dishName: text.trim(), ingredients: [] };
}

export const MenuItemDialog = ({ open, onOpenChange, item, onSave }: MenuItemDialogProps) => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [selectedComponents, setSelectedComponents] = useState<MenuItemComponent[]>([]);
  const [formData, setFormData] = useState<MenuItem>({
    name: '',
    name_de: '',
    name_en: '',
    description: '',
    description_de: '',
    description_en: '',
    category_id: '',
    image_url: '',
    regular_price: 0,
    student_price: 0,
    is_featured: false,
    is_available: true,
    dietary_tags: [],
    display_order: 0,
    ingredients: '',
    cuisine_type: 'fusion',
    ai_generated_image: false,
    ai_prompt_used: '',
    image_generation_cost: 0,
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [useAIGeneration, setUseAIGeneration] = useState(false);
  const [newTag, setNewTag] = useState('');
  const { toast } = useToast();
  const { getTranslation, updateCache, loading: translationLoading, error: translationError } = useTranslationCache();
  const { t, i18n } = useTranslation('admin');
  const [parsing, setParsing] = useState(false);

  // Add state for voice feedback
  const [isListening, setIsListening] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (open) {
      fetchCategories();
      if (item) {
        setFormData({ ...item });
        setUseAIGeneration(item.ai_generated_image || false);
        // For now, we'll just set selectedComponents to a dummy value or fetch them if needed
        // This part of the logic needs to be updated to handle both ingredients and preps
        setSelectedComponents([]); 
      } else {
        setFormData({
          name: '',
          name_de: '',
          name_en: '',
          description: '',
          description_de: '',
          description_en: '',
          category_id: '',
          image_url: '',
          regular_price: 0,
          student_price: 0,
          is_featured: false,
          is_available: true,
          dietary_tags: [],
          display_order: 0,
          ingredients: '',
          cuisine_type: 'fusion',
          ai_generated_image: false,
          ai_prompt_used: '',
          image_generation_cost: 0,
        });
        setSelectedComponents([]);
        setUseAIGeneration(false);
        setGeneratedPrompt('');
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

  const createDefaultCategories = async () => {
    setSaving(true);
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
        title: "Success",
        description: "Default menu categories have been created!",
      });
    } catch (error) {
      console.error('Error creating default categories:', error);
      toast({
        title: "Error",
        description: "Failed to create default categories",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const fetchMenuItemIngredients = async (menuItemId: string) => {
    try {
      const { data, error } = await supabase
        .from('menu_item_ingredients')
        .select(`
          *,
          ingredient:ingredients(
            id, name, unit, category_id, allergens, dietary_properties, cost_per_unit,
            category:ingredient_categories(name)
          )
        `)
        .eq('menu_item_id', menuItemId);

      if (error) throw error;
      // This function is no longer used for ingredient selection, but kept for potential future use
      // For now, it will return an empty array or throw an error if not adapted
      // setSelectedIngredients(data || []); 
    } catch (error) {
      console.error('Error fetching menu item ingredients:', error);
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

  const generatePrompt = () => {
    if (!formData.name || selectedComponents.length === 0) return "";
    
    const category = categories.find(c => c.id === formData.category_id)?.name || "general";
    const ingredientList = selectedComponents.map(si => si.type === 'ingredient' ? si.ingredient.name : si.prep.name).join(', ');
    const cuisineStyle = {
      korean: "Korean style plating, traditional tableware",
      japanese: "Japanese minimalist presentation, wooden serving board",
      chinese: "Chinese restaurant style, ceramic bowls and plates", 
      vietnamese: "Vietnamese fresh presentation, herbs and garnishes",
      fusion: "modern fusion plating, contemporary restaurant style"
    }[formData.cuisine_type || "fusion"];
    
    return `${formData.name}, featuring ${ingredientList}, ${cuisineStyle}, professional food photography, 4K resolution, restaurant quality lighting, appetizing presentation`;
  };

  const handleGenerateImage = async () => {
    if (!formData.name || selectedComponents.length === 0) {
      toast({
        title: "Error",
        description: "Please add ingredients and fill in dish name first",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const ingredientList = selectedComponents.map(si => si.type === 'ingredient' ? si.ingredient.name : si.prep.name).join(', ');
      const { data, error } = await supabase.functions.invoke('generate-menu-image', {
        body: {
          dishName: formData.name,
          ingredients: ingredientList,
          cuisineType: formData.cuisine_type,
          category: categories.find(c => c.id === formData.category_id)?.name,
          menuItemId: formData.id
        }
      });

      if (error) throw error;

      if (data.success) {
        setFormData(prev => ({
          ...prev,
          image_url: data.imageUrl,
          ai_generated_image: true,
          ai_prompt_used: data.prompt,
          image_generation_cost: data.cost
        }));
        toast({
          title: "Success",
          description: `Image generated successfully! Cost: ${data.cost} credits`,
        });
      } else {
        throw new Error(data.error || "Image generation failed");
      }
    } catch (error: any) {
      console.error("Error generating image:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate image",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  // Update generated prompt when form data changes
  useEffect(() => {
    if (formData.name && selectedComponents.length > 0 && useAIGeneration) {
      setGeneratedPrompt(generatePrompt());
    }
  }, [formData.name, selectedComponents, formData.cuisine_type, formData.category_id, useAIGeneration]);

  // Auto-translate when one language field is filled and the other is empty
  useEffect(() => {
    const autoTranslate = async () => {
      if (formData.name_de && !formData.name_en) {
        try {
          const translated = await getTranslation(formData.name_de, 'de', 'en');
          setFormData((prev) => ({ ...prev, name_en: translated }));
        } catch (error) {
          console.warn('Failed to auto-translate name_de to name_en:', error);
        }
      } else if (formData.name_en && !formData.name_de) {
        try {
          const translated = await getTranslation(formData.name_en, 'en', 'de');
          setFormData((prev) => ({ ...prev, name_de: translated }));
        } catch (error) {
          console.warn('Failed to auto-translate name_en to name_de:', error);
        }
      }
      if (formData.description_de && !formData.description_en) {
        try {
          const translated = await getTranslation(formData.description_de, 'de', 'en');
          setFormData((prev) => ({ ...prev, description_en: translated }));
        } catch (error) {
          console.warn('Failed to auto-translate description_de to description_en:', error);
        }
      } else if (formData.description_en && !formData.description_de) {
        try {
          const translated = await getTranslation(formData.description_en, 'en', 'de');
          setFormData((prev) => ({ ...prev, description_de: translated }));
        } catch (error) {
          console.warn('Failed to auto-translate description_en to description_de:', error);
        }
      }
    };
    autoTranslate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.name_de, formData.name_en, formData.description_de, formData.description_en]);

  const handleSave = async () => {
    // Validate required fields
    const errors: string[] = [];
    
    if (categories.length === 0) {
      errors.push("Please create menu categories first");
    }
    
    if (!formData.name && !formData.name_de && !formData.name_en) {
      errors.push("Dish name is required");
    }
    if (!formData.category_id) {
      errors.push("Category is required");
    }
    if (formData.regular_price <= 0) {
      errors.push("Regular price must be greater than 0");
    }
    if (formData.student_price <= 0) {
      errors.push("Student price must be greater than 0");
    }

    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: errors.join(", "),
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Generate ingredients text for legacy compatibility
      const ingredientsText = selectedComponents.map(si => `${si.type === 'ingredient' ? si.ingredient.name : si.prep.name} (${si.quantity}${si.unit})`).join(', ');

      const saveData = {
        name: formData.name_de || formData.name_en || formData.name,
        description: formData.description_de || formData.description_en || formData.description,
        category_id: formData.category_id,
        image_url: formData.image_url || null,
        regular_price: formData.regular_price,
        student_price: formData.student_price,
        is_featured: formData.is_featured,
        is_available: formData.is_available,
        dietary_tags: formData.dietary_tags,
        display_order: formData.display_order,
        ingredients: ingredientsText || null,
        cuisine_type: formData.cuisine_type || 'fusion',
        ai_generated_image: formData.ai_generated_image || false,
        ai_prompt_used: formData.ai_prompt_used || null,
        image_generation_cost: formData.image_generation_cost || 0,
        name_de: formData.name_de,
        name_en: formData.name_en,
        description_de: formData.description_de,
        description_en: formData.description_en,
      };

      let menuItemId = item?.id;

      if (item?.id) {
        const { error } = await supabase
          .from('menu_items')
          .update(saveData)
          .eq('id', item.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('menu_items')
          .insert([saveData])
          .select('id')
          .single();
        if (error) throw error;
        menuItemId = data.id;
      }

      // Save ingredient relationships
      if (menuItemId) {
        // Delete existing ingredients
        await supabase
          .from('menu_item_ingredients')
          .delete()
          .eq('menu_item_id', menuItemId);

        // Insert new ingredients
        if (selectedComponents.length > 0) {
          const ingredientData = selectedComponents.map(si => ({
            menu_item_id: menuItemId,
            ingredient_id: si.type === 'ingredient' ? si.ingredient.id : null,
            prep_id: si.type === 'prep' ? si.prep.id : null,
            quantity: si.quantity,
            unit: si.unit,
            notes: si.notes || null
          }));

          const { error: ingredientError } = await supabase
            .from('menu_item_ingredients')
            .insert(ingredientData);
          
          if (ingredientError) throw ingredientError;
        }
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

  // Handler for voice input result
  const handleVoiceResult = (text: string) => {
    setParsing(true);
    const { dishName, ingredients } = parseDishAndIngredients(text);
    setFormData(prev => ({ ...prev, name_de: dishName }));
    
    // Create placeholder selected ingredients for parsed ingredients
    const parsedComponents: MenuItemComponent[] = ingredients.map(name => ({
      type: 'ingredient',
      ingredient: {
        id: '',
        name,
        name_de: name,
        name_en: name,
        unit: 'piece',
        cost_per_unit: 0,
      },
      quantity: 1,
      unit: 'piece',
    }));
    
    setSelectedComponents(parsedComponents);
    setParsing(false);
    
    toast({
      title: "Speech Parsed",
      description: `Recognized "${dishName}" with ${ingredients.length} ingredients. Please review and select proper ingredients.`,
    });
  };

  // Handler to receive voice state from VoiceInput
  const handleVoiceState = (state: {
    isListening: boolean;
    isConnected: boolean;
    audioLevel: number;
    confidence: number;
    duration: number;
  }) => {
    setIsListening(state.isListening);
    setIsConnected(state.isConnected);
    setAudioLevel(state.audioLevel);
    setConfidence(state.confidence);
    setDuration(state.duration);
  };

  const calculateTotalCost = () => {
    return selectedComponents.reduce((total, item) => {
      if (item.type === 'ingredient') {
        return total + (item.ingredient.cost_per_unit || 0) * item.quantity;
      } else if (item.type === 'prep') {
        // For now, assume cost_per_batch is for the batch_yield, and quantity is in grams/ml
        // We'll just add cost_per_batch * (quantity / 100) as a placeholder
        return total + (item.prep.cost_per_batch * (item.quantity / 100));
      }
      return total;
    }, 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{item?.id ? t('menu.form.editTitle') : t('menu.form.createNew')}</DialogTitle>
        </DialogHeader>
        <form id="menu-item-form" className="flex-1 overflow-y-auto px-6 pb-4 space-y-8" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          {/* AI Dictation Section */}
          <section>
            <h2 className="font-semibold text-lg mb-2">{t('menu.form.aiDictation')}</h2>
            <EnhancedVoiceInput
              language={i18n.language === 'de' ? 'de' : 'en'}
              onResult={handleVoiceResult}
              label={t('menu.form.aiDictationLabel')}
              model="nova-2"
            />
            <VoiceFeedback
              isListening={isListening}
              isConnected={isConnected}
              audioLevel={audioLevel}
              confidence={confidence}
              duration={duration}
            />
            <VoiceStatusComponent
              status={isListening ? 'listening' : isConnected ? 'connected' : 'ready'}
              error={null}
              retryCount={0}
              connectionAttempts={0}
              isRetrying={false}
              canRetry={true}
              canConnect={true}
              isOffline={false}
              isTimeout={false}
              onRetry={() => {}}
              onClearError={() => {}}
            />
            {parsing && <div className="text-sm text-muted-foreground">{t('menu.form.parsing')}</div>}
          </section>

          {/* Basic Info Section */}
          <section>
            <h2 className="font-semibold text-lg mb-2">{t('menu.form.basicInfo')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name fields */}
              <div className="space-y-2">
                <Label htmlFor="name">{t('menu.form.name')}</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder={t('menu.form.namePlaceholder')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name_de">{t('menu.form.nameGerman')}</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="name_de"
                    value={formData.name_de}
                    onChange={(e) => setFormData(prev => ({ ...prev, name_de: e.target.value }))}
                    placeholder={t('menu.form.nameGermanPlaceholder')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Translate from English"
                    onClick={async () => {
                      if (!formData.name_en) return;
                      try {
                        const translated = await translateText({ text: formData.name_en, sourceLang: 'en', targetLang: 'de' });
                        setFormData(prev => ({ ...prev, name_de: translated }));
                        toast({ title: t('translation.success'), description: t('translation.translatedToGerman') || 'Translated to German.' });
                      } catch (err) {
                        toast({ title: t('translation.error'), description: t('translation.error') || 'Translation failed.', variant: 'destructive' });
                      }
                    }}
                  >
                    <Languages className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name_en">{t('menu.form.nameEnglish')}</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="name_en"
                    value={formData.name_en}
                    onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
                    placeholder={t('menu.form.nameEnglishPlaceholder')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Translate from German"
                    onClick={async () => {
                      if (!formData.name_de) return;
                      try {
                        const translated = await translateText({ text: formData.name_de, sourceLang: 'de', targetLang: 'en' });
                        setFormData(prev => ({ ...prev, name_en: translated }));
                        toast({ title: t('translation.success'), description: t('translation.translatedToEnglish') || 'Translated to English.' });
                      } catch (err) {
                        toast({ title: t('translation.error'), description: t('translation.error') || 'Translation failed.', variant: 'destructive' });
                      }
                    }}
                  >
                    <Languages className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="category">{t('menu.form.category')}</Label>
                {categories.length === 0 ? (
                  <div className="space-y-2">
                    <div className="p-3 border rounded-md bg-muted text-sm text-muted-foreground">
                      No menu categories found. Create default categories to get started.
                    </div>
                    <Button 
                      type="button"
                      onClick={createDefaultCategories}
                      disabled={saving}
                      className="w-full"
                      size="sm"
                    >
                      {saving ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      ) : (
                        <Plus className="w-4 h-4 mr-2" />
                      )}
                      Create Default Categories
                    </Button>
                  </div>
                ) : (
                  <Select value={formData.category_id} onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}>
                    <SelectTrigger><SelectValue placeholder={t('menu.form.selectCategoryPlaceholder')} /></SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              {/* Description fields */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">{t('menu.form.description')}</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder={t('menu.form.descriptionPlaceholder')} rows={2} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description_de">{t('menu.form.descriptionGerman')}</Label>
                <Textarea id="description_de" value={formData.description_de} onChange={(e) => setFormData(prev => ({ ...prev, description_de: e.target.value }))} placeholder={t('menu.form.descriptionGermanPlaceholder')} rows={2} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description_en">{t('menu.form.descriptionEnglish')}</Label>
                <Textarea id="description_en" value={formData.description_en} onChange={(e) => setFormData(prev => ({ ...prev, description_en: e.target.value }))} placeholder={t('menu.form.descriptionEnglishPlaceholder')} rows={2} />
              </div>
            </div>
          </section>

          {/* Ingredients Section */}
          <section>
            <h2 className="font-semibold text-lg mb-2">{t('menu.form.ingredients')}</h2>
            <MenuItemIngredientSelector selectedComponents={selectedComponents} onComponentsChange={setSelectedComponents} />
          </section>

          {/* Pricing Section */}
          <section>
            <h2 className="font-semibold text-lg mb-2">{t('menu.form.pricing')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="regular_price">{t('menu.form.regularPrice')}</Label>
                <Input id="regular_price" type="number" step="0.01" value={formData.regular_price} onChange={(e) => setFormData(prev => ({ ...prev, regular_price: parseFloat(e.target.value) || 0 }))} placeholder={t('menu.form.regularPricePlaceholder')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="student_price">{t('menu.form.studentPrice')}</Label>
                <Input id="student_price" type="number" step="0.01" value={formData.student_price} onChange={(e) => setFormData(prev => ({ ...prev, student_price: parseFloat(e.target.value) || 0 }))} placeholder={t('menu.form.studentPricePlaceholder')} />
              </div>
            </div>
            <div className="mt-4">
              <Label>{t('menu.form.totalCost')}</Label>
              <p className="text-lg font-bold">
                {calculateTotalCost().toFixed(2)} €
              </p>
            </div>
          </section>

          {/* Image Upload Section */}
          <section>
            <h2 className="font-semibold text-lg mb-2">{t('menu.form.imageUpload')}</h2>
            <div className="space-y-4">
              <Label>{t('menu.form.imageUploadMethod')}</Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={!useAIGeneration ? "default" : "outline"}
                  onClick={() => setUseAIGeneration(false)}
                  size="sm"
                >
                  📁 {t('menu.form.uploadFile')}
                </Button>
                <Button
                  type="button"
                  variant={useAIGeneration ? "default" : "outline"}
                  onClick={() => setUseAIGeneration(true)}
                  size="sm"
                >
                  🎨 {t('menu.form.aiGenerate')}
                </Button>
              </div>

              {!useAIGeneration ? (
                <div className="space-y-2">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                  {uploading && <p className="text-sm text-muted-foreground">{t('menu.form.uploading')}</p>}
                </div>
              ) : (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <div className="space-y-2">
                    <Label>{t('menu.form.aiImageGeneration')}</Label>
                    {generatedPrompt && (
                      <div className="p-3 bg-background rounded border">
                        <p className="text-sm font-medium">{t('menu.form.generatedPrompt')}:</p>
                        <p className="text-sm text-muted-foreground mt-1">{generatedPrompt}</p>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    type="button"
                    onClick={handleGenerateImage}
                    disabled={generating || !formData.name || selectedComponents.length === 0}
                    className="w-full"
                  >
                    {generating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        {t('menu.form.generatingImage')}
                      </>
                    ) : (
                      t('menu.form.generateProfessionalFoodImage')
                    )}
                  </Button>
                  
                  <p className="text-xs text-muted-foreground">
                    {t('menu.form.imageCost')}
                  </p>
                </div>
              )}

              {formData.image_url && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label>{t('menu.form.preview')}</Label>
                    {formData.ai_generated_image && (
                      <Badge variant="secondary" className="text-xs">{t('menu.form.aiGenerated')}</Badge>
                    )}
                  </div>
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-full max-w-sm h-48 object-cover rounded-md border"
                  />
                  {useAIGeneration && formData.image_url && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateImage}
                      disabled={generating}
                      className="mt-2"
                    >
                      🔄 {t('menu.form.regenerate')}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Dietary Tags */}
          <section>
            <h2 className="font-semibold text-lg mb-2">{t('menu.form.dietaryTags')}</h2>
            <div className="space-y-2">
              <Label>{t('menu.form.dietaryTags')}</Label>
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
                    <SelectValue placeholder={t('menu.form.addDietaryTagPlaceholder')} />
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
                    placeholder={t('menu.form.customTagPlaceholder')}
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
          </section>

          {/* Availability Section */}
          <section>
            <h2 className="font-semibold text-lg mb-2">{t('menu.form.availability')}</h2>
            <div className="flex items-center gap-4">
              <Switch checked={formData.is_available} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_available: checked }))} />
              <span>{t('menu.form.available')}</span>
              <Switch checked={formData.is_featured} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))} />
              <span>{t('menu.form.featured')}</span>
            </div>
          </section>
        </form>
        {/* Sticky Footer */}
        <div className="mt-auto bg-background/95 backdrop-blur-sm border-t shadow-lg p-4 flex justify-end gap-2 z-20">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t('menu.form.cancel')}
          </Button>
          <Button 
            type="submit" 
            form="menu-item-form" 
            disabled={saving || !formData.name || !formData.category_id || categories.length === 0}
            onClick={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                {t('menu.form.saving')}
              </>
            ) : (
              t('menu.form.save')
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
