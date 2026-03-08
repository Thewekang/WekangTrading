'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Eye, Calendar as CalendarIcon, TrendingUp, TrendingDown } from 'lucide-react';
import type { DisciplineTrackerSettings, DisciplineTrackerRow } from '@/lib/db/schema';
import type { AggregatedStats } from '@/lib/types/disciplineTracker';
import { aggregateRows, evaluateDayRow } from '@/lib/services/disciplineTrackerRulesEngine';
import { toast } from 'sonner';
import Link from 'next/link';
import { OUTCOME_COLORS } from '@/lib/types/disciplineTracker';

interface EvaluatedRow {
  row: DisciplineTrackerRow;
  dayPnl: number;
  wins: number;
  losses: number;
  bes: number;
  totalTrades: number;
  violations: number;
}

export default function AdminUserDisciplineTrackerPage() {
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [settings, setSettings] = useState<DisciplineTrackerSettings | null>(null);
  const [allRows, setAllRows] = useState<DisciplineTrackerRow[]>([]);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | '3months' | '6months' | 'year' | 'all'>('month');
  const [stats, setStats] = useState<AggregatedStats>({
    totalPnl: 0,
    totalWins: 0,
    totalLosses: 0,
    totalBE: 0,
    totalTrades: 0,
    winRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Filter rows based on time range
  const filteredRows = useMemo(() => {
    if (timeRange === 'all') return allRows;

    const now = new Date();
    const cutoffDate = new Date();

    switch (timeRange) {
      case 'week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case '3months':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case '6months':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case 'year':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return allRows.filter((row) => new Date(row.tradeDate) >= cutoffDate);
  }, [allRows, timeRange]);

  // Evaluate rows for simplified view
  const evaluatedRows = useMemo<EvaluatedRow[]>(() => {
    if (!settings) return [];

    return filteredRows.map((row) => {
      const evaluation = evaluateDayRow(row, settings);
      
      let violations = 0;
      if (row.trade2Outcome && row.trade2Outcome !== 'EMPTY' && !evaluation.allowedTrade2) {
        violations++;
      }
      if (row.trade3Outcome && row.trade3Outcome !== 'EMPTY' && !evaluation.allowedTrade3) {
        violations++;
      }

      return {
        row,
        dayPnl: evaluation.dayPnl,
        wins: evaluation.wins,
        losses: evaluation.losses,
        bes: evaluation.bes,
        totalTrades: evaluation.totalTrades,
        violations,
      };
    });
  }, [filteredRows, settings]);

  useEffect(() => {
    fetchData();
  }, [userId]);

  useEffect(() => {
    if (settings) {
      const newStats = aggregateRows(filteredRows, settings);
      setStats(newStats);
    }
  }, [filteredRows, settings]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch user info
      const userRes = await fetch(`/api/admin/users/${userId}`);
      const userData = await userRes.json();
      if (userData.success) {
        setUser({ name: userData.data.name, email: userData.data.email });
      }

      // Fetch user's discipline tracker settings
      const settingsRes = await fetch(`/api/admin/users/${userId}/discipline-tracker/settings`);
      const settingsData = await settingsRes.json();
      
      if (settingsData.success) {
        setSettings(settingsData.data);
      }

      // Fetch user's discipline tracker rows
      const rowsRes = await fetch(`/api/admin/users/${userId}/discipline-tracker/rows`);
      const rowsData = await rowsRes.json();
      
      if (rowsData.success) {
        setAllRows(rowsData.data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load discipline tracker');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  if (!user || !settings) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">User not found or no discipline tracker data</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/discipline-tracker"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Team Overview
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Eye className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name}'s Discipline Performance</h1>
            <p className="text-sm text-gray-500">{user.email} • Simplified Admin View</p>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-gray-600" />
          <label htmlFor="time-range" className="text-sm font-medium text-gray-700">
            Period:
          </label>
          <select
            id="time-range"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="year">Last Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">{evaluatedRows.length} trading days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.winRate >= 50 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.winRate.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.totalWins}W / {stats.totalLosses}L / {stats.totalBE}BE
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalTrades}</div>
            <p className="text-xs text-gray-500 mt-1">
              Avg {stats.totalTrades > 0 ? (stats.totalTrades / evaluatedRows.length).toFixed(1) : 0} per day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Rule Violations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${evaluatedRows.reduce((sum, r) => sum + r.violations, 0) === 0 ? 'text-green-600' : 'text-red-600'}`}>
              {evaluatedRows.reduce((sum, r) => sum + r.violations, 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Unauthorized trades</p>
          </CardContent>
        </Card>
      </div>

      {/* Records Info */}
      {allRows.length > 0 && (
        <div className="text-sm text-gray-600">
          Showing <span className="font-medium text-gray-900">{filteredRows.length}</span> of{' '}
          <span className="font-medium text-gray-900">{allRows.length}</span> total days
        </div>
      )}

      {/* Plan Settings Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Plan Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Max Trades/Day:</span>
              <span className="ml-2 font-medium">{settings.maxTradesPerDay}</span>
            </div>
            <div>
              <span className="text-gray-600">SL Value:</span>
              <span className="ml-2 font-medium text-red-600">${settings.slValue}</span>
            </div>
            <div>
              <span className="text-gray-600">TP1 Value:</span>
              <span className="ml-2 font-medium text-green-600">${settings.tp1Value}</span>
            </div>
            <div>
              <span className="text-gray-600">TP2 Value:</span>
              <span className="ml-2 font-medium text-green-600">${settings.tp2Value}</span>
            </div>
            <div>
              <span className="text-gray-600">TP3 Mode:</span>
              <span className="ml-2 font-medium capitalize">{settings.tp3Mode}</span>
            </div>
            {settings.tp3Mode === 'fixed' && (
              <div>
                <span className="text-gray-600">TP3 Fixed:</span>
                <span className="ml-2 font-medium text-green-600">${settings.tp3FixedValue}</span>
              </div>
            )}
            <div>
              <span className="text-gray-600">Win Rate Formula:</span>
              <span className="ml-2 font-medium">
                {settings.winRateFormula === 'excludeBE' ? 'Exclude BE' : 'Include BE'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Simplified Daily Summary Table */}
      {evaluatedRows.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              {allRows.length === 0 
                ? "No entries yet. User hasn't started tracking discipline."
                : "No entries found for selected time range. Try selecting a different period."}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Daily Performance Summary</CardTitle>
            <p className="text-sm text-gray-500">
              Simplified admin view showing key discipline metrics per trading day.
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-3 text-sm font-medium text-gray-700">Date</th>
                    <th className="text-center p-3 text-sm font-medium text-gray-700">Day P&L</th>
                    <th className="text-center p-3 text-sm font-medium text-gray-700">Trades</th>
                    <th className="text-center p-3 text-sm font-medium text-gray-700">W/L/BE</th>
                    <th className="text-center p-3 text-sm font-medium text-gray-700">A+ Day</th>
                    <th className="text-center p-3 text-sm font-medium text-gray-700">Range Exp</th>
                    <th className="text-center p-3 text-sm font-medium text-gray-700">Session</th>
                    <th className="text-center p-3 text-sm font-medium text-gray-700">Violations</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-700">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluatedRows.map((evalRow) => {
                    const date = new Date(evalRow.row.tradeDate);
                    const dateStr = date.toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    });
                    
                    return (
                      <tr key={evalRow.row.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3 text-sm font-medium text-gray-900">{dateStr}</td>
                        <td className={`p-3 text-sm text-center font-bold ${evalRow.dayPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {evalRow.dayPnl >= 0 ? '+' : ''}${evalRow.dayPnl.toFixed(0)}
                        </td>
                        <td className="p-3 text-sm text-center text-gray-900">{evalRow.totalTrades}</td>
                        <td className="p-3 text-sm text-center text-gray-600">
                          <span className="text-green-600">{evalRow.wins}</span> / 
                          <span className="text-red-600">{evalRow.losses}</span> / 
                          <span className="text-yellow-600">{evalRow.bes}</span>
                        </td>
                        <td className="p-3 text-center">
                          {evalRow.row.isAPlusDay ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Yes
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {evalRow.row.isRangeExpansionDay ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              Yes
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            evalRow.row.sessionWindow === 'prime' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {evalRow.row.sessionWindow === 'prime' ? 'Prime' : 'Non-Prime'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {evalRow.violations > 0 ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {evalRow.violations}
                            </span>
                          ) : (
                            <span className="text-green-600 text-sm">✓</span>
                          )}
                        </td>
                        <td className="p-3 text-sm text-gray-600 max-w-xs truncate">
                          {evalRow.row.notes || <span className="text-gray-400">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
