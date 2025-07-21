
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, DollarSign, Package, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';

interface MenuItem {
  id: string;
  name: string;
  regular_price: number;
  dietary_tags: string[];
  ingredients: {
    ingredient: {
      name: string;
      cost_per_unit: number;
      unit: string;
    };
    quantity: number;
  }[];
}

interface CostMetrics {
  averageCost: number;
  averagePrice: number;
  averageMargin: number;
  mostProfitable: MenuItem | null;
  leastProfitable: MenuItem | null;
  expensiveIngredients: any[];
}

export const CostAnalysisDashboard = () => {
  const { t } = useTranslation('admin');
  const [metrics, setMetrics] = useState<CostMetrics>({
    averageCost: 0,
    averagePrice: 0,
    averageMargin: 0,
    mostProfitable: null,
    leastProfitable: null,
    expensiveIngredients: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCostAnalysis();
  }, []);

  const fetchCostAnalysis = async () => {
    try {
      // Fetch menu items with their ingredients
      const { data: menuItems, error } = await supabase
        .from('menu_items')
        .select(`
          id, name, regular_price, dietary_tags,
          menu_item_ingredients (
            quantity, unit,
            ingredient:ingredients (
              name, cost_per_unit, unit
            )
          )
        `)
        .eq('is_available', true);

      if (error) throw error;

      // Fetch ingredient costs for expensive ingredient analysis
      const { data: ingredients, error: ingredientError } = await supabase
        .from('ingredients')
        .select('name, cost_per_unit, unit')
        .eq('is_active', true)
        .order('cost_per_unit', { ascending: false })
        .limit(5);

      if (ingredientError) throw ingredientError;

      // Calculate metrics
      const itemsWithCosts = menuItems?.map(item => {
        const totalCost = item.menu_item_ingredients?.reduce((sum, mi) => {
          return sum + ((mi.ingredient?.cost_per_unit || 0) * mi.quantity);
        }, 0) || 0;

        const margin = item.regular_price ? ((item.regular_price - totalCost) / item.regular_price * 100) : 0;

        return {
          ...item,
          totalCost,
          margin,
          ingredients: item.menu_item_ingredients || []
        };
      }) || [];

      const avgCost = itemsWithCosts.reduce((sum, item) => sum + item.totalCost, 0) / (itemsWithCosts.length || 1);
      const avgPrice = itemsWithCosts.reduce((sum, item) => sum + (item.regular_price || 0), 0) / (itemsWithCosts.length || 1);
      const avgMargin = itemsWithCosts.reduce((sum, item) => sum + item.margin, 0) / (itemsWithCosts.length || 1);

      // Find most and least profitable
      const sortedByMargin = itemsWithCosts.sort((a, b) => b.margin - a.margin);

      setMetrics({
        averageCost: avgCost,
        averagePrice: avgPrice,
        averageMargin: avgMargin,
        mostProfitable: sortedByMargin[0] || null,
        leastProfitable: sortedByMargin[sortedByMargin.length - 1] || null,
        expensiveIngredients: ingredients || []
      });
    } catch (error) {
      console.error('Error fetching cost analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">{t('costAnalysis.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('costAnalysis.title')}</h2>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('costAnalysis.averageCost')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{metrics.averageCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{t('costAnalysis.perDish')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('costAnalysis.averagePrice')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{metrics.averagePrice.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{t('costAnalysis.menuPrice')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('costAnalysis.averageMargin')}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageMargin.toFixed(1)}%</div>
            <Progress value={metrics.averageMargin} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Profitability Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {metrics.mostProfitable && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                {t('costAnalysis.mostProfitable')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="font-medium">{metrics.mostProfitable.name}</div>
                <div className="text-sm text-muted-foreground">
                  {t('costAnalysis.cost')}: €{metrics.mostProfitable.totalCost?.toFixed(2)} | 
                  {t('costAnalysis.price')}: €{metrics.mostProfitable.regular_price} | 
                  {t('costAnalysis.margin')}: {metrics.mostProfitable.margin?.toFixed(1)}%
                </div>
                {metrics.mostProfitable.dietary_tags && metrics.mostProfitable.dietary_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {metrics.mostProfitable.dietary_tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {metrics.leastProfitable && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                {t('costAnalysis.leastProfitable')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="font-medium">{metrics.leastProfitable.name}</div>
                <div className="text-sm text-muted-foreground">
                  {t('costAnalysis.cost')}: €{metrics.leastProfitable.totalCost?.toFixed(2)} | 
                  {t('costAnalysis.price')}: €{metrics.leastProfitable.regular_price} | 
                  {t('costAnalysis.margin')}: {metrics.leastProfitable.margin?.toFixed(1)}%
                </div>
                {metrics.leastProfitable.dietary_tags && metrics.leastProfitable.dietary_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {metrics.leastProfitable.dietary_tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Expensive Ingredients */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            {t('costAnalysis.expensiveIngredients')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.expensiveIngredients.map((ingredient) => (
              <div key={ingredient.name} className="flex justify-between items-center p-3 border rounded">
                <div>
                  <div className="font-medium">{ingredient.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {t('costAnalysis.costPer')} {ingredient.unit}
                  </div>
                </div>
                <div className="text-lg font-bold">
                  €{ingredient.cost_per_unit?.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
