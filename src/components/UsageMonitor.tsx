import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  BarChart3,
  Clock,
  RefreshCw,
  Plus,
  History,
  Settings,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UsageData {
  currentPoints: number;
  totalPoints: number;
  usedPoints: number;
  dailyUsage: Array<{
    date: string;
    points: number;
    operations: number;
  }>;
  breakdown: {
    analytics: number;
    voiceProcessing: number;
    aiInsights: number;
    reports: number;
  };
  alerts: Array<{
    type: 'low' | 'critical' | 'info';
    message: string;
    timestamp: string;
  }>;
}

interface PricingTier {
  name: string;
  points: number;
  price: string;
  features: string[];
  recommended?: boolean;
}

const UsageMonitor: React.FC = () => {
  const { toast } = useToast();
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRechargeOptions, setShowRechargeOptions] = useState(false);

  const pricingTiers: PricingTier[] = [
    {
      name: 'Starter',
      points: 1000,
      price: '€9.99',
      features: ['Basic analytics', 'Manual data entry', 'Weekly reports']
    },
    {
      name: 'Professional',
      points: 5000,
      price: '€39.99',
      features: ['Advanced analytics', 'Voice input', 'AI insights', 'Daily reports'],
      recommended: true
    },
    {
      name: 'Business',
      points: 15000,
      price: '€99.99',
      features: ['Enterprise analytics', 'Unlimited voice', 'Premium AI', 'Real-time reports', 'Priority support']
    }
  ];

  // Mock data - in real implementation, this would come from API
  const mockUsageData: UsageData = {
    currentPoints: 2750,
    totalPoints: 5000,
    usedPoints: 2250,
    dailyUsage: [
      { date: '2024-01-20', points: 85, operations: 12 },
      { date: '2024-01-21', points: 120, operations: 18 },
      { date: '2024-01-22', points: 95, operations: 14 },
      { date: '2024-01-23', points: 150, operations: 22 },
      { date: '2024-01-24', points: 110, operations: 16 },
      { date: '2024-01-25', points: 140, operations: 20 },
      { date: '2024-01-26', points: 175, operations: 25 }
    ],
    breakdown: {
      analytics: 45,
      voiceProcessing: 30,
      aiInsights: 15,
      reports: 10
    },
    alerts: [
      {
        type: 'low',
        message: 'Points running low. Consider recharging soon.',
        timestamp: '2024-01-26T10:30:00Z'
      },
      {
        type: 'info',
        message: 'Heavy usage detected this week. Upgrade for better value.',
        timestamp: '2024-01-25T15:45:00Z'
      }
    ]
  };

  const loadUsageData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUsageData(mockUsageData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load usage data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsageData();
  }, []);

  const handleRecharge = (tier: PricingTier) => {
    toast({
      title: "Recharge Initiated",
      description: `${tier.points} points package selected. Redirecting to payment...`,
      variant: "default"
    });
    
    // In real implementation, this would redirect to payment processor
    setTimeout(() => {
      toast({
        title: "Payment Successful",
        description: `${tier.points} points added to your account!`,
        variant: "default"
      });
      setShowRechargeOptions(false);
      loadUsageData(); // Refresh data
    }, 2000);
  };

  const getUsagePercentage = () => {
    if (!usageData) return 0;
    return (usageData.usedPoints / usageData.totalPoints) * 100;
  };

  const getUsageStatus = () => {
    const percentage = getUsagePercentage();
    if (percentage >= 90) return { status: 'critical', color: 'text-red-600', bgColor: 'bg-red-100' };
    if (percentage >= 70) return { status: 'warning', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { status: 'healthy', color: 'text-green-600', bgColor: 'bg-green-100' };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading && !usageData) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading usage data...</p>
        </div>
      </div>
    );
  }

  if (!usageData) return null;

  const usageStatus = getUsageStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usage Monitor</h1>
          <p className="text-muted-foreground mt-2">
            Track your AI analytics usage and manage your points balance
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            onClick={loadUsageData}
            variant="outline"
            disabled={loading}
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
          
          <Button
            onClick={() => setShowRechargeOptions(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Points
          </Button>
        </div>
      </div>

      {/* Usage Alerts */}
      {usageData.alerts.map((alert, index) => (
        <Alert key={index} className={alert.type === 'critical' ? 'border-red-200' : alert.type === 'low' ? 'border-yellow-200' : 'border-blue-200'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {alert.message}
            <span className="text-xs text-muted-foreground ml-2">
              {new Date(alert.timestamp).toLocaleString()}
            </span>
          </AlertDescription>
        </Alert>
      ))}

      {/* Points Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageData.currentPoints.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">points remaining</p>
            <div className="mt-4">
              <Progress value={100 - getUsagePercentage()} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {usageData.currentPoints} of {usageData.totalPoints} points
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usage Status</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${usageStatus.color}`}>
              {usageStatus.status === 'critical' ? 'Critical' : 
               usageStatus.status === 'warning' ? 'Warning' : 'Healthy'}
            </div>
            <p className="text-xs text-muted-foreground">
              {getUsagePercentage().toFixed(1)}% used this cycle
            </p>
            <div className={`mt-4 p-2 rounded-lg ${usageStatus.bgColor}`}>
              <p className={`text-xs ${usageStatus.color}`}>
                {usageStatus.status === 'critical' ? 'Recharge needed soon' :
                 usageStatus.status === 'warning' ? 'Consider recharging' :
                 'Usage is within normal range'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(usageData.dailyUsage.reduce((sum, day) => sum + day.points, 0) / usageData.dailyUsage.length)}
            </div>
            <p className="text-xs text-muted-foreground">points per day</p>
            <div className="mt-4">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Last 7 days average
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Breakdown</CardTitle>
            <CardDescription>Points consumed by feature category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(usageData.breakdown).map(([feature, percentage]) => (
                <div key={feature} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="capitalize text-sm font-medium">{feature.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="text-sm text-muted-foreground">{percentage}%</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Daily Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Usage Trend</CardTitle>
            <CardDescription>Points consumed over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {usageData.dailyUsage.map((day, index) => (
                <div key={day.date} className="flex items-center justify-between p-2 rounded border">
                  <div>
                    <div className="font-medium text-sm">{formatDate(day.date)}</div>
                    <div className="text-xs text-muted-foreground">
                      {day.operations} operations
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{day.points}</div>
                    <div className="text-xs text-muted-foreground">points</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recharge Options */}
      {showRechargeOptions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Recharge Points
            </CardTitle>
            <CardDescription>
              Choose a points package to continue using AI analytics features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pricingTiers.map((tier, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg relative ${
                    tier.recommended ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  {tier.recommended && (
                    <Badge className="absolute -top-2 left-4 bg-primary">
                      Recommended
                    </Badge>
                  )}
                  
                  <div className="text-center mb-4">
                    <h3 className="font-semibold text-lg">{tier.name}</h3>
                    <div className="text-2xl font-bold text-primary mt-2">
                      {tier.price}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {tier.points.toLocaleString()} points
                    </div>
                  </div>

                  <ul className="space-y-2 mb-4">
                    {tier.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleRecharge(tier)}
                    className="w-full"
                    variant={tier.recommended ? 'default' : 'outline'}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Purchase
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-6">
              <Button
                onClick={() => setShowRechargeOptions(false)}
                variant="ghost"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Optimize Your Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Cost-Effective Tips:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Batch your analytics queries</li>
                <li>• Use voice input during off-peak hours</li>
                <li>• Generate reports weekly instead of daily</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Point Costs:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Basic analytics: 5-10 points</li>
                <li>• Voice processing: 15-25 points</li>
                <li>• AI insights: 20-30 points</li>
                <li>• Report generation: 10-15 points</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsageMonitor;