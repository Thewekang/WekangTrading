'use client';

import { memo } from 'react';
import { Card } from '@/components/ui/card';
import type { SymbolStats } from '@/lib/services/statsService';

interface SymbolStatsCardProps {
  data: SymbolStats;
}

export const SymbolStatsCard = memo(({ data }: SymbolStatsCardProps) => {
  if (data.all.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-3xl">💱</div>
          <div>
            <h3 className="text-lg font-bold">Symbol Performance</h3>
            <p className="text-sm text-gray-600">All Time</p>
          </div>
        </div>
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No symbol data available yet</p>
          <p className="text-xs mt-1">Start adding a symbol when logging trades</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="text-3xl">💱</div>
        <div>
          <h3 className="text-lg font-bold">Symbol Performance</h3>
          <p className="text-sm text-gray-600">All Time</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Most Profitable Symbols */}
        <div>
          <h4 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-1">
            🏆 Most Profitable
          </h4>
          <div className="space-y-2">
            {data.topProfitable.filter(s => s.netProfitLoss > 0).slice(0, 5).map((s) => (
              <div key={s.symbol} className="flex items-center justify-between p-2 rounded-lg bg-green-50 border border-green-100">
                <div>
                  <span className="font-mono text-sm font-semibold text-gray-900">{s.symbol}</span>
                  <span className="ml-2 text-xs text-gray-500">{s.totalTrades}T · {s.winRate}%WR</span>
                </div>
                <span className="text-sm font-bold text-green-600">
                  +${s.netProfitLoss.toFixed(2)}
                </span>
              </div>
            ))}
            {data.topProfitable.filter(s => s.netProfitLoss > 0).length === 0 && (
              <p className="text-xs text-gray-400 py-2">No profitable symbols yet</p>
            )}
          </div>
        </div>

        {/* Most Loss Symbols */}
        <div>
          <h4 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-1">
            ⚠️ Biggest Losses
          </h4>
          <div className="space-y-2">
            {data.topLoss.filter(s => s.netProfitLoss < 0).slice(0, 5).map((s) => (
              <div key={s.symbol} className="flex items-center justify-between p-2 rounded-lg bg-red-50 border border-red-100">
                <div>
                  <span className="font-mono text-sm font-semibold text-gray-900">{s.symbol}</span>
                  <span className="ml-2 text-xs text-gray-500">{s.totalTrades}T · {s.winRate}%WR</span>
                </div>
                <span className="text-sm font-bold text-red-600">
                  -${Math.abs(s.netProfitLoss).toFixed(2)}
                </span>
              </div>
            ))}
            {data.topLoss.filter(s => s.netProfitLoss < 0).length === 0 && (
              <p className="text-xs text-gray-400 py-2">No loss symbols yet</p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
});

SymbolStatsCard.displayName = 'SymbolStatsCard';
