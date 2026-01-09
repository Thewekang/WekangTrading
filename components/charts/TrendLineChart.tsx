/**
 * Trend Line Chart Component
 * Displays daily performance trends with optional moving averages
 */

'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';

interface TrendLineChartProps {
  data: Array<{
    date: string;
    value: number;
    ma7?: number | null;
    ma30?: number | null;
  }>;
  metricName: string;
  metricLabel: string;
  showMA7?: boolean;
  showMA30?: boolean;
  yAxisFormatter?: (value: number) => string;
  tooltipFormatter?: (value: number) => string;
}

export default function TrendLineChart({
  data,
  metricName,
  metricLabel,
  showMA7 = false,
  showMA30 = false,
  yAxisFormatter = (value) => value.toFixed(1),
  tooltipFormatter = (value) => value.toFixed(2),
}: TrendLineChartProps) {
  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      displayDate: format(parseISO(item.date), 'MMM d'),
    }));
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="displayDate" 
          tick={{ fontSize: 12 }}
          stroke="#6b7280"
        />
        <YAxis 
          tickFormatter={yAxisFormatter}
          tick={{ fontSize: 12 }}
          stroke="#6b7280"
        />
        <Tooltip 
          formatter={(value: number) => [tooltipFormatter(value), metricLabel]}
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '14px'
          }}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Legend 
          wrapperStyle={{ fontSize: '14px' }}
          iconType="line"
        />
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke="#3b82f6" 
          strokeWidth={2}
          name={metricLabel}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
        {showMA7 && (
          <Line 
            type="monotone" 
            dataKey="ma7" 
            stroke="#10b981" 
            strokeWidth={2}
            strokeDasharray="5 5"
            name="7-Day MA"
            dot={false}
          />
        )}
        {showMA30 && (
          <Line 
            type="monotone" 
            dataKey="ma30" 
            stroke="#f59e0b" 
            strokeWidth={2}
            strokeDasharray="5 5"
            name="30-Day MA"
            dot={false}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
