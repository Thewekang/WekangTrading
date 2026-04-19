'use client';

import type { CycleStatus } from '@/lib/services/accountRulesService';
import { Shield, AlertTriangle, XCircle } from 'lucide-react';

// Progress bar for a drawdown metric
function DrawdownBar({ label, usedPct, limitPct }: { label: string; usedPct: number | null; limitPct: number }) {
  if (usedPct === null) return null;
  const capped = Math.min(usedPct, 100);
  const color = usedPct >= 100 ? 'bg-red-500' : usedPct >= 80 ? 'bg-yellow-400' : 'bg-green-500';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{label}</span>
        <span className={usedPct >= 80 ? 'font-semibold text-red-600' : ''}>{usedPct.toFixed(1)}% / {limitPct}%</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${capped}%` }} />
      </div>
    </div>
  );
}

const HEALTH_CONFIG = {
  SAFE: { icon: Shield, color: 'text-green-600', bg: 'bg-green-50 border-green-200', label: 'Safe' },
  WARNING: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', label: 'Warning' },
  BREACHED: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-200', label: 'Breached' },
};

interface DrawdownStatusCardProps {
  status: CycleStatus;
  currency?: string;
}

export function DrawdownStatusCard({ status, currency = 'USD' }: DrawdownStatusCardProps) {
  const config = HEALTH_CONFIG[status.healthStatus];
  const Icon = config.icon;

  return (
    <div className={`rounded-lg border p-5 space-y-4 ${config.bg}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Account Health</h3>
        <div className={`flex items-center gap-1.5 text-sm font-medium ${config.color}`}>
          <Icon className="h-4 w-4" />
          {config.label}
        </div>
      </div>

      {/* P&L Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/60 rounded-md p-3">
          <p className="text-xs text-gray-500 mb-0.5">Cycle P&L</p>
          <p className={`text-lg font-bold ${status.currentCyclePnl >= 0 ? 'text-green-700' : 'text-red-600'}`}>
            {status.currentCyclePnl >= 0 ? '+' : ''}{status.currentCyclePnl.toFixed(2)} {currency}
          </p>
          {status.cycleStartDate && (
            <p className="text-xs text-gray-400 mt-0.5">Since {status.cycleStartDate.toLocaleDateString()}</p>
          )}
        </div>
        <div className="bg-white/60 rounded-md p-3">
          <p className="text-xs text-gray-500 mb-0.5">Cumulative P&L</p>
          <p className={`text-lg font-bold ${status.cumulativePnl >= 0 ? 'text-green-700' : 'text-red-600'}`}>
            {status.cumulativePnl >= 0 ? '+' : ''}{status.cumulativePnl.toFixed(2)} {currency}
          </p>
        </div>
      </div>

      {/* Drawdown Bars */}
      {(status.dailyDrawdownUsedPct !== null || status.totalDrawdownUsedPct !== null) && (
        <div className="space-y-3">
          {status.dailyDrawdownUsedPct !== null && (
            <DrawdownBar label="Daily Drawdown Used" usedPct={status.dailyDrawdownUsedPct} limitPct={100} />
          )}
          {status.totalDrawdownUsedPct !== null && (
            <DrawdownBar label="Total Drawdown Used" usedPct={status.totalDrawdownUsedPct} limitPct={100} />
          )}
        </div>
      )}

      {/* Consistency */}
      {status.consistencyTargetPct !== null && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Consistency Rule</span>
          <span className={`font-semibold ${status.consistencyStatus === 'PASS' ? 'text-green-600' : status.consistencyStatus === 'FAIL' ? 'text-red-600' : 'text-gray-400'}`}>
            {status.consistencyStatus === 'N/A' ? 'N/A' : `${status.currentConsistencyPct?.toFixed(1) ?? '—'}% / ${status.consistencyTargetPct}% — ${status.consistencyStatus}`}
          </span>
        </div>
      )}

      {/* Withdrawal Info */}
      {status.totalWithdrawn > 0 && (
        <div className="border-t border-purple-200 pt-3 space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-purple-600 font-medium">Total Withdrawn</span>
            <span className="font-bold text-purple-700">−{status.totalWithdrawn.toFixed(2)} {currency}</span>
          </div>
          {status.lastWithdrawal && (
            <div className="flex items-center justify-between text-xs text-purple-400">
              <span>Last withdrawal</span>
              <span>−{status.lastWithdrawal.amount.toFixed(2)} on {status.lastWithdrawal.date}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
