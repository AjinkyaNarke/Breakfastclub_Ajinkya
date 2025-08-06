import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { IngredientManagement } from '@/pages/admin/IngredientManagement';
import { StreamlinedIngredientDialog } from '@/components/admin/StreamlinedIngredientDialog';
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
      update: vi.fn(() => Promise.resolve({ data: null, error: null })),
      delete: vi.fn(() => Promise.resolve({ data: null, error: null }))
    }))
  }
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Mock translation
vi.mock('react-i18next', () => ({
  ...vi.importActual('react-i18next'),
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' }
  })
}));

// Mock translation service
vi.mock('@/integrations/deepseek/translate', () => ({
  translateText: vi.fn().mockResolvedValue('Translated text')
}));

// Mock image generation
vi.mock('@/integrations/recraft/generate', () => ({
  generateIngredientImage: vi.fn().mockResolvedValue({
    imageUrl: 'generated-image.jpg',
    cost: 0.10
  })
}));

const mockIngredients = [
  {
    id: '1',
    name: 'Test Tomato',
    name_de: 'Test Tomate',
    name_en: 'Test Tomato',
    description: 'Fresh tomato',
    description_de: 'Frische Tomate',
    description_en: 'Fresh tomato',
    unit: 'piece',
    category_id: 'vegetables',
    allergens: [],
    dietary_properties: ['vegetarian', 'vegan'],
    seasonal_availability: ['summer'],
    cost_per_unit: 0.50,
    supplier_info: 'Local supplier',
    notes: 'Organic',
    is_active: true,
    image_url: 'test-image.jpg',
    image_generated_at: '2025-01-01',
    image_generation_cost: 0.10,
    image_generation_prompt: 'Fresh tomato',
    category: { name: 'Vegetables' }
  }
];

const mockCategories = [
  { id: 'vegetables', name: 'Vegetables', description: 'Fresh vegetables', display_order: 1 },
  { id: 'meat', name: 'Meat', description: 'Fresh meat', display_order: 2 }
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

describe('Ingredient Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Ingredient Creation Flow', () => {
    it('creates ingredient through complete workflow', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockCategories, error: null })
        }),
        insert: vi.fn().mockResolvedValue({ data: { id: 'new-id' }, error: null })
      });

      renderWithProviders(<IngredientManagement />);
      
      await waitFor(() => {
        const addButton = screen.getByText('ingredients.add');
        fireEvent.click(addButton);
      });

      // Fill basic info
      await waitFor(() => {
        const nameInput = screen.getByLabelText('Name *');
        fireEvent.change(nameInput, { target: { value: 'New Ingredient' } });

        const descriptionInput = screen.getByLabelText('Description');
        fireEvent.change(descriptionInput, { target: { value: 'Fresh new ingredient' } });

        const categorySelect = screen.getByLabelText('Category *');
        fireEvent.change(categorySelect, { target: { value: 'vegetables' } });

        const nextButton = screen.getByText('Next');
        fireEvent.click(nextButton);
      });

      // Fill translations
      await waitFor(() => {
        const germanNameInput = screen.getByLabelText('German Name');
        fireEvent.change(germanNameInput, { target: { value: 'Neue Zutat' } });

        const nextButton = screen.getByText('Next');
        fireEvent.click(nextButton);
      });

      // Fill properties
      await waitFor(() => {
        const vegetarianCheckbox = screen.getByLabelText('Vegetarian');
        fireEvent.click(vegetarianCheckbox);

        const saveButton = screen.getByText('Save Ingredient');
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('ingredients');
        expect(supabase.from().insert).toHaveBeenCalledWith([
          expect.objectContaining({
            name: 'New Ingredient',
            description: 'Fresh new ingredient',
            category_id: 'vegetables',
            name_de: 'Neue Zutat',
            dietary_properties: ['vegetarian']
          })
        ]);
      });
    });

    it('handles creation errors gracefully', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockCategories, error: null })
        }),
        insert: vi.fn().mockResolvedValue({ data: null, error: { message: 'Creation failed' } })
      });

      renderWithProviders(<IngredientManagement />);
      
      await waitFor(() => {
        const addButton = screen.getByText('ingredients.add');
        fireEvent.click(addButton);
      });

      // Fill and submit form
      await waitFor(() => {
        const nameInput = screen.getByLabelText('Name *');
        fireEvent.change(nameInput, { target: { value: 'New Ingredient' } });

        const categorySelect = screen.getByLabelText('Category *');
        fireEvent.change(categorySelect, { target: { value: 'vegetables' } });

        const nextButton = screen.getByText('Next');
        fireEvent.click(nextButton);
      });

      await waitFor(() => {
        const nextButton = screen.getByText('Next');
        fireEvent.click(nextButton);
      });

      await waitFor(() => {
        const saveButton = screen.getByText('Save Ingredient');
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(console.error).toHaveBeenCalled();
      });
    });
  });

  describe('Ingredient Editing Flow', () => {
    it('edits ingredient through complete workflow', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockCategories, error: null })
        }),
        update: vi.fn().mockResolvedValue({ data: null, error: null })
      });

      renderWithProviders(<IngredientManagement />);
      
      await waitFor(() => {
        const editButtons = screen.getAllByLabelText('Edit Ingredient');
        fireEvent.click(editButtons[0]);
      });

      // Verify form is pre-filled
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Tomato')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Fresh tomato')).toBeInTheDocument();
      });

      // Modify ingredient
      await waitFor(() => {
        const nameInput = screen.getByLabelText('Name *');
        fireEvent.change(nameInput, { target: { value: 'Updated Tomato' } });

        const nextButton = screen.getByText('Next');
        fireEvent.click(nextButton);
      });

      await waitFor(() => {
        const nextButton = screen.getByText('Next');
        fireEvent.click(nextButton);
      });

      await waitFor(() => {
        const saveButton = screen.getByText('Save Ingredient');
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('ingredients');
        expect(supabase.from().update).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Updated Tomato'
          })
        );
      });
    });
  });

  describe('Ingredient Deletion Flow', () => {
    it('deletes ingredient with confirmation', async () => {
      global.confirm = vi.fn(() => true);

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockIngredients, error: null })
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null })
        })
      });

      renderWithProviders(<IngredientManagement />);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByLabelText('Delete Ingredient');
        fireEvent.click(deleteButtons[0]);
      });

      expect(global.confirm).toHaveBeenCalled();

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('ingredients');
        expect(supabase.from().delete).toHaveBeenCalled();
      });
    });

    it('cancels deletion when user declines', async () => {
      global.confirm = vi.fn(() => false);

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockIngredients, error: null })
        })
      });

      renderWithProviders(<IngredientManagement />);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByLabelText('Delete Ingredient');
        fireEvent.click(deleteButtons[0]);
      });

      expect(global.confirm).toHaveBeenCalled();

      await waitFor(() => {
        expect(supabase.from().delete).not.toHaveBeenCalled();
      });
    });
  });

  describe('Image Generation Flow', () => {
    it('generates image for ingredient', async () => {
      const { generateIngredientImage } = require('@/integrations/recraft/generate');

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockIngredients, error: null })
        }),
        update: vi.fn().mockResolvedValue({ data: null, error: null })
      });

      renderWithProviders(<IngredientManagement />);
      
      await waitFor(() => {
        const generateButtons = screen.getAllByLabelText('Generate Image');
        fireEvent.click(generateButtons[0]);
      });

      await waitFor(() => {
        expect(generateIngredientImage).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Tomato',
            description: 'Fresh tomato'
          })
        );
      });

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('ingredients');
        expect(supabase.from().update).toHaveBeenCalledWith(
          expect.objectContaining({
            image_url: 'generated-image.jpg',
            image_generation_cost: 0.10
          })
        );
      });
    });

    it('handles image generation errors', async () => {
      const { generateIngredientImage } = require('@/integrations/recraft/generate');
      generateIngredientImage.mockRejectedValue(new Error('Generation failed'));

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockIngredients, error: null })
        })
      });

      renderWithProviders(<IngredientManagement />);
      
      await waitFor(() => {
        const generateButtons = screen.getAllByLabelText('Generate Image');
        fireEvent.click(generateButtons[0]);
      });

      await waitFor(() => {
        expect(console.error).toHaveBeenCalled();
      });
    });
  });

  describe('Search and Filtering', () => {
    it('filters ingredients by search term', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockIngredients, error: null })
        })
      });

      renderWithProviders(<IngredientManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Tomato')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('ingredients.searchPlaceholder');
      fireEvent.change(searchInput, { target: { value: 'tomato' } });

      await waitFor(() => {
        expect(screen.getByText('Test Tomato')).toBeInTheDocument();
      });

      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      await waitFor(() => {
        expect(screen.queryByText('Test Tomato')).not.toBeInTheDocument();
      });
    });

    it('filters ingredients by category', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockCategories, error: null })
        })
      });

      renderWithProviders(<IngredientManagement />);
      
      await waitFor(() => {
        const categorySelect = screen.getByText('ingredients.allCategories');
        fireEvent.click(categorySelect);
      });

      await waitFor(() => {
        const vegetablesOption = screen.getByText('Vegetables');
        fireEvent.click(vegetablesOption);
      });

      await waitFor(() => {
        expect(screen.getByText('Vegetables')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles database connection errors', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockRejectedValue(new Error('Database connection failed'))
        })
      });

      renderWithProviders(<IngredientManagement />);
      
      await waitFor(() => {
        expect(console.error).toHaveBeenCalled();
      });
    });

    it('handles API timeout errors', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockImplementation(() => 
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Request timeout')), 100)
            )
          )
        })
      });

      renderWithProviders(<IngredientManagement />);
      
      await waitFor(() => {
        expect(console.error).toHaveBeenCalled();
      });
    });

    it('handles partial data loading', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ 
            data: [mockIngredients[0]], 
            error: null 
          })
        })
      });

      renderWithProviders(<IngredientManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Tomato')).toBeInTheDocument();
      });
    });
  });

  describe('Multi-language Integration', () => {
    it('handles language switching in ingredient management', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockIngredients, error: null })
        })
      });

      renderWithProviders(<IngredientManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Tomato')).toBeInTheDocument();
      });

      // Simulate language change
      const { i18n } = require('react-i18next');
      i18n.changeLanguage('de');

      await waitFor(() => {
        expect(screen.getByText('Test Tomate')).toBeInTheDocument();
      });
    });

    it('handles missing translations gracefully', async () => {
      const ingredientsWithoutTranslation = [
        {
          ...mockIngredients[0],
          name_de: null,
          name_en: null
        }
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: ingredientsWithoutTranslation, error: null })
        })
      });

      renderWithProviders(<IngredientManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Tomato')).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('refreshes ingredient list after creation', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockCategories, error: null })
        }),
        insert: vi.fn().mockResolvedValue({ data: { id: 'new-id' }, error: null })
      });

      renderWithProviders(<IngredientManagement />);
      
      await waitFor(() => {
        const addButton = screen.getByText('ingredients.add');
        fireEvent.click(addButton);
      });

      // Complete creation flow
      await waitFor(() => {
        const nameInput = screen.getByLabelText('Name *');
        fireEvent.change(nameInput, { target: { value: 'New Ingredient' } });

        const categorySelect = screen.getByLabelText('Category *');
        fireEvent.change(categorySelect, { target: { value: 'vegetables' } });

        const nextButton = screen.getByText('Next');
        fireEvent.click(nextButton);
      });

      await waitFor(() => {
        const nextButton = screen.getByText('Next');
        fireEvent.click(nextButton);
      });

      await waitFor(() => {
        const saveButton = screen.getByText('Save Ingredient');
        fireEvent.click(saveButton);
      });

      // Verify list is refreshed
      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('ingredients');
        expect(supabase.from().select).toHaveBeenCalled();
      });
    });
  });
}); 