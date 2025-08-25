import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Mic, MicOff, Plus, Check, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EnhancedVoiceInput } from '@/components/EnhancedVoiceInput';
import { supabase } from '@/integrations/supabase/client';
import { useTranslationCache } from '@/hooks/useTranslationCache';
import { parseEnhancedIngredientList, formatParsedIngredient } from '@/utils/enhancedVoiceParsing';
import { useSmartTagging } from '@/hooks/useSmartTagging';

interface ParsedIngredient {
  name_de: string;
  name_en?: string;
  price?: number;
  unit?: string;
  priceUnit?: string;
  category?: string; 
  tags: string[];
  allergens?: string[];
  confidence: 'high' | 'medium' | 'low';
  aiConfidence?: number; // 0-100 from DeepSeek analysis
  status: 'pending' | 'processing' | 'completed' | 'error' | 'analyzing';
  error?: string;
  rawInput?: string;
  aiSuggested?: boolean; // true if tags come from AI
  needsReview?: boolean; // true if AI suggests manual review
}

interface IngredientCategory {
  id: string;
  name: string;
}

const INGREDIENT_CATEGORIES = {
  'vegetables': ['Avocado', 'Kartoffel', 'Zwiebel', 'Knoblauch', 'Tomaten', 'Paprika', 'Karotten', 'Spinat', 'Salat', 'Gurken'],
  'oils': ['Olivenöl', 'Rapsöl', 'Sonnenblumenöl', 'Kokosöl'],
  'dairy': ['Milch', 'Butter', 'Käse', 'Joghurt', 'Sahne', 'Quark'],
  'meat': ['Hähnchen', 'Rind', 'Schwein', 'Lamm', 'Truthahn'],
  'fish': ['Lachs', 'Thunfisch', 'Forelle', 'Kabeljau', 'Garnelen'],
  'grains': ['Reis', 'Nudeln', 'Brot', 'Mehl', 'Quinoa', 'Haferflocken'],
  'spices': ['Salz', 'Pfeffer', 'Paprika', 'Oregano', 'Basilikum', 'Thymian'],
  'fruits': ['Äpfel', 'Bananen', 'Zitronen', 'Orangen', 'Beeren', 'Trauben']
};

const DIETARY_PROPERTIES = {
  'vegetables': ['vegetarian', 'vegan'],
  'oils': ['vegetarian', 'vegan'],
  'fruits': ['vegetarian', 'vegan'],
  'grains': ['vegetarian', 'vegan'],
  'spices': ['vegetarian', 'vegan'],
  'dairy': ['vegetarian'],
  'meat': [],
  'fish': []
};

interface BulkVoiceIngredientCreationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function BulkVoiceIngredientCreation({ 
  open, 
  onOpenChange, 
  onComplete 
}: BulkVoiceIngredientCreationProps) {
  const [ingredients, setIngredients] = useState<ParsedIngredient[]>([]);
  const [categories, setCategories] = useState<IngredientCategory[]>([]);
  const [processing, setParsing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const { getTranslation } = useTranslationCache();
  const { analyzeBatch, suggestions, acceptSuggestion, rejectSuggestion, getAcceptedTags, isAnalyzing } = useSmartTagging();

  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

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
    }
  };

  const parseIngredientList = (text: string): ParsedIngredient[] => {
    // Use enhanced parsing to extract ingredients with prices
    const enhancedParsed = parseEnhancedIngredientList(text);
    
    return enhancedParsed.map(parsed => ({
      name_de: parsed.name_de,
      price: parsed.price,
      unit: parsed.unit,
      priceUnit: parsed.priceUnit,
      tags: parsed.tags,
      confidence: parsed.confidence,
      status: 'pending' as const,
      rawInput: parsed.rawInput
    }));
  };

  const assignAutomaticTags = (ingredientName: string): string[] => {
    const name = ingredientName.toLowerCase();
    
    for (const [category, items] of Object.entries(INGREDIENT_CATEGORIES)) {
      if (items.some(item => name.includes(item.toLowerCase()) || item.toLowerCase().includes(name))) {
        return DIETARY_PROPERTIES[category as keyof typeof DIETARY_PROPERTIES] || [];
      }
    }
    
    return [];
  };

  const determineCategoryId = (ingredientName: string): string | undefined => {
    const name = ingredientName.toLowerCase();
    
    for (const [categoryName, items] of Object.entries(INGREDIENT_CATEGORIES)) {
      if (items.some(item => name.includes(item.toLowerCase()) || item.toLowerCase().includes(name))) {
        const category = categories.find(cat => 
          cat.name.toLowerCase().includes(categoryName) || 
          categoryName.includes(cat.name.toLowerCase())
        );
        return category?.id;
      }
    }
    
    // Default to first category if no match found
    return categories[0]?.id;
  };

  const handleVoiceResult = async (text: string) => {
    setParsing(true);
    try {
      // Step 1: Parse ingredients with prices
      const parsedIngredients = parseIngredientList(text);
      setIngredients(parsedIngredients);
      
      // Step 2: Translate to English
      const translatedIngredients = await Promise.all(
        parsedIngredients.map(async (ingredient) => {
          try {
            const translatedName = await getTranslation(ingredient.name_de, 'de', 'en');
            return {
              ...ingredient,
              name_en: translatedName,
              status: 'processing' as const
            };
          } catch (error) {
            return {
              ...ingredient,
              status: 'error' as const,
              error: 'Translation failed'
            };
          }
        })
      );
      
      setIngredients(translatedIngredients);
      
      // Step 3: Smart AI analysis for dietary tags and allergens
      const ingredientNames = translatedIngredients
        .filter(ing => ing.status !== 'error')
        .map(ing => ing.name_de);
      
      if (ingredientNames.length > 0) {
        // Mark ingredients as analyzing
        setIngredients(prev => prev.map(ing => 
          ingredientNames.includes(ing.name_de) 
            ? { ...ing, status: 'analyzing' as const }
            : ing
        ));
        
        // Perform AI analysis
        const aiResults = await analyzeBatch(ingredientNames, 'de', {
          conservativeMode: true, // Always conservative for bulk operations
          autoApplyThreshold: 95
        });
        
        // Apply AI results to ingredients
        const finalIngredients = translatedIngredients.map(ingredient => {
          const aiResult = aiResults.find(r => r.analysis.ingredient === ingredient.name_de);
          
          if (aiResult) {
            return {
              ...ingredient,
              tags: aiResult.shouldAutoApply ? aiResult.suggestedTags : ingredient.tags,
              allergens: aiResult.shouldAutoApply ? aiResult.suggestedAllergens : [],
              aiConfidence: aiResult.analysis.overallConfidence,
              aiSuggested: aiResult.suggestedTags.length > 0 || aiResult.suggestedAllergens.length > 0,
              needsReview: !aiResult.shouldAutoApply && (aiResult.suggestedTags.length > 0 || aiResult.suggestedAllergens.length > 0),
              status: aiResult.analysis.warnings.length > 0 ? 'error' as const : 'completed' as const,
              error: aiResult.analysis.warnings.join(', ') || undefined
            };
          }
          
          return {
            ...ingredient,
            status: 'completed' as const
          };
        });
        
        setIngredients(finalIngredients);
      }
      
    } catch (error) {
      toast({
        title: "Processing Error",
        description: "Failed to process ingredients from voice input",
        variant: "destructive"
      });
    } finally {
      setParsing(false);
    }
  };

  const createIngredients = async () => {
    if (ingredients.length === 0) return;
    
    setCreating(true);
    setProgress(0);
    
    const completedIngredients = ingredients.filter(ing => ing.status === 'completed');
    
    for (let i = 0; i < completedIngredients.length; i++) {
      const ingredient = completedIngredients[i];
      
      try {
        const categoryId = determineCategoryId(ingredient.name_de);
        
        const ingredientData = {
          name: ingredient.name_de,
          name_de: ingredient.name_de,
          name_en: ingredient.name_en || ingredient.name_de,
          description: '',
          description_de: '',
          description_en: '',
          unit: ingredient.unit || 'piece',
          category_id: categoryId,
          allergens: ingredient.allergens || [],
          dietary_properties: ingredient.tags,
          seasonal_availability: [],
          cost_per_unit: ingredient.price || 0,
          supplier_info: '',
          notes: `Created via bulk voice input${ingredient.rawInput ? ` - Original: "${ingredient.rawInput}"` : ''}${ingredient.aiSuggested ? ` - AI confidence: ${ingredient.aiConfidence}%` : ''}`,
          is_active: true
        };

        const { error } = await supabase
          .from('ingredients')
          .insert([ingredientData]);
          
        if (error) {
          console.error('Error creating ingredient:', error);
          setIngredients(prev => prev.map(ing => 
            ing.name_de === ingredient.name_de 
              ? { ...ing, status: 'error', error: error.message }
              : ing
          ));
        } else {
          setIngredients(prev => prev.map(ing => 
            ing.name_de === ingredient.name_de 
              ? { ...ing, status: 'completed' }
              : ing
          ));
        }
      } catch (error) {
        console.error('Error creating ingredient:', error);
        setIngredients(prev => prev.map(ing => 
          ing.name_de === ingredient.name_de 
            ? { ...ing, status: 'error', error: 'Failed to create ingredient' }
            : ing
        ));
      }
      
      setProgress(((i + 1) / completedIngredients.length) * 100);
    }
    
    setCreating(false);
    
    const successCount = ingredients.filter(ing => ing.status === 'completed').length;
    toast({
      title: "Bulk Creation Complete",
      description: `Successfully created ${successCount} ingredients`
    });
    
    onComplete();
    setTimeout(() => {
      onOpenChange(false);
      setIngredients([]);
      setProgress(0);
    }, 2000);
  };

  const removeIngredient = (index: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const resetAll = () => {
    setIngredients([]);
    setProgress(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Bulk Voice Ingredient Creation
          </DialogTitle>
          <DialogDescription>
            Dictate multiple ingredients separated by commas. The system will automatically translate German names and assign appropriate tags.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Voice Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Voice Input</CardTitle>
              <CardDescription>
                Say ingredients with prices like: "Avocado 2 Euro, Kartoffel 1.50 pro kg, Zwiebel 0.80 pro Kilo, Olivenöl 12 Euro pro Liter"
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EnhancedVoiceInput
                language="de"
                onResult={handleVoiceResult}
                label="Dictate ingredient list with prices (German)"
                model="nova-2"
              />
              {(processing || isAnalyzing) && (
                <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isAnalyzing ? 'AI analyzing ingredients for dietary properties...' : 'Processing and translating ingredients...'}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Parsed Ingredients */}
          {ingredients.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">Parsed Ingredients ({ingredients.length})</CardTitle>
                    <CardDescription>
                      Review the parsed ingredients before creating them in the database
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={resetAll}>
                      Reset All
                    </Button>
                    <Button 
                      onClick={createIngredients} 
                      disabled={creating || ingredients.every(ing => ing.status === 'error')}
                      className="min-w-[120px]"
                    >
                      {creating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Create All
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {creating && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-muted-foreground mb-2">
                      <span>Creating ingredients...</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="w-full" />
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ingredients.map((ingredient, index) => (
                    <Card key={index} className="relative">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-base">{ingredient.name_de}</CardTitle>
                            {ingredient.name_en && (
                              <CardDescription className="text-sm">
                                English: {ingredient.name_en}
                              </CardDescription>
                            )}
                            {ingredient.price && (
                              <CardDescription className="text-sm font-medium text-green-600">
                                €{ingredient.price.toFixed(2)}{ingredient.priceUnit ? ` ${ingredient.priceUnit}` : ''}
                              </CardDescription>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Confidence Badge */}
                            <Badge 
                              variant={
                                ingredient.confidence === 'high' ? 'default' : 
                                ingredient.confidence === 'medium' ? 'secondary' : 
                                'outline'
                              }
                              className="text-xs"
                            >
                              {ingredient.confidence}
                            </Badge>
                            
                            {/* Status Badge */}
                            {ingredient.status === 'pending' && (
                              <Badge variant="secondary">Pending</Badge>
                            )}
                            {ingredient.status === 'processing' && (
                              <Badge variant="secondary">
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                Translating
                              </Badge>
                            )}
                            {ingredient.status === 'analyzing' && (
                              <Badge variant="secondary">
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                AI Analyzing
                              </Badge>
                            )}
                            {ingredient.status === 'completed' && (
                              <Badge variant="default">
                                <Check className="h-3 w-3 mr-1" />
                                {ingredient.aiSuggested ? 'AI Enhanced' : 'Ready'}
                              </Badge>
                            )}
                            {ingredient.status === 'error' && (
                              <Badge variant="destructive">
                                <X className="h-3 w-3 mr-1" />
                                Error
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeIngredient(index)}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {/* Dietary Properties */}
                        {ingredient.tags.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs text-muted-foreground mb-1">Dietary Properties:</p>
                            <div className="flex flex-wrap gap-1">
                              {ingredient.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Allergens */} 
                        {ingredient.allergens && ingredient.allergens.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs text-muted-foreground mb-1">Allergens:</p>
                            <div className="flex flex-wrap gap-1">
                              {ingredient.allergens.map((allergen) => (
                                <Badge key={allergen} variant="destructive" className="text-xs">
                                  {allergen}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* AI Confidence */}
                        {ingredient.aiConfidence && (
                          <div className="mb-2">
                            <p className="text-xs text-muted-foreground">
                              AI Confidence: {ingredient.aiConfidence}%
                              {ingredient.needsReview && (
                                <span className="text-orange-500 ml-2">• Needs Review</span>
                              )}
                            </p>
                          </div>
                        )}
                        {ingredient.error && (
                          <p className="text-xs text-red-500 mt-1">{ingredient.error}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How it works</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• <strong>Voice Input with Prices:</strong> Dictate "Avocado 2 Euro, Kartoffel 1.50 pro kg"</li>
                <li>• <strong>Smart Price Parsing:</strong> Automatically extracts prices and units from speech</li>
                <li>• <strong>Auto-Translation:</strong> German names are translated to English using DeepSeek AI</li>
                <li>• <strong>Confidence Scoring:</strong> Each ingredient gets a confidence rating (high/medium/low)</li>
                <li>• <strong>Smart Tagging:</strong> Dietary properties are automatically assigned based on ingredient type</li>
                <li>• <strong>Category Detection:</strong> Ingredients are automatically categorized</li>
                <li>• <strong>Cost Integration:</strong> Parsed prices are automatically set as cost per unit</li>
                <li>• <strong>Unit Recognition:</strong> Supports kg, g, l, ml, piece, etc.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}