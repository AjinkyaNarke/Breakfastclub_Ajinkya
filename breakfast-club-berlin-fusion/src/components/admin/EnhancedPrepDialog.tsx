import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Wand2, ChefHat, Plus, X, ArrowRight, ArrowLeft, Search, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useLocalization } from '@/hooks/useLocalization';

const prepFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  batch_yield: z.string().min(1, 'Batch yield is required'),
  batch_yield_amount: z.number().min(0.1, 'Amount must be greater than 0'),
  batch_yield_unit: z.string().min(1, 'Unit is required'),
  notes: z.string().optional(),
});

type PrepFormData = z.infer<typeof prepFormSchema>;

interface SuggestedIngredient {
  ingredient_id: string;
  name: string;
  name_de?: string;
  name_en?: string;
  quantity: number;
  unit: string;
  confidence: number;
  reasoning: string;
  cost_per_unit?: number;
}

interface PrepIngredient {
  ingredient_id: string;
  quantity: number;
  unit: string;
  notes?: string;
  ingredient?: {
    id: string;
    name: string;
    name_en?: string;
    name_de?: string;
    unit: string;
    cost_per_unit?: number;
  };
}

interface EnhancedPrepDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialData?: Partial<PrepFormData>;
}

export function EnhancedPrepDialog({
  open,
  onOpenChange,
  onSuccess,
  initialData
}: EnhancedPrepDialogProps) {
  const { t, i18n } = useTranslation(['admin', 'common']);
  const { getLocalizedText } = useLocalization();
  const [currentStep, setCurrentStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestedIngredients, setSuggestedIngredients] = useState<SuggestedIngredient[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<PrepIngredient[]>([]);
  const [availableIngredients, setAvailableIngredients] = useState<any[]>([]);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualIngredientSearch, setManualIngredientSearch] = useState('');
  const [manualQuantity, setManualQuantity] = useState<number>(1);
  const [manualUnit, setManualUnit] = useState<string>('');
  const [manualNotes, setManualNotes] = useState<string>('');
  const [selectedManualIngredient, setSelectedManualIngredient] = useState<any>(null);

  const form = useForm<PrepFormData>({
    resolver: zodResolver(prepFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      batch_yield: initialData?.batch_yield || '',
      batch_yield_amount: initialData?.batch_yield_amount || 1,
      batch_yield_unit: initialData?.batch_yield_unit || 'kg',
      notes: initialData?.notes || '',
    },
  });

  // Fetch available ingredients from database
  useEffect(() => {
    if (open) {
      fetchAvailableIngredients();
    }
  }, [open]);

  const fetchAvailableIngredients = async () => {
    try {
      const { data, error } = await supabase
        .from('ingredients')
        .select('id, name, name_de, name_en, unit, cost_per_unit')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setAvailableIngredients(data || []);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
      toast.error('Failed to load ingredients');
    }
  };

  const analyzeAndSuggestIngredients = async (prepData: PrepFormData) => {
    setIsAnalyzing(true);
    
    try {
      const currentLang = i18n.language as 'en' | 'de';
      
      toast.info('🧠 Analyzing preparation...', {
        description: 'AI is suggesting ingredients based on your prep details'
      });

      // Create a comprehensive prompt for the existing deepseek-analyze function
      const analysisPrompt = `Analyze this preparation and suggest realistic ingredients with quantities from the available database:

PREPARATION TO ANALYZE:
- Name: ${prepData.name}
- Description: ${prepData.description || 'Not provided'}
- Batch Yield: ${prepData.batch_yield_amount} ${prepData.batch_yield_unit}
- Language: ${currentLang === 'de' ? 'German' : 'English'}

AVAILABLE INGREDIENTS IN DATABASE:
${availableIngredients.map((ing, index) => {
  const localizedName = getLocalizedText({ text: ing.name, text_de: ing.name_de, text_en: ing.name_en });
  return `${index + 1}. ${localizedName} (ID: ${ing.id}, Unit: ${ing.unit}${ing.cost_per_unit ? `, €${ing.cost_per_unit}/${ing.unit}` : ''})`;
}).join('\n')}

TASK:
Suggest ingredients from the available list with realistic quantities for ${prepData.batch_yield_amount} ${prepData.batch_yield_unit} of ${prepData.name}.

Return JSON format:
{
  "suggestions": [
    {
      "ingredient_id": "exact_id_from_list",
      "ingredient_name": "exact_name_from_list",
      "quantity": number,
      "unit": "unit_from_database",
      "confidence": 0.85,
      "reasoning": "explanation for this quantity"
    }
  ],
  "overall_confidence": 0.8,
  "total_cost_estimate": 12.50
}

Only suggest ingredients that exist in the available list above. Use realistic quantities based on traditional recipes.`;

      console.log('Invoking deepseek-analyze with prompt length:', analysisPrompt.length);
      
      const response = await supabase.functions.invoke('deepseek-analyze', {
        body: {
          prompt: analysisPrompt,
          mode: 'recipe',
          language: i18n.language === 'de' ? 'de' : 'en',
          temperature: 0.3,
          max_tokens: 2000
        }
      });

      console.log('DeepSeek response:', response);

      if (response.error) {
        console.error('DeepSeek function error:', response.error);
        throw new Error(response.error.message);
      }

      const analysis = response.data;
      
      if (analysis && (analysis.content || analysis.analysis || analysis.result)) {
        let parsedResult;
        
        // Try to parse the response content
        try {
          const content = analysis.content || analysis.analysis || analysis.result || analysis;
          if (typeof content === 'string') {
            // Clean the content and extract JSON
            let cleanedContent = content.trim();
            cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            
            const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              cleanedContent = jsonMatch[0];
            }
            
            parsedResult = JSON.parse(cleanedContent);
          } else {
            parsedResult = content;
          }
        } catch (parseError) {
          console.error('Failed to parse AI response:', parseError);
          throw new Error('AI returned invalid response format');
        }

        if (parsedResult?.suggestions && Array.isArray(parsedResult.suggestions)) {
          const mappedSuggestions: SuggestedIngredient[] = parsedResult.suggestions
            .map((suggestion: any) => {
              // Find matching ingredient in database
              const matchingIngredient = availableIngredients.find(ing => 
                ing.id === suggestion.ingredient_id || 
                ing.name.toLowerCase() === suggestion.ingredient_name?.toLowerCase() ||
                ing.name_de?.toLowerCase() === suggestion.ingredient_name?.toLowerCase() ||
                ing.name_en?.toLowerCase() === suggestion.ingredient_name?.toLowerCase()
              );

              if (!matchingIngredient) {
                console.warn(`Ingredient not found: ${suggestion.ingredient_name || suggestion.ingredient_id}`);
                return null;
              }

              return {
                ingredient_id: matchingIngredient.id,
                name: matchingIngredient.name,
                name_de: matchingIngredient.name_de,
                name_en: matchingIngredient.name_en,
                quantity: suggestion.quantity || 1,
                unit: suggestion.unit || matchingIngredient.unit,
                confidence: suggestion.confidence || 0.7,
                reasoning: suggestion.reasoning || 'AI suggested',
                cost_per_unit: matchingIngredient.cost_per_unit
              };
            })
            .filter(Boolean);

          setSuggestedIngredients(mappedSuggestions);
          
          if (mappedSuggestions.length > 0) {
            const confidenceText = Math.round((parsedResult.overall_confidence || 0.8) * 100);
            const totalCost = mappedSuggestions.reduce((sum, ing) => {
              return sum + (ing.cost_per_unit ? ing.quantity * ing.cost_per_unit : 0);
            }, 0);
            
            toast.success(
              `Found ${mappedSuggestions.length} intelligent suggestions!`,
              { 
                description: `${confidenceText}% confidence • Est. cost: €${totalCost.toFixed(2)}` 
              }
            );
          } else {
            toast.warning('No matching ingredients found', {
              description: 'Try adjusting your prep name or adding more ingredients to the database'
            });
          }
        } else {
          throw new Error('AI response does not contain valid suggestions');
        }
      } else {
        throw new Error('AI analysis failed');
      }

    } catch (error) {
      console.error('Ingredient analysis error:', error);
      console.error('Full error details:', {
        error,
        prepData,
        availableIngredientsCount: availableIngredients.length,
        currentLang: i18n.language
      });
      
      toast.error('AI analysis failed', {
        description: 'Using fallback suggestions instead'
      });
      
      // Provide fallback suggestions based on prep name
      provideFallbackSuggestions(prepData);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const provideFallbackSuggestions = (prepData: PrepFormData) => {
    const prepName = prepData.name.toLowerCase();
    const fallbackSuggestions: SuggestedIngredient[] = [];
    
    console.log('Providing fallback suggestions for:', prepName);
    
    // Comprehensive fallback logic for common preps
    const commonPreps = {
      'hummus': ['chickpeas', 'tahini', 'garlic', 'lemon', 'olive oil', 'kichererbsen'],
      'curry paste': ['coconut milk', 'garlic', 'ginger', 'chili', 'onion', 'kokosmilch', 'knoblauch', 'ingwer'],
      'curry': ['coconut milk', 'garlic', 'ginger', 'onion', 'kokosmilch', 'knoblauch', 'ingwer', 'zwiebel'],
      'tomato sauce': ['tomatoes', 'garlic', 'onion', 'olive oil', 'basil', 'tomaten', 'knoblauch', 'zwiebel', 'olivenöl'],
      'tomatensauce': ['tomatoes', 'garlic', 'onion', 'olive oil', 'basil', 'tomaten', 'knoblauch', 'zwiebel'],
      'pesto': ['basil', 'garlic', 'pine nuts', 'parmesan', 'olive oil', 'basilikum', 'knoblauch'],
      'mayo': ['eggs', 'oil', 'lemon', 'mustard', 'eier', 'öl', 'zitrone'],
      'mayonnaise': ['eggs', 'oil', 'lemon', 'mustard', 'eier', 'öl', 'zitrone'],
      'guacamole': ['avocado', 'lime', 'onion', 'tomato', 'cilantro', 'zwiebel', 'tomaten'],
      'salsa': ['tomatoes', 'onion', 'garlic', 'cilantro', 'lime', 'tomaten', 'zwiebel', 'knoblauch'],
      'aioli': ['garlic', 'egg', 'olive oil', 'lemon', 'knoblauch', 'ei', 'olivenöl', 'zitrone'],
      'vinaigrette': ['olive oil', 'vinegar', 'mustard', 'olivenöl', 'essig', 'senf'],
      'marinade': ['olive oil', 'garlic', 'herbs', 'olivenöl', 'knoblauch', 'kräuter'],
      'stock': ['onion', 'carrot', 'celery', 'herbs', 'zwiebel', 'karotte', 'sellerie'],
      'brühe': ['onion', 'carrot', 'celery', 'herbs', 'zwiebel', 'karotte', 'sellerie']
    };

    // Try to match the prep name with any of the common preps
    let matchedPrep = null;
    for (const [prep, ingredients] of Object.entries(commonPreps)) {
      if (prepName.includes(prep) || prep.includes(prepName)) {
        matchedPrep = { prep, ingredients };
        break;
      }
    }

    if (matchedPrep) {
      console.log('Matched prep:', matchedPrep.prep);
      
      matchedPrep.ingredients.forEach(ingName => {
        const matchingIngredient = availableIngredients.find(ing => 
          ing.name.toLowerCase().includes(ingName.toLowerCase()) ||
          ing.name_de?.toLowerCase().includes(ingName.toLowerCase()) ||
          ing.name_en?.toLowerCase().includes(ingName.toLowerCase()) ||
          ingName.toLowerCase().includes(ing.name.toLowerCase())
        );
        
        if (matchingIngredient && !fallbackSuggestions.some(s => s.ingredient_id === matchingIngredient.id)) {
          // Calculate reasonable quantity based on batch size
          let baseQuantity = prepData.batch_yield_amount / 8; // More conservative estimate
          
          // Adjust quantities based on ingredient type
          const ingredientName = matchingIngredient.name.toLowerCase();
          if (ingredientName.includes('oil') || ingredientName.includes('öl')) {
            baseQuantity = prepData.batch_yield_amount * 0.1; // 10% oil
          } else if (ingredientName.includes('garlic') || ingredientName.includes('knoblauch')) {
            baseQuantity = Math.max(0.05, prepData.batch_yield_amount * 0.02); // 2% garlic
          } else if (ingredientName.includes('salt') || ingredientName.includes('salz')) {
            baseQuantity = Math.max(0.01, prepData.batch_yield_amount * 0.01); // 1% salt
          }
          
          fallbackSuggestions.push({
            ingredient_id: matchingIngredient.id,
            name: matchingIngredient.name,
            name_de: matchingIngredient.name_de,
            name_en: matchingIngredient.name_en,
            quantity: Math.round(baseQuantity * 100) / 100, // Round to 2 decimals
            unit: matchingIngredient.unit,
            confidence: 0.65,
            reasoning: `Common ingredient for ${matchedPrep.prep}`,
            cost_per_unit: matchingIngredient.cost_per_unit
          });
        }
      });
    }

    // If no specific match, suggest some basic ingredients
    if (fallbackSuggestions.length === 0) {
      const basicIngredients = ['salt', 'oil', 'garlic', 'onion', 'salz', 'öl', 'knoblauch', 'zwiebel'];
      
      basicIngredients.forEach(ingName => {
        const matchingIngredient = availableIngredients.find(ing => 
          ing.name.toLowerCase().includes(ingName) ||
          ing.name_de?.toLowerCase().includes(ingName) ||
          ing.name_en?.toLowerCase().includes(ingName)
        );
        
        if (matchingIngredient && !fallbackSuggestions.some(s => s.ingredient_id === matchingIngredient.id)) {
          fallbackSuggestions.push({
            ingredient_id: matchingIngredient.id,
            name: matchingIngredient.name,
            name_de: matchingIngredient.name_de,
            name_en: matchingIngredient.name_en,
            quantity: prepData.batch_yield_amount * 0.05, // 5% of batch
            unit: matchingIngredient.unit,
            confidence: 0.4,
            reasoning: `Basic ingredient`,
            cost_per_unit: matchingIngredient.cost_per_unit
          });
        }
      });
    }

    console.log('Fallback suggestions generated:', fallbackSuggestions);

    if (fallbackSuggestions.length > 0) {
      setSuggestedIngredients(fallbackSuggestions);
      toast.info(`Found ${fallbackSuggestions.length} basic suggestions`, {
        description: 'Based on common recipes - please review quantities'
      });
    } else {
      toast.warning('No suggestions available', {
        description: 'Please add ingredients manually'
      });
    }
  };

  const handleStep1Next = async (data: PrepFormData) => {
    // Analyze and suggest ingredients
    await analyzeAndSuggestIngredients(data);
    setCurrentStep(2);
  };

  const addSuggestedIngredient = (suggested: SuggestedIngredient) => {
    const ingredient = availableIngredients.find(ing => ing.id === suggested.ingredient_id);
    if (!ingredient) return;

    const newIngredient: PrepIngredient = {
      ingredient_id: suggested.ingredient_id,
      quantity: suggested.quantity,
      unit: suggested.unit,
      notes: suggested.reasoning,
      ingredient: {
        id: ingredient.id,
        name: ingredient.name,
        name_en: ingredient.name_en,
        name_de: ingredient.name_de,
        unit: ingredient.unit,
        cost_per_unit: ingredient.cost_per_unit,
      },
    };

    setSelectedIngredients(prev => [...prev, newIngredient]);
    setSuggestedIngredients(prev => prev.filter(s => s.ingredient_id !== suggested.ingredient_id));
    
    toast.success(`Added ${getLocalizedIngredientName(ingredient)}`);
  };

  const addManualIngredient = () => {
    if (!selectedManualIngredient || manualQuantity <= 0) {
      toast.error('Please select an ingredient and enter a valid quantity');
      return;
    }

    // Check if ingredient is already added
    const alreadyAdded = selectedIngredients.some(ing => 
      ing.ingredient_id === selectedManualIngredient.id
    );

    if (alreadyAdded) {
      toast.error('This ingredient is already added to the prep');
      return;
    }

    const newIngredient: PrepIngredient = {
      ingredient_id: selectedManualIngredient.id,
      quantity: manualQuantity,
      unit: manualUnit || selectedManualIngredient.unit,
      notes: manualNotes,
      ingredient: {
        id: selectedManualIngredient.id,
        name: selectedManualIngredient.name,
        name_en: selectedManualIngredient.name_en,
        name_de: selectedManualIngredient.name_de,
        unit: selectedManualIngredient.unit,
        cost_per_unit: selectedManualIngredient.cost_per_unit,
      },
    };

    setSelectedIngredients(prev => [...prev, newIngredient]);
    
    // Reset manual form
    setSelectedManualIngredient(null);
    setManualQuantity(1);
    setManualUnit('');
    setManualNotes('');
    setManualIngredientSearch('');
    setShowManualAdd(false);
    
    toast.success(`Manually added ${getLocalizedIngredientName(selectedManualIngredient)}`);
  };

  const removeSelectedIngredient = (index: number) => {
    setSelectedIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const handleFinalSubmit = async (data: PrepFormData) => {
    if (selectedIngredients.length === 0) {
      toast.error('Please add at least one ingredient to the prep');
      return;
    }

    try {
      const currentLang = i18n.language as 'en' | 'de';
      
      toast.info('Creating prep with automatic translation...', {
        description: 'This may take a few seconds'
      });

      // Create prep with proper language fields
      const prepData = {
        ...data,
        // Always store the main name in German if the current language is German
        name: data.name,
        name_de: currentLang === 'de' ? data.name : '',
        name_en: currentLang === 'en' ? data.name : '',
        description: data.description || '',
        description_de: currentLang === 'de' ? data.description : '',
        description_en: currentLang === 'en' ? data.description : '',
        ingredients: selectedIngredients.map(ing => ({
          ingredient_id: ing.ingredient_id,
          quantity: ing.quantity,
          unit: ing.unit,
          notes: ing.notes,
        })),
      };

      // Use the existing prep creation hook with translation
      const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/prep-crud`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          prep: prepData,
          autoTranslate: true,
          sourceLang: currentLang
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to create prep');
      }

      const result = await response.json();

      toast.success(
        currentLang === 'de' 
          ? 'Zubereitung erfolgreich erstellt!' 
          : 'Prep created successfully!', 
        {
          description: currentLang === 'de'
            ? `${selectedIngredients.length} Zutaten hinzugefügt und Übersetzungen generiert`
            : `${selectedIngredients.length} ingredients added and translations generated`
        }
      );

      // Reset form and close dialog
      form.reset();
      setSelectedIngredients([]);
      setSuggestedIngredients([]);
      setCurrentStep(1);
      setShowManualAdd(false);
      onOpenChange(false);
      onSuccess?.();

    } catch (error) {
      console.error('Error creating prep:', error);
      toast.error('Failed to create prep', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };

  const getTotalEstimatedCost = () => {
    return selectedIngredients.reduce((total, ing) => {
      if (ing.ingredient?.cost_per_unit) {
        return total + (ing.quantity * ing.ingredient.cost_per_unit);
      }
      return total;
    }, 0);
  };

  const getLocalizedIngredientName = (ingredient: any) => {
    return getLocalizedText({ 
      text: ingredient.name, 
      text_de: ingredient.name_de, 
      text_en: ingredient.name_en 
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            {t('admin:preps.createNewPrep', 'Create New Prep')}
            <Badge variant="outline" className="ml-2">
              Step {currentStep} of 2
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {currentStep === 1 
              ? t('admin:preps.step1Description', 'Enter basic prep information. We\'ll suggest ingredients based on your input.')
              : t('admin:preps.step2Description', 'Review and adjust the suggested ingredients for your prep.')
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          {currentStep === 1 ? (
            <form onSubmit={form.handleSubmit(handleStep1Next)} className="space-y-6">
              {/* Step 1: Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('admin:preps.prepName', 'Prep Name')} *
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={i18n.language === 'de' 
                            ? "z.B. Grüne Curry Paste" 
                            : "e.g., Green Curry Paste"
                          } 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="batch_yield"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('admin:preps.batchYield', 'Batch Yield')} *
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={i18n.language === 'de' 
                            ? "z.B. 3 kg, 500 ml" 
                            : "e.g., 3 kg, 500 ml"
                          } 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="batch_yield_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('admin:preps.yieldAmount', 'Yield Amount')} *
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="3"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="batch_yield_unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('admin:preps.yieldUnit', 'Yield Unit')} *
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="kg, l, pieces" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('admin:preps.description', 'Description')}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={i18n.language === 'de' 
                          ? "Kurze Beschreibung der Zubereitung..." 
                          : "Brief description of the prep..."
                        }
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  {t('common:cancel', 'Cancel')}
                </Button>
                <Button type="submit" disabled={isAnalyzing}>
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('admin:preps.analyzing', 'Analyzing...')}
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      {t('admin:preps.suggestIngredients', 'Suggest Ingredients')}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Step 2: Ingredient Selection */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Suggested Ingredients */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Wand2 className="h-5 w-5" />
                      {t('admin:preps.suggestedIngredients', 'Suggested Ingredients')}
                      <Badge variant="secondary">{suggestedIngredients.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {suggestedIngredients.length > 0 ? (
                      suggestedIngredients.map((suggestion, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium">
                                {getLocalizedIngredientName(suggestion)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {suggestion.quantity} {suggestion.unit}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {suggestion.reasoning}
                              </p>
                              <Badge 
                                variant={suggestion.confidence > 0.8 ? "default" : "secondary"}
                                className="mt-2 text-xs"
                              >
                                {Math.round(suggestion.confidence * 100)}% confidence
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => addSuggestedIngredient(suggestion)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        {t('admin:preps.noSuggestions', 'No suggestions available. You can add ingredients manually.')}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Selected Ingredients */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ChefHat className="h-5 w-5" />
                      {t('admin:preps.selectedIngredients', 'Selected Ingredients')}
                      <Badge variant="secondary">{selectedIngredients.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedIngredients.length > 0 ? (
                      <>
                        {selectedIngredients.map((ingredient, index) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium">
                                  {getLocalizedIngredientName(ingredient.ingredient)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {ingredient.quantity} {ingredient.unit}
                                  {ingredient.ingredient?.cost_per_unit && (
                                    <span className="ml-2">
                                      (€{(ingredient.quantity * ingredient.ingredient.cost_per_unit).toFixed(2)})
                                    </span>
                                  )}
                                </p>
                                {ingredient.notes && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {ingredient.notes}
                                  </p>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeSelectedIngredient(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}

                        {getTotalEstimatedCost() > 0 && (
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm font-medium">
                              {t('admin:preps.estimatedCost', 'Estimated Cost')}: €{getTotalEstimatedCost().toFixed(2)}
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        {t('admin:preps.noSelectedIngredients', 'No ingredients selected yet')}
                      </p>
                    )}
                    
                    {/* Manual Add Button */}
                    <div className="pt-3 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowManualAdd(!showManualAdd)}
                        className="w-full"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        {t('admin:preps.addManually', 'Add Ingredient Manually')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Manual Ingredient Addition */}
              {showManualAdd && (
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <UserPlus className="h-5 w-5" />
                      {t('admin:preps.manualAddTitle', 'Add Ingredient Manually')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Ingredient Selection */}
                      <div>
                        <Label htmlFor="ingredient-search">
                          {t('admin:preps.searchIngredients', 'Search Ingredients')}
                        </Label>
                        <div className="space-y-2">
                          <Input
                            id="ingredient-search"
                            placeholder={i18n.language === 'de' 
                              ? "Zutat suchen..." 
                              : "Search for ingredient..."
                            }
                            value={manualIngredientSearch}
                            onChange={(e) => setManualIngredientSearch(e.target.value)}
                          />
                          
                          {manualIngredientSearch.length > 0 && (
                            <div className="border rounded-md max-h-32 overflow-y-auto">
                              {availableIngredients
                                .filter(ing => {
                                  const searchTerm = manualIngredientSearch.toLowerCase();
                                  const nameMatches = ing.name.toLowerCase().includes(searchTerm) ||
                                    (ing.name_de && ing.name_de.toLowerCase().includes(searchTerm)) ||
                                    (ing.name_en && ing.name_en.toLowerCase().includes(searchTerm));
                                  
                                  // Don't show already selected ingredients
                                  const alreadySelected = selectedIngredients.some(selected => 
                                    selected.ingredient_id === ing.id
                                  );
                                  
                                  return nameMatches && !alreadySelected;
                                })
                                .slice(0, 5)
                                .map((ingredient) => (
                                  <div
                                    key={ingredient.id}
                                    className="p-2 hover:bg-muted cursor-pointer flex items-center justify-between"
                                    onClick={() => {
                                      setSelectedManualIngredient(ingredient);
                                      setManualUnit(ingredient.unit);
                                      setManualIngredientSearch('');
                                    }}
                                  >
                                    <div>
                                      <p className="font-medium text-sm">
                                        {getLocalizedIngredientName(ingredient)}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        Unit: {ingredient.unit}
                                        {ingredient.cost_per_unit && (
                                          <span className="ml-2">
                                            €{ingredient.cost_per_unit}/{ingredient.unit}
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              
                              {availableIngredients.filter(ing => {
                                const searchTerm = manualIngredientSearch.toLowerCase();
                                return ing.name.toLowerCase().includes(searchTerm) ||
                                  (ing.name_de && ing.name_de.toLowerCase().includes(searchTerm)) ||
                                  (ing.name_en && ing.name_en.toLowerCase().includes(searchTerm));
                              }).length === 0 && (
                                <p className="p-2 text-sm text-muted-foreground text-center">
                                  {t('admin:preps.noIngredientsFound', 'No ingredients found')}
                                </p>
                              )}
                            </div>
                          )}
                          
                          {selectedManualIngredient && (
                            <div className="p-2 bg-primary/10 rounded-md">
                              <p className="text-sm font-medium">
                                {t('admin:preps.selected', 'Selected')}: {getLocalizedIngredientName(selectedManualIngredient)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quantity & Unit */}
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="manual-quantity">
                            {t('admin:preps.quantity', 'Quantity')} *
                          </Label>
                          <Input
                            id="manual-quantity"
                            type="number"
                            step="0.1"
                            min="0.1"
                            placeholder="1.0"
                            value={manualQuantity}
                            onChange={(e) => setManualQuantity(parseFloat(e.target.value) || 1)}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="manual-unit">
                            {t('admin:preps.unit', 'Unit')}
                          </Label>
                          <Input
                            id="manual-unit"
                            placeholder={selectedManualIngredient?.unit || 'kg, ml, pieces'}
                            value={manualUnit}
                            onChange={(e) => setManualUnit(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <Label htmlFor="manual-notes">
                        {t('admin:preps.notes', 'Notes')} ({t('admin:preps.optional', 'optional')})
                      </Label>
                      <Input
                        id="manual-notes"
                        placeholder={i18n.language === 'de' 
                          ? "Zusätzliche Notizen..." 
                          : "Additional notes..."
                        }
                        value={manualNotes}
                        onChange={(e) => setManualNotes(e.target.value)}
                      />
                    </div>

                    {/* Add Button */}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={addManualIngredient}
                        disabled={!selectedManualIngredient || manualQuantity <= 0}
                        className="flex-1"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {t('admin:preps.addIngredient', 'Add Ingredient')}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowManualAdd(false);
                          setSelectedManualIngredient(null);
                          setManualQuantity(1);
                          setManualUnit('');
                          setManualNotes('');
                          setManualIngredientSearch('');
                        }}
                      >
                        {t('common:cancel', 'Cancel')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Separator />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('admin:preps.notes', 'Notes')}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={i18n.language === 'de' 
                          ? "Zusätzliche Notizen oder Tipps..." 
                          : "Additional notes or tips..."
                        }
                        className="resize-none"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCurrentStep(1)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('common:back', 'Back')}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                >
                  {t('common:cancel', 'Cancel')}
                </Button>
                <Button 
                  type="button"
                  onClick={form.handleSubmit(handleFinalSubmit)}
                  disabled={selectedIngredients.length === 0}
                >
                  {t('admin:preps.createPrep', 'Create Prep')}
                </Button>
              </DialogFooter>
            </div>
          )}
        </Form>
      </DialogContent>
    </Dialog>
  );
}