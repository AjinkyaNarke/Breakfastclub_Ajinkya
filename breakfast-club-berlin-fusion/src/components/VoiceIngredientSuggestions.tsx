import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Plus, CheckCircle, X, Search, Sparkles, AlertTriangle, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface IngredientSuggestion {
  name: string;
  confidence: number;
  source: 'speech' | 'database' | 'ai';
  category?: string;
  isSelected: boolean;
  isExisting: boolean;
}

interface VoiceIngredientSuggestionsProps {
  transcript: string;
  existingIngredients: string[];
  onAddIngredient: (ingredient: string) => void;
  onRemoveIngredient: (ingredient: string) => void;
  onConfirmAll: (ingredients: string[]) => void;
  className?: string;
}

export const VoiceIngredientSuggestions: React.FC<VoiceIngredientSuggestionsProps> = ({
  transcript,
  existingIngredients,
  onAddIngredient,
  onRemoveIngredient,
  onConfirmAll,
  className = '',
}) => {
  const [suggestions, setSuggestions] = useState<IngredientSuggestion[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Extract potential ingredients from transcript
  const extractIngredientsFromSpeech = (text: string): string[] => {
    const commonIngredients = [
      'eggs', 'milk', 'flour', 'sugar', 'salt', 'pepper', 'butter', 'oil',
      'tomatoes', 'onions', 'garlic', 'cheese', 'bread', 'rice', 'pasta',
      'chicken', 'beef', 'pork', 'fish', 'shrimp', 'bacon', 'ham',
      'lettuce', 'spinach', 'carrots', 'potatoes', 'mushrooms',
      'basil', 'oregano', 'thyme', 'rosemary', 'parsley',
      'lemon', 'lime', 'orange', 'apple', 'banana', 'strawberry',
      'chocolate', 'vanilla', 'cinnamon', 'nutmeg', 'ginger',
      'yogurt', 'cream', 'sour cream', 'mayonnaise', 'mustard',
      'ketchup', 'soy sauce', 'vinegar', 'honey', 'maple syrup'
    ];

    const words = text.toLowerCase().split(/\s+/);
    const foundIngredients: string[] = [];

    commonIngredients.forEach(ingredient => {
      if (words.some(word => word.includes(ingredient) || ingredient.includes(word))) {
        foundIngredients.push(ingredient);
      }
    });

    return foundIngredients;
  };

  // Generate AI suggestions based on context
  const generateAISuggestions = (text: string): string[] => {
    // This would typically call an AI service
    // For now, we'll use a simple heuristic approach
    const contextKeywords = {
      'breakfast': ['eggs', 'bacon', 'toast', 'pancakes', 'waffles', 'oatmeal'],
      'lunch': ['bread', 'lettuce', 'tomato', 'cheese', 'ham', 'turkey'],
      'dinner': ['pasta', 'rice', 'chicken', 'beef', 'fish', 'vegetables'],
      'dessert': ['sugar', 'chocolate', 'vanilla', 'cream', 'fruit'],
      'italian': ['pasta', 'tomato', 'basil', 'oregano', 'parmesan'],
      'asian': ['rice', 'soy sauce', 'ginger', 'garlic', 'sesame'],
      'mexican': ['beans', 'corn', 'chili', 'lime', 'cilantro']
    };

    const suggestions: string[] = [];
    const lowerText = text.toLowerCase();

    Object.entries(contextKeywords).forEach(([keyword, ingredients]) => {
      if (lowerText.includes(keyword)) {
        suggestions.push(...ingredients);
      }
    });

    return [...new Set(suggestions)]; // Remove duplicates
  };

  // Generate suggestions from database
  const generateDatabaseSuggestions = (): string[] => {
    // This would typically query the ingredient database
    // For now, we'll return a subset of existing ingredients
    return existingIngredients.slice(0, 10);
  };

  useEffect(() => {
    setIsLoading(true);
    
    // Generate all types of suggestions
    const speechIngredients = extractIngredientsFromSpeech(transcript);
    const aiSuggestions = generateAISuggestions(transcript);
    const dbSuggestions = generateDatabaseSuggestions();

    // Combine and deduplicate suggestions
    const allSuggestions = new Map<string, IngredientSuggestion>();

    // Add speech-based suggestions
    speechIngredients.forEach(ingredient => {
      allSuggestions.set(ingredient, {
        name: ingredient,
        confidence: 0.8,
        source: 'speech',
        isSelected: false,
        isExisting: existingIngredients.includes(ingredient)
      });
    });

    // Add AI suggestions
    aiSuggestions.forEach(ingredient => {
      if (!allSuggestions.has(ingredient)) {
        allSuggestions.set(ingredient, {
          name: ingredient,
          confidence: 0.6,
          source: 'ai',
          isSelected: false,
          isExisting: existingIngredients.includes(ingredient)
        });
      }
    });

    // Add database suggestions
    dbSuggestions.forEach(ingredient => {
      if (!allSuggestions.has(ingredient)) {
        allSuggestions.set(ingredient, {
          name: ingredient,
          confidence: 0.9,
          source: 'database',
          isSelected: false,
          isExisting: true
        });
      }
    });

    setSuggestions(Array.from(allSuggestions.values()));
    setIsLoading(false);
  }, [transcript, existingIngredients]);

  const handleToggleIngredient = (ingredient: IngredientSuggestion) => {
    if (ingredient.isSelected) {
      setSelectedIngredients(prev => prev.filter(i => i !== ingredient.name));
      onRemoveIngredient(ingredient.name);
    } else {
      setSelectedIngredients(prev => [...prev, ingredient.name]);
      onAddIngredient(ingredient.name);
    }

    setSuggestions(prev => 
      prev.map(s => 
        s.name === ingredient.name 
          ? { ...s, isSelected: !s.isSelected }
          : s
      )
    );
  };

  const handleConfirmAll = () => {
    onConfirmAll(selectedIngredients);
  };

  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'speech': return <Search className="h-3 w-3" />;
      case 'ai': return <Sparkles className="h-3 w-3" />;
      case 'database': return <Database className="h-3 w-3" />;
      default: return <Search className="h-3 w-3" />;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'speech': return 'text-blue-600';
      case 'ai': return 'text-purple-600';
      case 'database': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-blue-600';
    return 'text-yellow-600';
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-green-500" />
          Ingredient Suggestions
          <Badge variant="outline" className="text-xs ml-auto">
            {selectedIngredients.length} selected
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Search Ingredients</Label>
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for ingredients..."
            className="w-full"
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
            <span className="ml-2 text-sm text-gray-600">Analyzing transcript...</span>
          </div>
        )}

        {/* Suggestions */}
        {!isLoading && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">
                Suggested Ingredients ({filteredSuggestions.length})
              </h4>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Search className="h-3 w-3 text-blue-600" />
                  Speech
                </div>
                <div className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-purple-600" />
                  AI
                </div>
                <div className="flex items-center gap-1">
                  <Database className="h-3 w-3 text-green-600" />
                  Database
                </div>
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredSuggestions.map((suggestion) => (
                <div
                  key={suggestion.name}
                  className={cn(
                    'flex items-center justify-between p-2 rounded border transition-all duration-200 cursor-pointer',
                    suggestion.isSelected 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  )}
                  onClick={() => handleToggleIngredient(suggestion)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'flex items-center gap-1',
                      getSourceColor(suggestion.source)
                    )}>
                      {getSourceIcon(suggestion.source)}
                    </div>
                    <span className="text-sm font-medium">
                      {suggestion.name}
                    </span>
                    {suggestion.isExisting && (
                      <Badge variant="outline" className="text-xs">
                        Existing
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'text-xs font-mono',
                      getConfidenceColor(suggestion.confidence)
                    )}>
                      {(suggestion.confidence * 100).toFixed(0)}%
                    </span>
                    {suggestion.isSelected ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Plus className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredSuggestions.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No ingredients found matching your search.</p>
              </div>
            )}
          </div>
        )}

        {/* Selected Ingredients Summary */}
        {selectedIngredients.length > 0 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-700">
                Selected Ingredients ({selectedIngredients.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {selectedIngredients.map((ingredient) => (
                <Badge key={ingredient} variant="default" className="text-xs">
                  {ingredient}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={handleConfirmAll}
            disabled={selectedIngredients.length === 0}
            className="flex-1"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Add {selectedIngredients.length} Ingredients
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedIngredients([]);
              setSuggestions(prev => prev.map(s => ({ ...s, isSelected: false })));
            }}
            disabled={selectedIngredients.length === 0}
          >
            <X className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Quick ingredient selector component
interface QuickIngredientSelectorProps {
  ingredients: string[];
  onSelect: (ingredient: string) => void;
  className?: string;
}

export const QuickIngredientSelector: React.FC<QuickIngredientSelectorProps> = ({
  ingredients,
  onSelect,
  className = '',
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-sm font-medium">Quick Add</Label>
      <div className="flex flex-wrap gap-2">
        {ingredients.map((ingredient) => (
          <Button
            key={ingredient}
            size="sm"
            variant="outline"
            onClick={() => onSelect(ingredient)}
            className="text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            {ingredient}
          </Button>
        ))}
      </div>
    </div>
  );
};

// Ingredient validation component
interface IngredientValidationProps {
  ingredients: string[];
  onValidate: (validIngredients: string[]) => void;
  className?: string;
}

export const IngredientValidation: React.FC<IngredientValidationProps> = ({
  ingredients,
  onValidate,
  className = '',
}) => {
  const [validationResults, setValidationResults] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Simulate validation - in real app, this would check against database
    const results: Record<string, boolean> = {};
    ingredients.forEach(ingredient => {
      // Simple validation: check if ingredient name is reasonable
      const isValid = ingredient.length >= 2 && ingredient.length <= 50;
      results[ingredient] = isValid;
    });
    setValidationResults(results);
  }, [ingredients]);

  const validIngredients = ingredients.filter(ingredient => validationResults[ingredient]);
  const invalidIngredients = ingredients.filter(ingredient => !validationResults[ingredient]);

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Ingredient Validation</h4>
        
        {validIngredients.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-700">
                Valid Ingredients ({validIngredients.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {validIngredients.map((ingredient) => (
                <Badge key={ingredient} variant="default" className="text-xs">
                  {ingredient}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {invalidIngredients.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-red-700">
                Invalid Ingredients ({invalidIngredients.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {invalidIngredients.map((ingredient) => (
                <Badge key={ingredient} variant="destructive" className="text-xs">
                  {ingredient}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={() => onValidate(validIngredients)}
          disabled={validIngredients.length === 0}
          className="w-full"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Use Valid Ingredients ({validIngredients.length})
        </Button>
      </CardContent>
    </Card>
  );
}; 