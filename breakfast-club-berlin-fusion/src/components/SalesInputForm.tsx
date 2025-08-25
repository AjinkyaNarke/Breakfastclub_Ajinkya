import React, { useState, useEffect } from 'react';
import { createSalesEntry, getSalesCategories } from '@/integrations/supabase/salesData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Loader2, DollarSign, Calendar, Tag, CreditCard } from 'lucide-react';

interface SalesEntry {
  date: string;
  amount: number;
  currency: string;
  category: string;
  description?: string;
  items?: number;
  payment_method?: 'cash' | 'card' | 'digital';
}

interface SalesCategory {
  name: string;
  name_de: string;
  name_en: string;
  description: string;
  color: string;
}

const SalesInputForm: React.FC = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<SalesEntry>({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    currency: 'EUR',
    category: '',
    description: '',
    items: 1,
    payment_method: 'cash'
  });
  const [categories, setCategories] = useState<SalesCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true);
      try {
        const categoriesData = await getSalesCategories();
        setCategories(categoriesData);
        if (categoriesData.length > 0) {
          setFormData(prev => ({ ...prev, category: categoriesData[0].name }));
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load sales categories",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, [toast]);

  const handleInputChange = (field: keyof SalesEntry, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.date) return "Date is required";
    if (!formData.amount || formData.amount <= 0) return "Amount must be greater than 0";
    if (!formData.category) return "Category is required";
    if (!formData.items || formData.items <= 0) return "Items must be greater than 0";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      toast({
        title: "Validation Error",
        description: validationError,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createSalesEntry({
        date: formData.date,
        amount: formData.amount,
        currency: formData.currency,
        category: formData.category,
        description: formData.description || undefined,
        items: formData.items,
        payment_method: formData.payment_method,
        source: 'manual'
      });

      if (result.success) {
        toast({
          title: "Success",
          description: `Sales entry saved successfully! ${result.validation?.warnings?.length ? 'Some warnings were noted.' : ''}`,
          variant: "default"
        });

        // Show validation warnings if any
        if (result.validation?.warnings && result.validation.warnings.length > 0) {
          toast({
            title: "Validation Warnings",
            description: result.validation.warnings.join(', '),
            variant: "default"
          });
        }

        // Reset form
        setFormData({
          date: new Date().toISOString().split('T')[0],
          amount: 0,
          currency: 'EUR',
          category: categories[0]?.name || '',
          description: '',
          items: 1,
          payment_method: 'cash'
        });
      }
    } catch (error) {
      console.error('Sales entry error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save sales entry",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = categories.find(cat => cat.name === formData.category);

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading sales categories...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-6 w-6" />
          Enter Sales Data
        </CardTitle>
        <CardDescription>
          Record daily sales transactions with detailed categorization and validation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date and Amount Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Amount (€)
              </Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount || ''}
                onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Category and Items Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Category
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.name} value={category.name}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        <span>{category.name_en}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCategory && (
                <p className="text-sm text-muted-foreground">
                  {selectedCategory.description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="items">Number of Items</Label>
              <Input
                id="items"
                type="number"
                min="1"
                value={formData.items || ''}
                onChange={(e) => handleInputChange('items', parseInt(e.target.value) || 1)}
                placeholder="1"
                required
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="payment_method" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Method
            </Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value: 'cash' | 'card' | 'digital') => handleInputChange('payment_method', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="digital">Digital Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Additional notes about this sale..."
              rows={3}
            />
          </div>

          {/* Form Summary */}
          <div className="flex flex-wrap gap-2 p-4 bg-muted rounded-lg">
            <Badge variant="outline">
              {formData.amount > 0 ? `€${formData.amount.toFixed(2)}` : 'No amount'}
            </Badge>
            <Badge variant="outline">
              {formData.category || 'No category'}
            </Badge>
            <Badge variant="outline">
              {formData.items} {formData.items === 1 ? 'item' : 'items'}
            </Badge>
            <Badge variant="outline">
              {formData.payment_method}
            </Badge>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Sales Entry'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SalesInputForm;