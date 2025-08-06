import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { analyzeIngredientWithDeepSeek, analyzeIngredientBatch, type SmartTaggingResult } from '@/integrations/deepseek/smartTagging';

interface TagSuggestion {
  ingredient: string;
  result: SmartTaggingResult;
  status: 'pending' | 'accepted' | 'rejected' | 'manual';
}

interface SmartTaggingOptions {
  autoApplyThreshold: number; // Only auto-apply if confidence > this value (default: 95)
  conservativeMode: boolean; // If true, never auto-apply, always ask user (default: true)
  requireManualReview: string[]; // Ingredient types that always require manual review
}

export function useSmartTagging() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const defaultOptions: SmartTaggingOptions = {
    autoApplyThreshold: 95,
    conservativeMode: true,
    requireManualReview: ['processed', 'mixed', 'sauce', 'blend', 'mixture']
  };

  const analyzeIngredient = async (
    ingredientName: string,
    language: 'en' | 'de' = 'de',
    options: Partial<SmartTaggingOptions> = {}
  ): Promise<SmartTaggingResult | null> => {
    const opts = { ...defaultOptions, ...options };
    
    if (!ingredientName.trim()) {
      toast({
        title: 'Analysis Error',
        description: 'Ingredient name cannot be empty',
        variant: 'destructive'
      });
      return null;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeIngredientWithDeepSeek(ingredientName, language);
      
      // Conservative logic: check if ingredient requires manual review
      const requiresManualReview = opts.requireManualReview.some(term =>
        ingredientName.toLowerCase().includes(term)
      );

      // Override auto-apply if conservative mode or requires manual review
      if (opts.conservativeMode || requiresManualReview) {
        result.shouldAutoApply = false;
      }

      // Additional conservative checks
      if (result.analysis.warnings.length > 0) {
        result.shouldAutoApply = false;
      }

      // Check confidence threshold
      if (result.analysis.overallConfidence < opts.autoApplyThreshold) {
        result.shouldAutoApply = false;
      }

      // Add to suggestions if not auto-applying
      if (!result.shouldAutoApply) {
        setSuggestions(prev => [...prev, {
          ingredient: ingredientName,
          result,
          status: 'pending'
        }]);
      }

      toast({
        title: 'Analysis Complete',
        description: `${ingredientName} analyzed (${result.analysis.overallConfidence}% confidence)${result.shouldAutoApply ? ' - Auto-applied' : ' - Review suggested'}`,
        variant: result.analysis.warnings.length > 0 ? 'destructive' : 'default'
      });

      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMessage);
      
      toast({
        title: 'Analysis Failed',
        description: `${ingredientName}: ${errorMessage}`,
        variant: 'destructive'
      });

      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeBatch = async (
    ingredients: string[],
    language: 'en' | 'de' = 'de',
    options: Partial<SmartTaggingOptions> = {},
    onProgress?: (completed: number, total: number) => void
  ): Promise<SmartTaggingResult[]> => {
    const opts = { ...defaultOptions, ...options };
    
    if (ingredients.length === 0) {
      toast({
        title: 'Analysis Error',
        description: 'No ingredients to analyze',
        variant: 'destructive'
      });
      return [];
    }

    setIsAnalyzing(true);
    setError(null);
    setSuggestions([]); // Clear previous suggestions

    try {
      const results = await analyzeIngredientBatch(ingredients, language, onProgress);
      
      // Apply conservative logic to all results
      const processedResults = results.map(result => {
        const ingredientName = result.analysis.ingredient;
        
        // Conservative checks
        const requiresManualReview = opts.requireManualReview.some(term =>
          ingredientName.toLowerCase().includes(term)
        );

        if (opts.conservativeMode || requiresManualReview || 
            result.analysis.warnings.length > 0 ||
            result.analysis.overallConfidence < opts.autoApplyThreshold) {
          result.shouldAutoApply = false;
        }

        return result;
      });

      // Separate auto-apply from suggestions
      const autoApplyResults: SmartTaggingResult[] = [];
      const suggestionResults: TagSuggestion[] = [];

      processedResults.forEach(result => {
        if (result.shouldAutoApply) {
          autoApplyResults.push(result);
        } else {
          suggestionResults.push({
            ingredient: result.analysis.ingredient,
            result,
            status: 'pending'
          });
        }
      });

      setSuggestions(suggestionResults);

      const autoAppliedCount = autoApplyResults.length;
      const suggestionCount = suggestionResults.length;
      const failedCount = results.filter(r => r.analysis.overallConfidence < 20).length;

      toast({
        title: 'Batch Analysis Complete',
        description: `${autoAppliedCount} auto-applied, ${suggestionCount} need review, ${failedCount} failed`,
        variant: failedCount > 0 ? 'destructive' : 'default'
      });

      return processedResults;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Batch analysis failed';
      setError(errorMessage);
      
      toast({
        title: 'Batch Analysis Failed',
        description: errorMessage,
        variant: 'destructive'
      });

      return [];
    } finally {
      setIsAnalyzing(false);
    }
  };

  const acceptSuggestion = (ingredient: string) => {
    setSuggestions(prev => 
      prev.map(s => 
        s.ingredient === ingredient 
          ? { ...s, status: 'accepted' as const }
          : s
      )
    );
    
    toast({
      title: 'Suggestion Accepted',
      description: `Applied AI suggestions for ${ingredient}`,
    });
  };

  const rejectSuggestion = (ingredient: string) => {
    setSuggestions(prev => 
      prev.map(s => 
        s.ingredient === ingredient 
          ? { ...s, status: 'rejected' as const }
          : s
      )
    );
    
    toast({
      title: 'Suggestion Rejected',
      description: `Rejected AI suggestions for ${ingredient}`,
    });
  };

  const markForManualReview = (ingredient: string) => {
    setSuggestions(prev => 
      prev.map(s => 
        s.ingredient === ingredient 
          ? { ...s, status: 'manual' as const }
          : s
      )
    );
    
    toast({
      title: 'Marked for Manual Review',
      description: `${ingredient} will be reviewed manually`,
    });
  };

  const clearSuggestions = () => {
    setSuggestions([]);
  };

  const clearError = () => {
    setError(null);
  };

  // Get accepted suggestions for applying to ingredients
  const getAcceptedTags = (ingredient: string): {
    dietaryProperties: string[];
    allergens: string[];
    category: string;
  } => {
    const suggestion = suggestions.find(s => 
      s.ingredient === ingredient && s.status === 'accepted'
    );

    if (!suggestion) {
      return { dietaryProperties: [], allergens: [], category: '' };
    }

    return {
      dietaryProperties: suggestion.result.suggestedTags,
      allergens: suggestion.result.suggestedAllergens,
      category: suggestion.result.suggestedCategory
    };
  };

  // Statistics for dashboard
  const getAnalysisStats = () => {
    const total = suggestions.length;
    const accepted = suggestions.filter(s => s.status === 'accepted').length;
    const rejected = suggestions.filter(s => s.status === 'rejected').length;
    const pending = suggestions.filter(s => s.status === 'pending').length;
    const manual = suggestions.filter(s => s.status === 'manual').length;

    return {
      total,
      accepted,
      rejected,
      pending,
      manual,
      acceptanceRate: total > 0 ? (accepted / total) * 100 : 0
    };
  };

  return {
    analyzeIngredient,
    analyzeBatch,
    acceptSuggestion,
    rejectSuggestion,
    markForManualReview,
    clearSuggestions,
    clearError,
    getAcceptedTags,
    getAnalysisStats,
    suggestions,
    isAnalyzing,
    error
  };
}