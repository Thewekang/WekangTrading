'use client';

/**
 * Session Comparison Chart Wrapper
 * Fetches sessionStats client-side when component is rendered
 * Improves initial dashboard load by deferring this API call
 */

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import ChartSkeleton from '@/components/charts/ChartSkeleton';

const SessionComparisonChart = dynamic(() => import('@/components/charts/SessionComparisonChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false
});

interface SessionComparisonChartWrapperProps {
  userId: string;
  bestSession: string | null;
}

export function SessionComparisonChartWrapper({ userId, bestSession }: SessionComparisonChartWrapperProps) {
  const [sessionStats, setSessionStats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSessionStats = async () => {
      try {
        const response = await fetch(`/api/stats/by-session?userId=${userId}&period=month`);
        const data = await response.json();
        if (data.success) {
          setSessionStats(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch session stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessionStats();
  }, [userId]);

  if (isLoading) {
    return <ChartSkeleton />;
  }

  return <SessionComparisonChart data={sessionStats} bestSession={bestSession} />;
}
