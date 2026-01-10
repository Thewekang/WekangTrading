/**
 * Admin Statistics Service
 * Business logic for admin-level statistics and user comparisons
 */

import { prisma } from '@/lib/db';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export interface UserStats {
  userId: string;
  userName: string;
  userEmail: string;
  totalTrades: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  sopRate: number;
  totalSopFollowed: number;
  netProfitLoss: number;
  avgProfitPerTrade: number;
  bestSession: string | null;
  bestSop: string | null;
  bestSopWinRate: number;
  lastTradeDate: Date | null;
  rank?: number;
}

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsersThisMonth: number;
  totalTradesAllTime: number;
  totalTradesThisMonth: number;
  avgWinRateAllUsers: number;
  avgSopRateAllUsers: number;
  totalProfitLossAllUsers: number;
  topPerformers: UserStats[];
  recentActivity: {
    date: string;
    totalTrades: number;
    activeUsers: number;
  }[];
}

/**
 * Get statistics for a specific user (admin view)
 */
export async function getUserStats(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<UserStats> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Build date filter
  const dateFilter: any = {};
  if (startDate) dateFilter.gte = startDate;
  if (endDate) dateFilter.lte = endDate;

  // Get trades
  const trades = await prisma.individualTrade.findMany({
    where: {
      userId,
      ...(Object.keys(dateFilter).length > 0 && { tradeTimestamp: dateFilter }),
    },
    select: {
      result: true,
      sopFollowed: true,
      profitLossUsd: true,
      marketSession: true,
      tradeTimestamp: true,
      sopTypeId: true,
      sopType: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { tradeTimestamp: 'desc' },
  });

  const totalTrades = trades.length;
  const totalWins = trades.filter(t => t.result === 'WIN').length;
  const totalLosses = trades.filter(t => t.result === 'LOSS').length;
  const totalSopFollowed = trades.filter(t => t.sopFollowed).length;
  const netProfitLoss = trades.reduce((sum, t) => sum + t.profitLossUsd, 0);

  const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
  const sopRate = totalTrades > 0 ? (totalSopFollowed / totalTrades) * 100 : 0;
  const avgProfitPerTrade = totalTrades > 0 ? netProfitLoss / totalTrades : 0;

  // Calculate best session
  let bestSession: string | null = null;
  if (totalTrades > 0) {
    const sessionStats = new Map<string, { wins: number; total: number }>();
    trades.forEach(trade => {
      const session = trade.marketSession;
      if (!sessionStats.has(session)) {
        sessionStats.set(session, { wins: 0, total: 0 });
      }
      const stats = sessionStats.get(session)!;
      stats.total++;
      if (trade.result === 'WIN') stats.wins++;
    });

    let bestWinRate = 0;
    sessionStats.forEach((stats, session) => {
      const winRate = stats.total > 0 ? (stats.wins / stats.total) * 100 : 0;
      if (winRate > bestWinRate) {
        bestWinRate = winRate;
        bestSession = session;
      }
    });
  }

  // Calculate best SOP type
  let bestSop: string | null = null;
  let bestSopWinRate = 0;
  if (totalTrades > 0) {
    const sopStats = new Map<string, { wins: number; total: number }>();
    trades.forEach(trade => {
      const sopName = trade.sopType?.name || 'Others';
      if (!sopStats.has(sopName)) {
        sopStats.set(sopName, { wins: 0, total: 0 });
      }
      const stats = sopStats.get(sopName)!;
      stats.total++;
      if (trade.result === 'WIN') stats.wins++;
    });

    sopStats.forEach((stats, sopName) => {
      // Minimum 3 trades to be considered
      if (stats.total >= 3) {
        const winRate = (stats.wins / stats.total) * 100;
        if (winRate > bestSopWinRate) {
          bestSopWinRate = winRate;
          bestSop = sopName;
        }
      }
    });
  }

  return {
    userId,
    userName: user.name || 'Unknown',
    userEmail: user.email,
    totalTrades,
    totalWins,
    totalLosses,
    winRate: Math.round(winRate * 10) / 10,
    sopRate: Math.round(sopRate * 10) / 10,
    totalSopFollowed,
    netProfitLoss: Math.round(netProfitLoss * 100) / 100,
    avgProfitPerTrade: Math.round(avgProfitPerTrade * 100) / 100,
    bestSession,
    bestSop,
    bestSopWinRate: Math.round(bestSopWinRate * 10) / 10,
    lastTradeDate: trades.length > 0 ? trades[0].tradeTimestamp : null,
  };
}

/**
 * Get all users with their statistics
 */
export async function getAllUsersStats(
  startDate?: Date,
  endDate?: Date
): Promise<UserStats[]> {
  const users = await prisma.user.findMany({
    where: { role: 'USER' }, // Only get regular users, not admins
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });

  const usersStats = await Promise.all(
    users.map(user => getUserStats(user.id, startDate, endDate))
  );

  // Calculate rankings based on win rate (primary), then SOP rate (secondary)
  const sorted = [...usersStats].sort((a, b) => {
    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
    return b.sopRate - a.sopRate;
  });

  // Assign ranks
  sorted.forEach((user, index) => {
    user.rank = index + 1;
  });

  return sorted;
}

/**
 * Get admin dashboard statistics
 */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  // Total users (excluding admins)
  const totalUsers = await prisma.user.count({
    where: { role: 'USER' },
  });

  // Active users this month (users who traded)
  const activeUsersThisMonth = await prisma.individualTrade.groupBy({
    by: ['userId'],
    where: {
      tradeTimestamp: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
  });

  // Total trades all time
  const totalTradesAllTime = await prisma.individualTrade.count();

  // Total trades this month
  const totalTradesThisMonth = await prisma.individualTrade.count({
    where: {
      tradeTimestamp: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
  });

  // Get all users stats for calculations
  const allUsersStats = await getAllUsersStats();

  const avgWinRateAllUsers = allUsersStats.length > 0
    ? allUsersStats.reduce((sum, u) => sum + u.winRate, 0) / allUsersStats.length
    : 0;

  const avgSopRateAllUsers = allUsersStats.length > 0
    ? allUsersStats.reduce((sum, u) => sum + u.sopRate, 0) / allUsersStats.length
    : 0;

  const totalProfitLossAllUsers = allUsersStats.reduce(
    (sum, u) => sum + u.netProfitLoss,
    0
  );

  // Top 5 performers
  const topPerformers = allUsersStats.slice(0, 5);

  // Recent activity (last 30 days)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const dailySummaries = await prisma.dailySummary.findMany({
    where: {
      tradeDate: {
        gte: thirtyDaysAgo,
        lte: now,
      },
    },
    select: {
      tradeDate: true,
      totalTrades: true,
      userId: true,
    },
    orderBy: { tradeDate: 'asc' },
  });

  // Group by date
  const activityByDate = new Map<string, { totalTrades: number; userIds: Set<string> }>();
  dailySummaries.forEach(summary => {
    const dateKey = format(new Date(summary.tradeDate), 'yyyy-MM-dd');
    if (!activityByDate.has(dateKey)) {
      activityByDate.set(dateKey, { totalTrades: 0, userIds: new Set() });
    }
    const activity = activityByDate.get(dateKey)!;
    activity.totalTrades += summary.totalTrades;
    activity.userIds.add(summary.userId);
  });

  const recentActivity = Array.from(activityByDate.entries()).map(([date, data]) => ({
    date,
    totalTrades: data.totalTrades,
    activeUsers: data.userIds.size,
  }));

  return {
    totalUsers,
    activeUsersThisMonth: activeUsersThisMonth.length,
    totalTradesAllTime,
    totalTradesThisMonth,
    avgWinRateAllUsers: Math.round(avgWinRateAllUsers * 10) / 10,
    avgSopRateAllUsers: Math.round(avgSopRateAllUsers * 10) / 10,
    totalProfitLossAllUsers: Math.round(totalProfitLossAllUsers * 100) / 100,
    topPerformers,
    recentActivity,
  };
}

/**
 * Get user comparison data for charts
 */
export interface UserComparison {
  userId: string;
  userName: string;
  winRate: number;
  sopRate: number;
  profitLoss: number;
  totalTrades: number;
}

export async function getUsersComparison(
  startDate?: Date,
  endDate?: Date
): Promise<UserComparison[]> {
  const usersStats = await getAllUsersStats(startDate, endDate);

  return usersStats
    .filter(u => u.totalTrades > 0) // Only include users with trades
    .map(u => ({
      userId: u.userId,
      userName: u.userName,
      winRate: u.winRate,
      sopRate: u.sopRate,
      profitLoss: u.netProfitLoss,
      totalTrades: u.totalTrades,
    }));
}
