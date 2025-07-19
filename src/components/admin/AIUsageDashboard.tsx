import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ImageIcon, TrendingUp, DollarSign, Calendar } from 'lucide-react';

interface AIUsage {
  id: string;
  month_year: string;
  images_generated: number;
  total_cost: number;
  budget_limit: number;
  created_at: string;
  updated_at: string;
}

export const AIUsageDashboard = () => {
  const [usage, setUsage] = useState<AIUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsageData();
  }, []);

  const fetchUsageData = async () => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      
      const { data, error } = await supabase
        .from('ai_usage_tracking')
        .select('*')
        .eq('month_year', currentMonth)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      setUsage(data);
    } catch (error) {
      console.error('Error fetching usage data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch AI usage data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateBudgetLimit = async (newLimit: number) => {
    if (!usage) return;

    try {
      const { error } = await supabase
        .from('ai_usage_tracking')
        .update({ budget_limit: newLimit })
        .eq('month_year', usage.month_year);

      if (error) throw error;

      setUsage({ ...usage, budget_limit: newLimit });
      toast({
        title: "Success",
        description: "Budget limit updated successfully",
      });
    } catch (error) {
      console.error('Error updating budget:', error);
      toast({
        title: "Error",
        description: "Failed to update budget limit",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="w-24 h-4 bg-muted animate-pulse rounded" />
              <div className="w-4 h-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="w-16 h-8 bg-muted animate-pulse rounded mb-1" />
              <div className="w-32 h-3 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const usagePercentage = usage ? (usage.total_cost / usage.budget_limit) * 100 : 0;
  const remainingCredits = usage ? usage.budget_limit - usage.total_cost : 0;
  const isNearLimit = usagePercentage >= 80;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Images Generated</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usage?.images_generated || 0}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usage?.total_cost.toFixed(3) || '0.000'}</div>
            <p className="text-xs text-muted-foreground">
              of {usage?.budget_limit.toFixed(3) || '10.000'} limit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining Credits</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{remainingCredits.toFixed(3)}</div>
            <p className="text-xs text-muted-foreground">
              Available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usage Status</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge 
                variant={isNearLimit ? "destructive" : usagePercentage > 50 ? "default" : "secondary"}
              >
                {usagePercentage.toFixed(1)}%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isNearLimit ? "Near limit" : "Within budget"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Usage Overview</CardTitle>
          <CardDescription>
            Track your AI image generation usage and manage your budget
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Usage Progress</span>
              <span>{usagePercentage.toFixed(1)}%</span>
            </div>
            <Progress 
              value={usagePercentage} 
              className={`h-2 ${isNearLimit ? 'bg-red-100' : ''}`}
            />
            {isNearLimit && (
              <p className="text-sm text-destructive">
                ⚠️ Warning: You're approaching your monthly limit
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Current Month: {usage?.month_year}</p>
              <p className="text-muted-foreground">Generated: {usage?.images_generated || 0} images</p>
            </div>
            <div>
              <p className="font-medium">Average per Image</p>
              <p className="text-muted-foreground">
                {usage?.images_generated 
                  ? (usage.total_cost / usage.images_generated).toFixed(4)
                  : '0.0010'
                } credits
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateBudgetLimit(100)}
              disabled={usage?.budget_limit === 100}
            >
              Set Limit: 100
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateBudgetLimit(250)}
              disabled={usage?.budget_limit === 250}
            >
              Set Limit: 250
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateBudgetLimit(500)}
              disabled={usage?.budget_limit === 500}
            >
              Set Limit: 500
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};