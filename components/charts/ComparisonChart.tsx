/**
 * Comparison Chart Component
 * Bar chart for week-over-week or month-over-month comparisons
 */

'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ComparisonChartProps {
  current: {
    period: string;
    winRate: number;
    sopRate: number;
    profitLoss: number;
    totalTrades: number;
  };
  previous: {
    period: string;
    winRate: number;
    sopRate: number;
    profitLoss: number;
    totalTrades: number;
  };
  metric: 'winRate' | 'sopRate' | 'profitLoss' | 'totalTrades';
  metricLabel: string;
  yAxisFormatter?: (value: number) => string;
  tooltipFormatter?: (value: number) => string;
}

export default function ComparisonChart({
  current,
  previous,
  metric,
  metricLabel,
  yAxisFormatter = (value) => value.toFixed(1),
  tooltipFormatter = (value) => value.toFixed(2),
}: ComparisonChartProps) {
  const data = [
    { name: previous.period, value: previous[metric] },
    { name: current.period, value: current[metric] },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 12 }}
          stroke="#6b7280"
        />
        <YAxis 
          tickFormatter={yAxisFormatter}
          tick={{ fontSize: 12 }}
          stroke="#6b7280"
        />
        <Tooltip 
          formatter={(value: number | undefined) => [tooltipFormatter(value || 0), metricLabel]}
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        />
        <Legend 
          wrapperStyle={{ fontSize: '14px' }}
          iconType="rect"
        />
        <Bar 
          dataKey="value" 
          fill="#3b82f6" 
          name={metricLabel}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
