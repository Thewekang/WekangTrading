'use client';

import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';
import type { AggregatedStats } from '@/lib/types/disciplineTracker';

interface StatsDisplayProps {
  stats: AggregatedStats;
}

export function StatsDisplay({ stats }: StatsDisplayProps) {
  const pnlColor = stats.totalPnl >= 0 ? 'text-green-600' : 'text-rose-600';
  const PnlIcon = stats.totalPnl >= 0 ? TrendingUp : TrendingDown;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {/* Total P&L */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total P&L</p>
              <p className={`text-2xl font-bold ${pnlColor}`}>
                ${stats.totalPnl.toFixed(2)}
              </p>
            </div>
            <PnlIcon className={`h-8 w-8 ${pnlColor}`} />
          </div>
        </CardContent>
      </Card>

      {/* Win Rate */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.winRate.toFixed(1)}%
              </p>
            </div>
            <Target className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      {/* Total Wins */}
      <Card>
        <CardContent className="pt-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Wins</p>
            <p className="text-2xl font-bold text-green-600">{stats.totalWins}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalTrades > 0 ? `${((stats.totalWins / stats.totalTrades) * 100).toFixed(1)}% of total` : '0%'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Total Losses */}
      <Card>
        <CardContent className="pt-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Losses</p>
            <p className="text-2xl font-bold text-rose-600">{stats.totalLosses}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalTrades > 0 ? `${((stats.totalLosses / stats.totalTrades) * 100).toFixed(1)}% of total` : '0%'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Breakevens */}
      <Card>
        <CardContent className="pt-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Breakevens</p>
            <p className="text-2xl font-bold text-amber-600">{stats.totalBE}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Total Trades: {stats.totalTrades}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
