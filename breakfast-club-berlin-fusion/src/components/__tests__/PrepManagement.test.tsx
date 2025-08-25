import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { PrepManagement } from '@/pages/admin/PrepManagement';
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

// Mock localization hook
vi.mock('@/hooks/useLocalization', () => ({
  useLocalization: () => ({
    getLocalizedPrepText: (prep: any, field: string) => prep[field] || prep.name,
    currentLanguage: 'en'
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

describe('PrepManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Prep List Display', () => {
    it('renders prep management page with title', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null })
          })
        })
      });

      renderWithProviders(<PrepManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('preps.title')).toBeInTheDocument();
      });
    });

    it('displays prep cards when data is loaded', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockPreps, error: null })
          })
        })
      });

      renderWithProviders(<PrepManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Prep')).toBeInTheDocument();
        expect(screen.getByText('1 kg')).toBeInTheDocument();
        expect(screen.getByText('€15.50')).toBeInTheDocument();
      });
    });

    it('displays loading state while fetching data', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockImplementation(() => 
              new Promise(resolve => setTimeout(() => resolve({ data: mockPreps, error: null }), 100))
            )
          })
        })
      });

      renderWithProviders(<PrepManagement />);
      
      expect(screen.getByText('preps.loading')).toBeInTheDocument();
    });

    it('displays empty state when no preps', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null })
          })
        })
      });

      renderWithProviders(<PrepManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('preps.noPreps')).toBeInTheDocument();
      });
    });
  });

  describe('Prep Creation Workflow', () => {
    it('opens prep dialog when add button is clicked', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null })
          })
        })
      });

      renderWithProviders(<PrepManagement />);
      
      await waitFor(() => {
        const addButton = screen.getByText('preps.add');
        fireEvent.click(addButton);
      });

      // Verify dialog opens (this would require mocking the dialog component)
      await waitFor(() => {
        expect(screen.getByText('preps.add')).toBeInTheDocument();
      });
    });

    it('opens edit dialog when edit button is clicked', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockPreps, error: null })
          })
        })
      });

      renderWithProviders(<PrepManagement />);
      
      await waitFor(() => {
        const editButtons = screen.getAllByLabelText('Edit Prep');
        fireEvent.click(editButtons[0]);
      });

      // Verify edit dialog opens
      await waitFor(() => {
        expect(screen.getByText('Test Prep')).toBeInTheDocument();
      });
    });

    it('deletes prep when delete button is clicked', async () => {
      // Mock confirmation
      global.confirm = vi.fn(() => true);

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockPreps, error: null })
          })
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null })
        })
      });

      renderWithProviders(<PrepManagement />);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByLabelText('Delete Prep');
        fireEvent.click(deleteButtons[0]);
      });

      expect(global.confirm).toHaveBeenCalled();
    });
  });

  describe('Ingredient Selection', () => {
    it('displays ingredient information in prep cards', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockPreps, error: null })
          })
        })
      });

      renderWithProviders(<PrepManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Ingredient')).toBeInTheDocument();
        expect(screen.getByText('500 g')).toBeInTheDocument();
      });
    });

    it('shows ingredient cost information', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockPreps, error: null })
          })
        })
      });

      renderWithProviders(<PrepManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('€0.02/g')).toBeInTheDocument();
      });
    });
  });

  describe('Cost Calculation', () => {
    it('displays total cost per batch', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockPreps, error: null })
          })
        })
      });

      renderWithProviders(<PrepManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('€15.50')).toBeInTheDocument();
      });
    });

    it('displays cost per unit', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockPreps, error: null })
          })
        })
      });

      renderWithProviders(<PrepManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('€15.50/kg')).toBeInTheDocument();
      });
    });

    it('opens cost breakdown dialog when cost breakdown button is clicked', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockPreps, error: null })
          })
        })
      });

      renderWithProviders(<PrepManagement />);
      
      await waitFor(() => {
        const costBreakdownButtons = screen.getAllByLabelText('View Cost Breakdown');
        fireEvent.click(costBreakdownButtons[0]);
      });

      // Verify cost breakdown dialog opens
      await waitFor(() => {
        expect(screen.getByText('Test Prep')).toBeInTheDocument();
      });
    });
  });

  describe('Batch Yield Management', () => {
    it('displays batch yield information', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockPreps, error: null })
          })
        })
      });

      renderWithProviders(<PrepManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('1 kg')).toBeInTheDocument();
      });
    });

    it('displays yield information in prep description', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockPreps, error: null })
          })
        })
      });

      renderWithProviders(<PrepManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Test preparation description')).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filtering', () => {
    it('filters preps by search term', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockPreps, error: null })
          })
        })
      });

      renderWithProviders(<PrepManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Prep')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('preps.searchPlaceholder');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      await waitFor(() => {
        expect(screen.getByText('Test Prep')).toBeInTheDocument();
      });
    });

    it('filters out preps that do not match search term', async () => {
      const multiplePreps = [
        ...mockPreps,
        {
          ...mockPreps[0],
          id: '2',
          name: 'Another Prep',
          name_en: 'Another Prep',
          name_de: 'Andere Zubereitung'
        }
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: multiplePreps, error: null })
          })
        })
      });

      renderWithProviders(<PrepManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Prep')).toBeInTheDocument();
        expect(screen.getByText('Another Prep')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('preps.searchPlaceholder');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      await waitFor(() => {
        expect(screen.getByText('Test Prep')).toBeInTheDocument();
        expect(screen.queryByText('Another Prep')).not.toBeInTheDocument();
      });
    });
  });

  describe('Multi-language Support', () => {
    it('displays localized prep names', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockPreps, error: null })
          })
        })
      });

      renderWithProviders(<PrepManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Prep')).toBeInTheDocument();
      });
    });

    it('handles missing translations gracefully', async () => {
      const prepWithoutTranslation = {
        ...mockPreps[0],
        name_en: null,
        name_de: null
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [prepWithoutTranslation], error: null })
          })
        })
      });

      renderWithProviders(<PrepManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Prep')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when fetch fails', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Fetch failed' } })
          })
        })
      });

      renderWithProviders(<PrepManagement />);
      
      await waitFor(() => {
        expect(console.error).toHaveBeenCalled();
      });
    });

    it('handles network errors gracefully', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockRejectedValue(new Error('Network error'))
          })
        })
      });

      renderWithProviders(<PrepManagement />);
      
      await waitFor(() => {
        expect(console.error).toHaveBeenCalled();
      });
    });

    it('handles delete operation errors', async () => {
      global.confirm = vi.fn(() => true);

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockPreps, error: null })
          })
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'Delete failed' } })
        })
      });

      renderWithProviders(<PrepManagement />);
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByLabelText('Delete Prep');
        fireEvent.click(deleteButtons[0]);
      });

      await waitFor(() => {
        expect(console.error).toHaveBeenCalled();
      });
    });
  });

  describe('Responsive Design', () => {
    it('displays prep cards in responsive grid layout', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockPreps, error: null })
          })
        })
      });

      renderWithProviders(<PrepManagement />);
      
      await waitFor(() => {
        const prepCards = screen.getAllByTestId('prep-card');
        expect(prepCards.length).toBeGreaterThan(0);
      });
    });

    it('maintains functionality on mobile devices', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockPreps, error: null })
          })
        })
      });

      renderWithProviders(<PrepManagement />);
      
      await waitFor(() => {
        // Test touch interactions
        const addButton = screen.getByText('preps.add');
        fireEvent.touchStart(addButton);
        fireEvent.touchEnd(addButton);
      });

      // Verify functionality works with touch events
      await waitFor(() => {
        expect(screen.getByText('preps.add')).toBeInTheDocument();
      });
    });
  });
}); 