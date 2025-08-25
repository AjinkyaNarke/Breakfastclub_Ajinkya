// AI Analytics Platform Types

export interface SalesDataEntry {
  id?: string
  date: string
  amount: number
  currency: string
  category: string
  description?: string
  items?: number
  location?: string
  staff?: string
  method?: 'cash' | 'card' | 'digital'
  created_at?: string
  updated_at?: string
}

export interface AnalyticsQuery {
  query: string
  queryType: 'business_intelligence' | 'chat' | 'recommendation' | 'analysis'
  salesData?: SalesDataEntry[]
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
    keyMetrics?: Record<string, any>
    trends?: Array<{
      metric: string
      direction: 'up' | 'down' | 'stable'
      change: number
      period: string
    }>
    recommendations?: string[]
    alerts?: Array<{
      type: 'warning' | 'critical' | 'info'
      message: string
      action?: string
    }>
  }
  modelUsed: string
  usagePoints: number
  metadata: {
    processingTime: number
    complexity: string
    confidence: number
  }
}

export interface VoiceSalesInput {
  audioData?: string
  audioUrl?: string
  language?: 'en' | 'de'
  format?: 'wav' | 'mp3' | 'webm'
  expectedFields?: string[]
  contextHints?: string[]
}

export interface ParsedSalesData {
  amount?: number
  currency?: string
  date?: string
  category?: string
  description?: string
  confidence: number
  rawTranscript: string
  parsedFields: Array<{
    field: string
    value: any
    confidence: number
  }>
}

export interface VoiceSalesResponse {
  success: boolean
  transcript: string
  salesData: ParsedSalesData
  usagePoints: number
  metadata: {
    processingTime: number
    deepgramModel: string
    language: string
  }
}

export interface BusinessMetrics {
  revenue: {
    total: number
    daily: number
    weekly: number
    monthly: number
    currency: string
  }
  profitability: {
    grossMargin: number
    netMargin: number
    averageOrderValue: number
    costPerSale: number
  }
  trends: {
    revenueGrowth: number
    customerGrowth: number
    seasonalFactors: Record<string, number>
  }
  categories: Record<string, {
    revenue: number
    count: number
    avgValue: number
    growth: number
  }>
}

export interface UsageRecord {
  id: string
  service: 'deepseek-r1' | 'deepseek-v3' | 'deepgram' | 'analytics' | 'voice-sales'
  operation: string
  points: number
  timestamp: string
  metadata?: {
    modelUsed?: string
    processingTime?: number
    tokens?: number
    duration?: number
  }
}

export interface UsageStats {
  totalPoints: number
  dailyUsage: number
  weeklyUsage: number
  monthlyUsage: number
  serviceBreakdown: Record<string, number>
  recentUsage: UsageRecord[]
}

export interface UsageLimits {
  daily: number
  weekly: number
  monthly: number
  warningThreshold: number
  criticalThreshold: number
}

export interface UsageAlert {
  type: 'warning' | 'critical' | 'exceeded'
  period: 'daily' | 'weekly' | 'monthly'
  message: string
  currentUsage: number
  limit: number
  suggestedAction?: string
}

export interface DataSummary {
  id: string
  originalSize: number
  summarySize: number
  compressionRatio: number
  keyInsights: string[]
  timeRange: {
    start: string
    end: string
  }
  createdAt: string
  lastAccessed: string
}

export interface ContextFolder {
  id: string
  name: string
  summaries: DataSummary[]
  totalOriginalSize: number
  totalSummarySize: number
  createdAt: string
  lastModified: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  metadata?: {
    queryType?: string
    modelUsed?: string
    usagePoints?: number
    insights?: AnalyticsResponse['insights']
  }
}

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  created_at: string
  updated_at: string
  language: 'en' | 'de'
}

export interface ReportConfig {
  id: string
  name: string
  type: 'executive' | 'operational' | 'financial' | 'custom'
  metrics: string[]
  timeframe: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  format: 'pdf' | 'email' | 'dashboard'
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly'
    time: string
    recipients: string[]
  }
}

export interface GeneratedReport {
  id: string
  configId: string
  title: string
  content: string
  insights: AnalyticsResponse['insights']
  generatedAt: string
  dataRange: {
    start: string
    end: string
  }
  shareableLink?: string
  downloadUrl?: string
}

// Event types for real-time updates
export interface AnalyticsEvent {
  type: 'usage-warning' | 'usage-critical' | 'usage-exceeded' | 'new-insight' | 'report-generated'
  timestamp: string
  data: any
}

// API Response wrappers
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Component Props Types
export interface AnalyticsDashboardProps {
  initialData?: SalesDataEntry[]
  language?: 'en' | 'de'
  onDataUpdate?: (data: SalesDataEntry[]) => void
}

export interface ChatInterfaceProps {
  sessionId?: string
  language?: 'en' | 'de'
  initialMessage?: string
  onMessageSent?: (message: ChatMessage) => void
}

export interface VoiceInputProps {
  onTranscript?: (transcript: string) => void
  onSalesData?: (data: ParsedSalesData) => void
  language?: 'en' | 'de'
  expectedFields?: string[]
}

export interface UsageMonitorProps {
  showDetails?: boolean
  alertThreshold?: number
  onLimitExceeded?: (alert: UsageAlert) => void
}

// Configuration Types
export interface AnalyticsConfig {
  defaultLanguage: 'en' | 'de'
  usageLimits: UsageLimits
  modelPreferences: {
    chatModel: 'deepseek-v3'
    analyticsModel: 'deepseek-r1'
    voiceModel: 'deepgram-nova-2'
  }
  dataRetention: {
    rawDataDays: number
    summaryDataDays: number
    usageDataDays: number
  }
  features: {
    voiceInput: boolean
    realTimeAnalytics: boolean
    exportReports: boolean
    sharingEnabled: boolean
  }
}