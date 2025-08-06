import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalyticsRequest {
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
    fixedCosts?: number // Monthly fixed costs
    variableCostRatio?: number // Variable costs as % of revenue
    categorySpecificCosts?: Record<string, {
      costPerUnit?: number
      marginPercentage?: number
    }>
  }
}

interface ProfitabilityMetrics {
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

interface TrendAnalysis {
  period: string
  revenue: number
  transactions: number
  averageOrderValue: number
  growthRate: number
  seasonalIndex: number
  trendDirection: 'up' | 'down' | 'stable'
}

interface ComparisonMetrics {
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const requestData: AnalyticsRequest = await req.json()
    
    if (!requestData.analysisType || !requestData.dateFrom || !requestData.dateTo) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: analysisType, dateFrom, dateTo' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    let result: any

    switch (requestData.analysisType) {
      case 'profitability':
        result = await analyzeProfitability(supabaseClient, requestData)
        break
      
      case 'trends':
        result = await analyzeTrends(supabaseClient, requestData)
        break
      
      case 'categories':
        result = await analyzeCategoryPerformance(supabaseClient, requestData)
        break
      
      case 'performance':
        result = await analyzeOverallPerformance(supabaseClient, requestData)
        break
      
      case 'forecasting':
        result = await generateForecasting(supabaseClient, requestData)
        break
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid analysis type' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysisType: requestData.analysisType,
        period: {
          from: requestData.dateFrom,
          to: requestData.dateTo
        },
        data: result,
        generatedAt: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Analytics engine error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function getSalesData(supabaseClient: any, dateFrom: string, dateTo: string, categories?: string[]) {
  let query = supabaseClient
    .from('sales_data')
    .select('*')
    .gte('date', dateFrom)
    .lte('date', dateTo)
    .eq('validation_status', 'valid')

  if (categories && categories.length > 0) {
    query = query.in('category', categories)
  }

  const { data, error } = await query.order('date', { ascending: true })
  
  if (error) {
    throw new Error(`Sales data query error: ${error.message}`)
  }
  
  return data || []
}

async function analyzeProfitability(supabaseClient: any, request: AnalyticsRequest): Promise<ProfitabilityMetrics | ComparisonMetrics> {
  const salesData = await getSalesData(supabaseClient, request.dateFrom, request.dateTo, request.categories)
  
  const costData = request.costData || {
    fixedCosts: 0,
    variableCostRatio: 0.3, // Default 30% variable cost ratio
    categorySpecificCosts: {}
  }

  const profitability = calculateProfitabilityMetrics(salesData, costData, request.dateFrom, request.dateTo)

  // If comparison period is requested
  if (request.compareWith) {
    const comparisonSalesData = await getSalesData(
      supabaseClient, 
      request.compareWith.dateFrom, 
      request.compareWith.dateTo, 
      request.categories
    )
    
    const comparisonProfitability = calculateProfitabilityMetrics(
      comparisonSalesData, 
      costData, 
      request.compareWith.dateFrom, 
      request.compareWith.dateTo
    )

    return {
      current: profitability,
      comparison: comparisonProfitability,
      changes: {
        revenueChange: calculatePercentageChange(comparisonProfitability.totalRevenue, profitability.totalRevenue),
        profitChange: calculatePercentageChange(comparisonProfitability.grossProfit, profitability.grossProfit),
        marginChange: profitability.grossMargin - comparisonProfitability.grossMargin,
        transactionChange: calculatePercentageChange(comparisonProfitability.totalTransactions, profitability.totalTransactions),
        aovChange: calculatePercentageChange(comparisonProfitability.averageOrderValue, profitability.averageOrderValue)
      },
      insights: generateProfitabilityInsights(profitability, comparisonProfitability)
    }
  }

  return profitability
}

function calculateProfitabilityMetrics(salesData: any[], costData: any, dateFrom: string, dateTo: string): ProfitabilityMetrics {
  const totalRevenue = salesData.reduce((sum, entry) => sum + (entry.amount || 0), 0)
  const totalTransactions = salesData.length
  const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0

  // Calculate time period for fixed costs allocation
  const daysDiff = Math.ceil((new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / (1000 * 60 * 60 * 24)) + 1
  const monthlyFixedCosts = costData.fixedCosts || 0
  const allocatedFixedCosts = (monthlyFixedCosts / 30) * daysDiff

  // Calculate variable costs
  const variableCosts = totalRevenue * (costData.variableCostRatio || 0.3)

  // Calculate category-specific costs and profitability
  const categoryStats: Record<string, { revenue: number; cost: number; profit: number; margin: number; transactions: number }> = {}
  const categorySpecificCosts: Record<string, number> = {}

  salesData.forEach(entry => {
    const category = entry.category
    if (!categoryStats[category]) {
      categoryStats[category] = { revenue: 0, cost: 0, profit: 0, margin: 0, transactions: 0 }
    }
    
    const categoryRevenue = entry.amount || 0
    categoryStats[category].revenue += categoryRevenue
    categoryStats[category].transactions += 1

    // Calculate category-specific costs
    const categoryConfig = costData.categorySpecificCosts?.[category] || {}
    let categoryCost = 0

    if (categoryConfig.costPerUnit) {
      categoryCost = (entry.items || 1) * categoryConfig.costPerUnit
    } else if (categoryConfig.marginPercentage) {
      categoryCost = categoryRevenue * (1 - categoryConfig.marginPercentage / 100)
    } else {
      // Use general variable cost ratio
      categoryCost = categoryRevenue * (costData.variableCostRatio || 0.3)
    }

    categoryStats[category].cost += categoryCost
    categorySpecificCosts[category] = (categorySpecificCosts[category] || 0) + categoryCost
  })

  // Calculate category margins
  Object.keys(categoryStats).forEach(category => {
    const stats = categoryStats[category]
    stats.profit = stats.revenue - stats.cost
    stats.margin = stats.revenue > 0 ? (stats.profit / stats.revenue) * 100 : 0
  })

  const totalCategorySpecificCosts = Object.values(categorySpecificCosts).reduce((sum, cost) => sum + cost, 0)
  const totalCost = allocatedFixedCosts + totalCategorySpecificCosts

  const grossProfit = totalRevenue - totalCategorySpecificCosts
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0
  const netProfit = totalRevenue - totalCost
  const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

  return {
    totalRevenue,
    totalCost,
    grossProfit,
    grossMargin,
    netProfit,
    netMargin,
    averageOrderValue,
    totalTransactions,
    costBreakdown: {
      fixedCosts: allocatedFixedCosts,
      variableCosts: variableCosts,
      categorySpecificCosts: categorySpecificCosts
    },
    profitabilityByCategory: categoryStats
  }
}

async function analyzeTrends(supabaseClient: any, request: AnalyticsRequest): Promise<TrendAnalysis[]> {
  const salesData = await getSalesData(supabaseClient, request.dateFrom, request.dateTo, request.categories)
  const granularity = request.granularity || 'daily'
  
  // Group data by time periods
  const groupedData = groupDataByPeriod(salesData, granularity)
  
  // Calculate trends for each period
  const trends: TrendAnalysis[] = []
  const periods = Object.keys(groupedData).sort()
  
  periods.forEach((period, index) => {
    const periodData = groupedData[period]
    const revenue = periodData.reduce((sum: number, entry: any) => sum + (entry.amount || 0), 0)
    const transactions = periodData.length
    const averageOrderValue = transactions > 0 ? revenue / transactions : 0
    
    // Calculate growth rate (compared to previous period)
    let growthRate = 0
    if (index > 0) {
      const previousPeriod = groupedData[periods[index - 1]]
      const previousRevenue = previousPeriod.reduce((sum: number, entry: any) => sum + (entry.amount || 0), 0)
      growthRate = previousRevenue > 0 ? ((revenue - previousRevenue) / previousRevenue) * 100 : 0
    }
    
    // Calculate seasonal index (comparing to average)
    const allPeriodsRevenue = periods.map(p => 
      groupedData[p].reduce((sum: number, entry: any) => sum + (entry.amount || 0), 0)
    )
    const averageRevenue = allPeriodsRevenue.reduce((sum, r) => sum + r, 0) / allPeriodsRevenue.length
    const seasonalIndex = averageRevenue > 0 ? revenue / averageRevenue : 1
    
    // Determine trend direction
    let trendDirection: 'up' | 'down' | 'stable' = 'stable'
    if (growthRate > 5) trendDirection = 'up'
    else if (growthRate < -5) trendDirection = 'down'
    
    trends.push({
      period,
      revenue,
      transactions,
      averageOrderValue,
      growthRate,
      seasonalIndex,
      trendDirection
    })
  })
  
  return trends
}

async function analyzeCategoryPerformance(supabaseClient: any, request: AnalyticsRequest) {
  const salesData = await getSalesData(supabaseClient, request.dateFrom, request.dateTo)
  
  // Group by category
  const categoryPerformance: Record<string, any> = {}
  
  salesData.forEach(entry => {
    const category = entry.category
    if (!categoryPerformance[category]) {
      categoryPerformance[category] = {
        revenue: 0,
        transactions: 0,
        averageOrderValue: 0,
        totalItems: 0,
        revenueShare: 0,
        transactionShare: 0,
        trends: []
      }
    }
    
    categoryPerformance[category].revenue += entry.amount || 0
    categoryPerformance[category].transactions += 1
    categoryPerformance[category].totalItems += entry.items || 1
  })
  
  // Calculate percentages and averages
  const totalRevenue = Object.values(categoryPerformance).reduce((sum: number, cat: any) => sum + cat.revenue, 0)
  const totalTransactions = Object.values(categoryPerformance).reduce((sum: number, cat: any) => sum + cat.transactions, 0)
  
  Object.keys(categoryPerformance).forEach(category => {
    const stats = categoryPerformance[category]
    stats.averageOrderValue = stats.transactions > 0 ? stats.revenue / stats.transactions : 0
    stats.revenueShare = totalRevenue > 0 ? (stats.revenue / totalRevenue) * 100 : 0
    stats.transactionShare = totalTransactions > 0 ? (stats.transactions / totalTransactions) * 100 : 0
  })
  
  return {
    categories: categoryPerformance,
    summary: {
      totalCategories: Object.keys(categoryPerformance).length,
      topPerformerByRevenue: Object.entries(categoryPerformance)
        .sort(([,a], [,b]) => (b as any).revenue - (a as any).revenue)[0]?.[0],
      topPerformerByTransactions: Object.entries(categoryPerformance)
        .sort(([,a], [,b]) => (b as any).transactions - (a as any).transactions)[0]?.[0]
    }
  }
}

async function analyzeOverallPerformance(supabaseClient: any, request: AnalyticsRequest) {
  const [profitability, trends, categories] = await Promise.all([
    analyzeProfitability(supabaseClient, request),
    analyzeTrends(supabaseClient, request),
    analyzeCategoryPerformance(supabaseClient, request)
  ])
  
  return {
    profitability,
    trends,
    categories,
    keyMetrics: {
      totalRevenue: (profitability as ProfitabilityMetrics).totalRevenue,
      totalTransactions: (profitability as ProfitabilityMetrics).totalTransactions,
      averageOrderValue: (profitability as ProfitabilityMetrics).averageOrderValue,
      grossMargin: (profitability as ProfitabilityMetrics).grossMargin,
      trendDirection: trends.length > 0 ? trends[trends.length - 1].trendDirection : 'stable',
      topCategory: categories.summary.topPerformerByRevenue
    }
  }
}

async function generateForecasting(supabaseClient: any, request: AnalyticsRequest) {
  const trends = await analyzeTrends(supabaseClient, { ...request, granularity: 'daily' })
  
  if (trends.length < 7) {
    throw new Error('Insufficient data for forecasting (minimum 7 days required)')
  }
  
  // Simple linear regression for forecasting
  const revenues = trends.map(t => t.revenue)
  const forecast = calculateLinearForecast(revenues, 7) // Forecast next 7 days
  
  return {
    historicalTrends: trends,
    forecast: forecast.map((value, index) => ({
      period: getNextPeriod(trends[trends.length - 1].period, index + 1),
      predictedRevenue: Math.max(0, value),
      confidence: Math.max(0.3, 1 - (index * 0.1)) // Decreasing confidence over time
    })),
    insights: generateForecastInsights(trends, forecast)
  }
}

// Utility functions
function groupDataByPeriod(salesData: any[], granularity: string): Record<string, any[]> {
  const grouped: Record<string, any[]> = {}
  
  salesData.forEach(entry => {
    let periodKey: string
    const date = new Date(entry.date)
    
    switch (granularity) {
      case 'weekly':
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        periodKey = weekStart.toISOString().split('T')[0]
        break
      case 'monthly':
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        break
      default: // daily
        periodKey = entry.date
    }
    
    if (!grouped[periodKey]) {
      grouped[periodKey] = []
    }
    grouped[periodKey].push(entry)
  })
  
  return grouped
}

function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0
  return ((newValue - oldValue) / oldValue) * 100
}

function generateProfitabilityInsights(current: ProfitabilityMetrics, comparison: ProfitabilityMetrics): string[] {
  const insights: string[] = []
  
  const revenueChange = calculatePercentageChange(comparison.totalRevenue, current.totalRevenue)
  const profitChange = calculatePercentageChange(comparison.grossProfit, current.grossProfit)
  
  if (revenueChange > 10) {
    insights.push(`Revenue increased significantly by ${revenueChange.toFixed(1)}%`)
  } else if (revenueChange < -10) {
    insights.push(`Revenue declined by ${Math.abs(revenueChange).toFixed(1)}%`)
  }
  
  if (current.grossMargin > comparison.grossMargin + 2) {
    insights.push('Profitability margins improved')
  } else if (current.grossMargin < comparison.grossMargin - 2) {
    insights.push('Profitability margins declined - review cost structure')
  }
  
  // Find best and worst performing categories
  const currentCategories = Object.entries(current.profitabilityByCategory)
  const bestCategory = currentCategories.sort(([,a], [,b]) => b.margin - a.margin)[0]
  const worstCategory = currentCategories.sort(([,a], [,b]) => a.margin - b.margin)[0]
  
  if (bestCategory) {
    insights.push(`Best performing category: ${bestCategory[0]} (${bestCategory[1].margin.toFixed(1)}% margin)`)
  }
  
  if (worstCategory && worstCategory[1].margin < 20) {
    insights.push(`${worstCategory[0]} category has low margins (${worstCategory[1].margin.toFixed(1)}%) - consider optimization`)
  }
  
  return insights
}

function calculateLinearForecast(values: number[], periods: number): number[] {
  const n = values.length
  const x = Array.from({ length: n }, (_, i) => i)
  const y = values
  
  // Calculate linear regression coefficients
  const sumX = x.reduce((sum, val) => sum + val, 0)
  const sumY = y.reduce((sum, val) => sum + val, 0)
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0)
  const sumXX = x.reduce((sum, val) => sum + val * val, 0)
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  
  // Generate forecast
  return Array.from({ length: periods }, (_, i) => intercept + slope * (n + i))
}

function getNextPeriod(lastPeriod: string, daysAhead: number): string {
  const date = new Date(lastPeriod)
  date.setDate(date.getDate() + daysAhead)
  return date.toISOString().split('T')[0]
}

function generateForecastInsights(trends: TrendAnalysis[], forecast: number[]): string[] {
  const insights: string[] = []
  
  const recentTrend = trends.slice(-3).map(t => t.growthRate)
  const avgGrowth = recentTrend.reduce((sum, rate) => sum + rate, 0) / recentTrend.length
  
  if (avgGrowth > 5) {
    insights.push('Strong upward trend expected to continue')
  } else if (avgGrowth < -5) {
    insights.push('Declining trend - intervention may be needed')
  } else {
    insights.push('Stable performance expected')
  }
  
  const forecastTotal = forecast.reduce((sum, val) => sum + val, 0)
  const recentTotal = trends.slice(-forecast.length).reduce((sum, t) => sum + t.revenue, 0)
  const forecastChange = calculatePercentageChange(recentTotal, forecastTotal)
  
  insights.push(`Forecast suggests ${forecastChange > 0 ? 'growth' : 'decline'} of ${Math.abs(forecastChange).toFixed(1)}% over next period`)
  
  return insights
}