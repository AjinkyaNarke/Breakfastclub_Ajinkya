import React, { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Languages, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { usePrepTranslation } from '@/hooks/usePrepTranslation';
import { IngredientSelectorDialog } from './IngredientSelectorDialog';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string(),
  instructions: z.string(),
  batch_yield: z.string(),
  batch_yield_amount: z.number().optional(),
  batch_yield_unit: z.string(),
  notes: z.string(),
});

type FormData = z.infer<typeof formSchema>;

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

interface SimplePrepDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialData?: Partial<FormData>;
}

export function SimplePrepDialog({
  open,
  onOpenChange,
  onSuccess,
  initialData
}: SimplePrepDialogProps) {
  const [ingredients, setIngredients] = useState<PrepIngredient[]>([]);
  const [showIngredientSelector, setShowIngredientSelector] = useState(false);

  const { createPrepWithTranslation, isTranslating } = usePrepTranslation();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      instructions: initialData?.instructions || '',
      batch_yield: initialData?.batch_yield || '',
      batch_yield_amount: initialData?.batch_yield_amount || undefined,
      batch_yield_unit: initialData?.batch_yield_unit || '',
      notes: initialData?.notes || '',
    },
  });

  const handleSubmit = async (data: FormData) => {
    try {
      const prepData = {
        ...data,
        ingredients: ingredients.map(ing => ({
          ingredient_id: ing.ingredient_id,
          quantity: ing.quantity,
          unit: ing.unit,
          notes: ing.notes,
        })),
      };

      await createPrepWithTranslation(prepData, 'en', true);

      form.reset();
      setIngredients([]);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error creating prep:', error);
    }
  };

  const addIngredient = (ingredient: any, quantity: number, unit: string, notes?: string) => {
    const newIngredient: PrepIngredient = {
      ingredient_id: ingredient.id,
      quantity,
      unit,
      notes,
      ingredient: {
        id: ingredient.id,
        name: ingredient.name,
        name_en: ingredient.name_en,
        name_de: ingredient.name_de,
        unit: ingredient.unit,
        cost_per_unit: ingredient.cost_per_unit,
      },
    };

    setIngredients(prev => [...prev, newIngredient]);
    setShowIngredientSelector(false);
  };

  const removeIngredient = (index: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const getTotalEstimatedCost = () => {
    return ingredients.reduce((total, ing) => {
      if (ing.ingredient?.cost_per_unit) {
        return total + (ing.quantity * ing.ingredient.cost_per_unit);
      }
      return total;
    }, 0);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Prep</DialogTitle>
            <DialogDescription>
              Create a new preparation with ingredients. Automatic translation included.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prep Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Green Curry Paste" {...field} />
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
                      <FormLabel>Batch Yield</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 500ml, 2 cups" {...field} />
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
                      <FormLabel>Yield Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="500"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
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
                      <FormLabel>Yield Unit</FormLabel>
                      <FormControl>
                        <Input placeholder="ml, g, cups" {...field} />
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of the prep..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preparation Instructions</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Step-by-step instructions..."
                        className="resize-none"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Ingredients Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Ingredients</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowIngredientSelector(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Ingredient
                  </Button>
                </div>

                {ingredients.length > 0 && (
                  <div className="space-y-2">
                    {ingredients.map((ing, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{ing.ingredient?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {ing.quantity} {ing.unit}
                            {ing.ingredient?.cost_per_unit && (
                              <span className="ml-2">
                                (€{(ing.quantity * ing.ingredient.cost_per_unit).toFixed(2)})
                              </span>
                            )}
                          </p>
                          {ing.notes && (
                            <p className="text-xs text-muted-foreground">{ing.notes}</p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeIngredient(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    {getTotalEstimatedCost() > 0 && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium">
                          Estimated Cost: €{getTotalEstimatedCost().toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {ingredients.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No ingredients added yet</p>
                    <p className="text-sm">Click "Add Ingredient" to start building your prep</p>
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes or tips..."
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
                  onClick={() => onOpenChange(false)}
                  disabled={isTranslating}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isTranslating}>
                  {isTranslating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isTranslating ? 'Creating...' : 'Create Prep'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <IngredientSelectorDialog
        open={showIngredientSelector}
        onOpenChange={setShowIngredientSelector}
        onSelect={addIngredient}
        selectedIngredients={ingredients.map(ing => ing.ingredient_id)}
      />
    </>
  );
}