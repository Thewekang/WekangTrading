'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { UserComparison } from '@/lib/services/adminStatsService';
import { LoadingSpinner } from '@/components/ui/loading';

interface UserComparisonChartProps {
  metric: 'winRate' | 'sopRate' | 'profitLoss';
  title: string;
  description?: string;
}

export function UserComparisonChart({ metric, title, description }: UserComparisonChartProps) {
  const [data, setData] = useState<UserComparison[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/comparison');
      if (!res.ok) throw new Error('Failed to fetch comparison data');
      const json = await res.json();
      setData(json.data);
    } catch (error) {
      console.error('Error fetching comparison data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <p className="text-sm text-gray-600">{description}</p>}
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <LoadingSpinner size="lg" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <p className="text-sm text-gray-600">{description}</p>}
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            No data available for comparison
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const chartData = data
    .filter(u => u.totalTrades > 0)
    .slice(0, 10) // Show top 10 users
    .map(user => ({
      name: user.userName.split(' ')[0], // First name only for brevity
      value: metric === 'profitLoss' ? user.profitLoss : user[metric],
    }));

  // Determine bar color based on metric
  let barColor = '#8884d8';
  if (metric === 'winRate') barColor = '#10b981'; // green
  if (metric === 'sopRate') barColor = '#3b82f6'; // blue
  if (metric === 'profitLoss') barColor = '#f59e0b'; // orange

  // Format value for display
  const formatValue = (value: number) => {
    if (metric === 'profitLoss') {
      return `$${value >= 0 ? '+' : ''}${value.toFixed(2)}`;
    }
    return `${value.toFixed(1)}%`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <p className="text-sm text-gray-600">{description}</p>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value: number | undefined) => value !== undefined ? formatValue(value) : ''}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            />
            <Legend />
            <Bar
              dataKey="value"
              fill={barColor}
              name={
                metric === 'winRate' ? 'Win Rate' :
                metric === 'sopRate' ? 'SOP Rate' :
                'Profit/Loss'
              }
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
