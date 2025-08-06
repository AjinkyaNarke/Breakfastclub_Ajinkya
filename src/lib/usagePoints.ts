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
  warningThreshold: number // Percentage of limit to trigger warning
  criticalThreshold: number // Percentage of limit to trigger critical alert
}

class UsagePointsManager {
  private records: UsageRecord[] = []
  private limits: UsageLimits = {
    daily: 1000,
    weekly: 5000,
    monthly: 15000,
    warningThreshold: 80,
    criticalThreshold: 95
  }

  constructor() {
    this.loadFromStorage()
    this.cleanup()
  }

  /**
   * Record usage points for a service operation
   */
  recordUsage(
    service: UsageRecord['service'],
    operation: string,
    points: number,
    metadata?: UsageRecord['metadata']
  ): UsageRecord {
    const record: UsageRecord = {
      id: this.generateId(),
      service,
      operation,
      points,
      timestamp: new Date().toISOString(),
      metadata
    }

    this.records.push(record)
    this.saveToStorage()

    console.log(`📊 Usage recorded: ${service}/${operation} - ${points} points`)

    // Check limits
    this.checkLimits()

    return record
  }

  /**
   * Get current usage statistics
   */
  getUsageStats(): UsageStats {
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const dailyRecords = this.records.filter(r => new Date(r.timestamp) > oneDayAgo)
    const weeklyRecords = this.records.filter(r => new Date(r.timestamp) > oneWeekAgo)
    const monthlyRecords = this.records.filter(r => new Date(r.timestamp) > oneMonthAgo)

    const serviceBreakdown: Record<string, number> = {}
    monthlyRecords.forEach(record => {
      serviceBreakdown[record.service] = (serviceBreakdown[record.service] || 0) + record.points
    })

    return {
      totalPoints: this.records.reduce((sum, r) => sum + r.points, 0),
      dailyUsage: dailyRecords.reduce((sum, r) => sum + r.points, 0),
      weeklyUsage: weeklyRecords.reduce((sum, r) => sum + r.points, 0),
      monthlyUsage: monthlyRecords.reduce((sum, r) => sum + r.points, 0),
      serviceBreakdown,
      recentUsage: this.records.slice(-20) // Last 20 operations
    }
  }

  /**
   * Get usage warnings and alerts
   */
  getUsageAlerts(): {
    type: 'warning' | 'critical' | 'exceeded'
    period: 'daily' | 'weekly' | 'monthly'
    message: string
    currentUsage: number
    limit: number
  }[] {
    const stats = this.getUsageStats()
    const alerts: any[] = []

    // Check daily limits
    const dailyPercentage = (stats.dailyUsage / this.limits.daily) * 100
    if (dailyPercentage >= this.limits.criticalThreshold) {
      alerts.push({
        type: dailyPercentage >= 100 ? 'exceeded' : 'critical',
        period: 'daily',
        message: `Daily usage ${dailyPercentage >= 100 ? 'exceeded' : 'critical'}: ${stats.dailyUsage}/${this.limits.daily} points`,
        currentUsage: stats.dailyUsage,
        limit: this.limits.daily
      })
    } else if (dailyPercentage >= this.limits.warningThreshold) {
      alerts.push({
        type: 'warning',
        period: 'daily',
        message: `Daily usage warning: ${stats.dailyUsage}/${this.limits.daily} points (${dailyPercentage.toFixed(1)}%)`,
        currentUsage: stats.dailyUsage,
        limit: this.limits.daily
      })
    }

    // Check weekly limits
    const weeklyPercentage = (stats.weeklyUsage / this.limits.weekly) * 100
    if (weeklyPercentage >= this.limits.criticalThreshold) {
      alerts.push({
        type: weeklyPercentage >= 100 ? 'exceeded' : 'critical',
        period: 'weekly',
        message: `Weekly usage ${weeklyPercentage >= 100 ? 'exceeded' : 'critical'}: ${stats.weeklyUsage}/${this.limits.weekly} points`,
        currentUsage: stats.weeklyUsage,
        limit: this.limits.weekly
      })
    } else if (weeklyPercentage >= this.limits.warningThreshold) {
      alerts.push({
        type: 'warning',
        period: 'weekly',
        message: `Weekly usage warning: ${stats.weeklyUsage}/${this.limits.weekly} points (${weeklyPercentage.toFixed(1)}%)`,
        currentUsage: stats.weeklyUsage,
        limit: this.limits.weekly
      })
    }

    // Check monthly limits
    const monthlyPercentage = (stats.monthlyUsage / this.limits.monthly) * 100
    if (monthlyPercentage >= this.limits.criticalThreshold) {
      alerts.push({
        type: monthlyPercentage >= 100 ? 'exceeded' : 'critical',
        period: 'monthly',
        message: `Monthly usage ${monthlyPercentage >= 100 ? 'exceeded' : 'critical'}: ${stats.monthlyUsage}/${this.limits.monthly} points`,
        currentUsage: stats.monthlyUsage,
        limit: this.limits.monthly
      })
    } else if (monthlyPercentage >= this.limits.warningThreshold) {
      alerts.push({
        type: 'warning',
        period: 'monthly',
        message: `Monthly usage warning: ${stats.monthlyUsage}/${this.limits.monthly} points (${monthlyPercentage.toFixed(1)}%)`,
        currentUsage: stats.monthlyUsage,
        limit: this.limits.monthly
      })
    }

    return alerts
  }

  /**
   * Check if operation is allowed within limits
   */
  canPerformOperation(estimatedPoints: number): {
    allowed: boolean
    reason?: string
    suggestedAction?: string
  } {
    const stats = this.getUsageStats()
    
    // Check if operation would exceed limits
    if (stats.dailyUsage + estimatedPoints > this.limits.daily) {
      return {
        allowed: false,
        reason: 'Daily limit would be exceeded',
        suggestedAction: 'Wait until tomorrow or upgrade your plan'
      }
    }

    if (stats.weeklyUsage + estimatedPoints > this.limits.weekly) {
      return {
        allowed: false,
        reason: 'Weekly limit would be exceeded',
        suggestedAction: 'Wait until next week or upgrade your plan'
      }
    }

    if (stats.monthlyUsage + estimatedPoints > this.limits.monthly) {
      return {
        allowed: false,
        reason: 'Monthly limit would be exceeded',
        suggestedAction: 'Upgrade your plan to continue'
      }
    }

    return { allowed: true }
  }

  /**
   * Update usage limits
   */
  updateLimits(newLimits: Partial<UsageLimits>): void {
    this.limits = { ...this.limits, ...newLimits }
    this.saveToStorage()
    console.log('📊 Usage limits updated:', this.limits)
  }

  /**
   * Get cost estimate for operation
   */
  estimateOperationCost(
    service: UsageRecord['service'],
    operation: string,
    metadata?: { tokens?: number; duration?: number }
  ): number {
    // Base costs per service
    const baseCosts = {
      'deepseek-r1': 10,
      'deepseek-v3': 5,
      'deepgram': 2,
      'analytics': 8,
      'voice-sales': 5
    }

    let cost = baseCosts[service] || 3

    // Adjust for metadata
    if (metadata?.tokens) {
      cost += Math.ceil(metadata.tokens / 1000) // Additional cost per 1k tokens
    }

    if (metadata?.duration) {
      cost += Math.ceil(metadata.duration / 60) // Additional cost per minute
    }

    return cost
  }

  /**
   * Export usage data
   */
  exportUsageData(): {
    records: UsageRecord[]
    stats: UsageStats
    limits: UsageLimits
    exportDate: string
  } {
    return {
      records: this.records,
      stats: this.getUsageStats(),
      limits: this.limits,
      exportDate: new Date().toISOString()
    }
  }

  /**
   * Check limits and emit warnings
   */
  private checkLimits(): void {
    const alerts = this.getUsageAlerts()
    
    alerts.forEach(alert => {
      if (alert.type === 'exceeded') {
        console.error('🚫', alert.message)
        this.emitEvent('usage-exceeded', alert)
      } else if (alert.type === 'critical') {
        console.warn('⚠️', alert.message)
        this.emitEvent('usage-critical', alert)
      } else if (alert.type === 'warning') {
        console.info('⚡', alert.message)
        this.emitEvent('usage-warning', alert)
      }
    })
  }

  /**
   * Emit custom events for usage alerts
   */
  private emitEvent(eventType: string, data: any): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(eventType, { detail: data }))
    }
  }

  /**
   * Clean up old records (older than 90 days)
   */
  private cleanup(): void {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    const originalLength = this.records.length
    
    this.records = this.records.filter(record => 
      new Date(record.timestamp) > ninetyDaysAgo
    )

    if (originalLength !== this.records.length) {
      console.log(`🧹 Cleaned up ${originalLength - this.records.length} old usage records`)
      this.saveToStorage()
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  private saveToStorage(): void {
    try {
      const data = {
        records: this.records,
        limits: this.limits
      }
      localStorage.setItem('usagePoints', JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save usage data:', error)
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('usagePoints')
      if (stored) {
        const data = JSON.parse(stored)
        this.records = data.records || []
        this.limits = { ...this.limits, ...data.limits }
      }
    } catch (error) {
      console.warn('Failed to load usage data:', error)
    }
  }
}

// Singleton instance
export const usagePointsManager = new UsagePointsManager()

// Service-specific helpers
export const recordDeepSeekUsage = (
  model: 'r1' | 'v3',
  operation: string,
  tokens?: number,
  processingTime?: number
) => {
  const service = model === 'r1' ? 'deepseek-r1' : 'deepseek-v3'
  const points = usagePointsManager.estimateOperationCost(service, operation, { tokens })
  
  return usagePointsManager.recordUsage(service, operation, points, {
    modelUsed: service,
    tokens,
    processingTime
  })
}

export const recordDeepgramUsage = (
  operation: string,
  duration?: number,
  processingTime?: number
) => {
  const points = usagePointsManager.estimateOperationCost('deepgram', operation, { duration })
  
  return usagePointsManager.recordUsage('deepgram', operation, points, {
    duration,
    processingTime
  })
}