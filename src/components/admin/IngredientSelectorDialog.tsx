import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Ingredient {
  id: string;
  name: string;
  name_en?: string;
  name_de?: string;
  unit: string;
  cost_per_unit?: number;
  category_id: string;
  category?: {
    name: string;
  };
}

interface IngredientSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (ingredient: Ingredient, quantity: number, unit: string, notes?: string) => void;
  selectedIngredients: string[];
}

export function IngredientSelectorDialog({
  open,
  onOpenChange,
  onSelect,
  selectedIngredients
}: IngredientSelectorDialogProps) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchIngredients();
    }
  }, [open]);

  const fetchIngredients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ingredients')
        .select(`
          id,
          name,
          name_en,
          name_de,
          unit,
          cost_per_unit,
          category_id,
          category:ingredient_categories(name)
        `)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setIngredients(data || []);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch ingredients',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredIngredients = ingredients.filter(ingredient => {
    const matchesSearch = ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ingredient.name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ingredient.name_de?.toLowerCase().includes(searchTerm.toLowerCase());
    const notSelected = !selectedIngredients.includes(ingredient.id);
    return matchesSearch && notSelected;
  });

  const handleSelectIngredient = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setUnit(ingredient.unit);
    setQuantity(1);
    setNotes('');
  };

  const handleAddIngredient = () => {
    if (!selectedIngredient) return;
    
    onSelect(selectedIngredient, quantity, unit, notes);
    setSelectedIngredient(null);
    setQuantity(1);
    setUnit('');
    setNotes('');
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedIngredient(null);
    setQuantity(1);
    setUnit('');
    setNotes('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Ingredient</DialogTitle>
          <DialogDescription>
            Search and select an ingredient to add to your prep
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex gap-6">
          {/* Left side - Ingredient Selection */}
          <div className="flex-1 flex flex-col">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search ingredients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="text-center py-8">Loading ingredients...</div>
              ) : filteredIngredients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'No matching ingredients found' : 'No ingredients available'}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredIngredients.map((ingredient) => (
                    <Card
                      key={ingredient.id}
                      className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedIngredient?.id === ingredient.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => handleSelectIngredient(ingredient)}
                    >
                      <CardContent className="p-3">
                        <div className="font-medium text-sm">{ingredient.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {ingredient.category?.name} • {ingredient.unit}
                          {ingredient.cost_per_unit && ` • €${ingredient.cost_per_unit}/${ingredient.unit}`}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right side - Ingredient Details */}
          {selectedIngredient && (
            <div className="w-80 border-l pl-6">
              <h3 className="font-medium mb-4">Ingredient Details</h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Selected Ingredient</Label>
                  <div className="mt-1 p-2 bg-muted rounded text-sm">
                    {selectedIngredient.name}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="quantity" className="text-sm font-medium">
                      Quantity *
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="unit" className="text-sm font-medium">
                      Unit
                    </Label>
                    <Input
                      id="unit"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder={selectedIngredient.unit}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes" className="text-sm font-medium">
                    Notes (optional)
                  </Label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g., chopped, diced, etc."
                    className="mt-1"
                  />
                </div>

                {selectedIngredient.cost_per_unit && (
                  <div className="p-3 bg-muted rounded">
                    <div className="text-sm font-medium">Estimated Cost</div>
                    <div className="text-lg">
                      €{(selectedIngredient.cost_per_unit * quantity).toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      €{selectedIngredient.cost_per_unit} per {selectedIngredient.unit}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddIngredient}
            disabled={!selectedIngredient || quantity <= 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Ingredient
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}