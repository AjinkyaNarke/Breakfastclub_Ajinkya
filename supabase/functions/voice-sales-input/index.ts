import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VoiceSalesRequest {
  audioData?: string; // Base64 encoded audio
  audioUrl?: string; // URL to audio file
  language?: 'en' | 'de';
  format?: 'wav' | 'mp3' | 'webm';
  expectedFields?: string[]; // Expected sales data fields
  contextHints?: string[]; // Context hints for better parsing
}

interface ParsedSalesData {
  amount?: number;
  currency?: string;
  date?: string;
  category?: string;
  description?: string;
  confidence: number;
  rawTranscript: string;
  parsedFields: {
    field: string;
    value: string | number;
    confidence: number;
  }[];
}

interface VoiceSalesResponse {
  success: boolean;
  transcript: string;
  salesData: ParsedSalesData;
  usagePoints: number;
  metadata: {
    processingTime: number;
    deepgramModel: string;
    language: string;
  };
}

const USAGE_POINTS = {
  transcription: 2,
  parsing: 3,
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestData: VoiceSalesRequest = await req.json()
    
    if (!requestData.audioData && !requestData.audioUrl) {
      return new Response(
        JSON.stringify({ error: 'Audio data or URL is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const DEEPGRAM_API_KEY = Deno.env.get('DEEPGRAM_API_KEY')
    if (!DEEPGRAM_API_KEY) {
      throw new Error('Deepgram API key not configured')
    }

    const startTime = Date.now()
    const language = requestData.language || 'de'

    // Step 1: Transcribe audio using Deepgram
    const transcript = await transcribeAudio(requestData, DEEPGRAM_API_KEY)
    
    // Step 2: Parse sales data from transcript
    const salesData = await parseSalesData(transcript, requestData)
    
    const processingTime = Date.now() - startTime

    return new Response(
      JSON.stringify({
        success: true,
        transcript,
        salesData,
        usagePoints: USAGE_POINTS.transcription + USAGE_POINTS.parsing,
        metadata: {
          processingTime,
          deepgramModel: 'nova-2',
          language
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Voice sales input error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        usagePoints: 0
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function transcribeAudio(request: VoiceSalesRequest, apiKey: string): Promise<string> {
  let audioBuffer: ArrayBuffer
  
  if (request.audioData) {
    // Decode base64 audio data
    const binaryString = atob(request.audioData)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    audioBuffer = bytes.buffer
  } else if (request.audioUrl) {
    // Fetch audio from URL
    const audioResponse = await fetch(request.audioUrl)
    if (!audioResponse.ok) {
      throw new Error('Failed to fetch audio from URL')
    }
    audioBuffer = await audioResponse.arrayBuffer()
  } else {
    throw new Error('No audio data provided')
  }

  // Configure Deepgram options for sales input
  const deepgramOptions = {
    model: 'nova-2',
    language: request.language || 'de',
    smart_format: true,
    punctuate: true,
    paragraphs: false,
    utterances: false,
    keywords: [
      // German keywords
      'Euro', 'Cent', 'verkauft', 'Umsatz', 'Einnahmen', 'heute', 'gestern',
      'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag',
      'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
      // English keywords
      'Euro', 'Cent', 'sold', 'sales', 'revenue', 'today', 'yesterday',
      'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ],
    boosters: [
      // Boost financial terms
      { phrase: 'Euro', boost: 2.0 },
      { phrase: 'Cent', boost: 2.0 },
      { phrase: 'Umsatz', boost: 2.0 },
      { phrase: 'verkauft', boost: 1.5 },
      { phrase: 'sales', boost: 2.0 },
      { phrase: 'revenue', boost: 2.0 },
      { phrase: 'sold', boost: 1.5 }
    ]
  }

  const response = await fetch('https://api.deepgram.com/v1/listen', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'audio/' + (request.format || 'wav')
    },
    body: new URLSearchParams(deepgramOptions).toString() + '&' + new URLSearchParams({
      callback: '',
      callback_method: 'POST'
    }).toString(),
    // Send audio data separately
  })

  // Make the actual request with audio data
  const actualResponse = await fetch(`https://api.deepgram.com/v1/listen?${new URLSearchParams(deepgramOptions).toString()}`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'audio/' + (request.format || 'wav')
    },
    body: audioBuffer
  })

  if (!actualResponse.ok) {
    const errorText = await actualResponse.text()
    throw new Error(`Deepgram transcription error: ${actualResponse.status} ${errorText}`)
  }

  const result = await actualResponse.json()
  
  if (!result.results?.channels?.[0]?.alternatives?.[0]?.transcript) {
    throw new Error('No transcript received from Deepgram')
  }

  return result.results.channels[0].alternatives[0].transcript
}

async function parseSalesData(transcript: string, request: VoiceSalesRequest): Promise<ParsedSalesData> {
  const language = request.language || 'de'
  
  // Initialize parsed data structure
  const salesData: ParsedSalesData = {
    confidence: 0,
    rawTranscript: transcript,
    parsedFields: []
  }

  // Parse amount and currency
  const amountResult = parseAmount(transcript, language)
  if (amountResult) {
    salesData.amount = amountResult.amount
    salesData.currency = amountResult.currency
    salesData.parsedFields.push({
      field: 'amount',
      value: amountResult.amount,
      confidence: amountResult.confidence
    })
    salesData.parsedFields.push({
      field: 'currency', 
      value: amountResult.currency,
      confidence: amountResult.confidence
    })
  }

  // Parse date
  const dateResult = parseDate(transcript, language)
  if (dateResult) {
    salesData.date = dateResult.date
    salesData.parsedFields.push({
      field: 'date',
      value: dateResult.date,
      confidence: dateResult.confidence
    })
  }

  // Parse category/description
  const categoryResult = parseCategory(transcript, language)
  if (categoryResult) {
    salesData.category = categoryResult.category
    salesData.description = categoryResult.description
    salesData.parsedFields.push({
      field: 'category',
      value: categoryResult.category,
      confidence: categoryResult.confidence
    })
    if (categoryResult.description) {
      salesData.parsedFields.push({
        field: 'description',
        value: categoryResult.description,
        confidence: categoryResult.confidence
      })
    }
  }

  // Calculate overall confidence
  if (salesData.parsedFields.length > 0) {
    salesData.confidence = salesData.parsedFields.reduce((sum, field) => sum + field.confidence, 0) / salesData.parsedFields.length
  }

  return salesData
}

function parseAmount(transcript: string, language: string): { amount: number, currency: string, confidence: number } | null {
  const text = transcript.toLowerCase()
  
  // German patterns
  const germanPatterns = [
    /(\d+(?:,\d+)?)\s*euro/gi,
    /(\d+(?:,\d+)?)\s*€/gi,
    /euro\s*(\d+(?:,\d+)?)/gi,
    /€\s*(\d+(?:,\d+)?)/gi,
    /(\d+(?:,\d+)?)\s*cent/gi
  ]
  
  // English patterns  
  const englishPatterns = [
    /(\d+(?:\.\d+)?)\s*euro/gi,
    /(\d+(?:\.\d+)?)\s*€/gi,
    /euro\s*(\d+(?:\.\d+)?)/gi,
    /€\s*(\d+(?:\.\d+)?)/gi,
    /(\d+(?:\.\d+)?)\s*cents?/gi
  ]
  
  const patterns = language === 'de' ? germanPatterns : englishPatterns
  
  for (const pattern of patterns) {
    const match = pattern.exec(text)
    if (match) {
      let amount = parseFloat(match[1].replace(',', '.'))
      const currency = 'EUR'
      let confidence = 85
      
      // Handle cents
      if (text.includes('cent')) {
        amount = amount / 100
        confidence = 90
      }
      
      return { amount, currency, confidence }
    }
  }
  
  return null
}

function parseDate(transcript: string, language: string): { date: string, confidence: number } | null {
  const text = transcript.toLowerCase()
  const today = new Date()
  
  // Relative dates
  const relativeDates = language === 'de' ? {
    'heute': 0,
    'gestern': -1,
    'vorgestern': -2
  } : {
    'today': 0,
    'yesterday': -1,
    'day before yesterday': -2
  }
  
  for (const [term, dayOffset] of Object.entries(relativeDates)) {
    if (text.includes(term)) {
      const date = new Date(today)
      date.setDate(date.getDate() + dayOffset)
      return {
        date: date.toISOString().split('T')[0],
        confidence: 95
      }
    }
  }
  
  // Weekdays
  const weekdays = language === 'de' ? [
    'montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'
  ] : [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ]
  
  for (let i = 0; i < weekdays.length; i++) {
    if (text.includes(weekdays[i])) {
      const targetDay = i + 1 // Monday = 1, Sunday = 7
      const currentDay = today.getDay() || 7 // Sunday = 7
      let daysBack = currentDay - targetDay
      if (daysBack <= 0) daysBack += 7 // Previous week
      
      const date = new Date(today)
      date.setDate(date.getDate() - daysBack)
      return {
        date: date.toISOString().split('T')[0],
        confidence: 80
      }
    }
  }
  
  // Specific date patterns (DD.MM or DD/MM)
  const datePatterns = [
    /(\d{1,2})\.(\d{1,2})\.?(\d{4})?/g,
    /(\d{1,2})\/(\d{1,2})\/?(\d{4})?/g
  ]
  
  for (const pattern of datePatterns) {
    const match = pattern.exec(text)
    if (match) {
      const day = parseInt(match[1])
      const month = parseInt(match[2]) - 1 // JS months are 0-indexed
      const year = match[3] ? parseInt(match[3]) : today.getFullYear()
      
      if (day >= 1 && day <= 31 && month >= 0 && month <= 11) {
        const date = new Date(year, month, day)
        return {
          date: date.toISOString().split('T')[0],
          confidence: 90
        }
      }
    }
  }
  
  return null
}

function parseCategory(transcript: string, language: string): { category: string, description?: string, confidence: number } | null {
  const text = transcript.toLowerCase()
  
  // Common restaurant categories
  const categories = language === 'de' ? {
    'frühstück': ['frühstück', 'breakfast', 'morgenmahl'],
    'mittagessen': ['mittagessen', 'lunch', 'mittag'],
    'abendessen': ['abendessen', 'dinner', 'abendbrot'],
    'getränke': ['getränke', 'getränk', 'trinken', 'drinks'],
    'snacks': ['snacks', 'snack', 'zwischenmahlzeit'],
    'dessert': ['dessert', 'nachtisch', 'süßspeise']
  } : {
    'breakfast': ['breakfast', 'morning meal'],
    'lunch': ['lunch', 'midday meal'],  
    'dinner': ['dinner', 'evening meal'],
    'beverages': ['beverages', 'drinks', 'drink'],
    'snacks': ['snacks', 'snack'],
    'dessert': ['dessert', 'sweet']
  }
  
  for (const [category, terms] of Object.entries(categories)) {
    for (const term of terms) {
      if (text.includes(term)) {
        return {
          category,
          description: transcript, // Full transcript as description
          confidence: 75
        }
      }
    }
  }
  
  // If no specific category found, use general description
  return {
    category: 'general',
    description: transcript,
    confidence: 50
  }
}