/**
 * Account Rules Service
 * Computes live cycle status for a trading account:
 *   - currentCyclePnl (since last withdrawal)
 *   - cumulativePnl (all-time for account)
 *   - Daily & total drawdown used
 *   - Consistency status
 *   - Cycle profit target progress
 *   - Overall account health: SAFE | WARNING | BREACHED
 *
 * All metrics are derived from individualTrades filtered by tradingAccountId.
 * "Cycle" = trades AFTER the most recent withdrawal_events.withdrawal_date for this account.
 */

import { db } from '../db';
import { individualTrades, withdrawalEvents, accountRules } from '../db/schema';
import { eq, and, gte, lte, sum, max, desc } from 'drizzle-orm';
import { getAccountRules } from './tradingAccountService';
import { parseISO } from 'date-fns';

// ============================================
// TYPES
// ============================================

export type AccountHealthStatus = 'SAFE' | 'WARNING' | 'BREACHED';

export interface CycleStatus {
  // P&L
  currentCyclePnl: number;
  cumulativePnl: number;
  cycleStartDate: Date | null; // null = since account creation
  // Last withdrawal (for display in dashboard / calendar context)
  lastWithdrawal: { date: string; amount: number } | null;
  // Total withdrawn all-time from this account
  totalWithdrawn: number;
  // Drawdown
  dailyDrawdownLimitUsd: number | null;
  dailyDrawdownUsedUsd: number;
  dailyDrawdownUsedPct: number | null; // % of limit used (null if no limit)
  totalDrawdownLimitUsd: number | null;
  totalDrawdownUsedUsd: number;
  totalDrawdownUsedPct: number | null; // % of limit used (null if no limit)
  // Consistency
  consistencyTargetPct: number | null;
  currentConsistencyPct: number | null; // null if totalCyclePnl <= 0
  bestDayCyclePnl: number;
  consistencyStatus: 'PASS' | 'FAIL' | 'N/A';
  // Cycle profit target
  cycleTargetProfitUsd: number | null;
  cycleProgressPct: number | null; // null if no target set
  targetReached: boolean;
  // Overall health
  healthStatus: AccountHealthStatus;
}

export interface WithdrawalInput {
  tradingAccountId: string;
  withdrawalDate: string; // YYYY-MM-DD
  withdrawalAmount: number;
  notes?: string;
}

// ============================================
// CYCLE HELPERS
// ============================================

/** Returns the start of the current cycle AND the last withdrawal snapshot. */
async function getLastWithdrawal(
  tradingAccountId: string,
): Promise<{ withdrawalDate: string; withdrawalAmount: number } | null> {
  const [latest] = await db
    .select({ withdrawalDate: withdrawalEvents.withdrawalDate, withdrawalAmount: withdrawalEvents.withdrawalAmount })
    .from(withdrawalEvents)
    .where(eq(withdrawalEvents.tradingAccountId, tradingAccountId))
    .orderBy(desc(withdrawalEvents.withdrawalDate))
    .limit(1);
  return latest ?? null;
}

/** Returns the start of the current cycle: the day AFTER the last withdrawal, or null if none. */
async function getCycleStartDate(tradingAccountId: string): Promise<Date | null> {
  const [latest] = await db
    .select({ withdrawalDate: withdrawalEvents.withdrawalDate })
    .from(withdrawalEvents)
    .where(eq(withdrawalEvents.tradingAccountId, tradingAccountId))
    .orderBy(desc(withdrawalEvents.withdrawalDate))
    .limit(1);

  if (!latest) return null;

  // Cycle starts the day AFTER the withdrawal date
  const d = parseISO(latest.withdrawalDate);
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Sums profitLossUsd for all trades on an account since a given date (or all time if null). */
async function sumPnl(tradingAccountId: string, since: Date | null): Promise<number> {
  const conditions = [eq(individualTrades.tradingAccountId, tradingAccountId)];
  if (since) {
    conditions.push(gte(individualTrades.tradeTimestamp, since));
  }

  const [result] = await db
    .select({ total: sum(individualTrades.profitLossUsd) })
    .from(individualTrades)
    .where(and(...conditions));

  return Number(result?.total ?? 0);
}

/** Returns the highest single-day net P&L (all entry types, including commissions) within a cycle.
 * Groups by the user's local timezone date to match what is shown in the performance calendar. */
async function getBestDayCyclePnl(tradingAccountId: string, since: Date | null, timezone: string): Promise<number> {
  // We need per-day net totals — include all entry types (TRANSACTION + COMMISSION)
  const conditions = [
    eq(individualTrades.tradingAccountId, tradingAccountId),
  ];
  if (since) {
    conditions.push(gte(individualTrades.tradeTimestamp, since));
  }

  // Fetch all relevant trades and aggregate in JS (dataset is small per account)
  const trades = await db
    .select({
      timestamp: individualTrades.tradeTimestamp,
      pnl: individualTrades.profitLossUsd,
    })
    .from(individualTrades)
    .where(and(...conditions));

  // Group by local date in user's timezone (avoids UTC day boundary mismatch with calendar)
  const dayFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }); // en-CA gives YYYY-MM-DD
  const byDay: Record<string, number> = {};
  for (const t of trades) {
    const day = dayFormatter.format(t.timestamp);
    byDay[day] = (byDay[day] ?? 0) + t.pnl;
  }

  const dailyValues = Object.values(byDay);
  if (dailyValues.length === 0) return 0;
  return Math.max(...dailyValues.filter((v) => v > 0), 0);
}

/** Returns the total amount withdrawn from an account across all withdrawal events. */
async function sumWithdrawals(tradingAccountId: string): Promise<number> {
  const [result] = await db
    .select({ total: sum(withdrawalEvents.withdrawalAmount) })
    .from(withdrawalEvents)
    .where(eq(withdrawalEvents.tradingAccountId, tradingAccountId));
  return Number(result?.total ?? 0);
}

/**
 * Returns today's net P&L for an account (all entry types).
 * "Today" is defined by the account's dailyResetTimezone (falls back to UTC).
 * Uses the same Intl.DateTimeFormat 'en-CA' pattern as getBestDayCyclePnl to determine the local day.
 */
async function getTodayPnl(tradingAccountId: string, timezone: string = 'UTC'): Promise<number> {
  const now = new Date();
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(now); // YYYY-MM-DD
  const dayFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: timezone });

  // Fetch a 48-hour UTC window to ensure we capture the full local day regardless of offset
  const windowStart = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const trades = await db
    .select({ timestamp: individualTrades.tradeTimestamp, pnl: individualTrades.profitLossUsd })
    .from(individualTrades)
    .where(
      and(
        eq(individualTrades.tradingAccountId, tradingAccountId),
        gte(individualTrades.tradeTimestamp, windowStart)
      )
    );

  // Sum only trades whose local date matches today in the account's timezone
  return trades
    .filter((t) => dayFormatter.format(t.timestamp) === todayStr)
    .reduce((sum, t) => sum + t.pnl, 0);
}

// ============================================
// MAIN STATUS FUNCTION
// ============================================

/**
 * Returns the full live cycle status for a trading account.
 * Call this to power the DrawdownStatusCard, CycleProfitTargetCard, and account health badge.
 * Day boundaries use the account's dailyResetTimezone (from account_rules), falling back to UTC.
 */
export async function getCycleStatus(tradingAccountId: string): Promise<CycleStatus> {
  const [rules, cycleStartDate, lastWithdrawalRow] = await Promise.all([
    getAccountRules(tradingAccountId),
    getCycleStartDate(tradingAccountId),
    getLastWithdrawal(tradingAccountId),
  ]);

  const lastWithdrawal = lastWithdrawalRow
    ? { date: lastWithdrawalRow.withdrawalDate, amount: lastWithdrawalRow.withdrawalAmount }
    : null;

  // Use account's configured timezone for day boundaries (e.g. broker's trading day reset)
  const timezone = rules?.dailyResetTimezone ?? 'UTC';

  const [currentCyclePnl, grossCumulativePnl, todayPnl, bestDayCyclePnl, totalWithdrawn] = await Promise.all([
    sumPnl(tradingAccountId, cycleStartDate),
    sumPnl(tradingAccountId, null),
    getTodayPnl(tradingAccountId, timezone),
    getBestDayCyclePnl(tradingAccountId, cycleStartDate, timezone),
    sumWithdrawals(tradingAccountId),
  ]);

  // Cumulative P&L = total trading profits minus total withdrawals.
  // Represents net retained earnings in the account (withdrawals leave the account).
  const cumulativePnl = grossCumulativePnl - totalWithdrawn;

  // We need the account's starting balance for DD calculations
  // Caller should supply it, but we look it up from tradingAccounts via a join — fetch inline
  const { tradingAccounts: taTable } = await import('../db/schema');
  const [accountRow] = await db
    .select({ startingBalance: taTable.startingBalance })
    .from(taTable)
    .where(eq(taTable.id, tradingAccountId))
    .limit(1);
  const startingBalance = accountRow?.startingBalance ?? 0;

  // --- Daily Drawdown ---
  const dailyDrawdownLimitUsd = rules?.dailyDrawdownPct != null
    ? (rules.dailyDrawdownPct / 100) * startingBalance
    : null;
  // DD used = how much we've lost today (losses are negative, so flip sign)
  const dailyDrawdownUsedUsd = Math.max(0, -(todayPnl));
  const dailyDrawdownUsedPct = dailyDrawdownLimitUsd
    ? (dailyDrawdownUsedUsd / dailyDrawdownLimitUsd) * 100
    : null;

  // --- Total Drawdown ---
  const totalDrawdownLimitUsd = rules?.totalDrawdownPct != null
    ? (rules.totalDrawdownPct / 100) * startingBalance
    : null;
  // Total DD = how much the account is below starting balance within cycle
  const totalDrawdownUsedUsd = Math.max(0, -(currentCyclePnl));
  const totalDrawdownUsedPct = totalDrawdownLimitUsd
    ? (totalDrawdownUsedUsd / totalDrawdownLimitUsd) * 100
    : null;

  // --- Consistency ---
  const consistencyTargetPct = rules?.consistencyTargetPct ?? null;
  let currentConsistencyPct: number | null = null;
  let consistencyStatus: 'PASS' | 'FAIL' | 'N/A' = 'N/A';

  if (consistencyTargetPct != null) {
    if (currentCyclePnl > 0) {
      currentConsistencyPct = (bestDayCyclePnl / currentCyclePnl) * 100;
      consistencyStatus = currentConsistencyPct <= consistencyTargetPct ? 'PASS' : 'FAIL';
    } else {
      // No cycle profit yet — treat as PASS (nothing to violate)
      consistencyStatus = 'PASS';
    }
  }

  // --- Cycle Profit Target ---
  const cycleTargetProfitUsd = rules?.cycleTargetProfitUsd ?? null;
  const cycleProgressPct = cycleTargetProfitUsd
    ? Math.min(100, (currentCyclePnl / cycleTargetProfitUsd) * 100)
    : null;
  const targetReached = cycleTargetProfitUsd != null && currentCyclePnl >= cycleTargetProfitUsd;

  // --- Health Status ---
  const WARNING_THRESHOLD = 80;
  let healthStatus: AccountHealthStatus = 'SAFE';

  const dailyBreached = dailyDrawdownUsedPct != null && dailyDrawdownUsedPct > 100;
  const totalBreached = totalDrawdownUsedPct != null && totalDrawdownUsedPct > 100;

  if (dailyBreached || totalBreached) {
    healthStatus = 'BREACHED';
  } else {
    const dailyWarning = dailyDrawdownUsedPct != null && dailyDrawdownUsedPct >= WARNING_THRESHOLD;
    const totalWarning = totalDrawdownUsedPct != null && totalDrawdownUsedPct >= WARNING_THRESHOLD;
    const consistencyFail = consistencyStatus === 'FAIL';

    if (dailyWarning || totalWarning || consistencyFail) {
      healthStatus = 'WARNING';
    }
  }

  return {
    currentCyclePnl,
    cumulativePnl,
    cycleStartDate,
    lastWithdrawal,
    totalWithdrawn,
    dailyDrawdownLimitUsd,
    dailyDrawdownUsedUsd,
    dailyDrawdownUsedPct,
    totalDrawdownLimitUsd,
    totalDrawdownUsedUsd,
    totalDrawdownUsedPct,
    consistencyTargetPct,
    currentConsistencyPct,
    bestDayCyclePnl,
    consistencyStatus,
    cycleTargetProfitUsd,
    cycleProgressPct,
    targetReached,
    healthStatus,
  };
}

// ============================================
// WITHDRAWAL
// ============================================

/**
 * Records a withdrawal event for a trading account.
 * This starts a new cycle: DD tracking, currentCyclePnl, and consistency all reset.
 * cumulativePnl is never reset — it's always computed from all trades.
 */
export async function recordWithdrawal(input: WithdrawalInput) {
  // Get current cycle P&L as snapshot
  const cycleStartDate = await getCycleStartDate(input.tradingAccountId);
  const cyclePnlAtWithdrawal = await sumPnl(input.tradingAccountId, cycleStartDate);

  // Compute current balance = startingBalance + totalTradingPnl - pastWithdrawals
  const [grossCumulativePnl, pastWithdrawals] = await Promise.all([
    sumPnl(input.tradingAccountId, null),
    sumWithdrawals(input.tradingAccountId),
  ]);
  const { tradingAccounts: taTable } = await import('../db/schema');
  const [accountRow] = await db
    .select({ startingBalance: taTable.startingBalance })
    .from(taTable)
    .where(eq(taTable.id, input.tradingAccountId))
    .limit(1);
  const balanceAtWithdrawal = (accountRow?.startingBalance ?? 0) + grossCumulativePnl - pastWithdrawals;

  const [event] = await db
    .insert(withdrawalEvents)
    .values({
      tradingAccountId: input.tradingAccountId,
      withdrawalDate: input.withdrawalDate,
      withdrawalAmount: input.withdrawalAmount,
      balanceAtWithdrawal,
      cyclePnlAtWithdrawal,
      notes: input.notes ?? null,
    })
    .returning();

  return event;
}

/** Returns withdrawal history for an account, newest first. */
export async function getWithdrawalHistory(tradingAccountId: string) {
  return db
    .select()
    .from(withdrawalEvents)
    .where(eq(withdrawalEvents.tradingAccountId, tradingAccountId))
    .orderBy(desc(withdrawalEvents.withdrawalDate));
}
