/**
 * Target Card Component
 * Displays a target with progress indicators
 */
'use client';

import type { TargetWithProgress } from '@/lib/services/targetService';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { showToast } from '@/components/ui/Toast';
import { useTimezone } from '@/contexts/TimezoneContext';

interface TargetCardProps {
  target: TargetWithProgress;
}

export default function TargetCard({ target }: TargetCardProps) {
  const router = useRouter();
  const { formatDate } = useTimezone();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const { progress } = target;

  // Check if target is in the future
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(target.startDate);
  startDate.setHours(0, 0, 0, 0);
  const isFutureTarget = startDate > today;
  const daysUntilStart = isFutureTarget 
    ? Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

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

  const handleMarkComplete = async () => {
    setShowCompleteConfirm(false);
    setIsCompleting(true);

    try {
      const response = await fetch(`/api/targets/${target.id}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        showToast('Target marked as completed! 🎉', 'success');
        router.refresh();
      } else {
        const data = await response.json();
        showToast(data.error?.message || 'Failed to complete target', 'error');
      }
    } catch (error) {
      console.error('Complete error:', error);
      showToast('An error occurred while completing target', 'error');
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
      {/* Future Target Indicator */}
      {isFutureTarget && (
        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
          <span className="text-blue-700 font-medium">
            📅 Starts in {daysUntilStart} {daysUntilStart === 1 ? 'day' : 'days'}
          </span>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">{target.name}</h3>
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${
              target.targetCategory === 'PROP_FIRM' 
                ? 'bg-purple-100 text-purple-700' 
                : 'bg-blue-100 text-blue-700'
            }`}>
              {target.targetCategory === 'PROP_FIRM' ? '🏆 Prop Firm' : '📊 Personal'}
            </span>
            <span className="px-2 py-0.5 text-xs font-medium text-gray-600 bg-gray-100 rounded">
              {target.targetType}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1" suppressHydrationWarning>
            {formatDate(target.startDate, { month: 'short', day: 'numeric', year: 'numeric' })} - {formatDate(target.endDate, { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.bg} ${status.text} whitespace-nowrap`}>
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
        {/* Mark Complete Button - Only show for active, non-completed targets */}
        {progress.status !== 'completed' && progress.status !== 'failed' && (
          <button
            onClick={() => setShowCompleteConfirm(true)}
            disabled={isCompleting}
            className="flex-1 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-md hover:bg-green-100 transition-colors disabled:opacity-50"
          >
            {isCompleting ? 'Completing...' : '✓ Mark Complete'}
          </button>
        )}
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
      {showCompleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Mark Target as Completed</h3>
            <p className="text-sm text-gray-600 mb-6">
              This will mark your target as completed and move it to history. This action cannot be undone.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Win Rate:</span>
                  <span className="font-medium">{progress.currentWinRate}% / {target.targetWinRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">SOP Compliance:</span>
                  <span className="font-medium">{progress.currentSopRate}% / {target.targetSopRate}%</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCompleteConfirm(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkComplete}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                Mark Complete
              </button>
            </div>
          </div>
        </div>
      )}

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
