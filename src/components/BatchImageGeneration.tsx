import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useImageGeneration } from '@/hooks/useImageGeneration';
import { ImageGenerationService, IngredientForGeneration } from '@/services/ImageGenerationService';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { ImageIcon, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface BatchImageGenerationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export const BatchImageGeneration = ({ open, onOpenChange, onComplete }: BatchImageGenerationProps) => {
  const { t } = useTranslation('admin');
  const { toast } = useToast();
  const { batchGenerateImages, isBatchGenerating, progress } = useImageGeneration();
  
  const [ingredients, setIngredients] = useState<IngredientForGeneration[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Array<{ ingredientId: string; success: boolean; error?: string; imageUrl?: string }>>([]);

  // Load ingredients without images
  useEffect(() => {
    if (open) {
      loadIngredients();
    }
  }, [open]);

  const loadIngredients = async () => {
    setLoading(true);
    try {
      const ingredientsWithoutImages = await ImageGenerationService.getIngredientsWithoutImages();
      setIngredients(ingredientsWithoutImages);
      setSelectedIngredients(new Set());
      setResults([]);
    } catch (error) {
      console.error('Error loading ingredients:', error);
      toast({
        title: 'Error',
        description: 'Failed to load ingredients',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedIngredients.size === ingredients.length) {
      setSelectedIngredients(new Set());
    } else {
      setSelectedIngredients(new Set(ingredients.map(ing => ing.id)));
    }
  };

  const handleSelectIngredient = (ingredientId: string) => {
    const newSelected = new Set(selectedIngredients);
    if (newSelected.has(ingredientId)) {
      newSelected.delete(ingredientId);
    } else {
      newSelected.add(ingredientId);
    }
    setSelectedIngredients(newSelected);
  };

  const handleGenerateImages = async () => {
    if (selectedIngredients.size === 0) {
      toast({
        title: 'No Ingredients Selected',
        description: 'Please select at least one ingredient to generate images for',
        variant: 'destructive',
      });
      return;
    }

    const selectedIngredientObjects = ingredients.filter(ing => selectedIngredients.has(ing.id));
    
    try {
      const result = await batchGenerateImages(selectedIngredientObjects);
      setResults(result.results);
      
      if (result.successful > 0) {
        toast({
          title: 'Success!',
          description: `Generated ${result.successful} images successfully!`,
        });
        onComplete?.();
      } else if (result.failed > 0) {
        // Check if all failures are due to missing API key
        const apiKeyErrors = result.results.filter(r => 
          r.error?.includes('RECRAFT_API_KEY not configured')
        );
        
        if (apiKeyErrors.length > 0) {
          toast({
            title: 'Configuration Required',
            description: 'Please configure the RECRAFT_API_KEY in Supabase Dashboard → Settings → Edge Functions → Environment Variables',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Generation Failed',
            description: `Failed to generate images. Check console for details.`,
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('Error in batch generation:', error);
      toast({
        title: 'Error',
        description: 'Failed to start batch generation. Check console for details.',
        variant: 'destructive',
      });
    }
  };

  const getEstimatedCost = () => {
    const costPerImage = 0.01; // Estimated cost per image
    return (selectedIngredients.size * costPerImage).toFixed(2);
  };

  const getResultForIngredient = (ingredientId: string) => {
    return results.find(result => result.ingredientId === ingredientId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Batch Image Generation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Generation Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Ingredients</p>
                  <p className="text-2xl font-bold">{ingredients.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Selected</p>
                  <p className="text-2xl font-bold">{selectedIngredients.size}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Cost</p>
                  <p className="text-2xl font-bold">€{getEstimatedCost()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Generated</p>
                  <p className="text-2xl font-bold">{results.filter(r => r.success).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Bar */}
          {isBatchGenerating && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Generation Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Generating images...</span>
                    <span>{progress.current} / {progress.total}</span>
                  </div>
                  <Progress value={progress.percentage} className="w-full" />
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      Please wait, this may take a few minutes...
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ingredients List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Select Ingredients</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={loading || isBatchGenerating}
                >
                  {selectedIngredients.size === ingredients.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Loading ingredients...
                </div>
              ) : ingredients.length === 0 ? (
                <div className="text-center py-8">
                  <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">All ingredients already have images!</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {ingredients.map((ingredient) => {
                    const result = getResultForIngredient(ingredient.id);
                    const isSelected = selectedIngredients.has(ingredient.id);
                    
                    return (
                      <div
                        key={ingredient.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                          isSelected ? 'bg-primary/5 border-primary' : 'bg-background'
                        }`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleSelectIngredient(ingredient.id)}
                          disabled={isBatchGenerating}
                        />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{ingredient.name}</p>
                            {ingredient.category && (
                              <Badge variant="outline" className="text-xs">
                                {ingredient.category.name}
                              </Badge>
                            )}
                          </div>
                          {ingredient.name_de && ingredient.name !== ingredient.name_de && (
                            <p className="text-sm text-muted-foreground truncate">
                              {ingredient.name_de}
                            </p>
                          )}
                        </div>

                        {/* Result Status */}
                        {result && (
                          <div className="flex items-center gap-1">
                            {result.success ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-xs text-green-600">Success</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 text-red-600" />
                                <span className="text-xs text-red-600">Failed</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isBatchGenerating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateImages}
              disabled={selectedIngredients.size === 0 || isBatchGenerating}
            >
              {isBatchGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Generate Images ({selectedIngredients.size})
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 