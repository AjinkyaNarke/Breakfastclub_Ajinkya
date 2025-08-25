import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WebSocketConfig {
  model?: string;
  language?: string;
  smart_format?: boolean;
  interim_results?: boolean;
  utterance_end_ms?: number;
  vad_events?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify the user is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { config }: { config: WebSocketConfig } = await req.json()

    // Get Deepgram API key
    const deepgramApiKey = Deno.env.get('DEEPGRAM_API_KEY')
    if (!deepgramApiKey) {
      return new Response(
        JSON.stringify({ error: 'Deepgram API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check user's usage quota
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('deepgram_usage_quota, deepgram_usage_current')
      .eq('id', user.id)
      .single()

    if (profile?.deepgram_usage_quota && profile?.deepgram_usage_current >= profile.deepgram_usage_quota) {
      return new Response(
        JSON.stringify({ error: 'Usage quota exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build WebSocket URL with parameters
    const wsParams = new URLSearchParams({
      model: config.model || 'nova-2',
      language: config.language || 'en',
      smart_format: String(config.smart_format ?? true),
      interim_results: String(config.interim_results ?? true),
      utterance_end_ms: String(config.utterance_end_ms || 1000),
      vad_events: String(config.vad_events ?? true),
      encoding: 'linear16',
      sample_rate: '16000',
      channels: '1'
    })

    const wsUrl = `wss://api.deepgram.com/v1/listen?${wsParams.toString()}`

    // Create a proxy WebSocket connection
    const upgrade = req.headers.get("upgrade") || ""
    if (upgrade.toLowerCase() !== "websocket") {
      return new Response(
        JSON.stringify({ 
          websocket_url: wsUrl,
          api_key: deepgramApiKey,
          user_id: user.id,
          session_id: crypto.randomUUID()
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If this is a WebSocket upgrade request, handle it
    const { socket, response } = Deno.upgradeWebSocket(req)

    // Connect to Deepgram WebSocket
    const deepgramWs = new WebSocket(wsUrl, [], {
      headers: {
        'Authorization': `Token ${deepgramApiKey}`
      }
    })

    let connectionStartTime = Date.now()
    let totalAudioDuration = 0

    // Proxy messages between client and Deepgram
    socket.onopen = () => {
      console.log(`WebSocket connection opened for user ${user.id}`)
    }

    socket.onmessage = (event) => {
      // Forward audio data to Deepgram
      if (deepgramWs.readyState === WebSocket.OPEN) {
        deepgramWs.send(event.data)
        
        // Track audio duration (approximate)
        if (typeof event.data !== 'string') {
          totalAudioDuration += 0.1 // Approximate 100ms chunks
        }
      }
    }

    socket.onclose = async () => {
      console.log(`WebSocket connection closed for user ${user.id}`)
      
      // Close Deepgram connection
      if (deepgramWs.readyState === WebSocket.OPEN) {
        deepgramWs.close()
      }

      // Log usage
      try {
        const sessionDuration = (Date.now() - connectionStartTime) / 1000
        await supabaseClient
          .from('deepgram_usage_logs')
          .insert({
            user_id: user.id,
            duration: Math.max(totalAudioDuration, sessionDuration / 60), // Duration in minutes
            model: config.model || 'nova-2',
            feature: 'live_transcription',
            timestamp: new Date().toISOString()
          })

        // Update user's current usage
        await supabaseClient.rpc('increment_deepgram_usage', {
          user_id: user.id,
          amount: Math.max(totalAudioDuration, sessionDuration / 60)
        })
      } catch (error) {
        console.error('Error logging usage:', error)
      }
    }

    socket.onerror = (error) => {
      console.error(`WebSocket error for user ${user.id}:`, error)
    }

    // Handle Deepgram WebSocket events
    deepgramWs.onopen = () => {
      console.log('Connected to Deepgram')
    }

    deepgramWs.onmessage = (event) => {
      // Forward Deepgram responses to client
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(event.data)
      }
    }

    deepgramWs.onclose = () => {
      console.log('Deepgram connection closed')
      if (socket.readyState === WebSocket.OPEN) {
        socket.close()
      }
    }

    deepgramWs.onerror = (error) => {
      console.error('Deepgram WebSocket error:', error)
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'error',
          message: 'Deepgram connection error'
        }))
      }
    }

    return response

  } catch (error) {
    console.error('Error in deepgram-websocket function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})