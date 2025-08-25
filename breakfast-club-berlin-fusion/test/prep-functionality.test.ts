import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'test-key'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

describe('Prep Functionality Tests', () => {
  let testPrepId: string
  let testIngredientId: string
  let testMenuItemId: string

  beforeAll(async () => {
    // Create test ingredient
    const { data: ingredient, error: ingredientError } = await supabase
      .from('ingredients')
      .insert({
        name: 'Test Garlic',
        name_en: 'Test Garlic',
        name_de: 'Test Knoblauch',
        unit: 'g',
        cost_per_unit: 0.02,
        is_active: true
      })
      .select()
      .single()

    if (ingredientError) throw ingredientError
    testIngredientId = ingredient.id

    // Create test menu item
    const { data: menuItem, error: menuItemError } = await supabase
      .from('menu_items')
      .insert({
        name: 'Test Curry Dish',
        description: 'Test curry with preps',
        is_available: true
      })
      .select()
      .single()

    if (menuItemError) throw menuItemError
    testMenuItemId = menuItem.id
  })

  afterAll(async () => {
    // Cleanup test data
    if (testPrepId) {
      await supabase.from('preps').delete().eq('id', testPrepId)
    }
    if (testIngredientId) {
      await supabase.from('ingredients').delete().eq('id', testIngredientId)
    }
    if (testMenuItemId) {
      await supabase.from('menu_items').delete().eq('id', testMenuItemId)
    }
  })

  describe('Prep CRUD Operations', () => {
    it('should create a prep with ingredients', async () => {
      // Test prep creation via API endpoint
      const response = await fetch(`${supabaseUrl}/functions/v1/prep-crud`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({
          name: 'Test Green Curry Paste',
          name_en: 'Test Green Curry Paste',
          name_de: 'Test Grüne Curry Paste',
          description: 'Spicy green curry paste for Thai dishes',
          batch_yield: '500ml',
          batch_yield_amount: 500,
          batch_yield_unit: 'ml',
          ingredients: [
            {
              ingredient_id: testIngredientId,
              quantity: 100,
              unit: 'g',
              notes: 'Fresh garlic cloves'
            }
          ]
        })
      })

      expect(response.ok).toBe(true)
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data.name).toBe('Test Green Curry Paste')
      
      testPrepId = result.data.id
    })

    it('should read prep with ingredients', async () => {
      const response = await fetch(`${supabaseUrl}/functions/v1/prep-crud?id=${testPrepId}&include_ingredients=true`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      })

      expect(response.ok).toBe(true)
      const result = await response.json()
      expect(result.data).toBeDefined()
      expect(result.data.id).toBe(testPrepId)
      expect(result.data.prep_ingredients).toBeDefined()
      expect(result.data.prep_ingredients.length).toBeGreaterThan(0)
    })

    it('should update prep', async () => {
      const response = await fetch(`${supabaseUrl}/functions/v1/prep-crud?id=${testPrepId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({
          name: 'Updated Green Curry Paste',
          description: 'Updated spicy green curry paste',
          batch_yield_amount: 750
        })
      })

      expect(response.ok).toBe(true)
      const result = await response.json()
      expect(result.data.name).toBe('Updated Green Curry Paste')
      expect(result.data.batch_yield_amount).toBe(750)
    })

    it('should search preps', async () => {
      const response = await fetch(`${supabaseUrl}/functions/v1/prep-crud?search=curry&active_only=true`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      })

      expect(response.ok).toBe(true)
      const result = await response.json()
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
      
      const foundPrep = result.data.find(p => p.id === testPrepId)
      expect(foundPrep).toBeDefined()
    })

    it('should not delete prep if used in menu items', async () => {
      // First add prep to menu item
      await supabase
        .from('menu_item_ingredients')
        .insert({
          menu_item_id: testMenuItemId,
          prep_id: testPrepId,
          quantity: 50,
          unit: 'ml',
          notes: 'Test usage'
        })

      const response = await fetch(`${supabaseUrl}/functions/v1/prep-crud?id=${testPrepId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      })

      expect(response.ok).toBe(false)
      const result = await response.json()
      expect(result.error).toContain('Cannot delete prep that is used in menu items')

      // Cleanup
      await supabase
        .from('menu_item_ingredients')
        .delete()
        .eq('prep_id', testPrepId)
    })
  })

  describe('Cost Calculation Tests', () => {
    it('should calculate prep cost automatically', async () => {
      // Get prep with cost information
      const { data: prep, error } = await supabase
        .from('preps')
        .select('*')
        .eq('id', testPrepId)
        .single()

      expect(error).toBeNull()
      expect(prep).toBeDefined()
      expect(prep.cost_per_batch).toBeGreaterThan(0)
      expect(prep.cost_per_unit).toBeGreaterThan(0)

      // Expected calculation: 100g * 0.02 per g = 2.00
      expect(prep.cost_per_batch).toBe(2.00)
      // Cost per unit: 2.00 / 750ml = 0.0027 (approximately)
      expect(prep.cost_per_unit).toBeCloseTo(0.0027, 4)
    })

    it('should update prep cost when ingredient cost changes', async () => {
      // Get initial cost
      const { data: initialPrep } = await supabase
        .from('preps')
        .select('cost_per_batch')
        .eq('id', testPrepId)
        .single()

      // Update ingredient cost
      await supabase
        .from('ingredients')
        .update({ cost_per_unit: 0.04 })
        .eq('id', testIngredientId)

      // Wait a moment for trigger to execute
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Get updated cost
      const { data: updatedPrep } = await supabase
        .from('preps')
        .select('cost_per_batch')
        .eq('id', testPrepId)
        .single()

      expect(updatedPrep.cost_per_batch).toBeGreaterThan(initialPrep.cost_per_batch)
      expect(updatedPrep.cost_per_batch).toBe(4.00) // 100g * 0.04 per g
    })
  })

  describe('Menu Item Integration Tests', () => {
    it('should support both ingredients and preps in menu items', async () => {
      // Add prep to menu item
      const { error: prepIngError } = await supabase
        .from('menu_item_ingredients')
        .insert({
          menu_item_id: testMenuItemId,
          prep_id: testPrepId,
          quantity: 25,
          unit: 'ml'
        })

      // Add direct ingredient to menu item
      const { error: directIngError } = await supabase
        .from('menu_item_ingredients')
        .insert({
          menu_item_id: testMenuItemId,
          ingredient_id: testIngredientId,
          quantity: 50,
          unit: 'g'
        })

      expect(prepIngError).toBeNull()
      expect(directIngError).toBeNull()

      // Verify both are present
      const { data: menuIngredients } = await supabase
        .from('menu_item_ingredients')
        .select('*')
        .eq('menu_item_id', testMenuItemId)

      const prepIngredient = menuIngredients.find(mi => mi.prep_id === testPrepId)
      const directIngredient = menuIngredients.find(mi => mi.ingredient_id === testIngredientId)

      expect(prepIngredient).toBeDefined()
      expect(directIngredient).toBeDefined()
      expect(prepIngredient.ingredient_id).toBeNull()
      expect(directIngredient.prep_id).toBeNull()

      // Cleanup
      await supabase
        .from('menu_item_ingredients')
        .delete()
        .eq('menu_item_id', testMenuItemId)
    })
  })

  describe('Database Constraints Tests', () => {
    it('should enforce prep_id OR ingredient_id constraint', async () => {
      // Try to insert with both prep_id and ingredient_id
      const { error } = await supabase
        .from('menu_item_ingredients')
        .insert({
          menu_item_id: testMenuItemId,
          prep_id: testPrepId,
          ingredient_id: testIngredientId,
          quantity: 25,
          unit: 'ml'
        })

      expect(error).toBeDefined()
      expect(error.message).toContain('menu_item_ingredients_ingredient_or_prep_check')
    })

    it('should enforce unique prep_id + ingredient_id in prep_ingredients', async () => {
      // Try to insert duplicate prep ingredient
      const { error } = await supabase
        .from('prep_ingredients')
        .insert({
          prep_id: testPrepId,
          ingredient_id: testIngredientId,
          quantity: 50,
          unit: 'g'
        })

      expect(error).toBeDefined()
      expect(error.message).toContain('duplicate key value')
    })
  })

  describe('RLS Policies Tests', () => {
    it('should allow public read access to active preps', async () => {
      const { data, error } = await supabase
        .from('preps')
        .select('*')
        .eq('is_active', true)

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should allow public read access to prep ingredients', async () => {
      const { data, error } = await supabase
        .from('prep_ingredients')
        .select('*')

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })
  })
})