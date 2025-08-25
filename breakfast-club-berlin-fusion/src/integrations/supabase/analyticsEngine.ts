import { supabase } from './client'
import type { BusinessMetrics } from '@/types/analytics'

export interface AnalyticsRequest {
  analysisType: 'profitability' | 'trends' | 'categories' | 'performance' | 'forecasting'
  dateFrom: string
  dateTo: string
  compareWith?: {
    dateFrom: string
    dateTo: string
  }
  categories?: string[]
  granularity?: 'daily' | 'weekly' | 'monthly'
  includeForecasting?: boolean
  costData?: {
    fixedCosts?: number
    variableCostRatio?: number
    categorySpecificCosts?: Record<string, {
      costPerUnit?: number
      marginPercentage?: number
    }>
  }
}

export interface ProfitabilityMetrics {
  totalRevenue: number
  totalCost: number
  grossProfit: number
  grossMargin: number
  netProfit: number
  netMargin: number
  averageOrderValue: number
  totalTransactions: number
  costBreakdown: {
    fixedCosts: number
    variableCosts: number
    categorySpecificCosts: Record<string, number>
  }
  profitabilityByCategory: Record<string, {
    revenue: number
    cost: number
    profit: number
    margin: number
    transactions: number
  }>
}

export interface TrendAnalysis {
  period: string
  revenue: number
  transactions: number
  averageOrderValue: number
  growthRate: number
  seasonalIndex: number
  trendDirection: 'up' | 'down' | 'stable'
}

export interface ComparisonMetrics {
  current: ProfitabilityMetrics
  comparison: ProfitabilityMetrics
  changes: {
    revenueChange: number
    profitChange: number
    marginChange: number
    transactionChange: number
    aovChange: number
  }
  insights: string[]
}

export interface CategoryPerformance {
  categories: Record<string, {
    revenue: number
    transactions: number
    averageOrderValue: number
    totalItems: number
    revenueShare: number
    transactionShare: number
  }>
  summary: {
    totalCategories: number
    topPerformerByRevenue: string
    topPerformerByTransactions: string
  }
}

export interface PerformanceOverview {
  profitability: ProfitabilityMetrics | ComparisonMetrics
  trends: TrendAnalysis[]
  categories: CategoryPerformance
  keyMetrics: {
    totalRevenue: number
    totalTransactions: number
    averageOrderValue: number
    grossMargin: number
    trendDirection: 'up' | 'down' | 'stable'
    topCategory: string
  }
}

export interface ForecastData {
  historicalTrends: TrendAnalysis[]
  forecast: Array<{
    period: string
    predictedRevenue: number
    confidence: number
  }>
  insights: string[]
}

export interface AnalyticsResponse<T> {
  success: boolean
  analysisType: string
  period: {
    from: string
    to: string
  }
  data: T
  generatedAt: string
}

/**
 * Analyze profitability metrics for a given period
 */
export async function analyzeProfitability(
  dateFrom: string,
  dateTo: string,
  options: {
    compareWith?: { dateFrom: string; dateTo: string }
    categories?: string[]
    costData?: AnalyticsRequest['costData']
  } = {}
): Promise<ProfitabilityMetrics | ComparisonMetrics> {
  try {
    const request: AnalyticsRequest = {
      analysisType: 'profitability',
      dateFrom,
      dateTo,
      ...options
    }

    const { data, error } = await supabase.functions.invoke('analytics-engine', {
      body: request
    })

    if (error) {
      throw new Error(`Profitability analysis error: ${error.message}`)
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to analyze profitability')
    }

    return data.data

  } catch (error) {
    console.error('Analyze profitability error:', error)
    throw error
  }
}

/**
 * Analyze trends over time
 */
export async function analyzeTrends(
  dateFrom: string,
  dateTo: string,
  options: {
    categories?: string[]
    granularity?: 'daily' | 'weekly' | 'monthly'
  } = {}
): Promise<TrendAnalysis[]> {
  try {
    const request: AnalyticsRequest = {
      analysisType: 'trends',
      dateFrom,
      dateTo,
      granularity: options.granularity || 'daily',
      categories: options.categories
    }

    const { data, error } = await supabase.functions.invoke('analytics-engine', {
      body: request
    })

    if (error) {
      throw new Error(`Trends analysis error: ${error.message}`)
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to analyze trends')
    }

    return data.data

  } catch (error) {
    console.error('Analyze trends error:', error)
    throw error
  }
}

/**
 * Analyze category performance
 */
export async function analyzeCategoryPerformance(
  dateFrom: string,
  dateTo: string
): Promise<CategoryPerformance> {
  try {
    const request: AnalyticsRequest = {
      analysisType: 'categories',
      dateFrom,
      dateTo
    }

    const { data, error } = await supabase.functions.invoke('analytics-engine', {
      body: request
    })

    if (error) {
      throw new Error(`Category analysis error: ${error.message}`)
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to analyze categories')
    }

    return data.data

  } catch (error) {
    console.error('Analyze category performance error:', error)
    throw error
  }
}

/**
 * Get comprehensive performance overview
 */
export async function getPerformanceOverview(
  dateFrom: string,
  dateTo: string,
  options: {
    compareWith?: { dateFrom: string; dateTo: string }
    costData?: AnalyticsRequest['costData']
  } = {}
): Promise<PerformanceOverview> {
  try {
    const request: AnalyticsRequest = {
      analysisType: 'performance',
      dateFrom,
      dateTo,
      ...options
    }

    const { data, error } = await supabase.functions.invoke('analytics-engine', {
      body: request
    })

    if (error) {
      throw new Error(`Performance overview error: ${error.message}`)
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to get performance overview')
    }

    return data.data

  } catch (error) {
    console.error('Get performance overview error:', error)
    throw error
  }
}

/**
 * Generate revenue forecasting
 */
export async function generateForecast(
  dateFrom: string,
  dateTo: string,
  categories?: string[]
): Promise<ForecastData> {
  try {
    const request: AnalyticsRequest = {
      analysisType: 'forecasting',
      dateFrom,
      dateTo,
      categories
    }

    const { data, error } = await supabase.functions.invoke('analytics-engine', {
      body: request
    })

    if (error) {
      throw new Error(`Forecasting error: ${error.message}`)
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to generate forecast')
    }

    return data.data

  } catch (error) {
    console.error('Generate forecast error:', error)
    throw error
  }
}

/**
 * Calculate business metrics from analytics data
 */
export function convertToBusinessMetrics(profitability: ProfitabilityMetrics): BusinessMetrics {
  return {
    revenue: {
      total: profitability.totalRevenue,
      daily: profitability.totalRevenue / 30, // Approximate daily average
      weekly: profitability.totalRevenue / 4, // Approximate weekly average
      monthly: profitability.totalRevenue,
      currency: 'EUR'
    },
    profitability: {
      grossMargin: profitability.grossMargin,
      netMargin: profitability.netMargin,
      averageOrderValue: profitability.averageOrderValue,
      costPerSale: profitability.totalTransactions > 0 ? profitability.totalCost / profitability.totalTransactions : 0
    },
    trends: {
      revenueGrowth: 0, // Would need comparison data
      customerGrowth: 0, // Would need historical data
      seasonalFactors: {} // Would need seasonal analysis
    },
    categories: Object.fromEntries(
      Object.entries(profitability.profitabilityByCategory).map(([category, data]) => [
        category,
        {
          revenue: data.revenue,
          count: data.transactions,
          avgValue: data.transactions > 0 ? data.revenue / data.transactions : 0,
          growth: 0 // Would need historical comparison
        }
      ])
    )
  }
}

/**
 * Get week-over-week comparison
 */
export async function getWeekOverWeekComparison(
  currentWeekStart: string
): Promise<ComparisonMetrics> {
  const currentWeekEnd = new Date(currentWeekStart)
  currentWeekEnd.setDate(currentWeekEnd.getDate() + 6)
  
  const previousWeekStart = new Date(currentWeekStart)
  previousWeekStart.setDate(previousWeekStart.getDate() - 7)
  const previousWeekEnd = new Date(previousWeekStart)
  previousWeekEnd.setDate(previousWeekEnd.getDate() + 6)

  return await analyzeProfitability(
    currentWeekStart,
    currentWeekEnd.toISOString().split('T')[0],
    {
      compareWith: {
        dateFrom: previousWeekStart.toISOString().split('T')[0],
        dateTo: previousWeekEnd.toISOString().split('T')[0]
      }
    }
  ) as ComparisonMetrics
}

/**
 * Get month-over-month comparison
 */
export async function getMonthOverMonthComparison(
  year: number,
  month: number
): Promise<ComparisonMetrics> {
  const currentMonth = new Date(year, month - 1, 1)
  const currentMonthEnd = new Date(year, month, 0)
  
  const previousMonth = new Date(year, month - 2, 1)
  const previousMonthEnd = new Date(year, month - 1, 0)

  return await analyzeProfitability(
    currentMonth.toISOString().split('T')[0],
    currentMonthEnd.toISOString().split('T')[0],
    {
      compareWith: {
        dateFrom: previousMonth.toISOString().split('T')[0],
        dateTo: previousMonthEnd.toISOString().split('T')[0]
      }
    }
  ) as ComparisonMetrics
}

/**
 * Get performance alerts based on thresholds
 */
export function generatePerformanceAlerts(
  metrics: ProfitabilityMetrics,
  thresholds: {
    minGrossMargin?: number
    minNetMargin?: number
    minDailyRevenue?: number
    maxVariableCostRatio?: number
  } = {}
): Array<{
  type: 'warning' | 'critical' | 'info'
  metric: string
  value: number
  threshold: number
  message: string
}> {
  const alerts: any[] = []
  
  const defaultThresholds = {
    minGrossMargin: 40,
    minNetMargin: 15,
    minDailyRevenue: 200,
    maxVariableCostRatio: 60,
    ...thresholds
  }

  // Check gross margin
  if (metrics.grossMargin < defaultThresholds.minGrossMargin) {
    alerts.push({
      type: metrics.grossMargin < defaultThresholds.minGrossMargin * 0.7 ? 'critical' : 'warning',
      metric: 'grossMargin',
      value: metrics.grossMargin,
      threshold: defaultThresholds.minGrossMargin,
      message: `Gross margin (${metrics.grossMargin.toFixed(1)}%) is below target (${defaultThresholds.minGrossMargin}%)`
    })
  }

  // Check net margin
  if (metrics.netMargin < defaultThresholds.minNetMargin) {
    alerts.push({
      type: metrics.netMargin < defaultThresholds.minNetMargin * 0.5 ? 'critical' : 'warning',
      metric: 'netMargin',
      value: metrics.netMargin,
      threshold: defaultThresholds.minNetMargin,
      message: `Net margin (${metrics.netMargin.toFixed(1)}%) is below target (${defaultThresholds.minNetMargin}%)`
    })
  }

  // Check daily revenue (assuming 30-day period)
  const dailyRevenue = metrics.totalRevenue / 30
  if (dailyRevenue < defaultThresholds.minDailyRevenue) {
    alerts.push({
      type: dailyRevenue < defaultThresholds.minDailyRevenue * 0.7 ? 'critical' : 'warning',
      metric: 'dailyRevenue',
      value: dailyRevenue,
      threshold: defaultThresholds.minDailyRevenue,
      message: `Daily revenue (€${dailyRevenue.toFixed(0)}) is below target (€${defaultThresholds.minDailyRevenue})`
    })
  }

  return alerts
}