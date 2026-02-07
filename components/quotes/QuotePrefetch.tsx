/**
 * Quote Prefetch Component
 * Prefetches quote data in the background for instant loading
 * Place this in layouts to warm up the cache before user navigates
 */

'use client';

import { useEffect } from 'react';

interface QuotePrefetchProps {
  endpoint: '/api/quotes/trades-page' | '/api/quotes/random';
}

export function QuotePrefetch({ endpoint }: QuotePrefetchProps) {
  useEffect(() => {
    // Prefetch quote data in the background (low priority)
    const prefetch = async () => {
      try {
        // Use keepalive for fire-and-forget request
        await fetch(endpoint, {
          method: endpoint === '/api/quotes/random' ? 'POST' : 'GET',
          priority: 'low',
          keepalive: true,
        } as RequestInit);
      } catch {
        // Silent fail - prefetch is optional
      }
    };

    // Delay prefetch by 1 second to not block initial page load
    const timeout = setTimeout(prefetch, 1000);

    return () => clearTimeout(timeout);
  }, [endpoint]);

  return null; // This component doesn't render anything
}
