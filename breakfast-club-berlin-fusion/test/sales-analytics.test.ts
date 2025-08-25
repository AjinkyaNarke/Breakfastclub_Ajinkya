import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  querySalesData, 
  createSalesEntry, 
  createSalesEntriesBatch,
  updateSalesEntry,
  deleteSalesEntry,
  getSalesCategories,
  voiceSalesDataToEntry,
  validateSalesData,
  getSalesStatistics
} from '../src/integrations/supabase/salesData'
import {
  analyzeProfitability,
  analyzeTrends,
  analyzeCategoryPerformance,
  getPerformanceOverview,
  generateForecast,
  getWeekOverWeekComparison,
  generatePerformanceAlerts
} from '../src/integrations/supabase/analyticsEngine'
import {
  generateExecutiveReport,
  generateOperationalReport,
  generateFinancialReport,
  generateBusinessHealthReport
} from '../src/integrations/supabase/analyticsReports'

// Mock Supabase client
const mockSupabase = {
  functions: {
    invoke: vi.fn()
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          data: [],
          error: null
        }))
      }))
    }))
  })),
  rpc: vi.fn()
}

vi.mock('../src/integrations/supabase/client', () => ({
  supabase: mockSupabase
}))

describe('Sales Data Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Sales Data CRUD Operations', () => {
    it('should query sales data with filters', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: {
          success: true,
          data: [
            {
              id: '1',
              date: '2024-01-15',
              amount: 150.50,
              currency: 'EUR',
              category: 'breakfast',
              description: 'Morning sales',
              validation_status: 'valid'
            }
          ],
          pagination: {
            offset: 0,
            limit: 100,
            total: 1,
            hasMore: false
          }
        },
        error: null
      })

      const result = await querySalesData({
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
        categories: ['breakfast'],
        minAmount: 100
      })

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('sales-data-crud', {
        method: 'GET',
        body: null,
        headers: {
          'Content-Type': 'application/json'
        }
      })

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data[0].amount).toBe(150.50)
    })

    it('should create a sales entry with validation', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: {
          success: true,
          data: {
            id: '1',
            date: '2024-01-15',
            amount: 75.25,
            currency: 'EUR',
            category: 'lunch',
            validation_status: 'valid'
          },
          validation: {
            valid: true,
            warnings: [],
            errors: []
          }
        },
        error: null
      })

      const result = await createSalesEntry({
        date: '2024-01-15',
        amount: 75.25,
        currency: 'EUR',
        category: 'lunch',
        description: 'Lunch sales'
      })

      expect(result.success).toBe(true)
      expect(result.data.validation_status).toBe('valid')
      expect(result.validation.valid).toBe(true)
    })

    it('should handle batch creation with mixed validation results', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: {
          success: true,
          data: [
            { id: '1', validation_status: 'valid' },
            { id: '2', validation_status: 'review_required' }
          ],
          validationResults: [
            { entry: {}, valid: true, warnings: [], errors: [] },
            { entry: {}, valid: false, warnings: ['High amount'], errors: [] }
          ],
          inserted: 2,
          total: 2
        },
        error: null
      })

      const entries = [
        { date: '2024-01-15', amount: 50, currency: 'EUR', category: 'breakfast' },
        { date: '2024-01-15', amount: 500, currency: 'EUR', category: 'catering' }
      ]

      const result = await createSalesEntriesBatch(entries, { validate: true })

      expect(result.success).toBe(true)
      expect(result.inserted).toBe(2)
      expect(result.validationResults).toHaveLength(2)
    })

    it('should update sales entry with validation', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: {
          success: true,
          data: {
            id: '1',
            amount: 80.00,
            validation_status: 'valid'
          },
          validation: {
            valid: true,
            warnings: [],
            errors: []
          }
        },
        error: null
      })

      const result = await updateSalesEntry('1', { amount: 80.00 })

      expect(result.success).toBe(true)
      expect(result.data.amount).toBe(80.00)
    })

    it('should delete sales entry', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: {
          success: true,
          message: 'Sales entry deleted successfully'
        },
        error: null
      })

      const result = await deleteSalesEntry('1')

      expect(result.success).toBe(true)
      expect(result.message).toContain('deleted successfully')
    })

    it('should get sales categories', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [
                {
                  name: 'breakfast',
                  name_de: 'Frühstück',
                  name_en: 'Breakfast',
                  description: 'Morning meals',
                  color: '#FF6B6B'
                }
              ],
              error: null
            })
          })
        })
      })

      const categories = await getSalesCategories()

      expect(categories).toHaveLength(1)
      expect(categories[0].name).toBe('breakfast')
    })
  })

  describe('Voice Sales Data Conversion', () => {
    it('should convert voice sales data to entry format', () => {
      const voiceData = {
        amount: 125.50,
        currency: 'EUR',
        date: '2024-01-15',
        category: 'lunch',
        description: 'Voice input sales',
        confidence: 85,
        rawTranscript: 'Heute haben wir 125 Euro 50 Cent Umsatz mit Mittagessen gemacht',
        parsedFields: [
          { field: 'amount', value: 125.50, confidence: 90 },
          { field: 'currency', value: 'EUR', confidence: 95 },
          { field: 'date', value: '2024-01-15', confidence: 80 }
        ]
      }

      const entry = voiceSalesDataToEntry(voiceData, { staff: 'John Doe' })

      expect(entry.amount).toBe(125.50)
      expect(entry.source).toBe('voice')
      expect(entry.confidence_score).toBe(85)
      expect(entry.staff).toBe('John Doe')
      expect(entry.validation_status).toBe('valid') // 85% confidence
    })

    it('should set review_required for low confidence voice data', () => {
      const voiceData = {
        amount: 50,
        currency: 'EUR',
        confidence: 65, // Low confidence
        rawTranscript: 'unclear audio',
        parsedFields: [
          { field: 'amount', value: 50, confidence: 65 }
        ]
      }

      const entry = voiceSalesDataToEntry(voiceData)

      expect(entry.validation_status).toBe('review_required')
    })
  })

  describe('Sales Data Validation', () => {
    it('should validate sales data using database function', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: {
          valid: true,
          warnings: ['Amount is unusually high'],
          errors: []
        },
        error: null
      })

      const result = await validateSalesData({
        date: '2024-01-15',
        amount: 800,
        category: 'catering'
      })

      expect(result.valid).toBe(true)
      expect(result.warnings).toContain('Amount is unusually high')
    })
  })

  describe('Sales Statistics', () => {
    it('should calculate comprehensive sales statistics', async () => {
      // Mock query response
      mockSupabase.functions.invoke.mockResolvedValue({
        data: {
          success: true,
          data: [
            { date: '2024-01-15', amount: 150, category: 'breakfast' },
            { date: '2024-01-15', amount: 200, category: 'lunch' },
            { date: '2024-01-16', amount: 180, category: 'breakfast' }
          ],
          pagination: { total: 3, hasMore: false }
        },
        error: null
      })

      const stats = await getSalesStatistics('2024-01-15', '2024-01-16')

      expect(stats.totalAmount).toBe(530)
      expect(stats.totalEntries).toBe(3)
      expect(stats.averageAmount).toBe(530 / 3)
      expect(stats.categoryBreakdown.breakfast.amount).toBe(330)
      expect(stats.dailyTotals).toHaveLength(2)
    })
  })
})

describe('Analytics Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Profitability Analysis', () => {
    it('should analyze profitability with cost data', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: {
          success: true,
          data: {
            totalRevenue: 5000,
            totalCost: 3000,
            grossProfit: 2000,
            grossMargin: 40,
            netProfit: 1500,
            netMargin: 30,
            averageOrderValue: 25,
            totalTransactions: 200,
            costBreakdown: {
              fixedCosts: 1000,
              variableCosts: 1500,
              categorySpecificCosts: { breakfast: 800, lunch: 700 }
            },
            profitabilityByCategory: {
              breakfast: { revenue: 2500, cost: 1500, profit: 1000, margin: 40, transactions: 100 },
              lunch: { revenue: 2500, cost: 1500, profit: 1000, margin: 40, transactions: 100 }
            }
          }
        },
        error: null
      })

      const result = await analyzeProfitability('2024-01-01', '2024-01-31', {
        costData: {
          fixedCosts: 3000,
          variableCostRatio: 0.3
        }
      })

      expect(result.totalRevenue).toBe(5000)
      expect(result.grossMargin).toBe(40)
      expect(result.profitabilityByCategory.breakfast.margin).toBe(40)
    })

    it('should provide week-over-week comparison', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: {
          success: true,
          data: {
            current: {
              totalRevenue: 1200,
              grossProfit: 480,
              grossMargin: 40,
              totalTransactions: 48
            },
            comparison: {
              totalRevenue: 1000,
              grossProfit: 400,
              grossMargin: 40,
              totalTransactions: 40
            },
            changes: {
              revenueChange: 20,
              profitChange: 20,
              marginChange: 0,
              transactionChange: 20,
              aovChange: 0
            },
            insights: [
              'Revenue increased significantly by 20.0%',
              'Transaction volume grew consistently'
            ]
          }
        },
        error: null
      })

      const result = await getWeekOverWeekComparison('2024-01-15')

      expect(result.changes.revenueChange).toBe(20)
      expect(result.insights).toContain('Revenue increased significantly by 20.0%')
    })
  })

  describe('Trend Analysis', () => {
    it('should analyze trends with different granularities', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: {
          success: true,
          data: [
            {
              period: '2024-01-15',
              revenue: 250,
              transactions: 10,
              averageOrderValue: 25,
              growthRate: 5.2,
              seasonalIndex: 1.1,
              trendDirection: 'up'
            },
            {
              period: '2024-01-16',
              revenue: 280,
              transactions: 12,
              averageOrderValue: 23.33,
              growthRate: 12.0,
              seasonalIndex: 1.2,
              trendDirection: 'up'
            }
          ]
        },
        error: null
      })

      const result = await analyzeTrends('2024-01-15', '2024-01-16', {
        granularity: 'daily'
      })

      expect(result).toHaveLength(2)
      expect(result[0].trendDirection).toBe('up')
      expect(result[1].growthRate).toBe(12.0)
    })
  })

  describe('Category Performance', () => {
    it('should analyze category performance with market share', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: {
          success: true,
          data: {
            categories: {
              breakfast: {
                revenue: 1500,
                transactions: 60,
                averageOrderValue: 25,
                revenueShare: 50,
                transactionShare: 50
              },
              lunch: {
                revenue: 1500,
                transactions: 60,
                averageOrderValue: 25,
                revenueShare: 50,
                transactionShare: 50
              }
            },
            summary: {
              totalCategories: 2,
              topPerformerByRevenue: 'breakfast',
              topPerformerByTransactions: 'breakfast'
            }
          }
        },
        error: null
      })

      const result = await analyzeCategoryPerformance('2024-01-01', '2024-01-31')

      expect(result.summary.totalCategories).toBe(2)
      expect(result.categories.breakfast.revenueShare).toBe(50)
    })
  })

  describe('Performance Overview', () => {
    it('should provide comprehensive performance overview', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: {
          success: true,
          data: {
            profitability: { totalRevenue: 5000, grossMargin: 40 },
            trends: [{ trendDirection: 'up' }],
            categories: { summary: { topPerformerByRevenue: 'breakfast' } },
            keyMetrics: {
              totalRevenue: 5000,
              totalTransactions: 200,
              averageOrderValue: 25,
              grossMargin: 40,
              trendDirection: 'up',
              topCategory: 'breakfast'
            }
          }
        },
        error: null
      })

      const result = await getPerformanceOverview('2024-01-01', '2024-01-31')

      expect(result.keyMetrics.totalRevenue).toBe(5000)
      expect(result.keyMetrics.trendDirection).toBe('up')
    })
  })

  describe('Forecasting', () => {
    it('should generate revenue forecast with confidence intervals', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: {
          success: true,
          data: {
            historicalTrends: [
              { period: '2024-01-15', revenue: 250, trendDirection: 'up' }
            ],
            forecast: [
              { period: '2024-01-17', predictedRevenue: 260, confidence: 0.9 },
              { period: '2024-01-18', predictedRevenue: 270, confidence: 0.8 }
            ],
            insights: [
              'Strong upward trend expected to continue',
              'Forecast suggests growth of 8.0% over next period'
            ]
          }
        },
        error: null
      })

      const result = await generateForecast('2024-01-01', '2024-01-16')

      expect(result.forecast).toHaveLength(2)
      expect(result.forecast[0].confidence).toBe(0.9)
      expect(result.insights).toContain('Strong upward trend expected to continue')
    })
  })

  describe('Performance Alerts', () => {
    it('should generate performance alerts based on thresholds', () => {
      const metrics = {
        grossMargin: 25, // Below 40% threshold
        netMargin: 8,    // Below 15% threshold
        totalRevenue: 3000
      }

      const alerts = generatePerformanceAlerts(metrics, {
        minGrossMargin: 40,
        minNetMargin: 15,
        minDailyRevenue: 200
      })

      expect(alerts).toHaveLength(2)
      expect(alerts[0].type).toBe('warning')
      expect(alerts[0].metric).toBe('grossMargin')
      expect(alerts[1].metric).toBe('netMargin')
    })
  })
})

describe('Analytics Reports', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Executive Reports', () => {
    it('should generate executive report with AI insights', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: {
          success: true,
          data: {
            summary: {
              totalRevenue: 5000,
              totalProfit: 2000,
              grossMargin: 40,
              totalTransactions: 200,
              averageOrderValue: 25
            },
            keyMetrics: {
              topPerformingCategory: 'breakfast',
              worstPerformingCategory: 'snacks',
              busyDay: '2024-01-20',
              quietDay: '2024-01-18',
              trendDirection: 'up'
            },
            aiInsights: [
              'Revenue growth accelerating in breakfast category',
              'Weekend performance consistently outperforming weekdays'
            ],
            recommendations: [
              'Focus marketing efforts on breakfast offerings',
              'Consider extending breakfast hours on weekends'
            ],
            alerts: [
              {
                type: 'warning',
                message: 'Snacks category showing declining margins',
                metric: 'categoryMargin',
                impact: 'medium'
              }
            ]
          }
        },
        error: null
      })

      const result = await generateExecutiveReport('2024-01-01', '2024-01-31', {
        language: 'en',
        includeAIInsights: true
      })

      expect(result.summary.totalRevenue).toBe(5000)
      expect(result.aiInsights).toHaveLength(2)
      expect(result.recommendations).toHaveLength(2)
      expect(result.alerts).toHaveLength(1)
    })
  })

  describe('Operational Reports', () => {
    it('should generate operational report with data quality metrics', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: {
          success: true,
          data: {
            period: { from: '2024-01-01', to: '2024-01-31' },
            operationalMetrics: {
              dailyAverages: {
                revenue: 161.29,
                transactions: 6.45,
                orderValue: 25
              },
              peakPerformance: {
                bestDay: { period: '2024-01-20', revenue: 300 },
                worstDay: { period: '2024-01-18', revenue: 100 }
              },
              dataQuality: {
                totalEntries: 200,
                validEntries: 185,
                voiceEntries: 45,
                flaggedEntries: 15
              },
              trends: [
                { date: '2024-01-01', revenue: 150, transactions: 6, growth: 0, trend: 'stable' }
              ]
            },
            recommendations: [
              'Review flagged entries for data quality improvement',
              'Investigate factors causing revenue variance'
            ]
          }
        },
        error: null
      })

      const result = await generateOperationalReport('2024-01-01', '2024-01-31')

      expect(result.operationalMetrics.dataQuality.validEntries).toBe(185)
      expect(result.operationalMetrics.dataQuality.flaggedEntries).toBe(15)
      expect(result.recommendations).toHaveLength(2)
    })
  })

  describe('Financial Reports', () => {
    it('should generate financial report with risk assessment', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: {
          success: true,
          data: {
            revenue: { total: 5000, growth: 12.5 },
            profitability: {
              grossProfit: 2000,
              grossMargin: 40,
              netProfit: 1500,
              netMargin: 30
            },
            costs: {
              fixedCosts: 1000,
              variableCosts: 2000,
              categorySpecificCosts: { breakfast: 800, lunch: 1200 }
            },
            categoryProfitability: {
              breakfast: { revenue: 2500, cost: 1500, profit: 1000, margin: 40 },
              lunch: { revenue: 2500, cost: 1500, profit: 1000, margin: 40 }
            },
            financialHealth: {
              profitabilityScore: 75,
              riskLevel: 'low',
              recommendations: ['Maintain current cost structure', 'Consider expansion opportunities']
            }
          }
        },
        error: null
      })

      const result = await generateFinancialReport('2024-01-01', '2024-01-31')

      expect(result.profitability.grossMargin).toBe(40)
      expect(result.financialHealth.riskLevel).toBe('low')
      expect(result.financialHealth.profitabilityScore).toBe(75)
    })
  })

  describe('Business Health Report', () => {
    it('should generate comprehensive business health assessment', async () => {
      // Mock all three report types
      mockSupabase.functions.invoke
        .mockResolvedValueOnce({
          data: {
            success: true,
            data: {
              summary: { totalRevenue: 5000, grossMargin: 40 },
              keyMetrics: { trendDirection: 'up' },
              aiInsights: ['Strong performance'],
              recommendations: ['Continue current strategy'],
              alerts: [{ type: 'info', impact: 'low' }]
            }
          }
        })
        .mockResolvedValueOnce({
          data: {
            success: true,
            data: {
              operationalMetrics: {
                dataQuality: { totalEntries: 200, validEntries: 190 }
              },
              recommendations: ['Improve data quality']
            }
          }
        })
        .mockResolvedValueOnce({
          data: {
            success: true,
            data: {
              financialHealth: {
                riskLevel: 'low',
                recommendations: ['Maintain growth']
              }
            }
          }
        })

      const result = await generateBusinessHealthReport('2024-01-01', '2024-01-31', 'en')

      expect(result.healthScore).toBeGreaterThan(90) // Good health score
      expect(result.criticalAlerts).toHaveLength(0) // No critical alerts
      expect(result.recommendations).toContain('Continue current strategy')
    })
  })
})

describe('Integration Tests', () => {
  it('should handle end-to-end analytics workflow', async () => {
    // Mock the full workflow: sales data -> analytics -> reports
    
    // 1. Create sales data
    mockSupabase.functions.invoke.mockResolvedValueOnce({
      data: {
        success: true,
        data: { id: '1', amount: 150, validation_status: 'valid' }
      }
    })

    const salesEntry = await createSalesEntry({
      date: '2024-01-15',
      amount: 150,
      currency: 'EUR',
      category: 'breakfast'
    })

    expect(salesEntry.success).toBe(true)

    // 2. Analyze profitability
    mockSupabase.functions.invoke.mockResolvedValueOnce({
      data: {
        success: true,
        data: { totalRevenue: 150, grossMargin: 60 }
      }
    })

    const analytics = await analyzeProfitability('2024-01-15', '2024-01-15')
    expect(analytics.totalRevenue).toBe(150)

    // 3. Generate executive report
    mockSupabase.functions.invoke.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          summary: { totalRevenue: 150 },
          keyMetrics: { trendDirection: 'stable' },
          aiInsights: ['Single day analysis'],
          recommendations: ['Gather more data'],
          alerts: []
        }
      }
    })

    const report = await generateExecutiveReport('2024-01-15', '2024-01-15')
    expect(report.summary.totalRevenue).toBe(150)
  })

  it('should handle error scenarios gracefully', async () => {
    mockSupabase.functions.invoke.mockResolvedValue({
      data: { success: false, error: 'Database connection failed' },
      error: null
    })

    await expect(createSalesEntry({
      date: '2024-01-15',
      amount: 100,
      currency: 'EUR',
      category: 'breakfast'
    })).rejects.toThrow('Failed to create sales entry')
  })
})