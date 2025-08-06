import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Calendar,
  BarChart3,
  PieChart,
  Target,
  AlertTriangle,
  CheckCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  analyzeProfitability, 
  analyzeTrends, 
  analyzeCategoryPerformance,
  getPerformanceOverview,
  getWeekOverWeekComparison,
  generatePerformanceAlerts
} from '@/integrations/supabase/analyticsEngine';
import { querySalesData, getSalesStatistics } from '@/integrations/supabase/salesData';

interface DateRange {
  from: string;
  to: string;
}

interface MetricCard {
  title: string;
  value: string;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
  description?: string;
}

const SalesAnalytics: React.FC = () => {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [salesStats, setSalesStats] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const [overview, stats] = await Promise.all([
        getPerformanceOverview(dateRange.from, dateRange.to),
        getSalesStatistics(dateRange.from, dateRange.to)
      ]);

      setOverviewData(overview);
      setSalesStats(stats);

      // Generate alerts based on performance data
      if (overview.profitability) {
        const performanceAlerts = generatePerformanceAlerts(overview.profitability);
        setAlerts(performanceAlerts);
      }

      toast({
        title: "Analytics Updated",
        description: "Successfully loaded analytics data",
        variant: "default"
      });

    } catch (error) {
      console.error('Analytics error:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange]);

  const getMetricCards = (): MetricCard[] => {
    if (!overviewData || !salesStats) return [];

    const profitability = overviewData.profitability;
    const keyMetrics = overviewData.keyMetrics;

    return [
      {
        title: 'Total Revenue',
        value: `€${keyMetrics.totalRevenue.toFixed(2)}`,
        change: profitability.changes?.revenueChange,
        trend: profitability.changes?.revenueChange > 0 ? 'up' : profitability.changes?.revenueChange < 0 ? 'down' : 'stable',
        icon: <DollarSign className="h-6 w-6" />,
        description: `${keyMetrics.totalTransactions} transactions`
      },
      {
        title: 'Gross Margin',
        value: `${keyMetrics.grossMargin.toFixed(1)}%`,
        change: profitability.changes?.marginChange,
        trend: profitability.changes?.marginChange > 0 ? 'up' : profitability.changes?.marginChange < 0 ? 'down' : 'stable',
        icon: <Target className="h-6 w-6" />,
        description: 'Profit percentage'
      },
      {
        title: 'Avg Order Value',
        value: `€${keyMetrics.averageOrderValue.toFixed(2)}`,
        change: profitability.changes?.aovChange,
        trend: profitability.changes?.aovChange > 0 ? 'up' : profitability.changes?.aovChange < 0 ? 'down' : 'stable',
        icon: <ShoppingCart className="h-6 w-6" />,
        description: 'Per transaction'
      },
      {
        title: 'Trend Direction',
        value: keyMetrics.trendDirection,
        trend: keyMetrics.trendDirection === 'up' ? 'up' : keyMetrics.trendDirection === 'down' ? 'down' : 'stable',
        icon: <TrendingUp className="h-6 w-6" />,
        description: 'Overall performance'
      }
    ];
  };

  const formatChange = (change?: number) => {
    if (change === undefined) return null;
    const isPositive = change >= 0;
    return (
      <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        {Math.abs(change).toFixed(1)}%
      </div>
    );
  };

  if (loading && !overviewData) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive business intelligence and performance insights
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            onClick={loadAnalyticsData}
            disabled={loading}
            variant="outline"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Date Range Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Analysis Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from-date">From Date</Label>
              <Input
                id="from-date"
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                max={dateRange.to}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="to-date">To Date</Label>
              <Input
                id="to-date"
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                min={dateRange.from}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Quick Select</Label>
              <Select
                onValueChange={(value) => {
                  const now = new Date();
                  let from: Date;
                  
                  switch (value) {
                    case '7d':
                      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                      break;
                    case '30d':
                      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                      break;
                    case '90d':
                      from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                      break;
                    default:
                      return;
                  }
                  
                  setDateRange({
                    from: from.toISOString().split('T')[0],
                    to: now.toISOString().split('T')[0]
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Performance Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    alert.type === 'critical' 
                      ? 'border-red-200 bg-red-50' 
                      : alert.type === 'warning'
                      ? 'border-yellow-200 bg-yellow-50'
                      : 'border-blue-200 bg-blue-50'
                  }`}
                >
                  <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                    alert.type === 'critical' ? 'text-red-600' : 
                    alert.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                  }`} />
                  <div className="flex-1">
                    <p className="font-medium">{alert.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {alert.metric}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {alert.type}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getMetricCards().map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              {metric.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center justify-between mt-2">
                {metric.description && (
                  <p className="text-xs text-muted-foreground">
                    {metric.description}
                  </p>
                )}
                {formatChange(metric.change)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
                <CardDescription>Financial performance overview</CardDescription>
              </CardHeader>
              <CardContent>
                {overviewData?.profitability && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Total Revenue</span>
                      <span className="font-bold">€{overviewData.profitability.totalRevenue?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Gross Profit</span>
                      <span className="font-bold text-green-600">
                        €{overviewData.profitability.grossProfit?.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Net Profit</span>
                      <span className="font-bold">€{overviewData.profitability.netProfit?.toFixed(2)}</span>
                    </div>
                    <div className="pt-2">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm">Gross Margin</span>
                        <span className="text-sm font-medium">
                          {overviewData.profitability.grossMargin?.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={overviewData.profitability.grossMargin} className="h-2" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sales Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Sales Summary</CardTitle>
                <CardDescription>Transaction and volume metrics</CardDescription>
              </CardHeader>
              <CardContent>
                {salesStats && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Total Transactions</span>
                      <span className="font-bold">{salesStats.totalEntries}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Average Order Value</span>
                      <span className="font-bold">€{salesStats.averageAmount?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Best Day</span>
                      <span className="font-bold">
                        {salesStats.dailyTotals?.reduce((best: any, day: any) => 
                          day.amount > (best?.amount || 0) ? day : best
                        )?.date || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Daily Average</span>
                      <span className="font-bold">
                        €{salesStats.dailyTotals?.length > 0 
                          ? (salesStats.totalAmount / salesStats.dailyTotals.length).toFixed(2)
                          : '0.00'
                        }
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
              <CardDescription>Revenue and transaction breakdown by category</CardDescription>
            </CardHeader>
            <CardContent>
              {salesStats?.categoryBreakdown && (
                <div className="space-y-4">
                  {Object.entries(salesStats.categoryBreakdown).map(([category, data]: [string, any]) => (
                    <div key={category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="capitalize font-medium">{category}</span>
                        <div className="text-right">
                          <div className="font-bold">€{data.amount.toFixed(2)}</div>
                          <div className="text-sm text-muted-foreground">
                            {data.count} transactions
                          </div>
                        </div>
                      </div>
                      <Progress 
                        value={(data.amount / salesStats.totalAmount) * 100} 
                        className="h-2" 
                      />
                      <div className="text-xs text-muted-foreground">
                        {((data.amount / salesStats.totalAmount) * 100).toFixed(1)}% of total revenue
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Performance Trends</CardTitle>
              <CardDescription>Revenue patterns over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              {salesStats?.dailyTotals && (
                <div className="space-y-4">
                  {salesStats.dailyTotals.slice(-10).map((day: any) => (
                    <div key={day.date} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">
                          {new Date(day.date).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {day.count} transactions
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">€{day.amount.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">
                          €{(day.amount / day.count).toFixed(2)} avg
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                AI-Powered Insights
              </CardTitle>
              <CardDescription>
                Intelligent analysis and recommendations based on your sales data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Performance Overview</p>
                    <p className="text-blue-700 text-sm">
                      Your sales data shows {overviewData?.keyMetrics?.trendDirection === 'up' ? 'positive' : 
                      overviewData?.keyMetrics?.trendDirection === 'down' ? 'declining' : 'stable'} trends 
                      with a {overviewData?.keyMetrics?.grossMargin?.toFixed(1)}% gross margin.
                    </p>
                  </div>
                </div>

                {overviewData?.keyMetrics?.topCategory && (
                  <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                    <Target className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900">Top Performing Category</p>
                      <p className="text-green-700 text-sm">
                        <span className="capitalize">{overviewData.keyMetrics.topCategory}</span> is your 
                        best performing category. Consider focusing marketing efforts here.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <PieChart className="h-5 w-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Data Quality</p>
                    <p className="text-gray-700 text-sm">
                      Based on {salesStats?.totalEntries || 0} sales entries. 
                      For more accurate insights, ensure consistent daily data entry.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SalesAnalytics;