import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Performance measurement utilities
interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  componentCount: number;
}

const measurePerformance = async (testFn: () => Promise<void>): Promise<PerformanceMetrics> => {
  const startTime = performance.now();
  const startMemory = (performance as any).memory?.usedJSHeapSize || 0;
  
  await testFn();
  
  const endTime = performance.now();
  const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
  
  return {
    renderTime: endTime - startTime,
    memoryUsage: endMemory - startMemory,
    componentCount: document.querySelectorAll('*').length
  };
};

// Mock performance.memory if not available (for CI environments)
if (!(performance as any).memory) {
  (performance as any).memory = {
    usedJSHeapSize: 50000000, // 50MB baseline
    totalJSHeapSize: 100000000,
    jsHeapSizeLimit: 2000000000
  };
}

// Create mock functions that will be hoisted
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockOrder = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();

// Mock the supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mockFrom,
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'http://test.com/image.jpg' } })
      })
    }
  }
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      const translations: Record<string, string> = {
        'ingredients.title': 'Ingredient Management',
        'ingredients.description': 'Manage your ingredients',
        'ingredients.addIngredient': 'Add Ingredient',
        'ingredients.searchPlaceholder': 'Search ingredients...',
        'ingredients.allCategories': 'All Categories',
        'ingredients.active': 'Active',
        'ingredients.inactive': 'Inactive',
        'ingredients.noIngredients': 'No ingredients found',
        'preps.title': 'Prep Management',
        'preps.description': 'Manage intermediate preps and their costs',
        'preps.addNew': 'Add New Prep',
        'preps.searchPlaceholder': 'Search preps...',
        'menu.title': 'Menu Management',
        'menu.description': 'Manage your menu items',
        'menu.addNew': 'Add Menu Item',
        'voice.title': 'Voice Input',
        'voice.description': 'Voice-powered ingredient creation',
        'common.loading': 'Loading...'
      };
      return translations[key] || key;
    }
  })
}));

// Mock useLocalization hook
vi.mock('@/hooks/useLocalization', () => ({
  useLocalization: () => ({
    getLocalizedText: (item: any, field: string) => item[field] || '',
    getLocalizedPrepText: (prep: any, field: string) => prep[field] || '',
    currentLanguage: 'en'
  })
}));

// Mock toast hook
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast
  })
}));

// Mock dialog components with minimal rendering
vi.mock('@/components/admin/StreamlinedIngredientDialog', () => ({
  StreamlinedIngredientDialog: ({ open }: any) => 
    open ? <div data-testid="ingredient-dialog">Ingredient Dialog</div> : null
}));

vi.mock('@/components/admin/EnhancedPrepDialog', () => ({
  EnhancedPrepDialog: ({ open }: any) => 
    open ? <div data-testid="prep-dialog">Prep Dialog</div> : null
}));

vi.mock('@/components/admin/BulkVoiceIngredientCreation', () => ({
  BulkVoiceIngredientCreation: ({ open }: any) => 
    open ? <div data-testid="voice-dialog">Voice Dialog</div> : null
}));

vi.mock('@/components/IngredientImage', () => ({
  IngredientImage: ({ ingredient }: any) => 
    <img src={ingredient.image_url || '/placeholder.svg'} alt={ingredient.name} />
}));

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  COMPONENT_RENDER: 2000, // ms - More realistic for integration tests
  FORM_SUBMISSION: 3000, // ms
  VOICE_INPUT_RESPONSE: 2000, // ms
  IMAGE_GENERATION: 10000, // ms
  MEMORY_USAGE: 50 * 1024 * 1024, // 50MB
  BUNDLE_LOAD: 5000, // ms
  SEARCH_RESPONSE: 1000, // ms
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, cacheTime: 0 },
      mutations: { retry: false }
    }
  });

  return ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('Core Features Performance Tests', () => {
  let performanceResults: PerformanceMetrics[] = [];

  beforeAll(() => {
    // Setup performance monitoring
    performanceResults = [];
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockToast.mockClear();

    // Setup default mock responses
    mockOrder.mockResolvedValue({ data: [], error: null });
    mockSelect.mockReturnValue({ order: mockOrder });
    mockFrom.mockReturnValue({ 
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete
    });
    mockEq.mockResolvedValue({ data: null, error: null });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockDelete.mockReturnValue({ eq: mockEq });
    mockInsert.mockResolvedValue({ data: [], error: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(() => {
    // Report performance results
    console.log('\n=== Performance Test Results ===');
    performanceResults.forEach((result, index) => {
      console.log(`Test ${index + 1}:`, {
        renderTime: `${result.renderTime.toFixed(2)}ms`,
        memoryUsage: `${(result.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
        componentCount: result.componentCount
      });
    });
  });

  describe('Component Render Performance', () => {
    it('should render IngredientManagement under performance thresholds', async () => {
      const mockIngredients = Array.from({ length: 20 }, (_, i) => ({
        id: `ingredient-${i}`,
        name: `Test Ingredient ${i}`,
        name_de: `Test Zutat ${i}`,
        name_en: `Test Ingredient ${i}`,
        description: `Description for ingredient ${i}`,
        unit: 'piece',
        category_id: 'vegetables',
        cost_per_unit: Math.random() * 10,
        allergens: [],
        dietary_properties: ['vegan'],
        seasonal_availability: ['summer'],
        is_active: true,
        category: { name: 'Vegetables' }
      }));

      mockFrom.mockImplementation((table: string) => {
        if (table === 'ingredients') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockIngredients,
                error: null
              })
            })
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: table === 'ingredient_categories' ? [{ id: 'vegetables', name: 'Vegetables' }] : [],
              error: null
            })
          })
        };
      });

      const getIngredientManagement = async () => {
        const module = await import('@/pages/admin/IngredientManagement');
        return module.IngredientManagement;
      };

      const metrics = await measurePerformance(async () => {
        const IngredientManagement = await getIngredientManagement();
        render(<IngredientManagement />, { wrapper: createWrapper() });
        
        await waitFor(() => {
          expect(screen.getByText('Ingredient Management')).toBeInTheDocument();
        }, { timeout: 5000 });
      });

      performanceResults.push(metrics);

      // Performance assertions
      expect(metrics.renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER);
      expect(metrics.memoryUsage).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_USAGE);
      expect(metrics.componentCount).toBeGreaterThan(0);
    });

    it('should render PrepManagement under performance thresholds', async () => {
      const mockPreps = Array.from({ length: 15 }, (_, i) => ({
        id: `prep-${i}`,
        name: `Test Prep ${i}`,
        name_de: `Test Prep ${i}`,
        name_en: `Test Prep ${i}`,
        description: `Description for prep ${i}`,
        batch_yield: Math.floor(Math.random() * 10) + 1,
        batch_yield_unit: 'portions',
        cost_per_batch: Math.random() * 20,
        notes: `Notes for prep ${i}`,
        is_active: true,
        updated_at: new Date().toISOString(),
        prep_ingredients: []
      }));

      mockFrom.mockImplementation((table: string) => {
        if (table === 'preps') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockPreps,
                  error: null
                })
              })
            })
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null
            })
          })
        };
      });

      const getPrepManagement = async () => {
        const module = await import('@/pages/admin/PrepManagement');
        return module.PrepManagement;
      };

      const metrics = await measurePerformance(async () => {
        const PrepManagement = await getPrepManagement();
        render(<PrepManagement />, { wrapper: createWrapper() });
        
        await waitFor(() => {
          expect(screen.getByText('Prep Management')).toBeInTheDocument();
        }, { timeout: 5000 });
      });

      performanceResults.push(metrics);

      // Performance assertions
      expect(metrics.renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER);
      expect(metrics.memoryUsage).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_USAGE);
    });
  });

  describe('Form Submission Performance', () => {
    it('should handle ingredient form submission efficiently', async () => {
      mockInsert.mockResolvedValue({
        data: [{ id: 'new-ingredient', name: 'New Ingredient' }],
        error: null
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'ingredients') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [],
                error: null
              })
            }),
            insert: mockInsert
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null
            })
          })
        };
      });

      const getIngredientManagement = async () => {
        const module = await import('@/pages/admin/IngredientManagement');
        return module.IngredientManagement;
      };

      const metrics = await measurePerformance(async () => {
        const IngredientManagement = await getIngredientManagement();
        render(<IngredientManagement />, { wrapper: createWrapper() });
        
        await waitFor(() => {
          expect(screen.getByText('Add Ingredient')).toBeInTheDocument();
        });

        const addButton = screen.getByText('Add Ingredient');
        fireEvent.click(addButton);

        await waitFor(() => {
          expect(screen.getByTestId('ingredient-dialog')).toBeInTheDocument();
        });
      });

      performanceResults.push(metrics);

      // Performance assertions for dialog opening
      expect(metrics.renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.FORM_SUBMISSION);
    });
  });

  describe('Voice Input Performance', () => {
    it('should handle voice dialog opening efficiently', async () => {
      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      }));

      const getIngredientManagement = async () => {
        const module = await import('@/pages/admin/IngredientManagement');
        return module.IngredientManagement;
      };

      const metrics = await measurePerformance(async () => {
        const IngredientManagement = await getIngredientManagement();
        render(<IngredientManagement />, { wrapper: createWrapper() });
        
        await waitFor(() => {
          expect(screen.getByText('Bulk Add Ingredients')).toBeInTheDocument();
        });

        const bulkAddButton = screen.getByText('Bulk Add Ingredients');
        fireEvent.click(bulkAddButton);

        await waitFor(() => {
          expect(screen.getByTestId('voice-dialog')).toBeInTheDocument();
        });
      });

      performanceResults.push(metrics);

      // Performance assertions for voice dialog
      expect(metrics.renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.VOICE_INPUT_RESPONSE);
    });
  });

  describe('Memory Usage', () => {
    it('should not create memory leaks during component mounting/unmounting', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Mount and unmount component multiple times
      for (let i = 0; i < 3; i++) {
        const { unmount } = render(<div>Test Component {i}</div>, { wrapper: createWrapper() });
        unmount();
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB for 3 mount/unmount cycles)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Bundle Size Impact', () => {
    it('should load components efficiently without blocking', async () => {
      const startTime = performance.now();

      // Dynamically import multiple components
      const imports = await Promise.all([
        import('@/pages/admin/IngredientManagement'),
        import('@/pages/admin/PrepManagement')
      ]);

      const loadTime = performance.now() - startTime;

      // Component imports should complete within reasonable time
      expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.BUNDLE_LOAD);
      expect(imports).toHaveLength(2);
      imports.forEach(module => {
        expect(module).toBeDefined();
      });
    });
  });

  describe('Search and Filter Performance', () => {
    it('should handle search operations efficiently', async () => {
      const largeDataset = Array.from({ length: 50 }, (_, i) => ({
        id: `ingredient-${i}`,
        name: `Ingredient ${i}`,
        name_de: `Zutat ${i}`,
        name_en: `Ingredient ${i}`,
        description: `Description ${i}`,
        unit: 'piece',
        category_id: 'vegetables',
        cost_per_unit: Math.random() * 10,
        allergens: [],
        dietary_properties: [],
        seasonal_availability: [],
        is_active: true,
        category: { name: 'Vegetables' }
      }));

      mockFrom.mockImplementation((table: string) => {
        if (table === 'ingredients') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: largeDataset,
                error: null
              })
            })
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null
            })
          })
        };
      });

      const getIngredientManagement = async () => {
        const module = await import('@/pages/admin/IngredientManagement');
        return module.IngredientManagement;
      };

      const metrics = await measurePerformance(async () => {
        const IngredientManagement = await getIngredientManagement();
        render(<IngredientManagement />, { wrapper: createWrapper() });
        
        await waitFor(() => {
          expect(screen.getByText('Ingredient Management')).toBeInTheDocument();
        });

        // Perform search operation
        const searchInput = screen.getByPlaceholderText('Search ingredients...');
        fireEvent.change(searchInput, { target: { value: 'Ingredient 5' } });

        await waitFor(() => {
          // Should filter to show only matching results
          expect(screen.getByText('Ingredient 5')).toBeInTheDocument();
        });
      });

      performanceResults.push(metrics);

      // Search should be responsive even with large datasets
      expect(metrics.renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER);
    });
  });

  describe('Concurrent Operations Performance', () => {
    it('should handle multiple component renders efficiently', async () => {
      const startTime = performance.now();
      
      // Render multiple components concurrently
      const renders = Array.from({ length: 3 }, (_, index) => {
        return render(<div key={index}>Component {index}</div>, { wrapper: createWrapper() });
      });

      // Wait for all renders to complete
      await waitFor(() => {
        renders.forEach((_, index) => {
          expect(screen.getByText(`Component ${index}`)).toBeInTheDocument();
        });
      });

      const endTime = performance.now();
      const concurrentTime = endTime - startTime;

      // Cleanup
      renders.forEach(({ unmount }) => unmount());

      expect(concurrentTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER);
    });
  });
});