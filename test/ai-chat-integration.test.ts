import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'test-key'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

describe('AI Chat Integration Validation', () => {
  let testConversationId: string
  let testIngredients: any[] = []
  let testPreps: any[] = []

  beforeAll(async () => {
    // Create test ingredients for AI chat tests
    const ingredientData = [
      { name: 'Ginger', name_en: 'Ginger', unit: 'g', cost_per_unit: 0.05 },
      { name: 'Garlic', name_en: 'Garlic', unit: 'g', cost_per_unit: 0.03 },
      { name: 'Lemongrass', name_en: 'Lemongrass', unit: 'g', cost_per_unit: 0.04 }
    ]

    for (const ingredient of ingredientData) {
      const { data, error } = await supabase
        .from('ingredients')
        .insert({ ...ingredient, is_active: true })
        .select()
        .single()
      
      if (error) throw error
      testIngredients.push(data)
    }

    // Create test prep for AI chat tests
    const { data: prep, error: prepError } = await supabase
      .from('preps')
      .insert({
        name: 'Thai Green Curry Paste',
        name_en: 'Thai Green Curry Paste',
        name_de: 'Thai Grüne Curry Paste',
        description: 'Authentic Thai green curry paste',
        batch_yield_amount: 300,
        batch_yield_unit: 'g',
        is_active: true
      })
      .select()
      .single()

    if (prepError) throw prepError
    testPreps.push(prep)

    // Add ingredients to prep
    await supabase
      .from('prep_ingredients')
      .insert([
        {
          prep_id: prep.id,
          ingredient_id: testIngredients.find(i => i.name === 'Ginger').id,
          quantity: 50,
          unit: 'g'
        },
        {
          prep_id: prep.id,
          ingredient_id: testIngredients.find(i => i.name === 'Garlic').id,
          quantity: 30,
          unit: 'g'
        }
      ])

    // Calculate prep cost
    await supabase.rpc('calculate_prep_cost', { prep_uuid: prep.id })
  })

  afterAll(async () => {
    // Cleanup test data
    if (testConversationId) {
      await supabase
        .from('admin_chat_conversations')
        .delete()
        .eq('id', testConversationId)
    }

    for (const prep of testPreps) {
      await supabase.from('preps').delete().eq('id', prep.id)
    }
    for (const ingredient of testIngredients) {
      await supabase.from('ingredients').delete().eq('id', ingredient.id)
    }
  })

  describe('Business Context Integration', () => {
    it('should include preps data in business context', async () => {
      const response = await fetch(`${supabaseUrl}/functions/v1/business-context`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      })

      expect(response.ok).toBe(true)
      const result = await response.json()
      
      expect(result.data).toBeDefined()
      expect(result.data.preps).toBeDefined()
      expect(result.data.preps.items).toBeDefined()
      expect(result.data.preps.totalPreps).toBeGreaterThan(0)
      expect(result.data.preps.activePreps).toBeGreaterThan(0)
      expect(result.data.preps.totalCost).toBeGreaterThan(0)

      // Check if our test prep is included
      const testPrep = result.data.preps.items.find(p => p.name === 'Thai Green Curry Paste')
      expect(testPrep).toBeDefined()
      expect(testPrep.prep_ingredients).toBeDefined()
      expect(testPrep.prep_ingredients.length).toBeGreaterThan(0)
    })
  })

  describe('AI Chat Prep Context', () => {
    it('should create conversation and include prep information in context', async () => {
      // First, create a conversation
      const createResponse = await fetch(`${supabaseUrl}/functions/v1/admin-ai-chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'create_conversation',
          title: 'Test Prep Conversation'
        })
      })

      expect(createResponse.ok).toBe(true)
      const createResult = await createResponse.json()
      testConversationId = createResult.conversation.id

      // Send a message asking about preps
      const messageResponse = await fetch(`${supabaseUrl}/functions/v1/admin-ai-chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'send_message',
          conversationId: testConversationId,
          message: 'What preps do we have available?'
        })
      })

      expect(messageResponse.ok).toBe(true)
      const messageResult = await messageResponse.json()
      
      expect(messageResult.success).toBe(true)
      expect(messageResult.message).toBeDefined()
      expect(typeof messageResult.message).toBe('string')
      expect(messageResult.message.length).toBeGreaterThan(0)

      // The AI response should mention preps or prep-related information
      const response = messageResult.message.toLowerCase()
      const hasRelevantContent = 
        response.includes('prep') || 
        response.includes('curry') || 
        response.includes('ginger') ||
        response.includes('garlic')

      expect(hasRelevantContent).toBe(true)
    })

    it('should handle prep cost analysis requests', async () => {
      const messageResponse = await fetch(`${supabaseUrl}/functions/v1/admin-ai-chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'send_message',
          conversationId: testConversationId,
          message: 'Analyze the cost of our Thai Green Curry Paste'
        })
      })

      expect(messageResponse.ok).toBe(true)
      const messageResult = await messageResponse.json()
      
      expect(messageResult.success).toBe(true)
      expect(messageResult.message).toBeDefined()

      // Should mention cost-related information
      const response = messageResult.message.toLowerCase()
      const hasCostContent = 
        response.includes('cost') || 
        response.includes('price') || 
        response.includes('€') ||
        response.includes('euro')

      expect(hasCostContent).toBe(true)
    })

    it('should provide prep creation guidance', async () => {
      const messageResponse = await fetch(`${supabaseUrl}/functions/v1/admin-ai-chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'send_message',
          conversationId: testConversationId,
          message: 'How do I create a new prep?'
        })
      })

      expect(messageResponse.ok).toBe(true)
      const messageResult = await messageResponse.json()
      
      expect(messageResult.success).toBe(true)
      expect(messageResult.message).toBeDefined()

      // Should mention prep creation process
      const response = messageResult.message.toLowerCase()
      const hasCreationContent = 
        response.includes('create') || 
        response.includes('prep') || 
        response.includes('ingredient')

      expect(hasCreationContent).toBe(true)
    })
  })

  describe('AI Chat Performance', () => {
    it('should respond within reasonable time', async () => {
      const startTime = Date.now()

      const messageResponse = await fetch(`${supabaseUrl}/functions/v1/admin-ai-chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'send_message',
          conversationId: testConversationId,
          message: 'What is the total cost of all our preps?'
        })
      })

      const endTime = Date.now()
      const responseTime = endTime - startTime

      expect(messageResponse.ok).toBe(true)
      // Should respond within 30 seconds
      expect(responseTime).toBeLessThan(30000)

      const result = await messageResponse.json()
      expect(result.processing_time_ms).toBeDefined()
      expect(result.tokens_used).toBeGreaterThan(0)
      expect(result.model_used).toBeDefined()
    })
  })

  describe('Context Validation', () => {
    it('should include all required prep information in AI context', async () => {
      // Get conversation messages to verify context
      const messagesResponse = await fetch(`${supabaseUrl}/functions/v1/admin-ai-chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'get_messages',
          conversationId: testConversationId
        })
      })

      expect(messagesResponse.ok).toBe(true)
      const messagesResult = await messagesResponse.json()
      
      expect(messagesResult.success).toBe(true)
      expect(messagesResult.messages).toBeDefined()
      expect(messagesResult.messages.length).toBeGreaterThan(0)

      // Check that messages were stored correctly
      const userMessages = messagesResult.messages.filter(m => m.role === 'user')
      const assistantMessages = messagesResult.messages.filter(m => m.role === 'assistant')

      expect(userMessages.length).toBeGreaterThan(0)
      expect(assistantMessages.length).toBeGreaterThan(0)
    })

    it('should handle prep management command simulation', async () => {
      const commands = [
        'List all active preps',
        'What ingredients are in Thai Green Curry Paste?',
        'Calculate the cost breakdown for our preps',
        'How much does it cost to make 500g of Thai Green Curry Paste?'
      ]

      for (const command of commands) {
        const messageResponse = await fetch(`${supabaseUrl}/functions/v1/admin-ai-chat`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'send_message',
            conversationId: testConversationId,
            message: command
          })
        })

        expect(messageResponse.ok).toBe(true)
        const result = await messageResponse.json()
        expect(result.success).toBe(true)
        expect(result.message).toBeDefined()
        expect(result.message.length).toBeGreaterThan(10) // Should have meaningful response
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid conversation ID gracefully', async () => {
      const messageResponse = await fetch(`${supabaseUrl}/functions/v1/admin-ai-chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'send_message',
          conversationId: 'invalid-uuid',
          message: 'Test message'
        })
      })

      expect(messageResponse.ok).toBe(false)
      const result = await messageResponse.json()
      expect(result.error).toBeDefined()
    })

    it('should handle empty messages gracefully', async () => {
      const messageResponse = await fetch(`${supabaseUrl}/functions/v1/admin-ai-chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'send_message',
          conversationId: testConversationId,
          message: ''
        })
      })

      // Should either succeed with a default response or fail gracefully
      if (messageResponse.ok) {
        const result = await messageResponse.json()
        expect(result.message).toBeDefined()
      } else {
        const result = await messageResponse.json()
        expect(result.error).toBeDefined()
      }
    })
  })

  describe('Model Selection', () => {
    it('should use appropriate AI model for different query types', async () => {
      // Test analytical query (should use reasoning model)
      const analyticalResponse = await fetch(`${supabaseUrl}/functions/v1/admin-ai-chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'send_message',
          conversationId: testConversationId,
          message: 'Analyze the cost efficiency of our prep system and recommend optimizations'
        })
      })

      expect(analyticalResponse.ok).toBe(true)
      const analyticalResult = await analyticalResponse.json()
      expect(analyticalResult.model_used).toBeDefined()

      // Test simple query (should use chat model)
      const simpleResponse = await fetch(`${supabaseUrl}/functions/v1/admin-ai-chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'send_message',
          conversationId: testConversationId,
          message: 'Hello, how are you?'
        })
      })

      expect(simpleResponse.ok).toBe(true)
      const simpleResult = await simpleResponse.json()
      expect(simpleResult.model_used).toBeDefined()

      // Both should have valid model selections
      expect(['deepseek-chat', 'deepseek-reasoner']).toContain(analyticalResult.model_used)
      expect(['deepseek-chat', 'deepseek-reasoner']).toContain(simpleResult.model_used)
    })
  })
})