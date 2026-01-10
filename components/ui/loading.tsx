/**
 * Loading Component
 * Reusable loading states for different UI contexts
 */

export function LoadingSpinner({ size = 'md', text }: { size?: 'sm' | 'md' | 'lg'; text?: string }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizeClasses[size]} border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin`} />
      {text && <p className="text-sm text-gray-600 animate-pulse">{text}</p>}
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="bg-white rounded-lg shadow border p-6 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
      <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
    </div>
  );
}

export function LoadingTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-lg shadow border overflow-hidden">
      <div className="animate-pulse">
        {/* Table header */}
        <div className="bg-gray-50 px-6 py-3 border-b">
          <div className="flex gap-4">
            {Array.from({ length: cols }).map((_, i) => (
              <div key={i} className="h-3 bg-gray-200 rounded flex-1"></div>
            ))}
          </div>
        </div>
        {/* Table rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-6 py-4 border-b last:border-b-0">
            <div className="flex gap-4">
              {Array.from({ length: cols }).map((_, j) => (
                <div key={j} className="h-3 bg-gray-200 rounded flex-1"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header skeleton */}
        <div className="mb-8 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>

        {/* Stats cards skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingCard key={i} />
          ))}
        </div>

        {/* Content skeleton */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white rounded-lg shadow border p-6 h-64 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-full bg-gray-100 rounded"></div>
          </div>
          <div className="bg-white rounded-lg shadow border p-6 h-64 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-full bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LoadingButton() {
  return (
    <div className="flex items-center gap-2">
      <LoadingSpinner size="sm" />
      <span>Loading...</span>
    </div>
  );
}
