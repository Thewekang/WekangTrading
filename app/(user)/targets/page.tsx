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
import TargetHistoryTable from '@/components/targets/TargetHistoryTable';

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
      <TargetHistoryTable targets={inactiveTargets} />

      {/* Info Section */}
      <div className="mt-12 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">📚 About Targets</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p><strong>Weekly Targets:</strong> Set goals for the next 7 days</p>
          <p><strong>Monthly Targets:</strong> Set goals for the next 30 days</p>
          <p><strong>Yearly Targets:</strong> Set long-term goals for the next 365 days</p>
          <p className="mt-4"><strong>Mark Complete:</strong> Manually complete a target when you've achieved your goals</p>
          <p className="mt-4 text-xs text-gray-600">
            💡 Tip: Completed targets are stored in history for your records.
          </p>
        </div>
      </div>
    </div>
  );
}
