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

class ContextManager {
  private folders: Map<string, ContextFolder> = new Map()
  private maxDataSize = 1024 * 1024 // 1MB limit before summarization
  private maxAge = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds

  constructor() {
    this.loadFromStorage()
  }

  /**
   * Add large dataset and automatically summarize if needed
   */
  async addDataset(
    folderId: string,
    data: any[],
    name: string = 'Dataset'
  ): Promise<{ needsSummarization: boolean; summary?: DataSummary }> {
    const dataSize = this.calculateDataSize(data)
    
    if (dataSize > this.maxDataSize) {
      console.log(`📁 Dataset ${name} (${dataSize} bytes) exceeds limit, creating summary`)
      const summary = await this.createDataSummary(data, name)
      this.addSummaryToFolder(folderId, summary)
      
      return {
        needsSummarization: true,
        summary
      }
    }

    return { needsSummarization: false }
  }

  /**
   * Create intelligent summary of large dataset
   */
  private async createDataSummary(data: any[], name: string): Promise<DataSummary> {
    const originalSize = this.calculateDataSize(data)
    
    // Extract key insights and patterns
    const insights = this.extractKeyInsights(data)
    
    // Determine time range
    const timeRange = this.extractTimeRange(data)
    
    // Create summary
    const summary: DataSummary = {
      id: this.generateId(),
      originalSize,
      summarySize: this.calculateDataSize(insights),
      compressionRatio: originalSize / this.calculateDataSize(insights),
      keyInsights: insights,
      timeRange,
      createdAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString()
    }

    console.log(`✅ Created summary with ${(summary.compressionRatio * 100).toFixed(1)}% compression`)
    
    return summary
  }

  /**
   * Extract key insights from data using statistical analysis
   */
  private extractKeyInsights(data: any[]): string[] {
    const insights: string[] = []
    
    try {
      // Basic statistics
      if (data.length > 0) {
        insights.push(`Dataset contains ${data.length} records`)
        
        // Analyze numeric fields
        const numericFields = this.findNumericFields(data)
        numericFields.forEach(field => {
          const values = data.map(item => item[field]).filter(v => typeof v === 'number')
          if (values.length > 0) {
            const avg = values.reduce((sum, v) => sum + v, 0) / values.length
            const min = Math.min(...values)
            const max = Math.max(...values)
            insights.push(`${field}: avg=${avg.toFixed(2)}, min=${min}, max=${max}`)
          }
        })
        
        // Analyze categorical fields
        const categoricalFields = this.findCategoricalFields(data)
        categoricalFields.forEach(field => {
          const counts = this.countCategories(data, field)
          const topCategories = Object.entries(counts)
            .sort(([,a], [,b]) => (b as number) - (a as number))
            .slice(0, 3)
            .map(([cat, count]) => `${cat}(${count})`)
          insights.push(`${field} top categories: ${topCategories.join(', ')}`)
        })
        
        // Time-based insights
        const timeField = this.findTimeField(data)
        if (timeField) {
          const dates = data.map(item => new Date(item[timeField])).filter(d => !isNaN(d.getTime()))
          if (dates.length > 0) {
            const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime())
            const timespan = sortedDates[sortedDates.length - 1].getTime() - sortedDates[0].getTime()
            const days = Math.ceil(timespan / (24 * 60 * 60 * 1000))
            insights.push(`Time span: ${days} days`)
          }
        }
      }
    } catch (error) {
      console.warn('Error extracting insights:', error)
      insights.push('Statistical analysis failed - manual review recommended')
    }
    
    return insights.slice(0, 10) // Limit to 10 insights
  }

  /**
   * Extract time range from dataset
   */
  private extractTimeRange(data: any[]): { start: string; end: string } {
    const timeField = this.findTimeField(data)
    
    if (!timeField) {
      return {
        start: new Date().toISOString(),
        end: new Date().toISOString()
      }
    }

    const dates = data
      .map(item => new Date(item[timeField]))
      .filter(d => !isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime())

    return {
      start: dates[0]?.toISOString() || new Date().toISOString(),
      end: dates[dates.length - 1]?.toISOString() || new Date().toISOString()
    }
  }

  /**
   * Add summary to folder
   */
  private addSummaryToFolder(folderId: string, summary: DataSummary): void {
    let folder = this.folders.get(folderId)
    
    if (!folder) {
      folder = {
        id: folderId,
        name: `Folder ${folderId}`,
        summaries: [],
        totalOriginalSize: 0,
        totalSummarySize: 0,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    }

    folder.summaries.push(summary)
    folder.totalOriginalSize += summary.originalSize
    folder.totalSummarySize += summary.summarySize
    folder.lastModified = new Date().toISOString()
    
    this.folders.set(folderId, folder)
    this.saveToStorage()
  }

  /**
   * Get folder contents for AI context
   */
  getFolderContext(folderId: string): string {
    const folder = this.folders.get(folderId)
    
    if (!folder) {
      return 'No historical data available'
    }

    let context = `Historical Data Summary for ${folder.name}:\n`
    context += `Total records: ${folder.summaries.length} datasets\n`
    context += `Compression: ${folder.totalOriginalSize} → ${folder.totalSummarySize} bytes\n\n`
    
    folder.summaries.forEach((summary, index) => {
      context += `Dataset ${index + 1} (${summary.timeRange.start} to ${summary.timeRange.end}):\n`
      summary.keyInsights.forEach(insight => {
        context += `  • ${insight}\n`
      })
      context += '\n'
    })

    return context
  }

  /**
   * Clean up old summaries
   */
  cleanup(): void {
    const now = Date.now()
    
    this.folders.forEach((folder, folderId) => {
      folder.summaries = folder.summaries.filter(summary => {
        const age = now - new Date(summary.createdAt).getTime()
        return age < this.maxAge
      })
      
      if (folder.summaries.length === 0) {
        this.folders.delete(folderId)
      } else {
        // Recalculate totals
        folder.totalOriginalSize = folder.summaries.reduce((sum, s) => sum + s.originalSize, 0)
        folder.totalSummarySize = folder.summaries.reduce((sum, s) => sum + s.summarySize, 0)
      }
    })
    
    this.saveToStorage()
    console.log(`🧹 Cleaned up old summaries, ${this.folders.size} folders remaining`)
  }

  // Utility methods
  private calculateDataSize(data: any): number {
    return JSON.stringify(data).length
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  private findNumericFields(data: any[]): string[] {
    if (data.length === 0) return []
    
    const firstItem = data[0]
    return Object.keys(firstItem).filter(key => 
      typeof firstItem[key] === 'number'
    )
  }

  private findCategoricalFields(data: any[]): string[] {
    if (data.length === 0) return []
    
    const firstItem = data[0]
    return Object.keys(firstItem).filter(key => 
      typeof firstItem[key] === 'string' && 
      !this.isDateString(firstItem[key])
    )
  }

  private findTimeField(data: any[]): string | null {
    if (data.length === 0) return null
    
    const firstItem = data[0]
    const timeFields = Object.keys(firstItem).filter(key => 
      this.isDateString(firstItem[key]) || 
      key.toLowerCase().includes('date') || 
      key.toLowerCase().includes('time')
    )
    
    return timeFields[0] || null
  }

  private isDateString(value: any): boolean {
    if (typeof value !== 'string') return false
    const date = new Date(value)
    return !isNaN(date.getTime())
  }

  private countCategories(data: any[], field: string): Record<string, number> {
    const counts: Record<string, number> = {}
    
    data.forEach(item => {
      const value = item[field]
      if (typeof value === 'string') {
        counts[value] = (counts[value] || 0) + 1
      }
    })
    
    return counts
  }

  private saveToStorage(): void {
    try {
      const data = Array.from(this.folders.entries())
      localStorage.setItem('contextManager', JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save context to storage:', error)
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('contextManager')
      if (stored) {
        const data = JSON.parse(stored)
        this.folders = new Map(data)
      }
    } catch (error) {
      console.warn('Failed to load context from storage:', error)
    }
  }
}

// Singleton instance
export const contextManager = new ContextManager()

// Cleanup on page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    contextManager.cleanup()
  })
}