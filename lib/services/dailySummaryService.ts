/**
 * Daily Summary Auto-Update Service
 * CRITICAL: This service MUST be called after every trade insert/update/delete
 * Ensures dashboard loads fast by pre-calculating aggregates
 */

import { prisma } from '../db';
import { calculateMarketSession } from '../utils/marketSessions';

interface DailySummaryData {
  totalTrades: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  totalSopFollowed: number;
  sopRate: number;
  totalProfitLossUsd: number;
  asiaTrades: number;
  europeTrades: number;
  usTrades: number;
  overlapTrades: number;
  bestSession: string | null;
}

/**
 * Update or create daily summary for a user and date
 * Call this after ANY change to individual_trades table
 * 
 * @param userId - User ID
 * @param tradeDate - Date to calculate summary for (YYYY-MM-DD format)
 */
export async function updateDailySummary(userId: string, tradeDate: Date): Promise<void> {
  // Normalize date to start of day (00:00:00)
  const startOfDay = new Date(tradeDate);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const endOfDay = new Date(tradeDate);
  endOfDay.setUTCHours(23, 59, 59, 999);

  // Fetch all trades for this user and date
  const trades = await prisma.individualTrade.findMany({
    where: {
      userId,
      tradeTimestamp: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  // Calculate aggregates
  const totalTrades = trades.length;
  const totalWins = trades.filter(t => t.result === 'WIN').length;
  const totalLosses = trades.filter(t => t.result === 'LOSS').length;

  const totalSopFollowed = trades.filter(t => t.sopFollowed).length;
  const totalSopNotFollowed = trades.filter(t => !t.sopFollowed).length;

  const totalProfitLossUsd = trades.reduce((sum, t) => sum + t.profitLossUsd, 0);

  // Count trades per session
  const asiaSessionTrades = trades.filter(t => t.marketSession === 'ASIA').length;
  const asiaSessionWins = trades.filter(t => t.marketSession === 'ASIA' && t.result === 'WIN').length;
  
  const europeSessionTrades = trades.filter(t => t.marketSession === 'EUROPE').length;
  const europeSessionWins = trades.filter(t => t.marketSession === 'EUROPE' && t.result === 'WIN').length;
  
  const usSessionTrades = trades.filter(t => t.marketSession === 'US').length;
  const usSessionWins = trades.filter(t => t.marketSession === 'US' && t.result === 'WIN').length;
  
  const overlapSessionTrades = trades.filter(t => t.marketSession === 'OVERLAP').length;
  const overlapSessionWins = trades.filter(t => t.marketSession === 'OVERLAP' && t.result === 'WIN').length;

  // Determine best session (highest win rate with at least 1 trade)
  const sessionStats = [
    { session: 'ASIA', trades: asiaSessionTrades, wins: asiaSessionWins },
    { session: 'EUROPE', trades: europeSessionTrades, wins: europeSessionWins },
    { session: 'US', trades: usSessionTrades, wins: usSessionWins },
    { session: 'OVERLAP', trades: overlapSessionTrades, wins: overlapSessionWins },
  ];

  const bestSessionData = sessionStats
    .filter(s => s.trades > 0)
    .sort((a, b) => (b.wins / b.trades) - (a.wins / a.trades))[0];

  const bestSession = bestSessionData ? bestSessionData.session : null;

  // UPSERT into daily_summaries table
  await prisma.dailySummary.upsert({
    where: {
      userId_tradeDate: {
        userId,
        tradeDate: startOfDay,
      },
    },
    update: {
      totalTrades,
      totalWins,
      totalLosses,
      totalSopFollowed,
      totalSopNotFollowed,
      totalProfitLossUsd,
      asiaSessionTrades,
      asiaSessionWins,
      europeSessionTrades,
      europeSessionWins,
      usSessionTrades,
      usSessionWins,
      overlapSessionTrades,
      overlapSessionWins,
      bestSession,
      updatedAt: new Date(),
    },
    create: {
      userId,
      tradeDate: startOfDay,
      totalTrades,
      totalWins,
      totalLosses,
      totalSopFollowed,
      totalSopNotFollowed,
      totalProfitLossUsd,
      asiaSessionTrades,
      asiaSessionWins,
      europeSessionTrades,
      europeSessionWins,
      usSessionTrades,
      usSessionWins,
      overlapSessionTrades,
      overlapSessionWins,
      bestSession,
    },
  });
}

/**
 * Get daily summaries for a user within a date range
 * Used for dashboard and analytics
 * 
 * @param userId - User ID
 * @param startDate - Start date (inclusive)
 * @param endDate - End date (inclusive)
 */
export async function getDailySummaries(userId: string, startDate: Date, endDate: Date) {
  return await prisma.dailySummary.findMany({
    where: {
      userId,
      tradeDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      tradeDate: 'desc',
    },
  });
}

/**
 * Get aggregated stats across multiple days
 * Used for monthly/weekly performance summaries
 */
export async function getAggregatedStats(userId: string, startDate: Date, endDate: Date) {
  const summaries = await getDailySummaries(userId, startDate, endDate);

  const totalTrades = summaries.reduce((sum, s) => sum + s.totalTrades, 0);
  const totalWins = summaries.reduce((sum, s) => sum + s.totalWins, 0);
  const totalLosses = summaries.reduce((sum, s) => sum + s.totalLosses, 0);
  const totalSopFollowed = summaries.reduce((sum, s) => sum + s.totalSopFollowed, 0);
  const totalProfitLossUsd = summaries.reduce((sum, s) => sum + s.totalProfitLossUsd, 0);

  const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
  const sopRate = totalTrades > 0 ? (totalSopFollowed / totalTrades) * 100 : 0;

  return {
    totalTrades,
    totalWins,
    totalLosses,
    winRate,
    sopRate,
    totalProfitLossUsd,
    dailySummaries: summaries,
  };
}

/**
 * Helper function for seed script - update summary for a specific date
 * @param userId - User ID
 * @param date - The date to update summary for
 */
export async function updateDailySummaryForDate(userId: string, date: Date): Promise<void> {
  return updateDailySummary(userId, date);
}

