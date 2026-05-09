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
  const remaining = Math.max(0, status.cycleTargetProfitUsd - status.currentCyclePnl);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
        <div className={`p-1.5 rounded-lg ${isReached ? 'bg-green-100' : 'bg-blue-100'}`}>
          {isReached
            ? <PartyPopper className="h-4 w-4 text-green-600" />
            : <Target className="h-4 w-4 text-blue-600" />}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-sm">Cycle Profit Target</h3>
          <p className="text-xs text-gray-400">{isReached ? 'Target reached this cycle' : 'Track progress toward your goal'}</p>
        </div>
        <span className={`text-lg font-bold ${isReached ? 'text-green-700' : 'text-blue-700'}`}>
          {progress.toFixed(1)}%
        </span>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-4">
        {/* Progress bar */}
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isReached
              ? 'bg-gradient-to-r from-green-400 to-emerald-500'
              : 'bg-gradient-to-r from-blue-400 to-indigo-500'}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Earned</p>
            <p className={`text-sm font-bold ${status.currentCyclePnl >= 0 ? 'text-green-700' : 'text-red-600'}`}>
              {status.currentCyclePnl >= 0 ? '+' : ''}{status.currentCyclePnl.toFixed(2)} {currency}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Remaining</p>
            <p className="text-sm font-bold text-gray-700">
              {isReached ? '—' : `${remaining.toFixed(2)} ${currency}`}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Target</p>
            <p className="text-sm font-bold text-gray-700">
              {status.cycleTargetProfitUsd.toFixed(2)} {currency}
            </p>
          </div>
        </div>

        {isReached && onRecordWithdrawal && (
          <button
            onClick={onRecordWithdrawal}
            className="w-full text-center text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 transition-colors rounded-md py-1.5"
          >
            🎉 Record withdrawal to start new cycle →
          </button>
        )}

        {isReached && !onRecordWithdrawal && (
          <p className="text-xs text-center text-green-700 font-medium bg-green-50 rounded-md py-1.5">
            🎉 Target reached! Record a withdrawal to start a new cycle.
          </p>
        )}
      </div>
    </div>
  );
}
