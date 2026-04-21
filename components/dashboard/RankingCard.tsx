'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useActiveAccount } from '@/contexts/ActiveAccountContext';

interface RankingData {
  rank: number | null;
  totalUsers: number;
  winRate: number;
  sopRate: number;
  totalPnl: number;
  totalTrades: number;
  percentile: number;
  rankChange: number;
  needMoreTrades?: number;
}

export function RankingCard() {
  const { activeAccount } = useActiveAccount();
  const [ranking, setRanking] = useState<RankingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRanking();
  }, [activeAccount?.id]);

  async function fetchRanking() {
    try {
      setLoading(true);
      const acctParam = activeAccount?.id ? `?accountId=${activeAccount.id}` : '';
      const response = await fetch(`/api/stats/ranking${acctParam}`);
      const data = await response.json();

      if (data.success) {
        setRanking(data.data);
      } else {
        setError(data.error?.message || 'Failed to load ranking');
      }
    } catch (err) {
      console.error('Error fetching ranking:', err);
      setError('Failed to load ranking');
    } finally {
      setLoading(false);
    }
  }

  async function refreshRanking() {
    try {
      setRefreshing(true);
      const acctParam = activeAccount?.id ? `?accountId=${activeAccount.id}` : '';
      const response = await fetch(`/api/stats/ranking${acctParam}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setRanking(data.data);
      }
    } catch (err) {
      console.error('Error refreshing ranking:', err);
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <Card className="border-yellow-500/20">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-yellow-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Your Ranking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!ranking) {
    return null;
  }

  // Not enough trades to be ranked
  if (ranking.rank === null && ranking.needMoreTrades !== undefined) {
    return (
      <Card className="border-yellow-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Your Ranking
          </CardTitle>
          <CardDescription>
            Complete {ranking.needMoreTrades} more trade{ranking.needMoreTrades !== 1 ? 's' : ''} to get ranked
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Current trades: {ranking.totalTrades} / 10 minimum
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // User has ranking
  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500 text-yellow-950 hover:bg-yellow-500';
    if (rank === 2) return 'bg-gray-400 text-gray-950 hover:bg-gray-400';
    if (rank === 3) return 'bg-amber-600 text-amber-950 hover:bg-amber-600';
    return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/10';
  };

  const getRankChangeIcon = () => {
    if (ranking.rankChange > 0) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (ranking.rankChange < 0) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 90) return 'text-green-500';
    if (percentile >= 75) return 'text-blue-500';
    if (percentile >= 50) return 'text-yellow-500';
    return 'text-orange-500';
  };

  return (
    <Card className="border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Your Ranking
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-7 w-7"
            onClick={refreshRanking}
            disabled={refreshing}
            title="Refresh ranking"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
        <CardDescription>
          Anonymous position among all traders
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rank Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge className={getRankBadgeColor(ranking.rank!)} variant="secondary">
              #{ranking.rank}
            </Badge>
            <div>
              <p className="text-sm font-medium">
                Rank {ranking.rank} of {ranking.totalUsers}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {getRankChangeIcon()}
                {ranking.rankChange === 0 ? (
                  <span>No change</span>
                ) : (
                  <span>
                    {ranking.rankChange > 0 ? '+' : ''}
                    {ranking.rankChange} from last update
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Percentile */}
        <div className="pt-4 border-t border-yellow-500/10">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Percentile</span>
            <span className={`text-lg font-bold ${getPercentileColor(ranking.percentile)}`}>
              {ranking.percentile.toFixed(1)}%
            </span>
          </div>
          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 transition-all"
              style={{ width: `${ranking.percentile}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-yellow-500/10">
          <div>
            <p className="text-xs text-muted-foreground">Win Rate</p>
            <p className="text-lg font-semibold text-green-500">{ranking.winRate.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">SOP Rate</p>
            <p className="text-lg font-semibold text-blue-500">{ranking.sopRate.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total P&L</p>
            <p className={`text-lg font-semibold ${ranking.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${ranking.totalPnl.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Trades</p>
            <p className="text-lg font-semibold">{ranking.totalTrades}</p>
          </div>
        </div>

        {/* Info */}
        <div className="pt-4 border-t border-yellow-500/10">
          <p className="text-xs text-muted-foreground">
            Rankings updated hourly. Only traders with 10+ trades are ranked.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
