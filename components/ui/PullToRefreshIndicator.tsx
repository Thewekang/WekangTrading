'use client';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  pullProgress: number;
  isRefreshing: boolean;
  isPulling: boolean;
}

/**
 * Visual indicator for pull-to-refresh gesture.
 * Shows a spinner that scales with pull distance.
 */
export function PullToRefreshIndicator({
  pullDistance,
  pullProgress,
  isRefreshing,
  isPulling,
}: PullToRefreshIndicatorProps) {
  if (!isPulling && !isRefreshing) return null;

  return (
    <div
      className="flex items-center justify-center overflow-hidden transition-all duration-150 ease-out"
      style={{ height: `${pullDistance}px` }}
    >
      <div
        className={`flex flex-col items-center gap-1 transition-opacity duration-200 ${
          pullProgress > 0.3 ? 'opacity-100' : 'opacity-50'
        }`}
      >
        {isRefreshing ? (
          <>
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
            <span className="text-xs text-gray-500">Refreshing...</span>
          </>
        ) : (
          <>
            <div
              className="text-lg transition-transform duration-150"
              style={{
                transform: `rotate(${pullProgress * 180}deg)`,
              }}
            >
              ↓
            </div>
            <span className="text-xs text-gray-500">
              {pullProgress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
