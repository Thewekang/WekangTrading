/**
 * Target History Table Component
 * Displays inactive/completed targets with timezone-aware dates
 */
'use client';

import type { UserTarget } from '@/lib/db/schema/targets';
import { useTimezone } from '@/contexts/TimezoneContext';

interface TargetHistoryTableProps {
  targets: UserTarget[];
}

export default function TargetHistoryTable({ targets }: TargetHistoryTableProps) {
  const { formatDate } = useTimezone();

  if (targets.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">📜 Target History</h2>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Period
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Completed
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {targets.map((target) => {
              const isManuallyCompleted = target.completedAt !== null;
              return (
                <tr key={target.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {target.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                      target.targetCategory === 'PROP_FIRM' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {target.targetCategory === 'PROP_FIRM' ? '🏆 Prop Firm' : '📊 Personal'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600" suppressHydrationWarning>
                    {formatDate(target.startDate, { month: 'short', day: 'numeric', year: 'numeric' })} - {formatDate(target.endDate, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isManuallyCompleted ? (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        ✓ Completed
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                        Deactivated
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600" suppressHydrationWarning>
                    {isManuallyCompleted && target.completedAt
                      ? formatDate(target.completedAt, { month: 'short', day: 'numeric', year: 'numeric' })
                      : '-'
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
