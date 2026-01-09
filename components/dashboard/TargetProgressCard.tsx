/**
 * Target Progress Card Component (for Dashboard)
 * Compact version of target display for dashboard
 */
import Link from 'next/link';
import type { TargetWithProgress } from '@/lib/services/targetService';

interface TargetProgressCardProps {
  target: TargetWithProgress;
}

export default function TargetProgressCard({ target }: TargetProgressCardProps) {
  const { progress } = target;

  // Status styling
  const statusConfig = {
    'on-track': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: '✓' },
    'at-risk': { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', icon: '⚠' },
    'behind': { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: '⚠' },
    'completed': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: '✓' },
    'failed': { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', icon: '✗' },
  };

  const status = statusConfig[progress.status];

  return (
    <Link href="/targets">
      <div className={`${status.bg} ${status.border} border-2 rounded-lg p-5 hover:shadow-md transition-shadow cursor-pointer`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{target.targetType}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {progress.daysRemaining} days left
            </p>
          </div>
          <span className={`text-lg ${status.text}`}>{status.icon}</span>
        </div>

        {/* Mini Progress Bars */}
        <div className="space-y-2">
          {/* Win Rate */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-600">Win Rate</span>
              <span className="font-semibold text-gray-900">
                {progress.currentWinRate}% / {target.targetWinRate}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${
                  progress.winRateProgress >= 100 
                    ? 'bg-green-500' 
                    : progress.isWinRateOnTrack 
                    ? 'bg-blue-500' 
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(progress.winRateProgress, 100)}%` }}
              />
            </div>
          </div>

          {/* SOP Rate */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-600">SOP</span>
              <span className="font-semibold text-gray-900">
                {progress.currentSopRate}% / {target.targetSopRate}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${
                  progress.sopRateProgress >= 100 
                    ? 'bg-green-500' 
                    : progress.isSopRateOnTrack 
                    ? 'bg-blue-500' 
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(progress.sopRateProgress, 100)}%` }}
              />
            </div>
          </div>

          {/* Profit (if set) */}
          {target.targetProfitUsd && progress.profitProgress !== null && (
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-600">Profit</span>
                <span className="font-semibold text-gray-900">
                  ${progress.currentProfitUsd} / ${target.targetProfitUsd}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${
                    progress.profitProgress >= 100 
                      ? 'bg-green-500' 
                      : (progress.isProfitOnTrack ?? false)
                      ? 'bg-blue-500' 
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(progress.profitProgress, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Status Label */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className={`text-xs font-medium ${status.text}`}>
            {progress.status === 'on-track' && 'On Track ✓'}
            {progress.status === 'at-risk' && 'At Risk'}
            {progress.status === 'behind' && 'Behind Schedule'}
            {progress.status === 'completed' && 'Completed!'}
            {progress.status === 'failed' && 'Not Achieved'}
          </p>
        </div>
      </div>
    </Link>
  );
}
