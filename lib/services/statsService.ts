/**
 * Statistics Service
 * Queries individual_trades directly (single source of truth, same as /trades page).
 * This guarantees stats are always accurate regardless of daily_summaries state.
 */

import { db } from '@/lib/db';
import { dailySummaries, individualTrades } from '@/lib/db/schema';
import { eq, and, gte, isNotNull, sql, count } from 'drizzle-orm';

const TRANSACTION = 'TRANSACTION' as const;
const COMMISSION = 'COMMISSION' as const;
import type { DailySummary } from '@/lib/db/schema/summaries';

type MarketSession = 'ASIA' | 'EUROPE' | 'US' | 'ASIA_EUROPE_OVERLAP' | 'EUROPE_US_OVERLAP';

export interface PersonalStats {
  totalTrades: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  totalSopFollowed: number;
  sopRate: number;
  totalProfitLossUsd: number;
  totalCommissionUsd: number;
  netProfitLossUsd: number;
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
 * Get personal statistics for a user within a timeframe.
 * Queries individual_trades directly — same source as the /trades page — so stats
 * are always accurate regardless of daily_summaries state.
 * @param userId - User ID
 * @param timeframe - 'week' | 'month' | 'year' | 'all' (default: 'month')
 * @param accountId - Optional trading account ID to scope the stats
 */
export async function getPersonalStats(
  userId: string,
  timeframe: 'week' | 'month' | 'year' | 'all' = 'month',
  accountId?: string
): Promise<PersonalStats> {
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

  // Query individual_trades directly (single source of truth, same as /trades page)
  const conditions = [eq(individualTrades.userId, userId)];
  if (accountId) conditions.push(eq(individualTrades.tradingAccountId, accountId));
  if (startDate) conditions.push(gte(individualTrades.tradeTimestamp, startDate));

  const trades = await db
    .select({
      entryType: individualTrades.entryType,
      result: individualTrades.result,
      sopFollowed: individualTrades.sopFollowed,
      profitLossUsd: individualTrades.profitLossUsd,
      marketSession: individualTrades.marketSession,
    })
    .from(individualTrades)
    .where(and(...conditions));

  // Split TRANSACTION vs COMMISSION (same logic as getTrades in individualTradeService)
  const transactions = trades.filter(t => t.entryType === TRANSACTION);
  const commissions = trades.filter(t => t.entryType === COMMISSION);

  const totalTrades = transactions.length;
  const totalWins = transactions.filter(t => t.result === 'WIN').length;
  const totalLosses = transactions.filter(t => t.result === 'LOSS').length;
  const totalSopFollowed = transactions.filter(t => t.sopFollowed === true).length;
  const totalProfitLossUsd = transactions.reduce((sum, t) => sum + t.profitLossUsd, 0);
  const totalCommissionUsd = commissions.reduce((sum, t) => sum + t.profitLossUsd, 0);
  const netProfitLossUsd = totalProfitLossUsd + totalCommissionUsd;

  const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
  const sopRate = totalTrades > 0 ? (totalSopFollowed / totalTrades) * 100 : 0;

  // Session breakdown (TRANSACTION only)
  const sessionTotals: Record<MarketSession, { trades: number; wins: number }> = {
    ASIA: { trades: 0, wins: 0 },
    EUROPE: { trades: 0, wins: 0 },
    US: { trades: 0, wins: 0 },
    ASIA_EUROPE_OVERLAP: { trades: 0, wins: 0 },
    EUROPE_US_OVERLAP: { trades: 0, wins: 0 },
  };

  transactions.forEach((trade) => {
    const session = trade.marketSession as MarketSession;
    if (sessionTotals[session]) {
      sessionTotals[session].trades++;
      if (trade.result === 'WIN') sessionTotals[session].wins++;
    }
  });

  const sessionBreakdown: Record<MarketSession, { trades: number; wins: number; winRate: number }> = {
    ASIA: { ...sessionTotals.ASIA, winRate: 0 },
    EUROPE: { ...sessionTotals.EUROPE, winRate: 0 },
    US: { ...sessionTotals.US, winRate: 0 },
    ASIA_EUROPE_OVERLAP: { ...sessionTotals.ASIA_EUROPE_OVERLAP, winRate: 0 },
    EUROPE_US_OVERLAP: { ...sessionTotals.EUROPE_US_OVERLAP, winRate: 0 },
  };

  let bestSession: MarketSession | null = null;
  let bestWinRate = 0;

  (Object.keys(sessionTotals) as MarketSession[]).forEach((session) => {
    const { trades: t, wins: w } = sessionTotals[session as MarketSession];
    const sessionWinRate = t > 0 ? (w / t) * 100 : 0;
    sessionBreakdown[session as MarketSession].winRate = Math.round(sessionWinRate * 10) / 10;
    if (t >= 3 && sessionWinRate > bestWinRate) {
      bestWinRate = sessionWinRate;
      bestSession = session as MarketSession;
    }
  });

  return {
    totalTrades,
    totalWins,
    totalLosses,
    winRate: Math.round(winRate * 10) / 10,
    totalSopFollowed,
    sopRate: Math.round(sopRate * 10) / 10,
    totalProfitLossUsd: Math.round(totalProfitLossUsd * 100) / 100,
    totalCommissionUsd: Math.round(totalCommissionUsd * 100) / 100,
    netProfitLossUsd: Math.round(netProfitLossUsd * 100) / 100,
    bestSession,
    bestSessionWinRate: Math.round(bestWinRate * 10) / 10,
    sessionBreakdown,
    periodDays: totalTrades > 0 ? 1 : 0, // kept for interface compatibility
  };
}

/**
 * Get statistics broken down by market session
 * @param userId - User ID
 * @param timeframe - 'week' | 'month' | 'year' | 'all' (default: 'month')
 */
export async function getSessionStats(
  userId: string,
  timeframe: 'week' | 'month' | 'year' | 'all' = 'month',
  accountId?: string
): Promise<SessionStats[]> {
  try {
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

    // Query TRANSACTION trades only — exclude COMMISSION entries from session stats
    const conditions = [eq(individualTrades.userId, userId), eq(individualTrades.entryType, TRANSACTION)];
    if (accountId) {
      conditions.push(eq(individualTrades.tradingAccountId, accountId));
    }
    if (startDate) {
      conditions.push(gte(individualTrades.tradeTimestamp, startDate));
    }

    const trades = await db
      .select({
        marketSession: individualTrades.marketSession,
        result: individualTrades.result,
      })
      .from(individualTrades)
      .where(and(...conditions));

  // Aggregate by session (including new overlap types)
  const sessionTotals: Record<MarketSession, { trades: number; wins: number }> = {
    ASIA: { trades: 0, wins: 0 },
    EUROPE: { trades: 0, wins: 0 },
    US: { trades: 0, wins: 0 },
    ASIA_EUROPE_OVERLAP: { trades: 0, wins: 0 },
    EUROPE_US_OVERLAP: { trades: 0, wins: 0 },
  };

  trades.forEach((trade) => {
    const session = trade.marketSession as MarketSession;
    // Safety check in case of unknown session type
    if (sessionTotals[session]) {
      sessionTotals[session].trades++;
      if (trade.result === 'WIN') {
        sessionTotals[session].wins++;
      }
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
  } catch (error) {
    console.error('[getSessionStats] Error:', error);
    // Return empty stats on error
    return [];
  }
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
  limit: number = 30,
  accountId?: string
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
  const conditions: any[] = [eq(dailySummaries.userId, userId), gte(dailySummaries.tradeDate, startDate)];
  if (accountId) {
    conditions.push(eq(dailySummaries.tradingAccountId, accountId));
  }

  const summaries = await db
    .select({
      tradeDate: dailySummaries.tradeDate,
      totalTrades: dailySummaries.totalTrades,
      totalWins: dailySummaries.totalWins,
    })
    .from(dailySummaries)
    .where(and(...conditions))
    .orderBy(dailySummaries.tradeDate)
    .limit(limit);

  // Map to trend data
  return summaries.map((s) => {
    const winRate = s.totalTrades > 0 ? Math.round((s.totalWins / s.totalTrades) * 100 * 10) / 10 : 0;
    const date = s.tradeDate; // Already a Date object
    
    return {
      date: date.toISOString().split('T')[0], // YYYY-MM-DD
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
  timezoneOffset: number = 0,
  accountId?: string
): Promise<HourlyStats[]> {
  try {
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

    // Query TRANSACTION trades only — exclude COMMISSION entries from hourly stats
    const conditions = [eq(individualTrades.userId, userId), eq(individualTrades.entryType, TRANSACTION)];
    if (accountId) {
      conditions.push(eq(individualTrades.tradingAccountId, accountId));
    }
    if (startDate) {
      conditions.push(gte(individualTrades.tradeTimestamp, startDate));
    }

    const trades = await db
      .select({
        tradeTimestamp: individualTrades.tradeTimestamp,
        result: individualTrades.result,
    })
    .from(individualTrades)
    .where(and(...conditions));

  // Group by hour with timezone conversion
  const hourlyData: Record<number, { trades: number; wins: number }> = {};
  
  // Initialize all 24 hours
  for (let hour = 0; hour < 24; hour++) {
    hourlyData[hour] = { trades: 0, wins: 0 };
  }

  // Count trades per hour with timezone conversion
  trades.forEach((trade) => {
    // tradeTimestamp is already a Date object
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
  } catch (error) {
    console.error('[getHourlyStats] Error:', error);
    // Return empty hourly data on error
    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      totalTrades: 0,
      totalWins: 0,
      winRate: 0,
    }));
  }
}

// ============================================
// SYMBOL STATS
// ============================================

export interface SymbolStat {
  symbol: string;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  netProfitLoss: number;
}

export interface SymbolStats {
  topProfitable: SymbolStat[];
  topLoss: SymbolStat[];
  all: SymbolStat[];
}

/**
 * Get per-symbol aggregated statistics
 * Queries individual_trades directly since daily_summaries don't have symbol breakdown
 */
export async function getSymbolStats(
  userId: string,
  timeframe: 'week' | 'month' | 'year' | 'all' = 'all',
  limit = 5,
  accountId?: string
): Promise<SymbolStats> {
  const now = new Date();
  let startDate: Date | undefined;

  switch (timeframe) {
    case 'week':  startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
    case 'month': startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
    case 'year':  startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); break;
    default: startDate = undefined;
  }

  // TRANSACTION entries only — COMMISSION entries skew symbol P/L and have no result
  const conditions = [
    eq(individualTrades.userId, userId),
    eq(individualTrades.entryType, TRANSACTION),
    isNotNull(individualTrades.symbol),
  ];
  if (accountId) conditions.push(eq(individualTrades.tradingAccountId, accountId));
  if (startDate) conditions.push(gte(individualTrades.tradeTimestamp, startDate));

  const rows = await db
    .select({
      symbol: individualTrades.symbol,
      totalTrades: count(),
      wins: sql<number>`cast(sum(case when ${individualTrades.result} = 'WIN' then 1 else 0 end) as integer)`,
      netProfitLoss: sql<number>`sum(${individualTrades.profitLossUsd})`,
    })
    .from(individualTrades)
    .where(and(...conditions))
    .groupBy(individualTrades.symbol);

  const all: SymbolStat[] = rows.map(r => {
    const wins = Number(r.wins ?? 0);
    const total = Number(r.totalTrades ?? 0);
    return {
      symbol: r.symbol!,
      totalTrades: total,
      wins,
      losses: total - wins,
      winRate: total > 0 ? Math.round((wins / total) * 1000) / 10 : 0,
      netProfitLoss: Math.round(Number(r.netProfitLoss ?? 0) * 100) / 100,
    };
  });

  const topProfitable = [...all].sort((a, b) => b.netProfitLoss - a.netProfitLoss).slice(0, limit);
  const topLoss = [...all].sort((a, b) => a.netProfitLoss - b.netProfitLoss).slice(0, limit);

  return { topProfitable, topLoss, all };
}
