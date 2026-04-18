import { db } from '@/lib/db';
import { dailySummaries, individualTrades } from '@/lib/db/schema';
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
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Get performance data for a specific year
 * Returns overview and monthly breakdown
 * Converts UTC timestamps to user's timezone for month grouping
 */
export async function getYearlyPerformance(userId: string, year: number, timezone: string = 'Asia/Kuala_Lumpur'): Promise<YearlyPerformanceData> {
  try {
    // Create start and end dates for the year in user's timezone
    // Convert to UTC for database query
    const startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0)); // Jan 1, 00:00:00 UTC
    const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)); // Dec 31, 23:59:59 UTC

    // Get TRANSACTION trades only (exclude COMMISSION entries from win/SOP/trade counts)
    const yearTrades = await db
      .select({
        timestamp: individualTrades.tradeTimestamp,
        result: individualTrades.result,
        sopFollowed: individualTrades.sopFollowed,
        profitLossUsd: individualTrades.profitLossUsd,
      })
      .from(individualTrades)
      .where(
        and(
          eq(individualTrades.userId, userId),
          eq(individualTrades.entryType, TRANSACTION),
          gte(individualTrades.tradeTimestamp, startDate),
          lte(individualTrades.tradeTimestamp, endDate)
        )
      );

    // Initialize monthly data
    const monthlyData: { [key: number]: { trades: number; wins: number; sopFollowed: number; pnl: number } } = {};
    for (let i = 1; i <= 12; i++) {
      monthlyData[i] = { trades: 0, wins: 0, sopFollowed: 0, pnl: 0 };
    }

    // Aggregate trades by month
    let totalTrades = 0;
    let totalWins = 0;
    let totalSopFollowed = 0;
    let totalPnl = 0;

    yearTrades.forEach(trade => {
      // Convert UTC timestamp to user's timezone to get correct month
      // Use Intl.DateTimeFormat to properly extract month in user's timezone
      const formatter = new Intl.DateTimeFormat('en-US', {
        month: 'numeric',
        timeZone: timezone
      });
      const month = parseInt(formatter.format(trade.timestamp));
      
      monthlyData[month].trades++;
      monthlyData[month].pnl += trade.profitLossUsd;
      totalTrades++;
      totalPnl += trade.profitLossUsd;

      if (trade.result === 'WIN') {
        monthlyData[month].wins++;
        totalWins++;
      }

      if (trade.sopFollowed) {
        monthlyData[month].sopFollowed++;
        totalSopFollowed++;
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
        losses: data.trades - data.wins,
        hasData,
      });
    }

    // Build overview
    const totalLosses = totalTrades - totalWins;
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
export async function getMonthlyPerformance(userId: string, year: number, month: number, timezone: string = 'Asia/Kuala_Lumpur') {
  try {
    // Create start and end dates for the month with buffer for timezone offset
    // Start from 2 days before to catch timezone edge cases
    const startDate = new Date(Date.UTC(year, month - 1, -1, 0, 0, 0, 0)); // 2 days before month start
    const endDate = new Date(Date.UTC(year, month, 2, 23, 59, 59, 999)); // 2 days after month end

    // Get TRANSACTION trades only (exclude COMMISSION entries from win/SOP/trade counts)
    const trades = await db
      .select({
        timestamp: individualTrades.tradeTimestamp,
        result: individualTrades.result,
        sopFollowed: individualTrades.sopFollowed,
        profitLossUsd: individualTrades.profitLossUsd,
      })
      .from(individualTrades)
      .where(
        and(
          eq(individualTrades.userId, userId),
          eq(individualTrades.entryType, TRANSACTION),
          gte(individualTrades.tradeTimestamp, startDate),
          lte(individualTrades.tradeTimestamp, endDate)
        )
      )
      .orderBy(individualTrades.tradeTimestamp);

    // Group trades by day in user's timezone
    const dailyMap = new Map<number, {
      trades: number;
      wins: number;
      sopFollowed: number;
      pnl: number;
    }>();

    let totalTrades = 0;
    let totalWins = 0;
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
          dailyMap.set(dayInTimezone, { trades: 0, wins: 0, sopFollowed: 0, pnl: 0 });
        }

        const dayData = dailyMap.get(dayInTimezone)!;
        dayData.trades++;
        dayData.pnl += trade.profitLossUsd;
        totalTrades++;
        totalPnl += trade.profitLossUsd;

        if (trade.result === 'WIN') {
          dayData.wins++;
          totalWins++;
        }

        if (trade.sopFollowed) {
          dayData.sopFollowed++;
          totalSopFollowed++;
        }
      }
    });

    const totalLosses = totalTrades - totalWins;

    // Convert map to array of daily breakdowns
    const dailyBreakdown = Array.from(dailyMap.entries()).map(([day, data]) => ({
      date: new Date(year, month - 1, day), // Local date for display
      trades: data.trades,
      wins: data.wins,
      losses: data.trades - data.wins,
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
export async function getAvailableYears(userId: string, timezone: string = 'Asia/Kuala_Lumpur'): Promise<number[]> {
  try {
    // Get all trades
    const trades = await db
      .select({
        timestamp: individualTrades.tradeTimestamp,
      })
      .from(individualTrades)
      .where(eq(individualTrades.userId, userId));

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

    // Sort descending (most recent first)
    return Array.from(years).sort((a, b) => b - a);
  } catch (error) {
    console.error('Error getting available years:', error);
    return [new Date().getFullYear()]; // Fallback to current year
  }
}
