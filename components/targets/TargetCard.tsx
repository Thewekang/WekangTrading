/**
 * Target Card Component
 * Displays a target with progress indicators
 */
'use client';

import type { TargetWithProgress } from '@/lib/services/targetService';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { showToast } from '@/components/ui/Toast';

interface TargetCardProps {
  target: TargetWithProgress;
}

export default function TargetCard({ target }: TargetCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const { progress } = target;

  // Status badge styling
  const statusConfig = {
    'on-track': { bg: 'bg-green-100', text: 'text-green-800', label: '✓ On Track' },
    'at-risk': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '⚠ At Risk' },
    'behind': { bg: 'bg-red-100', text: 'text-red-800', label: '⚠ Behind' },
    'completed': { bg: 'bg-blue-100', text: 'text-blue-800', label: '✓ Completed' },
    'failed': { bg: 'bg-gray-100', text: 'text-gray-800', label: '✗ Failed' },
  };

  const status = statusConfig[progress.status];

  // Progress bar color based on progress percentage
  const getProgressColor = (progressPercent: number, isOnTrack: boolean) => {
    if (progressPercent >= 100) return 'bg-green-500';
    if (isOnTrack) return 'bg-blue-500';
    if (progressPercent >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/targets/${target.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showToast('Target deleted successfully', 'success');
        router.refresh();
      } else {
        showToast('Failed to delete target', 'error');
      }
    } catch (error) {
      console.error('Delete error:', error);
      showToast('An error occurred while deleting target', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeactivate = async () => {
    setShowDeactivateConfirm(false);

    try {
      const response = await fetch(`/api/targets/${target.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: false }),
      });

      if (response.ok) {
        showToast('Target deactivated successfully', 'success');
        router.refresh();
      } else {
        showToast('Failed to deactivate target', 'error');
      }
    } catch (error) {
      console.error('Deactivate error:', error);
      showToast('An error occurred while deactivating target', 'error');
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{target.targetType} Target</h3>
          <p className="text-xs text-gray-500 mt-1" suppressHydrationWarning>
            {new Date(target.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {new Date(target.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.bg} ${status.text}`}>
          {status.label}
        </span>
      </div>

      {/* Days Remaining */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Days Remaining</span>
          <span className="font-semibold text-gray-900">
            {progress.daysRemaining} / {progress.daysTotal}
          </span>
        </div>
      </div>

      {/* Win Rate Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-700 font-medium">Win Rate</span>
          <span className="text-gray-900 font-semibold">
            {progress.currentWinRate}% / {target.targetWinRate}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${getProgressColor(progress.winRateProgress, progress.isWinRateOnTrack)}`}
            style={{ width: `${Math.min(progress.winRateProgress, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {progress.winRateProgress.toFixed(1)}% of target achieved
        </p>
      </div>

      {/* SOP Rate Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-700 font-medium">SOP Compliance</span>
          <span className="text-gray-900 font-semibold">
            {progress.currentSopRate}% / {target.targetSopRate}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${getProgressColor(progress.sopRateProgress, progress.isSopRateOnTrack)}`}
            style={{ width: `${Math.min(progress.sopRateProgress, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {progress.sopRateProgress.toFixed(1)}% of target achieved
        </p>
      </div>

      {/* Profit Progress (if set) */}
      {target.targetProfitUsd && progress.profitProgress !== null && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-700 font-medium">Profit</span>
            <span className="text-gray-900 font-semibold">
              ${progress.currentProfitUsd.toFixed(2)} / ${target.targetProfitUsd.toFixed(2)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${getProgressColor(progress.profitProgress, progress.isProfitOnTrack ?? false)}`}
              style={{ width: `${Math.min(progress.profitProgress, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {progress.profitProgress.toFixed(1)}% of target achieved
          </p>
        </div>
      )}

      {/* Notes */}
      {target.notes && (
        <div className="mb-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-600">{target.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => setShowDeactivateConfirm(true)}
          className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Deactivate
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isDeleting}
          className="flex-1 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>

      {/* Confirmation Dialogs */}
      {showDeactivateConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Deactivate Target</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to deactivate this target? You can create a new one anytime.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeactivateConfirm(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivate}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Delete Target</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to permanently delete this target? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
