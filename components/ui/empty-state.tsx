import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
  children?: ReactNode;
}

/**
 * Generic Empty State Component
 * Used when there's no data to display
 */
export function EmptyState({ icon, title, description, action, children }: EmptyStateProps) {
  return (
    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      {action && (
        <Link href={action.href}>
          <Button size="lg" className="min-h-[44px]">
            {action.label}
          </Button>
        </Link>
      )}
      {children}
    </div>
  );
}

/**
 * No Trades Empty State
 */
export function NoTradesEmptyState() {
  return (
    <EmptyState
      icon="📊"
      title="No trades yet"
      description="Start tracking your trading performance by entering your first trade. You can enter trades one at a time or use bulk entry for multiple trades."
      action={{
        label: '➕ Enter Your First Trade',
        href: '/trades/new',
      }}
    >
      <div className="mt-4">
        <Link href="/trades/bulk">
          <Button variant="outline" size="lg" className="min-h-[44px]">
            📋 Bulk Entry
          </Button>
        </Link>
      </div>
    </EmptyState>
  );
}

/**
 * No Targets Empty State
 */
export function NoTargetsEmptyState() {
  return (
    <EmptyState
      icon="🎯"
      title="No active targets"
      description="Set your first trading target to start tracking your progress towards your goals. Targets help you stay focused and measure improvement."
    />
  );
}

/**
 * No Data for Date Range Empty State
 */
export function NoDataEmptyState({ dateRange }: { dateRange?: string }) {
  return (
    <EmptyState
      icon="📅"
      title="No data for this period"
      description={dateRange ? `No trading data found for ${dateRange}. Try selecting a different date range or enter some trades.` : "No trading data found for the selected period. Try selecting a different date range."}
    >
      <div className="mt-4">
        <Link href="/trades/new">
          <Button size="lg" className="min-h-[44px]">
            ➕ Enter Trades
          </Button>
        </Link>
      </div>
    </EmptyState>
  );
}

/**
 * No Results from Filter Empty State
 */
export function NoResultsEmptyState({ onClearFilters }: { onClearFilters?: () => void }) {
  return (
    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-12 text-center">
      <div className="text-6xl mb-4">🔍</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        No trades match your current filters. Try adjusting your search criteria or clearing filters.
      </p>
      {onClearFilters && (
        <Button onClick={onClearFilters} variant="outline" size="lg" className="min-h-[44px]">
          🔄 Clear All Filters
        </Button>
      )}
    </div>
  );
}

/**
 * Error State Component
 */
export function ErrorState({ 
  title = "Something went wrong",
  description = "We couldn't load the data. Please try again.",
  onRetry 
}: { 
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="bg-red-50 border-2 border-red-300 rounded-lg p-12 text-center">
      <div className="text-6xl mb-4">⚠️</div>
      <h3 className="text-xl font-semibold text-red-900 mb-2">{title}</h3>
      <p className="text-red-700 mb-6 max-w-md mx-auto">{description}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="lg" className="min-h-[44px]">
          🔄 Try Again
        </Button>
      )}
    </div>
  );
}
