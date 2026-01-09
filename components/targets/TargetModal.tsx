/**
 * Target Modal Component
 * Form to create a new target with AI suggestions
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface TargetModalProps {
  onClose: () => void;
}

export default function TargetModal({ onClose }: TargetModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<any>(null);
  const [formData, setFormData] = useState({
    targetType: 'WEEKLY' as 'WEEKLY' | 'MONTHLY' | 'YEARLY',
    targetWinRate: 60,
    targetSopRate: 80,
    targetProfitUsd: '' as string | number,
    startDate: '',
    endDate: '',
    notes: '',
  });

  // Set default dates based on target type
  useEffect(() => {
    const today = new Date();
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    if (formData.targetType === 'WEEKLY') {
      end.setDate(end.getDate() + 7);
    } else if (formData.targetType === 'MONTHLY') {
      end.setDate(end.getDate() + 30);
    } else {
      end.setDate(end.getDate() + 365);
    }

    setFormData(prev => ({
      ...prev,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    }));
  }, [formData.targetType]);

  // Load suggestions when target type changes
  useEffect(() => {
    loadSuggestions();
  }, [formData.targetType]);

  const loadSuggestions = async () => {
    setIsLoadingSuggestions(true);
    try {
      const response = await fetch(`/api/targets/suggestions?targetType=${formData.targetType}`);
      const result = await response.json();
      if (result.success) {
        setSuggestions(result.data);
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const applySuggestions = () => {
    if (!suggestions) return;
    setFormData(prev => ({
      ...prev,
      targetWinRate: suggestions.suggestedWinRate,
      targetSopRate: suggestions.suggestedSopRate,
      targetProfitUsd: suggestions.suggestedProfitUsd || '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          targetWinRate: Number(formData.targetWinRate),
          targetSopRate: Number(formData.targetSopRate),
          targetProfitUsd: formData.targetProfitUsd ? Number(formData.targetProfitUsd) : undefined,
          notes: formData.notes || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        router.refresh();
        onClose();
      } else {
        alert(result.error?.message || 'Failed to create target');
      }
    } catch (error) {
      console.error('Create target error:', error);
      alert('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Create New Target</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Target Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Type
            </label>
            <select
              value={formData.targetType}
              onChange={(e) => setFormData({ ...formData, targetType: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="WEEKLY">Weekly (7 days)</option>
              <option value="MONTHLY">Monthly (30 days)</option>
              <option value="YEARLY">Yearly (365 days)</option>
            </select>
          </div>

          {/* AI Suggestions */}
          {suggestions && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-blue-900">💡 AI Suggestions</p>
                  <p className="text-xs text-blue-700 mt-1">{suggestions.reasoning}</p>
                </div>
                <button
                  type="button"
                  onClick={applySuggestions}
                  className="text-xs font-medium text-blue-700 hover:text-blue-900 underline"
                >
                  Apply
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                <div className="bg-white rounded px-2 py-1">
                  <p className="text-gray-600">Win Rate</p>
                  <p className="font-semibold text-gray-900">{suggestions.suggestedWinRate}%</p>
                </div>
                <div className="bg-white rounded px-2 py-1">
                  <p className="text-gray-600">SOP Rate</p>
                  <p className="font-semibold text-gray-900">{suggestions.suggestedSopRate}%</p>
                </div>
                <div className="bg-white rounded px-2 py-1">
                  <p className="text-gray-600">Profit</p>
                  <p className="font-semibold text-gray-900">${suggestions.suggestedProfitUsd}</p>
                </div>
              </div>
            </div>
          )}

          {/* Target Values */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Win Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.targetWinRate}
                onChange={(e) => setFormData({ ...formData, targetWinRate: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target SOP Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.targetSopRate}
                onChange={(e) => setFormData({ ...formData, targetSopRate: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Profit (USD) - Optional
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.targetProfitUsd}
              onChange={(e) => setFormData({ ...formData, targetProfitUsd: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Leave empty to skip profit target"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              maxLength={500}
              placeholder="Add any additional context for this target..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Target'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
