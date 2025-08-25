import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Download, 
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Loader2,
  RefreshCw,
  Printer
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  getPerformanceOverview,
  generateExecutiveReport
} from '@/integrations/supabase/analyticsEngine';

interface ExecutiveReport {
  title: string;
  period: string;
  generatedAt: string;
  summary: {
    totalRevenue: number;
    revenueChange: number;
    grossMargin: number;
    marginChange: number;
    keyInsights: string[];
  };
  performance: {
    topCategories: Array<{
      name: string;
      revenue: number;
      growth: number;
    }>;
    alerts: Array<{
      type: 'success' | 'warning' | 'critical';
      message: string;
      metric: string;
    }>;
  };
  recommendations: string[];
  financials: {
    totalRevenue: number;
    grossProfit: number;
    netProfit: number;
    marginTrend: 'up' | 'down' | 'stable';
  };
}

const ExecutiveReportViewer: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ExecutiveReport | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  const generateReport = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (selectedPeriod) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      const reportData = await generateExecutiveReport(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      setReport(reportData);

      toast({
        title: "Report Generated",
        description: "Executive report has been successfully generated",
        variant: "default"
      });

    } catch (error) {
      console.error('Report generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate executive report",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (format: 'pdf' | 'print') => {
    if (!report) return;

    if (format === 'print') {
      window.print();
    } else {
      // For PDF export, we would typically integrate with a PDF library
      // For now, we'll trigger the browser's print-to-PDF functionality
      toast({
        title: "Export Feature",
        description: "PDF export feature will be implemented in the next version. Use print for now.",
        variant: "default"
      });
    }
  };

  useEffect(() => {
    generateReport();
  }, [selectedPeriod]);

  const formatCurrency = (amount: number) => `€${amount.toFixed(2)}`;
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <div className="h-4 w-4" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading && !report) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Generating executive report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Executive Report</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive business performance summary and strategic insights
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            onClick={generateReport}
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

          <Button
            onClick={() => exportReport('print')}
            variant="outline"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {report && (
        <>
          {/* Report Header */}
          <Card className="print:shadow-none">
            <CardHeader className="print:pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <FileText className="h-6 w-6" />
                    {report.title}
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    Report Period: {report.period} | Generated: {new Date(report.generatedAt).toLocaleString()}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-sm px-3 py-1">
                  Executive Summary
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Executive Summary */}
          <Card className="print:shadow-none">
            <CardHeader>
              <CardTitle>Executive Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(report.summary.totalRevenue)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Revenue</div>
                  <div className={`flex items-center justify-center gap-1 mt-1 ${getChangeColor(report.summary.revenueChange)}`}>
                    {getChangeIcon(report.summary.revenueChange)}
                    <span className="text-sm">{formatPercentage(Math.abs(report.summary.revenueChange))}</span>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {formatPercentage(report.summary.grossMargin)}
                  </div>
                  <div className="text-sm text-muted-foreground">Gross Margin</div>
                  <div className={`flex items-center justify-center gap-1 mt-1 ${getChangeColor(report.summary.marginChange)}`}>
                    {getChangeIcon(report.summary.marginChange)}
                    <span className="text-sm">{formatPercentage(Math.abs(report.summary.marginChange))}</span>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(report.financials.grossProfit)}
                  </div>
                  <div className="text-sm text-muted-foreground">Gross Profit</div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Target className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-600">Target</span>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(report.financials.netProfit)}
                  </div>
                  <div className="text-sm text-muted-foreground">Net Profit</div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                    <span className="text-sm text-purple-600">Growth</span>
                  </div>
                </div>
              </div>

              {/* Key Insights */}
              <div className="space-y-3">
                <h4 className="font-semibold">Key Insights</h4>
                <div className="grid gap-3">
                  {report.summary.keyInsights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-900">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Categories */}
            <Card className="print:shadow-none">
              <CardHeader>
                <CardTitle>Top Performing Categories</CardTitle>
                <CardDescription>Revenue leaders for this period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {report.performance.topCategories.map((category, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium capitalize">{category.name}</span>
                        <div className="text-right">
                          <div className="font-bold">{formatCurrency(category.revenue)}</div>
                          <div className={`text-sm flex items-center gap-1 ${getChangeColor(category.growth)}`}>
                            {getChangeIcon(category.growth)}
                            {formatPercentage(Math.abs(category.growth))}
                          </div>
                        </div>
                      </div>
                      <Progress value={85 - (index * 15)} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Alerts */}
            <Card className="print:shadow-none">
              <CardHeader>
                <CardTitle>Performance Alerts</CardTitle>
                <CardDescription>Areas requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.performance.alerts.map((alert, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${
                        alert.type === 'critical' 
                          ? 'border-red-200 bg-red-50' 
                          : alert.type === 'warning'
                          ? 'border-yellow-200 bg-yellow-50'
                          : 'border-green-200 bg-green-50'
                      }`}
                    >
                      <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                        alert.type === 'critical' ? 'text-red-600' : 
                        alert.type === 'warning' ? 'text-yellow-600' : 'text-green-600'
                      }`} />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{alert.message}</p>
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
          </div>

          {/* Strategic Recommendations */}
          <Card className="print:shadow-none">
            <CardHeader>
              <CardTitle>Strategic Recommendations</CardTitle>
              <CardDescription>AI-powered insights for business optimization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <Target className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 mb-1">Recommendation #{index + 1}</p>
                      <p className="text-gray-700 text-sm">{recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground py-4 border-t print:border-gray-300">
            <p>Generated by AI Restaurant Analytics Platform</p>
            <p>Confidential Business Intelligence Report</p>
          </div>
        </>
      )}
    </div>
  );
};

export default ExecutiveReportViewer;