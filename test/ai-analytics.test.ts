import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock Supabase client first
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn()
    }
  }
}))

import { analyzeBusinessQuery, getChatResponse, generateBusinessInsights, getRecommendations } from '../src/integrations/deepseek/analytics'
import { processVoiceSalesInput, transcribeAudioOnly } from '../src/integrations/deepgram/voiceSales'
import { usagePointsManager } from '../src/lib/usagePoints'
import { contextManager } from '../src/lib/contextManagement'
import { supabase } from '../src/integrations/supabase/client'

describe('AI Analytics Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Model Routing Logic', () => {
    it('should route complex business intelligence queries to DeepSeek R1', async () => {
      supabase.functions.invoke.mockResolvedValue({
        data: {
          success: true,
          response: 'Detailed business analysis...',
          modelUsed: 'deepseek-r1',
          usagePoints: 10,
          metadata: {
            processingTime: 2500,
            complexity: 'complex',
            confidence: 92
          }
        },
        error: null
      })

      const result = await analyzeBusinessQuery({
        query: 'Analyze our sales trends and provide optimization recommendations',
        queryType: 'business_intelligence',
        salesData: [
          { date: '2024-01-01', amount: 150, category: 'breakfast' },
          { date: '2024-01-02', amount: 200, category: 'lunch' }
        ],
        complexity: 'complex'
      })

      expect(supabase.functions.invoke).toHaveBeenCalledWith('ai-analytics', {
        body: expect.objectContaining({
          query: expect.stringContaining('Analyze our sales trends'),
          queryType: 'business_intelligence',
          complexity: 'complex'
        })
      })

      expect(result.modelUsed).toBe('deepseek-r1')
      expect(result.usagePoints).toBe(10)
      expect(result.success).toBe(true)
    })

    it('should route simple chat queries to DeepSeek V3', async () => {
      supabase.functions.invoke.mockResolvedValue({
        data: {
          success: true,
          response: 'Hello! How can I help you today?',
          modelUsed: 'deepseek-v3',
          usagePoints: 5,
          metadata: {
            processingTime: 800,
            complexity: 'simple',
            confidence: 88
          }
        },
        error: null
      })

      const result = await getChatResponse('Hello, how are sales today?', 'en')

      expect(supabase.functions.invoke).toHaveBeenCalledWith('ai-analytics', {
        body: expect.objectContaining({
          query: 'Hello, how are sales today?',
          queryType: 'chat',
          complexity: 'simple'
        })
      })

      expect(result).toBe('Hello! How can I help you today?')
    })

    it('should handle API errors gracefully', async () => {
      supabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'API rate limit exceeded' }
      })

      await expect(analyzeBusinessQuery({
        query: 'Test query',
        queryType: 'chat'
      })).rejects.toThrow('Analytics service error: API rate limit exceeded')
    })
  })

  describe('Business Insights Generation', () => {
    it('should generate insights from sales data', async () => {
      const salesData = [
        { date: '2024-01-01', amount: 150, category: 'breakfast', items: 12 },
        { date: '2024-01-02', amount: 200, category: 'lunch', items: 15 },
        { date: '2024-01-03', amount: 180, category: 'breakfast', items: 14 }
      ]

      supabase.functions.invoke.mockResolvedValue({
        data: {
          success: true,
          response: 'Your breakfast category shows consistent performance...',
          insights: {
            keyMetrics: {
              averageOrder: 16.67,
              totalRevenue: 530
            },
            trends: ['Breakfast stable', 'Lunch growing'],
            recommendations: [
              'Focus on lunch expansion',
              'Optimize breakfast efficiency'
            ]
          },
          modelUsed: 'deepseek-r1',
          usagePoints: 10
        },
        error: null
      })

      const result = await generateBusinessInsights(
        salesData,
        ['revenue', 'trends', 'optimization'],
        'en'
      )

      expect(result.insights?.recommendations).toContain('Focus on lunch expansion')
      expect(result.modelUsed).toBe('deepseek-r1')
    })

    it('should handle empty sales data', async () => {
      supabase.functions.invoke.mockResolvedValue({
        data: {
          success: true,
          response: 'No data available for analysis',
          modelUsed: 'deepseek-v3',
          usagePoints: 5
        },
        error: null
      })

      const result = await generateBusinessInsights([], ['revenue'], 'en')
      expect(result.response).toContain('No data available')
    })
  })

  describe('Recommendations Engine', () => {
    it('should generate actionable recommendations', async () => {
      supabase.functions.invoke.mockResolvedValue({
        data: {
          success: true,
          response: 'Based on the analysis...',
          insights: {
            recommendations: [
              'Increase staff during lunch hours',
              'Add more breakfast variety',
              'Optimize inventory for popular items'
            ]
          },
          modelUsed: 'deepseek-r1',
          usagePoints: 8
        },
        error: null
      })

      const recommendations = await getRecommendations(
        'Low efficiency during peak hours',
        [{ hour: 12, efficiency: 65 }, { hour: 13, efficiency: 58 }],
        'en'
      )

      expect(recommendations).toHaveLength(3)
      expect(recommendations[0]).toContain('staff during lunch')
    })
  })

  describe('Voice Sales Integration', () => {
    it('should process voice input and extract sales data', async () => {
      supabase.functions.invoke.mockResolvedValue({
        data: {
          success: true,
          transcript: 'Heute haben wir 150 Euro Umsatz mit Frühstück gemacht',
          salesData: {
            amount: 150,
            currency: 'EUR',
            date: '2024-01-15',
            category: 'breakfast',
            confidence: 85,
            rawTranscript: 'Heute haben wir 150 Euro Umsatz mit Frühstück gemacht',
            parsedFields: [
              { field: 'amount', value: 150, confidence: 90 },
              { field: 'currency', value: 'EUR', confidence: 95 },
              { field: 'date', value: '2024-01-15', confidence: 80 },
              { field: 'category', value: 'breakfast', confidence: 75 }
            ]
          },
          usagePoints: 7,
          metadata: {
            processingTime: 1200,
            deepgramModel: 'nova-2',
            language: 'de'
          }
        },
        error: null
      })

      const result = await processVoiceSalesInput({
        audioData: 'base64encodedaudio',
        language: 'de',
        format: 'wav'
      })

      expect(result.success).toBe(true)
      expect(result.salesData.amount).toBe(150)
      expect(result.salesData.currency).toBe('EUR')
      expect(result.salesData.confidence).toBe(85)
    })

    it('should handle transcription-only requests', async () => {
      supabase.functions.invoke.mockResolvedValue({
        data: {
          success: true,
          transcript: 'We sold 200 euros worth of lunch items today',
          salesData: { confidence: 90, rawTranscript: 'We sold 200 euros worth of lunch items today', parsedFields: [] },
          usagePoints: 5
        },
        error: null
      })

      const transcript = await transcribeAudioOnly('base64audio', 'en')
      expect(transcript).toBe('We sold 200 euros worth of lunch items today')
    })

    it('should validate required audio input', async () => {
      await expect(processVoiceSalesInput({})).rejects.toThrow('Audio data or URL is required')
    })
  })
})

describe('Usage Points Management', () => {
  beforeEach(() => {
    // Clear storage
    localStorage.clear()
  })

  it('should record and track usage points', () => {
    const record = usagePointsManager.recordUsage(
      'deepseek-r1',
      'business-analysis',
      10,
      { tokens: 1500, processingTime: 2500 }
    )

    expect(record.service).toBe('deepseek-r1')
    expect(record.points).toBe(10)

    const stats = usagePointsManager.getUsageStats()
    expect(stats.dailyUsage).toBe(10)
    expect(stats.serviceBreakdown['deepseek-r1']).toBe(10)
  })

  it('should generate usage alerts when limits are approached', () => {
    // Set low limits for testing
    usagePointsManager.updateLimits({
      daily: 20,
      weekly: 100,
      monthly: 300,
      warningThreshold: 50,
      criticalThreshold: 80
    })

    // Record usage that triggers warning
    usagePointsManager.recordUsage('deepseek-r1', 'test', 12)

    const alerts = usagePointsManager.getUsageAlerts()
    expect(alerts).toHaveLength(1)
    expect(alerts[0].type).toBe('warning')
    expect(alerts[0].period).toBe('daily')
  })

  it('should prevent operations when limits would be exceeded', () => {
    usagePointsManager.updateLimits({ daily: 15 })
    usagePointsManager.recordUsage('deepseek-r1', 'test', 10)

    const canProceed = usagePointsManager.canPerformOperation(10)
    expect(canProceed.allowed).toBe(false)
    expect(canProceed.reason).toContain('Daily limit would be exceeded')
  })

  it('should estimate operation costs correctly', () => {
    const cost = usagePointsManager.estimateOperationCost(
      'deepseek-r1',
      'analysis',
      { tokens: 2000, duration: 120 }
    )

    expect(cost).toBeGreaterThan(10) // Base cost + tokens + duration
  })
})

describe('Context Management', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should create summaries for large datasets', async () => {
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      amount: Math.random() * 100,
      date: `2024-01-${String(i % 30 + 1).padStart(2, '0')}`,
      category: ['breakfast', 'lunch', 'dinner'][i % 3]
    }))

    const result = await contextManager.addDataset('test-folder', largeDataset, 'Sales Data')
    
    expect(result.needsSummarization).toBe(true)
    expect(result.summary).toBeDefined()
    expect(result.summary?.keyInsights.length).toBeGreaterThan(0)
  })

  it('should generate meaningful context for AI queries', async () => {
    const testData = [
      { amount: 150, date: '2024-01-01', category: 'breakfast' },
      { amount: 200, date: '2024-01-02', category: 'lunch' }
    ]

    await contextManager.addDataset('restaurant-sales', testData, 'Daily Sales')
    const context = contextManager.getFolderContext('restaurant-sales')

    expect(context).toContain('Historical Data Summary')
    expect(context).toContain('breakfast')
    expect(context).toContain('lunch')
  })

  it('should handle cleanup of old data', () => {
    // This would require mocking Date.now() to test properly
    // For now, just ensure cleanup runs without errors
    expect(() => contextManager.cleanup()).not.toThrow()
  })
})