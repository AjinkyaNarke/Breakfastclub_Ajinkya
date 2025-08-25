
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
import { SmartIngredientSelector, SmartComponent } from './SmartIngredientSelector';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Wand2 } from 'lucide-react';
import { useTranslationCache } from '@/hooks/useTranslationCache';
import { EnhancedVoiceInput } from '@/components/EnhancedVoiceInput';
import { useRecipeCache } from '@/hooks/useRecipeCache';
import { QuickTranslate } from '@/components/TranslationButton';
import { parseEnhancedVoiceInput } from '@/utils/enhancedSpeechParsing';
import { EnhancedCostBreakdown, QuickCostSummary } from '@/components/EnhancedCostBreakdown';
import { 
  calculateEnhancedRecipeCost, 
  Component,
  EnhancedPricingCalculation,
  Ingredient as EnhancedIngredient
} from '@/utils/enhancedCostCalculation';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  regular_price: number;
  student_price: number;
  category_id: string;
  is_featured: boolean;
  is_available: boolean;
  display_order: number;
  dietary_tags: string[];
  cuisine_type: string;
  image_url?: string;
  name_de?: string;
  name_en?: string;
  description_de?: string;
  description_en?: string;
}

interface SelectedIngredient {
  ingredient_id: string;
  quantity: number;
  unit: string;
  notes?: string;
  ingredient: any;
}

interface EnhancedMenuItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: MenuItem | null;
  onSave: () => void;
}

// Enhanced AI parsing function for dish information
function parseVoiceInput(text: string) {
  const lowerText = text.toLowerCase();
  
  // Initialize result object
  const result = {
    dishName: '',
    description: '',
    ingredients: [] as string[],
    category: '',
    cuisineType: ''
  };

  // Common dish names and their categories for better recognition
  const dishDatabase = {
    // Breakfast items
    'pancakes': { category: 'breakfast', cuisine: 'american' },
    'pfannkuchen': { category: 'breakfast', cuisine: 'german' },
    'eggs benedict': { category: 'breakfast', cuisine: 'american' },
    'french toast': { category: 'breakfast', cuisine: 'french' },
    'waffles': { category: 'breakfast', cuisine: 'belgian' },
    'croissant': { category: 'breakfast', cuisine: 'french' },
    'bagel': { category: 'breakfast', cuisine: 'american' },
    
    // German dishes
    'schnitzel': { category: 'main course', cuisine: 'german' },
    'wiener schnitzel': { category: 'main course', cuisine: 'austrian' },
    'spätzle': { category: 'side dish', cuisine: 'german' },
    'spaetzle': { category: 'side dish', cuisine: 'german' },
    'bratwurst': { category: 'main course', cuisine: 'german' },
    'currywurst': { category: 'main course', cuisine: 'german' },
    'sauerbraten': { category: 'main course', cuisine: 'german' },
    'rouladen': { category: 'main course', cuisine: 'german' },
    'kassler': { category: 'main course', cuisine: 'german' },
    
    // Asian dishes
    'pad thai': { category: 'main course', cuisine: 'thai' },
    'pad dye': { category: 'main course', cuisine: 'thai' }, // Common mispronunciation
    'tom yum': { category: 'soup', cuisine: 'thai' },
    'green curry': { category: 'main course', cuisine: 'thai' },
    'pho': { category: 'soup', cuisine: 'vietnamese' },
    'ramen': { category: 'soup', cuisine: 'japanese' },
    'sushi': { category: 'appetizer', cuisine: 'japanese' },
    'stir fry': { category: 'main course', cuisine: 'asian' },
    
    // European dishes
    'pasta carbonara': { category: 'main course', cuisine: 'italian' },
    'risotto': { category: 'main course', cuisine: 'italian' },
    'pizza': { category: 'main course', cuisine: 'italian' },
    'quiche': { category: 'main course', cuisine: 'french' },
    'paella': { category: 'main course', cuisine: 'spanish' },
    
    // Salads and lighter fare
    'caesar salad': { category: 'salad', cuisine: 'american' },
    'greek salad': { category: 'salad', cuisine: 'greek' },
    'caprese': { category: 'salad', cuisine: 'italian' },
    'soup': { category: 'soup', cuisine: 'general' },
    'sandwich': { category: 'light meal', cuisine: 'general' }
  };

  // Extract dish name - enhanced patterns with dish recognition
  let foundDish = '';
  let dishInfo = null;
  
  // First, look for known dishes in the text
  for (const [dishName, info] of Object.entries(dishDatabase)) {
    const dishPattern = new RegExp(`\\b${dishName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (dishPattern.test(text)) {
      foundDish = dishName;
      dishInfo = info;
      break;
    }
  }
  
  if (foundDish) {
    result.dishName = foundDish.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
    result.category = dishInfo?.category || '';
    result.cuisineType = dishInfo?.cuisine || '';
  } else {
    // Fallback to pattern matching
    const namePatterns = [
      /(?:this is|we have|today we're making|i want to add|create|das ist|wir haben|heute machen wir|ich möchte hinzufügen)\s+([^.,;]+?)(?:\s+(?:with|and|that|which|mit|und|das|die))/i,
      /(?:this is|we have|today we're making|i want to add|create|das ist|wir haben|heute machen wir|ich möchte hinzufügen)\s+([^.,;]+)/i,
      /^([^.,;]+?)(?:\s+(?:with|and|that|which|mit|und|das|die))/i
    ];
    
    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match) {
        result.dishName = match[1].trim();
        break;
      }
    }
    
    // If no dish name found, use first few words
    if (!result.dishName) {
      result.dishName = text.split(/\s+/).slice(0, 3).join(' ');
    }
    
    // Proper case the dish name
    result.dishName = result.dishName.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }

  // Extract ingredients - look for various patterns
  const ingredientPatterns = [
    /(?:with|has|contains|includes|made with|using)\s+([^.,;]+)/gi,
    /(?:ingredients|components):\s*([^.,;]+)/gi,
    /(?:and it has|it contains)\s+([^.,;]+)/gi
  ];
  
  const allIngredients = new Set<string>();
  
  for (const pattern of ingredientPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const ingredientText = match[1];
      // Split by common separators and clean up
      const ingredients = ingredientText
        .split(/,|\sand\s|\sor\s|\splus\s/)
        .map(ing => ing.trim().replace(/^(and|or|with|plus)\s+/i, ''))
        .filter(ing => ing.length > 0 && ing.length < 30);
      
      ingredients.forEach(ing => allIngredients.add(ing));
    }
  }
  
  result.ingredients = Array.from(allIngredients);

  // Try to infer category from dish name and ingredients
  const categoryKeywords = {
    'appetizer': ['appetizer', 'starter', 'snack', 'tapas', 'bruschetta', 'dip'],
    'main': ['main', 'entree', 'pasta', 'pizza', 'burger', 'steak', 'chicken', 'fish', 'rice', 'noodles'],
    'dessert': ['dessert', 'cake', 'ice cream', 'chocolate', 'sweet', 'pie', 'cookie', 'pastry'],
    'beverage': ['drink', 'juice', 'coffee', 'tea', 'smoothie', 'cocktail', 'beer', 'wine'],
    'salad': ['salad', 'greens', 'lettuce'],
    'soup': ['soup', 'broth', 'bisque', 'chowder']
  };
  
  const fullText = (result.dishName + ' ' + result.ingredients.join(' ')).toLowerCase();
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => fullText.includes(keyword))) {
      result.category = category;
      break;
    }
  }

  // Try to infer cuisine type
  const cuisineKeywords = {
    'italian': ['pasta', 'pizza', 'risotto', 'carbonara', 'bolognese', 'pesto', 'mozzarella', 'parmesan'],
    'asian': ['noodles', 'rice', 'soy sauce', 'ginger', 'garlic', 'sesame', 'tofu', 'kimchi'],
    'mexican': ['taco', 'burrito', 'salsa', 'guacamole', 'jalapeño', 'cilantro', 'lime'],
    'german': ['schnitzel', 'bratwurst', 'sauerkraut', 'pretzel', 'beer'],
    'korean': ['korean', 'kimchi', 'bulgogi', 'bibimbap', 'gochujang'],
    'indian': ['curry', 'masala', 'turmeric', 'cumin', 'coriander', 'naan'],
    'mediterranean': ['olive oil', 'feta', 'olives', 'hummus', 'tzatziki']
  };
  
  for (const [cuisine, keywords] of Object.entries(cuisineKeywords)) {
    if (keywords.some(keyword => fullText.includes(keyword))) {
      result.cuisineType = cuisine;
      break;
    }
  }

  // Generate a description based on the parsed information
  if (result.ingredients.length > 0) {
    result.description = `Delicious ${result.dishName.toLowerCase()} made with ${result.ingredients.join(', ')}.`;
  } else {
    result.description = `Traditional ${result.dishName.toLowerCase()} prepared with care.`;
  }

  return result;
}

export const EnhancedMenuItemDialog = ({ open, onOpenChange, item, onSave }: EnhancedMenuItemDialogProps) => {
  const { t, i18n } = useTranslation('admin');
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedComponents, setSelectedComponents] = useState<SmartComponent[]>([]);
  const { getTranslation, updateCache, loading: translationLoading, error: translationError } = useTranslationCache();
  const { saveRecipe, getRecipe, clearRecipe } = useRecipeCache();
  const [parsing, setParsing] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [showCostBreakdown, setShowCostBreakdown] = useState(false);
  const [preparationTime, setPreparationTime] = useState(15); // minutes

  // Add new state for multi-language fields
  const [formData, setFormData] = useState({
    name: '',
    name_de: '',
    name_en: '',
    description: '',
    description_de: '',
    description_en: '',
    regular_price: 0,
    student_price: 0,
    category_id: '',
    is_featured: false,
    is_available: true,
    display_order: 0,
    cuisine_type: 'fusion',
    image_url: '',
  });

  // On item load, populate multi-language fields
  useEffect(() => {
    fetchCategories();
    if (item) {
      setFormData({
        ...formData,
        name: item.name || '',
        name_de: item.name_de || '',
        name_en: item.name_en || '',
        description: item.description || '',
        description_de: item.description_de || '',
        description_en: item.description_en || '',
        regular_price: item.regular_price || 0,
        student_price: item.student_price || 0,
        category_id: item.category_id || '',
        is_featured: item.is_featured || false,
        is_available: item.is_available !== false,
        display_order: item.display_order || 0,
        cuisine_type: item.cuisine_type || 'fusion',
        image_url: item.image_url || '',
      });
      fetchMenuItemIngredients(item.id);
    } else {
      setFormData({
        name: '',
        name_de: '',
        name_en: '',
        description: '',
        description_de: '',
        description_en: '',
        regular_price: 0,
        student_price: 0,
        category_id: '',
        is_featured: false,
        is_available: true,
        display_order: 0,
        cuisine_type: 'fusion',
        image_url: '',
      });
      setSelectedComponents([]);
    }
  }, [item, open]);

  // Auto-translate when one language field is filled and the other is empty
  useEffect(() => {
    const autoTranslate = async () => {
      if (formData.name_de && !formData.name_en) {
        try {
          const translated = await getTranslation(formData.name_de, 'de', 'en');
          setFormData((prev) => ({ ...prev, name_en: translated }));
        } catch {}
      } else if (formData.name_en && !formData.name_de) {
        try {
          const translated = await getTranslation(formData.name_en, 'en', 'de');
          setFormData((prev) => ({ ...prev, name_de: translated }));
        } catch {}
      }
      if (formData.description_de && !formData.description_en) {
        try {
          const translated = await getTranslation(formData.description_de, 'de', 'en');
          setFormData((prev) => ({ ...prev, description_en: translated }));
        } catch {}
      } else if (formData.description_en && !formData.description_de) {
        try {
          const translated = await getTranslation(formData.description_en, 'en', 'de');
          setFormData((prev) => ({ ...prev, description_de: translated }));
        } catch {}
      }
    };
    autoTranslate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.name_de, formData.name_en, formData.description_de, formData.description_en]);

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

  const fetchMenuItemIngredients = async (menuItemId: string) => {
    try {
      const { data, error } = await supabase
        .from('menu_item_ingredients')
        .select(`
          ingredient_id, quantity, unit, notes,
          ingredient:ingredients(
            id, name, unit, category_id, allergens, dietary_properties,
            seasonal_availability, cost_per_unit,
            category:ingredient_categories(name)
          ),
          prep:preps(
            id, name, batch_yield, cost_per_batch, notes
          )
        `)
        .eq('menu_item_id', menuItemId);

      if (error) throw error;
      
      // Transform the data to match SmartComponent structure
      const transformedData: SmartComponent[] = (data || []).map(item => {
        if (item.ingredient) {
          return {
            type: 'ingredient',
            ingredient: item.ingredient,
            quantity: item.quantity,
            unit: item.unit,
            notes: item.notes,
          };
        } else if (item.prep) {
          return {
            type: 'prep',
            prep: item.prep,
            quantity: item.quantity,
            unit: item.unit,
          };
        }
        return null; // Should not happen
      }).filter(item => item !== null) as SmartComponent[];
      
      setSelectedComponents(transformedData);
    } catch (error) {
      console.error('Error fetching menu item ingredients:', error);
    }
  };

  // Fix the type conversions in calculateEnhancedCost:
  const calculateEnhancedCost = (): EnhancedPricingCalculation => {
    // Convert SmartComponent to Component for the enhanced calculation
    const components: Component[] = selectedComponents.map(item => {
      if (item.type === 'ingredient') {
        return {
          type: 'ingredient',
          ingredient: {
            id: item.ingredient.id,
            name: item.ingredient.name,
            name_de: (item.ingredient as any).name_de || item.ingredient.name,
            name_en: (item.ingredient as any).name_en || item.ingredient.name,
            unit: item.ingredient.unit,
            cost_per_unit: item.ingredient.cost_per_unit || 0,
            category: item.ingredient.category,
          },
          quantity: item.quantity,
          unit: item.unit,
        };
      } else {
        return {
          type: 'prep',
          prep: {
            id: item.prep.id,
            name: item.prep.name,
            name_de: item.prep.name_de,
            name_en: item.prep.name_en,
            batch_yield: item.prep.batch_yield,
            cost_per_batch: item.prep.cost_per_batch,
            notes: item.prep.notes,
          },
          quantity: item.quantity,
          unit: item.unit,
        };
      }
    });

    return calculateEnhancedRecipeCost(components, 15, 1); // 15 min prep time, 1 serving
  };

  const calculateProfitMargin = (price: number) => {
    const cost = calculateEnhancedCost().totalFoodCost;
    if (price === 0) return 0;
    return ((price - cost) / price * 100);
  };

  // Fix the extractDietaryProperties function to use the local interface:
  const extractDietaryProperties = () => {
    const allProperties = new Set<string>();
    const allAllergens = new Set<string>();

    selectedComponents.forEach(item => {
      if (item.type === 'ingredient') {
        // Use the local Ingredient interface for dietary properties
        const ingredient = item.ingredient as any;
        if (ingredient.dietary_properties) {
          ingredient.dietary_properties.forEach((prop: string) => allProperties.add(prop));
        }
        if (ingredient.allergens) {
          ingredient.allergens.forEach((allergen: string) => allAllergens.add(allergen));
        }
      }
    });

    return {
      dietary_properties: Array.from(allProperties),
      allergens: Array.from(allAllergens)
    };
  };

  // Validation function
  const validateForm = (data: typeof formData) => {
    const errors: { [key: string]: string } = {};
    if (!data.name?.trim() && !data.name_de?.trim() && !data.name_en?.trim()) {
      errors.name = 'Dish name is required';
    }
    if (!data.category_id) {
      errors.category_id = 'Category is required';
    }
    if (!data.description?.trim() && !data.description_de?.trim() && !data.description_en?.trim()) {
      errors.description = 'Description is required';
    }
    if (isNaN(data.regular_price) || data.regular_price <= 0) {
      errors.regular_price = 'Regular price must be greater than 0';
    }
    if (isNaN(data.student_price) || data.student_price < 0) {
      errors.student_price = 'Student price must be 0 or greater';
    }
    return errors;
  };

  // On save, update all language fields in Supabase
  const handleSave = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    const errors = validateForm(formData);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast({
        title: 'Validation Error',
        description: Object.values(errors).join(', '),
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    try {
      const dietaryTags = extractDietaryProperties();
      
      const saveData = {
        ...formData,
        name: formData.name_de || formData.name_en || formData.name,
        description: formData.description_de || formData.description_en || formData.description,
        name_de: formData.name_de,
        name_en: formData.name_en,
        description_de: formData.description_de,
        description_en: formData.description_en,
        dietary_tags: dietaryTags.dietary_properties,
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

      // Save ingredients
      if (menuItemId) {
        // Delete existing ingredients
        await supabase
          .from('menu_item_ingredients')
          .delete()
          .eq('menu_item_id', menuItemId);

        // Insert new ingredients
        if (selectedComponents.length > 0) {
          const ingredientData = selectedComponents.map(item => ({
            menu_item_id: menuItemId,
            ingredient_id: item.type === 'ingredient' ? item.ingredient.id : null,
            prep_id: item.type === 'prep' ? item.prep.id : null,
            quantity: item.quantity,
            unit: item.unit,
          }));

          const { error: ingredientError } = await supabase
            .from('menu_item_ingredients')
            .insert(ingredientData);

          if (ingredientError) throw ingredientError;
        }
      }

      // Save recipe to cache for reuse
      saveRecipe({
        name: formData.name,
        name_de: formData.name_de,
        name_en: formData.name_en,
        description: formData.description,
        description_de: formData.description_de,
        description_en: formData.description_en,
        ingredients: selectedComponents,
        category_id: formData.category_id,
        regular_price: formData.regular_price,
        student_price: formData.student_price,
      });

      toast({
        title: item?.id ? 'Menu Item Updated' : 'Menu Item Created',
        description: item?.id ? 'Menu item has been successfully updated.' : 'Menu item has been successfully created.',
      });
      setFieldErrors({});
      setFormData({
        name: '', name_de: '', name_en: '', description: '', description_de: '', description_en: '',
        regular_price: 0, student_price: 0, category_id: '', is_featured: false, is_available: true, display_order: 0, cuisine_type: 'fusion', image_url: '',
      });
      setSelectedComponents([]);
      onOpenChange(false);
      onSave(); // Refresh menu list
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast({
        title: item?.id ? 'Update Failed' : 'Creation Failed',
        description: item?.id ? 'Failed to update menu item. Please try again.' : 'Failed to create menu item. Please try again.',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handler for voice input result
  // Auto-create ingredients that don't exist
  const autoCreateIngredients = async (ingredientNames: string[]) => {
    const createdIngredients: any[] = [];
    
    for (const name of ingredientNames) {
      try {
        // First check if ingredient already exists
        const { data: existing } = await supabase
          .from('ingredients')
          .select('*')
          .ilike('name', name)
          .limit(1);
        
        if (existing && existing.length > 0) {
          createdIngredients.push(existing[0]);
          continue;
        }
        
        // Create new ingredient
        const { data: newIngredient, error } = await supabase
          .from('ingredients')
          .insert([{
            name: name,
            category_id: null, // Will be set later or by user
            unit: 'piece',
            cost_per_unit: 0,
            allergens: [],
            dietary_properties: [],
            description: `Auto-created from voice input`
          }])
          .select('*')
          .single();
        
        if (error) {
          console.error(`Error creating ingredient ${name}:`, error);
          continue;
        }
        
        createdIngredients.push(newIngredient);
      } catch (error) {
        console.error(`Error processing ingredient ${name}:`, error);
      }
    }
    
    return createdIngredients;
  };

  const handleVoiceResult = async (text: string, detectedLanguage?: string) => {
    setParsing(true);
    
    try {
      // Use enhanced parsing for cost analysis
      const enhancedParsed = parseEnhancedVoiceInput(text);
      const parsed = parseVoiceInput(text); // Keep original for compatibility
      
      // Determine which language fields to fill based on detected language
      const isGerman = detectedLanguage === 'de';
      const isEnglish = detectedLanguage === 'en';
      
      // Update form data with parsed information - fill only the appropriate language fields
      if (isGerman) {
        // Fill German fields only
        setFormData(prev => ({
          ...prev,
          name: parsed.dishName,
          name_de: parsed.dishName,
          description: parsed.description,
          description_de: parsed.description,
          cuisine_type: parsed.cuisineType
        }));
        
        toast({
          title: 'German input processed',
          description: 'Filled German language fields. Use translate buttons to convert to English.',
          duration: 4000,
        });
      } else if (isEnglish) {
        // Fill English fields only
        setFormData(prev => ({
          ...prev,
          name: parsed.dishName,
          name_en: parsed.dishName,
          description: parsed.description,
          description_en: parsed.description,
          cuisine_type: parsed.cuisineType
        }));
        
        toast({
          title: 'English input processed',
          description: 'Filled English language fields. Use translate buttons to convert to German.',
          duration: 4000,
        });
      } else {
        // Language unknown or detection disabled - fill all fields as before
        setFormData(prev => ({
          ...prev,
          name: parsed.dishName,
          name_de: parsed.dishName,
          name_en: parsed.dishName,
          description: parsed.description,
          description_de: parsed.description,
          description_en: parsed.description,
          cuisine_type: parsed.cuisineType
        }));
      }

      // Try to find matching category
      if (parsed.category && categories.length > 0) {
        const matchingCategory = categories.find(cat => 
          cat.name.toLowerCase().includes(parsed.category.toLowerCase()) ||
          parsed.category.toLowerCase().includes(cat.name.toLowerCase())
        );
        if (matchingCategory) {
          setFormData(prev => ({ ...prev, category_id: matchingCategory.id }));
        }
      }
      
      // Auto-create ingredients and create selected ingredients list
      if (parsed.ingredients.length > 0) {
        const createdIngredients = await autoCreateIngredients(parsed.ingredients);
        
        const parsedIngredients: SmartComponent[] = createdIngredients.map(ingredient => ({
          type: 'ingredient',
          ingredient: ingredient,
          quantity: 1,
          unit: ingredient.unit,
        }));
        
        setSelectedComponents(parsedIngredients);
      }
      
      // Calculate costs if enhanced parsing found ingredient pricing
      if (enhancedParsed.ingredients.length > 0 && enhancedParsed.totalEstimatedCost > 0) {
        const calculation = calculateEnhancedCost();
        
        // Generate cost optimization suggestions
        // const optimizationSuggestions = generateCostOptimizationSuggestions(
        //   enhancedParsed.ingredients,
        //   enhancedParsed.totalEstimatedCost
        // );
        
        // Update preparation time if detected
        if (enhancedParsed.preparationTime) {
          setPreparationTime(enhancedParsed.preparationTime);
        }
        
        // Show cost breakdown
        setShowCostBreakdown(true);
        
        // Update suggested prices in form data
        setFormData(prev => ({
          ...prev,
          regular_price: calculation.suggestedPrices.foodCost30,
          student_price: Math.round(calculation.suggestedPrices.foodCost30 * 0.8 * 100) / 100 // 20% student discount
        }));
        
        toast({
          title: "Cost Analysis Complete",
          description: `Estimated food cost: €${enhancedParsed.totalEstimatedCost.toFixed(2)}. Suggested price: €${calculation.suggestedPrices.foodCost30.toFixed(2)}`,
          duration: 5000,
        });
      }
      
      // Clear any previous validation errors since we've populated the form
      setFieldErrors({});
      
      toast({
        title: "AI Parsing Complete", 
        description: `Recognized "${parsed.dishName}" with ${parsed.ingredients.length} ingredients. Form has been auto-populated and ingredients created as needed.`,
      });
      
    } catch (error) {
      console.error('Error parsing voice input:', error);
      toast({
        title: "Parsing Error",
        description: "Unable to parse speech input. Please try again or enter information manually.",
        variant: "destructive"
      });
    } finally {
      setParsing(false);
    }
  };

  const handleCopyFromCache = async () => {
    const cached = getRecipe();
    if (cached) {
      let name = cached.name;
      let description = cached.description;
      // Auto-translate if needed
      if (i18n.language === 'de' && !cached.name_de && cached.name_en) {
        name = await getTranslation(cached.name_en, 'en', 'de');
      } else if (i18n.language === 'en' && !cached.name_en && cached.name_de) {
        name = await getTranslation(cached.name_de, 'de', 'en');
      }
      if (i18n.language === 'de' && !cached.description_de && cached.description_en) {
        description = await getTranslation(cached.description_en, 'en', 'de');
      } else if (i18n.language === 'en' && !cached.description_en && cached.description_de) {
        description = await getTranslation(cached.description_de, 'de', 'en');
      }
      setFormData(prev => ({
        ...prev,
        name: name,
        name_de: cached.name_de,
        name_en: cached.name_en,
        description: description,
        description_de: cached.description_de,
        description_en: cached.description_en,
        category_id: cached.category_id,
        regular_price: cached.regular_price,
        student_price: cached.student_price,
      }));
      setSelectedComponents(cached.ingredients || []);
      toast({
        title: t('menu.form.copiedFromCache') || 'Copied from cache',
        description: t('menu.form.copiedFromCacheDesc') || 'Recipe fields have been filled from the last saved recipe.',
      });
    } else {
      toast({
        title: t('menu.form.noCache') || 'No cached recipe',
        description: t('menu.form.noCacheDesc') || 'No recipe found in cache.',
        variant: 'destructive',
      });
    }
  };

  const totalCost = calculateEnhancedCost().totalFoodCost;
  const regularMargin = calculateProfitMargin(formData.regular_price);
  const studentMargin = calculateProfitMargin(formData.student_price);

  // Add state for enhanced cost calculation:
  const [enhancedCostCalculation, setEnhancedCostCalculation] = useState<EnhancedPricingCalculation | null>(null);

  // Update the cost calculation when components change:
  useEffect(() => {
    if (selectedComponents.length > 0) {
      const calculation = calculateEnhancedCost();
      setEnhancedCostCalculation(calculation);
    } else {
      setEnhancedCostCalculation(null);
    }
  }, [selectedComponents]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{item?.id ? t('menu.form.editTitle') : t('menu.form.createNew')}</DialogTitle>
        </DialogHeader>
        <form id="enhanced-menu-item-form" className="flex-1 overflow-y-auto px-6 pb-4 space-y-8" onSubmit={handleSave}>
          {/* Copy from Cache Button */}
          <div className="flex justify-end mb-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleCopyFromCache}
              aria-label="Copy from Cache"
            >
              {t('menu.form.copyFromCache') || 'Copy from Cache'}
            </Button>
          </div>
          {/* AI Dictation Section */}
          <section>
            <h2 className="font-semibold text-lg mb-2">{t('menu.form.aiDictation')}</h2>
            <EnhancedVoiceInput
              language={i18n.language === 'de' ? 'de' : 'en'}
              onResult={handleVoiceResult}
              label={t('menu.form.aiDictationLabel')}
              model="nova-2"
              enableLanguageDetection={true}
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
                <Input id="name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder={t('menu.form.namePlaceholder')} aria-invalid={!!fieldErrors.name} aria-describedby="name-error" />
                {fieldErrors.name && <div id="name-error" className="text-xs text-red-500">{fieldErrors.name}</div>}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="name_de">{t('menu.form.nameGerman')}</Label>
                  <QuickTranslate
                    germanText={formData.name_de || ''}
                    englishText={formData.name_en || ''}
                    onGermanChange={(text) => setFormData(prev => ({ ...prev, name_de: text }))}
                    onEnglishChange={(text) => setFormData(prev => ({ ...prev, name_en: text }))}
                    context="menu"
                    className="scale-75"
                  />
                </div>
                <Input id="name_de" value={formData.name_de} onChange={(e) => setFormData(prev => ({ ...prev, name_de: e.target.value }))} placeholder={t('menu.form.nameGermanPlaceholder')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name_en">{t('menu.form.nameEnglish')}</Label>
                <Input id="name_en" value={formData.name_en} onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))} placeholder={t('menu.form.nameEnglishPlaceholder')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">{t('menu.form.category')}</Label>
                <Select value={formData.category_id} onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}>
                  <SelectTrigger aria-invalid={!!fieldErrors.category_id} aria-describedby="category-error"><SelectValue placeholder={t('menu.form.selectCategoryPlaceholder')} /></SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.category_id && <div id="category-error" className="text-xs text-red-500">{fieldErrors.category_id}</div>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="prep_time">Preparation Time (minutes)</Label>
                <Input 
                  id="prep_time" 
                  type="number" 
                  value={preparationTime} 
                  onChange={(e) => setPreparationTime(parseInt(e.target.value) || 15)} 
                  placeholder="15"
                  min="1"
                  max="480"
                />
              </div>
              {/* Description fields */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">{t('menu.form.description')}</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder={t('menu.form.descriptionPlaceholder')} aria-invalid={!!fieldErrors.description} aria-describedby="description-error" rows={2} />
                {fieldErrors.description && <div id="description-error" className="text-xs text-red-500">{fieldErrors.description}</div>}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description_de">{t('menu.form.descriptionGerman')}</Label>
                  <QuickTranslate
                    germanText={formData.description_de || ''}
                    englishText={formData.description_en || ''}
                    onGermanChange={(text) => setFormData(prev => ({ ...prev, description_de: text }))}
                    onEnglishChange={(text) => setFormData(prev => ({ ...prev, description_en: text }))}
                    context="description"
                    className="scale-75"
                  />
                </div>
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
            <SmartIngredientSelector selectedComponents={selectedComponents} onComponentsChange={setSelectedComponents} menuItemId={item?.id} />
          </section>

          {/* Cost Analysis Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Cost Analysis & Pricing</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCostBreakdown(!showCostBreakdown)}
              >
                {showCostBreakdown ? 'Hide Details' : 'Show Details'}
              </Button>
            </div>

            {enhancedCostCalculation && (
              <>
                {/* Quick Cost Summary */}
                {!showCostBreakdown && (
                  <div className="mb-4">
                    <QuickCostSummary calculation={enhancedCostCalculation} />
                  </div>
                )}

                {/* Detailed Cost Breakdown */}
                {showCostBreakdown && (
                  <EnhancedCostBreakdown calculation={enhancedCostCalculation} />
                )}
              </>
            )}
          </section>

          {/* Pricing Section */}
          <section>
            <h2 className="font-semibold text-lg mb-2">{t('menu.form.pricing')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="regular_price">{t('menu.form.regularPrice')}</Label>
                <Input id="regular_price" type="number" step="0.01" value={formData.regular_price} onChange={(e) => setFormData(prev => ({ ...prev, regular_price: parseFloat(e.target.value) || 0 }))} placeholder={t('menu.form.regularPricePlaceholder')} aria-invalid={!!fieldErrors.regular_price} aria-describedby="regular_price-error" />
                {fieldErrors.regular_price && <div id="regular_price-error" className="text-xs text-red-500">{fieldErrors.regular_price}</div>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="student_price">{t('menu.form.studentPrice')}</Label>
                <Input id="student_price" type="number" step="0.01" value={formData.student_price} onChange={(e) => setFormData(prev => ({ ...prev, student_price: parseFloat(e.target.value) || 0 }))} placeholder={t('menu.form.studentPricePlaceholder')} aria-invalid={!!fieldErrors.student_price} aria-describedby="student_price-error" />
                {fieldErrors.student_price && <div id="student_price-error" className="text-xs text-red-500">{fieldErrors.student_price}</div>}
              </div>
            </div>
          </section>

          {/* Image Upload Section */}
          <section>
            <h2 className="font-semibold text-lg mb-2">{t('menu.form.imageUpload')}</h2>
            {/* ...existing code for image upload and AI generation... */}
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
        {/* Fixed Footer at Bottom */}
        <div className="mt-auto bg-background/95 backdrop-blur-sm border-t shadow-lg p-4 flex justify-end gap-2 z-20">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('menu.form.cancel')}</Button>
          <Button type="submit" form="enhanced-menu-item-form" disabled={loading}>{loading ? t('menu.form.saving') : t('menu.form.save')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
