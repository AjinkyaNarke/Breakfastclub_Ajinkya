import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  Lightbulb,
  Package,
  ChefHat,
  BarChart3,
  PieChart as PieChartIcon,
  BarChart3 as BarChartIcon,
  TrendingUp as TrendingUpIcon
} from 'lucide-react';
import { 
  EnhancedPricingCalculation, 
  CostBreakdownItem, 
  CostOptimizationSuggestion,
  formatCurrency,
  formatPercentage,
  generateCostOptimizationSuggestions
} from '@/utils/enhancedCostCalculation';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

interface EnhancedCostBreakdownProps {
  calculation: EnhancedPricingCalculation;
  className?: string;
}

export const EnhancedCostBreakdown: React.FC<EnhancedCostBreakdownProps> = ({
  calculation,
  className = ''
}) => {
  const { t } = useTranslation('admin');
  const [selectedPriceTarget, setSelectedPriceTarget] = useState<25 | 30 | 35>(30);

  // Calculate percentages for breakdown
  const breakdownWithPercentages = calculation.breakdown.map(item => ({
    ...item,
    percentage: (item.totalCost / calculation.totalFoodCost) * 100
  }));

  // Sort components by cost (highest first)
  const sortedComponents = [...breakdownWithPercentages].sort((a, b) => b.totalCost - a.totalCost);

  // Separate ingredients and preps
  const ingredients = sortedComponents.filter(item => item.type === 'ingredient');
  const preps = sortedComponents.filter(item => item.type === 'prep');

  // Generate optimization suggestions
  const optimizationSuggestions = generateCostOptimizationSuggestions(calculation);

  // Prepare data for pie chart (cost distribution)
  const pieChartData = [
    {
      name: 'Ingredients',
      value: calculation.ingredientCost,
      color: '#3b82f6', // blue-500
      icon: Package
    },
    {
      name: 'Preps',
      value: calculation.prepCost,
      color: '#8b5cf6', // purple-500
      icon: ChefHat
    }
  ].filter(item => item.value > 0);

  // Prepare data for bar chart (component comparison)
  const barChartData = sortedComponents.slice(0, 8).map(item => ({
    name: item.name.length > 12 ? item.name.substring(0, 12) + '...' : item.name,
    fullName: item.name,
    cost: item.totalCost,
    percentage: item.percentage,
    type: item.type,
    color: item.type === 'ingredient' ? '#3b82f6' : '#8b5cf6'
  }));

  // Prepare data for cost structure chart
  const costStructureData = [
    {
      name: 'Food Cost',
      value: calculation.totalFoodCost,
      color: '#f59e0b', // amber-500
      percentage: (calculation.totalFoodCost / calculation.totalCost) * 100
    },
    {
      name: 'Labor',
      value: calculation.laborCost,
      color: '#10b981', // emerald-500
      percentage: (calculation.laborCost / calculation.totalCost) * 100
    },
    {
      name: 'Overhead',
      value: calculation.overheadCost,
      color: '#6b7280', // gray-500
      percentage: (calculation.overheadCost / calculation.totalCost) * 100
    }
  ];

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

  const getEfficiencyColor = (efficiency: string) => {
    switch (efficiency) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'moderate': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getEfficiencyIcon = (efficiency: string) => {
    switch (efficiency) {
      case 'excellent': return <CheckCircle className="h-4 w-4" />;
      case 'good': return <TrendingDown className="h-4 w-4" />;
      case 'moderate': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <TrendingUp className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const chartConfig = {
    ingredients: {
      label: "Ingredients",
      color: "#3b82f6",
    },
    preps: {
      label: "Preps", 
      color: "#8b5cf6",
    },
    foodCost: {
      label: "Food Cost",
      color: "#f59e0b",
    },
    labor: {
      label: "Labor",
      color: "#10b981",
    },
    overhead: {
      label: "Overhead",
      color: "#6b7280",
    },
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cost Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Food Cost</p>
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
                <p className="text-sm text-muted-foreground">Ingredients</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(calculation.ingredientCost)}</p>
                <p className="text-xs text-muted-foreground">{formatPercentage(calculation.costAnalysis.ingredientUtilization)}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Preps</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(calculation.prepCost)}</p>
                <p className="text-xs text-muted-foreground">{formatPercentage(calculation.costAnalysis.prepUtilization)}</p>
              </div>
              <ChefHat className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Labor</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(calculation.laborCost)}</p>
              </div>
              <Calculator className="h-8 w-8 text-green-600" />
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

      {/* Cost Efficiency Indicator */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span className="font-medium">Cost Efficiency</span>
            </div>
            <Badge 
              variant="outline" 
              className={`flex items-center gap-1 ${getEfficiencyColor(calculation.costAnalysis.costEfficiency)}`}
            >
              {getEfficiencyIcon(calculation.costAnalysis.costEfficiency)}
              {t(`costAnalysis.efficiency.${calculation.costAnalysis.costEfficiency}`, calculation.costAnalysis.costEfficiency)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Cost Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieChartData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex flex-col">
                                  <span className="text-[0.70rem] uppercase text-muted-foreground">
                                    {data.name}
                                  </span>
                                  <span className="font-bold text-muted-foreground">
                                    {formatCurrency(data.value)}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[0.70rem] uppercase text-muted-foreground">
                                    Percentage
                                  </span>
                                  <span className="font-bold">
                                    {formatPercentage((data.value / calculation.totalFoodCost) * 100)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-4">
                  {pieChartData.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No cost data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Component Cost Comparison Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChartIcon className="h-5 w-5" />
              Component Cost Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            {barChartData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex flex-col">
                                  <span className="text-[0.70rem] uppercase text-muted-foreground">
                                    {data.fullName}
                                  </span>
                                  <span className="font-bold text-muted-foreground">
                                    {formatCurrency(data.cost)}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[0.70rem] uppercase text-muted-foreground">
                                    Type
                                  </span>
                                  <span className="font-bold capitalize">
                                    {data.type}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="cost" fill="#8884d8">
                      {barChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No components available
              </div>
            )}
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
          {/* Ingredients Section */}
          {ingredients.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Ingredient Cost Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ingredients.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.name}</span>
                          {item.category && (
                            <Badge variant="outline" className="text-xs">{item.category}</Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="font-bold">{formatCurrency(item.totalCost)}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            ({formatPercentage(item.percentage)})
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{item.quantity} {item.unit}</span>
                        <span>@</span>
                        <span>{formatCurrency(item.unitCost)}</span>
                      </div>
                      <Progress value={item.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preps Section */}
          {preps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChefHat className="h-5 w-5" />
                  Prep Cost Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {preps.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Prep: {item.name}</span>
                          <Badge variant="secondary" className="text-xs">Prep</Badge>
                        </div>
                        <div className="text-right">
                          <span className="font-bold">{formatCurrency(item.totalCost)}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            ({formatPercentage(item.percentage)})
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{item.quantity} {item.unit}</span>
                        <span>@</span>
                        <span>{formatCurrency(item.unitCost)}</span>
                        {item.batchYield && (
                          <>
                            <span>•</span>
                            <span>Batch: {item.batchYield}</span>
                          </>
                        )}
                      </div>
                      <Progress value={item.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
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
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Suggested Menu Price</p>
                    <p className="text-3xl font-bold text-primary">{formatCurrency(getSelectedPrice())}</p>
                    <p className="text-sm text-muted-foreground">
                      at {selectedPriceTarget}% food cost target
                    </p>
                  </div>
                </div>

                {/* All Price Options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 border rounded">
                    <p className="text-sm text-muted-foreground">25% Food Cost</p>
                    <p className="text-xl font-bold text-red-600">{formatCurrency(calculation.suggestedPrices.foodCost25)}</p>
                    <p className="text-xs text-muted-foreground">
                      Profit: {formatCurrency(calculation.profitMargins.at25Percent)}
                    </p>
                  </div>
                  <div className="text-center p-3 border rounded">
                    <p className="text-sm text-muted-foreground">30% Food Cost</p>
                    <p className="text-xl font-bold text-blue-600">{formatCurrency(calculation.suggestedPrices.foodCost30)}</p>
                    <p className="text-xs text-muted-foreground">
                      Profit: {formatCurrency(calculation.profitMargins.at30Percent)}
                    </p>
                  </div>
                  <div className="text-center p-3 border rounded">
                    <p className="text-sm text-muted-foreground">35% Food Cost</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(calculation.suggestedPrices.foodCost35)}</p>
                    <p className="text-xs text-muted-foreground">
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
              {optimizationSuggestions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No optimization suggestions at this time</p>
                  <p className="text-sm">Your cost structure looks good!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {optimizationSuggestions.map((suggestion, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{suggestion.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{suggestion.description}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {suggestion.difficulty}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {suggestion.impact} impact
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(suggestion.potentialSaving)}
                          </p>
                          <p className="text-xs text-muted-foreground">potential saving</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Cost Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Most Expensive Component */}
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Most Expensive Component</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {calculation.costAnalysis.mostExpensiveComponent.type === 'prep' ? 'Prep: ' : ''}
                        {calculation.costAnalysis.mostExpensiveComponent.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatPercentage(calculation.costAnalysis.mostExpensiveComponent.percentage)} of total cost
                      </p>
                    </div>
                    <p className="text-lg font-bold">
                      {formatCurrency(calculation.costAnalysis.mostExpensiveComponent.totalCost)}
                    </p>
                  </div>
                </div>

                {/* Cost Distribution */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Ingredient Utilization</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-blue-600">
                        {formatPercentage(calculation.costAnalysis.ingredientUtilization)}
                      </span>
                      <Package className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Prep Utilization</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-purple-600">
                        {formatPercentage(calculation.costAnalysis.prepUtilization)}
                      </span>
                      <ChefHat className="h-8 w-8 text-purple-600" />
                    </div>
                  </div>
                </div>

                {/* Cost per Serving */}
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Cost per Serving</h4>
                  <p className="text-2xl font-bold">{formatCurrency(calculation.costPerServing)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export const QuickCostSummary: React.FC<{ calculation: EnhancedPricingCalculation }> = ({ calculation }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="text-center p-4 border rounded-lg">
        <p className="text-sm text-muted-foreground">Total Food Cost</p>
        <p className="text-2xl font-bold text-orange-600">{formatCurrency(calculation.totalFoodCost)}</p>
      </div>
      <div className="text-center p-4 border rounded-lg">
        <p className="text-sm text-muted-foreground">Suggested Price (30%)</p>
        <p className="text-2xl font-bold text-blue-600">{formatCurrency(calculation.suggestedPrices.foodCost30)}</p>
      </div>
      <div className="text-center p-4 border rounded-lg">
        <p className="text-sm text-muted-foreground">Profit Margin</p>
        <p className="text-2xl font-bold text-green-600">{formatCurrency(calculation.profitMargins.at30Percent)}</p>
      </div>
    </div>
  );
}; 