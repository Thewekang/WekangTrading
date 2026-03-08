'use client';

/**
 * Hourly Heatmap Wrapper
 * Fetches hourlyStats client-side when component is rendered
 * Improves initial dashboard load by deferring this API call
 */

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import ChartSkeleton from '@/components/charts/ChartSkeleton';

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

  useEffect(() => {
    const abortController = new AbortController();
    
    const fetchHourlyStats = async () => {
      try {
        const response = await fetch(`/api/stats/by-hour?userId=${userId}&period=all`, {
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
  }, [userId]);

  if (isLoading) {
    return <ChartSkeleton />;
  }

  return <HourlyHeatmap data={hourlyStats} userId={userId} period="all" />;
}
