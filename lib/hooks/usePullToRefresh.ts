'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number; // px to pull before triggering (default: 80)
  maxPull?: number;   // max px the indicator stretches (default: 120)
}

interface PullToRefreshState {
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
  pullProgress: number; // 0-1
}

/**
 * Pull-to-refresh hook for mobile lists.
 * 
 * Usage:
 * const { containerRef, isPulling, isRefreshing, pullDistance } = usePullToRefresh({
 *   onRefresh: async () => { await fetchData(); }
 * });
 * 
 * return (
 *   <div ref={containerRef}>
 *     {isPulling && <PullIndicator distance={pullDistance} />}
 *     <YourList />
 *   </div>
 * );
 */
export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPull = 120,
}: PullToRefreshOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    isRefreshing: false,
    pullDistance: 0,
    pullProgress: 0,
  });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only activate when scrolled to top
    const container = containerRef.current;
    if (!container || window.scrollY > 0 || state.isRefreshing) return;
    
    startY.current = e.touches[0].clientY;
  }, [state.isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!startY.current || state.isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    // Only pull down, not up
    if (diff <= 0) {
      setState(prev => ({ ...prev, isPulling: false, pullDistance: 0, pullProgress: 0 }));
      return;
    }

    // Apply resistance (diminishing returns as you pull further)
    const distance = Math.min(diff * 0.5, maxPull);
    const progress = Math.min(distance / threshold, 1);

    setState(prev => ({
      ...prev,
      isPulling: true,
      pullDistance: distance,
      pullProgress: progress,
    }));
  }, [state.isRefreshing, threshold, maxPull]);

  const handleTouchEnd = useCallback(async () => {
    if (!state.isPulling) {
      startY.current = 0;
      return;
    }

    if (state.pullDistance >= threshold) {
      // Trigger refresh
      setState(prev => ({
        ...prev,
        isRefreshing: true,
        isPulling: false,
        pullDistance: 40, // Keep a small indicator visible
        pullProgress: 1,
      }));

      try {
        await onRefresh();
      } finally {
        setState({
          isPulling: false,
          isRefreshing: false,
          pullDistance: 0,
          pullProgress: 0,
        });
      }
    } else {
      // Cancel - didn't pull far enough
      setState({
        isPulling: false,
        isRefreshing: false,
        pullDistance: 0,
        pullProgress: 0,
      });
    }

    startY.current = 0;
  }, [state.isPulling, state.pullDistance, threshold, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    containerRef,
    ...state,
  };
}
