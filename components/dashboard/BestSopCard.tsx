'use client';

import { Card } from '@/components/ui/card';

interface BestSopData {
  sopTypeName: string;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalProfitLoss: number;
}

interface BestSopCardProps {
  data: BestSopData | null;
  period: 'week' | 'month' | 'year' | 'all';
}

export function BestSopCard({ data, period }: BestSopCardProps) {
  const periodLabels = {
    week: 'This Week',
    month: 'This Month',
    year: 'This Year',
    all: 'All Time'
  };

  if (!data) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-3xl">🏆</div>
          <div>
            <h3 className="text-lg font-bold">Best Performing SOP</h3>
            <p className="text-sm text-gray-600">{periodLabels[period]}</p>
          </div>
        </div>
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No SOP data available yet</p>
          <p className="text-xs mt-1">Start tracking trades with specific SOP types</p>
        </div>
      </Card>
    );
  }

  const winRateColor = data.winRate >= 70 ? 'text-green-600' : data.winRate >= 50 ? 'text-yellow-600' : 'text-red-600';
  const pnlColor = data.totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600';

  return (
    <Card className="p-6 border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-white">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-3xl">🏆</div>
        <div>
          <h3 className="text-lg font-bold">Best Performing SOP</h3>
          <p className="text-sm text-gray-600">{periodLabels[period]}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* SOP Type Name */}
        <div className="bg-white rounded-lg p-4 border-2 border-yellow-300">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {data.sopTypeName}
            </div>
            <div className="text-sm text-gray-600">Strategy</div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Win Rate */}
          <div className="bg-white rounded-lg p-3 text-center border">
            <div className={`text-2xl font-bold ${winRateColor}`}>
              {data.winRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-600 mt-1">Win Rate</div>
          </div>

          {/* Total Trades */}
          <div className="bg-white rounded-lg p-3 text-center border">
            <div className="text-2xl font-bold text-blue-600">
              {data.totalTrades}
            </div>
            <div className="text-xs text-gray-600 mt-1">Trades</div>
          </div>

          {/* Win/Loss */}
          <div className="bg-white rounded-lg p-3 text-center border">
            <div className="text-sm font-semibold text-gray-700">
              <span className="text-green-600">{data.wins}W</span> / <span className="text-red-600">{data.losses}L</span>
            </div>
            <div className="text-xs text-gray-600 mt-1">Record</div>
          </div>

          {/* Profit/Loss */}
          <div className="bg-white rounded-lg p-3 text-center border">
            <div className={`text-lg font-bold ${pnlColor}`}>
              {data.totalProfitLoss >= 0 ? '+' : ''}{data.totalProfitLoss.toFixed(2)}
            </div>
            <div className="text-xs text-gray-600 mt-1">P/L (USD)</div>
          </div>
        </div>

        <div className="text-center text-xs text-gray-500 pt-2 border-t">
          💡 This SOP has the highest win rate for the selected period
        </div>
      </div>
    </Card>
  );
}
