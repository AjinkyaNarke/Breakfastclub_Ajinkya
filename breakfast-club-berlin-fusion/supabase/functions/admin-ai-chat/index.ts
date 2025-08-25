import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

interface BusinessContext {
  menu: any;
  ingredients: any;
  preps: any;
  events: any;
  content: any;
  analytics: any;
}

// DeepSeek API integration
async function callDeepSeekAPI(messages: ChatMessage[], model: string = 'deepseek-chat'): Promise<DeepSeekResponse> {
  const deepSeekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
  if (!deepSeekApiKey) {
    throw new Error('DeepSeek API key not configured');
  }

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${deepSeekApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 2000,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} ${errorText}`);
  }

  return await response.json();
}

// Intelligent model routing logic
function selectOptimalModel(userMessage: string, conversationLength: number): string {
  const message = userMessage.toLowerCase();
  
  // Use DeepSeek-R1 for complex reasoning tasks
  if (
    message.includes('analyze') ||
    message.includes('calculate') ||
    message.includes('compare') ||
    message.includes('strategy') ||
    message.includes('recommend') ||
    message.includes('optimize') ||
    message.includes('why') ||
    message.includes('how to improve') ||
    conversationLength > 10 // Long conversations need reasoning
  ) {
    return 'deepseek-reasoner'; // DeepSeek-R1
  }
  
  // Use DeepSeek-V3 for general chat and quick responses
  return 'deepseek-chat'; // DeepSeek-V3
}

// Format business context for AI prompts
function formatBusinessContext(context: BusinessContext): string {
  return `
# Restaurant Business Context

## Menu Information
- Total menu items: ${context.menu?.totalItems || 0}
- Price range: €${context.menu?.priceRange?.min || 0} - €${context.menu?.priceRange?.max || 0}
- Categories: ${context.menu?.categories?.map(c => c.name_en).join(', ') || 'None'}
- Popular items: ${context.menu?.items?.slice(0, 5).map(i => `${i.name_en} (€${i.price})`).join(', ') || 'None'}

## Ingredients & Inventory
- Total ingredients: ${context.ingredients?.totalIngredients || 0}
- Total ingredient cost: €${context.ingredients?.totalCost?.toFixed(2) || '0.00'}
- Low stock items: ${context.ingredients?.lowStockItems?.map(i => i.name_en).join(', ') || 'None'}

## Preps & Preparations
- Total preps: ${context.preps?.totalPreps || 0}
- Active preps: ${context.preps?.activePreps || 0}
- Total prep cost: €${context.preps?.totalCost?.toFixed(2) || '0.00'}
- Available preps: ${context.preps?.items?.filter(p => p.is_active).slice(0, 10).map(p => `${p.name} (€${(p.cost_per_batch || 0).toFixed(2)})`).join(', ') || 'None'}

## Events & Marketing
- Upcoming events: ${context.events?.upcoming?.length || 0}
- Next event: ${context.events?.upcoming?.[0]?.title_en || 'None scheduled'}

## Recent Analytics (Last 30 days)
- Total revenue: €${context.analytics?.summary?.totalRevenue?.toFixed(2) || '0.00'}
- Total transactions: ${context.analytics?.summary?.totalTransactions || 0}
- Average order value: €${context.analytics?.summary?.averageOrderValue?.toFixed(2) || '0.00'}
- Top categories: ${context.analytics?.topCategories?.map(c => `${c.category} (€${c.total?.toFixed(2)})`).join(', ') || 'None'}

## About the Restaurant
${context.content?.about?.content_en || 'Berlin Fusion breakfast club specializing in fusion cuisine.'}

This is your business data. Use it to provide informed, specific advice and answers.

## Prep Management Commands (you can help with these):
- "Create a prep called [name] with [ingredients and quantities]"
- "What preps do we have?" or "List all preps"
- "Show me the cost of [prep name]"
- "What ingredients are in [prep name]?"
- "Add [prep name] to [dish name]"
- "Calculate prep costs" or "Update prep pricing"
`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, conversationId, message, title } = await req.json()

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Verify admin authentication
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized access' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle different actions
    switch (action) {
      case 'get_conversations':
        const { data: conversations } = await supabaseClient
          .from('admin_chat_conversations')
          .select('*')
          .eq('admin_user_id', user.id)
          .order('updated_at', { ascending: false });

        return new Response(
          JSON.stringify({ success: true, conversations }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'create_conversation':
        const { data: newConversation, error: createError } = await supabaseClient
          .from('admin_chat_conversations')
          .insert({
            title: title || 'New Chat',
            admin_user_id: user.id
          })
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        return new Response(
          JSON.stringify({ success: true, conversation: newConversation }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'delete_conversation':
        const { error: deleteError } = await supabaseClient
          .from('admin_chat_conversations')
          .delete()
          .eq('id', conversationId)
          .eq('admin_user_id', user.id);

        if (deleteError) {
          throw deleteError;
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Conversation deleted' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'get_messages':
        const { data: messages } = await supabaseClient
          .from('admin_chat_messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at');

        return new Response(
          JSON.stringify({ success: true, messages }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'send_message':
        const startTime = Date.now();

        // Verify conversation belongs to user
        const { data: conversation } = await supabaseClient
          .from('admin_chat_conversations')
          .select('*')
          .eq('id', conversationId)
          .eq('admin_user_id', user.id)
          .single();

        if (!conversation) {
          throw new Error('Conversation not found or unauthorized');
        }

        // Get conversation history
        const { data: chatHistory } = await supabaseClient
          .from('admin_chat_messages')
          .select('role, content')
          .eq('conversation_id', conversationId)
          .order('created_at');

        // Get business context
        const businessContextResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/business-context`, {
          method: 'POST',
          headers: {
            'Authorization': req.headers.get('Authorization')!,
            'Content-Type': 'application/json',
          },
        });

        let businessContext: BusinessContext = { menu: {}, ingredients: {}, preps: {}, events: {}, content: {}, analytics: {} };
        if (businessContextResponse.ok) {
          const contextData = await businessContextResponse.json();
          businessContext = contextData.data;
        }

        // Save user message
        await supabaseClient
          .from('admin_chat_messages')
          .insert({
            conversation_id: conversationId,
            role: 'user',
            content: message
          });

        // Prepare messages for AI
        const systemPrompt = `You are an intelligent business assistant for a Berlin fusion breakfast restaurant. You have access to real-time business data and should provide helpful, specific advice based on the actual data.

${formatBusinessContext(businessContext)}

Guidelines:
- Be helpful, professional, and specific
- Use the business data to give informed recommendations
- Focus on actionable insights
- If asked about data you don't have, be honest about limitations
- Keep responses concise but informative`;

        const aiMessages: ChatMessage[] = [
          { role: 'user', content: systemPrompt },
          ...(chatHistory || []).map(msg => ({ 
            role: msg.role as 'user' | 'assistant', 
            content: msg.content 
          })),
          { role: 'user', content: message }
        ];

        // Select optimal model and get AI response
        const selectedModel = selectOptimalModel(message, aiMessages.length);
        const aiResponse = await callDeepSeekAPI(aiMessages, selectedModel);
        
        const processingTime = Date.now() - startTime;
        const assistantMessage = aiResponse.choices[0]?.message?.content || 'I apologize, but I could not generate a response at this time.';

        // Save assistant message
        await supabaseClient
          .from('admin_chat_messages')
          .insert({
            conversation_id: conversationId,
            role: 'assistant',
            content: assistantMessage,
            model_used: selectedModel,
            tokens_used: aiResponse.usage?.total_tokens || 0,
            processing_time_ms: processingTime
          });

        // Update conversation timestamp
        await supabaseClient
          .from('admin_chat_conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId);

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: assistantMessage,
            model_used: selectedModel,
            tokens_used: aiResponse.usage?.total_tokens || 0,
            processing_time_ms: processingTime
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Admin chat error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})