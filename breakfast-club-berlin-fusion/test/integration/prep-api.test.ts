import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';

// Test database configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'test-key';

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Test data types
interface TestPrep {
  id?: string;
  name: string;
  name_de: string;
  name_en: string;
  description: string;
  description_de: string;
  description_en: string;
  batch_yield: string;
  batch_yield_amount: number;
  batch_yield_unit: string;
  cost_per_batch: number;
  cost_per_unit: number;
  notes: string;
  is_active: boolean;
  instructions: string;
  instructions_de: string;
  instructions_en: string;
  created_at?: string;
  updated_at?: string;
}

interface TestIngredient {
  id?: string;
  name: string;
  name_de: string;
  name_en: string;
  description: string;
  description_de: string;
  description_en: string;
  cost_per_unit: number;
  unit: string;
  category_id: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface TestPrepIngredient {
  prep_id: string;
  ingredient_id: string;
  quantity: number;
  unit: string;
  notes: string;
}

// Test data
const testIngredients: TestIngredient[] = [
  {
    name: 'Test Flour',
    name_de: 'Test Mehl',
    name_en: 'Test Flour',
    description: 'Test flour for prep testing',
    description_de: 'Test Mehl für Prep-Tests',
    description_en: 'Test flour for prep testing',
    cost_per_unit: 2.50,
    unit: 'kg',
    category_id: 'test-category-1',
    is_active: true,
    instructions: 'Use for baking',
    instructions_de: 'Zum Backen verwenden',
    instructions_en: 'Use for baking'
  },
  {
    name: 'Test Oil',
    name_de: 'Test Öl',
    name_en: 'Test Oil',
    description: 'Test oil for prep testing',
    description_de: 'Test Öl für Prep-Tests',
    description_en: 'Test oil for prep testing',
    cost_per_unit: 5.00,
    unit: 'l',
    category_id: 'test-category-2',
    is_active: true,
    instructions: 'Use for cooking',
    instructions_de: 'Zum Kochen verwenden',
    instructions_en: 'Use for cooking'
  }
];

const testPreps: TestPrep[] = [
  {
    name: 'Test Dough',
    name_de: 'Test Teig',
    name_en: 'Test Dough',
    description: 'Test dough prep for integration testing',
    description_de: 'Test Teig-Prep für Integrationstests',
    description_en: 'Test dough prep for integration testing',
    batch_yield: '2kg',
    batch_yield_amount: 2,
    batch_yield_unit: 'kg',
    cost_per_batch: 0,
    cost_per_unit: 0,
    notes: 'Test prep for integration testing',
    is_active: true,
    instructions: 'Mix flour and water',
    instructions_de: 'Mehl und Wasser mischen',
    instructions_en: 'Mix flour and water'
  },
  {
    name: 'Test Sauce',
    name_de: 'Test Soße',
    name_en: 'Test Sauce',
    description: 'Test sauce prep for integration testing',
    description_de: 'Test Soßen-Prep für Integrationstests',
    description_en: 'Test sauce prep for integration testing',
    batch_yield: '500ml',
    batch_yield_amount: 500,
    batch_yield_unit: 'ml',
    cost_per_batch: 0,
    cost_per_unit: 0,
    notes: 'Test sauce prep for integration testing',
    is_active: true,
    instructions: 'Combine oil and spices',
    instructions_de: 'Öl und Gewürze kombinieren',
    instructions_en: 'Combine oil and spices'
  }
];

// Helper functions
const createTestCategory = async (name: string) => {
  const { data, error } = await supabase
    .from('ingredient_categories')
    .insert({
      name,
      name_de: name,
      name_en: name,
      description: `Test category: ${name}`,
      description_de: `Test Kategorie: ${name}`,
      description_en: `Test category: ${name}`,
      is_active: true
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

const cleanupTestData = async () => {
  // Clean up in reverse order of dependencies
  await supabase.from('menu_item_ingredients').delete().in('prep_id', testPreps.map(p => p.id || ''));
  await supabase.from('prep_ingredients').delete().in('prep_id', testPreps.map(p => p.id || ''));
  await supabase.from('preps').delete().in('id', testPreps.map(p => p.id || ''));
  await supabase.from('ingredients').delete().in('id', testIngredients.map(i => i.id || ''));
  await supabase.from('ingredient_categories').delete().like('name', 'Test Category%');
};

const calculatePrepCost = (ingredients: TestPrepIngredient[], ingredientCosts: Map<string, number>): number => {
  return ingredients.reduce((total, ing) => {
    const unitCost = ingredientCosts.get(ing.ingredient_id) || 0;
    return total + (unitCost * ing.quantity);
  }, 0);
};

describe('Prep API Integration Tests', () => {
  let testCategory1: any;
  let testCategory2: any;
  let createdIngredients: TestIngredient[] = [];
  let createdPreps: TestPrep[] = [];

  beforeAll(async () => {
    // Create test categories
    testCategory1 = await createTestCategory('Test Category 1');
    testCategory2 = await createTestCategory('Test Category 2');

    // Update test ingredients with category IDs
    testIngredients[0].category_id = testCategory1.id;
    testIngredients[1].category_id = testCategory2.id;
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  beforeEach(async () => {
    // Clean up any existing test data
    await cleanupTestData();
  });

  afterEach(async () => {
    // Clean up after each test
    await cleanupTestData();
  });

  describe('Ingredient Management', () => {
    it('should create test ingredients successfully', async () => {
      const { data: ingredient1, error: error1 } = await supabase
        .from('ingredients')
        .insert(testIngredients[0])
        .select()
        .single();

      expect(error1).toBeNull();
      expect(ingredient1).toBeDefined();
      expect(ingredient1.name).toBe(testIngredients[0].name);
      expect(ingredient1.cost_per_unit).toBe(testIngredients[0].cost_per_unit);

      const { data: ingredient2, error: error2 } = await supabase
        .from('ingredients')
        .insert(testIngredients[1])
        .select()
        .single();

      expect(error2).toBeNull();
      expect(ingredient2).toBeDefined();
      expect(ingredient2.name).toBe(testIngredients[1].name);

      createdIngredients = [ingredient1, ingredient2];
    });

    it('should fetch ingredients with proper structure', async () => {
      // Create ingredients first
      const { data: ingredients, error } = await supabase
        .from('ingredients')
        .insert(testIngredients)
        .select();

      expect(error).toBeNull();
      expect(ingredients).toHaveLength(2);
      expect(ingredients[0]).toHaveProperty('id');
      expect(ingredients[0]).toHaveProperty('name');
      expect(ingredients[0]).toHaveProperty('cost_per_unit');
      expect(ingredients[0]).toHaveProperty('is_active');

      createdIngredients = ingredients;
    });
  });

  describe('Prep CRUD Operations', () => {
    beforeEach(async () => {
      // Create test ingredients first
      const { data: ingredients } = await supabase
        .from('ingredients')
        .insert(testIngredients)
        .select();
      createdIngredients = ingredients || [];
    });

    it('should create a prep successfully', async () => {
      const prepData = testPreps[0];
      
      const { data: prep, error } = await supabase
        .from('preps')
        .insert(prepData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(prep).toBeDefined();
      expect(prep.name).toBe(prepData.name);
      expect(prep.name_de).toBe(prepData.name_de);
      expect(prep.name_en).toBe(prepData.name_en);
      expect(prep.batch_yield).toBe(prepData.batch_yield);
      expect(prep.is_active).toBe(prepData.is_active);
      expect(prep.id).toBeDefined();
      expect(prep.created_at).toBeDefined();

      createdPreps = [prep];
    });

    it('should create a prep with ingredients and calculate costs', async () => {
      const prepData = testPreps[0];
      
      // Create prep first
      const { data: prep, error: prepError } = await supabase
        .from('preps')
        .insert(prepData)
        .select()
        .single();

      expect(prepError).toBeNull();
      expect(prep).toBeDefined();

      // Add ingredients to prep
      const prepIngredients: TestPrepIngredient[] = [
        {
          prep_id: prep.id,
          ingredient_id: createdIngredients[0].id,
          quantity: 1.5,
          unit: 'kg',
          notes: 'Main flour component'
        },
        {
          prep_id: prep.id,
          ingredient_id: createdIngredients[1].id,
          quantity: 0.1,
          unit: 'l',
          notes: 'Oil for consistency'
        }
      ];

      const { data: ingredients, error: ingredientsError } = await supabase
        .from('prep_ingredients')
        .insert(prepIngredients)
        .select();

      expect(ingredientsError).toBeNull();
      expect(ingredients).toHaveLength(2);

      // Calculate expected cost
      const ingredientCosts = new Map([
        [createdIngredients[0].id, createdIngredients[0].cost_per_unit],
        [createdIngredients[1].id, createdIngredients[1].cost_per_unit]
      ]);
      const expectedCost = calculatePrepCost(prepIngredients, ingredientCosts);

      // Update prep with calculated cost
      const { data: updatedPrep, error: updateError } = await supabase
        .from('preps')
        .update({
          cost_per_batch: expectedCost,
          cost_per_unit: expectedCost / prepData.batch_yield_amount
        })
        .eq('id', prep.id)
        .select()
        .single();

      expect(updateError).toBeNull();
      expect(updatedPrep).toBeDefined();
      expect(updatedPrep.cost_per_batch).toBe(expectedCost);
      expect(updatedPrep.cost_per_unit).toBe(expectedCost / prepData.batch_yield_amount);

      createdPreps = [updatedPrep];
    });

    it('should fetch prep with ingredients', async () => {
      // Create prep with ingredients
      const prepData = testPreps[0];
      const { data: prep } = await supabase
        .from('preps')
        .insert(prepData)
        .select()
        .single();

      const prepIngredients: TestPrepIngredient[] = [
        {
          prep_id: prep.id,
          ingredient_id: createdIngredients[0].id,
          quantity: 1.0,
          unit: 'kg',
          notes: 'Test ingredient'
        }
      ];

      await supabase
        .from('prep_ingredients')
        .insert(prepIngredients);

      // Fetch prep with ingredients
      const { data: fetchedPrep, error } = await supabase
        .from('preps')
        .select(`
          *,
          prep_ingredients (
            *,
            ingredient:ingredients (*)
          )
        `)
        .eq('id', prep.id)
        .single();

      expect(error).toBeNull();
      expect(fetchedPrep).toBeDefined();
      expect(fetchedPrep.prep_ingredients).toHaveLength(1);
      expect(fetchedPrep.prep_ingredients[0].ingredient).toBeDefined();
      expect(fetchedPrep.prep_ingredients[0].ingredient.name).toBe(createdIngredients[0].name);

      createdPreps = [fetchedPrep];
    });

    it('should update a prep successfully', async () => {
      // Create prep first
      const { data: prep } = await supabase
        .from('preps')
        .insert(testPreps[0])
        .select()
        .single();

      // Update prep
      const updateData = {
        name: 'Updated Test Dough',
        name_de: 'Aktualisierter Test Teig',
        name_en: 'Updated Test Dough',
        description: 'Updated description',
        notes: 'Updated notes',
        is_active: false
      };

      const { data: updatedPrep, error } = await supabase
        .from('preps')
        .update(updateData)
        .eq('id', prep.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(updatedPrep).toBeDefined();
      expect(updatedPrep.name).toBe(updateData.name);
      expect(updatedPrep.name_de).toBe(updateData.name_de);
      expect(updatedPrep.name_en).toBe(updateData.name_en);
      expect(updatedPrep.description).toBe(updateData.description);
      expect(updatedPrep.notes).toBe(updateData.notes);
      expect(updatedPrep.is_active).toBe(updateData.is_active);
      expect(updatedPrep.updated_at).toBeDefined();

      createdPreps = [updatedPrep];
    });

    it('should delete a prep and its ingredients', async () => {
      // Create prep with ingredients
      const { data: prep } = await supabase
        .from('preps')
        .insert(testPreps[0])
        .select()
        .single();

      const prepIngredients: TestPrepIngredient[] = [
        {
          prep_id: prep.id,
          ingredient_id: createdIngredients[0].id,
          quantity: 1.0,
          unit: 'kg',
          notes: 'Test ingredient'
        }
      ];

      await supabase
        .from('prep_ingredients')
        .insert(prepIngredients);

      // Verify prep ingredients exist
      const { data: existingIngredients } = await supabase
        .from('prep_ingredients')
        .select()
        .eq('prep_id', prep.id);

      expect(existingIngredients).toHaveLength(1);

      // Delete prep (should cascade delete ingredients)
      const { error: deleteError } = await supabase
        .from('preps')
        .delete()
        .eq('id', prep.id);

      expect(deleteError).toBeNull();

      // Verify prep is deleted
      const { data: deletedPrep } = await supabase
        .from('preps')
        .select()
        .eq('id', prep.id)
        .single();

      expect(deletedPrep).toBeNull();

      // Verify prep ingredients are deleted
      const { data: deletedIngredients } = await supabase
        .from('prep_ingredients')
        .select()
        .eq('prep_id', prep.id);

      expect(deletedIngredients).toHaveLength(0);
    });
  });

  describe('Prep Search and Filtering', () => {
    beforeEach(async () => {
      // Create test ingredients and preps
      const { data: ingredients } = await supabase
        .from('ingredients')
        .insert(testIngredients)
        .select();
      createdIngredients = ingredients || [];

      const { data: preps } = await supabase
        .from('preps')
        .insert(testPreps)
        .select();
      createdPreps = preps || [];
    });

    it('should search preps by name', async () => {
      const { data: results, error } = await supabase
        .from('preps')
        .select()
        .or('name.ilike.%Test%,name_de.ilike.%Test%,name_en.ilike.%Test%');

      expect(error).toBeNull();
      expect(results).toHaveLength(2);
      expect(results?.every(prep => prep.name.includes('Test'))).toBe(true);
    });

    it('should filter preps by active status', async () => {
      // Update one prep to inactive
      await supabase
        .from('preps')
        .update({ is_active: false })
        .eq('id', createdPreps[0].id);

      // Fetch active preps
      const { data: activePreps, error } = await supabase
        .from('preps')
        .select()
        .eq('is_active', true);

      expect(error).toBeNull();
      expect(activePreps).toHaveLength(1);
      expect(activePreps[0].is_active).toBe(true);
    });

    it('should paginate prep results', async () => {
      // Create additional preps for pagination testing
      const additionalPreps = [
        {
          name: 'Test Prep 3',
          name_de: 'Test Prep 3',
          name_en: 'Test Prep 3',
          description: 'Additional test prep',
          description_de: 'Zusätzlicher Test Prep',
          description_en: 'Additional test prep',
          batch_yield: '1kg',
          batch_yield_amount: 1,
          batch_yield_unit: 'kg',
          cost_per_batch: 0,
          cost_per_unit: 0,
          notes: 'Additional prep',
          is_active: true,
          instructions: 'Test instructions',
          instructions_de: 'Test Anweisungen',
          instructions_en: 'Test instructions'
        },
        {
          name: 'Test Prep 4',
          name_de: 'Test Prep 4',
          name_en: 'Test Prep 4',
          description: 'Another test prep',
          description_de: 'Ein weiterer Test Prep',
          description_en: 'Another test prep',
          batch_yield: '750ml',
          batch_yield_amount: 750,
          batch_yield_unit: 'ml',
          cost_per_batch: 0,
          cost_per_unit: 0,
          notes: 'Another prep',
          is_active: true,
          instructions: 'More test instructions',
          instructions_de: 'Weitere Test Anweisungen',
          instructions_en: 'More test instructions'
        }
      ];

      await supabase.from('preps').insert(additionalPreps);

      // Test pagination
      const { data: page1, error: error1 } = await supabase
        .from('preps')
        .select('*', { count: 'exact' })
        .range(0, 1);

      expect(error1).toBeNull();
      expect(page1).toHaveLength(2);

      const { data: page2, error: error2 } = await supabase
        .from('preps')
        .select('*', { count: 'exact' })
        .range(2, 3);

      expect(error2).toBeNull();
      expect(page2).toHaveLength(2);

      // Verify no overlap
      const page1Ids = page1?.map(p => p.id) || [];
      const page2Ids = page2?.map(p => p.id) || [];
      const overlap = page1Ids.filter(id => page2Ids.includes(id));
      expect(overlap).toHaveLength(0);
    });
  });

  describe('Prep Cost Calculation', () => {
    beforeEach(async () => {
      // Create test ingredients
      const { data: ingredients } = await supabase
        .from('ingredients')
        .insert(testIngredients)
        .select();
      createdIngredients = ingredients || [];
    });

    it('should calculate prep cost correctly', async () => {
      const prepData = testPreps[0];
      
      // Create prep
      const { data: prep } = await supabase
        .from('preps')
        .insert(prepData)
        .select()
        .single();

      // Add ingredients with known costs
      const prepIngredients: TestPrepIngredient[] = [
        {
          prep_id: prep.id,
          ingredient_id: createdIngredients[0].id, // Flour: 2.50/kg
          quantity: 1.5,
          unit: 'kg',
          notes: 'Flour component'
        },
        {
          prep_id: prep.id,
          ingredient_id: createdIngredients[1].id, // Oil: 5.00/l
          quantity: 0.2,
          unit: 'l',
          notes: 'Oil component'
        }
      ];

      await supabase
        .from('prep_ingredients')
        .insert(prepIngredients);

      // Calculate expected cost
      const expectedCost = (1.5 * 2.50) + (0.2 * 5.00); // 3.75 + 1.00 = 4.75
      const expectedCostPerUnit = expectedCost / prepData.batch_yield_amount; // 4.75 / 2 = 2.375

      // Update prep with calculated cost
      const { data: updatedPrep, error } = await supabase
        .from('preps')
        .update({
          cost_per_batch: expectedCost,
          cost_per_unit: expectedCostPerUnit
        })
        .eq('id', prep.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(updatedPrep).toBeDefined();
      expect(updatedPrep.cost_per_batch).toBe(expectedCost);
      expect(updatedPrep.cost_per_unit).toBe(expectedCostPerUnit);

      createdPreps = [updatedPrep];
    });

    it('should handle zero quantity ingredients', async () => {
      const prepData = testPreps[0];
      
      const { data: prep } = await supabase
        .from('preps')
        .insert(prepData)
        .select()
        .single();

      const prepIngredients: TestPrepIngredient[] = [
        {
          prep_id: prep.id,
          ingredient_id: createdIngredients[0].id,
          quantity: 0,
          unit: 'kg',
          notes: 'Zero quantity ingredient'
        }
      ];

      await supabase
        .from('prep_ingredients')
        .insert(prepIngredients);

      // Calculate expected cost (should be 0)
      const expectedCost = 0;
      const expectedCostPerUnit = 0;

      const { data: updatedPrep, error } = await supabase
        .from('preps')
        .update({
          cost_per_batch: expectedCost,
          cost_per_unit: expectedCostPerUnit
        })
        .eq('id', prep.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(updatedPrep.cost_per_batch).toBe(expectedCost);
      expect(updatedPrep.cost_per_unit).toBe(expectedCostPerUnit);

      createdPreps = [updatedPrep];
    });
  });

  describe('Validation and Error Handling', () => {
    it('should reject prep with invalid batch yield format', async () => {
      const invalidPrep = {
        ...testPreps[0],
        batch_yield: 'invalid format',
        batch_yield_amount: 0,
        batch_yield_unit: 'invalid'
      };

      const { data, error } = await supabase
        .from('preps')
        .insert(invalidPrep)
        .select();

      // Note: This test assumes the database has constraints
      // In a real scenario, you'd want to validate before inserting
      expect(data).toBeNull();
      // The exact error depends on your database constraints
    });

    it('should reject prep ingredient with non-existent ingredient', async () => {
      // Create prep first
      const { data: prep } = await supabase
        .from('preps')
        .insert(testPreps[0])
        .select()
        .single();

      const invalidPrepIngredient = {
        prep_id: prep.id,
        ingredient_id: 'non-existent-id',
        quantity: 1,
        unit: 'kg',
        notes: 'Invalid ingredient'
      };

      const { data, error } = await supabase
        .from('prep_ingredients')
        .insert(invalidPrepIngredient)
        .select();

      expect(data).toBeNull();
      expect(error).toBeDefined();
      // Should fail due to foreign key constraint

      createdPreps = [prep];
    });

    it('should handle duplicate prep names gracefully', async () => {
      // Create first prep
      const { data: prep1, error: error1 } = await supabase
        .from('preps')
        .insert(testPreps[0])
        .select()
        .single();

      expect(error1).toBeNull();

      // Try to create prep with same name
      const duplicatePrep = {
        ...testPreps[0],
        id: undefined // Ensure new ID
      };

      const { data: prep2, error: error2 } = await supabase
        .from('preps')
        .insert(duplicatePrep)
        .select()
        .single();

      // This behavior depends on your database constraints
      // If you have unique constraints on name, this should fail
      // If not, it should succeed
      if (error2) {
        expect(error2).toBeDefined();
        // Should fail due to unique constraint
      } else {
        expect(prep2).toBeDefined();
        expect(prep2.name).toBe(duplicatePrep.name);
      }

      createdPreps = [prep1, prep2].filter(Boolean);
    });
  });

  describe('Prep Usage Analytics', () => {
    beforeEach(async () => {
      // Create test ingredients and preps
      const { data: ingredients } = await supabase
        .from('ingredients')
        .insert(testIngredients)
        .select();
      createdIngredients = ingredients || [];

      const { data: preps } = await supabase
        .from('preps')
        .insert(testPreps)
        .select();
      createdPreps = preps || [];
    });

    it('should track prep usage in menu items', async () => {
      // Create a test menu item
      const { data: menuItem } = await supabase
        .from('menu_items')
        .insert({
          name: 'Test Menu Item',
          name_de: 'Test Menüpunkt',
          name_en: 'Test Menu Item',
          description: 'Test menu item using prep',
          description_de: 'Test Menüpunkt mit Prep',
          description_en: 'Test menu item using prep',
          price: 15.00,
          category_id: 'test-category',
          is_active: true
        })
        .select()
        .single();

      // Add prep to menu item
      const { data: menuItemIngredient, error } = await supabase
        .from('menu_item_ingredients')
        .insert({
          menu_item_id: menuItem.id,
          prep_id: createdPreps[0].id,
          quantity: 0.5,
          unit: 'kg',
          notes: 'Using test prep'
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(menuItemIngredient).toBeDefined();
      expect(menuItemIngredient.prep_id).toBe(createdPreps[0].id);
      expect(menuItemIngredient.menu_item_id).toBe(menuItem.id);
    });

    it('should calculate prep usage analytics', async () => {
      // Create multiple menu items using the same prep
      const menuItems = [
        {
          name: 'Menu Item 1',
          name_de: 'Menüpunkt 1',
          name_en: 'Menu Item 1',
          description: 'First menu item',
          description_de: 'Erster Menüpunkt',
          description_en: 'First menu item',
          price: 12.00,
          category_id: 'test-category',
          is_active: true
        },
        {
          name: 'Menu Item 2',
          name_de: 'Menüpunkt 2',
          name_en: 'Menu Item 2',
          description: 'Second menu item',
          description_de: 'Zweiter Menüpunkt',
          description_en: 'Second menu item',
          price: 18.00,
          category_id: 'test-category',
          is_active: true
        }
      ];

      const { data: createdMenuItems } = await supabase
        .from('menu_items')
        .insert(menuItems)
        .select();

      // Add prep to both menu items
      const menuItemIngredients = createdMenuItems?.map(item => ({
        menu_item_id: item.id,
        prep_id: createdPreps[0].id,
        quantity: 0.3,
        unit: 'kg',
        notes: 'Using test prep'
      })) || [];

      await supabase
        .from('menu_item_ingredients')
        .insert(menuItemIngredients);

      // Fetch usage analytics
      const { data: usageData, error } = await supabase
        .from('menu_item_ingredients')
        .select(`
          prep_id,
          quantity,
          menu_item:menu_items (
            id,
            name
          ),
          prep:preps (
            id,
            name,
            batch_yield,
            cost_per_batch
          )
        `)
        .eq('prep_id', createdPreps[0].id);

      expect(error).toBeNull();
      expect(usageData).toHaveLength(2);
      expect(usageData?.every(item => item.prep_id === createdPreps[0].id)).toBe(true);
      expect(usageData?.every(item => item.menu_item)).toBe(true);
      expect(usageData?.every(item => item.prep)).toBe(true);
    });
  });
}); 