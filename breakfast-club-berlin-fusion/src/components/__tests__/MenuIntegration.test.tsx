import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { MenuManagement } from '@/pages/admin/MenuManagement';
import { EnhancedMenuItemDialog } from '@/components/admin/EnhancedMenuItemDialog';
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

// Mock image generation
vi.mock('@/integrations/recraft/generate', () => ({
  generateMenuItemImage: vi.fn().mockResolvedValue({
    imageUrl: 'generated-menu-image.jpg',
    cost: 0.15
  })
}));

const mockMenuItems = [
  {
    id: '1',
    name: 'Test Dish',
    name_de: 'Test Gericht',
    name_en: 'Test Dish',
    description: 'Delicious test dish',
    description_de: 'Leckeres Testgericht',
    description_en: 'Delicious test dish',
    image_url: 'test-image.jpg',
    regular_price: 12.50,
    student_price: 8.50,
    is_featured: true,
    is_available: true,
    dietary_tags: ['vegetarian', 'vegan'],
    display_order: 1,
    category_id: 'breakfast',
    cuisine_type: 'fusion',
    category: {
      name: 'Breakfast',
      id: 'breakfast'
    }
  }
];

const mockCategories = [
  { id: 'breakfast', name: 'Breakfast', display_order: 1 },
  { id: 'lunch', name: 'Lunch', display_order: 2 },
  { id: 'dinner', name: 'Dinner', display_order: 3 }
];

const mockIngredients = [
  {
    id: '1',
    name: 'Test Ingredient',
    name_en: 'Test Ingredient',
    name_de: 'Test Zutat',
    unit: 'g',
    cost_per_unit: 0.02
  }
];

const mockPreps = [
  {
    id: '1',
    name: 'Test Prep',
    name_en: 'Test Prep',
    name_de: 'Test Zubereitung',
    batch_yield: 1,
    batch_yield_unit: 'kg',
    cost_per_batch: 15.50
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

describe('Menu Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Menu Item Creation Flow', () => {
    it('creates menu item through complete workflow', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockCategories, error: null })
        }),
        insert: vi.fn().mockResolvedValue({ data: { id: 'new-id' }, error: null })
      });

      renderWithProviders(<MenuManagement />);
      
      await waitFor(() => {
        const addButton = screen.getByText('menu.add');
        fireEvent.click(addButton);
      });

      // Fill menu item details
      await waitFor(() => {
        const nameInput = screen.getByLabelText('Name *');
        fireEvent.change(nameInput, { target: { value: 'New Dish' } });

        const descriptionInput = screen.getByLabelText('Description');
        fireEvent.change(descriptionInput, { target: { value: 'Delicious new dish' } });

        const regularPriceInput = screen.getByLabelText('Regular Price');
        fireEvent.change(regularPriceInput, { target: { value: '15.00' } });

        const studentPriceInput = screen.getByLabelText('Student Price');
        fireEvent.change(studentPriceInput, { target: { value: '10.00' } });

        const categorySelect = screen.getByLabelText('Category');
        fireEvent.change(categorySelect, { target: { value: 'breakfast' } });
      });

      // Add ingredients
      await waitFor(() => {
        const addIngredientButton = screen.getByText('Add Ingredient');
        fireEvent.click(addIngredientButton);
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
        fireEvent.change(quantityInput, { target: { value: '100' } });

        const addButton = screen.getByText('Add');
        fireEvent.click(addButton);
      });

      // Save menu item
      await waitFor(() => {
        const saveButton = screen.getByText('Save Menu Item');
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('menu_items');
        expect(supabase.from().insert).toHaveBeenCalledWith([
          expect.objectContaining({
            name: 'New Dish',
            description: 'Delicious new dish',
            regular_price: 15.00,
            student_price: 10.00,
            category_id: 'breakfast'
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

      renderWithProviders(<MenuManagement />);
      
      await waitFor(() => {
        const addButton = screen.getByText('menu.add');
        fireEvent.click(addButton);
      });

      // Fill and submit form
      await waitFor(() => {
        const nameInput = screen.getByLabelText('Name *');
        fireEvent.change(nameInput, { target: { value: 'New Dish' } });

        const regularPriceInput = screen.getByLabelText('Regular Price');
        fireEvent.change(regularPriceInput, { target: { value: '15.00' } });

        const saveButton = screen.getByText('Save Menu Item');
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(console.error).toHaveBeenCalled();
      });
    });
  });

  describe('Ingredient/Prep Selection Flow', () => {
    it('selects ingredients for menu item', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockIngredients, error: null })
        })
      });

      renderWithProviders(<MenuManagement />);
      
      await waitFor(() => {
        const addButton = screen.getByText('menu.add');
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        const addIngredientButton = screen.getByText('Add Ingredient');
        fireEvent.click(addIngredientButton);
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
        fireEvent.change(quantityInput, { target: { value: '150' } });

        const addButton = screen.getByText('Add');
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Ingredient')).toBeInTheDocument();
        expect(screen.getByText('150 g')).toBeInTheDocument();
      });
    });

    it('selects preps for menu item', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockPreps, error: null })
        })
      });

      renderWithProviders(<MenuManagement />);
      
      await waitFor(() => {
        const addButton = screen.getByText('menu.add');
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        const addPrepButton = screen.getByText('Add Prep');
        fireEvent.click(addPrepButton);
      });

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search preps...');
        fireEvent.change(searchInput, { target: { value: 'test' } });
      });

      await waitFor(() => {
        const prepOption = screen.getByText('Test Prep');
        fireEvent.click(prepOption);
      });

      await waitFor(() => {
        const quantityInput = screen.getByLabelText('Quantity');
        fireEvent.change(quantityInput, { target: { value: '200' } });

        const addButton = screen.getByText('Add');
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Prep')).toBeInTheDocument();
        expect(screen.getByText('200 ml')).toBeInTheDocument();
      });
    });

    it('validates component selection', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockIngredients, error: null })
        })
      });

      renderWithProviders(<MenuManagement />);
      
      await waitFor(() => {
        const addButton = screen.getByText('menu.add');
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        const addIngredientButton = screen.getByText('Add Ingredient');
        fireEvent.click(addIngredientButton);
      });

      await waitFor(() => {
        // Try to add without selecting ingredient
        const addButton = screen.getByText('Add');
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Please select an ingredient')).toBeInTheDocument();
      });
    });
  });

  describe('Pricing Management Flow', () => {
    it('manages regular and student pricing', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockCategories, error: null })
        })
      });

      renderWithProviders(<MenuManagement />);
      
      await waitFor(() => {
        const addButton = screen.getByText('menu.add');
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        const regularPriceInput = screen.getByLabelText('Regular Price');
        fireEvent.change(regularPriceInput, { target: { value: '18.50' } });

        const studentPriceInput = screen.getByLabelText('Student Price');
        fireEvent.change(studentPriceInput, { target: { value: '12.00' } });
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('18.50')).toBeInTheDocument();
        expect(screen.getByDisplayValue('12.00')).toBeInTheDocument();
      });
    });

    it('calculates profit margins', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockCategories, error: null })
        })
      });

      renderWithProviders(<MenuManagement />);
      
      await waitFor(() => {
        const addButton = screen.getByText('menu.add');
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        const regularPriceInput = screen.getByLabelText('Regular Price');
        fireEvent.change(regularPriceInput, { target: { value: '20.00' } });

        const costInput = screen.getByLabelText('Cost per Item');
        fireEvent.change(costInput, { target: { value: '8.00' } });
      });

      await waitFor(() => {
        // Should display profit margin (€20.00 - €8.00 = €12.00 profit)
        expect(screen.getByText('€12.00')).toBeInTheDocument();
        expect(screen.getByText('60%')).toBeInTheDocument(); // 12/20 = 60%
      });
    });

    it('validates pricing input', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockCategories, error: null })
        })
      });

      renderWithProviders(<MenuManagement />);
      
      await waitFor(() => {
        const addButton = screen.getByText('menu.add');
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        // Try to set negative price
        const regularPriceInput = screen.getByLabelText('Regular Price');
        fireEvent.change(regularPriceInput, { target: { value: '-5.00' } });

        const saveButton = screen.getByText('Save Menu Item');
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Price must be greater than 0')).toBeInTheDocument();
      });
    });
  });

  describe('Category Assignment Flow', () => {
    it('assigns category to menu item', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockCategories, error: null })
        })
      });

      renderWithProviders(<MenuManagement />);
      
      await waitFor(() => {
        const addButton = screen.getByText('menu.add');
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        const categorySelect = screen.getByLabelText('Category');
        fireEvent.change(categorySelect, { target: { value: 'lunch' } });
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('lunch')).toBeInTheDocument();
      });
    });

    it('filters menu items by category', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockMenuItems, error: null })
        })
      });

      renderWithProviders(<MenuManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Dish')).toBeInTheDocument();
      });

      const categorySelect = screen.getByText('menu.allCategories');
      fireEvent.click(categorySelect);

      await waitFor(() => {
        const breakfastOption = screen.getByText('Breakfast');
        fireEvent.click(breakfastOption);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Dish')).toBeInTheDocument();
      });
    });
  });

  describe('Image Generation Flow', () => {
    it('generates image for menu item', async () => {
      const { generateMenuItemImage } = require('@/integrations/recraft/generate');

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockMenuItems, error: null })
        }),
        update: vi.fn().mockResolvedValue({ data: null, error: null })
      });

      renderWithProviders(<MenuManagement />);
      
      await waitFor(() => {
        const generateButtons = screen.getAllByLabelText('Generate Image');
        fireEvent.click(generateButtons[0]);
      });

      await waitFor(() => {
        expect(generateMenuItemImage).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Dish',
            description: 'Delicious test dish'
          })
        );
      });

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('menu_items');
        expect(supabase.from().update).toHaveBeenCalledWith(
          expect.objectContaining({
            image_url: 'generated-menu-image.jpg',
            image_generation_cost: 0.15
          })
        );
      });
    });

    it('handles image generation errors', async () => {
      const { generateMenuItemImage } = require('@/integrations/recraft/generate');
      generateMenuItemImage.mockRejectedValue(new Error('Generation failed'));

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockMenuItems, error: null })
        })
      });

      renderWithProviders(<MenuManagement />);
      
      await waitFor(() => {
        const generateButtons = screen.getAllByLabelText('Generate Image');
        fireEvent.click(generateButtons[0]);
      });

      await waitFor(() => {
        expect(console.error).toHaveBeenCalled();
      });
    });
  });

  describe('Menu Item Actions', () => {
    it('toggles featured status', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockMenuItems, error: null })
        }),
        update: vi.fn().mockResolvedValue({ data: null, error: null })
      });

      renderWithProviders(<MenuManagement />);
      
      await waitFor(() => {
        const featuredToggles = screen.getAllByLabelText('Toggle Featured');
        fireEvent.click(featuredToggles[0]);
      });

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('menu_items');
        expect(supabase.from().update).toHaveBeenCalled();
      });
    });

    it('toggles availability status', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockMenuItems, error: null })
        }),
        update: vi.fn().mockResolvedValue({ data: null, error: null })
      });

      renderWithProviders(<MenuManagement />);
      
      await waitFor(() => {
        const availabilityToggles = screen.getAllByLabelText('Toggle Availability');
        fireEvent.click(availabilityToggles[0]);
      });

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('menu_items');
        expect(supabase.from().update).toHaveBeenCalled();
      });
    });

    it('deletes menu item', async () => {
      global.confirm = vi.fn(() => true);

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockMenuItems, error: null })
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null })
        })
      });

      renderWithProviders(<MenuManagement />);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByLabelText('Delete Menu Item');
        fireEvent.click(deleteButtons[0]);
      });

      expect(global.confirm).toHaveBeenCalled();

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('menu_items');
        expect(supabase.from().delete).toHaveBeenCalled();
      });
    });
  });

  describe('Search and Filtering', () => {
    it('filters menu items by search term', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockMenuItems, error: null })
        })
      });

      renderWithProviders(<MenuManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Dish')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('menu.searchPlaceholder');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      await waitFor(() => {
        expect(screen.getByText('Test Dish')).toBeInTheDocument();
      });

      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      await waitFor(() => {
        expect(screen.queryByText('Test Dish')).not.toBeInTheDocument();
      });
    });

    it('filters by featured items only', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockMenuItems, error: null })
        })
      });

      renderWithProviders(<MenuManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Dish')).toBeInTheDocument();
      });

      const featuredToggle = screen.getByLabelText('Show Featured Only');
      fireEvent.click(featuredToggle);

      await waitFor(() => {
        expect(screen.getByText('Test Dish')).toBeInTheDocument();
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

      renderWithProviders(<MenuManagement />);
      
      await waitFor(() => {
        expect(console.error).toHaveBeenCalled();
      });
    });

    it('handles update operation errors', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockMenuItems, error: null })
        }),
        update: vi.fn().mockResolvedValue({ data: null, error: { message: 'Update failed' } })
      });

      renderWithProviders(<MenuManagement />);
      
      await waitFor(() => {
        const featuredToggles = screen.getAllByLabelText('Toggle Featured');
        fireEvent.click(featuredToggles[0]);
      });

      await waitFor(() => {
        expect(console.error).toHaveBeenCalled();
      });
    });

    it('handles image generation errors', async () => {
      const { generateMenuItemImage } = require('@/integrations/recraft/generate');
      generateMenuItemImage.mockRejectedValue(new Error('Generation failed'));

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockMenuItems, error: null })
        })
      });

      renderWithProviders(<MenuManagement />);
      
      await waitFor(() => {
        const generateButtons = screen.getAllByLabelText('Generate Image');
        fireEvent.click(generateButtons[0]);
      });

      await waitFor(() => {
        expect(console.error).toHaveBeenCalled();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('refreshes menu list after creation', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockCategories, error: null })
        }),
        insert: vi.fn().mockResolvedValue({ data: { id: 'new-id' }, error: null })
      });

      renderWithProviders(<MenuManagement />);
      
      await waitFor(() => {
        const addButton = screen.getByText('menu.add');
        fireEvent.click(addButton);
      });

      // Complete creation flow
      await waitFor(() => {
        const nameInput = screen.getByLabelText('Name *');
        fireEvent.change(nameInput, { target: { value: 'New Dish' } });

        const regularPriceInput = screen.getByLabelText('Regular Price');
        fireEvent.change(regularPriceInput, { target: { value: '15.00' } });

        const saveButton = screen.getByText('Save Menu Item');
        fireEvent.click(saveButton);
      });

      // Verify list is refreshed
      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('menu_items');
        expect(supabase.from().select).toHaveBeenCalled();
      });
    });
  });
}); 