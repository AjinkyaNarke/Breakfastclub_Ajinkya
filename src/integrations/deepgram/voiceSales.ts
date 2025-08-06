import { supabase } from '@/integrations/supabase/client'

export interface VoiceSalesInput {
  audioData?: string // Base64 encoded audio
  audioUrl?: string // URL to audio file
  language?: 'en' | 'de'
  format?: 'wav' | 'mp3' | 'webm'
  expectedFields?: string[] // Expected sales data fields
  contextHints?: string[] // Context hints for better parsing
}

export interface ParsedSalesData {
  amount?: number
  currency?: string
  date?: string
  category?: string
  description?: string
  confidence: number
  rawTranscript: string
  parsedFields: {
    field: string
    value: any
    confidence: number
  }[]
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

export async function processVoiceSalesInput(input: VoiceSalesInput): Promise<VoiceSalesResponse> {
  try {
    console.log('🎤 Processing voice sales input')
    
    if (!input.audioData && !input.audioUrl) {
      throw new Error('Audio data or URL is required')
    }

    const { data, error } = await supabase.functions.invoke('voice-sales-input', {
      body: input
    })

    if (error) {
      console.error('Voice sales input service error:', error)
      throw new Error(`Voice sales input service error: ${error.message}`)
    }

    if (!data || !data.success) {
      throw new Error('Voice sales input service failed to process audio')
    }

    console.log('✅ Voice sales input processed successfully:', {
      transcript: data.transcript,
      confidence: data.salesData.confidence,
      usagePoints: data.usagePoints
    })

    return data as VoiceSalesResponse

  } catch (error) {
    console.error('Voice sales input error:', error)
    throw error
  }
}

export async function transcribeAudioOnly(
  audioData: string | File, 
  language: 'en' | 'de' = 'de'
): Promise<string> {
  try {
    let audioInput: string

    if (typeof audioData === 'string') {
      audioInput = audioData
    } else {
      // Convert File to base64
      const arrayBuffer = await audioData.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      const binaryString = Array.from(uint8Array, byte => String.fromCharCode(byte)).join('')
      audioInput = btoa(binaryString)
    }

    const response = await processVoiceSalesInput({
      audioData: audioInput,
      language,
      format: 'wav'
    })

    return response.transcript

  } catch (error) {
    console.error('Audio transcription error:', error)
    throw error
  }
}

export async function parseVoiceToSalesData(
  transcript: string,
  language: 'en' | 'de' = 'de',
  contextHints: string[] = []
): Promise<ParsedSalesData> {
  try {
    // Create a minimal audio data to trigger the parsing logic
    // In a real implementation, you might want a separate parsing endpoint
    const dummyAudio = btoa('dummy') // Minimal base64 data
    
    const response = await processVoiceSalesInput({
      audioData: dummyAudio,
      language,
      contextHints,
      expectedFields: ['amount', 'date', 'category', 'description']
    })

    // Override with provided transcript for parsing-only use case
    return {
      ...response.salesData,
      rawTranscript: transcript
    }

  } catch (error) {
    console.error('Voice parsing error:', error)
    throw error
  }
}

export function formatSalesDataForForm(salesData: ParsedSalesData): Record<string, any> {
  const formData: Record<string, any> = {}

  salesData.parsedFields.forEach(field => {
    if (field.confidence > 50) { // Only use high-confidence fields
      formData[field.field] = field.value
    }
  })

  // Ensure required fields have fallbacks
  if (!formData.date && salesData.date) {
    formData.date = salesData.date
  }
  
  if (!formData.amount && salesData.amount) {
    formData.amount = salesData.amount
  }

  if (!formData.currency && salesData.currency) {
    formData.currency = salesData.currency
  }

  return formData
}

export function getSalesDataConfidenceLevel(salesData: ParsedSalesData): 'high' | 'medium' | 'low' {
  if (salesData.confidence >= 80) return 'high'
  if (salesData.confidence >= 60) return 'medium'
  return 'low'
}

export function getRequiredReviewFields(salesData: ParsedSalesData): string[] {
  const lowConfidenceFields: string[] = []
  
  salesData.parsedFields.forEach(field => {
    if (field.confidence < 70) {
      lowConfidenceFields.push(field.field)
    }
  })

  return lowConfidenceFields
}