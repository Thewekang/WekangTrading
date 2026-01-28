'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Calendar, DollarSign, Target, CheckCircle } from 'lucide-react';

interface MonthlyPerformance {
  month: string;
  monthNumber: number;
  winRate: number;
  sopRate: number;
  pnl: number;
  trades: number;
  wins: number;
  losses: number;
  hasData: boolean;
}

interface PerformanceOverview {
  totalPnl: number;
  winRate: number;
  sopRate: number;
  totalTrades: number;
  totalWins: number;
  totalLosses: number;
  winLossRecord: string;
}

interface PerformanceData {
  year: number;
  overview: PerformanceOverview;
  monthlyBreakdown: MonthlyPerformance[];
}

export function MonthlyPerformanceView() {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailableYears();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      fetchPerformanceData(selectedYear);
    }
  }, [selectedYear]);

  async function fetchAvailableYears() {
    try {
      const response = await fetch('/api/analytics/performance?action=years');
      const data = await response.json();

      if (data.success) {
        setAvailableYears(data.data);
        if (data.data.length > 0) {
          setSelectedYear(data.data[0]); // Most recent year
        }
      }
    } catch (err) {
      console.error('Error fetching available years:', err);
    }
  }

  async function fetchPerformanceData(year: number) {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/analytics/performance?year=${year}`);
      const data = await response.json();

      if (data.success) {
        setPerformanceData(data.data);
      } else {
        setError(data.error?.message || 'Failed to load performance data');
      }
    } catch (err) {
      console.error('Error fetching performance data:', err);
      setError('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(12)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!performanceData) {
    return null;
  }

  const { overview, monthlyBreakdown } = performanceData;

  return (
    <div className="space-y-6">
      {/* Year Selector */}
      <div className="flex items-center gap-4">
        <label htmlFor="year-select" className="text-sm font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Select Year:
        </label>
        <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
          <SelectTrigger id="year-select" className="w-32">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map(year => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Overview Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total P&L Card - Orange */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-orange-500" />
              {selectedYear} P&L
            </CardDescription>
            <CardTitle className={`text-2xl ${overview.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${Math.abs(overview.totalPnl).toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{overview.winLossRecord}</p>
          </CardContent>
        </Card>

        {/* Win Rate Card - Green */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              {overview.winRate >= 60 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              Win Rate
            </CardDescription>
            <CardTitle className={`text-2xl ${overview.winRate >= 60 ? 'text-green-600' : overview.winRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
              {overview.winRate.toFixed(1)}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {overview.totalWins}W / {overview.totalLosses}L
            </p>
          </CardContent>
        </Card>

        {/* SOP Rate Card - Blue */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-500" />
              SOP Rate
            </CardDescription>
            <CardTitle className={`text-2xl ${overview.sopRate >= 80 ? 'text-green-600' : overview.sopRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
              {overview.sopRate.toFixed(1)}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Compliance Rate
            </p>
          </CardContent>
        </Card>

        {/* Total Trades Card - Purple */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-500" />
              Total Trades
            </CardDescription>
            <CardTitle className="text-2xl">{overview.totalTrades}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {selectedYear} Trades
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Monthly Breakdown</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {monthlyBreakdown.map((month) => (
            <Card 
              key={month.monthNumber}
              className={`${!month.hasData ? 'opacity-50' : ''} hover:shadow-md transition-shadow`}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  {month.month} {selectedYear}
                  {month.hasData && (
                    <span className="text-xs font-normal text-muted-foreground">
                      {month.trades} {month.trades === 1 ? 'trade' : 'trades'}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {month.hasData ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">P&L</span>
                      <span className={`text-sm font-semibold ${month.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${Math.abs(month.pnl).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Win Rate</span>
                      <span className={`text-sm font-semibold ${month.winRate >= 60 ? 'text-green-600' : month.winRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {month.winRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">SOP Rate</span>
                      <span className={`text-sm font-semibold ${month.sopRate >= 80 ? 'text-green-600' : month.sopRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {month.sopRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-xs text-muted-foreground">Record</span>
                      <span className="text-xs font-medium">
                        {month.wins}W / {month.losses}L
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-xs text-muted-foreground">No trades</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Legend */}
      {overview.totalTrades > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-muted-foreground">Win Rate ≥60% / SOP ≥80%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span className="text-muted-foreground">Win Rate 50-59% / SOP 60-79%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="text-muted-foreground">Win Rate &lt;50% / SOP &lt;60%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
