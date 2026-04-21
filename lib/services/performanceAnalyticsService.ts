import { db } from '@/lib/db';
import { dailySummaries, individualTrades, withdrawalEvents, tradingAccounts } from '@/lib/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

const TRANSACTION = 'TRANSACTION' as const;

interface MonthlyPerformance {
  month: string;
  monthNumber: number;
  winRate: number;
  sopRate: number;
  pnl: number;
  trades: number;
  wins: number;
  losses: number;
  hasData: boolean;
}

interface PerformanceOverview {
  totalPnl: number;
  winRate: number;
  sopRate: number;
  totalTrades: number;
  totalWins: number;
  totalLosses: number;
  winLossRecord: string;
}

interface YearlyPerformanceData {
  year: number;
  overview: PerformanceOverview;
  monthlyBreakdown: MonthlyPerformance[];
  withdrawals: { date: string; amount: number }[];
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Fetch all withdrawal events for a user (optionally filtered to a specific account).
 * Used to subtract withdrawals from P&L in performance views.
 */
async function getAccountWithdrawals(
  userId: string,
  accountId?: string,
): Promise<{ withdrawalDate: string; withdrawalAmount: number }[]> {
  if (accountId) {
    return db
      .select({
        withdrawalDate: withdrawalEvents.withdrawalDate,
        withdrawalAmount: withdrawalEvents.withdrawalAmount,
      })
      .from(withdrawalEvents)
      .where(eq(withdrawalEvents.tradingAccountId, accountId));
  }
  // All accounts for this user — join through trading_accounts
  return db
    .select({
      withdrawalDate: withdrawalEvents.withdrawalDate,
      withdrawalAmount: withdrawalEvents.withdrawalAmount,
    })
    .from(withdrawalEvents)
    .innerJoin(tradingAccounts, eq(withdrawalEvents.tradingAccountId, tradingAccounts.id))
    .where(eq(tradingAccounts.userId, userId));
}

/**
 * Get performance data for a specific year
 * Returns overview and monthly breakdown
 * Converts UTC timestamps to user's timezone for month grouping
 */
export async function getYearlyPerformance(userId: string, year: number, timezone: string = 'Asia/Kuala_Lumpur', accountId?: string): Promise<YearlyPerformanceData> {
  try {
    // Create start and end dates for the year in user's timezone
    // Convert to UTC for database query
    const startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0)); // Jan 1, 00:00:00 UTC
    const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)); // Dec 31, 23:59:59 UTC

    // Get TRANSACTION trades only (for win/SOP/trade counts and transaction P&L)
    const yearConditions: any[] = [
      eq(individualTrades.userId, userId),
      eq(individualTrades.entryType, TRANSACTION),
      gte(individualTrades.tradeTimestamp, startDate),
      lte(individualTrades.tradeTimestamp, endDate),
    ];
    if (accountId) yearConditions.push(eq(individualTrades.tradingAccountId, accountId));

    // Get COMMISSION trades separately (for net P&L calculation)
    const yearCommissionConditions: any[] = [
      eq(individualTrades.userId, userId),
      eq(individualTrades.entryType, 'COMMISSION' as const),
      gte(individualTrades.tradeTimestamp, startDate),
      lte(individualTrades.tradeTimestamp, endDate),
    ];
    if (accountId) yearCommissionConditions.push(eq(individualTrades.tradingAccountId, accountId));

    const [yearTrades, yearCommissions] = await Promise.all([
      db
        .select({
          timestamp: individualTrades.tradeTimestamp,
          result: individualTrades.result,
          sopFollowed: individualTrades.sopFollowed,
          profitLossUsd: individualTrades.profitLossUsd,
        })
        .from(individualTrades)
        .where(and(...yearConditions)),
      db
        .select({
          timestamp: individualTrades.tradeTimestamp,
          profitLossUsd: individualTrades.profitLossUsd,
        })
        .from(individualTrades)
        .where(and(...yearCommissionConditions)),
    ]);

    // Initialize monthly data
    const monthlyData: { [key: number]: { trades: number; wins: number; losses: number; sopFollowed: number; pnl: number } } = {};
    for (let i = 1; i <= 12; i++) {
      monthlyData[i] = { trades: 0, wins: 0, losses: 0, sopFollowed: 0, pnl: 0 };
    }

    // Aggregate trades by month
    let totalTrades = 0;
    let totalWins = 0;
    let totalLosses = 0;
    let totalSopFollowed = 0;
    let totalPnl = 0;

    const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'numeric', timeZone: timezone });

    yearTrades.forEach(trade => {
      const month = parseInt(monthFormatter.format(trade.timestamp));
      
      monthlyData[month].trades++;
      monthlyData[month].pnl += trade.profitLossUsd;
      totalTrades++;
      totalPnl += trade.profitLossUsd;

      if (trade.result === 'WIN') {
        monthlyData[month].wins++;
        totalWins++;
      } else if (trade.result === 'LOSS') {
        monthlyData[month].losses++;
        totalLosses++;
      }
      // BE trades: counted in totalTrades but not wins or losses

      if (trade.sopFollowed) {
        monthlyData[month].sopFollowed++;
        totalSopFollowed++;
      }
    });

    // Add commission P&L to each month (net P&L)
    yearCommissions.forEach(commission => {
      const month = parseInt(monthFormatter.format(commission.timestamp));
      monthlyData[month].pnl += commission.profitLossUsd;
      totalPnl += commission.profitLossUsd;
    });

    // Subtract withdrawals from the month they occurred — they reduce retained P&L
    const yearWithdrawals = await getAccountWithdrawals(userId, accountId);
    yearWithdrawals.forEach(w => {
      const [y, m] = w.withdrawalDate.split('-').map(Number);
      if (y === year) {
        monthlyData[m].pnl -= w.withdrawalAmount;
        totalPnl -= w.withdrawalAmount;
      }
    });

    // Build monthly breakdown
    const monthlyBreakdown: MonthlyPerformance[] = [];
    for (let i = 1; i <= 12; i++) {
      const data = monthlyData[i];
      const hasData = data.trades > 0;

      monthlyBreakdown.push({
        month: MONTH_NAMES[i - 1],
        monthNumber: i,
        winRate: hasData ? (data.wins / data.trades) * 100 : 0,
        sopRate: hasData ? (data.sopFollowed / data.trades) * 100 : 0,
        pnl: data.pnl,
        trades: data.trades,
        wins: data.wins,
        losses: data.losses,
        hasData,
      });
    }

    // Build overview
    const overview: PerformanceOverview = {
      totalPnl,
      winRate: totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0,
      sopRate: totalTrades > 0 ? (totalSopFollowed / totalTrades) * 100 : 0,
      totalTrades,
      totalWins,
      totalLosses,
      winLossRecord: `W:${totalWins} L:${totalLosses}`,
    };

    return {
      year,
      overview,
      monthlyBreakdown,
      // Full withdrawal list for this year so the calendar can show markers.
      // Each entry is { date: 'YYYY-MM-DD', amount: number }.
      withdrawals: yearWithdrawals
        .filter(w => parseInt(w.withdrawalDate.split('-')[0]) === year)
        .map(w => ({ date: w.withdrawalDate, amount: w.withdrawalAmount })),
    };
  } catch (error) {
    console.error('Error getting yearly performance:', error);
    throw new Error('Failed to retrieve yearly performance data');
  }
}

/**
 * Get performance data for a specific month
 * Returns detailed daily breakdown
 * Converts UTC timestamps to user's timezone for day grouping
 * Uses individualTrades to ensure timezone-correct daily aggregation
 */
export async function getMonthlyPerformance(userId: string, year: number, month: number, timezone: string = 'Asia/Kuala_Lumpur', accountId?: string) {
  try {
    // Create start and end dates for the month with buffer for timezone offset
    // Start from 2 days before to catch timezone edge cases
    const startDate = new Date(Date.UTC(year, month - 1, -1, 0, 0, 0, 0)); // 2 days before month start
    const endDate = new Date(Date.UTC(year, month, 2, 23, 59, 59, 999)); // 2 days after month end

    // Get TRANSACTION trades only (for win/SOP/trade counts and transaction P&L)
    const monthConditions: any[] = [
      eq(individualTrades.userId, userId),
      eq(individualTrades.entryType, TRANSACTION),
      gte(individualTrades.tradeTimestamp, startDate),
      lte(individualTrades.tradeTimestamp, endDate),
    ];
    if (accountId) monthConditions.push(eq(individualTrades.tradingAccountId, accountId));

    // Get COMMISSION trades separately (for net P&L calculation)
    const monthCommissionConditions: any[] = [
      eq(individualTrades.userId, userId),
      eq(individualTrades.entryType, 'COMMISSION' as const),
      gte(individualTrades.tradeTimestamp, startDate),
      lte(individualTrades.tradeTimestamp, endDate),
    ];
    if (accountId) monthCommissionConditions.push(eq(individualTrades.tradingAccountId, accountId));

    const [trades, commissions] = await Promise.all([
      db
        .select({
          timestamp: individualTrades.tradeTimestamp,
          result: individualTrades.result,
          sopFollowed: individualTrades.sopFollowed,
          profitLossUsd: individualTrades.profitLossUsd,
        })
        .from(individualTrades)
        .where(and(...monthConditions))
        .orderBy(individualTrades.tradeTimestamp),
      db
        .select({
          timestamp: individualTrades.tradeTimestamp,
          profitLossUsd: individualTrades.profitLossUsd,
        })
        .from(individualTrades)
        .where(and(...monthCommissionConditions)),
    ]);

    // Group trades by day in user's timezone
    const dailyMap = new Map<number, {
      trades: number;
      wins: number;
      losses: number;
      sopFollowed: number;
      pnl: number;
    }>();

    let totalTrades = 0;
    let totalWins = 0;
    let totalLosses = 0;
    let totalSopFollowed = 0;
    let totalPnl = 0;

    trades.forEach(trade => {
      // Extract day number in user's timezone
      const formatter = new Intl.DateTimeFormat('en-US', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        timeZone: timezone
      });
      const parts = formatter.formatToParts(trade.timestamp);
      const dayInTimezone = parseInt(parts.find(p => p.type === 'day')?.value || '0');
      const monthInTimezone = parseInt(parts.find(p => p.type === 'month')?.value || '0');
      const yearInTimezone = parseInt(parts.find(p => p.type === 'year')?.value || '0');

      // Only include trades that fall in the requested month/year in user's timezone
      if (yearInTimezone === year && monthInTimezone === month) {
        if (!dailyMap.has(dayInTimezone)) {
          dailyMap.set(dayInTimezone, { trades: 0, wins: 0, losses: 0, sopFollowed: 0, pnl: 0 });
        }

        const dayData = dailyMap.get(dayInTimezone)!;
        dayData.trades++;
        dayData.pnl += trade.profitLossUsd;
        totalTrades++;
        totalPnl += trade.profitLossUsd;

        if (trade.result === 'WIN') {
          dayData.wins++;
          totalWins++;
        } else if (trade.result === 'LOSS') {
          dayData.losses++;
          totalLosses++;
        }
        // BE trades: counted in totalTrades but not wins or losses

        if (trade.sopFollowed) {
          dayData.sopFollowed++;
          totalSopFollowed++;
        }
      }
    });

    // Add commission P&L to each day (net P&L)
    const dayFormatter = new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      timeZone: timezone,
    });
    commissions.forEach(commission => {
      const parts = dayFormatter.formatToParts(commission.timestamp);
      const dayInTimezone = parseInt(parts.find(p => p.type === 'day')?.value || '0');
      const monthInTimezone = parseInt(parts.find(p => p.type === 'month')?.value || '0');
      const yearInTimezone = parseInt(parts.find(p => p.type === 'year')?.value || '0');

      if (yearInTimezone === year && monthInTimezone === month) {
        if (!dailyMap.has(dayInTimezone)) {
          dailyMap.set(dayInTimezone, { trades: 0, wins: 0, losses: 0, sopFollowed: 0, pnl: 0 });
        }
        dailyMap.get(dayInTimezone)!.pnl += commission.profitLossUsd;
        totalPnl += commission.profitLossUsd;
      }
    });

    // Subtract withdrawals from the day they occurred — they reduce retained P&L.
    // withdrawalDate is a YYYY-MM-DD local date string (no timezone needed).
    const monthWithdrawals = await getAccountWithdrawals(userId, accountId);
    monthWithdrawals.forEach(w => {
      const [y, m, d] = w.withdrawalDate.split('-').map(Number);
      if (y === year && m === month) {
        if (!dailyMap.has(d)) {
          dailyMap.set(d, { trades: 0, wins: 0, losses: 0, sopFollowed: 0, pnl: 0 });
        }
        dailyMap.get(d)!.pnl -= w.withdrawalAmount;
        totalPnl -= w.withdrawalAmount;
      }
    });

    // Convert map to array of daily breakdowns
    const dailyBreakdown = Array.from(dailyMap.entries()).map(([day, data]) => ({
      date: new Date(year, month - 1, day), // Local date for display
      trades: data.trades,
      wins: data.wins,
      losses: data.losses,
      winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0,
      sopRate: data.trades > 0 ? (data.sopFollowed / data.trades) * 100 : 0,
      pnl: data.pnl,
    })).sort((a, b) => a.date.getDate() - b.date.getDate());

    return {
      year,
      month,
      monthName: MONTH_NAMES[month - 1],
      overview: {
        totalPnl,
        winRate: totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0,
        sopRate: totalTrades > 0 ? (totalSopFollowed / totalTrades) * 100 : 0,
        totalTrades,
        totalWins,
        totalLosses,
        winLossRecord: `W:${totalWins} L:${totalLosses}`,
      },
      dailyBreakdown,
      // Withdrawals in this month so the calendar can show markers.
      withdrawals: monthWithdrawals
        .filter(w => {
          const [y, m] = w.withdrawalDate.split('-').map(Number);
          return y === year && m === month;
        })
        .map(w => ({ date: w.withdrawalDate, amount: w.withdrawalAmount })),
    };
  } catch (error) {
    console.error('Error getting monthly performance:', error);
    throw new Error('Failed to retrieve monthly performance data');
  }
}

/**
 * Get available years with data for the user
 * Uses user's timezone to determine year boundaries
 */
export async function getAvailableYears(userId: string, timezone: string = 'Asia/Kuala_Lumpur', accountId?: string): Promise<number[]> {
  try {
    // Get all trades
    const conditions: any[] = [eq(individualTrades.userId, userId)];
    if (accountId) conditions.push(eq(individualTrades.tradingAccountId, accountId));

    const trades = await db
      .select({
        timestamp: individualTrades.tradeTimestamp,
      })
      .from(individualTrades)
      .where(and(...conditions));

    // Convert to user's timezone and extract unique years
    const years = new Set<number>();
    trades.forEach(trade => {
      // Use Intl.DateTimeFormat to properly extract year in user's timezone
      const formatter = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        timeZone: timezone
      });
      const year = parseInt(formatter.format(trade.timestamp));
      years.add(year);
    });

    // Also include years that have withdrawal events (withdrawalDate is YYYY-MM-DD local date)
    const withdrawals = await getAccountWithdrawals(userId, accountId);
    withdrawals.forEach(w => {
      years.add(parseInt(w.withdrawalDate.split('-')[0]));
    });

    // Sort descending (most recent first)
    return Array.from(years).sort((a, b) => b - a);
  } catch (error) {
    console.error('Error getting available years:', error);
    return [new Date().getFullYear()]; // Fallback to current year
  }
}
