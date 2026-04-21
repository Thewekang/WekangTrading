/**
 * Daily Summary Auto-Update Service
 * CRITICAL: This service MUST be called after every trade insert/update/delete
 * Ensures dashboard loads fast by pre-calculating aggregates
 */

import { db } from '../db';
import { dailySummaries } from '../db/schema';
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

  // Fetch trades for this user and date using raw SQL (Drizzle ORM SELECT is unreliable
  // after multiple sequential calls in the same process via the libsql WebSocket connection).
  const startSeconds = Math.floor(startOfDay.getTime() / 1000);
  const endSeconds = Math.floor(endOfDay.getTime() / 1000);

  const rawTrades = await db.run(
    accountId
      ? sql`SELECT entry_type, result, sop_followed, profit_loss_usd, market_session
            FROM individual_trades
            WHERE user_id = ${userId}
              AND trade_timestamp >= ${startSeconds}
              AND trade_timestamp <= ${endSeconds}
              AND trading_account_id = ${accountId}`
      : sql`SELECT entry_type, result, sop_followed, profit_loss_usd, market_session
            FROM individual_trades
            WHERE user_id = ${userId}
              AND trade_timestamp >= ${startSeconds}
              AND trade_timestamp <= ${endSeconds}
              AND trading_account_id IS NULL`
  );

  const trades = rawTrades.rows as unknown as Array<{
    entry_type: string;
    result: string | null;
    sop_followed: number | null;
    profit_loss_usd: number;
    market_session: string | null;
  }>;

  // Map raw rows to usable shape
  const mappedTrades = trades.map(row => ({
    entryType: row.entry_type as 'TRANSACTION' | 'COMMISSION',
    result: row.result as 'WIN' | 'LOSS' | 'BE' | null,
    sopFollowed: row.sop_followed === 1 ? true : row.sop_followed === 0 ? false : null,
    profitLossUsd: row.profit_loss_usd,
    marketSession: row.market_session as 'ASIA' | 'EUROPE' | 'US' | 'ASIA_EUROPE_OVERLAP' | 'EUROPE_US_OVERLAP' | null,
  }));

  // Split into transaction entries and commission entries
  const transactions = mappedTrades.filter(t => t.entryType === 'TRANSACTION');
  const commissions = mappedTrades.filter(t => t.entryType === 'COMMISSION');

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

  // RELIABILITY NOTE: All DB writes use db.run() (raw SQL) exclusively.
  // The Drizzle ORM singleton's db.insert() / db.update() and even db.select() silently
  // fail or return stale results after multiple sequential calls in the same process
  // via the libsql WebSocket connection. db.run() is always reliable.
  const tradeDateSeconds = Math.floor(summaryDateKey.getTime() / 1000);
  const rowId = crypto.randomUUID();
  const nowSeconds = Math.floor(Date.now() / 1000);

  // Step 1: Ensure the row exists (no-op if already there)
  await db.run(sql`
    INSERT OR IGNORE INTO daily_summaries (
      id, user_id, trading_account_id, trade_date,
      total_trades, total_wins, total_losses,
      total_sop_followed, total_sop_not_followed,
      total_profit_loss_usd, total_commission_usd,
      asia_session_trades, asia_session_wins,
      europe_session_trades, europe_session_wins,
      us_session_trades, us_session_wins,
      overlap_session_trades, overlap_session_wins,
      created_at, updated_at
    ) VALUES (
      ${rowId}, ${userId}, ${accountId ?? null}, ${tradeDateSeconds},
      0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      ${nowSeconds}, ${nowSeconds}
    )
  `);

  // Step 2: Always overwrite with freshly-computed values
  await db.run(
    accountId
      ? sql`UPDATE daily_summaries SET
          total_trades = ${totalTrades}, total_wins = ${totalWins}, total_losses = ${totalLosses},
          total_sop_followed = ${totalSopFollowed}, total_sop_not_followed = ${totalSopNotFollowed},
          total_profit_loss_usd = ${totalProfitLossUsd}, total_commission_usd = ${totalCommissionUsd},
          asia_session_trades = ${asiaSessionTrades}, asia_session_wins = ${asiaSessionWins},
          europe_session_trades = ${europeSessionTrades}, europe_session_wins = ${europeSessionWins},
          us_session_trades = ${usSessionTrades}, us_session_wins = ${usSessionWins},
          overlap_session_trades = ${overlapSessionTrades}, overlap_session_wins = ${overlapSessionWins},
          best_session = ${bestSession ?? null}, updated_at = ${nowSeconds}
        WHERE user_id = ${userId} AND trade_date = ${tradeDateSeconds} AND trading_account_id = ${accountId}`
      : sql`UPDATE daily_summaries SET
          total_trades = ${totalTrades}, total_wins = ${totalWins}, total_losses = ${totalLosses},
          total_sop_followed = ${totalSopFollowed}, total_sop_not_followed = ${totalSopNotFollowed},
          total_profit_loss_usd = ${totalProfitLossUsd}, total_commission_usd = ${totalCommissionUsd},
          asia_session_trades = ${asiaSessionTrades}, asia_session_wins = ${asiaSessionWins},
          europe_session_trades = ${europeSessionTrades}, europe_session_wins = ${europeSessionWins},
          us_session_trades = ${usSessionTrades}, us_session_wins = ${usSessionWins},
          overlap_session_trades = ${overlapSessionTrades}, overlap_session_wins = ${overlapSessionWins},
          best_session = ${bestSession ?? null}, updated_at = ${nowSeconds}
        WHERE user_id = ${userId} AND trade_date = ${tradeDateSeconds} AND trading_account_id IS NULL`
  );
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

