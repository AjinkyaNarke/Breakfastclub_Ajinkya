import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReportRequest {
  reportType: 'executive' | 'operational' | 'financial' | 'custom'
  dateFrom: string
  dateTo: string
  compareWith?: {
    dateFrom: string
    dateTo: string
  }
  format: 'json' | 'pdf' | 'csv'
  language?: 'en' | 'de'
  includeAIInsights?: boolean
  customMetrics?: string[]
  filters?: {
    categories?: string[]
    minAmount?: number
    validationStatus?: string[]
  }
}

interface ExecutiveReport {
  summary: {
    totalRevenue: number
    totalProfit: number
    grossMargin: number
    totalTransactions: number
    averageOrderValue: number
    periodComparison?: {
      revenueChange: number
      profitChange: number
      transactionChange: number
    }
  }
  keyMetrics: {
    topPerformingCategory: string
    worstPerformingCategory: string
    busyDay: string
    quietDay: string
    trendDirection: 'up' | 'down' | 'stable'
  }
  aiInsights: string[]
  recommendations: string[]
  alerts: Array<{
    type: 'warning' | 'critical' | 'info'
    message: string
    metric: string
    impact: 'high' | 'medium' | 'low'
  }>
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

    const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY')
    if (!DEEPSEEK_API_KEY) {
      throw new Error('DeepSeek API key not configured')
    }

    const requestData: ReportRequest = await req.json()
    
    if (!requestData.reportType || !requestData.dateFrom || !requestData.dateTo) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: reportType, dateFrom, dateTo' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    let report: any

    switch (requestData.reportType) {
      case 'executive':
        report = await generateExecutiveReport(supabaseClient, requestData, DEEPSEEK_API_KEY)
        break
      
      case 'operational':
        report = await generateOperationalReport(supabaseClient, requestData, DEEPSEEK_API_KEY)
        break
      
      case 'financial':
        report = await generateFinancialReport(supabaseClient, requestData, DEEPSEEK_API_KEY)
        break
      
      case 'custom':
        report = await generateCustomReport(supabaseClient, requestData, DEEPSEEK_API_KEY)
        break
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid report type' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
    }

    // Format response based on requested format
    if (requestData.format === 'json') {
      return new Response(
        JSON.stringify({
          success: true,
          reportType: requestData.reportType,
          period: {
            from: requestData.dateFrom,
            to: requestData.dateTo
          },
          data: report,
          generatedAt: new Date().toISOString(),
          language: requestData.language || 'en'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } else if (requestData.format === 'csv') {
      const csv = convertReportToCSV(report, requestData.reportType)
      return new Response(csv, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${requestData.reportType}-report-${requestData.dateFrom}.csv"`
        }
      })
    } else {
      // PDF format would require additional PDF generation library
      return new Response(
        JSON.stringify({ error: 'PDF format not yet supported' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('Analytics reports error:', error)
    
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

async function generateExecutiveReport(supabaseClient: any, request: ReportRequest, deepseekApiKey: string): Promise<ExecutiveReport> {
  // Get analytics data
  const analyticsResponse = await supabaseClient.functions.invoke('analytics-engine', {
    body: {
      analysisType: 'performance',
      dateFrom: request.dateFrom,
      dateTo: request.dateTo,
      compareWith: request.compareWith
    }
  })

  if (!analyticsResponse.data?.success) {
    throw new Error('Failed to get analytics data')
  }

  const analytics = analyticsResponse.data.data
  const profitability = analytics.profitability
  const trends = analytics.trends
  const categories = analytics.categories

  // Build executive summary
  const summary = {
    totalRevenue: profitability.current?.totalRevenue || profitability.totalRevenue,
    totalProfit: profitability.current?.grossProfit || profitability.grossProfit,
    grossMargin: profitability.current?.grossMargin || profitability.grossMargin,
    totalTransactions: profitability.current?.totalTransactions || profitability.totalTransactions,
    averageOrderValue: profitability.current?.averageOrderValue || profitability.averageOrderValue,
    periodComparison: profitability.changes ? {
      revenueChange: profitability.changes.revenueChange,
      profitChange: profitability.changes.profitChange,
      transactionChange: profitability.changes.transactionChange
    } : undefined
  }

  // Extract key metrics
  const categoryStats = Object.entries(categories.categories)
  const topCategory = categoryStats.sort(([,a], [,b]) => b.revenue - a.revenue)[0]
  const worstCategory = categoryStats.sort(([,a], [,b]) => a.revenue - b.revenue)[0]

  const dailyTrends = trends.filter(t => t.period.includes('-'))
  const busyDay = dailyTrends.sort((a, b) => b.revenue - a.revenue)[0]
  const quietDay = dailyTrends.sort((a, b) => a.revenue - b.revenue)[0]

  const keyMetrics = {
    topPerformingCategory: topCategory?.[0] || 'N/A',
    worstPerformingCategory: worstCategory?.[0] || 'N/A',
    busyDay: busyDay?.period || 'N/A',
    quietDay: quietDay?.period || 'N/A',
    trendDirection: analytics.keyMetrics?.trendDirection || 'stable'
  }

  // Generate AI insights and recommendations
  let aiInsights: string[] = []
  let recommendations: string[] = []

  if (request.includeAIInsights !== false) {
    const aiAnalysis = await generateAIInsights(analytics, request.language || 'en', deepseekApiKey)
    aiInsights = aiAnalysis.insights
    recommendations = aiAnalysis.recommendations
  }

  // Generate alerts
  const alerts = generateBusinessAlerts(analytics)

  return {
    summary,
    keyMetrics,
    aiInsights,
    recommendations,
    alerts
  }
}

async function generateOperationalReport(supabaseClient: any, request: ReportRequest, deepseekApiKey: string) {
  // Get detailed operational data
  const [analyticsResponse, salesDataResponse] = await Promise.all([
    supabaseClient.functions.invoke('analytics-engine', {
      body: {
        analysisType: 'trends',
        dateFrom: request.dateFrom,
        dateTo: request.dateTo,
        granularity: 'daily'
      }
    }),
    supabaseClient.functions.invoke('sales-data-crud', {
      method: 'GET',
      body: null
    })
  ])

  if (!analyticsResponse.data?.success) {
    throw new Error('Failed to get analytics data')
  }

  const trends = analyticsResponse.data.data
  const salesData = salesDataResponse.data?.data || []

  // Operational metrics
  const operationalMetrics = {
    dailyAverages: {
      revenue: trends.reduce((sum: number, t: any) => sum + t.revenue, 0) / trends.length,
      transactions: trends.reduce((sum: number, t: any) => sum + t.transactions, 0) / trends.length,
      orderValue: trends.reduce((sum: number, t: any) => sum + t.averageOrderValue, 0) / trends.length
    },
    peakPerformance: {
      bestDay: trends.sort((a: any, b: any) => b.revenue - a.revenue)[0],
      worstDay: trends.sort((a: any, b: any) => a.revenue - b.revenue)[0]
    },
    dataQuality: {
      totalEntries: salesData.length,
      validEntries: salesData.filter((entry: any) => entry.validation_status === 'valid').length,
      voiceEntries: salesData.filter((entry: any) => entry.source === 'voice').length,
      flaggedEntries: salesData.filter((entry: any) => entry.validation_status === 'review_required').length
    },
    trends: trends.map((trend: any) => ({
      date: trend.period,
      revenue: trend.revenue,
      transactions: trend.transactions,
      growth: trend.growthRate,
      trend: trend.trendDirection
    }))
  }

  return {
    period: { from: request.dateFrom, to: request.dateTo },
    operationalMetrics,
    recommendations: await generateOperationalRecommendations(operationalMetrics, deepseekApiKey)
  }
}

async function generateFinancialReport(supabaseClient: any, request: ReportRequest, deepseekApiKey: string) {
  // Get comprehensive financial data
  const analyticsResponse = await supabaseClient.functions.invoke('analytics-engine', {
    body: {
      analysisType: 'profitability',
      dateFrom: request.dateFrom,
      dateTo: request.dateTo,
      compareWith: request.compareWith,
      costData: {
        fixedCosts: 3000, // Default monthly fixed costs
        variableCostRatio: 0.35 // Default 35% variable cost ratio
      }
    }
  })

  if (!analyticsResponse.data?.success) {
    throw new Error('Failed to get analytics data')
  }

  const profitabilityData = analyticsResponse.data.data

  // Financial analysis
  const financialMetrics = {
    revenue: {
      total: profitabilityData.current?.totalRevenue || profitabilityData.totalRevenue,
      growth: profitabilityData.changes?.revenueChange || 0
    },
    profitability: {
      grossProfit: profitabilityData.current?.grossProfit || profitabilityData.grossProfit,
      grossMargin: profitabilityData.current?.grossMargin || profitabilityData.grossMargin,
      netProfit: profitabilityData.current?.netProfit || profitabilityData.netProfit,
      netMargin: profitabilityData.current?.netMargin || profitabilityData.netMargin
    },
    costs: profitabilityData.current?.costBreakdown || profitabilityData.costBreakdown,
    categoryProfitability: profitabilityData.current?.profitabilityByCategory || profitabilityData.profitabilityByCategory,
    financialHealth: {
      profitabilityScore: calculateProfitabilityScore(profitabilityData),
      riskLevel: assessFinancialRisk(profitabilityData),
      recommendations: []
    }
  }

  return financialMetrics
}

async function generateCustomReport(supabaseClient: any, request: ReportRequest, deepseekApiKey: string) {
  // Build custom report based on requested metrics
  const customData: any = {}

  if (request.customMetrics?.includes('profitability')) {
    const profitabilityResponse = await supabaseClient.functions.invoke('analytics-engine', {
      body: {
        analysisType: 'profitability',
        dateFrom: request.dateFrom,
        dateTo: request.dateTo
      }
    })
    customData.profitability = profitabilityResponse.data?.data
  }

  if (request.customMetrics?.includes('trends')) {
    const trendsResponse = await supabaseClient.functions.invoke('analytics-engine', {
      body: {
        analysisType: 'trends',
        dateFrom: request.dateFrom,
        dateTo: request.dateTo,
        granularity: 'daily'
      }
    })
    customData.trends = trendsResponse.data?.data
  }

  if (request.customMetrics?.includes('categories')) {
    const categoriesResponse = await supabaseClient.functions.invoke('analytics-engine', {
      body: {
        analysisType: 'categories',
        dateFrom: request.dateFrom,
        dateTo: request.dateTo
      }
    })
    customData.categories = categoriesResponse.data?.data
  }

  return {
    customMetrics: request.customMetrics,
    data: customData,
    summary: generateCustomSummary(customData)
  }
}

async function generateAIInsights(analyticsData: any, language: string, apiKey: string): Promise<{insights: string[], recommendations: string[]}> {
  const systemPrompt = `You are an expert business analyst specializing in restaurant analytics. Analyze the provided business data and generate insights and recommendations.

Language: ${language === 'de' ? 'German' : 'English'}

Provide:
1. Key insights about business performance
2. Actionable recommendations for improvement
3. Risk assessment and opportunities

Focus on practical, data-driven advice.`

  const userPrompt = `Analyze this restaurant business data and provide insights:

${JSON.stringify(analyticsData, null, 2)}

Provide 5-7 key insights and 3-5 actionable recommendations.`

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-reasoner',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 1500
      }),
    })

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''

    // Parse insights and recommendations from AI response
    const insights = extractListFromText(content, 'insights?|key findings?')
    const recommendations = extractListFromText(content, 'recommendations?|suggestions?')

    return {
      insights: insights.slice(0, 7),
      recommendations: recommendations.slice(0, 5)
    }

  } catch (error) {
    console.error('AI insights generation failed:', error)
    return {
      insights: ['AI analysis temporarily unavailable'],
      recommendations: ['Manual review recommended']
    }
  }
}

async function generateOperationalRecommendations(operationalMetrics: any, apiKey: string): Promise<string[]> {
  // Generate targeted operational recommendations
  const recommendations: string[] = []

  // Data quality recommendations
  if (operationalMetrics.dataQuality.flaggedEntries > operationalMetrics.dataQuality.totalEntries * 0.1) {
    recommendations.push('Review flagged sales entries - high percentage requires attention')
  }

  // Performance recommendations
  const revenueVariance = operationalMetrics.peakPerformance.bestDay.revenue / operationalMetrics.peakPerformance.worstDay.revenue
  if (revenueVariance > 3) {
    recommendations.push('High revenue variance detected - investigate factors causing inconsistent performance')
  }

  // Trend-based recommendations
  const negativeGrowthDays = operationalMetrics.trends.filter((t: any) => t.growth < -5).length
  if (negativeGrowthDays > operationalMetrics.trends.length * 0.3) {
    recommendations.push('Concerning trend: multiple days with declining performance')
  }

  return recommendations.length > 0 ? recommendations : ['Operations appear stable']
}

function generateBusinessAlerts(analyticsData: any): Array<{type: 'warning' | 'critical' | 'info', message: string, metric: string, impact: 'high' | 'medium' | 'low'}> {
  const alerts: any[] = []
  const profitability = analyticsData.profitability

  // Margin alerts
  if (profitability.grossMargin < 30) {
    alerts.push({
      type: 'critical',
      message: `Gross margin (${profitability.grossMargin.toFixed(1)}%) is critically low`,
      metric: 'grossMargin',
      impact: 'high'
    })
  } else if (profitability.grossMargin < 40) {
    alerts.push({
      type: 'warning',
      message: `Gross margin (${profitability.grossMargin.toFixed(1)}%) is below recommended level`,
      metric: 'grossMargin',
      impact: 'medium'
    })
  }

  // Revenue trend alerts
  if (analyticsData.keyMetrics?.trendDirection === 'down') {
    alerts.push({
      type: 'warning',
      message: 'Declining revenue trend detected',
      metric: 'revenue',
      impact: 'high'
    })
  }

  return alerts
}

function calculateProfitabilityScore(profitabilityData: any): number {
  const metrics = profitabilityData.current || profitabilityData
  let score = 0

  // Gross margin score (0-40 points)
  score += Math.min(40, metrics.grossMargin)

  // Net margin score (0-30 points)
  score += Math.min(30, metrics.netMargin * 2)

  // Revenue growth score (0-30 points)
  if (profitabilityData.changes) {
    score += Math.min(30, Math.max(-30, profitabilityData.changes.revenueChange))
  } else {
    score += 15 // Neutral score if no comparison
  }

  return Math.max(0, Math.min(100, score))
}

function assessFinancialRisk(profitabilityData: any): 'low' | 'medium' | 'high' {
  const metrics = profitabilityData.current || profitabilityData
  
  if (metrics.netMargin < 5 || metrics.grossMargin < 25) {
    return 'high'
  } else if (metrics.netMargin < 15 || metrics.grossMargin < 40) {
    return 'medium'
  } else {
    return 'low'
  }
}

function generateCustomSummary(customData: any): any {
  const summary: any = {}

  if (customData.profitability) {
    summary.totalRevenue = customData.profitability.totalRevenue
    summary.grossMargin = customData.profitability.grossMargin
  }

  if (customData.trends) {
    summary.trendDirection = customData.trends[customData.trends.length - 1]?.trendDirection || 'stable'
    summary.averageGrowthRate = customData.trends.reduce((sum: number, t: any) => sum + t.growthRate, 0) / customData.trends.length
  }

  if (customData.categories) {
    summary.topCategory = customData.categories.summary?.topPerformerByRevenue
    summary.categoryCount = customData.categories.summary?.totalCategories
  }

  return summary
}

function extractListFromText(text: string, pattern: string): string[] {
  const regex = new RegExp(`${pattern}[:\\s]*([\\s\\S]*?)(?=\\n\\n|$)`, 'i')
  const match = text.match(regex)
  
  if (!match) return []
  
  return match[1]
    .split('\n')
    .map(line => line.replace(/^[-*•]\s*/, '').trim())
    .filter(line => line.length > 0)
    .slice(0, 10)
}

function convertReportToCSV(report: any, reportType: string): string {
  const headers: string[] = []
  const rows: string[][] = []

  if (reportType === 'executive') {
    headers.push('Metric', 'Value', 'Unit')
    
    // Add summary metrics
    Object.entries(report.summary).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([subKey, subValue]) => {
          rows.push([`${key}.${subKey}`, String(subValue), getUnitForMetric(subKey)])
        })
      } else {
        rows.push([key, String(value), getUnitForMetric(key)])
      }
    })

    // Add key metrics
    Object.entries(report.keyMetrics).forEach(([key, value]) => {
      rows.push([key, String(value), ''])
    })
  }

  // Convert to CSV format
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  return csvContent
}

function getUnitForMetric(metric: string): string {
  const units: Record<string, string> = {
    totalRevenue: 'EUR',
    totalProfit: 'EUR',
    averageOrderValue: 'EUR',
    grossMargin: '%',
    netMargin: '%',
    revenueChange: '%',
    profitChange: '%',
    transactionChange: '%',
    totalTransactions: 'count'
  }
  
  return units[metric] || ''
}