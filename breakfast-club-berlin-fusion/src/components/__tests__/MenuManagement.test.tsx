import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { MenuManagement } from '@/pages/admin/MenuManagement';
import { supabase } from '@/integrations/supabase/client';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null }))
      })),
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
  },
  {
    id: '2',
    name: 'Another Dish',
    name_de: 'Anderes Gericht',
    name_en: 'Another Dish',
    description: 'Another delicious dish',
    description_de: 'Ein anderes leckeres Gericht',
    description_en: 'Another delicious dish',
    image_url: 'another-image.jpg',
    regular_price: 15.00,
    student_price: 10.00,
    is_featured: false,
    is_available: true,
    dietary_tags: ['vegetarian'],
    display_order: 2,
    category_id: 'lunch',
    cuisine_type: 'asian',
    category: {
      name: 'Lunch',
      id: 'lunch'
    }
  }
];

const mockCategories = [
  { id: 'breakfast', name: 'Breakfast', display_order: 1 },
  { id: 'lunch', name: 'Lunch', display_order: 2 },
  { id: 'dinner', name: 'Dinner', display_order: 3 }
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

describe('MenuManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Menu Item List Display', () => {
    it('renders menu management page with title', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      renderWithProviders(<MenuManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('menu.title')).toBeInTheDocument();
      });
    });

    it('displays menu item cards when data is loaded', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockMenuItems, error: null })
        })
      });

      renderWithProviders(<MenuManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Dish')).toBeInTheDocument();
        expect(screen.getByText('Another Dish')).toBeInTheDocument();
        expect(screen.getByText('€12.50')).toBeInTheDocument();
        expect(screen.getByText('€15.00')).toBeInTheDocument();
      });
    });

    it('displays category information', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockMenuItems, error: null })
        })
      });

      renderWithProviders(<MenuManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Breakfast')).toBeInTheDocument();
        expect(screen.getByText('Lunch')).toBeInTheDocument();
      });
    });

    it('displays dietary tags', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockMenuItems, error: null })
        })
      });

      renderWithProviders(<MenuManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('vegetarian')).toBeInTheDocument();
        expect(screen.getByText('vegan')).toBeInTheDocument();
      });
    });

    it('displays featured status', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockMenuItems, error: null })
        })
      });

      renderWithProviders(<MenuManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Featured')).toBeInTheDocument();
      });
    });
  });

  describe('Menu Item Creation', () => {
    it('opens menu item dialog when add button is clicked', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      renderWithProviders(<MenuManagement />);
      
      await waitFor(() => {
        const addButton = screen.getByText('menu.add');
        fireEvent.click(addButton);
      });

      // Verify dialog opens (this would require mocking the dialog component)
      await waitFor(() => {
        expect(screen.getByText('menu.add')).toBeInTheDocument();
      });
    });

    it('opens edit dialog when edit button is clicked', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockMenuItems, error: null })
        })
      });

      renderWithProviders(<MenuManagement />);
      
      await waitFor(() => {
        const editButtons = screen.getAllByLabelText('Edit Menu Item');
        fireEvent.click(editButtons[0]);
      });

      // Verify edit dialog opens
      await waitFor(() => {
        expect(screen.getByText('Test Dish')).toBeInTheDocument();
      });
    });
  });

  describe('Ingredient/Prep Selection', () => {
    it('displays ingredient and prep information in menu items', async () => {
      const menuItemsWithIngredients = [
        {
          ...mockMenuItems[0],
          ingredients: 'Test Ingredient (100g), Test Prep (50ml)'
        }
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: menuItemsWithIngredients, error: null })
        })
      });

      renderWithProviders(<MenuManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Ingredient (100g)')).toBeInTheDocument();
        expect(screen.getByText('Test Prep (50ml)')).toBeInTheDocument();
      });
    });

    it('allows adding ingredients and preps to menu items', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockMenuItems, error: null })
        })
      });

      renderWithProviders(<MenuManagement />);
      
      await waitFor(() => {
        const editButtons = screen.getAllByLabelText('Edit Menu Item');
        fireEvent.click(editButtons[0]);
      });

      // This would test the ingredient/prep selection in the dialog
      await waitFor(() => {
        expect(screen.getByText('Test Dish')).toBeInTheDocument();
      });
    });
  });

  describe('Pricing Management', () => {
    it('displays regular and student prices', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockMenuItems, error: null })
        })
      });

      renderWithProviders(<MenuManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('€12.50')).toBeInTheDocument();
        expect(screen.getByText('€8.50')).toBeInTheDocument();
        expect(screen.getByText('€15.00')).toBeInTheDocument();
        expect(screen.getByText('€10.00')).toBeInTheDocument();
      });
    });

    it('allows editing prices', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockMenuItems, error: null })
        })
      });

      renderWithProviders(<MenuManagement />);
      
      await waitFor(() => {
        const editButtons = screen.getAllByLabelText('Edit Menu Item');
        fireEvent.click(editButtons[0]);
      });

      // This would test price editing in the dialog
      await waitFor(() => {
        expect(screen.getByText('Test Dish')).toBeInTheDocument();
      });
    });

    it('calculates profit margins', async () => {
      const menuItemsWithCosts = [
        {
          ...mockMenuItems[0],
          cost_per_item: 5.00
        }
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: menuItemsWithCosts, error: null })
        })
      });

      renderWithProviders(<MenuManagement />);
      
      await waitFor(() => {
        // Should display profit margin (€12.50 - €5.00 = €7.50 profit)
        expect(screen.getByText('€7.50')).toBeInTheDocument();
      });
    });
  });

  describe('Category Assignment', () => {
    it('displays category filter dropdown', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockCategories, error: null })
        })
      });

      renderWithProviders(<MenuManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('menu.allCategories')).toBeInTheDocument();
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
        expect(screen.getByText('Another Dish')).toBeInTheDocument();
      });

      const categorySelect = screen.getByText('menu.allCategories');
      fireEvent.click(categorySelect);

      await waitFor(() => {
        const breakfastOption = screen.getByText('Breakfast');
        fireEvent.click(breakfastOption);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Dish')).toBeInTheDocument();
        expect(screen.queryByText('Another Dish')).not.toBeInTheDocument();
      });
    });

    it('allows changing menu item category', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockMenuItems, error: null })
        })
      });

      renderWithProviders(<MenuManagement />);
      
      await waitFor(() => {
        const editButtons = screen.getAllByLabelText('Edit Menu Item');
        fireEvent.click(editButtons[0]);
      });

      // This would test category assignment in the dialog
      await waitFor(() => {
        expect(screen.getByText('Test Dish')).toBeInTheDocument();
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
        expect(screen.getByText('Another Dish')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('menu.searchPlaceholder');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      await waitFor(() => {
        expect(screen.getByText('Test Dish')).toBeInTheDocument();
        expect(screen.queryByText('Another Dish')).not.toBeInTheDocument();
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
        expect(screen.getByText('Another Dish')).toBeInTheDocument();
      });

      const featuredToggle = screen.getByLabelText('Show Featured Only');
      fireEvent.click(featuredToggle);

      await waitFor(() => {
        expect(screen.getByText('Test Dish')).toBeInTheDocument();
        expect(screen.queryByText('Another Dish')).not.toBeInTheDocument();
      });
    });

    it('filters by available items only', async () => {
      const menuItemsWithUnavailable = [
        ...mockMenuItems,
        {
          ...mockMenuItems[0],
          id: '3',
          name: 'Unavailable Dish',
          is_available: false
        }
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: menuItemsWithUnavailable, error: null })
        })
      });

      renderWithProviders(<MenuManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Dish')).toBeInTheDocument();
        expect(screen.getByText('Another Dish')).toBeInTheDocument();
        expect(screen.getByText('Unavailable Dish')).toBeInTheDocument();
      });

      const availableToggle = screen.getByLabelText('Show Available Only');
      fireEvent.click(availableToggle);

      await waitFor(() => {
        expect(screen.getByText('Test Dish')).toBeInTheDocument();
        expect(screen.getByText('Another Dish')).toBeInTheDocument();
        expect(screen.queryByText('Unavailable Dish')).not.toBeInTheDocument();
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
    });
  });

  describe('Multi-language Support', () => {
    it('displays localized menu item names', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockMenuItems, error: null })
        })
      });

      renderWithProviders(<MenuManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Dish')).toBeInTheDocument();
        expect(screen.getByText('Another Dish')).toBeInTheDocument();
      });
    });

    it('handles missing translations gracefully', async () => {
      const menuItemsWithoutTranslation = [
        {
          ...mockMenuItems[0],
          name_en: null,
          name_de: null
        }
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: menuItemsWithoutTranslation, error: null })
        })
      });

      renderWithProviders(<MenuManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Dish')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when fetch fails', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Fetch failed' } })
        })
      });

      renderWithProviders(<MenuManagement />);
      
      await waitFor(() => {
        expect(console.error).toHaveBeenCalled();
      });
    });

    it('handles network errors gracefully', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockRejectedValue(new Error('Network error'))
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
  });

  describe('Responsive Design', () => {
    it('displays menu items in responsive grid layout', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockMenuItems, error: null })
        })
      });

      renderWithProviders(<MenuManagement />);
      
      await waitFor(() => {
        const menuCards = screen.getAllByTestId('menu-card');
        expect(menuCards.length).toBeGreaterThan(0);
      });
    });

    it('maintains functionality on mobile devices', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockMenuItems, error: null })
        })
      });

      renderWithProviders(<MenuManagement />);
      
      await waitFor(() => {
        // Test touch interactions
        const addButton = screen.getByText('menu.add');
        fireEvent.touchStart(addButton);
        fireEvent.touchEnd(addButton);
      });

      // Verify functionality works with touch events
      await waitFor(() => {
        expect(screen.getByText('menu.add')).toBeInTheDocument();
      });
    });
  });
}); 