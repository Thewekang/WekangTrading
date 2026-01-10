import { LoadingTable } from '@/components/ui/loading';

export default function Loading() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header skeleton */}
        <div className="mb-8 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>

        {/* Filters skeleton */}
        <div className="bg-white rounded-lg shadow border p-4 mb-6 animate-pulse">
          <div className="flex gap-4">
            <div className="h-10 bg-gray-200 rounded flex-1"></div>
            <div className="h-10 bg-gray-200 rounded flex-1"></div>
            <div className="h-10 bg-gray-200 rounded flex-1"></div>
          </div>
        </div>

        {/* Table skeleton */}
        <LoadingTable rows={10} cols={6} />
      </div>
    </div>
  );
}
