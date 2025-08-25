import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calculator, TrendingUp, TrendingDown, Package, Euro } from 'lucide-react';

interface PrepIngredient {
  id?: string;
  ingredient_id: string;
  quantity: number;
  unit: string;
  ingredient: {
    name: string;
    name_de: string;
    name_en: string;
    cost_per_unit: number;
    category?: {
      name: string;
    };
  };
}

interface PrepCostBreakdownProps {
  prep: {
    id: string;
    name: string;
    name_de: string;
    name_en: string;
    batch_yield: string;
    cost_per_batch: number;
    prep_ingredients?: PrepIngredient[];
  };
  showDetails?: boolean;
  className?: string;
}

export const PrepCostBreakdown = ({ prep, showDetails = true, className = '' }: PrepCostBreakdownProps) => {
  const { t } = useTranslation('admin');

  const getDisplayName = (ingredient: any) => {
    const currentLang = t('language') === 'de' ? 'de' : 'en';
    return ingredient[`name_${currentLang}`] || ingredient.name;
  };

  const getDisplayPrepName = () => {
    const currentLang = t('language') === 'de' ? 'de' : 'en';
    return prep[`name_${currentLang}`] || prep.name;
  };

  const calculateIngredientCosts = () => {
    if (!prep.prep_ingredients || prep.prep_ingredients.length === 0) {
      return [];
    }

    return prep.prep_ingredients.map(item => ({
      ...item,
      totalCost: item.ingredient.cost_per_unit * item.quantity,
      percentage: ((item.ingredient.cost_per_unit * item.quantity) / prep.cost_per_batch) * 100
    })).sort((a, b) => b.totalCost - a.totalCost);
  };

  const ingredientCosts = calculateIngredientCosts();
  const totalCost = prep.cost_per_batch;
  const hasIngredients = ingredientCosts.length > 0;

  const getCostEfficiency = () => {
    if (totalCost <= 5) return { level: 'excellent', color: 'text-green-600', icon: TrendingDown };
    if (totalCost <= 10) return { level: 'good', color: 'text-blue-600', icon: TrendingDown };
    if (totalCost <= 15) return { level: 'moderate', color: 'text-yellow-600', icon: TrendingUp };
    return { level: 'high', color: 'text-red-600', icon: TrendingUp };
  };

  const costEfficiency = getCostEfficiency();
  const EfficiencyIcon = costEfficiency.icon;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Cost Summary Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="h-5 w-5 text-primary" />
            {t('preps.costBreakdown', 'Cost Breakdown')}
          </CardTitle>
          <CardDescription>
            {getDisplayPrepName()} • {prep.batch_yield}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Total Cost Display */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Euro className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-lg">
                {t('preps.totalCost', 'Total Cost per Batch')}:
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-green-600">
                €{totalCost.toFixed(2)}
              </span>
              <EfficiencyIcon className={`h-5 w-5 ${costEfficiency.color}`} />
            </div>
          </div>

          {/* Cost Efficiency Indicator */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {t('preps.costEfficiency', 'Cost Efficiency')}:
            </span>
            <Badge 
              variant={costEfficiency.level === 'excellent' ? 'default' : 
                      costEfficiency.level === 'good' ? 'secondary' : 
                      costEfficiency.level === 'moderate' ? 'outline' : 'destructive'}
              className="flex items-center gap-1"
            >
              <EfficiencyIcon className="h-3 w-3" />
              {t(`preps.efficiency.${costEfficiency.level}`, costEfficiency.level)}
            </Badge>
          </div>

          {/* Cost per Unit Calculation */}
          {prep.batch_yield && (
            <div className="text-sm text-muted-foreground">
              {t('preps.costPerUnit', 'Cost per unit')}: €{(totalCost / 1).toFixed(2)} 
              {prep.batch_yield.includes('ml') && ` per ${prep.batch_yield.replace(/\d+/g, '1')}`}
              {prep.batch_yield.includes('kg') && ` per ${prep.batch_yield.replace(/\d+/g, '1')}`}
              {prep.batch_yield.includes('portion') && ` per portion`}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ingredient Cost Breakdown */}
      {showDetails && hasIngredients && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-primary" />
              {t('preps.ingredientCosts', 'Ingredient Costs')}
            </CardTitle>
            <CardDescription>
              {t('preps.ingredientCostsDescription', 'Breakdown of costs by ingredient')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {ingredientCosts.map((item, index) => (
              <div key={item.ingredient_id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{getDisplayName(item.ingredient)}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.quantity} {item.unit} × €{item.ingredient.cost_per_unit.toFixed(2)}/{item.unit}
                      {item.ingredient.category && ` • ${item.ingredient.category.name}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">€{item.totalCost.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <Progress value={item.percentage} className="h-2" />
              </div>
            ))}

            {/* Cost Distribution Summary */}
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium">{t('preps.mostExpensive', 'Most Expensive')}:</div>
                  <div className="text-muted-foreground">
                    {ingredientCosts.length > 0 && (
                      <>
                        {getDisplayName(ingredientCosts[0].ingredient)} 
                        (€{ingredientCosts[0].totalCost.toFixed(2)})
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <div className="font-medium">{t('preps.ingredientsCount', 'Ingredients')}:</div>
                  <div className="text-muted-foreground">
                    {ingredientCosts.length} {t('preps.ingredients', 'ingredients')}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cost Optimization Suggestions */}
      {showDetails && hasIngredients && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {t('preps.costOptimization', 'Cost Optimization')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ingredientCosts[0]?.percentage > 50 && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium text-yellow-800">
                      {t('preps.suggestions.highCostIngredient', 'High-cost ingredient detected')}
                    </div>
                    <div className="text-yellow-700">
                      {getDisplayName(ingredientCosts[0].ingredient)} {t('preps.suggestions.highCostIngredientDesc', 'accounts for over 50% of total cost. Consider alternatives or bulk purchasing.')}
                    </div>
                  </div>
                </div>
              )}

              {totalCost > 15 && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-red-600 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium text-red-800">
                      {t('preps.suggestions.highTotalCost', 'High total cost')}
                    </div>
                    <div className="text-red-700">
                      {t('preps.suggestions.highTotalCostDesc', 'This prep costs over €15 per batch. Review ingredient quantities and consider cost-effective alternatives.')}
                    </div>
                  </div>
                </div>
              )}

              {totalCost <= 5 && (
                <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <TrendingDown className="h-4 w-4 text-green-600 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium text-green-800">
                      {t('preps.suggestions.excellentCost', 'Excellent cost efficiency')}
                    </div>
                    <div className="text-green-700">
                      {t('preps.suggestions.excellentCostDesc', 'This prep has excellent cost efficiency. Consider if quality can be maintained with current ingredients.')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 