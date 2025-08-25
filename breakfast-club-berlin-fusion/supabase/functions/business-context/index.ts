import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BusinessContextData {
  menu: {
    categories: any[];
    items: any[];
    totalItems: number;
    priceRange: { min: number; max: number };
  };
  ingredients: {
    items: any[];
    totalIngredients: number;
    totalCost: number;
    lowStockItems: any[];
  };
  preps: {
    items: any[];
    totalPreps: number;
    totalCost: number;
    activePreps: number;
  };
  events: {
    upcoming: any[];
    total: number;
  };
  content: {
    about: any;
    press: any[];
    gallery: any[];
  };
  analytics: {
    recentSales: any[];
    topCategories: any[];
    summary: any;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
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
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin (you may want to add admin role checking here)
    // For now, any authenticated user can access business context

    const contextData: BusinessContextData = {
      menu: { categories: [], items: [], totalItems: 0, priceRange: { min: 0, max: 0 } },
      ingredients: { items: [], totalIngredients: 0, totalCost: 0, lowStockItems: [] },
      preps: { items: [], totalPreps: 0, totalCost: 0, activePreps: 0 },
      events: { upcoming: [], total: 0 },
      content: { about: null, press: [], gallery: [] },
      analytics: { recentSales: [], topCategories: [], summary: null }
    };

    // Aggregate menu data
    try {
      const { data: menuCategories } = await supabaseClient
        .from('menu_categories')
        .select('*')
        .order('sort_order');

      const { data: menuItems } = await supabaseClient
        .from('menu_items')
        .select(`
          *,
          menu_categories(name_en, name_de),
          menu_item_ingredients(
            ingredients(name_en, name_de, cost_per_unit, unit)
          )
        `)
        .eq('is_available', true)
        .order('sort_order');

      contextData.menu.categories = menuCategories || [];
      contextData.menu.items = menuItems || [];
      contextData.menu.totalItems = menuItems?.length || 0;

      if (menuItems && menuItems.length > 0) {
        const prices = menuItems.map(item => item.price).filter(p => p > 0);
        contextData.menu.priceRange = {
          min: Math.min(...prices),
          max: Math.max(...prices)
        };
      }
    } catch (error) {
      console.error('Error fetching menu data:', error);
    }

    // Aggregate ingredients data
    try {
      const { data: ingredients } = await supabaseClient
        .from('ingredients')
        .select('*')
        .order('name_en');

      contextData.ingredients.items = ingredients || [];
      contextData.ingredients.totalIngredients = ingredients?.length || 0;
      contextData.ingredients.totalCost = ingredients?.reduce((sum, ing) => sum + (ing.cost_per_unit || 0), 0) || 0;
      contextData.ingredients.lowStockItems = ingredients?.filter(ing => (ing.current_stock || 0) < (ing.minimum_stock || 0)) || [];
    } catch (error) {
      console.error('Error fetching ingredients data:', error);
    }

    // Aggregate preps data
    try {
      const { data: preps } = await supabaseClient
        .from('preps')
        .select(`
          *,
          prep_ingredients(
            quantity,
            unit,
            ingredient:ingredients(name_en, name_de, cost_per_unit, unit)
          )
        `)
        .order('name');

      contextData.preps.items = preps || [];
      contextData.preps.totalPreps = preps?.length || 0;
      contextData.preps.activePreps = preps?.filter(prep => prep.is_active).length || 0;
      contextData.preps.totalCost = preps?.reduce((sum, prep) => sum + (prep.cost_per_batch || 0), 0) || 0;
    } catch (error) {
      console.error('Error fetching preps data:', error);
    }

    // Aggregate events data
    try {
      const { data: events } = await supabaseClient
        .from('events')
        .select('*')
        .gte('event_date', new Date().toISOString())
        .order('event_date')
        .limit(10);

      const { count: totalEvents } = await supabaseClient
        .from('events')
        .select('*', { count: 'exact', head: true });

      contextData.events.upcoming = events || [];
      contextData.events.total = totalEvents || 0;
    } catch (error) {
      console.error('Error fetching events data:', error);
    }

    // Aggregate content data
    try {
      // About content
      const { data: aboutContent } = await supabaseClient
        .from('content_management')
        .select('*')
        .eq('page', 'about')
        .single();

      contextData.content.about = aboutContent;

      // Press content
      const { data: pressContent } = await supabaseClient
        .from('press')
        .select('*')
        .order('publication_date', { ascending: false })
        .limit(5);

      contextData.content.press = pressContent || [];

      // Gallery content
      const { data: galleryContent } = await supabaseClient
        .from('gallery')
        .select('*')
        .eq('is_featured', true)
        .limit(10);

      contextData.content.gallery = galleryContent || [];
    } catch (error) {
      console.error('Error fetching content data:', error);
    }

    // Aggregate recent analytics data
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentSales } = await supabaseClient
        .from('sales_entries')
        .select('*')
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false })
        .limit(20);

      contextData.analytics.recentSales = recentSales || [];

      // Calculate top categories from recent sales
      if (recentSales && recentSales.length > 0) {
        const categoryTotals = recentSales.reduce((acc, sale) => {
          acc[sale.category] = (acc[sale.category] || 0) + sale.amount;
          return acc;
        }, {});

        contextData.analytics.topCategories = Object.entries(categoryTotals)
          .map(([category, total]) => ({ category, total }))
          .sort((a, b) => (b.total as number) - (a.total as number))
          .slice(0, 5);

        contextData.analytics.summary = {
          totalRevenue: recentSales.reduce((sum, sale) => sum + sale.amount, 0),
          totalTransactions: recentSales.length,
          averageOrderValue: recentSales.reduce((sum, sale) => sum + sale.amount, 0) / recentSales.length,
          dateRange: `${thirtyDaysAgo.toISOString().split('T')[0]} to ${new Date().toISOString().split('T')[0]}`
        };
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: contextData,
        timestamp: new Date().toISOString(),
        message: 'Business context data retrieved successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Business context error:', error)
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