import { SESSION_HOURS, OVERLAP_HOURS } from '../constants';

export type MarketSession = 'ASIA' | 'EUROPE' | 'US' | 'OVERLAP';

/**
 * Calculate market session from UTC timestamp
 * CRITICAL: Server-side only calculation
 * 
 * @param timestamp - Date object (assumed UTC)
 * @returns MarketSession enum value
 */
export function calculateMarketSession(timestamp: Date): MarketSession {
  const hour = timestamp.getUTCHours();

  // Check for overlap periods first
  if (
    (hour >= OVERLAP_HOURS.ASIA_EUROPE.start && hour < OVERLAP_HOURS.ASIA_EUROPE.end) ||
    (hour >= OVERLAP_HOURS.EUROPE_US.start && hour < OVERLAP_HOURS.EUROPE_US.end)
  ) {
    return 'OVERLAP';
  }

  // Check individual sessions
  if (hour >= SESSION_HOURS.ASIA.start && hour < SESSION_HOURS.ASIA.end) {
    return 'ASIA';
  }

  if (hour >= SESSION_HOURS.EUROPE.start && hour < SESSION_HOURS.EUROPE.end) {
    return 'EUROPE';
  }

  if (hour >= SESSION_HOURS.US.start && hour < SESSION_HOURS.US.end) {
    return 'US';
  }

  // Default to ASIA for remaining hours (22:00-00:00 UTC)
  return 'ASIA';
}

/**
 * Get session name for display
 */
export function getSessionName(session: MarketSession): string {
  const names = {
    ASIA: 'Asia Session',
    EUROPE: 'Europe Session',
    US: 'US Session',
    OVERLAP: 'Overlap Session',
  };
  return names[session];
}

/**
 * Get session color for UI
 */
export function getSessionColor(session: MarketSession): string {
  const colors = {
    ASIA: '#3b82f6',    // blue
    EUROPE: '#10b981',  // green
    US: '#f59e0b',      // amber
    OVERLAP: '#8b5cf6', // purple
  };
  return colors[session];
}
