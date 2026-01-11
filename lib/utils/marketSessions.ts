import { SESSION_HOURS, OVERLAP_HOURS } from '../constants';

export type MarketSession = 'ASIA' | 'EUROPE' | 'US' | 'ASIA_EUROPE_OVERLAP' | 'EUROPE_US_OVERLAP';

/**
 * Calculate market session from UTC timestamp
 * CRITICAL: Server-side only calculation
 * 
 * Malaysia Timezone (GMT+8) Reference:
 * - ASIA: 08:00 - 17:00 MYT (00:00 - 09:00 UTC)
 * - EUROPE: 15:00 - 00:00 MYT (07:00 - 16:00 UTC)
 * - US: 21:00 - 06:00 MYT (13:00 - 22:00 UTC)
 * - ASIA-EUROPE OVERLAP: 15:00 - 17:00 MYT (07:00 - 09:00 UTC)
 * - EUROPE-US OVERLAP: 21:00 - 00:00 MYT (13:00 - 16:00 UTC)
 * 
 * @param timestamp - Date object (assumed UTC)
 * @returns MarketSession enum value
 */
export function calculateMarketSession(timestamp: Date): MarketSession {
  const hour = timestamp.getUTCHours();

  // Check for overlap periods first (more specific)
  if (hour >= OVERLAP_HOURS.ASIA_EUROPE.start && hour < OVERLAP_HOURS.ASIA_EUROPE.end) {
    return 'ASIA_EUROPE_OVERLAP';
  }
  
  if (hour >= OVERLAP_HOURS.EUROPE_US.start && hour < OVERLAP_HOURS.EUROPE_US.end) {
    return 'EUROPE_US_OVERLAP';
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

  // Default to ASIA for remaining hours (22:00-00:00 UTC = 06:00-08:00 MYT)
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
    ASIA_EUROPE_OVERLAP: 'Asia-Europe Overlap',
    EUROPE_US_OVERLAP: 'Europe-US Overlap',
  };
  return names[session];
}

/**
 * Get session color for UI
 */
export function getSessionColor(session: MarketSession): string {
  const colors = {
    ASIA: '#3b82f6',               // blue
    EUROPE: '#10b981',             // green
    US: '#f59e0b',                 // amber
    ASIA_EUROPE_OVERLAP: '#8b5cf6', // purple
    EUROPE_US_OVERLAP: '#ec4899',   // pink
  };
  return colors[session];
}
