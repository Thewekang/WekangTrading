/**
 * Chart Skeleton Component
 * Loading placeholder for lazy-loaded chart components
 */

export default function ChartSkeleton() {
  return (
    <div className="w-full h-[300px] bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-2"></div>
        <p className="text-sm text-gray-500">Loading chart...</p>
      </div>
    </div>
  );
}
