'use client';

import type { CycleStatus } from '@/lib/services/accountRulesService';
import { Target, PartyPopper } from 'lucide-react';

interface CycleProfitTargetCardProps {
  status: CycleStatus;
  currency?: string;
  onRecordWithdrawal?: () => void;
}

export function CycleProfitTargetCard({ status, currency = 'USD', onRecordWithdrawal }: CycleProfitTargetCardProps) {
  if (!status.cycleTargetProfitUsd) return null;

  const progress = Math.min(status.cycleProgressPct ?? 0, 100);
  const isReached = status.targetReached;

  return (
    <div className={`rounded-lg border p-5 space-y-3 ${isReached ? 'bg-green-50 border-green-300' : 'bg-white'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isReached ? <PartyPopper className="h-5 w-5 text-green-600" /> : <Target className="h-5 w-5 text-blue-600" />}
          <h3 className="font-semibold text-gray-900">Cycle Profit Target</h3>
        </div>
        <span className={`text-sm font-semibold ${isReached ? 'text-green-700' : 'text-blue-700'}`}>
          {progress.toFixed(1)}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isReached ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{status.currentCyclePnl.toFixed(2)} {currency} earned</span>
          <span>Target: {status.cycleTargetProfitUsd.toFixed(2)} {currency}</span>
        </div>
      </div>

      {isReached && (
        <div className="bg-green-100 rounded-md p-3 text-sm text-green-800 space-y-2">
          <p className="font-medium">🎉 Target reached! Consider recording a withdrawal to start a new cycle.</p>
          {onRecordWithdrawal && (
            <button
              onClick={onRecordWithdrawal}
              className="text-green-700 underline underline-offset-2 hover:text-green-900 text-xs"
            >
              Record withdrawal →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
