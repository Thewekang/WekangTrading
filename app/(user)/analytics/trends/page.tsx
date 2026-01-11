/**
 * Performance Trends Page
 * Displays daily trends, moving averages, and comparison charts
 */

'use client';

import { useState, useEffect } from 'react';
import TrendLineChart from '@/components/charts/TrendLineChart';
import ComparisonChart from '@/components/charts/ComparisonChart';
import TrendIndicatorCard from '@/components/charts/TrendIndicatorCard';
import MonthlyAnalyticsChart from '@/components/charts/MonthlyAnalyticsChart';
import { calculateMovingAverages } from '@/lib/services/trendAnalysisService';
import type { DailyTrend, ComparisonData, TrendIndicator } from '@/lib/services/trendAnalysisService';

export default function TrendsPage() {
  const [trends, setTrends] = useState<DailyTrend[]>([]);
  const [weeklyComparison, setWeeklyComparison] = useState<ComparisonData | null>(null);
  const [monthlyComparison, setMonthlyComparison] = useState<ComparisonData | null>(null);
  const [indicators, setIndicators] = useState<TrendIndicator[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNoData, setHasNoData] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<'winRate' | 'sopRate' | 'profitLoss'>('winRate');
  const [monthlyMetric, setMonthlyMetric] = useState<'winRate' | 'sopRate' | 'profitLoss' | 'totalTrades'>('winRate');
  const [selectedDays, setSelectedDays] = useState(30);

  useEffect(() => {
    fetchData();
  }, [selectedDays, selectedYear]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [trendsRes, weeklyRes, monthlyRes, indicatorsRes, monthlyStatsRes] = await Promise.all([
        fetch(`/api/stats/trends?days=${selectedDays}`),
        fetch('/api/stats/comparisons?type=weekly'),
        fetch('/api/stats/comparisons?type=monthly'),
        fetch('/api/stats/indicators'),
        fetch(`/api/stats/monthly?year=${selectedYear}`),
      ]);

      const [trendsData, weeklyData, monthlyData, indicatorsData, monthlyStatsData] = await Promise.all([
        trendsRes.json(),
        weeklyRes.json(),
        monthlyRes.json(),
        indicatorsRes.json(),
        monthlyStatsRes.json(),
      ]);

      if (trendsData.success) setTrends(trendsData.data || []);
      if (weeklyData.success) setWeeklyComparison(weeklyData.data);
      if (monthlyData.success) setMonthlyComparison(monthlyData.data);
      if (indicatorsData.success) setIndicators(indicatorsData.data || []);
      if (monthlyStatsData.success) setMonthlyData(monthlyStatsData.data?.months || []);

      // Check if user has any data at all
      const hasAnyData = (trendsData.data && trendsData.data.length > 0) ||
                        (monthlyStatsData.data && monthlyStatsData.data.months && monthlyStatsData.data.months.length > 0);
      setHasNoData(!hasAnyData);
    } catch (error) {
      console.error('Error fetching trends data:', error);
      setError('Failed to load analytics data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getChartData = () => {
    if (trends.length === 0) return [];
    return calculateMovingAverages(trends, selectedMetric);
  };

  const getMetricLabel = () => {
    switch (selectedMetric) {
      case 'winRate': return 'Win Rate (%)';
      case 'sopRate': return 'SOP Rate (%)';
      case 'profitLoss': return 'Profit/Loss ($)';
    }
  };

  const getMetricFormatter = () => {
    if (selectedMetric === 'profitLoss') {
      return {
        yAxisFormatter: (value: number) => `$${value.toFixed(0)}`,
        tooltipFormatter: (value: number) => `$${value.toFixed(2)}`,
      };
    }
    return {
      yAxisFormatter: (value: number) => `${value.toFixed(1)}%`,
      tooltipFormatter: (value: number) => `${value.toFixed(1)}%`,
    };
  };

  if (loading) {
   

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (hasNoData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Performance Trends</h1>
          <p className="text-gray-600">Analyze your trading performance over time with trends and comparisons</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="mb-6">
              <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Trading Data Yet</h3>
            <p className="text-gray-600 mb-6">
              Start tracking your trades to see performance trends and analytics. 
              Your charts and insights will appear here once you have recorded some trades.
            </p>
            <a
              href="/trades/new"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Record Your First Trade
            </a>
          </div>
        </div>
      </div>
    );
  } return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Performance Trends</h1>
        <p className="text-gray-600">Analyze your trading performance over time with trends and comparisons</p>
      </div>

      {/* Monthly Analytics Chart */}
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Monthly Performance {selectedYear}</h2>
              <p className="text-sm text-gray-600 mt-1">Year-to-date overview by month</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {/* Year Selector */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {[...Array(5)].map((_, i) => {
                  const year = new Date().getFullYear() - i;
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>
              {/* Monthly Metric Selector */}
              <select
                value={monthlyMetric}
                onChange={(e) => setMonthlyMetric(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="winRate">Win Rate</option>
                <option value="sopRate">SOP Compliance</option>
                <option value="profitLoss">Profit/Loss</option>
                <option value="totalTrades">Total Trades</option>
              </select>
            </div>
          </div>

          {monthlyData.length > 0 ? (
            <MonthlyAnalyticsChart
              data={monthlyData}
              metric={monthlyMetric}
              year={selectedYear}
            />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No monthly data available for {selectedYear}
            </div>
          )}
        </div>
      </div>

      {/* Trend Indicators */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Trend Indicators (30-Day)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {indicators.map((indicator) => (
            <TrendIndicatorCard
              key={indicator.metric}
              metric={indicator.metric}
              metricLabel={
                indicator.metric === 'winRate' ? 'Win Rate' :
                indicator.metric === 'sopRate' ? 'SOP Compliance' :
                'Profit/Loss'
              }
              direction={indicator.direction}
              changePercent={indicator.changePercent}
              trend7Day={indicator.trend7Day}
              trend30Day={indicator.trend30Day}
              formatter={(value) => 
                indicator.metric === 'profitLoss' 
                  ? `$${value.toFixed(0)}` 
                  : value.toFixed(1)
              }
            />
          ))}
        </div>
      </div>

      {/* Daily Trends Chart */}
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-xl font-semibold text-gray-900">Daily Performance Trends</h2>
            <div className="flex flex-wrap gap-3">
              {/* Metric Selector */}
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="winRate">Win Rate</option>
                <option value="sopRate">SOP Compliance</option>
                <option value="profitLoss">Profit/Loss</option>
              </select>

              {/* Days Selector */}
              <select
                value={selectedDays}
                onChange={(e) => setSelectedDays(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={7}>Last 7 Days</option>
                <option value={14}>Last 14 Days</option>
                <option value={30}>Last 30 Days</option>
                <option value={60}>Last 60 Days</option>
                <option value={90}>Last 90 Days</option>
              </select>
            </div>
          </div>

          {trends.length > 0 ? (
            <TrendLineChart
              data={getChartData()}
              metricName={selectedMetric}
              metricLabel={getMetricLabel()}
              showMA7={selectedDays >= 7}
              showMA30={selectedDays >= 30}
              {...getMetricFormatter()}
            />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No data available for the selected period
            </div>
          )}
        </div>
      </div>

      {/* Comparison Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Weekly Comparison */}
        {weeklyComparison && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Week-Over-Week Comparison</h2>
            <ComparisonChart
              current={weeklyComparison.current}
              previous={weeklyComparison.previous}
              metric={selectedMetric}
              metricLabel={getMetricLabel()}
              {...getMetricFormatter()}
            />
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">Previous Week</p>
                  <p className="font-semibold text-gray-900">
                    {selectedMetric === 'profitLoss' 
                      ? `$${weeklyComparison.previous[selectedMetric].toFixed(2)}`
                      : `${weeklyComparison.previous[selectedMetric].toFixed(1)}%`
                    }
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Current Week</p>
                  <p className="font-semibold text-gray-900">
                    {selectedMetric === 'profitLoss' 
                      ? `$${weeklyComparison.current[selectedMetric].toFixed(2)}`
                      : `${weeklyComparison.current[selectedMetric].toFixed(1)}%`
                    }
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-600 mb-1">Change</p>
                  <p className={`font-semibold ${
                    weeklyComparison.changes[selectedMetric] > 0 ? 'text-green-600' : 
                    weeklyComparison.changes[selectedMetric] < 0 ? 'text-red-600' : 
                    'text-gray-600'
                  }`}>
                    {weeklyComparison.changes[selectedMetric] > 0 ? '+' : ''}
                    {selectedMetric === 'profitLoss' 
                      ? `$${weeklyComparison.changes[selectedMetric].toFixed(2)}`
                      : `${weeklyComparison.changes[selectedMetric].toFixed(1)}%`
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Monthly Comparison */}
        {monthlyComparison && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Month-Over-Month Comparison</h2>
            <ComparisonChart
              current={monthlyComparison.current}
              previous={monthlyComparison.previous}
              metric={selectedMetric}
              metricLabel={getMetricLabel()}
              {...getMetricFormatter()}
            />
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">Previous Month</p>
                  <p className="font-semibold text-gray-900">
                    {selectedMetric === 'profitLoss' 
                      ? `$${monthlyComparison.previous[selectedMetric].toFixed(2)}`
                      : `${monthlyComparison.previous[selectedMetric].toFixed(1)}%`
                    }
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Current Month</p>
                  <p className="font-semibold text-gray-900">
                    {selectedMetric === 'profitLoss' 
                      ? `$${monthlyComparison.current[selectedMetric].toFixed(2)}`
                      : `${monthlyComparison.current[selectedMetric].toFixed(1)}%`
                    }
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-600 mb-1">Change</p>
                  <p className={`font-semibold ${
                    monthlyComparison.changes[selectedMetric] > 0 ? 'text-green-600' : 
                    monthlyComparison.changes[selectedMetric] < 0 ? 'text-red-600' : 
                    'text-gray-600'
                  }`}>
                    {monthlyComparison.changes[selectedMetric] > 0 ? '+' : ''}
                    {selectedMetric === 'profitLoss' 
                      ? `$${monthlyComparison.changes[selectedMetric].toFixed(2)}`
                      : `${monthlyComparison.changes[selectedMetric].toFixed(1)}%`
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
