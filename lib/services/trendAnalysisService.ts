/**
 * Trend Analysis Service
 * Business logic for performance trends, comparisons, and moving averages
 */

import { db } from '@/lib/db';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths, subDays, format } from 'date-fns';

export interface DailyTrend {
  date: string;
  winRate: number;
  sopRate: number;
  profitLoss: number;
  totalTrades: number;
  totalWins: number;
  totalSopFollowed: number;
}

export interface ComparisonData {
  current: {
    period: string;
    winRate: number;
    sopRate: number;
    profitLoss: number;
    totalTrades: number;
  };
  previous: {
    period: string;
    winRate: number;
    sopRate: number;
    profitLoss: number;
    totalTrades: number;
  };
  changes: {
    winRate: number;
    sopRate: number;
    profitLoss: number;
    totalTrades: number;
  };
}

export interface TrendIndicator {
  metric: 'winRate' | 'sopRate' | 'profitLoss';
  direction: 'improving' | 'declining' | 'stable';
  changePercent: number;
  trend7Day: number;
  trend30Day: number;
}

export interface MovingAverageData {
  date: string;
  value: number;
  ma7: number | null;
  ma30: number | null;
}

/**
 * Get daily performance trends for a date range
 */
export async function getDailyTrends(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<DailyTrend[]> {
  const summaries = await db.dailySummary.findMany({
    where: {
      userId,
      tradeDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      tradeDate: 'asc',
    },
  });

  return summaries.map(summary => {
    const winRate = summary.totalTrades > 0 
      ? (summary.totalWins / summary.totalTrades) * 100 
      : 0;
    const sopRate = summary.totalTrades > 0 
      ? (summary.totalSopFollowed / summary.totalTrades) * 100 
      : 0;

    return {
      date: format(new Date(summary.tradeDate), 'yyyy-MM-dd'),
      winRate: Math.round(winRate * 10) / 10,
      sopRate: Math.round(sopRate * 10) / 10,
      profitLoss: Math.round(summary.totalProfitLossUsd * 100) / 100,
      totalTrades: summary.totalTrades,
      totalWins: summary.totalWins,
      totalSopFollowed: summary.totalSopFollowed,
    };
  });
}

/**
 * Compare current week vs previous week
 */
export async function getWeeklyComparison(userId: string): Promise<ComparisonData> {
  const now = new Date();
  const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const currentWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const previousWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const previousWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

  const [currentWeekData, previousWeekData] = await Promise.all([
    getPeriodStats(userId, currentWeekStart, currentWeekEnd),
    getPeriodStats(userId, previousWeekStart, previousWeekEnd),
  ]);

  return {
    current: {
      period: `${format(currentWeekStart, 'MMM d')} - ${format(currentWeekEnd, 'MMM d')}`,
      ...currentWeekData,
    },
    previous: {
      period: `${format(previousWeekStart, 'MMM d')} - ${format(previousWeekEnd, 'MMM d')}`,
      ...previousWeekData,
    },
    changes: {
      winRate: currentWeekData.winRate - previousWeekData.winRate,
      sopRate: currentWeekData.sopRate - previousWeekData.sopRate,
      profitLoss: currentWeekData.profitLoss - previousWeekData.profitLoss,
      totalTrades: currentWeekData.totalTrades - previousWeekData.totalTrades,
    },
  };
}

/**
 * Compare current month vs previous month
 */
export async function getMonthlyComparison(userId: string): Promise<ComparisonData> {
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);
  const previousMonthStart = startOfMonth(subMonths(now, 1));
  const previousMonthEnd = endOfMonth(subMonths(now, 1));

  const [currentMonthData, previousMonthData] = await Promise.all([
    getPeriodStats(userId, currentMonthStart, currentMonthEnd),
    getPeriodStats(userId, previousMonthStart, previousMonthEnd),
  ]);

  return {
    current: {
      period: format(currentMonthStart, 'MMMM yyyy'),
      ...currentMonthData,
    },
    previous: {
      period: format(previousMonthStart, 'MMMM yyyy'),
      ...previousMonthData,
    },
    changes: {
      winRate: currentMonthData.winRate - previousMonthData.winRate,
      sopRate: currentMonthData.sopRate - previousMonthData.sopRate,
      profitLoss: currentMonthData.profitLoss - previousMonthData.profitLoss,
      totalTrades: currentMonthData.totalTrades - previousMonthData.totalTrades,
    },
  };
}

/**
 * Get aggregate stats for a period
 */
async function getPeriodStats(userId: string, startDate: Date, endDate: Date) {
  const summaries = await db.dailySummary.findMany({
    where: {
      userId,
      tradeDate: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const totalTrades = summaries.reduce((sum, s) => sum + s.totalTrades, 0);
  const totalWins = summaries.reduce((sum, s) => sum + s.totalWins, 0);
  const totalSopFollowed = summaries.reduce((sum, s) => sum + s.totalSopFollowed, 0);
  const profitLoss = summaries.reduce((sum, s) => sum + s.totalProfitLossUsd, 0);

  const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
  const sopRate = totalTrades > 0 ? (totalSopFollowed / totalTrades) * 100 : 0;

  return {
    winRate: Math.round(winRate * 10) / 10,
    sopRate: Math.round(sopRate * 10) / 10,
    profitLoss: Math.round(profitLoss * 100) / 100,
    totalTrades,
  };
}

/**
 * Calculate moving averages for a metric
 */
export function calculateMovingAverages(
  data: DailyTrend[],
  metric: 'winRate' | 'sopRate' | 'profitLoss'
): MovingAverageData[] {
  return data.map((item, index) => {
    // Calculate 7-day moving average
    let ma7: number | null = null;
    if (index >= 6) {
      const last7 = data.slice(index - 6, index + 1);
      const sum7 = last7.reduce((sum, d) => sum + d[metric], 0);
      ma7 = Math.round((sum7 / 7) * 10) / 10;
    }

    // Calculate 30-day moving average
    let ma30: number | null = null;
    if (index >= 29) {
      const last30 = data.slice(index - 29, index + 1);
      const sum30 = last30.reduce((sum, d) => sum + d[metric], 0);
      ma30 = Math.round((sum30 / 30) * 10) / 10;
    }

    return {
      date: item.date,
      value: item[metric],
      ma7,
      ma30,
    };
  });
}

/**
 * Get trend indicators for key metrics
 */
export async function getTrendIndicators(userId: string): Promise<TrendIndicator[]> {
  const now = new Date();
  const last7Days = subDays(now, 7);
  const last30Days = subDays(now, 30);
  const previous7Days = subDays(now, 14);
  const previous30Days = subDays(now, 60);

  const [current7, current30, previous7, previous30] = await Promise.all([
    getPeriodStats(userId, last7Days, now),
    getPeriodStats(userId, last30Days, now),
    getPeriodStats(userId, previous7Days, last7Days),
    getPeriodStats(userId, previous30Days, last30Days),
  ]);

  const indicators: TrendIndicator[] = [];

  // Win Rate Trend
  const winRateChange7 = current7.winRate - previous7.winRate;
  const winRateChange30 = current30.winRate - previous30.winRate;
  indicators.push({
    metric: 'winRate',
    direction: winRateChange30 > 1 ? 'improving' : winRateChange30 < -1 ? 'declining' : 'stable',
    changePercent: Math.round(winRateChange30 * 10) / 10,
    trend7Day: Math.round(winRateChange7 * 10) / 10,
    trend30Day: Math.round(winRateChange30 * 10) / 10,
  });

  // SOP Rate Trend
  const sopRateChange7 = current7.sopRate - previous7.sopRate;
  const sopRateChange30 = current30.sopRate - previous30.sopRate;
  indicators.push({
    metric: 'sopRate',
    direction: sopRateChange30 > 1 ? 'improving' : sopRateChange30 < -1 ? 'declining' : 'stable',
    changePercent: Math.round(sopRateChange30 * 10) / 10,
    trend7Day: Math.round(sopRateChange7 * 10) / 10,
    trend30Day: Math.round(sopRateChange30 * 10) / 10,
  });

  // Profit/Loss Trend
  const profitChange7 = current7.profitLoss - previous7.profitLoss;
  const profitChange30 = current30.profitLoss - previous30.profitLoss;
  const profitChangePercent = previous30.profitLoss !== 0 
    ? ((current30.profitLoss - previous30.profitLoss) / Math.abs(previous30.profitLoss)) * 100 
    : 0;
  indicators.push({
    metric: 'profitLoss',
    direction: profitChange30 > 100 ? 'improving' : profitChange30 < -100 ? 'declining' : 'stable',
    changePercent: Math.round(profitChangePercent * 10) / 10,
    trend7Day: Math.round(profitChange7 * 100) / 100,
    trend30Day: Math.round(profitChange30 * 100) / 100,
  });

  return indicators;
}
