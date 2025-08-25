import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { EnhancedPrepDialog } from '@/components/admin/EnhancedPrepDialog';
import { supabase } from '@/integrations/supabase/client';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      update: vi.fn(() => Promise.resolve({ data: null, error: null }))
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
    getLocalizedText: (text: string) => text,
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

const mockPrep = {
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
  is_active: true
};

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
        {component}
      </I18nextProvider>
    </QueryClientProvider>
  );
};

describe('EnhancedPrepDialog', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AI Ingredient Suggestion', () => {
    it('analyzes prep description and suggests ingredients', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockIngredients, error: null })
        })
      });

      renderWithProviders(
        <EnhancedPrepDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        // Fill prep description
        const descriptionInput = screen.getByLabelText('Description');
        fireEvent.change(descriptionInput, {
          target: { value: 'A delicious preparation with fresh ingredients' }
        });

        // Click analyze button
        const analyzeButton = screen.getByText('Analyze Ingredients');
        fireEvent.click(analyzeButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Ingredient')).toBeInTheDocument();
        expect(screen.getByText('100 g')).toBeInTheDocument();
        expect(screen.getByText('90% confidence')).toBeInTheDocument();
      });
    });

    it('displays confidence scores for suggestions', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockIngredients, error: null })
        })
      });

      renderWithProviders(
        <EnhancedPrepDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        const descriptionInput = screen.getByLabelText('Description');
        fireEvent.change(descriptionInput, {
          target: { value: 'Test preparation' }
        });

        const analyzeButton = screen.getByText('Analyze Ingredients');
        fireEvent.click(analyzeButton);
      });

      await waitFor(() => {
        expect(screen.getByText('90% confidence')).toBeInTheDocument();
      });
    });

    it('allows accepting AI suggestions', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockIngredients, error: null })
        })
      });

      renderWithProviders(
        <EnhancedPrepDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

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

    it('allows rejecting AI suggestions', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockIngredients, error: null })
        })
      });

      renderWithProviders(
        <EnhancedPrepDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        const descriptionInput = screen.getByLabelText('Description');
        fireEvent.change(descriptionInput, {
          target: { value: 'Test preparation' }
        });

        const analyzeButton = screen.getByText('Analyze Ingredients');
        fireEvent.click(analyzeButton);
      });

      await waitFor(() => {
        const rejectButton = screen.getByText('Reject');
        fireEvent.click(rejectButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('Test Ingredient')).not.toBeInTheDocument();
      });
    });
  });

  describe('Manual Ingredient Addition', () => {
    it('allows manual ingredient search and selection', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockIngredients, error: null })
        })
      });

      renderWithProviders(
        <EnhancedPrepDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        // Click manual add button
        const manualAddButton = screen.getByText('Add Manually');
        fireEvent.click(manualAddButton);
      });

      await waitFor(() => {
        // Search for ingredient
        const searchInput = screen.getByPlaceholderText('Search ingredients...');
        fireEvent.change(searchInput, { target: { value: 'test' } });
      });

      await waitFor(() => {
        // Select ingredient
        const ingredientOption = screen.getByText('Test Ingredient');
        fireEvent.click(ingredientOption);
      });

      await waitFor(() => {
        // Set quantity
        const quantityInput = screen.getByLabelText('Quantity');
        fireEvent.change(quantityInput, { target: { value: '200' } });

        // Set unit
        const unitSelect = screen.getByLabelText('Unit');
        fireEvent.change(unitSelect, { target: { value: 'g' } });

        // Add ingredient
        const addButton = screen.getByText('Add Ingredient');
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Ingredient')).toBeInTheDocument();
        expect(screen.getByText('200 g')).toBeInTheDocument();
      });
    });

    it('validates manual ingredient input', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockIngredients, error: null })
        })
      });

      renderWithProviders(
        <EnhancedPrepDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

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

  describe('Cost Breakdown Calculation', () => {
    it('calculates total cost from ingredients', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockIngredients, error: null })
        })
      });

      renderWithProviders(
        <EnhancedPrepDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        // Add ingredients manually
        const manualAddButton = screen.getByText('Add Manually');
        fireEvent.click(manualAddButton);
      });

      await waitFor(() => {
        // Add first ingredient
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
        // Verify cost calculation
        expect(screen.getByText('€10.00')).toBeInTheDocument(); // 500g * €0.02/g
      });
    });

    it('updates cost when batch yield changes', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockIngredients, error: null })
        })
      });

      renderWithProviders(
        <EnhancedPrepDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        // Set batch yield
        const yieldInput = screen.getByLabelText('Batch Yield');
        fireEvent.change(yieldInput, { target: { value: '2' } });

        const yieldUnitSelect = screen.getByLabelText('Yield Unit');
        fireEvent.change(yieldUnitSelect, { target: { value: 'kg' } });
      });

      await waitFor(() => {
        // Add ingredient
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
        // Verify cost per unit calculation
        expect(screen.getByText('€10.00/2kg')).toBeInTheDocument(); // €20.00 total / 2kg
      });
    });
  });

  describe('Form Validation', () => {
    it('requires prep name', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockIngredients, error: null })
        })
      });

      renderWithProviders(
        <EnhancedPrepDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        // Try to submit without name
        const submitButton = screen.getByText('Save Prep');
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
      });
    });

    it('requires batch yield', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockIngredients, error: null })
        })
      });

      renderWithProviders(
        <EnhancedPrepDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        // Fill name but not batch yield
        const nameInput = screen.getByLabelText('Name *');
        fireEvent.change(nameInput, { target: { value: 'Test Prep' } });

        const submitButton = screen.getByText('Save Prep');
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Batch yield is required')).toBeInTheDocument();
      });
    });

    it('validates batch yield amount is positive', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockIngredients, error: null })
        })
      });

      renderWithProviders(
        <EnhancedPrepDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        // Fill required fields with invalid batch yield
        const nameInput = screen.getByLabelText('Name *');
        fireEvent.change(nameInput, { target: { value: 'Test Prep' } });

        const yieldInput = screen.getByLabelText('Batch Yield');
        fireEvent.change(yieldInput, { target: { value: '-1' } });

        const submitButton = screen.getByText('Save Prep');
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Amount must be greater than 0')).toBeInTheDocument();
      });
    });
  });

  describe('Multi-language Support', () => {
    it('displays localized ingredient names', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockIngredients, error: null })
        })
      });

      renderWithProviders(
        <EnhancedPrepDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        const manualAddButton = screen.getByText('Add Manually');
        fireEvent.click(manualAddButton);
      });

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search ingredients...');
        fireEvent.change(searchInput, { target: { value: 'test' } });
      });

      await waitFor(() => {
        // Should display localized name based on current language
        expect(screen.getByText('Test Ingredient')).toBeInTheDocument();
      });
    });

    it('handles missing translations gracefully', async () => {
      const ingredientsWithoutTranslation = [
        {
          ...mockIngredients[0],
          name_en: null,
          name_de: null
        }
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: ingredientsWithoutTranslation, error: null })
        })
      });

      renderWithProviders(
        <EnhancedPrepDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        const manualAddButton = screen.getByText('Add Manually');
        fireEvent.click(manualAddButton);
      });

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search ingredients...');
        fireEvent.change(searchInput, { target: { value: 'test' } });
      });

      await waitFor(() => {
        // Should fallback to base name
        expect(screen.getByText('Test Ingredient')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles AI analysis failures gracefully', async () => {
      const { analyzePrepIngredients } = require('@/integrations/deepseek/analyze');
      analyzePrepIngredients.mockRejectedValue(new Error('AI analysis failed'));

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockIngredients, error: null })
        })
      });

      renderWithProviders(
        <EnhancedPrepDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

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

    it('handles database errors during save', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockIngredients, error: null })
        }),
        insert: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
      });

      renderWithProviders(
        <EnhancedPrepDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        // Fill required fields
        const nameInput = screen.getByLabelText('Name *');
        fireEvent.change(nameInput, { target: { value: 'Test Prep' } });

        const yieldInput = screen.getByLabelText('Batch Yield');
        fireEvent.change(yieldInput, { target: { value: '1' } });

        const submitButton = screen.getByText('Save Prep');
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(console.error).toHaveBeenCalled();
      });
    });
  });
}); 