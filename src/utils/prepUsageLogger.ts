import { supabase } from '@/integrations/supabase/client';

export interface PrepUsageLog {
  prep_id: string;
  menu_item_id: string;
  quantity: number;
  unit: string;
  notes?: string;
}

export interface BatchPrepUsageLog {
  menu_item_id: string;
  prep_usages: Omit<PrepUsageLog, 'menu_item_id'>[];
}

/**
 * Log a single prep usage when a menu item is prepared
 */
export const logPrepUsage = async (usage: PrepUsageLog): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .rpc('log_prep_usage', {
        p_prep_id: usage.prep_id,
        p_menu_item_id: usage.menu_item_id,
        p_quantity: usage.quantity,
        p_unit: usage.unit,
        p_notes: usage.notes || null
      });

    if (error) {
      console.error('Error logging prep usage:', error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error('Failed to log prep usage:', error);
    return null;
  }
};

/**
 * Log multiple prep usages for a single menu item (batch logging)
 */
export const logBatchPrepUsage = async (batchUsage: BatchPrepUsageLog): Promise<string[]> => {
  try {
    const results: string[] = [];
    
    // Log each prep usage sequentially to ensure data consistency
    for (const prepUsage of batchUsage.prep_usages) {
      const result = await logPrepUsage({
        ...prepUsage,
        menu_item_id: batchUsage.menu_item_id
      });
      
      if (result) {
        results.push(result);
      }
    }
    
    return results;
  } catch (error) {
    console.error('Failed to log batch prep usage:', error);
    return [];
  }
};

/**
 * Automatically log prep usage based on menu item ingredients
 * This should be called when a menu item is prepared/served
 */
export const autoLogPrepUsageFromMenuItem = async (
  menuItemId: string,
  multiplier: number = 1,
  notes?: string
): Promise<string[]> => {
  try {
    // Fetch menu item ingredients that are preps
    const { data: ingredients, error } = await supabase
      .from('menu_item_ingredients')
      .select(`
        prep_id,
        quantity,
        unit,
        prep:preps (
          id,
          name
        )
      `)
      .eq('menu_item_id', menuItemId)
      .not('prep_id', 'is', null);

    if (error) {
      throw new Error(error.message);
    }

    if (!ingredients || ingredients.length === 0) {
      return [];
    }

    // Log usage for each prep ingredient
    const results: string[] = [];
    for (const ingredient of ingredients) {
      if (ingredient.prep_id && ingredient.prep) {
        const result = await logPrepUsage({
          prep_id: ingredient.prep_id,
          menu_item_id: menuItemId,
          quantity: ingredient.quantity * multiplier,
          unit: ingredient.unit,
          notes: notes || `Auto-logged from menu item preparation`
        });
        
        if (result) {
          results.push(result);
        }
      }
    }

    return results;
  } catch (error) {
    console.error('Failed to auto-log prep usage from menu item:', error);
    return [];
  }
};

/**
 * Get recent prep usage logs for analytics
 */
export const getRecentPrepUsage = async (
  days: number = 30,
  prepId?: string
): Promise<any[]> => {
  try {
    let query = supabase
      .from('prep_usage_log')
      .select(`
        *,
        menu_item:menu_items (
          id,
          name,
          name_de,
          name_en
        ),
        prep:preps (
          id,
          name,
          name_de,
          name_en
        )
      `)
      .gte('usage_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('usage_date', { ascending: false });

    if (prepId) {
      query = query.eq('prep_id', prepId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  } catch (error) {
    console.error('Failed to get recent prep usage:', error);
    return [];
  }
};

/**
 * Get prep usage summary for a specific date range
 */
export const getPrepUsageSummary = async (
  startDate: string,
  endDate: string
): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('prep_usage_analytics')
      .select('*');

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  } catch (error) {
    console.error('Failed to get prep usage summary:', error);
    return [];
  }
};

/**
 * Delete old prep usage logs (for data cleanup)
 */
export const cleanupOldPrepUsageLogs = async (olderThanDays: number = 365): Promise<number> => {
  try {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('prep_usage_log')
      .delete()
      .lt('usage_date', cutoffDate)
      .select('id');

    if (error) {
      throw new Error(error.message);
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Failed to cleanup old prep usage logs:', error);
    return 0;
  }
};