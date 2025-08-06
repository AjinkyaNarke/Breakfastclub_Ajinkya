import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'test-key'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

describe('Cost Calculation Accuracy Tests', () => {
  let testIngredients: any[] = []
  let testPreps: any[] = []
  let testMenuItems: any[] = []

  beforeAll(async () => {
    // Create test ingredients with known costs
    const ingredientData = [
      { name: 'Ginger', name_en: 'Ginger', unit: 'g', cost_per_unit: 0.05 },
      { name: 'Garlic', name_en: 'Garlic', unit: 'g', cost_per_unit: 0.03 },
      { name: 'Oil', name_en: 'Oil', unit: 'ml', cost_per_unit: 0.01 },
      { name: 'Chili', name_en: 'Chili', unit: 'g', cost_per_unit: 0.08 }
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
  })

  afterAll(async () => {
    // Cleanup test data
    for (const prep of testPreps) {
      await supabase.from('preps').delete().eq('id', prep.id)
    }
    for (const ingredient of testIngredients) {
      await supabase.from('ingredients').delete().eq('id', ingredient.id)
    }
    for (const menuItem of testMenuItems) {
      await supabase.from('menu_items').delete().eq('id', menuItem.id)
    }
  })

  describe('Single Prep Cost Calculation', () => {
    it('should calculate simple prep cost correctly', async () => {
      // Create prep with single ingredient
      const { data: prep, error } = await supabase
        .from('preps')
        .insert({
          name: 'Simple Garlic Oil',
          batch_yield_amount: 100,
          batch_yield_unit: 'ml',
          is_active: true
        })
        .select()
        .single()

      if (error) throw error
      testPreps.push(prep)

      // Add ingredient: 50g garlic (0.03 per g) + 100ml oil (0.01 per ml)
      await supabase
        .from('prep_ingredients')
        .insert([
          {
            prep_id: prep.id,
            ingredient_id: testIngredients.find(i => i.name === 'Garlic').id,
            quantity: 50,
            unit: 'g'
          },
          {
            prep_id: prep.id,
            ingredient_id: testIngredients.find(i => i.name === 'Oil').id,
            quantity: 100,
            unit: 'ml'
          }
        ])

      // Trigger cost calculation
      await supabase.rpc('calculate_prep_cost', { prep_uuid: prep.id })

      // Get updated prep
      const { data: updatedPrep } = await supabase
        .from('preps')
        .select('*')
        .eq('id', prep.id)
        .single()

      // Expected: (50 * 0.03) + (100 * 0.01) = 1.50 + 1.00 = 2.50
      expect(updatedPrep.cost_per_batch).toBe(2.50)
      
      // Cost per unit: 2.50 / 100ml = 0.025 per ml
      expect(updatedPrep.cost_per_unit).toBe(0.025)
    })

    it('should calculate complex prep cost correctly', async () => {
      // Create complex prep with multiple ingredients
      const { data: prep, error } = await supabase
        .from('preps')
        .insert({
          name: 'Curry Paste',
          batch_yield_amount: 250,
          batch_yield_unit: 'g',
          is_active: true
        })
        .select()
        .single()

      if (error) throw error
      testPreps.push(prep)

      // Add multiple ingredients with different costs
      await supabase
        .from('prep_ingredients')
        .insert([
          {
            prep_id: prep.id,
            ingredient_id: testIngredients.find(i => i.name === 'Ginger').id,
            quantity: 30,
            unit: 'g'
          },
          {
            prep_id: prep.id,
            ingredient_id: testIngredients.find(i => i.name === 'Garlic').id,
            quantity: 40,
            unit: 'g'
          },
          {
            prep_id: prep.id,
            ingredient_id: testIngredients.find(i => i.name === 'Chili').id,
            quantity: 20,
            unit: 'g'
          },
          {
            prep_id: prep.id,
            ingredient_id: testIngredients.find(i => i.name === 'Oil').id,
            quantity: 15,
            unit: 'ml'
          }
        ])

      // Trigger cost calculation
      await supabase.rpc('calculate_prep_cost', { prep_uuid: prep.id })

      // Get updated prep
      const { data: updatedPrep } = await supabase
        .from('preps')
        .select('*')
        .eq('id', prep.id)
        .single()

      // Expected: (30*0.05) + (40*0.03) + (20*0.08) + (15*0.01) = 1.50 + 1.20 + 1.60 + 0.15 = 4.45
      expect(updatedPrep.cost_per_batch).toBe(4.45)
      
      // Cost per unit: 4.45 / 250g = 0.0178 per g
      expect(updatedPrep.cost_per_unit).toBeCloseTo(0.0178, 4)
    })
  })

  describe('Cost Update Propagation', () => {
    it('should update prep costs when ingredient prices change', async () => {
      const prepWithGinger = testPreps.find(p => p.name === 'Curry Paste')
      const gingerIngredient = testIngredients.find(i => i.name === 'Ginger')

      // Get initial cost
      const { data: initialPrep } = await supabase
        .from('preps')
        .select('cost_per_batch')
        .eq('id', prepWithGinger.id)
        .single()

      // Update ginger price from 0.05 to 0.10
      await supabase
        .from('ingredients')
        .update({ cost_per_unit: 0.10 })
        .eq('id', gingerIngredient.id)

      // Wait for trigger to execute
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Get updated cost
      const { data: updatedPrep } = await supabase
        .from('preps')
        .select('cost_per_batch')
        .eq('id', prepWithGinger.id)
        .single()

      // Expected increase: 30g * (0.10 - 0.05) = 30 * 0.05 = 1.50
      const expectedIncrease = 1.50
      expect(updatedPrep.cost_per_batch).toBeCloseTo(initialPrep.cost_per_batch + expectedIncrease, 2)
    })
  })

  describe('Menu Item Cost Calculation with Preps', () => {
    it('should calculate menu item cost including preps', async () => {
      // Create menu item
      const { data: menuItem, error } = await supabase
        .from('menu_items')
        .insert({
          name: 'Thai Green Curry',
          description: 'Curry with prep',
          is_available: true
        })
        .select()
        .single()

      if (error) throw error
      testMenuItems.push(menuItem)

      const curryPastePrep = testPreps.find(p => p.name === 'Curry Paste')
      const oilIngredient = testIngredients.find(i => i.name === 'Oil')

      // Add prep and direct ingredient to menu item
      await supabase
        .from('menu_item_ingredients')
        .insert([
          {
            menu_item_id: menuItem.id,
            prep_id: curryPastePrep.id,
            quantity: 50,
            unit: 'g'
          },
          {
            menu_item_id: menuItem.id,
            ingredient_id: oilIngredient.id,
            quantity: 30,
            unit: 'ml'
          }
        ])

      // Calculate menu item cost
      const { data: menuItemCost } = await supabase
        .rpc('calculate_menu_item_cost', { menu_item_uuid: menuItem.id })

      // Get current prep cost per unit
      const { data: currentPrep } = await supabase
        .from('preps')
        .select('cost_per_unit')
        .eq('id', curryPastePrep.id)
        .single()

      // Expected: (50g * prep_cost_per_unit) + (30ml * 0.01) = prep_cost + 0.30
      const expectedPrepCost = 50 * currentPrep.cost_per_unit
      const expectedDirectCost = 30 * 0.01
      const expectedTotal = expectedPrepCost + expectedDirectCost

      expect(menuItemCost).toBeCloseTo(expectedTotal, 2)
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero-cost ingredients', async () => {
      // Create ingredient with zero cost
      const { data: freeIngredient, error } = await supabase
        .from('ingredients')
        .insert({
          name: 'Free Herb',
          name_en: 'Free Herb',
          unit: 'g',
          cost_per_unit: 0,
          is_active: true
        })
        .select()
        .single()

      if (error) throw error
      testIngredients.push(freeIngredient)

      // Create prep with free ingredient
      const { data: prep, error: prepError } = await supabase
        .from('preps')
        .insert({
          name: 'Free Herb Mix',
          batch_yield_amount: 100,
          batch_yield_unit: 'g',
          is_active: true
        })
        .select()
        .single()

      if (prepError) throw prepError
      testPreps.push(prep)

      await supabase
        .from('prep_ingredients')
        .insert({
          prep_id: prep.id,
          ingredient_id: freeIngredient.id,
          quantity: 100,
          unit: 'g'
        })

      // Trigger cost calculation
      await supabase.rpc('calculate_prep_cost', { prep_uuid: prep.id })

      // Get updated prep
      const { data: updatedPrep } = await supabase
        .from('preps')
        .select('*')
        .eq('id', prep.id)
        .single()

      expect(updatedPrep.cost_per_batch).toBe(0)
      expect(updatedPrep.cost_per_unit).toBe(0)
    })

    it('should handle preps with zero batch yield', async () => {
      // Create prep with zero batch yield
      const { data: prep, error } = await supabase
        .from('preps')
        .insert({
          name: 'Zero Yield Prep',
          batch_yield_amount: 0,
          batch_yield_unit: 'g',
          is_active: true
        })
        .select()
        .single()

      if (error) throw error
      testPreps.push(prep)

      await supabase
        .from('prep_ingredients')
        .insert({
          prep_id: prep.id,
          ingredient_id: testIngredients[0].id,
          quantity: 50,
          unit: 'g'
        })

      // Trigger cost calculation
      await supabase.rpc('calculate_prep_cost', { prep_uuid: prep.id })

      // Get updated prep
      const { data: updatedPrep } = await supabase
        .from('preps')
        .select('*')
        .eq('id', prep.id)
        .single()

      // Should handle division by zero gracefully
      expect(updatedPrep.cost_per_batch).toBeGreaterThan(0)
      expect(updatedPrep.cost_per_unit).toBe(updatedPrep.cost_per_batch) // fallback when batch_yield_amount is 0
    })
  })

  describe('Performance Tests', () => {
    it('should calculate costs efficiently for multiple preps', async () => {
      const startTime = Date.now()

      // Create multiple preps and calculate costs
      const prepPromises = Array.from({ length: 10 }, async (_, i) => {
        const { data: prep } = await supabase
          .from('preps')
          .insert({
            name: `Performance Test Prep ${i}`,
            batch_yield_amount: 100,
            batch_yield_unit: 'g',
            is_active: true
          })
          .select()
          .single()

        testPreps.push(prep)

        await supabase
          .from('prep_ingredients')
          .insert({
            prep_id: prep.id,
            ingredient_id: testIngredients[0].id,
            quantity: 25,
            unit: 'g'
          })

        return supabase.rpc('calculate_prep_cost', { prep_uuid: prep.id })
      })

      await Promise.all(prepPromises)

      const endTime = Date.now()
      const executionTime = endTime - startTime

      // Should complete within reasonable time (less than 5 seconds)
      expect(executionTime).toBeLessThan(5000)
    })
  })
})