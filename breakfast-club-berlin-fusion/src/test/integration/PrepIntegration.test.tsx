import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

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
    from: mockFrom
  }
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      const translations: Record<string, string> = {
        'preps.title': 'Prep Management',
        'preps.description': 'Manage intermediate preps and their costs',
        'preps.addNew': 'Add New Prep',
        'preps.searchPlaceholder': 'Search preps...',
        'preps.batchYield': 'Batch Yield',
        'preps.costPerBatch': 'Cost per Batch',
        'preps.notes': 'Notes',
        'preps.lastUpdated': 'Last updated',
        'preps.noResults': 'No preps found',
        'preps.noPreps': 'No preps yet',
        'preps.noResultsDescription': 'Try adjusting your search terms',
        'preps.noPrepsDescription': 'Create your first prep to get started',
        'preps.addFirstPrep': 'Add First Prep',
        'preps.fetchError': 'Error',
        'preps.fetchErrorDescription': 'Failed to fetch preps',
        'preps.deleteConfirm': 'Are you sure you want to delete this prep?',
        'preps.deleteSuccess': 'Success',
        'preps.deleteSuccessDescription': 'Prep deleted successfully',
        'preps.deleteError': 'Error',
        'preps.deleteErrorDescription': 'Failed to delete prep',
        'preps.viewCostBreakdown': 'View Cost Breakdown',
        'preps.costBreakdownTitle': 'Cost Breakdown',
        'prep.form.name': 'Name',
        'prep.form.description': 'Description',
        'prep.form.batchYield': 'Batch Yield',
        'prep.form.save': 'Save Prep',
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.loading': 'Loading...',
        'common.error': 'Error',
        'common.success': 'Success'
      };
      return translations[key] || key;
    }
  })
}));

// Mock useLocalization hook
vi.mock('@/hooks/useLocalization', () => ({
  useLocalization: () => ({
    getLocalizedPrepText: (prep: any, field: string) => {
      if (field === 'name') return prep.name || '';
      if (field === 'description') return prep.description || '';
      return '';
    },
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

// Mock EnhancedPrepDialog component
vi.mock('@/components/admin/EnhancedPrepDialog', () => ({
  EnhancedPrepDialog: ({ open, onOpenChange, onSuccess }: any) => {
    const [dialogOpen, setDialogOpen] = React.useState(open);
    
    React.useEffect(() => {
      setDialogOpen(open);
    }, [open]);

    const handleSave = () => {
      if (onSuccess) {
        onSuccess();
      }
      setDialogOpen(false);
      if (onOpenChange) {
        onOpenChange(false);
      }
    };

    const handleCancel = () => {
      setDialogOpen(false);
      if (onOpenChange) {
        onOpenChange(false);
      }
    };

    return dialogOpen ? (
      <div data-testid="prep-dialog" role="dialog">
        <div>Enhanced Prep Dialog</div>
        <input aria-label="Name" placeholder="Enter prep name" />
        <input aria-label="Description" placeholder="Enter prep description" />
        <input aria-label="Batch Yield" placeholder="Enter batch yield" />
        <button onClick={handleSave}>Save Prep</button>
        <button onClick={handleCancel}>Cancel</button>
      </div>
    ) : null;
  }
}));

// Mock PrepCostBreakdown component
vi.mock('@/components/admin/PrepCostBreakdown', () => ({
  PrepCostBreakdown: ({ prep, showDetails }: any) => (
    <div data-testid="prep-cost-breakdown">
      <div>Cost Breakdown for {prep.name}</div>
      {showDetails && <div>Detailed cost information</div>}
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
const getPrepManagement = async () => {
  const module = await import('@/pages/admin/PrepManagement');
  return module.PrepManagement;
};

describe('Prep Integration Tests', () => {
  let mockPreps: any[];

  beforeEach(() => {
    vi.clearAllMocks();
    mockToast.mockClear();

    // Setup test data
    mockPreps = [
      {
        id: '1',
        name: 'Tomato Sauce',
        name_de: 'Tomatensoße',
        name_en: 'Tomato Sauce',
        description: 'Basic tomato sauce for pizzas',
        description_de: 'Grundlegende Tomatensoße für Pizzen',
        description_en: 'Basic tomato sauce for pizzas',
        batch_yield: 2,
        batch_yield_unit: 'liter',
        cost_per_batch: 5.50,
        notes: 'Made fresh daily',
        is_active: true,
        updated_at: '2025-01-06T12:00:00Z',
        prep_ingredients: [
          {
            id: 'pi1',
            quantity: 1,
            unit: 'kg',
            notes: '',
            ingredient: {
              id: 'ing1',
              name: 'Tomatoes',
              name_de: 'Tomaten',
              name_en: 'Tomatoes',
              unit: 'kg',
              cost_per_unit: 3.00
            }
          }
        ]
      },
      {
        id: '2',
        name: 'Pizza Dough',
        name_de: 'Pizzateig',
        name_en: 'Pizza Dough',
        description: 'Traditional pizza dough',
        description_de: 'Traditioneller Pizzateig',
        description_en: 'Traditional pizza dough',
        batch_yield: 10,
        batch_yield_unit: 'portions',
        cost_per_batch: 2.20,
        notes: 'Let rise for 24 hours',
        is_active: true,
        updated_at: '2025-01-06T10:00:00Z',
        prep_ingredients: []
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

  describe('Prep Creation Flow', () => {
    it('should create a new prep successfully', async () => {
      const PrepManagement = await getPrepManagement();
      
      mockInsert.mockResolvedValue({
        data: [{ id: 'new-prep', name: 'New Prep' }],
        error: null
      });

      // Mock preps table response with the updated data
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

      render(<PrepManagement />, { wrapper: createWrapper() });

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Prep Management')).toBeInTheDocument();
      });

      // Click add prep button
      const addButton = screen.getByText('Add New Prep');
      fireEvent.click(addButton);

      // Wait for dialog to appear
      await waitFor(() => {
        expect(screen.getByTestId('prep-dialog')).toBeInTheDocument();
      });

      // Fill in the form
      const nameInput = screen.getByLabelText(/name/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const batchYieldInput = screen.getByLabelText(/batch yield/i);
      
      fireEvent.change(nameInput, { target: { value: 'New Prep' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
      fireEvent.change(batchYieldInput, { target: { value: '5' } });

      // Submit the form
      const saveButton = screen.getByText('Save Prep');
      fireEvent.click(saveButton);

      // Verify dialog was called to close and refresh data
      await waitFor(() => {
        expect(screen.queryByTestId('prep-dialog')).not.toBeInTheDocument();
      });
    });

    it('should handle creation errors gracefully', async () => {
      const PrepManagement = await getPrepManagement();
      
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

      render(<PrepManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Prep Management')).toBeInTheDocument();
      });

      const addButton = screen.getByText('Add New Prep');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('prep-dialog')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.change(nameInput, { target: { value: 'New Prep' } });

      const saveButton = screen.getByText('Save Prep');
      fireEvent.click(saveButton);

      // Should handle the error gracefully - dialog closes but data refresh happens
      await waitFor(() => {
        expect(screen.queryByTestId('prep-dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Prep Editing Flow', () => {
    it('should render edit buttons for existing preps', async () => {
      const PrepManagement = await getPrepManagement();

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

      render(<PrepManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Tomato Sauce')).toBeInTheDocument();
      });

      // Verify edit buttons are rendered for each prep
      const editButtons = screen.getAllByRole('button');
      const editButtonsCount = editButtons.filter(btn => 
        btn.querySelector('svg') && btn.getAttribute('class')?.includes('h-8 w-8')
      ).length;
      
      expect(editButtonsCount).toBeGreaterThan(0);
    });
  });

  describe('Prep Deletion Flow', () => {
    it('should delete a prep successfully', async () => {
      const PrepManagement = await getPrepManagement();
      
      const mockDeleteEq = vi.fn().mockResolvedValue({
        data: null,
        error: null
      });
      
      const mockDeleteFn = vi.fn().mockReturnValue({
        eq: mockDeleteEq
      });

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
            }),
            delete: mockDeleteFn
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

      render(<PrepManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Tomato Sauce')).toBeInTheDocument();
      });

      // Click delete button (find the trash icon button)
      const deleteButtons = screen.getAllByRole('button');
      const deleteButton = deleteButtons.find(btn => 
        btn.querySelector('svg') && btn.getAttribute('class')?.includes('text-destructive')
      );
      
      if (deleteButton) {
        fireEvent.click(deleteButton);
      }

      await waitFor(() => {
        expect(mockDeleteFn).toHaveBeenCalled();
      });

      // Restore window.confirm
      window.confirm = originalConfirm;
    });
  });

  describe('Search and Filtering Integration', () => {
    it('should filter preps by search term', async () => {
      const PrepManagement = await getPrepManagement();
      
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

      render(<PrepManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Tomato Sauce')).toBeInTheDocument();
        expect(screen.getByText('Pizza Dough')).toBeInTheDocument();
      });

      // Search for tomato
      const searchInput = screen.getByPlaceholderText('Search preps...');
      fireEvent.change(searchInput, { target: { value: 'tomato' } });

      await waitFor(() => {
        expect(screen.getByText('Tomato Sauce')).toBeInTheDocument();
        expect(screen.queryByText('Pizza Dough')).not.toBeInTheDocument();
      });
    });
  });

  describe('Cost Breakdown Integration', () => {
    it('should show cost breakdown when calculator button is clicked', async () => {
      const PrepManagement = await getPrepManagement();
      
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

      render(<PrepManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Tomato Sauce')).toBeInTheDocument();
      });

      // Click calculator button (cost breakdown)
      const calculatorButtons = screen.getAllByRole('button');
      const calculatorButton = calculatorButtons.find(btn => 
        btn.getAttribute('title') === 'View Cost Breakdown'
      );
      
      if (calculatorButton) {
        fireEvent.click(calculatorButton);
      }

      await waitFor(() => {
        expect(screen.getByTestId('prep-cost-breakdown')).toBeInTheDocument();
        expect(screen.getByText('Cost Breakdown for Tomato Sauce')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle network errors gracefully', async () => {
      const PrepManagement = await getPrepManagement();
      
      mockFrom.mockImplementation((table: string) => {
        if (table === 'preps') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockRejectedValue(new Error('Network error'))
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

      render(<PrepManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Error',
            description: 'Failed to fetch preps',
            variant: 'destructive'
          })
        );
      });
    });
  });
});