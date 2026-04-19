/**
 * Daily Summary Auto-Update Service
 * CRITICAL: This service MUST be called after every trade insert/update/delete
 * Ensures dashboard loads fast by pre-calculating aggregates
 */

import { db } from '../db';
import { individualTrades, dailySummaries } from '../db/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { calculateMarketSession } from '../utils/marketSessions';
import { getDayBoundariesInTimezone } from '../utils/dateUtils';
import { getAccountRules } from './tradingAccountService';

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
 * @param accountId - Optional trading account ID to scope the summary
 */
export async function updateDailySummary(userId: string, tradeDate: Date, accountId?: string): Promise<void> {
  // Determine day boundaries using the account's configured timezone.
  // Falls back to UTC when no accountId or no dailyResetTimezone is set.
  let timezone = 'UTC';
  if (accountId) {
    const rules = await getAccountRules(accountId);
    if (rules?.dailyResetTimezone) {
      timezone = rules.dailyResetTimezone;
    }
  }

  // Get the UTC start/end boundaries of the trading day in the account's timezone.
  // Storage key (startOfDay) is always UTC midnight of the LOCAL calendar date,
  // so summaries for "April 20 MYT" are keyed as 2026-04-20T00:00:00Z regardless of timezone.
  const { start: startOfDay, end: endOfDay, localDateStr } = getDayBoundariesInTimezone(tradeDate, timezone);
  // Normalize storage key to UTC midnight of local date (e.g. "2026-04-20" → 2026-04-20T00:00:00Z)
  const summaryDateKey = new Date(localDateStr + 'T00:00:00Z');

  // Fetch trades for this user and date, filtered by account if provided
  const tradeConditions = [
    eq(individualTrades.userId, userId),
    gte(individualTrades.tradeTimestamp, startOfDay),
    lte(individualTrades.tradeTimestamp, endOfDay),
  ];
  if (accountId) {
    tradeConditions.push(eq(individualTrades.tradingAccountId, accountId));
  }

  const trades = await db
    .select({
      entryType: individualTrades.entryType,
      result: individualTrades.result,
      sopFollowed: individualTrades.sopFollowed,
      profitLossUsd: individualTrades.profitLossUsd,
      marketSession: individualTrades.marketSession,
    })
    .from(individualTrades)
    .where(and(...tradeConditions));

  // Split into transaction entries and commission entries
  const transactions = trades.filter(t => t.entryType === 'TRANSACTION');
  const commissions = trades.filter(t => t.entryType === 'COMMISSION');

  // Calculate transaction aggregates (win/loss/SOP stats exclude commission entries)
  const totalTrades = transactions.length;
  const totalWins = transactions.filter(t => t.result === 'WIN').length;
  const totalLosses = transactions.filter(t => t.result === 'LOSS').length;

  const totalSopFollowed = transactions.filter(t => t.sopFollowed === true).length;
  const totalSopNotFollowed = transactions.filter(t => t.sopFollowed === false).length;

  // Gross P&L = sum of TRANSACTION entries only
  const totalProfitLossUsd = transactions.reduce((sum, t) => sum + t.profitLossUsd, 0);

  // Total commission = sum of COMMISSION entries (stored as negative values in DB)
  const totalCommissionUsd = commissions.reduce((sum, t) => sum + t.profitLossUsd, 0);

  // Count trades per session (TRANSACTION entries only)
  const asiaSessionTrades = transactions.filter(t => t.marketSession === 'ASIA').length;
  const asiaSessionWins = transactions.filter(t => t.marketSession === 'ASIA' && t.result === 'WIN').length;
  
  const europeSessionTrades = transactions.filter(t => t.marketSession === 'EUROPE').length;
  const europeSessionWins = transactions.filter(t => t.marketSession === 'EUROPE' && t.result === 'WIN').length;
  
  const usSessionTrades = transactions.filter(t => t.marketSession === 'US').length;
  const usSessionWins = transactions.filter(t => t.marketSession === 'US' && t.result === 'WIN').length;
  
  // Overlap sessions: sum both types for backwards compatibility with DB schema
  const asiaEuropeOverlapTrades = transactions.filter(t => t.marketSession === 'ASIA_EUROPE_OVERLAP').length;
  const asiaEuropeOverlapWins = transactions.filter(t => t.marketSession === 'ASIA_EUROPE_OVERLAP' && t.result === 'WIN').length;
  
  const europeUsOverlapTrades = transactions.filter(t => t.marketSession === 'EUROPE_US_OVERLAP').length;
  const europeUsOverlapWins = transactions.filter(t => t.marketSession === 'EUROPE_US_OVERLAP' && t.result === 'WIN').length;
  
  // Total overlap (for DB column)
  const overlapSessionTrades = asiaEuropeOverlapTrades + europeUsOverlapTrades;
  const overlapSessionWins = asiaEuropeOverlapWins + europeUsOverlapWins;

  // Determine best session (highest win rate with at least 1 trade)
  const sessionStats = [
    { session: 'ASIA', trades: asiaSessionTrades, wins: asiaSessionWins },
    { session: 'EUROPE', trades: europeSessionTrades, wins: europeSessionWins },
    { session: 'US', trades: usSessionTrades, wins: usSessionWins },
    { session: 'ASIA_EUROPE_OVERLAP', trades: asiaEuropeOverlapTrades, wins: asiaEuropeOverlapWins },
    { session: 'EUROPE_US_OVERLAP', trades: europeUsOverlapTrades, wins: europeUsOverlapWins },
  ];

  const bestSessionData = sessionStats
    .filter(s => s.trades > 0)
    .sort((a, b) => (b.wins / b.trades) - (a.wins / a.trades))[0];

  const bestSession = bestSessionData ? bestSessionData.session as 'ASIA' | 'EUROPE' | 'US' | 'ASIA_EUROPE_OVERLAP' | 'EUROPE_US_OVERLAP' : null;

  const summaryData = {
    totalTrades,
    totalWins,
    totalLosses,
    totalSopFollowed,
    totalSopNotFollowed,
    totalProfitLossUsd,
    totalCommissionUsd,
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

  // Atomic UPSERT — avoids the check-then-insert race condition and silent INSERT failures
  // that can occur with the Drizzle singleton on brand-new date rows.
  await db
    .insert(dailySummaries)
    .values({
      userId,
      tradingAccountId: accountId ?? null,
      tradeDate: summaryDateKey,
      ...summaryData,
    })
    .onConflictDoUpdate({
      target: [dailySummaries.userId, dailySummaries.tradeDate, dailySummaries.tradingAccountId],
      set: {
        ...summaryData,
        updatedAt: new Date(),
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
  const totalCommissionUsd = summaries.reduce((sum, s) => sum + (s.totalCommissionUsd ?? 0), 0);

  const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
  const sopRate = totalTrades > 0 ? (totalSopFollowed / totalTrades) * 100 : 0;

  return {
    totalTrades,
    totalWins,
    totalLosses,
    winRate,
    sopRate,
    totalProfitLossUsd,
    totalCommissionUsd,
    netProfitLossUsd: totalProfitLossUsd + totalCommissionUsd,
    dailySummaries: summaries,
  };
}

/**
 * Helper function for seed script - update summary for a specific date
 * @param userId - User ID
 * @param date - The date to update summary for
 */
export async function updateDailySummaryForDate(userId: string, date: Date, accountId?: string): Promise<void> {
  return updateDailySummary(userId, date, accountId);
}

