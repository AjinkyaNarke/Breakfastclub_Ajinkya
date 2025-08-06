import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeepgramAuthRequest {
  action: 'get_token' | 'validate_usage' | 'log_usage'
  usage_data?: {
    duration?: number
    model?: string
    feature?: string
  }
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

    const { action, usage_data }: DeepgramAuthRequest = await req.json()

    switch (action) {
      case 'get_token': {
        // Get Deepgram API key from environment
        const deepgramApiKey = Deno.env.get('DEEPGRAM_API_KEY')
        if (!deepgramApiKey) {
          return new Response(
            JSON.stringify({ error: 'Deepgram API key not configured' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Check user's usage quota (optional)
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

        // Generate temporary token for Deepgram
        const projectId = Deno.env.get('DEEPGRAM_PROJECT_ID')
        if (!projectId) {
          // Fallback: return the main API key (less secure but functional)
          return new Response(
            JSON.stringify({ 
              api_key: deepgramApiKey,
              expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const response = await fetch(`https://api.deepgram.com/v1/projects/${projectId}/keys`, {
          method: 'POST',
          headers: {
            'Authorization': `Token ${deepgramApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            comment: `Temporary key for user ${user.id}`,
            scopes: ['usage:read', 'usage:write'],
            time_to_live_in_seconds: 3600 // 1 hour expiry
          })
        })

        if (!response.ok) {
          // Fallback: return the main API key (less secure but functional)
          return new Response(
            JSON.stringify({ 
              api_key: deepgramApiKey,
              expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const tokenData = await response.json()
        
        return new Response(
          JSON.stringify({
            api_key: tokenData.key,
            expires_at: new Date(Date.now() + 3600000).toISOString()
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'log_usage': {
        if (!usage_data) {
          return new Response(
            JSON.stringify({ error: 'Usage data required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Log usage to database
        const { error: insertError } = await supabaseClient
          .from('deepgram_usage_logs')
          .insert({
            user_id: user.id,
            duration: usage_data.duration || 0,
            model: usage_data.model || 'nova-2',
            feature: usage_data.feature || 'listen',
            timestamp: new Date().toISOString()
          })

        if (insertError) {
          console.error('Error logging usage:', insertError)
        }

        // Update user's current usage
        await supabaseClient.rpc('increment_deepgram_usage', {
          user_id: user.id,
          amount: usage_data.duration || 1
        })

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'validate_usage': {
        // Check current usage against quota
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('deepgram_usage_quota, deepgram_usage_current')
          .eq('id', user.id)
          .single()

        const canUse = !profile?.deepgram_usage_quota || 
                      (profile.deepgram_usage_current < profile.deepgram_usage_quota)

        return new Response(
          JSON.stringify({
            can_use: canUse,
            current_usage: profile?.deepgram_usage_current || 0,
            quota: profile?.deepgram_usage_quota || null,
            remaining: profile?.deepgram_usage_quota ? 
              profile.deepgram_usage_quota - (profile.deepgram_usage_current || 0) : null
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Error in deepgram-auth function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})