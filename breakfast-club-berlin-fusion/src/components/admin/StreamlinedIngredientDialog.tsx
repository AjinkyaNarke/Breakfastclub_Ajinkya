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
import { ArrowRight, ArrowLeft, Languages, Loader2, Edit2 } from 'lucide-react';
import { translateText } from '@/integrations/deepseek/translate';
import { useTranslation } from 'react-i18next';

interface IngredientCategory {
  id: string;
  name: string;
}

interface Ingredient {
  id?: string;
  name: string;
  name_de?: string;
  name_en?: string;
  description?: string;
  description_de?: string;
  description_en?: string;
  category_id: string;
  unit: string;
  cost_per_unit?: number;
  allergens: string[];
  dietary_properties: string[];
  seasonal_availability: string[];
  supplier_info?: string;
  notes?: string;
  is_active: boolean;
}

interface IngredientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ingredient?: Ingredient;
  onSave: () => void;
}

const UNITS = ['kg', 'g', 'L', 'ml', 'piece', 'bunch', 'pack', 'can', 'bottle'];
const ALLERGENS = ['gluten', 'dairy', 'eggs', 'nuts', 'soy', 'shellfish', 'fish', 'sesame'];
const DIETARY_PROPERTIES = ['vegetarian', 'vegan', 'organic', 'local', 'seasonal', 'fair-trade'];
const SEASONS = ['spring', 'summer', 'autumn', 'winter'];

const STEP_TITLES = [
  'Basic Info',
  'Translations',
  'Properties'
];

export function StreamlinedIngredientDialog({ open, onOpenChange, ingredient, onSave }: IngredientDialogProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  
  // Form state
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  
  // Categories
  const [categories, setCategories] = useState<IngredientCategory[]>([]);
  
  // Basic form data (Step 1)
  const [basicData, setBasicData] = useState({
    name: '',
    description: '',
    category_id: '',
    unit: 'kg',
    cost_per_unit: 0
  });
  
  // Translation data (Step 2)
  const [translations, setTranslations] = useState({
    name_de: '',
    name_en: '',
    description_de: '',
    description_en: ''
  });
  
  // Properties data (Step 3)
  const [properties, setProperties] = useState({
    allergens: [] as string[],
    dietary_properties: [] as string[],
    seasonal_availability: [] as string[],
    supplier_info: '',
    notes: '',
    is_active: true
  });

  useEffect(() => {
    if (open) {
      fetchCategories();
      if (ingredient) {
        // Populate form with existing data
        setBasicData({
          name: ingredient.name,
          description: ingredient.description || '',
          category_id: ingredient.category_id,
          unit: ingredient.unit,
          cost_per_unit: ingredient.cost_per_unit || 0
        });
        setTranslations({
          name_de: ingredient.name_de || '',
          name_en: ingredient.name_en || '',
          description_de: ingredient.description_de || '',
          description_en: ingredient.description_en || ''
        });
        setProperties({
          allergens: ingredient.allergens || [],
          dietary_properties: ingredient.dietary_properties || [],
          seasonal_availability: ingredient.seasonal_availability || [],
          supplier_info: ingredient.supplier_info || '',
          notes: ingredient.notes || '',
          is_active: ingredient.is_active
        });
      } else {
        // Reset form for new item
        resetForm();
      }
    }
  }, [open, ingredient]);

  const resetForm = () => {
    setCurrentStep(0);
    setBasicData({
      name: '',
      description: '',
      category_id: '',
      unit: 'kg',
      cost_per_unit: 0
    });
    setTranslations({
      name_de: '',
      name_en: '',
      description_de: '',
      description_en: ''
    });
    setProperties({
      allergens: [],
      dietary_properties: [],
      seasonal_availability: [],
      supplier_info: '',
      notes: '',
      is_active: true
    });
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('ingredient_categories')
      .select('id, name')
      .order('name');
    
    if (error) {
      console.error('Error fetching categories:', error);
      return;
    }
    
    setCategories(data || []);
  };

  const generateTranslations = async () => {
    if (!basicData.name) {
      toast({
        title: 'Missing Information',
        description: 'Please enter ingredient name first.',
        variant: 'destructive'
      });
      return;
    }

    setIsTranslating(true);
    
    try {
      // Detect the likely source language based on content
      const hasGermanChars = /[äöüß]/i.test(basicData.name);
      const sourceLang = hasGermanChars ? 'de' : 'en';
      
      // Generate translations for name
      const [nameDE, nameEN] = await Promise.all([
        sourceLang === 'de' ? 
          Promise.resolve(basicData.name) : 
          translateText({ text: basicData.name, sourceLang: 'en', targetLang: 'de' }),
        sourceLang === 'en' ? 
          Promise.resolve(basicData.name) : 
          translateText({ text: basicData.name, sourceLang: 'de', targetLang: 'en' })
      ]);

      let descDE = '';
      let descEN = '';
      
      // Generate description translations if description exists
      if (basicData.description) {
        const descSourceLang = /[äöüß]/i.test(basicData.description) ? 'de' : 'en';
        
        [descDE, descEN] = await Promise.all([
          descSourceLang === 'de' ? 
            Promise.resolve(basicData.description) : 
            translateText({ text: basicData.description, sourceLang: 'en', targetLang: 'de' }),
          descSourceLang === 'en' ? 
            Promise.resolve(basicData.description) : 
            translateText({ text: basicData.description, sourceLang: 'de', targetLang: 'en' })
        ]);
      }

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
      // Validate basic data
      if (!basicData.name || !basicData.category_id || !basicData.unit) {
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
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      const ingredientData = {
        ...basicData,
        ...translations,
        ...properties,
        cost_per_unit: basicData.cost_per_unit || null
      };

      if (ingredient?.id) {
        // Update existing ingredient
        const { error } = await supabase
          .from('ingredients')
          .update(ingredientData)
          .eq('id', ingredient.id);
        
        if (error) throw error;
      } else {
        // Create new ingredient
        const { error } = await supabase
          .from('ingredients')
          .insert(ingredientData);
        
        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: `Ingredient ${ingredient?.id ? 'updated' : 'created'} successfully!`,
      });
      
      onSave();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error saving ingredient:', error);
      toast({
        title: 'Error',
        description: 'Failed to save ingredient. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleProperty = (property: string, type: 'allergens' | 'dietary_properties' | 'seasonal_availability') => {
    setProperties(prev => ({
      ...prev,
      [type]: prev[type].includes(property)
        ? prev[type].filter(p => p !== property)
        : [...prev[type], property]
    }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Ingredient Name *</Label>
              <Input
                id="name"
                value={basicData.name}
                onChange={(e) => setBasicData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Chicken Breast"
              />
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={basicData.description}
                onChange={(e) => setBasicData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the ingredient..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
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
              </div>

              <div>
                <Label htmlFor="unit">Unit *</Label>
                <Select 
                  value={basicData.unit} 
                  onValueChange={(value) => setBasicData(prev => ({ ...prev, unit: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map(unit => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="cost">Cost per Unit (€)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={basicData.cost_per_unit}
                onChange={(e) => setBasicData(prev => ({ ...prev, cost_per_unit: parseFloat(e.target.value) || 0 }))}
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
                {basicData.description && <p><strong>Description:</strong> {basicData.description}</p>}
                <p><strong>Unit:</strong> {basicData.unit}</p>
                {basicData.cost_per_unit > 0 && <p><strong>Cost:</strong> €{basicData.cost_per_unit}/{basicData.unit}</p>}
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
                  {basicData.description && (
                    <div>
                      <Label htmlFor="description_de">Description (German)</Label>
                      <Textarea
                        id="description_de"
                        value={translations.description_de}
                        onChange={(e) => setTranslations(prev => ({ ...prev, description_de: e.target.value }))}
                        placeholder="German description..."
                        rows={2}
                      />
                    </div>
                  )}
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
                  {basicData.description && (
                    <div>
                      <Label htmlFor="description_en">Description (English)</Label>
                      <Textarea
                        id="description_en"
                        value={translations.description_en}
                        onChange={(e) => setTranslations(prev => ({ ...prev, description_en: e.target.value }))}
                        placeholder="English description..."
                        rows={2}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label>Allergens</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {ALLERGENS.map(allergen => (
                  <Badge
                    key={allergen}
                    variant={properties.allergens.includes(allergen) ? "destructive" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleProperty(allergen, 'allergens')}
                  >
                    {allergen}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Dietary Properties</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {DIETARY_PROPERTIES.map(property => (
                  <Badge
                    key={property}
                    variant={properties.dietary_properties.includes(property) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleProperty(property, 'dietary_properties')}
                  >
                    {property}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Seasonal Availability</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {SEASONS.map(season => (
                  <Badge
                    key={season}
                    variant={properties.seasonal_availability.includes(season) ? "secondary" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleProperty(season, 'seasonal_availability')}
                  >
                    {season}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="supplier">Supplier Information</Label>
              <Input
                id="supplier"
                value={properties.supplier_info}
                onChange={(e) => setProperties(prev => ({ ...prev, supplier_info: e.target.value }))}
                placeholder="Supplier name or contact..."
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={properties.notes}
                onChange={(e) => setProperties(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about this ingredient..."
                rows={2}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={properties.is_active}
                onCheckedChange={(checked) => setProperties(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="active">Active</Label>
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
            {ingredient ? 'Edit Ingredient' : 'Create New Ingredient'}
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
                {ingredient ? 'Update' : 'Create'} Ingredient
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}