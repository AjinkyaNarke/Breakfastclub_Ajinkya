import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SalesDataEntry {
  id?: string
  date: string
  amount: number
  currency: string
  category: string
  description?: string
  items?: number
  location?: string
  staff?: string
  payment_method?: 'cash' | 'card' | 'digital'
  source?: 'manual' | 'voice' | 'import' | 'api'
  confidence_score?: number
  raw_transcript?: string
  parsed_fields?: Record<string, any>
  validation_status?: 'valid' | 'flagged' | 'review_required'
  validation_notes?: string
}

interface CreateSalesDataRequest {
  entries: SalesDataEntry[]
  validate?: boolean
  autoCorrect?: boolean
}

interface UpdateSalesDataRequest {
  id: string
  updates: Partial<SalesDataEntry>
  skipValidation?: boolean
}

interface QuerySalesDataRequest {
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

    const url = new URL(req.url)
    const method = req.method
    const pathSegments = url.pathname.split('/').filter(Boolean)
    const operation = pathSegments[pathSegments.length - 1] || method.toLowerCase()

    switch (method) {
      case 'GET':
        return await handleQuery(supabaseClient, url)
      
      case 'POST':
        if (operation === 'batch') {
          return await handleBatchCreate(supabaseClient, req)
        }
        return await handleCreate(supabaseClient, req)
      
      case 'PUT':
      case 'PATCH':
        return await handleUpdate(supabaseClient, req, url)
      
      case 'DELETE':
        return await handleDelete(supabaseClient, url)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { 
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
    }

  } catch (error) {
    console.error('Sales data CRUD error:', error)
    
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

async function handleQuery(supabaseClient: any, url: URL) {
  const searchParams = url.searchParams
  
  // Build query parameters
  const queryParams: QuerySalesDataRequest = {
    dateFrom: searchParams.get('dateFrom') || undefined,
    dateTo: searchParams.get('dateTo') || undefined,
    categories: searchParams.get('categories')?.split(',') || undefined,
    minAmount: searchParams.get('minAmount') ? parseFloat(searchParams.get('minAmount')!) : undefined,
    maxAmount: searchParams.get('maxAmount') ? parseFloat(searchParams.get('maxAmount')!) : undefined,
    validationStatus: searchParams.get('validationStatus')?.split(',') || undefined,
    source: searchParams.get('source')?.split(',') || undefined,
    limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100,
    offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    orderBy: (searchParams.get('orderBy') as any) || 'date',
    orderDirection: (searchParams.get('orderDirection') as any) || 'desc'
  }

  // Build Supabase query
  let query = supabaseClient
    .from('sales_data')
    .select('*')

  // Apply filters
  if (queryParams.dateFrom) {
    query = query.gte('date', queryParams.dateFrom)
  }
  
  if (queryParams.dateTo) {
    query = query.lte('date', queryParams.dateTo)
  }
  
  if (queryParams.categories && queryParams.categories.length > 0) {
    query = query.in('category', queryParams.categories)
  }
  
  if (queryParams.minAmount !== undefined) {
    query = query.gte('amount', queryParams.minAmount)
  }
  
  if (queryParams.maxAmount !== undefined) {
    query = query.lte('amount', queryParams.maxAmount)
  }
  
  if (queryParams.validationStatus && queryParams.validationStatus.length > 0) {
    query = query.in('validation_status', queryParams.validationStatus)
  }
  
  if (queryParams.source && queryParams.source.length > 0) {
    query = query.in('source', queryParams.source)
  }

  // Apply ordering
  query = query.order(queryParams.orderBy, { ascending: queryParams.orderDirection === 'asc' })

  // Apply pagination
  query = query.range(queryParams.offset, queryParams.offset + queryParams.limit - 1)

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Database query error: ${error.message}`)
  }

  // Get total count for pagination
  const { count: totalCount } = await supabaseClient
    .from('sales_data')
    .select('*', { count: 'exact', head: true })

  return new Response(
    JSON.stringify({
      success: true,
      data,
      pagination: {
        offset: queryParams.offset,
        limit: queryParams.limit,
        total: totalCount,
        hasMore: (queryParams.offset + queryParams.limit) < totalCount
      }
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}

async function handleCreate(supabaseClient: any, req: Request) {
  const requestData = await req.json()
  const salesEntry: SalesDataEntry = requestData

  // Validate required fields
  if (!salesEntry.date || !salesEntry.amount || !salesEntry.category) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Missing required fields: date, amount, category' 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  // Validate data using database function
  const { data: validationResult } = await supabaseClient
    .rpc('validate_sales_entry', {
      p_date: salesEntry.date,
      p_amount: salesEntry.amount,
      p_category: salesEntry.category,
      p_source: salesEntry.source || 'manual'
    })

  // Prepare entry with validation results
  const entryToInsert = {
    ...salesEntry,
    validation_status: validationResult?.valid ? 'valid' : 'review_required',
    validation_notes: [
      ...(validationResult?.warnings || []),
      ...(validationResult?.errors || [])
    ].join('; ') || null,
    currency: salesEntry.currency || 'EUR',
    items: salesEntry.items || 1,
    source: salesEntry.source || 'manual',
    confidence_score: salesEntry.confidence_score || 100
  }

  const { data, error } = await supabaseClient
    .from('sales_data')
    .insert([entryToInsert])
    .select()

  if (error) {
    throw new Error(`Database insert error: ${error.message}`)
  }

  return new Response(
    JSON.stringify({
      success: true,
      data: data[0],
      validation: validationResult
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}

async function handleBatchCreate(supabaseClient: any, req: Request) {
  const requestData: CreateSalesDataRequest = await req.json()
  
  if (!requestData.entries || !Array.isArray(requestData.entries)) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Missing or invalid entries array' 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  const validatedEntries = []
  const validationResults = []

  // Validate each entry
  for (const entry of requestData.entries) {
    if (!entry.date || !entry.amount || !entry.category) {
      validationResults.push({
        entry,
        valid: false,
        errors: ['Missing required fields: date, amount, category']
      })
      continue
    }

    let validationResult = { valid: true, warnings: [], errors: [] }
    
    if (requestData.validate !== false) {
      const { data } = await supabaseClient
        .rpc('validate_sales_entry', {
          p_date: entry.date,
          p_amount: entry.amount,
          p_category: entry.category,
          p_source: entry.source || 'manual'
        })
      validationResult = data || validationResult
    }

    const validatedEntry = {
      ...entry,
      validation_status: validationResult.valid ? 'valid' : 'review_required',
      validation_notes: [
        ...(validationResult.warnings || []),
        ...(validationResult.errors || [])
      ].join('; ') || null,
      currency: entry.currency || 'EUR',
      items: entry.items || 1,
      source: entry.source || 'manual',
      confidence_score: entry.confidence_score || 100
    }

    validatedEntries.push(validatedEntry)
    validationResults.push({
      entry,
      ...validationResult
    })
  }

  // Insert all validated entries
  const { data, error } = await supabaseClient
    .from('sales_data')
    .insert(validatedEntries)
    .select()

  if (error) {
    throw new Error(`Database batch insert error: ${error.message}`)
  }

  return new Response(
    JSON.stringify({
      success: true,
      data,
      validationResults,
      inserted: data.length,
      total: requestData.entries.length
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}

async function handleUpdate(supabaseClient: any, req: Request, url: URL) {
  const pathSegments = url.pathname.split('/').filter(Boolean)
  const id = pathSegments[pathSegments.length - 1]
  
  if (!id || id === 'sales-data-crud') {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Missing sales entry ID in URL path' 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  const updateData: UpdateSalesDataRequest = await req.json()
  
  // Validate update if not skipped
  let validationResult = null
  if (!updateData.skipValidation && (updateData.updates.date || updateData.updates.amount || updateData.updates.category)) {
    // Get current entry to merge with updates for validation
    const { data: currentEntry } = await supabaseClient
      .from('sales_data')
      .select('date, amount, category, source')
      .eq('id', id)
      .single()

    if (currentEntry) {
      const mergedEntry = { ...currentEntry, ...updateData.updates }
      const { data } = await supabaseClient
        .rpc('validate_sales_entry', {
          p_date: mergedEntry.date,
          p_amount: mergedEntry.amount,
          p_category: mergedEntry.category,
          p_source: mergedEntry.source || 'manual'
        })
      validationResult = data
    }
  }

  // Apply validation results to updates
  const finalUpdates = {
    ...updateData.updates,
    updated_at: new Date().toISOString()
  }

  if (validationResult) {
    finalUpdates.validation_status = validationResult.valid ? 'valid' : 'review_required'
    finalUpdates.validation_notes = [
      ...(validationResult.warnings || []),
      ...(validationResult.errors || [])
    ].join('; ') || null
  }

  const { data, error } = await supabaseClient
    .from('sales_data')
    .update(finalUpdates)
    .eq('id', id)
    .select()

  if (error) {
    throw new Error(`Database update error: ${error.message}`)
  }

  if (!data || data.length === 0) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Sales entry not found' 
      }),
      { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  return new Response(
    JSON.stringify({
      success: true,
      data: data[0],
      validation: validationResult
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}

async function handleDelete(supabaseClient: any, url: URL) {
  const pathSegments = url.pathname.split('/').filter(Boolean)
  const id = pathSegments[pathSegments.length - 1]
  
  if (!id || id === 'sales-data-crud') {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Missing sales entry ID in URL path' 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  const { data, error } = await supabaseClient
    .from('sales_data')
    .delete()
    .eq('id', id)
    .select()

  if (error) {
    throw new Error(`Database delete error: ${error.message}`)
  }

  if (!data || data.length === 0) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Sales entry not found' 
      }),
      { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Sales entry deleted successfully',
      deletedEntry: data[0]
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}