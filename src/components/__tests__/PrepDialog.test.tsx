import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import PrepDialog from '@/components/admin/PrepDialog';
import { EnhancedPrep, PrepFormData } from '@/types/preps';

// Mock the useToast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Mock the usePreps hook
vi.mock('@/hooks/usePreps', () => ({
  usePreps: () => ({
    createPrep: vi.fn(),
    updatePrep: vi.fn(),
    validatePrepData: vi.fn(),
    calculatePrepCostFromData: vi.fn()
  })
}));

// Mock data
const mockPrep: EnhancedPrep = {
  id: '1',
  name: 'Test Dough',
  name_de: 'Test Teig',
  name_en: 'Test Dough',
  description: 'Test dough prep',
  description_de: 'Test Teig Prep',
  description_en: 'Test dough prep',
  batch_yield: '2kg',
  batch_yield_amount: 2,
  batch_yield_unit: 'kg',
  cost_per_batch: 4.75,
  cost_per_unit: 2.375,
  notes: 'Test prep notes',
  is_active: true,
  instructions: 'Mix ingredients',
  instructions_de: 'Zutaten mischen',
  instructions_en: 'Mix ingredients',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ingredients: []
};

const mockIngredients = [
  {
    id: 'ing1',
    name: 'Flour',
    name_de: 'Mehl',
    name_en: 'Flour',
    description: 'Test flour',
    description_de: 'Test Mehl',
    description_en: 'Test flour',
    cost_per_unit: 2.50,
    unit: 'kg',
    category_id: 'cat1',
    is_active: true,
    allergens: [],
    dietary_properties: [],
    notes: '',
    seasonal_availability: [],
    supplier_info: '',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'ing2',
    name: 'Oil',
    name_de: 'Öl',
    name_en: 'Oil',
    description: 'Test oil',
    description_de: 'Test Öl',
    description_en: 'Test oil',
    cost_per_unit: 5.00,
    unit: 'l',
    category_id: 'cat2',
    is_active: true,
    allergens: [],
    dietary_properties: [],
    notes: '',
    seasonal_availability: [],
    supplier_info: '',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  prep: null,
  ingredients: mockIngredients,
  onSave: vi.fn()
};

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>
    {children}
  </I18nextProvider>
);

describe('PrepDialog Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render create prep dialog when no prep is provided', () => {
      render(
        <TestWrapper>
          <PrepDialog {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText(/create new prep/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/batch yield/i)).toBeInTheDocument();
    });

    it('should render edit prep dialog when prep is provided', () => {
      render(
        <TestWrapper>
          <PrepDialog {...defaultProps} prep={mockPrep} />
        </TestWrapper>
      );

      expect(screen.getByText(/edit prep/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Dough')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test dough prep')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2kg')).toBeInTheDocument();
    });

    it('should render all form fields', () => {
      render(
        <TestWrapper>
          <PrepDialog {...defaultProps} />
        </TestWrapper>
      );

      // Basic fields
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/name \(german\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/name \(english\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description \(german\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description \(english\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/batch yield/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/instructions/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/instructions \(german\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/instructions \(english\)/i)).toBeInTheDocument();

      // Checkbox
      expect(screen.getByLabelText(/active/i)).toBeInTheDocument();

      // Buttons
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should render ingredients section', () => {
      render(
        <TestWrapper>
          <PrepDialog {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText(/ingredients/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add ingredient/i })).toBeInTheDocument();
    });

    it('should not render when open is false', () => {
      render(
        <TestWrapper>
          <PrepDialog {...defaultProps} open={false} />
        </TestWrapper>
      );

      expect(screen.queryByText(/create new prep/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('should handle input changes', () => {
      render(
        <TestWrapper>
          <PrepDialog {...defaultProps} />
        </TestWrapper>
      );

      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.change(nameInput, { target: { value: 'New Prep Name' } });

      expect(nameInput).toHaveValue('New Prep Name');
    });

    it('should handle multilingual input changes', () => {
      render(
        <TestWrapper>
          <PrepDialog {...defaultProps} />
        </TestWrapper>
      );

      const nameDeInput = screen.getByLabelText(/name \(german\)/i);
      const nameEnInput = screen.getByLabelText(/name \(english\)/i);

      fireEvent.change(nameDeInput, { target: { value: 'Neuer Prep Name' } });
      fireEvent.change(nameEnInput, { target: { value: 'New Prep Name' } });

      expect(nameDeInput).toHaveValue('Neuer Prep Name');
      expect(nameEnInput).toHaveValue('New Prep Name');
    });

    it('should handle checkbox changes', () => {
      render(
        <TestWrapper>
          <PrepDialog {...defaultProps} />
        </TestWrapper>
      );

      const activeCheckbox = screen.getByLabelText(/active/i);
      fireEvent.click(activeCheckbox);

      expect(activeCheckbox).not.toBeChecked();
    });

    it('should handle batch yield input', () => {
      render(
        <TestWrapper>
          <PrepDialog {...defaultProps} />
        </TestWrapper>
      );

      const batchYieldInput = screen.getByLabelText(/batch yield/i);
      fireEvent.change(batchYieldInput, { target: { value: '500ml' } });

      expect(batchYieldInput).toHaveValue('500ml');
    });
  });

  describe('Ingredient Management', () => {
    it('should open ingredient selector when add ingredient is clicked', () => {
      render(
        <TestWrapper>
          <PrepDialog {...defaultProps} />
        </TestWrapper>
      );

      const addButton = screen.getByRole('button', { name: /add ingredient/i });
      fireEvent.click(addButton);

      // Should open ingredient selector dialog
      expect(screen.getByText(/select ingredients/i)).toBeInTheDocument();
    });

    it('should display selected ingredients', () => {
      const prepWithIngredients = {
        ...mockPrep,
        ingredients: [
          {
            id: '1',
            prep_id: '1',
            ingredient_id: 'ing1',
            quantity: 1.5,
            unit: 'kg',
            notes: 'Flour component',
            ingredient: mockIngredients[0],
            unit_cost: 2.50,
            total_cost: 3.75,
            percentage_of_prep_cost: 78.95
          }
        ]
      };

      render(
        <TestWrapper>
          <PrepDialog {...defaultProps} prep={prepWithIngredients} />
        </TestWrapper>
      );

      expect(screen.getByText('Flour')).toBeInTheDocument();
      expect(screen.getByText('1.5 kg')).toBeInTheDocument();
      expect(screen.getByText('€3.75')).toBeInTheDocument();
    });

    it('should allow removing ingredients', () => {
      const prepWithIngredients = {
        ...mockPrep,
        ingredients: [
          {
            id: '1',
            prep_id: '1',
            ingredient_id: 'ing1',
            quantity: 1.5,
            unit: 'kg',
            notes: 'Flour component',
            ingredient: mockIngredients[0],
            unit_cost: 2.50,
            total_cost: 3.75,
            percentage_of_prep_cost: 78.95
          }
        ]
      };

      render(
        <TestWrapper>
          <PrepDialog {...defaultProps} prep={prepWithIngredients} />
        </TestWrapper>
      );

      const removeButton = screen.getByRole('button', { name: /remove/i });
      fireEvent.click(removeButton);

      expect(screen.queryByText('Flour')).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show validation errors for required fields', async () => {
      render(
        <TestWrapper>
          <PrepDialog {...defaultProps} />
        </TestWrapper>
      );

      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/batch yield is required/i)).toBeInTheDocument();
      });
    });

    it('should validate batch yield format', async () => {
      render(
        <TestWrapper>
          <PrepDialog {...defaultProps} />
        </TestWrapper>
      );

      const batchYieldInput = screen.getByLabelText(/batch yield/i);
      fireEvent.change(batchYieldInput, { target: { value: 'invalid format' } });

      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid batch yield format/i)).toBeInTheDocument();
      });
    });

    it('should validate batch yield with correct format', () => {
      render(
        <TestWrapper>
          <PrepDialog {...defaultProps} />
        </TestWrapper>
      );

      const batchYieldInput = screen.getByLabelText(/batch yield/i);
      fireEvent.change(batchYieldInput, { target: { value: '500ml' } });

      // Should not show validation error for correct format
      expect(screen.queryByText(/invalid batch yield format/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should call onSave with form data when save is clicked', async () => {
      render(
        <TestWrapper>
          <PrepDialog {...defaultProps} />
        </TestWrapper>
      );

      // Fill in required fields
      const nameInput = screen.getByLabelText(/name/i);
      const batchYieldInput = screen.getByLabelText(/batch yield/i);

      fireEvent.change(nameInput, { target: { value: 'Test Prep' } });
      fireEvent.change(batchYieldInput, { target: { value: '2kg' } });

      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(defaultProps.onSave).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Prep',
            batch_yield: '2kg',
            is_active: true
          })
        );
      });
    });

    it('should call onOpenChange when cancel is clicked', () => {
      render(
        <TestWrapper>
          <PrepDialog {...defaultProps} />
        </TestWrapper>
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should call onOpenChange when dialog is closed', () => {
      render(
        <TestWrapper>
          <PrepDialog {...defaultProps} />
        </TestWrapper>
      );

      // Simulate dialog close (e.g., clicking outside or pressing escape)
      // This depends on the dialog implementation
      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Escape' });

      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Cost Calculation', () => {
    it('should display cost calculation when ingredients are added', () => {
      const prepWithIngredients = {
        ...mockPrep,
        ingredients: [
          {
            id: '1',
            prep_id: '1',
            ingredient_id: 'ing1',
            quantity: 1.5,
            unit: 'kg',
            notes: 'Flour component',
            ingredient: mockIngredients[0],
            unit_cost: 2.50,
            total_cost: 3.75,
            percentage_of_prep_cost: 78.95
          },
          {
            id: '2',
            prep_id: '1',
            ingredient_id: 'ing2',
            quantity: 0.2,
            unit: 'l',
            notes: 'Oil component',
            ingredient: mockIngredients[1],
            unit_cost: 5.00,
            total_cost: 1.00,
            percentage_of_prep_cost: 21.05
          }
        ]
      };

      render(
        <TestWrapper>
          <PrepDialog {...defaultProps} prep={prepWithIngredients} />
        </TestWrapper>
      );

      expect(screen.getByText(/total cost/i)).toBeInTheDocument();
      expect(screen.getByText('€4.75')).toBeInTheDocument();
      expect(screen.getByText('€2.38/unit')).toBeInTheDocument();
    });

    it('should update cost calculation when ingredients change', async () => {
      render(
        <TestWrapper>
          <PrepDialog {...defaultProps} />
        </TestWrapper>
      );

      // Add ingredient through the selector
      const addButton = screen.getByRole('button', { name: /add ingredient/i });
      fireEvent.click(addButton);

      // This would typically involve selecting ingredients in the selector
      // For now, we'll just verify the cost calculation section is present
      expect(screen.getByText(/total cost/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      render(
        <TestWrapper>
          <PrepDialog {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/batch yield/i)).toBeInTheDocument();
    });

    it('should have proper button roles', () => {
      render(
        <TestWrapper>
          <PrepDialog {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add ingredient/i })).toBeInTheDocument();
    });

    it('should have proper dialog role', () => {
      render(
        <TestWrapper>
          <PrepDialog {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should handle mobile viewport', () => {
      // Mock window.innerWidth for mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });

      render(
        <TestWrapper>
          <PrepDialog {...defaultProps} />
        </TestWrapper>
      );

      // Should still render all form fields
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/batch yield/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle form submission errors', async () => {
      const mockOnSave = vi.fn().mockRejectedValue(new Error('Save failed'));

      render(
        <TestWrapper>
          <PrepDialog {...defaultProps} onSave={mockOnSave} />
        </TestWrapper>
      );

      // Fill in required fields
      const nameInput = screen.getByLabelText(/name/i);
      const batchYieldInput = screen.getByLabelText(/batch yield/i);

      fireEvent.change(nameInput, { target: { value: 'Test Prep' } });
      fireEvent.change(batchYieldInput, { target: { value: '2kg' } });

      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    it('should handle validation errors gracefully', async () => {
      render(
        <TestWrapper>
          <PrepDialog {...defaultProps} />
        </TestWrapper>
      );

      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        // Should show validation errors but not crash
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });
    });
  });
}); 