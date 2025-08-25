import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalyticsRequest {
  query: string;
  queryType: 'business_intelligence' | 'chat' | 'recommendation' | 'analysis';
  salesData?: any[];
  context?: {
    timeframe?: string;
    metrics?: string[];
    language?: 'en' | 'de';
  };
  complexity?: 'simple' | 'medium' | 'complex';
}

interface ModelRouting {
  model: 'deepseek-r1' | 'deepseek-v3';
  reasoning: string;
  confidence: number;
}

interface AnalyticsResponse {
  success: boolean;
  response: string;
  insights?: {
    keyMetrics?: any;
    trends?: any;
    recommendations?: string[];
  };
  modelUsed: string;
  usagePoints: number;
  metadata: {
    processingTime: number;
    complexity: string;
    confidence: number;
  };
}

const USAGE_POINTS = {
  'deepseek-r1': 10, // Higher cost for reasoning model
  'deepseek-v3': 5,  // Lower cost for chat model
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestData: AnalyticsRequest = await req.json()
    
    if (!requestData.query) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY')
    if (!DEEPSEEK_API_KEY) {
      throw new Error('DeepSeek API key not configured')
    }

    const startTime = Date.now()

    // Intelligent model routing
    const routing = determineModelRouting(requestData)
    
    // Generate appropriate response based on model and query type
    const response = await generateAnalyticsResponse(requestData, routing, DEEPSEEK_API_KEY)
    
    const processingTime = Date.now() - startTime

    return new Response(
      JSON.stringify({
        ...response,
        modelUsed: routing.model,
        usagePoints: USAGE_POINTS[routing.model],
        metadata: {
          processingTime,
          complexity: requestData.complexity || 'medium',
          confidence: routing.confidence
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('AI Analytics error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        modelUsed: 'none',
        usagePoints: 0
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

function determineModelRouting(request: AnalyticsRequest): ModelRouting {
  const { query, queryType, salesData, complexity } = request
  
  // Analyze query complexity and requirements
  let complexityScore = 0
  let reasoningRequired = false
  
  // Check for complex analytical requirements
  const complexKeywords = [
    'analyze', 'compare', 'trend', 'correlation', 'optimization', 'forecast',
    'recommendation', 'strategy', 'profitability', 'margin', 'growth',
    'seasonal', 'performance', 'efficiency', 'cost-benefit'
  ]
  
  const chatKeywords = [
    'hello', 'hi', 'help', 'how', 'what', 'show', 'display', 'list',
    'tell me', 'explain', 'describe'
  ]

  // Score based on keywords
  complexKeywords.forEach(keyword => {
    if (query.toLowerCase().includes(keyword)) {
      complexityScore += 2
      reasoningRequired = true
    }
  })

  chatKeywords.forEach(keyword => {
    if (query.toLowerCase().includes(keyword)) {
      complexityScore -= 1
    }
  })

  // Factor in query type
  switch (queryType) {
    case 'business_intelligence':
    case 'analysis':
      complexityScore += 3
      reasoningRequired = true
      break
    case 'recommendation':
      complexityScore += 2
      reasoningRequired = true
      break
    case 'chat':
      complexityScore -= 1
      break
  }

  // Factor in data complexity
  if (salesData && salesData.length > 0) {
    complexityScore += Math.min(salesData.length / 10, 3)
    reasoningRequired = true
  }

  // Override complexity if provided
  if (complexity) {
    switch (complexity) {
      case 'simple':
        complexityScore = Math.min(complexityScore, 2)
        break
      case 'complex':
        complexityScore += 3
        reasoningRequired = true
        break
    }
  }

  // Determine model
  if (complexityScore >= 5 || reasoningRequired) {
    return {
      model: 'deepseek-r1',
      reasoning: 'Complex analytical query requiring advanced reasoning capabilities',
      confidence: Math.min(95, 70 + complexityScore * 3)
    }
  } else {
    return {
      model: 'deepseek-v3',
      reasoning: 'Simple conversational query suitable for chat model',
      confidence: Math.min(90, 60 + (10 - complexityScore) * 5)
    }
  }
}

async function generateAnalyticsResponse(
  request: AnalyticsRequest, 
  routing: ModelRouting, 
  apiKey: string
): Promise<AnalyticsResponse> {
  
  const systemPrompt = routing.model === 'deepseek-r1' 
    ? createBusinessAnalystPrompt(request)
    : createChatAssistantPrompt(request)

  const userPrompt = createUserPrompt(request)

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: routing.model === 'deepseek-r1' ? 'deepseek-reasoner' : 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: routing.model === 'deepseek-r1' ? 0.1 : 0.3,
      max_tokens: routing.model === 'deepseek-r1' ? 4000 : 2000,
      top_p: 0.95,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`DeepSeek API error: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('No response content received from DeepSeek')
  }

  // Parse insights if using R1 model
  let insights = undefined
  if (routing.model === 'deepseek-r1') {
    insights = extractInsights(content, request)
  }

  return {
    success: true,
    response: content,
    insights,
    modelUsed: routing.model,
    usagePoints: USAGE_POINTS[routing.model]
  }
}

function createBusinessAnalystPrompt(request: AnalyticsRequest): string {
  const language = request.context?.language || 'en'
  
  return `You are an expert business analyst and restaurant industry consultant with deep expertise in:
- Restaurant operations and financial analysis
- Sales data interpretation and trend analysis
- Profitability optimization and cost management  
- Market analysis and competitive intelligence
- Operational efficiency and performance metrics
- Customer behavior analysis and segmentation

Your role is to provide data-driven insights, actionable recommendations, and strategic analysis for restaurant businesses.

ANALYSIS CAPABILITIES:
- Financial performance analysis (revenue, costs, margins, profitability)
- Sales trend analysis and forecasting
- Menu optimization and pricing strategies
- Cost structure analysis and efficiency improvements
- Seasonal pattern recognition and planning
- Competitive positioning and market analysis
- Customer analytics and behavior insights
- Operational KPI monitoring and improvement

RESPONSE FORMAT:
Provide comprehensive analysis including:
1. Key findings and insights
2. Data-driven recommendations
3. Risk assessment and mitigation strategies
4. Implementation priorities and timelines
5. Expected business impact and ROI

Use ${language === 'de' ? 'German' : 'English'} language for responses.
Always support recommendations with data and reasoning.
Focus on actionable insights that drive business value.`
}

function createChatAssistantPrompt(request: AnalyticsRequest): string {
  const language = request.context?.language || 'en'
  
  return `You are a friendly and knowledgeable restaurant business assistant. You help restaurant owners and managers with:
- Understanding their business data and metrics
- Answering questions about sales, costs, and performance
- Providing practical advice and suggestions
- Explaining business concepts in simple terms
- Helping navigate restaurant management challenges

COMMUNICATION STYLE:
- Conversational and approachable
- Clear and easy to understand
- Practical and actionable
- Supportive and encouraging
- Professional but friendly

Respond in ${language === 'de' ? 'German' : 'English'}.
Keep responses concise but helpful.
Always aim to provide value and practical insights.`
}

function createUserPrompt(request: AnalyticsRequest): string {
  let prompt = `Query: ${request.query}\n`
  
  if (request.salesData && request.salesData.length > 0) {
    prompt += `\nSales Data Context:\n${JSON.stringify(request.salesData.slice(0, 10), null, 2)}\n`
    if (request.salesData.length > 10) {
      prompt += `\n(Showing first 10 entries of ${request.salesData.length} total records)\n`
    }
  }
  
  if (request.context) {
    prompt += `\nAdditional Context:\n`
    if (request.context.timeframe) prompt += `- Timeframe: ${request.context.timeframe}\n`
    if (request.context.metrics) prompt += `- Focus Metrics: ${request.context.metrics.join(', ')}\n`
  }
  
  prompt += `\nQuery Type: ${request.queryType}\n`
  
  return prompt
}

function extractInsights(content: string, request: AnalyticsRequest): any {
  // Basic insight extraction - in production, this could be more sophisticated
  const insights: any = {
    keyMetrics: {},
    trends: [],
    recommendations: []
  }
  
  // Extract recommendations from content
  const recommendationMatches = content.match(/(?:recommend|suggest|advise).*?[.!]/gi)
  if (recommendationMatches) {
    insights.recommendations = recommendationMatches.slice(0, 5)
  }
  
  // Extract numeric insights
  const numberMatches = content.match(/\d+(?:\.\d+)?%?/g)
  if (numberMatches) {
    insights.keyMetrics.extractedNumbers = numberMatches.slice(0, 10)
  }
  
  return insights
}