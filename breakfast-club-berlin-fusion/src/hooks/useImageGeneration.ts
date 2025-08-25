import { useState, useCallback } from 'react';
import { ImageGenerationService, ImageGenerationResult, IngredientForGeneration } from '@/services/ImageGenerationService';
import { useToast } from '@/hooks/use-toast';

export interface UseImageGenerationReturn {
  generateImage: (ingredient: IngredientForGeneration) => Promise<ImageGenerationResult>;
  batchGenerateImages: (ingredients: IngredientForGeneration[]) => Promise<{
    total: number;
    successful: number;
    failed: number;
    results: Array<{ ingredientId: string; success: boolean; error?: string; imageUrl?: string }>;
  }>;
  isGenerating: boolean;
  isBatchGenerating: boolean;
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
}

export const useImageGeneration = (): UseImageGenerationReturn => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, percentage: 0 });
  const { toast } = useToast();

  const generateImage = useCallback(async (ingredient: IngredientForGeneration): Promise<ImageGenerationResult> => {
    setIsGenerating(true);
    try {
      const result = await ImageGenerationService.generateImageForIngredient(ingredient);
      
      if (result.success) {
        toast({
          title: 'Image Generated',
          description: `Successfully generated image for ${ingredient.name}`,
        });
      } else {
        toast({
          title: 'Generation Failed',
          description: result.error || 'Failed to generate image',
          variant: 'destructive',
        });
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: 'Generation Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return { success: false, error: errorMessage };
    } finally {
      setIsGenerating(false);
    }
  }, [toast]);

  const batchGenerateImages = useCallback(async (ingredients: IngredientForGeneration[]) => {
    setIsBatchGenerating(true);
    setProgress({ current: 0, total: ingredients.length, percentage: 0 });
    
    try {
      const result = await ImageGenerationService.batchGenerateImages(ingredients);
      
      // Update progress as we go
      setProgress({ 
        current: result.total, 
        total: result.total, 
        percentage: 100 
      });
      
      toast({
        title: 'Batch Generation Complete',
        description: `Generated ${result.successful} images successfully, ${result.failed} failed`,
        variant: result.failed > 0 ? 'destructive' : 'default',
      });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: 'Batch Generation Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return {
        total: ingredients.length,
        successful: 0,
        failed: ingredients.length,
        results: ingredients.map(ingredient => ({
          ingredientId: ingredient.id,
          success: false,
          error: errorMessage,
        })),
      };
    } finally {
      setIsBatchGenerating(false);
      setProgress({ current: 0, total: 0, percentage: 0 });
    }
  }, [toast]);

  return {
    generateImage,
    batchGenerateImages,
    isGenerating,
    isBatchGenerating,
    progress,
  };
}; 