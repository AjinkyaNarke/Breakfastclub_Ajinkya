import { supabase } from './client'
import type { SalesDataEntry, ParsedSalesData } from '@/types/analytics'

export interface SalesQueryParams {
  dateFrom?: string
  dateTo?: string
  categories?: string[]
  minAmount?: number
  maxAmount?: number
  validationStatus?: string[]
  source?: string[]
  limit?: number
  offset?: number
  orderBy?: 'date' | 'amount' | 'created_at'
  orderDirection?: 'asc' | 'desc'
}

export interface SalesDataResponse {
  success: boolean
  data: SalesDataEntry[]
  pagination: {
    offset: number
    limit: number
    total: number
    hasMore: boolean
  }
}

export interface ValidationResult {
  valid: boolean
  warnings: string[]
  errors: string[]
}

export interface CreateSalesResponse {
  success: boolean
  data: SalesDataEntry
  validation: ValidationResult
}

export interface BatchCreateResponse {
  success: boolean
  data: SalesDataEntry[]
  validationResults: Array<{
    entry: SalesDataEntry
    valid: boolean
    warnings: string[]
    errors: string[]
  }>
  inserted: number
  total: number
}

/**
 * Query sales data with optional filters and pagination
 */
export async function querySalesData(params: SalesQueryParams = {}): Promise<SalesDataResponse> {
  try {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          searchParams.set(key, value.join(','))
        } else {
          searchParams.set(key, value.toString())
        }
      }
    })

    const { data, error } = await supabase.functions.invoke('sales-data-crud', {
      method: 'GET',
      body: null,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (error) {
      throw new Error(`Sales data query error: ${error.message}`)
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to query sales data')
    }

    return data as SalesDataResponse

  } catch (error) {
    console.error('Query sales data error:', error)
    throw error
  }
}

/**
 * Create a single sales data entry
 */
export async function createSalesEntry(entry: Omit<SalesDataEntry, 'id'>): Promise<CreateSalesResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('sales-data-crud', {
      method: 'POST',
      body: entry
    })

    if (error) {
      throw new Error(`Sales data creation error: ${error.message}`)
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to create sales entry')
    }

    return data as CreateSalesResponse

  } catch (error) {
    console.error('Create sales entry error:', error)
    throw error
  }
}

/**
 * Create multiple sales data entries in batch
 */
export async function createSalesEntriesBatch(
  entries: Omit<SalesDataEntry, 'id'>[],
  options: { validate?: boolean; autoCorrect?: boolean } = {}
): Promise<BatchCreateResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('sales-data-crud', {
      method: 'POST',
      body: {
        entries,
        ...options
      },
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (error) {
      throw new Error(`Batch sales data creation error: ${error.message}`)
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to create sales entries')
    }

    return data as BatchCreateResponse

  } catch (error) {
    console.error('Create sales entries batch error:', error)
    throw error
  }
}

/**
 * Update a sales data entry
 */
export async function updateSalesEntry(
  id: string, 
  updates: Partial<SalesDataEntry>,
  skipValidation: boolean = false
): Promise<CreateSalesResponse> {
  try {
    const { data, error } = await supabase.functions.invoke(`sales-data-crud/${id}`, {
      method: 'PUT',
      body: {
        updates,
        skipValidation
      }
    })

    if (error) {
      throw new Error(`Sales data update error: ${error.message}`)
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to update sales entry')
    }

    return data as CreateSalesResponse

  } catch (error) {
    console.error('Update sales entry error:', error)
    throw error
  }
}

/**
 * Delete a sales data entry
 */
export async function deleteSalesEntry(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const { data, error } = await supabase.functions.invoke(`sales-data-crud/${id}`, {
      method: 'DELETE'
    })

    if (error) {
      throw new Error(`Sales data deletion error: ${error.message}`)
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to delete sales entry')
    }

    return {
      success: true,
      message: data.message
    }

  } catch (error) {
    console.error('Delete sales entry error:', error)
    throw error
  }
}

/**
 * Get sales categories for dropdowns
 */
export async function getSalesCategories(): Promise<Array<{
  name: string
  name_de: string
  name_en: string
  description: string
  color: string
}>> {
  try {
    const { data, error } = await supabase
      .from('sales_categories')
      .select('name, name_de, name_en, description, color')
      .eq('is_active', true)
      .order('display_order')

    if (error) {
      throw new Error(`Categories query error: ${error.message}`)
    }

    return data || []

  } catch (error) {
    console.error('Get sales categories error:', error)
    throw error
  }
}

/**
 * Convert voice-parsed sales data to entry format
 */
export function voiceSalesDataToEntry(
  voiceSalesData: ParsedSalesData,
  additionalData: Partial<SalesDataEntry> = {}
): Omit<SalesDataEntry, 'id'> {
  return {
    date: voiceSalesData.date || new Date().toISOString().split('T')[0],
    amount: voiceSalesData.amount || 0,
    currency: voiceSalesData.currency || 'EUR',
    category: voiceSalesData.category || 'other',
    description: voiceSalesData.description,
    items: 1,
    source: 'voice',
    confidence_score: Math.round(voiceSalesData.confidence),
    raw_transcript: voiceSalesData.rawTranscript,
    parsed_fields: voiceSalesData.parsedFields.reduce((acc, field) => {
      acc[field.field] = {
        value: field.value,
        confidence: field.confidence
      }
      return acc
    }, {} as Record<string, any>),
    validation_status: voiceSalesData.confidence >= 80 ? 'valid' : 'review_required',
    ...additionalData
  }
}

/**
 * Validate sales data without saving
 */
export async function validateSalesData(entry: {
  date: string
  amount: number
  category: string
  source?: string
}): Promise<ValidationResult> {
  try {
    const { data, error } = await supabase.rpc('validate_sales_entry', {
      p_date: entry.date,
      p_amount: entry.amount,
      p_category: entry.category,
      p_source: entry.source || 'manual'
    })

    if (error) {
      throw new Error(`Validation error: ${error.message}`)
    }

    return data as ValidationResult

  } catch (error) {
    console.error('Validate sales data error:', error)
    throw error
  }
}

/**
 * Get sales data statistics for a date range
 */
export async function getSalesStatistics(dateFrom: string, dateTo: string): Promise<{
  totalAmount: number
  totalEntries: number
  averageAmount: number
  categoryBreakdown: Record<string, { amount: number; count: number }>
  dailyTotals: Array<{ date: string; amount: number; count: number }>
}> {
  try {
    const salesData = await querySalesData({
      dateFrom,
      dateTo,
      limit: 10000 // Get all data for statistics
    })

    const stats = {
      totalAmount: 0,
      totalEntries: salesData.data.length,
      averageAmount: 0,
      categoryBreakdown: {} as Record<string, { amount: number; count: number }>,
      dailyTotals: [] as Array<{ date: string; amount: number; count: number }>
    }

    // Calculate statistics
    const dailyMap = new Map<string, { amount: number; count: number }>()

    salesData.data.forEach(entry => {
      stats.totalAmount += entry.amount || 0

      // Category breakdown
      if (!stats.categoryBreakdown[entry.category]) {
        stats.categoryBreakdown[entry.category] = { amount: 0, count: 0 }
      }
      stats.categoryBreakdown[entry.category].amount += entry.amount || 0
      stats.categoryBreakdown[entry.category].count += 1

      // Daily totals
      const date = entry.date
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { amount: 0, count: 0 })
      }
      const dayStats = dailyMap.get(date)!
      dayStats.amount += entry.amount || 0
      dayStats.count += 1
    })

    stats.averageAmount = stats.totalEntries > 0 ? stats.totalAmount / stats.totalEntries : 0
    stats.dailyTotals = Array.from(dailyMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return stats

  } catch (error) {
    console.error('Get sales statistics error:', error)
    throw error
  }
}