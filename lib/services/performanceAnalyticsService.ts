import { db } from '@/lib/db';
import { dailySummaries, individualTrades } from '@/lib/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

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

    // Get all trades for the year and convert to user's timezone for month extraction
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
      const dateInTimezone = new Date(trade.timestamp.toLocaleString('en-US', { timeZone: timezone }));
      const month = dateInTimezone.getMonth() + 1; // 1-12
      
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
 */
export async function getMonthlyPerformance(userId: string, year: number, month: number, timezone: string = 'Asia/Kuala_Lumpur') {
  try {
    // Create start and end dates for the month in UTC
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)); // Last day of month

    // Get daily summaries for the month
    const dailyData = await db
      .select()
      .from(dailySummaries)
      .where(
        and(
          eq(dailySummaries.userId, userId),
          gte(dailySummaries.tradeDate, startDate),
          lte(dailySummaries.tradeDate, endDate)
        )
      )
      .orderBy(dailySummaries.tradeDate);

    // Calculate totals
    let totalTrades = 0;
    let totalWins = 0;
    let totalSopFollowed = 0;
    let totalPnl = 0;

    dailyData.forEach(day => {
      totalTrades += day.totalTrades;
      totalWins += day.totalWins;
      totalSopFollowed += day.totalSopFollowed;
      totalPnl += day.totalProfitLossUsd;
    });

    const totalLosses = totalTrades - totalWins;

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
      dailyBreakdown: dailyData.map(day => {
        // Convert UTC date to user's timezone for display
        const dateInTimezone = new Date(day.tradeDate.toLocaleString('en-US', { timeZone: timezone }));
        return {
          date: dateInTimezone,
          trades: day.totalTrades,
          wins: day.totalWins,
          losses: day.totalLosses,
          winRate: day.totalTrades > 0 ? (day.totalWins / day.totalTrades) * 100 : 0,
          sopRate: day.totalTrades > 0 ? (day.totalSopFollowed / day.totalTrades) * 100 : 0,
          pnl: day.totalProfitLossUsd,
        };
      }),
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
      const dateInTimezone = new Date(trade.timestamp.toLocaleString('en-US', { timeZone: timezone }));
      years.add(dateInTimezone.getFullYear());
    });

    // Sort descending (most recent first)
    return Array.from(years).sort((a, b) => b - a);
  } catch (error) {
    console.error('Error getting available years:', error);
    return [new Date().getFullYear()]; // Fallback to current year
  }
}
