/**
 * Targets Management Page
 * View, create, and manage trading targets
 */

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getActiveTargetsWithProgress, getTargets } from '@/lib/services/targetService';
import TargetCard from '@/components/targets/TargetCard';
import CreateTargetButton from '@/components/targets/CreateTargetButton';

export default async function TargetsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const [activeTargets, inactiveTargets] = await Promise.all([
    getActiveTargetsWithProgress(session.user.id),
    getTargets(session.user.id, { active: false }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🎯 Trading Targets</h1>
            <p className="mt-2 text-gray-600">
              Set and track your performance goals
            </p>
          </div>
          <CreateTargetButton />
        </div>
      </div>

      {/* Active Targets */}
      {activeTargets.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Targets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTargets.map((target) => (
              <TargetCard key={target.id} target={target} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State for Active Targets */}
      {activeTargets.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 mb-12">
          <div className="text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              No Active Targets
            </h3>
            <p className="text-sm text-blue-700 mb-4">
              Set your first trading target to start tracking your progress towards your goals
            </p>
            <CreateTargetButton />
          </div>
        </div>
      )}

      {/* Inactive/Completed Targets */}
      {inactiveTargets.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Past Targets</h2>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Win Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SOP Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profit Target
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inactiveTargets.map((target) => (
                  <tr key={target.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {target.targetType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(target.startDate).toLocaleDateString()} - {new Date(target.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {target.targetWinRate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {target.targetSopRate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {target.targetProfitUsd ? `$${target.targetProfitUsd.toFixed(2)}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-12 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">📚 About Targets</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p><strong>Weekly Targets:</strong> Set goals for the next 7 days</p>
          <p><strong>Monthly Targets:</strong> Set goals for the next 30 days</p>
          <p><strong>Yearly Targets:</strong> Set long-term goals for the next 365 days</p>
          <p className="mt-4 text-xs text-gray-600">
            💡 Tip: Only one active target per type is allowed. Creating a new target will automatically deactivate the previous one.
          </p>
        </div>
      </div>
    </div>
  );
}
