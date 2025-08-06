import { supabase } from '@/integrations/supabase/client'

export interface AnalyticsQuery {
  query: string
  queryType: 'business_intelligence' | 'chat' | 'recommendation' | 'analysis'
  salesData?: any[]
  context?: {
    timeframe?: string
    metrics?: string[]
    language?: 'en' | 'de'
  }
  complexity?: 'simple' | 'medium' | 'complex'
}

export interface AnalyticsResponse {
  success: boolean
  response: string
  insights?: {
    keyMetrics?: any
    trends?: any
    recommendations?: string[]
  }
  modelUsed: string
  usagePoints: number
  metadata: {
    processingTime: number
    complexity: string
    confidence: number
  }
}

export async function analyzeBusinessQuery(query: AnalyticsQuery): Promise<AnalyticsResponse> {
  try {
    console.log('🔍 Analyzing business query:', query.query)
    
    const { data, error } = await supabase.functions.invoke('ai-analytics', {
      body: query
    })

    if (error) {
      console.error('Analytics service error:', error)
      throw new Error(`Analytics service error: ${error.message}`)
    }

    if (!data || !data.success) {
      throw new Error('Analytics service failed to process query')
    }

    console.log('✅ Analytics query successful:', {
      modelUsed: data.modelUsed,
      usagePoints: data.usagePoints,
      processingTime: data.metadata.processingTime
    })

    return data as AnalyticsResponse

  } catch (error) {
    console.error('Analytics query error:', error)
    throw error
  }
}

export async function getChatResponse(message: string, language: 'en' | 'de' = 'en'): Promise<string> {
  try {
    const query: AnalyticsQuery = {
      query: message,
      queryType: 'chat',
      context: { language },
      complexity: 'simple'
    }

    const response = await analyzeBusinessQuery(query)
    return response.response

  } catch (error) {
    console.error('Chat response error:', error)
    throw error
  }
}

export async function generateBusinessInsights(
  salesData: any[], 
  focusAreas: string[] = [],
  language: 'en' | 'de' = 'en'
): Promise<AnalyticsResponse> {
  try {
    const query: AnalyticsQuery = {
      query: `Analyze the sales data and provide business insights focusing on: ${focusAreas.join(', ')}`,
      queryType: 'business_intelligence',
      salesData,
      context: {
        metrics: focusAreas,
        language
      },
      complexity: 'complex'
    }

    return await analyzeBusinessQuery(query)

  } catch (error) {
    console.error('Business insights error:', error)
    throw error
  }
}

export async function getRecommendations(
  context: string,
  salesData?: any[],
  language: 'en' | 'de' = 'en'
): Promise<string[]> {
  try {
    const query: AnalyticsQuery = {
      query: `Provide specific actionable recommendations based on: ${context}`,
      queryType: 'recommendation',
      salesData,
      context: { language },
      complexity: 'medium'
    }

    const response = await analyzeBusinessQuery(query)
    return response.insights?.recommendations || [response.response]

  } catch (error) {
    console.error('Recommendations error:', error)
    throw error
  }
}