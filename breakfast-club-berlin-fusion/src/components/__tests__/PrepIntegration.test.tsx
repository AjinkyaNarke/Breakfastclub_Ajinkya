import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { PrepManagement } from '@/pages/admin/PrepManagement';
import { EnhancedPrepDialog } from '@/components/admin/EnhancedPrepDialog';
import { supabase } from '@/integrations/supabase/client';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      update: vi.fn(() => Promise.resolve({ data: null, error: null })),
      delete: vi.fn(() => Promise.resolve({ data: null, error: null }))
    }))
  }
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: vi.fn()
}));

// Mock translation
vi.mock('react-i18next', () => ({
  ...vi.importActual('react-i18next'),
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' }
  })
}));

// Mock localization hook
vi.mock('@/hooks/useLocalization', () => ({
  useLocalization: () => ({
    getLocalizedPrepText: (prep: any, field: string) => prep[field] || prep.name,
    currentLanguage: 'en'
  })
}));

// Mock AI suggestion function
vi.mock('@/integrations/deepseek/analyze', () => ({
  analyzePrepIngredients: vi.fn().mockResolvedValue({
    suggestions: [
      {
        ingredient_id: '1',
        name: 'Test Ingredient',
        quantity: 100,
        unit: 'g',
        confidence: 0.9,
        reasoning: 'Common ingredient for this type of prep'
      }
    ]
  })
}));

const mockPreps = [
  {
    id: '1',
    name: 'Test Prep',
    name_de: 'Test Zubereitung',
    name_en: 'Test Prep',
    description: 'Test preparation description',
    description_de: 'Test Zubereitungsbeschreibung',
    description_en: 'Test preparation description',
    batch_yield: 1,
    batch_yield_unit: 'kg',
    cost_per_batch: 15.50,
    notes: 'Test notes',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    prep_ingredients: [
      {
        id: '1',
        quantity: 500,
        unit: 'g',
        notes: 'Fresh ingredient',
        ingredient: {
          id: '1',
          name: 'Test Ingredient',
          name_en: 'Test Ingredient',
          name_de: 'Test Zutat',
          unit: 'g',
          cost_per_unit: 0.02
        }
      }
    ]
  }
];

const mockIngredients = [
  {
    id: '1',
    name: 'Test Ingredient',
    name_en: 'Test Ingredient',
    name_de: 'Test Zutat',
    unit: 'g',
    cost_per_unit: 0.02
  },
  {
    id: '2',
    name: 'Another Ingredient',
    name_en: 'Another Ingredient',
    name_de: 'Andere Zutat',
    unit: 'ml',
    cost_per_unit: 0.01
  }
];

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </I18nextProvider>
    </QueryClientProvider>
  );
};

describe('Prep Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Prep Creation Flow', () => {
    it('creates prep through complete workflow', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockIngredients, error: null })
          })
        }),
        insert: vi.fn().mockResolvedValue({ data: { id: 'new-id' }, error: null })
      });

      renderWithProviders(<PrepManagement />);
      
      await waitFor(() => {
        const addButton = screen.getByText('preps.add');
        fireEvent.click(addButton);
      });

      // Fill prep details
      await waitFor(() => {
        const nameInput = screen.getByLabelText('Name *');
        fireEvent.change(nameInput, { target: { value: 'New Prep' } });

        const descriptionInput = screen.getByLabelText('Description');
        fireEvent.change(descriptionInput, { target: { value: 'Fresh new prep' } });

        const yieldInput = screen.getByLabelText('Batch Yield');
        fireEvent.change(yieldInput, { target: { value: '2' } });

        const yieldUnitSelect = screen.getByLabelText('Yield Unit');
        fireEvent.change(yieldUnitSelect, { target: { value: 'kg' } });
      });

      // Add ingredients manually
      await waitFor(() => {
        const manualAddButton = screen.getByText('Add Manually');
        fireEvent.click(manualAddButton);
      });

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search ingredients...');
        fireEvent.change(searchInput, { target: { value: 'test' } });
      });

      await waitFor(() => {
        const ingredientOption = screen.getByText('Test Ingredient');
        fireEvent.click(ingredientOption);
      });

      await waitFor(() => {
        const quantityInput = screen.getByLabelText('Quantity');
        fireEvent.change(quantityInput, { target: { value: '1000' } });

        const unitSelect = screen.getByLabelText('Unit');
        fireEvent.change(unitSelect, { target: { value: 'g' } });

        const addButton = screen.getByText('Add Ingredient');
        fireEvent.click(addButton);
      });

      // Save prep
      await waitFor(() => {
        const saveButton = screen.getByText('Save Prep');
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('preps');
        expect(supabase.from().insert).toHaveBeenCalledWith([
          expect.objectContaining({
            name: 'New Prep',
            description: 'Fresh new prep',
            batch_yield: 2,
            batch_yield_unit: 'kg'
          })
        ]);
      });
    });

    it('handles creation errors gracefully', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockIngredients, error: null })
          })
        }),
        insert: vi.fn().mockResolvedValue({ data: null, error: { message: 'Creation failed' } })
      });

      renderWithProviders(<PrepManagement />);
      
      await waitFor(() => {
        const addButton = screen.getByText('preps.add');
        fireEvent.click(addButton);
      });

      // Fill and submit form
      await waitFor(() => {
        const nameInput = screen.getByLabelText('Name *');
        fireEvent.change(nameInput, { target: { value: 'New Prep' } });

        const yieldInput = screen.getByLabelText('Batch Yield');
        fireEvent.change(yieldInput, { target: { value: '1' } });

        const saveButton = screen.getByText('Save Prep');
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(console.error).toHaveBeenCalled();
      });
    });
  });

  describe('Ingredient Selection Flow', () => {
    it('selects ingredients for prep', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockIngredients, error: null })
          })
        })
      });

      renderWithProviders(<PrepManagement />);
      
      await waitFor(() => {
        const addButton = screen.getByText('preps.add');
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        const manualAddButton = screen.getByText('Add Manually');
        fireEvent.click(manualAddButton);
      });

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search ingredients...');
        fireEvent.change(searchInput, { target: { value: 'test' } });
      });

      await waitFor(() => {
        const ingredientOption = screen.getByText('Test Ingredient');
        fireEvent.click(ingredientOption);
      });

      await waitFor(() => {
        const quantityInput = screen.getByLabelText('Quantity');
        fireEvent.change(quantityInput, { target: { value: '500' } });

        const unitSelect = screen.getByLabelText('Unit');
        fireEvent.change(unitSelect, { target: { value: 'g' } });

        const addButton = screen.getByText('Add Ingredient');
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Ingredient')).toBeInTheDocument();
        expect(screen.getByText('500 g')).toBeInTheDocument();
      });
    });

    it('validates ingredient selection', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockIngredients, error: null })
          })
        })
      });

      renderWithProviders(<PrepManagement />);
      
      await waitFor(() => {
        const addButton = screen.getByText('preps.add');
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        const manualAddButton = screen.getByText('Add Manually');
        fireEvent.click(manualAddButton);
      });

      await waitFor(() => {
        // Try to add without selecting ingredient
        const addButton = screen.getByText('Add Ingredient');
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Please select an ingredient')).toBeInTheDocument();
      });
    });
  });

  describe('Cost Calculation Flow', () => {
    it('calculates total cost from ingredients', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockIngredients, error: null })
          })
        })
      });

      renderWithProviders(<PrepManagement />);
      
      await waitFor(() => {
        const addButton = screen.getByText('preps.add');
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        const manualAddButton = screen.getByText('Add Manually');
        fireEvent.click(manualAddButton);
      });

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search ingredients...');
        fireEvent.change(searchInput, { target: { value: 'test' } });
      });

      await waitFor(() => {
        const ingredientOption = screen.getByText('Test Ingredient');
        fireEvent.click(ingredientOption);
      });

      await waitFor(() => {
        const quantityInput = screen.getByLabelText('Quantity');
        fireEvent.change(quantityInput, { target: { value: '1000' } });

        const unitSelect = screen.getByLabelText('Unit');
        fireEvent.change(unitSelect, { target: { value: 'g' } });

        const addButton = screen.getByText('Add Ingredient');
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        // Verify cost calculation (1000g * €0.02/g = €20.00)
        expect(screen.getByText('€20.00')).toBeInTheDocument();
      });
    });

    it('updates cost when batch yield changes', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockIngredients, error: null })
          })
        })
      });

      renderWithProviders(<PrepManagement />);
      
      await waitFor(() => {
        const addButton = screen.getByText('preps.add');
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        // Set batch yield
        const yieldInput = screen.getByLabelText('Batch Yield');
        fireEvent.change(yieldInput, { target: { value: '2' } });

        const yieldUnitSelect = screen.getByLabelText('Yield Unit');
        fireEvent.change(yieldUnitSelect, { target: { value: 'kg' } });
      });

      await waitFor(() => {
        const manualAddButton = screen.getByText('Add Manually');
        fireEvent.click(manualAddButton);
      });

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search ingredients...');
        fireEvent.change(searchInput, { target: { value: 'test' } });
      });

      await waitFor(() => {
        const ingredientOption = screen.getByText('Test Ingredient');
        fireEvent.click(ingredientOption);
      });

      await waitFor(() => {
        const quantityInput = screen.getByLabelText('Quantity');
        fireEvent.change(quantityInput, { target: { value: '1000' } });

        const unitSelect = screen.getByLabelText('Unit');
        fireEvent.change(unitSelect, { target: { value: 'g' } });

        const addButton = screen.getByText('Add Ingredient');
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        // Verify cost per unit calculation (€20.00 total / 2kg = €10.00/kg)
        expect(screen.getByText('€10.00/2kg')).toBeInTheDocument();
      });
    });
  });

  describe('AI Suggestion Flow', () => {
    it('analyzes prep description and suggests ingredients', async () => {
      const { analyzePrepIngredients } = require('@/integrations/deepseek/analyze');

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockIngredients, error: null })
          })
        })
      });

      renderWithProviders(<PrepManagement />);
      
      await waitFor(() => {
        const addButton = screen.getByText('preps.add');
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        const descriptionInput = screen.getByLabelText('Description');
        fireEvent.change(descriptionInput, {
          target: { value: 'A delicious preparation with fresh ingredients' }
        });

        const analyzeButton = screen.getByText('Analyze Ingredients');
        fireEvent.click(analyzeButton);
      });

      await waitFor(() => {
        expect(analyzePrepIngredients).toHaveBeenCalledWith(
          expect.objectContaining({
            description: 'A delicious preparation with fresh ingredients'
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Test Ingredient')).toBeInTheDocument();
        expect(screen.getByText('100 g')).toBeInTheDocument();
        expect(screen.getByText('90% confidence')).toBeInTheDocument();
      });
    });

    it('allows accepting AI suggestions', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockIngredients, error: null })
          })
        })
      });

      renderWithProviders(<PrepManagement />);
      
      await waitFor(() => {
        const addButton = screen.getByText('preps.add');
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        const descriptionInput = screen.getByLabelText('Description');
        fireEvent.change(descriptionInput, {
          target: { value: 'Test preparation' }
        });

        const analyzeButton = screen.getByText('Analyze Ingredients');
        fireEvent.click(analyzeButton);
      });

      await waitFor(() => {
        const acceptButton = screen.getByText('Accept');
        fireEvent.click(acceptButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Ingredient')).toBeInTheDocument();
        expect(screen.getByText('100 g')).toBeInTheDocument();
      });
    });

    it('handles AI analysis errors gracefully', async () => {
      const { analyzePrepIngredients } = require('@/integrations/deepseek/analyze');
      analyzePrepIngredients.mockRejectedValue(new Error('AI analysis failed'));

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockIngredients, error: null })
          })
        })
      });

      renderWithProviders(<PrepManagement />);
      
      await waitFor(() => {
        const addButton = screen.getByText('preps.add');
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        const descriptionInput = screen.getByLabelText('Description');
        fireEvent.change(descriptionInput, {
          target: { value: 'Test preparation' }
        });

        const analyzeButton = screen.getByText('Analyze Ingredients');
        fireEvent.click(analyzeButton);
      });

      await waitFor(() => {
        expect(console.error).toHaveBeenCalled();
      });
    });
  });

  describe('Batch Yield Management', () => {
    it('manages batch yield calculations', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockIngredients, error: null })
          })
        })
      });

      renderWithProviders(<PrepManagement />);
      
      await waitFor(() => {
        const addButton = screen.getByText('preps.add');
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        // Set batch yield
        const yieldInput = screen.getByLabelText('Batch Yield');
        fireEvent.change(yieldInput, { target: { value: '5' } });

        const yieldUnitSelect = screen.getByLabelText('Yield Unit');
        fireEvent.change(yieldUnitSelect, { target: { value: 'kg' } });
      });

      await waitFor(() => {
        const manualAddButton = screen.getByText('Add Manually');
        fireEvent.click(manualAddButton);
      });

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search ingredients...');
        fireEvent.change(searchInput, { target: { value: 'test' } });
      });

      await waitFor(() => {
        const ingredientOption = screen.getByText('Test Ingredient');
        fireEvent.click(ingredientOption);
      });

      await waitFor(() => {
        const quantityInput = screen.getByLabelText('Quantity');
        fireEvent.change(quantityInput, { target: { value: '2500' } });

        const unitSelect = screen.getByLabelText('Unit');
        fireEvent.change(unitSelect, { target: { value: 'g' } });

        const addButton = screen.getByText('Add Ingredient');
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        // Verify cost per unit calculation (€50.00 total / 5kg = €10.00/kg)
        expect(screen.getByText('€10.00/5kg')).toBeInTheDocument();
      });
    });

    it('validates batch yield input', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockIngredients, error: null })
          })
        })
      });

      renderWithProviders(<PrepManagement />);
      
      await waitFor(() => {
        const addButton = screen.getByText('preps.add');
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        // Try to set invalid batch yield
        const yieldInput = screen.getByLabelText('Batch Yield');
        fireEvent.change(yieldInput, { target: { value: '-1' } });

        const saveButton = screen.getByText('Save Prep');
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Amount must be greater than 0')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles database connection errors', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockRejectedValue(new Error('Database connection failed'))
          })
        })
      });

      renderWithProviders(<PrepManagement />);
      
      await waitFor(() => {
        expect(console.error).toHaveBeenCalled();
      });
    });

    it('handles ingredient fetch errors', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Fetch failed' } })
          })
        })
      });

      renderWithProviders(<PrepManagement />);
      
      await waitFor(() => {
        const addButton = screen.getByText('preps.add');
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        expect(console.error).toHaveBeenCalled();
      });
    });

    it('handles cost calculation errors', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockIngredients, error: null })
          })
        })
      });

      renderWithProviders(<PrepManagement />);
      
      await waitFor(() => {
        const addButton = screen.getByText('preps.add');
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        const manualAddButton = screen.getByText('Add Manually');
        fireEvent.click(manualAddButton);
      });

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search ingredients...');
        fireEvent.change(searchInput, { target: { value: 'test' } });
      });

      await waitFor(() => {
        const ingredientOption = screen.getByText('Test Ingredient');
        fireEvent.click(ingredientOption);
      });

      await waitFor(() => {
        // Set invalid quantity
        const quantityInput = screen.getByLabelText('Quantity');
        fireEvent.change(quantityInput, { target: { value: 'invalid' } });

        const addButton = screen.getByText('Add Ingredient');
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid quantity')).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('refreshes prep list after creation', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockIngredients, error: null })
          })
        }),
        insert: vi.fn().mockResolvedValue({ data: { id: 'new-id' }, error: null })
      });

      renderWithProviders(<PrepManagement />);
      
      await waitFor(() => {
        const addButton = screen.getByText('preps.add');
        fireEvent.click(addButton);
      });

      // Complete creation flow
      await waitFor(() => {
        const nameInput = screen.getByLabelText('Name *');
        fireEvent.change(nameInput, { target: { value: 'New Prep' } });

        const yieldInput = screen.getByLabelText('Batch Yield');
        fireEvent.change(yieldInput, { target: { value: '1' } });

        const saveButton = screen.getByText('Save Prep');
        fireEvent.click(saveButton);
      });

      // Verify list is refreshed
      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('preps');
        expect(supabase.from().select).toHaveBeenCalled();
      });
    });
  });
}); 