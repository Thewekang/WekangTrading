/**
 * Session Comparison Chart Component
 * Displays win rate and trade count across market sessions
 */
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface SessionData {
  session: string;
  winRate: number;
  totalTrades: number;
  totalWins: number;
}

interface SessionComparisonChartProps {
  data: SessionData[];
  bestSession?: string | null;
}

const SESSION_COLORS: Record<string, string> = {
  ASIA: '#10b981',      // Green
  EUROPE: '#3b82f6',    // Blue
  US: '#f59e0b',        // Amber
  ASIA_EUROPE_OVERLAP: '#8b5cf6',   // Purple
  EUROPE_US_OVERLAP: '#ec4899',     // Pink
};

const SESSION_LABELS: Record<string, string> = {
  ASIA: 'Asia (00-09 UTC)',
  EUROPE: 'Europe (07-16 UTC)',
  US: 'US (13-22 UTC)',
  ASIA_EUROPE_OVERLAP: 'Asia-Europe Overlap',
  EUROPE_US_OVERLAP: 'Europe-US Overlap',
};

export default function SessionComparisonChart({ data, bestSession }: SessionComparisonChartProps) {
  // Transform data for chart
  const chartData = data.map(item => ({
    name: SESSION_LABELS[item.session] || item.session,
    session: item.session,
    'Win Rate': item.winRate,
    'Total Trades': item.totalTrades,
    wins: item.totalWins,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-gray-900 mb-2">{data.name}</p>
          <div className="space-y-1 text-sm">
            <p className="text-gray-700">
              <span className="font-medium">Win Rate:</span> {data['Win Rate'].toFixed(1)}%
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Trades:</span> {data['Total Trades']} ({data.wins} wins)
            </p>
          </div>
          {data.session === bestSession && (
            <p className="text-xs text-blue-600 font-semibold mt-2">⭐ Best Session</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12 }}
            angle={-15}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            label={{ value: 'Win Rate (%)', angle: -90, position: 'insideLeft' }}
            domain={[0, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={(value) => value === 'Win Rate' ? 'Win Rate (%)' : value}
          />
          <Bar dataKey="Win Rate" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={SESSION_COLORS[entry.session] || '#6b7280'}
                opacity={entry.session === bestSession ? 1 : 0.7}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Trade Count Summary */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
        {chartData.map((item) => (
          <div 
            key={item.session}
            className="text-center p-2 bg-gray-50 rounded border border-gray-200"
          >
            <div className="text-xs text-gray-600">{item.session}</div>
            <div className="text-sm font-semibold text-gray-900">
              {item['Total Trades']} trades
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
