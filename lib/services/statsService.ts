/**
 * Statistics Service
 * Provides aggregated stats from daily_summaries for dashboard and analytics
 * 
 * CRITICAL: Query daily_summaries (fast, pre-aggregated) NOT individual_trades
 */

import { prisma } from '@/lib/db';
import { DailySummary } from '@prisma/client';

type MarketSession = 'ASIA' | 'EUROPE' | 'US' | 'OVERLAP';

export interface PersonalStats {
  totalTrades: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  totalSopFollowed: number;
  sopRate: number;
  totalProfitLossUsd: number;
  bestSession: MarketSession | null;
  bestSessionWinRate: number;
  sessionBreakdown: Record<MarketSession, { trades: number; wins: number; winRate: number }>;
  periodDays: number;
}

export interface SessionStats {
  session: MarketSession;
  totalTrades: number;
  totalWins: number;
  winRate: number;
}

export interface DailyTrend {
  date: string; // ISO date string
  totalTrades: number;
  totalWins: number;
  winRate: number;
}

export interface HourlyStats {
  hour: number; // 0-23 UTC
  totalTrades: number;
  totalWins: number;
  winRate: number;
}

/**
 * Get personal statistics for a user within a timeframe
 * @param userId - User ID
 * @param timeframe - 'week' | 'month' | 'year' | 'all' (default: 'month')
 */
export async function getPersonalStats(
  userId: string,
  timeframe: 'week' | 'month' | 'year' | 'all' = 'month'
): Promise<PersonalStats> {
  // Calculate date range
  const now = new Date();
  let startDate: Date | undefined;

  switch (timeframe) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    case 'all':
      startDate = undefined; // No filter
      break;
  }

  // Query daily_summaries (FAST, pre-aggregated)
  const summaries = await prisma.dailySummary.findMany({
    where: {
      userId,
      ...(startDate && { tradeDate: { gte: startDate } }),
    },
    orderBy: {
      tradeDate: 'desc',
    },
  });

  // Aggregate across days
  const totalTrades = summaries.reduce((sum: number, s: DailySummary) => sum + s.totalTrades, 0);
  const totalWins = summaries.reduce((sum: number, s: DailySummary) => sum + s.totalWins, 0);
  const totalLosses = summaries.reduce((sum: number, s: DailySummary) => sum + s.totalLosses, 0);
  const totalSopFollowed = summaries.reduce((sum: number, s: DailySummary) => sum + s.totalSopFollowed, 0);
  const totalProfitLossUsd = summaries.reduce((sum: number, s: DailySummary) => sum + s.totalProfitLossUsd, 0);

  const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
  const sopRate = totalTrades > 0 ? (totalSopFollowed / totalTrades) * 100 : 0;

  // Determine best session across all days
  const sessionTotals: Record<MarketSession, { trades: number; wins: number }> = {
    ASIA: { trades: 0, wins: 0 },
    EUROPE: { trades: 0, wins: 0 },
    US: { trades: 0, wins: 0 },
    OVERLAP: { trades: 0, wins: 0 },
  };

  summaries.forEach((s: DailySummary) => {
    sessionTotals.ASIA.trades += s.asiaSessionTrades;
    sessionTotals.EUROPE.trades += s.europeSessionTrades;
    sessionTotals.US.trades += s.usSessionTrades;
    sessionTotals.OVERLAP.trades += s.overlapSessionTrades;
    
    sessionTotals.ASIA.wins += s.asiaSessionWins;
    sessionTotals.EUROPE.wins += s.europeSessionWins;
    sessionTotals.US.wins += s.usSessionWins;
    sessionTotals.OVERLAP.wins += s.overlapSessionWins;
  });

  // Calculate win rate for each session and find best
  const sessionBreakdown: Record<MarketSession, { trades: number; wins: number; winRate: number }> = {
    ASIA: { ...sessionTotals.ASIA, winRate: 0 },
    EUROPE: { ...sessionTotals.EUROPE, winRate: 0 },
    US: { ...sessionTotals.US, winRate: 0 },
    OVERLAP: { ...sessionTotals.OVERLAP, winRate: 0 },
  };

  let bestSession: MarketSession | null = null;
  let bestWinRate = 0;

  (Object.keys(sessionTotals) as MarketSession[]).forEach((session) => {
    const { trades, wins } = sessionTotals[session];
    const sessionWinRate = trades > 0 ? (wins / trades) * 100 : 0;
    sessionBreakdown[session].winRate = Math.round(sessionWinRate * 10) / 10;
    
    if (trades >= 3) { // Require at least 3 trades for statistical relevance
      if (sessionWinRate > bestWinRate) {
        bestWinRate = sessionWinRate;
        bestSession = session;
      }
    }
  });

  return {
    totalTrades,
    totalWins,
    totalLosses,
    winRate: Math.round(winRate * 10) / 10, // Round to 1 decimal
    totalSopFollowed,
    sopRate: Math.round(sopRate * 10) / 10,
    totalProfitLossUsd: Math.round(totalProfitLossUsd * 100) / 100, // Round to cents
    bestSession,
    bestSessionWinRate: Math.round(bestWinRate * 10) / 10,
    sessionBreakdown,
    periodDays: summaries.length,
  };
}

/**
 * Get statistics broken down by market session
 * @param userId - User ID
 * @param timeframe - 'week' | 'month' | 'year' | 'all' (default: 'month')
 */
export async function getSessionStats(
  userId: string,
  timeframe: 'week' | 'month' | 'year' | 'all' = 'month'
): Promise<SessionStats[]> {
  // Calculate date range
  const now = new Date();
  let startDate: Date | undefined;

  switch (timeframe) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    case 'all':
      startDate = undefined;
      break;
  }

  // Query individual trades directly for accurate session stats
  const trades = await prisma.individualTrade.findMany({
    where: {
      userId,
      ...(startDate && { tradeTimestamp: { gte: startDate } }),
    },
    select: {
      marketSession: true,
      result: true,
    },
  });

  // Aggregate by session
  const sessionTotals: Record<MarketSession, { trades: number; wins: number }> = {
    ASIA: { trades: 0, wins: 0 },
    EUROPE: { trades: 0, wins: 0 },
    US: { trades: 0, wins: 0 },
    OVERLAP: { trades: 0, wins: 0 },
  };

  trades.forEach((trade) => {
    const session = trade.marketSession as MarketSession;
    sessionTotals[session].trades++;
    if (trade.result === 'WIN') {
      sessionTotals[session].wins++;
    }
  });

  // Build stats array
  return (Object.keys(sessionTotals) as MarketSession[]).map((session) => {
    const { trades, wins } = sessionTotals[session];
    const winRate = trades > 0 ? Math.round((wins / trades) * 100 * 10) / 10 : 0;
    
    return {
      session,
      totalTrades: trades,
      totalWins: wins,
      winRate,
    };
  });
}

/**
 * Get daily trend data (for charts)
 * @param userId - User ID
 * @param timeframe - 'week' | 'month' | 'year' (default: 'month')
 * @param limit - Max number of days to return (default: 30)
 */
export async function getDailyTrends(
  userId: string,
  timeframe: 'week' | 'month' | 'year' = 'month',
  limit: number = 30
): Promise<DailyTrend[]> {
  // Calculate date range
  const now = new Date();
  let startDate: Date;

  switch (timeframe) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
  }

  // Query daily_summaries
  const summaries = await prisma.dailySummary.findMany({
    where: {
      userId,
      tradeDate: { gte: startDate },
    },
    orderBy: {
      tradeDate: 'desc',
    },
    take: limit,
  });

  // Map to trend data
  return summaries.map((s: DailySummary) => {
    const winRate = s.totalTrades > 0 ? Math.round((s.totalWins / s.totalTrades) * 100 * 10) / 10 : 0;
    
    return {
      date: s.tradeDate.toISOString().split('T')[0], // YYYY-MM-DD
      totalTrades: s.totalTrades,
      totalWins: s.totalWins,
      winRate,
    };
  }).reverse(); // Oldest to newest for charts
}

/**
 * Get hourly performance statistics with timezone conversion
 * @param userId - User ID
 * @param timeframe - 'week' | 'month' | 'year' | 'all' (default: 'month')
 * @param timezoneOffset - Timezone offset in hours from UTC (e.g., 8 for UTC+8 Malaysia, default: 0)
 */
export async function getHourlyStats(
  userId: string,
  timeframe: 'week' | 'month' | 'year' | 'all' = 'month',
  timezoneOffset: number = 0
): Promise<HourlyStats[]> {
  // Calculate date range
  const now = new Date();
  let startDate: Date | undefined;

  switch (timeframe) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    case 'all':
      startDate = undefined;
      break;
  }

  // Query individual trades (need timestamp precision)
  const trades = await prisma.individualTrade.findMany({
    where: {
      userId,
      ...(startDate && { tradeTimestamp: { gte: startDate } }),
    },
    select: {
      tradeTimestamp: true,
      result: true,
    },
  });

  // Group by hour with timezone conversion
  const hourlyData: Record<number, { trades: number; wins: number }> = {};
  
  // Initialize all 24 hours
  for (let hour = 0; hour < 24; hour++) {
    hourlyData[hour] = { trades: 0, wins: 0 };
  }

  // Count trades per hour with timezone conversion
  trades.forEach((trade) => {
    const utcHour = trade.tradeTimestamp.getUTCHours();
    // Convert to selected timezone
    let localHour = utcHour + timezoneOffset;
    // Handle day wrap-around
    if (localHour >= 24) localHour -= 24;
    if (localHour < 0) localHour += 24;
    
    hourlyData[localHour].trades++;
    if (trade.result === 'WIN') {
      hourlyData[localHour].wins++;
    }
  });

  // Convert to array with win rates
  return Array.from({ length: 24 }, (_, hour) => {
    const data = hourlyData[hour];
    const winRate = data.trades > 0 ? Math.round((data.wins / data.trades) * 100 * 10) / 10 : 0;
    
    return {
      hour,
      totalTrades: data.trades,
      totalWins: data.wins,
      winRate,
    };
  });
}
