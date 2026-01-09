/**
 * Hourly Performance Heatmap Component
 * Displays win rate for each hour of the day with timezone conversion
 */
'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface HourlyData {
  hour: number;
  winRate: number;
  totalTrades: number;
  totalWins: number;
}

interface HourlyHeatmapProps {
  data: HourlyData[];
  userId: string;
  period?: 'week' | 'month' | 'year' | 'all';
}

// Available timezone options
const TIMEZONES = [
  { value: '0', label: 'UTC (GMT+0)', offset: 0 },
  { value: '8', label: 'Malaysia (GMT+8)', offset: 8 },
];

// Color scale based on win rate
const getColorByWinRate = (winRate: number, hasTrades: boolean): string => {
  if (!hasTrades) return '#e5e7eb'; // Gray for no data
  if (winRate >= 70) return '#10b981'; // Green - Excellent
  if (winRate >= 60) return '#84cc16'; // Light green - Good
  if (winRate >= 50) return '#fbbf24'; // Yellow - Acceptable
  if (winRate >= 40) return '#fb923c'; // Orange - Poor
  return '#ef4444'; // Red - Very poor
};

// Format hour to 12-hour format with AM/PM
const formatHour = (hour: number): string => {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
};

export default function HourlyHeatmap({ data: initialData, userId, period = 'month' }: HourlyHeatmapProps) {
  const [timezone, setTimezone] = useState<string>('0');
  const [data, setData] = useState<HourlyData[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);

  // Load timezone preference from localStorage
  useEffect(() => {
    const savedTimezone = localStorage.getItem('hourlyHeatmapTimezone');
    if (savedTimezone && TIMEZONES.find(tz => tz.value === savedTimezone)) {
      setTimezone(savedTimezone);
      // Fetch data with saved timezone
      if (savedTimezone !== '0') {
        fetchData(savedTimezone);
      }
    }
  }, []);

  // Fetch data with selected timezone
  const fetchData = async (tz: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/stats/by-hour?period=${period}&timezone=${tz}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data.hours);
      }
    } catch (error) {
      console.error('Failed to fetch hourly stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle timezone change
  const handleTimezoneChange = (newTimezone: string) => {
    setTimezone(newTimezone);
    localStorage.setItem('hourlyHeatmapTimezone', newTimezone);
    fetchData(newTimezone);
  };

  const selectedTimezone = TIMEZONES.find(tz => tz.value === timezone);
  
  // Transform data for chart
  const chartData = data.map(item => ({
    hour: item.hour,
    hourLabel: formatHour(item.hour),
    hourShort: `${item.hour}:00`,
    'Win Rate': item.winRate,
    trades: item.totalTrades,
    wins: item.totalWins,
    hasTrades: item.totalTrades > 0,
  }));

  // Find best hour (with at least 2 trades)
  const bestHour = data
    .filter(h => h.totalTrades >= 2)
    .sort((a, b) => b.winRate - a.winRate)[0];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-gray-900 mb-2">
            {data.hourLabel} ({data.hourShort} {selectedTimezone?.label})
          </p>
          {data.hasTrades ? (
            <div className="space-y-1 text-sm">
              <p className="text-gray-700">
                <span className="font-medium">Win Rate:</span> {data['Win Rate'].toFixed(1)}%
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Trades:</span> {data.trades} ({data.wins} wins)
              </p>
              {bestHour && data.hour === bestHour.hour && (
                <p className="text-xs text-green-600 font-semibold mt-2">⭐ Best Hour</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-500">No trades during this hour</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      {/* Timezone Selector */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <label htmlFor="timezone-select" className="text-sm font-medium text-gray-700">
            Timezone:
          </label>
          <select
            id="timezone-select"
            value={timezone}
            onChange={(e) => handleTimezoneChange(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>
        {isLoading && (
          <span className="text-xs text-gray-500 italic">Loading...</span>
        )}
      </div>

      {/* Best Hour Insight */}
      {bestHour && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-green-800">
            <span className="font-semibold">🌟 Best Trading Hour:</span> {formatHour(bestHour.hour)} ({selectedTimezone?.label})
            with {bestHour.winRate.toFixed(1)}% win rate ({bestHour.totalWins}/{bestHour.totalTrades} trades)
          </p>
        </div>
      )}

      {/* Heatmap Chart */}
      <ResponsiveContainer width="100%" height={350}>
        <BarChart 
          data={chartData} 
          margin={{ top: 20, right: 10, left: 10, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="hourShort" 
            tick={{ fontSize: 11 }}
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
          />
          <YAxis 
            label={{ value: 'Win Rate (%)', angle: -90, position: 'insideLeft' }}
            domain={[0, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="Win Rate" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getColorByWinRate(entry['Win Rate'], entry.hasTrades)}
                opacity={entry.hour === bestHour?.hour ? 1 : 0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Color Legend */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs">
        <span className="font-medium text-gray-700">Performance Scale:</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }}></div>
          <span className="text-gray-600">≥70%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#84cc16' }}></div>
          <span className="text-gray-600">60-69%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#fbbf24' }}></div>
          <span className="text-gray-600">50-59%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#fb923c' }}></div>
          <span className="text-gray-600">40-49%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }}></div>
          <span className="text-gray-600">&lt;40%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-gray-200"></div>
          <span className="text-gray-600">No data</span>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-xs text-gray-600 mb-1">Total Hours Traded</div>
          <div className="font-semibold text-gray-900">
            {data.filter(h => h.totalTrades > 0).length} / 24
          </div>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-xs text-gray-600 mb-1">Most Active Hour</div>
          <div className="font-semibold text-gray-900">
            {(() => {
              const mostActive = [...data].sort((a, b) => b.totalTrades - a.totalTrades)[0];
              return mostActive.totalTrades > 0 ? formatHour(mostActive.hour) : 'N/A';
            })()}
          </div>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-xs text-gray-600 mb-1">Peak Performance</div>
          <div className="font-semibold text-green-600">
            {bestHour ? `${bestHour.winRate.toFixed(1)}%` : 'N/A'}
          </div>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-xs text-gray-600 mb-1">Avg Win Rate</div>
          <div className="font-semibold text-gray-900">
            {(() => {
              const hoursWithTrades = data.filter(h => h.totalTrades > 0);
              const avgWinRate = hoursWithTrades.length > 0
                ? hoursWithTrades.reduce((sum, h) => sum + h.winRate, 0) / hoursWithTrades.length
                : 0;
              return `${avgWinRate.toFixed(1)}%`;
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
