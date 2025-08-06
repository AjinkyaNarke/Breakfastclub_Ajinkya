import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
        'ingredients.addFirstIngredient': 'Add your first ingredient',
        'menu.filtersAndSearch': 'Filters & Search',
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.loading': 'Loading...',
        'common.error': 'Error',
        'common.success': 'Success',
        'ingredients.form.basicInfo': 'Basic Information',
        'ingredients.form.name': 'Name',
        'ingredients.form.description': 'Description',
        'ingredients.form.category': 'Category',
        'ingredients.form.unit': 'Unit',
        'ingredients.form.costPerUnit': 'Cost per Unit',
        'ingredients.form.save': 'Save Ingredient',
        'ingredients.createSuccess': 'Ingredient created successfully',
        'ingredients.updateSuccess': 'Ingredient updated successfully',
        'ingredients.deleteSuccess': 'Ingredient deleted successfully',
        'ingredients.createError': 'Failed to create ingredient',
        'ingredients.updateError': 'Failed to update ingredient',
        'ingredients.deleteError': 'Failed to delete ingredient'
      };
      return translations[key] || key;
    }
  })
}));

// Mock toast hook
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast
  })
}));

// Mock other components
vi.mock('@/components/admin/BulkVoiceIngredientCreation', () => ({
  BulkVoiceIngredientCreation: ({ open, onOpenChange }: any) => (
    open ? <div data-testid="bulk-voice-dialog">Bulk Voice Dialog</div> : null
  )
}));

vi.mock('@/components/admin/StreamlinedIngredientDialog', () => ({
  StreamlinedIngredientDialog: ({ open, onOpenChange, ingredient, onSave }: any) => (
    open ? (
      <div data-testid="ingredient-dialog" role="dialog">
        <div>Ingredient Dialog</div>
        <input aria-label="Name" defaultValue={ingredient?.name || ''} />
        <input aria-label="Description" defaultValue={ingredient?.description || ''} />
        <button onClick={() => onSave && onSave()}>Save Ingredient</button>
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

describe('Ingredient Integration Tests', () => {
  let mockCategories: any[];
  let mockIngredients: any[];

  beforeEach(() => {
    vi.clearAllMocks();
    mockToast.mockClear();

    // Setup test data
    mockCategories = [
      { id: 'vegetables', name: 'Vegetables', display_order: 1 },
      { id: 'meat', name: 'Meat', display_order: 2 },
      { id: 'dairy', name: 'Dairy', display_order: 3 }
    ];

    mockIngredients = [
      {
        id: '1',
        name: 'Tomato',
        name_de: 'Tomate',
        name_en: 'Tomato',
        description: 'Fresh red tomato',
        description_de: 'Frische rote Tomate',
        description_en: 'Fresh red tomato',
        unit: 'piece',
        category_id: 'vegetables',
        cost_per_unit: 0.5,
        allergens: [],
        dietary_properties: ['vegan'],
        seasonal_availability: ['summer'],
        is_active: true,
        supplier_info: 'Local farm',
        notes: 'Organic',
        category: { name: 'Vegetables' }
      }
    ];

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

  describe('Ingredient Creation Flow', () => {
    it('should create a new ingredient successfully', async () => {
      const IngredientManagement = await getIngredientManagement();
      
      mockInsert.mockResolvedValue({
        data: [{ id: 'new-ingredient', name: 'New Ingredient' }],
        error: null
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
            insert: mockInsert
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: table === 'ingredient_categories' ? mockCategories : [],
              error: null
            })
          })
        };
      });

      render(<IngredientManagement />, { wrapper: createWrapper() });

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Ingredient Management')).toBeInTheDocument();
      });

      // Click add ingredient button
      const addButton = screen.getByText('Add Ingredient');
      fireEvent.click(addButton);

      // Wait for dialog to appear
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Fill in the form
      const nameInput = screen.getByLabelText(/name/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      
      fireEvent.change(nameInput, { target: { value: 'New Ingredient' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test description' } });

      // Submit the form
      const saveButton = screen.getByText('Save Ingredient');
      fireEvent.click(saveButton);

      // Verify the API call was made
      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalled();
      });
    });

    it('should handle creation errors gracefully', async () => {
      const IngredientManagement = await getIngredientManagement();
      
      mockInsert.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
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
            insert: mockInsert
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: table === 'ingredient_categories' ? mockCategories : [],
              error: null
            })
          })
        };
      });

      render(<IngredientManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Ingredient Management')).toBeInTheDocument();
      });

      const addButton = screen.getByText('Add Ingredient');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.change(nameInput, { target: { value: 'New Ingredient' } });

      const saveButton = screen.getByText('Save Ingredient');
      fireEvent.click(saveButton);

      // Should handle the error gracefully
      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalled();
      });
    });
  });

  describe('Ingredient Editing Flow', () => {
    it('should edit an existing ingredient successfully', async () => {
      const IngredientManagement = await getIngredientManagement();
      
      const mockUpdateEq = vi.fn().mockResolvedValue({
        data: [{ ...mockIngredients[0], name: 'Updated Tomato' }],
        error: null
      });
      
      const mockUpdateFn = vi.fn().mockReturnValue({
        eq: mockUpdateEq
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
            update: mockUpdateFn
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: table === 'ingredient_categories' ? mockCategories : [],
              error: null
            })
          })
        };
      });

      render(<IngredientManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Tomato')).toBeInTheDocument();
      });

      // Click edit button
      const editButton = screen.getByLabelText('Edit Ingredient');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Update the name
      const nameInput = screen.getByDisplayValue('Tomato');
      fireEvent.change(nameInput, { target: { value: 'Updated Tomato' } });

      // Save changes
      const saveButton = screen.getByText('Save Ingredient');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateFn).toHaveBeenCalled();
      });
    });
  });

  describe('Ingredient Deletion Flow', () => {
    it('should delete an ingredient successfully', async () => {
      const IngredientManagement = await getIngredientManagement();
      
      const mockDeleteEq = vi.fn().mockResolvedValue({
        data: null,
        error: null
      });
      
      const mockDeleteFn = vi.fn().mockReturnValue({
        eq: mockDeleteEq
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
            delete: mockDeleteFn
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: table === 'ingredient_categories' ? mockCategories : [],
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

      // Click delete button
      const deleteButton = screen.getByLabelText('Delete Ingredient');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockDeleteFn).toHaveBeenCalled();
      });

      // Restore window.confirm
      window.confirm = originalConfirm;
    });
  });

  describe('Search and Filtering Integration', () => {
    it('should filter ingredients by search term', async () => {
      const IngredientManagement = await getIngredientManagement();
      
      const multipleIngredients = [
        ...mockIngredients,
        {
          id: '2',
          name: 'Onion',
          name_de: 'Zwiebel',
          name_en: 'Onion',
          description: 'Fresh onion',
          unit: 'piece',
          category_id: 'vegetables',
          cost_per_unit: 0.3,
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
                data: multipleIngredients,
                error: null
              })
            })
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: table === 'ingredient_categories' ? mockCategories : [],
              error: null
            })
          })
        };
      });

      render(<IngredientManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Tomato')).toBeInTheDocument();
        expect(screen.getByText('Onion')).toBeInTheDocument();
      });

      // Search for tomato
      const searchInput = screen.getByPlaceholderText('Search ingredients...');
      fireEvent.change(searchInput, { target: { value: 'tomato' } });

      await waitFor(() => {
        expect(screen.getByText('Tomato')).toBeInTheDocument();
        expect(screen.queryByText('Onion')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle network errors gracefully', async () => {
      const IngredientManagement = await getIngredientManagement();
      
      mockFrom.mockImplementation((table: string) => {
        if (table === 'ingredients') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockRejectedValue(new Error('Network error'))
            })
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: table === 'ingredient_categories' ? mockCategories : [],
              error: null
            })
          })
        };
      });

      render(<IngredientManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Error',
            description: 'Failed to fetch ingredients',
            variant: 'destructive'
          })
        );
      });
    });
  });
});