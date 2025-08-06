import { supabase } from './client'

export interface ReportRequest {
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

export interface ExecutiveReport {
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

export interface OperationalReport {
  period: { from: string; to: string }
  operationalMetrics: {
    dailyAverages: {
      revenue: number
      transactions: number
      orderValue: number
    }
    peakPerformance: {
      bestDay: any
      worstDay: any
    }
    dataQuality: {
      totalEntries: number
      validEntries: number
      voiceEntries: number
      flaggedEntries: number
    }
    trends: Array<{
      date: string
      revenue: number
      transactions: number
      growth: number
      trend: 'up' | 'down' | 'stable'
    }>
  }
  recommendations: string[]
}

export interface FinancialReport {
  revenue: {
    total: number
    growth: number
  }
  profitability: {
    grossProfit: number
    grossMargin: number
    netProfit: number
    netMargin: number
  }
  costs: {
    fixedCosts: number
    variableCosts: number
    categorySpecificCosts: Record<string, number>
  }
  categoryProfitability: Record<string, {
    revenue: number
    cost: number
    profit: number
    margin: number
    transactions: number
  }>
  financialHealth: {
    profitabilityScore: number
    riskLevel: 'low' | 'medium' | 'high'
    recommendations: string[]
  }
}

export interface ReportResponse<T> {
  success: boolean
  reportType: string
  period: {
    from: string
    to: string
  }
  data: T
  generatedAt: string
  language: string
}

/**
 * Generate executive report for leadership overview
 */
export async function generateExecutiveReport(
  dateFrom: string,
  dateTo: string,
  options: {
    compareWith?: { dateFrom: string; dateTo: string }
    language?: 'en' | 'de'
    includeAIInsights?: boolean
  } = {}
): Promise<ExecutiveReport> {
  try {
    const request: ReportRequest = {
      reportType: 'executive',
      dateFrom,
      dateTo,
      format: 'json',
      language: options.language || 'en',
      includeAIInsights: options.includeAIInsights !== false,
      compareWith: options.compareWith
    }

    const { data, error } = await supabase.functions.invoke('analytics-reports', {
      body: request
    })

    if (error) {
      throw new Error(`Executive report error: ${error.message}`)
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to generate executive report')
    }

    return data.data

  } catch (error) {
    console.error('Generate executive report error:', error)
    throw error
  }
}

/**
 * Generate operational report for daily management
 */
export async function generateOperationalReport(
  dateFrom: string,
  dateTo: string,
  options: {
    language?: 'en' | 'de'
    filters?: ReportRequest['filters']
  } = {}
): Promise<OperationalReport> {
  try {
    const request: ReportRequest = {
      reportType: 'operational',
      dateFrom,
      dateTo,
      format: 'json',
      language: options.language || 'en',
      filters: options.filters
    }

    const { data, error } = await supabase.functions.invoke('analytics-reports', {
      body: request
    })

    if (error) {
      throw new Error(`Operational report error: ${error.message}`)
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to generate operational report')
    }

    return data.data

  } catch (error) {
    console.error('Generate operational report error:', error)
    throw error
  }
}

/**
 * Generate financial report for accounting/finance teams
 */
export async function generateFinancialReport(
  dateFrom: string,
  dateTo: string,
  options: {
    compareWith?: { dateFrom: string; dateTo: string }
    language?: 'en' | 'de'
  } = {}
): Promise<FinancialReport> {
  try {
    const request: ReportRequest = {
      reportType: 'financial',
      dateFrom,
      dateTo,
      format: 'json',
      language: options.language || 'en',
      compareWith: options.compareWith
    }

    const { data, error } = await supabase.functions.invoke('analytics-reports', {
      body: request
    })

    if (error) {
      throw new Error(`Financial report error: ${error.message}`)
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to generate financial report')
    }

    return data.data

  } catch (error) {
    console.error('Generate financial report error:', error)
    throw error
  }
}

/**
 * Generate custom report with specific metrics
 */
export async function generateCustomReport(
  dateFrom: string,
  dateTo: string,
  customMetrics: string[],
  options: {
    language?: 'en' | 'de'
    filters?: ReportRequest['filters']
  } = {}
): Promise<any> {
  try {
    const request: ReportRequest = {
      reportType: 'custom',
      dateFrom,
      dateTo,
      format: 'json',
      language: options.language || 'en',
      customMetrics,
      filters: options.filters
    }

    const { data, error } = await supabase.functions.invoke('analytics-reports', {
      body: request
    })

    if (error) {
      throw new Error(`Custom report error: ${error.message}`)
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to generate custom report')
    }

    return data.data

  } catch (error) {
    console.error('Generate custom report error:', error)
    throw error
  }
}

/**
 * Export report as CSV
 */
export async function exportReportAsCSV(
  reportType: 'executive' | 'operational' | 'financial',
  dateFrom: string,
  dateTo: string,
  options: {
    compareWith?: { dateFrom: string; dateTo: string }
    language?: 'en' | 'de'
    filters?: ReportRequest['filters']
  } = {}
): Promise<Blob> {
  try {
    const request: ReportRequest = {
      reportType,
      dateFrom,
      dateTo,
      format: 'csv',
      language: options.language || 'en',
      compareWith: options.compareWith,
      filters: options.filters
    }

    // Use fetch directly for CSV response
    const response = await fetch(`${supabase.supabaseUrl}/functions/v1/analytics-reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabase.supabaseKey}`
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      throw new Error(`CSV export error: ${response.statusText}`)
    }

    return await response.blob()

  } catch (error) {
    console.error('Export report as CSV error:', error)
    throw error
  }
}

/**
 * Get weekly executive summary
 */
export async function getWeeklyExecutiveSummary(
  weekStartDate: string,
  language: 'en' | 'de' = 'en'
): Promise<ExecutiveReport> {
  const weekStart = new Date(weekStartDate)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)

  const previousWeekStart = new Date(weekStart)
  previousWeekStart.setDate(previousWeekStart.getDate() - 7)
  const previousWeekEnd = new Date(previousWeekStart)
  previousWeekEnd.setDate(previousWeekEnd.getDate() + 6)

  return await generateExecutiveReport(
    weekStart.toISOString().split('T')[0],
    weekEnd.toISOString().split('T')[0],
    {
      compareWith: {
        dateFrom: previousWeekStart.toISOString().split('T')[0],
        dateTo: previousWeekEnd.toISOString().split('T')[0]
      },
      language,
      includeAIInsights: true
    }
  )
}

/**
 * Get monthly financial summary
 */
export async function getMonthlyFinancialSummary(
  year: number,
  month: number,
  language: 'en' | 'de' = 'en'
): Promise<FinancialReport> {
  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 0)

  const previousMonthStart = new Date(year, month - 2, 1)
  const previousMonthEnd = new Date(year, month - 1, 0)

  return await generateFinancialReport(
    monthStart.toISOString().split('T')[0],
    monthEnd.toISOString().split('T')[0],
    {
      compareWith: {
        dateFrom: previousMonthStart.toISOString().split('T')[0],
        dateTo: previousMonthEnd.toISOString().split('T')[0]
      },
      language
    }
  )
}

/**
 * Get daily operational dashboard data
 */
export async function getDailyOperationalDashboard(
  date: string,
  language: 'en' | 'de' = 'en'
): Promise<OperationalReport> {
  // Get data for the specified day and previous 7 days for context
  const endDate = new Date(date)
  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - 6)

  return await generateOperationalReport(
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0],
    {
      language,
      filters: {
        validationStatus: ['valid'] // Only include validated data
      }
    }
  )
}

/**
 * Generate comprehensive business health report
 */
export async function generateBusinessHealthReport(
  dateFrom: string,
  dateTo: string,
  language: 'en' | 'de' = 'en'
): Promise<{
  executive: ExecutiveReport
  operational: OperationalReport
  financial: FinancialReport
  healthScore: number
  criticalAlerts: any[]
  recommendations: string[]
}> {
  try {
    const [executive, operational, financial] = await Promise.all([
      generateExecutiveReport(dateFrom, dateTo, { language, includeAIInsights: true }),
      generateOperationalReport(dateFrom, dateTo, { language }),
      generateFinancialReport(dateFrom, dateTo, { language })
    ])

    // Calculate overall health score
    const healthScore = calculateBusinessHealthScore(executive, operational, financial)

    // Aggregate critical alerts
    const criticalAlerts = [
      ...executive.alerts.filter(alert => alert.type === 'critical'),
      // Add operational alerts if available
      // Add financial alerts if available
    ]

    // Aggregate recommendations
    const recommendations = [
      ...executive.recommendations,
      ...operational.recommendations,
      ...financial.financialHealth.recommendations
    ].slice(0, 10) // Limit to top 10 recommendations

    return {
      executive,
      operational,
      financial,
      healthScore,
      criticalAlerts,
      recommendations
    }

  } catch (error) {
    console.error('Generate business health report error:', error)
    throw error
  }
}

/**
 * Calculate overall business health score
 */
function calculateBusinessHealthScore(
  executive: ExecutiveReport,
  operational: OperationalReport,
  financial: FinancialReport
): number {
  let score = 100

  // Deduct points for critical issues
  executive.alerts.forEach(alert => {
    if (alert.type === 'critical') {
      score -= alert.impact === 'high' ? 15 : 10
    } else if (alert.type === 'warning') {
      score -= alert.impact === 'high' ? 8 : 5
    }
  })

  // Factor in financial health
  if (financial.financialHealth.riskLevel === 'high') {
    score -= 20
  } else if (financial.financialHealth.riskLevel === 'medium') {
    score -= 10
  }

  // Factor in data quality
  const dataQualityScore = operational.operationalMetrics.dataQuality.validEntries / 
                          operational.operationalMetrics.dataQuality.totalEntries
  if (dataQualityScore < 0.9) {
    score -= (1 - dataQualityScore) * 20
  }

  // Factor in trend direction
  if (executive.keyMetrics.trendDirection === 'down') {
    score -= 15
  } else if (executive.keyMetrics.trendDirection === 'up') {
    score += 5
  }

  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * Schedule automated report generation
 */
export interface ReportSchedule {
  id: string
  reportType: 'executive' | 'operational' | 'financial'
  frequency: 'daily' | 'weekly' | 'monthly'
  recipients: string[]
  format: 'json' | 'csv' | 'pdf'
  language: 'en' | 'de'
  isActive: boolean
}

// Note: This would require additional backend scheduling functionality
export async function scheduleReport(schedule: Omit<ReportSchedule, 'id'>): Promise<ReportSchedule> {
  // This would integrate with a scheduling system like cron jobs or task queues
  throw new Error('Report scheduling not yet implemented - requires backend scheduling service')
}