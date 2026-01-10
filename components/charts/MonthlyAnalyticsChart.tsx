/**
 * Monthly Analytics Chart Component
 * Displays bar chart of monthly performance metrics
 */

'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface MonthlyData {
  month: number;
  monthName: string;
  totalTrades: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  sopRate: number;
  profitLoss: number;
}

interface MonthlyAnalyticsChartProps {
  data: MonthlyData[];
  metric: 'winRate' | 'sopRate' | 'profitLoss' | 'totalTrades';
  year: number;
}

export default function MonthlyAnalyticsChart({ data, metric, year }: MonthlyAnalyticsChartProps) {
  const getMetricConfig = () => {
    switch (metric) {
      case 'winRate':
        return {
          label: 'Win Rate (%)',
          dataKey: 'winRate',
          color: '#10b981',
          formatter: (value: number) => `${value.toFixed(1)}%`,
          yAxisDomain: [0, 100],
        };
      case 'sopRate':
        return {
          label: 'SOP Rate (%)',
          dataKey: 'sopRate',
          color: '#3b82f6',
          formatter: (value: number) => `${value.toFixed(1)}%`,
          yAxisDomain: [0, 100],
        };
      case 'profitLoss':
        return {
          label: 'Profit/Loss ($)',
          dataKey: 'profitLoss',
          color: '#8b5cf6',
          formatter: (value: number) => `$${value.toFixed(2)}`,
          yAxisDomain: undefined,
        };
      case 'totalTrades':
        return {
          label: 'Total Trades',
          dataKey: 'totalTrades',
          color: '#f59e0b',
          formatter: (value: number) => value.toString(),
          yAxisDomain: undefined,
        };
    }
  };

  const config = getMetricConfig();

  // Get bar color based on value (for profit/loss)
  const getBarColor = (entry: MonthlyData, index: number) => {
    if (metric === 'profitLoss') {
      return entry.profitLoss >= 0 ? '#10b981' : '#ef4444';
    }
    return config.color;
  };

  // Format month names for mobile (3-letter abbreviation)
  const formatMonthName = (monthName: string) => {
    return monthName.substring(0, 3);
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{data.monthName} {year}</p>
          <div className="space-y-1 text-sm">
            <p className="text-gray-700">
              <span className="font-medium">{config.label}:</span>{' '}
              <span className="font-semibold">{config.formatter(data[config.dataKey])}</span>
            </p>
            <p className="text-gray-600">
              Total Trades: <span className="font-medium">{data.totalTrades}</span>
            </p>
            {metric !== 'totalTrades' && (
              <>
                <p className="text-green-600">
                  Wins: <span className="font-medium">{data.totalWins}</span>
                </p>
                <p className="text-red-600">
                  Losses: <span className="font-medium">{data.totalLosses}</span>
                </p>
              </>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="monthName"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
            tickFormatter={formatMonthName}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            domain={config.yAxisDomain}
            tickFormatter={(value) => {
              if (metric === 'profitLoss') {
                return `$${value}`;
              } else if (metric === 'winRate' || metric === 'sopRate') {
                return `${value}%`;
              }
              return value;
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={() => config.label}
          />
          <Bar
            dataKey={config.dataKey}
            radius={[8, 8, 0, 0]}
            maxBarSize={60}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry, index)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Summary Statistics */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-600 mb-1">Total Trades</p>
          <p className="text-lg font-bold text-gray-900">
            {data.reduce((sum, m) => sum + m.totalTrades, 0)}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-600 mb-1">Avg Win Rate</p>
          <p className="text-lg font-bold text-green-600">
            {(data.reduce((sum, m) => sum + m.winRate, 0) / 12).toFixed(1)}%
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-600 mb-1">Avg SOP Rate</p>
          <p className="text-lg font-bold text-blue-600">
            {(data.reduce((sum, m) => sum + m.sopRate, 0) / 12).toFixed(1)}%
          </p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-600 mb-1">Total P/L</p>
          <p className={`text-lg font-bold ${
            data.reduce((sum, m) => sum + m.profitLoss, 0) >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            ${data.reduce((sum, m) => sum + m.profitLoss, 0).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
