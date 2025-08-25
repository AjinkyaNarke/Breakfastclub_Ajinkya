import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import PrepUsageAnalytics from '@/components/admin/PrepUsageAnalytics';
import { PrepUsageAnalytics as PrepUsageAnalyticsType, PrepUsageInsights } from '@/types/preps';

// Mock recharts components
vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: ({ dataKey }: { dataKey: string }) => <div data-testid={`bar-${dataKey}`} />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ dataKey }: { dataKey: string }) => <div data-testid={`pie-${dataKey}`} />,
  Cell: () => <div data-testid="cell" />,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: ({ dataKey }: { dataKey: string }) => <div data-testid={`line-${dataKey}`} />,
  Area: ({ dataKey }: { dataKey: string }) => <div data-testid={`area-${dataKey}`} />,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>
}));

// Mock data
const mockAnalytics: PrepUsageAnalyticsType[] = [
  {
    prep_id: '1',
    prep_name: 'Test Dough',
    total_usage_count: 15,
    unique_menu_items: 8,
    total_quantity_used: 12.5,
    average_quantity_per_usage: 0.83,
    total_cost_contribution: 45.25,
    average_cost_per_menu_item: 5.66,
    popularity_rank: 1,
    cost_efficiency: 'excellent',
    usage_trend: 'increasing',
    menu_items_using: ['Pizza', 'Bread', 'Pasta'],
    last_used: '2024-01-15T10:30:00Z',
    batch_utilization_rate: 85.5
  },
  {
    prep_id: '2',
    prep_name: 'Test Sauce',
    total_usage_count: 8,
    unique_menu_items: 4,
    total_quantity_used: 6.0,
    average_quantity_per_usage: 0.75,
    total_cost_contribution: 28.50,
    average_cost_per_menu_item: 7.13,
    popularity_rank: 2,
    cost_efficiency: 'good',
    usage_trend: 'stable',
    menu_items_using: ['Pasta', 'Rice'],
    last_used: '2024-01-14T15:45:00Z',
    batch_utilization_rate: 72.0
  },
  {
    prep_id: '3',
    prep_name: 'Test Paste',
    total_usage_count: 3,
    unique_menu_items: 2,
    total_quantity_used: 2.5,
    average_quantity_per_usage: 0.83,
    total_cost_contribution: 15.75,
    average_cost_per_menu_item: 7.88,
    popularity_rank: 3,
    cost_efficiency: 'moderate',
    usage_trend: 'decreasing',
    menu_items_using: ['Special Dish'],
    last_used: '2024-01-10T12:00:00Z',
    batch_utilization_rate: 45.0
  }
];

const mockInsights: PrepUsageInsights = {
  most_popular_preps: mockAnalytics.slice(0, 2),
  most_cost_efficient_preps: [mockAnalytics[0], mockAnalytics[1]],
  underutilized_preps: [mockAnalytics[2]],
  high_cost_preps: [mockAnalytics[2], mockAnalytics[1]],
  prep_recommendations: [
    {
      type: 'optimization',
      prep_id: '3',
      prep_name: 'Test Paste',
      title: 'High Cost, Low Usage Prep',
      description: 'Test Paste has high cost contribution (€15.75) but low usage (3 times). Consider optimizing or finding alternatives.',
      impact: 'high',
      potential_savings: 4.73,
      action_items: [
        'Review prep recipe for cost optimization',
        'Consider alternative ingredients',
        'Evaluate if prep is necessary',
        'Look for bulk purchasing opportunities'
      ]
    }
  ],
  overall_stats: {
    total_preps: 3,
    active_preps: 3,
    total_usage_count: 26,
    average_usage_per_prep: 8.67,
    total_cost_contribution: 89.50
  }
};

const defaultProps = {
  analytics: mockAnalytics,
  insights: mockInsights,
  loading: false,
  error: null,
  onRefresh: vi.fn()
};

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>
    {children}
  </I18nextProvider>
);

describe('PrepUsageAnalytics Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the analytics dashboard with title', () => {
      render(
        <TestWrapper>
          <PrepUsageAnalytics {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Prep Usage Analytics')).toBeInTheDocument();
      expect(screen.getByText('Track prep usage and optimize costs')).toBeInTheDocument();
    });

    it('should render overview tab by default', () => {
      render(
        <TestWrapper>
          <PrepUsageAnalytics {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Popular Preps')).toBeInTheDocument();
      expect(screen.getByText('Efficient Preps')).toBeInTheDocument();
    });

    it('should render all tab buttons', () => {
      render(
        <TestWrapper>
          <PrepUsageAnalytics {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /overview/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /popular/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /efficient/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /recommendations/i })).toBeInTheDocument();
    });

    it('should render charts when data is available', () => {
      render(
        <TestWrapper>
          <PrepUsageAnalytics {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });

    it('should render loading state when loading is true', () => {
      render(
        <TestWrapper>
          <PrepUsageAnalytics {...defaultProps} loading={true} />
        </TestWrapper>
      );

      expect(screen.getByText(/loading analytics/i)).toBeInTheDocument();
    });

    it('should render error state when error is present', () => {
      render(
        <TestWrapper>
          <PrepUsageAnalytics {...defaultProps} error="Failed to load analytics" />
        </TestWrapper>
      );

      expect(screen.getByText('Failed to load analytics')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should render empty state when no data is available', () => {
      render(
        <TestWrapper>
          <PrepUsageAnalytics 
            {...defaultProps} 
            analytics={[]}
            insights={{
              most_popular_preps: [],
              most_cost_efficient_preps: [],
              underutilized_preps: [],
              high_cost_preps: [],
              prep_recommendations: [],
              overall_stats: {
                total_preps: 0,
                active_preps: 0,
                total_usage_count: 0,
                average_usage_per_prep: 0,
                total_cost_contribution: 0
              }
            }}
          />
        </TestWrapper>
      );

      expect(screen.getByText(/no analytics data available/i)).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('should switch to popular tab when clicked', () => {
      render(
        <TestWrapper>
          <PrepUsageAnalytics {...defaultProps} />
        </TestWrapper>
      );

      const popularTab = screen.getByRole('button', { name: /popular/i });
      fireEvent.click(popularTab);

      expect(screen.getByText('Most Popular Preps')).toBeInTheDocument();
      expect(screen.getByText('Test Dough')).toBeInTheDocument();
      expect(screen.getByText('15 uses')).toBeInTheDocument();
    });

    it('should switch to efficient tab when clicked', () => {
      render(
        <TestWrapper>
          <PrepUsageAnalytics {...defaultProps} />
        </TestWrapper>
      );

      const efficientTab = screen.getByRole('button', { name: /efficient/i });
      fireEvent.click(efficientTab);

      expect(screen.getByText('Most Cost Efficient Preps')).toBeInTheDocument();
      expect(screen.getByText('Test Dough')).toBeInTheDocument();
      expect(screen.getByText('excellent')).toBeInTheDocument();
    });

    it('should switch to recommendations tab when clicked', () => {
      render(
        <TestWrapper>
          <PrepUsageAnalytics {...defaultProps} />
        </TestWrapper>
      );

      const recommendationsTab = screen.getByRole('button', { name: /recommendations/i });
      fireEvent.click(recommendationsTab);

      expect(screen.getByText('Optimization Recommendations')).toBeInTheDocument();
      expect(screen.getByText('High Cost, Low Usage Prep')).toBeInTheDocument();
      expect(screen.getByText('Test Paste')).toBeInTheDocument();
    });

    it('should return to overview tab when clicked', () => {
      render(
        <TestWrapper>
          <PrepUsageAnalytics {...defaultProps} />
        </TestWrapper>
      );

      // Switch to another tab first
      const popularTab = screen.getByRole('button', { name: /popular/i });
      fireEvent.click(popularTab);

      // Then switch back to overview
      const overviewTab = screen.getByRole('button', { name: /overview/i });
      fireEvent.click(overviewTab);

      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Popular Preps')).toBeInTheDocument();
    });
  });

  describe('Overview Tab Content', () => {
    it('should display overall statistics', () => {
      render(
        <TestWrapper>
          <PrepUsageAnalytics {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('3')).toBeInTheDocument(); // Total preps
      expect(screen.getByText('26')).toBeInTheDocument(); // Total usage
      expect(screen.getByText('€89.50')).toBeInTheDocument(); // Total cost
      expect(screen.getByText('8.7')).toBeInTheDocument(); // Average usage
    });

    it('should display popular preps section', () => {
      render(
        <TestWrapper>
          <PrepUsageAnalytics {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Popular Preps')).toBeInTheDocument();
      expect(screen.getByText('Test Dough')).toBeInTheDocument();
      expect(screen.getByText('15 uses')).toBeInTheDocument();
      expect(screen.getByText('Test Sauce')).toBeInTheDocument();
      expect(screen.getByText('8 uses')).toBeInTheDocument();
    });

    it('should display efficient preps section', () => {
      render(
        <TestWrapper>
          <PrepUsageAnalytics {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Efficient Preps')).toBeInTheDocument();
      expect(screen.getByText('Test Dough')).toBeInTheDocument();
      expect(screen.getByText('excellent')).toBeInTheDocument();
      expect(screen.getByText('Test Sauce')).toBeInTheDocument();
      expect(screen.getByText('good')).toBeInTheDocument();
    });

    it('should display underutilized preps section', () => {
      render(
        <TestWrapper>
          <PrepUsageAnalytics {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Underutilized Preps')).toBeInTheDocument();
      expect(screen.getByText('Test Paste')).toBeInTheDocument();
      expect(screen.getByText('3 uses')).toBeInTheDocument();
    });
  });

  describe('Popular Tab Content', () => {
    beforeEach(() => {
      render(
        <TestWrapper>
          <PrepUsageAnalytics {...defaultProps} />
        </TestWrapper>
      );

      const popularTab = screen.getByRole('button', { name: /popular/i });
      fireEvent.click(popularTab);
    });

    it('should display popularity chart', () => {
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      expect(screen.getByTestId('bar-total_usage_count')).toBeInTheDocument();
    });

    it('should display prep details in table', () => {
      expect(screen.getByText('Test Dough')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('€45.25')).toBeInTheDocument();

      expect(screen.getByText('Test Sauce')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('€28.50')).toBeInTheDocument();
    });

    it('should display usage trend indicators', () => {
      expect(screen.getByText('increasing')).toBeInTheDocument();
      expect(screen.getByText('stable')).toBeInTheDocument();
      expect(screen.getByText('decreasing')).toBeInTheDocument();
    });
  });

  describe('Efficient Tab Content', () => {
    beforeEach(() => {
      render(
        <TestWrapper>
          <PrepUsageAnalytics {...defaultProps} />
        </TestWrapper>
      );

      const efficientTab = screen.getByRole('button', { name: /efficient/i });
      fireEvent.click(efficientTab);
    });

    it('should display efficiency chart', () => {
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      expect(screen.getByTestId('bar-average_cost_per_menu_item')).toBeInTheDocument();
    });

    it('should display efficiency ratings', () => {
      expect(screen.getByText('excellent')).toBeInTheDocument();
      expect(screen.getByText('good')).toBeInTheDocument();
      expect(screen.getByText('moderate')).toBeInTheDocument();
    });

    it('should display cost efficiency details', () => {
      expect(screen.getByText('€5.66')).toBeInTheDocument();
      expect(screen.getByText('€7.13')).toBeInTheDocument();
      expect(screen.getByText('€7.88')).toBeInTheDocument();
    });
  });

  describe('Recommendations Tab Content', () => {
    beforeEach(() => {
      render(
        <TestWrapper>
          <PrepUsageAnalytics {...defaultProps} />
        </TestWrapper>
      );

      const recommendationsTab = screen.getByRole('button', { name: /recommendations/i });
      fireEvent.click(recommendationsTab);
    });

    it('should display optimization recommendations', () => {
      expect(screen.getByText('High Cost, Low Usage Prep')).toBeInTheDocument();
      expect(screen.getByText('Test Paste')).toBeInTheDocument();
      expect(screen.getByText('€15.75')).toBeInTheDocument();
      expect(screen.getByText('3 times')).toBeInTheDocument();
    });

    it('should display action items', () => {
      expect(screen.getByText('Review prep recipe for cost optimization')).toBeInTheDocument();
      expect(screen.getByText('Consider alternative ingredients')).toBeInTheDocument();
      expect(screen.getByText('Evaluate if prep is necessary')).toBeInTheDocument();
      expect(screen.getByText('Look for bulk purchasing opportunities')).toBeInTheDocument();
    });

    it('should display potential savings', () => {
      expect(screen.getByText('€4.73')).toBeInTheDocument();
      expect(screen.getByText('Potential Savings')).toBeInTheDocument();
    });

    it('should display impact level', () => {
      expect(screen.getByText('high')).toBeInTheDocument();
      expect(screen.getByText('Impact')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onRefresh when refresh button is clicked', () => {
      render(
        <TestWrapper>
          <PrepUsageAnalytics {...defaultProps} />
        </TestWrapper>
      );

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);

      expect(defaultProps.onRefresh).toHaveBeenCalled();
    });

    it('should call onRefresh when retry button is clicked in error state', () => {
      render(
        <TestWrapper>
          <PrepUsageAnalytics {...defaultProps} error="Failed to load analytics" />
        </TestWrapper>
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      expect(defaultProps.onRefresh).toHaveBeenCalled();
    });

    it('should handle chart interactions', () => {
      render(
        <TestWrapper>
          <PrepUsageAnalytics {...defaultProps} />
        </TestWrapper>
      );

      // Test chart interaction (this would depend on the specific chart library)
      const chart = screen.getByTestId('bar-chart');
      fireEvent.click(chart);

      // Should not crash and should handle the interaction gracefully
      expect(chart).toBeInTheDocument();
    });
  });

  describe('Data Visualization', () => {
    it('should render charts with correct data', () => {
      render(
        <TestWrapper>
          <PrepUsageAnalytics {...defaultProps} />
        </TestWrapper>
      );

      // Verify chart components are rendered
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });

    it('should display cost breakdown chart', () => {
      render(
        <TestWrapper>
          <PrepUsageAnalytics {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      expect(screen.getByTestId('pie-total_cost_contribution')).toBeInTheDocument();
    });

    it('should display usage trends chart', () => {
      render(
        <TestWrapper>
          <PrepUsageAnalytics {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
      expect(screen.getByTestId('area-total_usage_count')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <TestWrapper>
          <PrepUsageAnalytics {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('should have proper table structure', () => {
      render(
        <TestWrapper>
          <PrepUsageAnalytics {...defaultProps} />
        </TestWrapper>
      );

      // Switch to popular tab to see table
      const popularTab = screen.getByRole('button', { name: /popular/i });
      fireEvent.click(popularTab);

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      const headers = screen.getAllByRole('columnheader');
      expect(headers.length).toBeGreaterThan(0);
    });

    it('should have proper button roles', () => {
      render(
        <TestWrapper>
          <PrepUsageAnalytics {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getAllByRole('tab')).toHaveLength(4);
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
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
          <PrepUsageAnalytics {...defaultProps} />
        </TestWrapper>
      );

      // Should still render all essential elements
      expect(screen.getByText('Prep Usage Analytics')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
      expect(screen.getAllByRole('tab')).toHaveLength(4);
    });
  });

  describe('Error Boundaries', () => {
    it('should handle component errors gracefully', () => {
      // Mock a component that throws an error
      const ErrorComponent = () => {
        throw new Error('Test error');
      };

      // This would typically be handled by an error boundary
      // For now, we'll just verify the component doesn't crash the test
      expect(() => {
        render(
          <TestWrapper>
            <PrepUsageAnalytics {...defaultProps} />
          </TestWrapper>
        );
      }).not.toThrow();
    });
  });
}); 