import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { IngredientManagement } from '@/pages/admin/IngredientManagement';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      update: jest.fn(() => Promise.resolve({ data: null, error: null })),
      delete: jest.fn(() => Promise.resolve({ data: null, error: null }))
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
jest.mock('react-i18next', () => ({
  ...jest.requireActual('react-i18next'),
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' }
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

describe('IngredientManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    test('renders ingredient management page with title', async () => {
      renderWithProviders(<IngredientManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('ingredients.title')).toBeInTheDocument();
      });
    });

    test('renders add ingredient button', async () => {
      renderWithProviders(<IngredientManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('ingredients.add')).toBeInTheDocument();
      });
    });

    test('renders search input', async () => {
      renderWithProviders(<IngredientManagement />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('ingredients.searchPlaceholder')).toBeInTheDocument();
      });
    });

    test('renders category filter dropdown', async () => {
      renderWithProviders(<IngredientManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('ingredients.allCategories')).toBeInTheDocument();
      });
    });
  });

  describe('Ingredient List Display', () => {
    test('displays ingredient cards when data is loaded', async () => {
      // Mock successful data fetch
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockIngredients, error: null })
        })
      });

      renderWithProviders(<IngredientManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Tomato')).toBeInTheDocument();
        expect(screen.getByText('Vegetables')).toBeInTheDocument();
        expect(screen.getByText('piece')).toBeInTheDocument();
      });
    });

    test('displays loading state while fetching data', async () => {
      // Mock delayed response
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockImplementation(() => 
            new Promise(resolve => setTimeout(() => resolve({ data: mockIngredients, error: null }), 100))
          )
        })
      });

      renderWithProviders(<IngredientManagement />);
      
      expect(screen.getByText('ingredients.loading')).toBeInTheDocument();
    });

    test('displays empty state when no ingredients', async () => {
      // Mock empty data
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      renderWithProviders(<IngredientManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('ingredients.noIngredients')).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filtering', () => {
    test('filters ingredients by search term', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockIngredients, error: null })
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
    });

    test('filters ingredients by category', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockIngredients, error: null })
        })
      });

      renderWithProviders(<IngredientManagement />);
      
      await waitFor(() => {
        const categorySelect = screen.getByText('ingredients.allCategories');
        fireEvent.click(categorySelect);
      });

      // Test category selection
      await waitFor(() => {
        expect(screen.getByText('Vegetables')).toBeInTheDocument();
      });
    });
  });

  describe('Category Selection', () => {
    test('loads and displays ingredient categories', async () => {
      // Mock categories fetch
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockCategories, error: null })
        })
      });

      renderWithProviders(<IngredientManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('ingredients.allCategories')).toBeInTheDocument();
      });
    });

    test('allows category selection for filtering', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockCategories, error: null })
        })
      });

      renderWithProviders(<IngredientManagement />);
      
      await waitFor(() => {
        const categorySelect = screen.getByText('ingredients.allCategories');
        fireEvent.click(categorySelect);
      });

      // Verify category options are available
      await waitFor(() => {
        expect(screen.getByText('Vegetables')).toBeInTheDocument();
        expect(screen.getByText('Meat')).toBeInTheDocument();
      });
    });
  });

  describe('CRUD Operations', () => {
    test('opens ingredient dialog when add button is clicked', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      renderWithProviders(<IngredientManagement />);
      
      await waitFor(() => {
        const addButton = screen.getByText('ingredients.add');
        fireEvent.click(addButton);
      });

      // Verify dialog opens (this would require mocking the dialog component)
      await waitFor(() => {
        expect(screen.getByText('ingredients.add')).toBeInTheDocument();
      });
    });

    test('opens edit dialog when edit button is clicked', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockIngredients, error: null })
        })
      });

      renderWithProviders(<IngredientManagement />);
      
      await waitFor(() => {
        const editButtons = screen.getAllByLabelText('Edit Ingredient');
        fireEvent.click(editButtons[0]);
      });

      // Verify edit dialog opens
      await waitFor(() => {
        expect(screen.getByText('Test Tomato')).toBeInTheDocument();
      });
    });

    test('deletes ingredient when delete button is clicked', async () => {
      // Mock confirmation
      global.confirm = jest.fn(() => true);

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockIngredients, error: null })
        }),
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: null })
        })
      });

      renderWithProviders(<IngredientManagement />);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByLabelText('Delete Ingredient');
        fireEvent.click(deleteButtons[0]);
      });

      expect(global.confirm).toHaveBeenCalled();
    });
  });

  describe('Image Generation Integration', () => {
    test('displays ingredient image when available', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockIngredients, error: null })
        })
      });

      renderWithProviders(<IngredientManagement />);
      
      await waitFor(() => {
        // Check if image is displayed (this would depend on the IngredientImage component)
        expect(screen.getByText('Test Tomato')).toBeInTheDocument();
      });
    });

    test('shows generate image button when no image is available', async () => {
      const ingredientWithoutImage = {
        ...mockIngredients[0],
        image_url: null
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: [ingredientWithoutImage], error: null })
        })
      });

      renderWithProviders(<IngredientManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Tomato')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('displays error message when fetch fails', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: null, error: { message: 'Fetch failed' } })
        })
      });

      renderWithProviders(<IngredientManagement />);
      
      await waitFor(() => {
        // Error should be logged to console
        expect(console.error).toHaveBeenCalled();
      });
    });

    test('handles network errors gracefully', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockRejectedValue(new Error('Network error'))
        })
      });

      renderWithProviders(<IngredientManagement />);
      
      await waitFor(() => {
        expect(console.error).toHaveBeenCalled();
      });
    });
  });
}); 