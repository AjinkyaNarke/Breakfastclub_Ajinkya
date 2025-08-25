import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  Info,
  AlertTriangle,
  CheckCircle,
  Target,
  Lightbulb
} from 'lucide-react';
import { PricingCalculation, CostOptimizationSuggestion, PriceRecommendation } from '@/utils/costCalculation';

interface CostBreakdownProps {
  calculation: PricingCalculation;
  recommendations?: PriceRecommendation;
  optimizationSuggestions?: CostOptimizationSuggestion[];
  className?: string;
}

export const CostBreakdownComponent: React.FC<CostBreakdownProps> = ({
  calculation,
  recommendations,
  optimizationSuggestions = [],
  className = ''
}) => {
  const [selectedPriceTarget, setSelectedPriceTarget] = useState<25 | 30 | 35>(30);

  // Calculate percentages for breakdown
  const totalCostBreakdown = calculation.breakdown.map(item => ({
    ...item,
    percentage: (item.totalCost / calculation.totalFoodCost) * 100
  }));

  // Sort ingredients by cost (highest first)
  const sortedIngredients = [...totalCostBreakdown].sort((a, b) => b.totalCost - a.totalCost);

  const formatCurrency = (amount: number) => `€${amount.toFixed(2)}`;
  const formatPercentage = (percentage: number) => `${percentage.toFixed(1)}%`;

  const getPriceTargetColor = (target: 25 | 30 | 35) => {
    if (target === 25) return 'text-red-600 bg-red-50';
    if (target === 30) return 'text-blue-600 bg-blue-50';
    return 'text-green-600 bg-green-50';
  };

  const getSelectedPrice = () => {
    switch (selectedPriceTarget) {
      case 25: return calculation.suggestedPrices.foodCost25;
      case 30: return calculation.suggestedPrices.foodCost30;
      case 35: return calculation.suggestedPrices.foodCost35;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cost Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Food Cost</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(calculation.totalFoodCost)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Labor Cost</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(calculation.laborCost)}</p>
              </div>
              <Calculator className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overhead</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(calculation.overheadCost)}</p>
              </div>
              <PieChart className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(calculation.totalCost)}</p>
              </div>
              <Target className="h-8 w-8 text-gray-900" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Cost Analysis */}
      <Tabs defaultValue="breakdown" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="breakdown">Cost Breakdown</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        {/* Cost Breakdown Tab */}
        <TabsContent value="breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Ingredient Cost Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sortedIngredients.map((ingredient, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{ingredient.ingredient}</span>
                      <div className="text-right">
                        <span className="font-bold">{formatCurrency(ingredient.totalCost)}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          ({formatPercentage(ingredient.percentage)})
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{ingredient.quantity} {ingredient.unit}</span>
                      <span>@</span>
                      <span>{formatCurrency(ingredient.unitCost)}</span>
                    </div>
                    <Progress 
                      value={ingredient.percentage} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Menu Pricing Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Price Target Selector */}
                <div className="flex gap-2">
                  <Button
                    variant={selectedPriceTarget === 25 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedPriceTarget(25)}
                    className={selectedPriceTarget === 25 ? getPriceTargetColor(25) : ''}
                  >
                    25% Food Cost
                  </Button>
                  <Button
                    variant={selectedPriceTarget === 30 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedPriceTarget(30)}
                    className={selectedPriceTarget === 30 ? getPriceTargetColor(30) : ''}
                  >
                    30% Food Cost
                  </Button>
                  <Button
                    variant={selectedPriceTarget === 35 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedPriceTarget(35)}
                    className={selectedPriceTarget === 35 ? getPriceTargetColor(35) : ''}
                  >
                    35% Food Cost
                  </Button>
                </div>

                {/* Selected Price Display */}
                <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Suggested Menu Price</p>
                    <p className="text-4xl font-bold text-blue-600 mb-2">
                      {formatCurrency(getSelectedPrice())}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedPriceTarget}% food cost target
                    </p>
                  </div>
                </div>

                {/* All Price Options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-3 text-center bg-red-50">
                    <p className="text-sm font-medium text-red-700">Competitive (25%)</p>
                    <p className="text-xl font-bold text-red-600">
                      {formatCurrency(calculation.suggestedPrices.foodCost25)}
                    </p>
                    <p className="text-xs text-red-600">
                      Profit: {formatCurrency(calculation.profitMargins.at25Percent)}
                    </p>
                  </div>
                  <div className="border rounded-lg p-3 text-center bg-blue-50">
                    <p className="text-sm font-medium text-blue-700">Balanced (30%)</p>
                    <p className="text-xl font-bold text-blue-600">
                      {formatCurrency(calculation.suggestedPrices.foodCost30)}
                    </p>
                    <p className="text-xs text-blue-600">
                      Profit: {formatCurrency(calculation.profitMargins.at30Percent)}
                    </p>
                  </div>
                  <div className="border rounded-lg p-3 text-center bg-green-50">
                    <p className="text-sm font-medium text-green-700">Conservative (35%)</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(calculation.suggestedPrices.foodCost35)}
                    </p>
                    <p className="text-xs text-green-600">
                      Profit: {formatCurrency(calculation.profitMargins.at35Percent)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Cost Optimization Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {optimizationSuggestions.length > 0 ? (
                  optimizationSuggestions.map((suggestion, index) => (
                    <div 
                      key={index} 
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium">{suggestion.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {suggestion.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-green-600">
                            Save {formatCurrency(suggestion.potentialSaving)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge 
                          variant="secondary" 
                          className={
                            suggestion.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                            suggestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }
                        >
                          {suggestion.difficulty}
                        </Badge>
                        <Badge 
                          variant="outline"
                          className={
                            suggestion.impact === 'high' ? 'border-red-200 text-red-600' :
                            suggestion.impact === 'medium' ? 'border-yellow-200 text-yellow-600' :
                            'border-green-200 text-green-600'
                          }
                        >
                          {suggestion.impact} impact
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    <p>Your recipe is well-optimized!</p>
                    <p className="text-sm">No major cost reduction opportunities found.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Cost Analysis & Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Cost Structure */}
                <div>
                  <h4 className="font-medium mb-2">Cost Structure</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Food Cost</span>
                      <span>{formatPercentage((calculation.totalFoodCost / calculation.totalCost) * 100)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Labor Cost</span>
                      <span>{formatPercentage((calculation.laborCost / calculation.totalCost) * 100)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Overhead</span>
                      <span>{formatPercentage((calculation.overheadCost / calculation.totalCost) * 100)}</span>
                    </div>
                  </div>
                </div>

                {/* Most Expensive Ingredients */}
                <div>
                  <h4 className="font-medium mb-2">Cost Drivers</h4>
                  <div className="space-y-1">
                    {sortedIngredients.slice(0, 3).map((ingredient, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{ingredient.ingredient}</span>
                        <span className="font-medium">
                          {formatCurrency(ingredient.totalCost)} ({formatPercentage(ingredient.percentage)})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Profitability Indicator */}
                <div className="border rounded-lg p-3 bg-gradient-to-r from-green-50 to-emerald-50">
                  <div className="flex items-center gap-2 mb-2">
                    {calculation.profitMargins.at30Percent > 5 ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    )}
                    <h4 className="font-medium">Profitability</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    At 30% food cost target, this dish would generate{' '}
                    <span className="font-medium text-green-600">
                      {formatCurrency(calculation.profitMargins.at30Percent)}
                    </span>{' '}
                    profit per serving.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Simplified version for quick display
export const QuickCostSummary: React.FC<{ calculation: PricingCalculation }> = ({ calculation }) => {
  return (
    <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-blue-700">Estimated Costs</span>
        <Badge variant="outline" className="text-blue-600">
          Food Cost: €{calculation.totalFoodCost.toFixed(2)}
        </Badge>
      </div>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs text-muted-foreground">25% Target</p>
          <p className="font-bold text-red-600">€{calculation.suggestedPrices.foodCost25.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">30% Target</p>
          <p className="font-bold text-blue-600">€{calculation.suggestedPrices.foodCost30.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">35% Target</p>
          <p className="font-bold text-green-600">€{calculation.suggestedPrices.foodCost35.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};