import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { StreamlinedIngredientDialog } from '@/components/admin/StreamlinedIngredientDialog';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      update: jest.fn(() => Promise.resolve({ data: null, error: null }))
    }))
  }
}));

// Mock toast
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

// Mock translation
jest.mock('@/integrations/deepseek/translate', () => ({
  translateText: jest.fn().mockResolvedValue('Translated text')
}));

// Mock translation hook
jest.mock('react-i18next', () => ({
  ...jest.requireActual('react-i18next'),
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' }
  })
}));

const mockCategories = [
  { id: 'vegetables', name: 'Vegetables', description: 'Fresh vegetables', display_order: 1 },
  { id: 'meat', name: 'Meat', description: 'Fresh meat', display_order: 2 }
];

const mockIngredient = {
  id: '1',
  name: 'Test Tomato',
  name_de: 'Test Tomate',
  name_en: 'Test Tomato',
  description: 'Fresh tomato',
  description_de: 'Frische Tomate',
  description_en: 'Fresh tomato',
  category_id: 'vegetables',
  unit: 'piece',
  cost_per_unit: 0.50,
  allergens: ['gluten'],
  dietary_properties: ['vegetarian', 'vegan'],
  seasonal_availability: ['summer'],
  supplier_info: 'Local supplier',
  notes: 'Organic',
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

describe('StreamlinedIngredientDialog', () => {
  const mockOnOpenChange = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Multi-step Form Navigation', () => {
    test('renders step 1 (Basic Info) by default', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockCategories, error: null })
        })
      });

      renderWithProviders(
        <StreamlinedIngredientDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Basic Info')).toBeInTheDocument();
        expect(screen.getByLabelText('Name *')).toBeInTheDocument();
        expect(screen.getByLabelText('Description')).toBeInTheDocument();
        expect(screen.getByLabelText('Category *')).toBeInTheDocument();
      });
    });

    test('navigates to step 2 (Translations) when Next is clicked', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockCategories, error: null })
        })
      });

      renderWithProviders(
        <StreamlinedIngredientDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        // Fill required fields
        fireEvent.change(screen.getByLabelText('Name *'), {
          target: { value: 'Test Ingredient' }
        });
        fireEvent.change(screen.getByLabelText('Category *'), {
          target: { value: 'vegetables' }
        });

        // Click Next
        const nextButton = screen.getByText('Next');
        fireEvent.click(nextButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Translations')).toBeInTheDocument();
        expect(screen.getByLabelText('German Name')).toBeInTheDocument();
        expect(screen.getByLabelText('English Name')).toBeInTheDocument();
      });
    });

    test('navigates to step 3 (Properties) from step 2', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockCategories, error: null })
        })
      });

      renderWithProviders(
        <StreamlinedIngredientDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        // Fill step 1
        fireEvent.change(screen.getByLabelText('Name *'), {
          target: { value: 'Test Ingredient' }
        });
        fireEvent.change(screen.getByLabelText('Category *'), {
          target: { value: 'vegetables' }
        });
        fireEvent.click(screen.getByText('Next'));

        // Fill step 2
        fireEvent.change(screen.getByLabelText('German Name'), {
          target: { value: 'Test Zutat' }
        });
        fireEvent.click(screen.getByText('Next'));
      });

      await waitFor(() => {
        expect(screen.getByText('Properties')).toBeInTheDocument();
        expect(screen.getByText('Allergens')).toBeInTheDocument();
        expect(screen.getByText('Dietary Properties')).toBeInTheDocument();
      });
    });

    test('allows navigation back to previous steps', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockCategories, error: null })
        })
      });

      renderWithProviders(
        <StreamlinedIngredientDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        // Navigate to step 2
        fireEvent.change(screen.getByLabelText('Name *'), {
          target: { value: 'Test Ingredient' }
        });
        fireEvent.change(screen.getByLabelText('Category *'), {
          target: { value: 'vegetables' }
        });
        fireEvent.click(screen.getByText('Next'));

        // Go back to step 1
        fireEvent.click(screen.getByText('Back'));
      });

      await waitFor(() => {
        expect(screen.getByText('Basic Info')).toBeInTheDocument();
        expect(screen.getByLabelText('Name *')).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    test('requires name field to be filled', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockCategories, error: null })
        })
      });

      renderWithProviders(
        <StreamlinedIngredientDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        // Try to proceed without filling required fields
        fireEvent.click(screen.getByText('Next'));
      });

      await waitFor(() => {
        expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
      });
    });

    test('requires category to be selected', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockCategories, error: null })
        })
      });

      renderWithProviders(
        <StreamlinedIngredientDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        // Fill name but not category
        fireEvent.change(screen.getByLabelText('Name *'), {
          target: { value: 'Test Ingredient' }
        });
        fireEvent.click(screen.getByText('Next'));
      });

      await waitFor(() => {
        expect(screen.getByText('Category is required')).toBeInTheDocument();
      });
    });

    test('validates cost per unit is positive', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockCategories, error: null })
        })
      });

      renderWithProviders(
        <StreamlinedIngredientDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        // Fill required fields
        fireEvent.change(screen.getByLabelText('Name *'), {
          target: { value: 'Test Ingredient' }
        });
        fireEvent.change(screen.getByLabelText('Category *'), {
          target: { value: 'vegetables' }
        });
        fireEvent.change(screen.getByLabelText('Cost per Unit'), {
          target: { value: '-1' }
        });
        fireEvent.click(screen.getByText('Next'));
      });

      await waitFor(() => {
        expect(screen.getByText('Cost must be a positive number')).toBeInTheDocument();
      });
    });
  });

  describe('Auto-translation Functionality', () => {
    test('auto-translates name to German when German translation button is clicked', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockCategories, error: null })
        })
      });

      renderWithProviders(
        <StreamlinedIngredientDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        // Fill name and navigate to translations step
        fireEvent.change(screen.getByLabelText('Name *'), {
          target: { value: 'Fresh Tomato' }
        });
        fireEvent.change(screen.getByLabelText('Category *'), {
          target: { value: 'vegetables' }
        });
        fireEvent.click(screen.getByText('Next'));

        // Click German translation button
        const germanTranslateButton = screen.getByText('Translate to German');
        fireEvent.click(germanTranslateButton);
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('Translated text')).toBeInTheDocument();
      });
    });

    test('auto-translates description to German', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockCategories, error: null })
        })
      });

      renderWithProviders(
        <StreamlinedIngredientDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        // Fill required fields and navigate to translations
        fireEvent.change(screen.getByLabelText('Name *'), {
          target: { value: 'Test Ingredient' }
        });
        fireEvent.change(screen.getByLabelText('Description'), {
          target: { value: 'Fresh organic ingredient' }
        });
        fireEvent.change(screen.getByLabelText('Category *'), {
          target: { value: 'vegetables' }
        });
        fireEvent.click(screen.getByText('Next'));

        // Click description translation button
        const descTranslateButton = screen.getByText('Translate Description');
        fireEvent.click(descTranslateButton);
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('Translated text')).toBeInTheDocument();
      });
    });
  });

  describe('Property Selection', () => {
    test('allows selection of allergens', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockCategories, error: null })
        })
      });

      renderWithProviders(
        <StreamlinedIngredientDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        // Navigate to properties step
        fireEvent.change(screen.getByLabelText('Name *'), {
          target: { value: 'Test Ingredient' }
        });
        fireEvent.change(screen.getByLabelText('Category *'), {
          target: { value: 'vegetables' }
        });
        fireEvent.click(screen.getByText('Next'));
        fireEvent.click(screen.getByText('Next'));

        // Select allergens
        const glutenCheckbox = screen.getByLabelText('Gluten');
        fireEvent.click(glutenCheckbox);
      });

      await waitFor(() => {
        expect(glutenCheckbox).toBeChecked();
      });
    });

    test('allows selection of dietary properties', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockCategories, error: null })
        })
      });

      renderWithProviders(
        <StreamlinedIngredientDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        // Navigate to properties step
        fireEvent.change(screen.getByLabelText('Name *'), {
          target: { value: 'Test Ingredient' }
        });
        fireEvent.change(screen.getByLabelText('Category *'), {
          target: { value: 'vegetables' }
        });
        fireEvent.click(screen.getByText('Next'));
        fireEvent.click(screen.getByText('Next'));

        // Select dietary properties
        const vegetarianCheckbox = screen.getByLabelText('Vegetarian');
        const veganCheckbox = screen.getByLabelText('Vegan');
        fireEvent.click(vegetarianCheckbox);
        fireEvent.click(veganCheckbox);
      });

      await waitFor(() => {
        expect(vegetarianCheckbox).toBeChecked();
        expect(veganCheckbox).toBeChecked();
      });
    });

    test('allows selection of seasonal availability', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockCategories, error: null })
        })
      });

      renderWithProviders(
        <StreamlinedIngredientDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        // Navigate to properties step
        fireEvent.change(screen.getByLabelText('Name *'), {
          target: { value: 'Test Ingredient' }
        });
        fireEvent.change(screen.getByLabelText('Category *'), {
          target: { value: 'vegetables' }
        });
        fireEvent.click(screen.getByText('Next'));
        fireEvent.click(screen.getByText('Next'));

        // Select seasons
        const summerCheckbox = screen.getByLabelText('Summer');
        fireEvent.click(summerCheckbox);
      });

      await waitFor(() => {
        expect(summerCheckbox).toBeChecked();
      });
    });
  });

  describe('Form Submission', () => {
    test('submits form successfully with all required data', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockCategories, error: null })
        }),
        insert: jest.fn().mockResolvedValue({ data: { id: 'new-id' }, error: null })
      });

      renderWithProviders(
        <StreamlinedIngredientDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        // Fill all required fields
        fireEvent.change(screen.getByLabelText('Name *'), {
          target: { value: 'Test Ingredient' }
        });
        fireEvent.change(screen.getByLabelText('Category *'), {
          target: { value: 'vegetables' }
        });
        fireEvent.click(screen.getByText('Next'));

        // Fill translations
        fireEvent.change(screen.getByLabelText('German Name'), {
          target: { value: 'Test Zutat' }
        });
        fireEvent.click(screen.getByText('Next'));

        // Fill properties
        const glutenCheckbox = screen.getByLabelText('Gluten');
        fireEvent.click(glutenCheckbox);

        // Submit form
        fireEvent.click(screen.getByText('Save Ingredient'));
      });

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });

    test('updates existing ingredient when editing', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockCategories, error: null })
        }),
        update: jest.fn().mockResolvedValue({ data: null, error: null })
      });

      renderWithProviders(
        <StreamlinedIngredientDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
          ingredient={mockIngredient}
        />
      );

      await waitFor(() => {
        // Verify form is pre-filled
        expect(screen.getByDisplayValue('Test Tomato')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Fresh tomato')).toBeInTheDocument();

        // Submit form
        fireEvent.click(screen.getByText('Save Ingredient'));
      });

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('Error Handling', () => {
    test('handles database errors during save', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockCategories, error: null })
        }),
        insert: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
      });

      renderWithProviders(
        <StreamlinedIngredientDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        // Fill required fields and submit
        fireEvent.change(screen.getByLabelText('Name *'), {
          target: { value: 'Test Ingredient' }
        });
        fireEvent.change(screen.getByLabelText('Category *'), {
          target: { value: 'vegetables' }
        });
        fireEvent.click(screen.getByText('Next'));
        fireEvent.click(screen.getByText('Next'));
        fireEvent.click(screen.getByText('Save Ingredient'));
      });

      await waitFor(() => {
        expect(console.error).toHaveBeenCalled();
      });
    });

    test('handles translation API errors gracefully', async () => {
      const { translateText } = require('@/integrations/deepseek/translate');
      translateText.mockRejectedValue(new Error('Translation failed'));

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockCategories, error: null })
        })
      });

      renderWithProviders(
        <StreamlinedIngredientDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        // Navigate to translations step
        fireEvent.change(screen.getByLabelText('Name *'), {
          target: { value: 'Test Ingredient' }
        });
        fireEvent.change(screen.getByLabelText('Category *'), {
          target: { value: 'vegetables' }
        });
        fireEvent.click(screen.getByText('Next'));

        // Try translation
        const translateButton = screen.getByText('Translate to German');
        fireEvent.click(translateButton);
      });

      await waitFor(() => {
        expect(console.error).toHaveBeenCalled();
      });
    });
  });
}); 