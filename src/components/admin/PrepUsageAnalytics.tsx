import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart,
  Target,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Package,
  ChefHat,
  DollarSign,
  Users,
  Activity,
  Zap
} from 'lucide-react';
import {
  PrepUsageAnalytics as PrepUsageAnalyticsType,
  PrepUsageInsights,
  PrepRecommendation,
  formatCurrency,
  formatPercentage
} from '@/utils/prepUsageTracking';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

interface PrepUsageAnalyticsProps {
  analytics: PrepUsageAnalyticsType[];
  insights: PrepUsageInsights;
  className?: string;
}

export const PrepUsageAnalytics: React.FC<PrepUsageAnalyticsProps> = ({
  analytics,
  insights,
  className = ''
}) => {
  const { t } = useTranslation('admin');
  const [selectedTab, setSelectedTab] = useState('overview');

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
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'stable': return <Activity className="h-4 w-4 text-blue-600" />;
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Prepare data for popularity chart
  const popularityChartData = insights.most_popular_preps.map(prep => ({
    name: prep.prep_name.length > 12 ? prep.prep_name.substring(0, 12) + '...' : prep.prep_name,
    fullName: prep.prep_name,
    usage: prep.total_usage_count,
    menuItems: prep.unique_menu_items,
    cost: prep.total_cost_contribution
  }));

  // Prepare data for efficiency pie chart
  const efficiencyData = [
    { name: 'Excellent', value: analytics.filter(p => p.cost_efficiency === 'excellent').length, color: '#10b981' },
    { name: 'Good', value: analytics.filter(p => p.cost_efficiency === 'good').length, color: '#3b82f6' },
    { name: 'Moderate', value: analytics.filter(p => p.cost_efficiency === 'moderate').length, color: '#f59e0b' },
    { name: 'High', value: analytics.filter(p => p.cost_efficiency === 'high').length, color: '#ef4444' }
  ].filter(item => item.value > 0);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Preps</p>
                <p className="text-2xl font-bold text-blue-600">{insights.overall_stats.total_preps}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Preps</p>
                <p className="text-2xl font-bold text-green-600">{insights.overall_stats.active_preps}</p>
                <p className="text-xs text-muted-foreground">
                  {formatPercentage((insights.overall_stats.active_preps / insights.overall_stats.total_preps) * 100)}
                </p>
              </div>
              <ChefHat className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Usage</p>
                <p className="text-2xl font-bold text-purple-600">{insights.overall_stats.total_usage_count}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Cost Impact</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(insights.overall_stats.total_cost_contribution)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popularity Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Most Popular Preps
            </CardTitle>
          </CardHeader>
          <CardContent>
            {popularityChartData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={popularityChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip
                      content={({ active, payload }) => {
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
                                    {data.usage} uses
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[0.70rem] uppercase text-muted-foreground">
                                    Menu Items
                                  </span>
                                  <span className="font-bold">
                                    {data.menuItems}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="usage" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No usage data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Efficiency Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Cost Efficiency Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {efficiencyData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={efficiencyData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {efficiencyData.map((entry, index) => (
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
                                    {data.value} preps
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
                  {efficiencyData.map((item, index) => (
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
                No efficiency data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="popular">Popular</TabsTrigger>
          <TabsTrigger value="efficient">Efficient</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* All Preps Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  All Preps Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {analytics.map((prep) => (
                    <div key={prep.prep_id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{prep.prep_name}</span>
                          <Badge 
                            variant="outline" 
                            className={`flex items-center gap-1 ${getEfficiencyColor(prep.cost_efficiency)}`}
                          >
                            {getEfficiencyIcon(prep.cost_efficiency)}
                            {prep.cost_efficiency}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {prep.total_usage_count} uses • {prep.unique_menu_items} menu items
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(prep.total_cost_contribution)}</div>
                        <div className="text-sm text-muted-foreground">
                          {getTrendIcon(prep.usage_trend)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Underutilized Preps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Underutilized Preps
                </CardTitle>
              </CardHeader>
              <CardContent>
                {insights.underutilized_preps.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No underutilized preps found</p>
                    <p className="text-sm">All preps are being used effectively!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {insights.underutilized_preps.map((prep) => (
                      <div key={prep.prep_id} className="p-3 border rounded-lg bg-yellow-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{prep.prep_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Only {prep.total_usage_count} uses • {prep.unique_menu_items} menu item
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-yellow-600">
                              {formatCurrency(prep.total_cost_contribution)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatPercentage(prep.batch_utilization_rate)} utilization
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Popular Preps Tab */}
        <TabsContent value="popular" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Most Popular Preps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.most_popular_preps.map((prep, index) => (
                  <div key={prep.prep_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full">
                        <span className="font-bold text-purple-600">#{prep.popularity_rank}</span>
                      </div>
                      <div>
                        <h4 className="font-medium">{prep.prep_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Used in {prep.unique_menu_items} menu items
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{prep.total_usage_count} uses</div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(prep.total_cost_contribution)} total cost
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Efficient Preps Tab */}
        <TabsContent value="efficient" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Most Cost-Efficient Preps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.most_cost_efficient_preps.map((prep, index) => (
                  <div key={prep.prep_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{prep.prep_name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="outline" 
                            className={`flex items-center gap-1 ${getEfficiencyColor(prep.cost_efficiency)}`}
                          >
                            {getEfficiencyIcon(prep.cost_efficiency)}
                            {prep.cost_efficiency}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {prep.total_usage_count} uses
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        {formatCurrency(prep.average_cost_per_menu_item)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        avg per menu item
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Optimization Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {insights.prep_recommendations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recommendations at this time</p>
                  <p className="text-sm">Your prep usage looks optimal!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {insights.prep_recommendations.map((recommendation, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium">{recommendation.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {recommendation.description}
                          </p>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`flex items-center gap-1 ${getImpactColor(recommendation.impact)}`}
                        >
                          {recommendation.impact} impact
                        </Badge>
                      </div>
                      
                      {recommendation.potential_savings && (
                        <div className="mb-3 p-2 bg-green-50 rounded">
                          <span className="text-sm font-medium text-green-700">
                            Potential savings: {formatCurrency(recommendation.potential_savings)}
                          </span>
                        </div>
                      )}

                      <div>
                        <h5 className="text-sm font-medium mb-2">Action Items:</h5>
                        <ul className="space-y-1">
                          {recommendation.action_items.map((action, actionIndex) => (
                            <li key={actionIndex} className="text-sm text-muted-foreground flex items-center gap-2">
                              <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 