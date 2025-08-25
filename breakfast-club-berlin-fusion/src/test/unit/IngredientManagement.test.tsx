import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create mock functions
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockOrder = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();

// Mock the supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mockFrom
  }
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      const translations: Record<string, string> = {
        'ingredients.title': 'Ingredient Management',
        'ingredients.description': 'Manage your ingredients',
        'ingredients.loading': 'Loading...',
        'ingredients.addIngredient': 'Add Ingredient',
        'menu.filtersAndSearch': 'Filters & Search',
        'ingredients.searchPlaceholder': 'Search ingredients...',
        'ingredients.allCategories': 'All Categories',
        'ingredients.showingItems': `Showing ${params?.count || 0} of ${params?.total || 0} items`,
        'ingredients.active': 'Active',
        'ingredients.inactive': 'Inactive',
        'ingredients.noIngredients': 'No ingredients found',
        'ingredients.noIngredientsMatch': 'No ingredients match your search',
        'ingredients.addFirstIngredient': 'Add your first ingredient'
      };
      return translations[key] || key;
    }
  })
}));

// Mock the components
vi.mock('@/components/admin/BulkVoiceIngredientCreation', () => ({
  BulkVoiceIngredientCreation: ({ open, onOpenChange }: any) => (
    open ? <div data-testid="bulk-voice-dialog">Bulk Voice Dialog</div> : null
  )
}));

vi.mock('@/components/admin/StreamlinedIngredientDialog', () => ({
  StreamlinedIngredientDialog: ({ open, onOpenChange, ingredient, onSave }: any) => (
    open ? (
      <div data-testid="ingredient-dialog">
        <div>Ingredient Dialog</div>
        <button onClick={() => onSave && onSave()}>Save</button>
        <button onClick={() => onOpenChange(false)}>Close</button>
      </div>
    ) : null
  )
}));

vi.mock('@/components/IngredientImage', () => ({
  IngredientImage: ({ ingredient, showGenerateButton, onImageGenerated }: any) => (
    <div data-testid="ingredient-image">
      <img src={ingredient.image_url || '/placeholder.svg'} alt={ingredient.name} />
      {showGenerateButton && (
        <button onClick={() => onImageGenerated && onImageGenerated()}>Generate Image</button>
      )}
    </div>
  )
}));

// Mock toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
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

// Lazy import the component after mocks are set up
const getIngredientManagement = async () => {
  const module = await import('@/pages/admin/IngredientManagement');
  return module.IngredientManagement;
};

describe('IngredientManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up default mock responses
    mockOrder.mockResolvedValue({ data: [], error: null });
    mockSelect.mockReturnValue({ order: mockOrder });
    mockFrom.mockReturnValue({ 
      select: mockSelect,
      delete: mockDelete
    });
    mockEq.mockResolvedValue({ data: null, error: null });
    mockDelete.mockReturnValue({ eq: mockEq });
  });

  it('should render component with title and description', async () => {
    const IngredientManagement = await getIngredientManagement();
    
    render(<IngredientManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Ingredient Management')).toBeInTheDocument();
      expect(screen.getByText('Manage your ingredients')).toBeInTheDocument();
    });
  });

  it('should display loading state initially', async () => {
    const IngredientManagement = await getIngredientManagement();
    
    // Mock a slow response to test loading state
    mockOrder.mockReturnValue(new Promise(() => {})); // Never resolves

    render(<IngredientManagement />, { wrapper: createWrapper() });
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should display ingredient list after loading', async () => {
    const IngredientManagement = await getIngredientManagement();
    
    const mockIngredients = [
      {
        id: '1',
        name: 'Tomato',
        name_de: 'Tomate',
        name_en: 'Tomato',
        description: 'Fresh tomato',
        description_de: 'Frische Tomate',
        description_en: 'Fresh tomato',
        unit: 'piece',
        category_id: 'vegetables',
        allergens: [],
        dietary_properties: ['vegan'],
        seasonal_availability: ['summer'],
        cost_per_unit: 0.5,
        is_active: true,
        category: { name: 'Vegetables' }
      }
    ];

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
      if (table === 'ingredient_categories') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [{ id: 'vegetables', name: 'Vegetables' }],
              error: null
            })
          })
        };
      }
    });

    render(<IngredientManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Tomato')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('should filter ingredients by search term', async () => {
    const IngredientManagement = await getIngredientManagement();
    
    const mockIngredients = [
      {
        id: '1',
        name: 'Tomato',
        name_de: 'Tomate',
        name_en: 'Tomato',
        description: 'Fresh tomato',
        unit: 'piece',
        category_id: 'vegetables',
        allergens: [],
        dietary_properties: [],
        seasonal_availability: [],
        is_active: true,
        category: { name: 'Vegetables' }
      },
      {
        id: '2',
        name: 'Onion',
        name_de: 'Zwiebel',
        name_en: 'Onion',
        description: 'Fresh onion',
        unit: 'piece',
        category_id: 'vegetables',
        allergens: [],
        dietary_properties: [],
        seasonal_availability: [],
        is_active: true,
        category: { name: 'Vegetables' }
      }
    ];

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
      if (table === 'ingredient_categories') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [{ id: 'vegetables', name: 'Vegetables' }],
              error: null
            })
          })
        };
      }
    });

    render(<IngredientManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Tomato')).toBeInTheDocument();
      expect(screen.getByText('Onion')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search ingredients...');
    fireEvent.change(searchInput, { target: { value: 'tomato' } });

    await waitFor(() => {
      expect(screen.getByText('Tomato')).toBeInTheDocument();
      expect(screen.queryByText('Onion')).not.toBeInTheDocument();
    });
  });

  it('should open add ingredient dialog when add button is clicked', async () => {
    const IngredientManagement = await getIngredientManagement();
    
    render(<IngredientManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      const addButton = screen.getByText('Add Ingredient');
      fireEvent.click(addButton);
    });

    expect(screen.getByTestId('ingredient-dialog')).toBeInTheDocument();
  });

  it('should open bulk voice dialog when bulk add button is clicked', async () => {
    const IngredientManagement = await getIngredientManagement();
    
    render(<IngredientManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      const bulkAddButton = screen.getByText('Bulk Add Ingredients');
      fireEvent.click(bulkAddButton);
    });

    expect(screen.getByTestId('bulk-voice-dialog')).toBeInTheDocument();
  });

  it('should display empty state when no ingredients exist', async () => {
    const IngredientManagement = await getIngredientManagement();
    
    render(<IngredientManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('No ingredients found')).toBeInTheDocument();
      expect(screen.getByText('Add your first ingredient')).toBeInTheDocument();
    });
  });

  it('should display no results state when search yields no results', async () => {
    const IngredientManagement = await getIngredientManagement();
    
    const mockIngredients = [
      {
        id: '1',
        name: 'Tomato',
        unit: 'piece',
        category_id: 'vegetables',
        allergens: [],
        dietary_properties: [],
        seasonal_availability: [],
        is_active: true,
        category: { name: 'Vegetables' }
      }
    ];

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
            data: [],
            error: null
          })
        })
      };
    });

    render(<IngredientManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Tomato')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search ingredients...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(screen.getByText('No ingredients match your search')).toBeInTheDocument();
    });
  });

  it('should handle CRUD operations correctly', async () => {
    const IngredientManagement = await getIngredientManagement();
    
    const mockIngredients = [
      {
        id: '1',
        name: 'Tomato',
        unit: 'piece',
        category_id: 'vegetables',
        allergens: [],
        dietary_properties: [],
        seasonal_availability: [],
        is_active: true,
        category: { name: 'Vegetables' }
      }
    ];

    const mockDeleteFunc = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: null,
        error: null
      })
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'ingredients') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockIngredients,
              error: null
            })
          }),
          delete: mockDeleteFunc
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

    // Mock window.confirm
    const originalConfirm = window.confirm;
    window.confirm = vi.fn().mockReturnValue(true);

    render(<IngredientManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Tomato')).toBeInTheDocument();
    });

    // Test edit functionality
    const editButtons = screen.getAllByLabelText('Edit Ingredient');
    fireEvent.click(editButtons[0]);
    expect(screen.getByTestId('ingredient-dialog')).toBeInTheDocument();

    // Close dialog
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    // Test delete functionality
    await waitFor(() => {
      const deleteButtons = screen.getAllByLabelText('Delete Ingredient');
      fireEvent.click(deleteButtons[0]);
    });

    await waitFor(() => {
      expect(mockDeleteFunc).toHaveBeenCalled();
    });

    // Restore window.confirm
    window.confirm = originalConfirm;
  });
});