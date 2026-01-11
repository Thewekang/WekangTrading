/**
 * Daily Summary Auto-Update Service
 * CRITICAL: This service MUST be called after every trade insert/update/delete
 * Ensures dashboard loads fast by pre-calculating aggregates
 */

import { db } from '../db';
import { individualTrades, dailySummaries } from '../db/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
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
  const trades = await db
    .select()
    .from(individualTrades)
    .where(and(
      eq(individualTrades.userId, userId),
      gte(individualTrades.tradeTimestamp, startOfDay),
      lte(individualTrades.tradeTimestamp, endOfDay)
    ));

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

  const bestSession = bestSessionData ? bestSessionData.session as 'ASIA' | 'EUROPE' | 'US' | 'OVERLAP' : null;

  // Check if summary exists
  const [existingSummary] = await db
    .select()
    .from(dailySummaries)
    .where(and(
      eq(dailySummaries.userId, userId),
      eq(dailySummaries.tradeDate, startOfDay)
    ))
    .limit(1);

  const summaryData = {
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
  };

  if (existingSummary) {
    // Update existing summary
    await db
      .update(dailySummaries)
      .set({
        ...summaryData,
        updatedAt: new Date(),
      })
      .where(eq(dailySummaries.id, existingSummary.id));
  } else {
    // Create new summary
    await db
      .insert(dailySummaries)
      .values({
        userId,
        tradeDate: startOfDay,
        ...summaryData,
      });
  }
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
  return await db
    .select()
    .from(dailySummaries)
    .where(and(
      eq(dailySummaries.userId, userId),
      gte(dailySummaries.tradeDate, startDate),
      lte(dailySummaries.tradeDate, endDate)
    ))
    .orderBy(desc(dailySummaries.tradeDate));
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

