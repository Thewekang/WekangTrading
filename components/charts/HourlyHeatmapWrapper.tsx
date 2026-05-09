'use client';

/**
 * Hourly Heatmap Wrapper
 * Fetches hourlyStats client-side when component is rendered
 * Improves initial dashboard load by deferring this API call
 */

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import ChartSkeleton from '@/components/charts/ChartSkeleton';
import { useActiveAccount } from '@/contexts/ActiveAccountContext';

const HourlyHeatmap = dynamic(() => import('@/components/charts/HourlyHeatmap'), {
  loading: () => <ChartSkeleton />,
  ssr: false
});

interface HourlyHeatmapWrapperProps {
  userId: string;
}

export function HourlyHeatmapWrapper({ userId }: HourlyHeatmapWrapperProps) {
  const [hourlyStats, setHourlyStats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { activeAccount } = useActiveAccount();

  useEffect(() => {
    const abortController = new AbortController();
    
    const fetchHourlyStats = async () => {
      try {
        const params = new URLSearchParams({ userId, period: 'all' });
        if (activeAccount?.id) params.set('accountId', activeAccount.id);
        const response = await fetch(`/api/stats/by-hour?${params.toString()}`, {
          signal: abortController.signal
        });
        const data = await response.json();
        if (data.success && !abortController.signal.aborted) {
          setHourlyStats(data.data.hours || []);
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Failed to fetch hourly stats:', error);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchHourlyStats();
    
    return () => {
      abortController.abort();
    };
  }, [userId, activeAccount?.id]);

  if (isLoading) {
    return <ChartSkeleton />;
  }

  return <HourlyHeatmap data={hourlyStats} userId={userId} period="all" />;
}
