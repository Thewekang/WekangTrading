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

  // Find session with highest win rate (with minimum 5 trades threshold)
  let bestSession: MarketSession | null = null;
  let bestWinRate = 0;

  (Object.keys(sessionTotals) as MarketSession[]).forEach((session) => {
    const { trades, wins } = sessionTotals[session];
    if (trades >= 5) { // Require at least 5 trades for statistical relevance
      const sessionWinRate = (wins / trades) * 100;
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

  // Query daily_summaries
  const summaries = await prisma.dailySummary.findMany({
    where: {
      userId,
      ...(startDate && { tradeDate: { gte: startDate } }),
    },
  });

  // Aggregate by session
  const sessionTotals: Record<MarketSession, { trades: number; wins: number }> = {
    ASIA: { trades: 0, wins: 0 },
    EUROPE: { trades: 0, wins: 0 },
    US: { trades: 0, wins: 0 },
    OVERLAP: { trades: 0, wins: 0 },
  };

  summaries.forEach((s: DailySummary) => {
    sessionTotals.ASIA.trades += s.asiaSessionTrades;
    sessionTotals.ASIA.wins += s.asiaSessionWins;
    
    sessionTotals.EUROPE.trades += s.europeSessionTrades;
    sessionTotals.EUROPE.wins += s.europeSessionWins;
    
    sessionTotals.US.trades += s.usSessionTrades;
    sessionTotals.US.wins += s.usSessionWins;
    
    sessionTotals.OVERLAP.trades += s.overlapSessionTrades;
    sessionTotals.OVERLAP.wins += s.overlapSessionWins;
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
