import { prisma } from '@/lib/db';

/**
 * Get all active SOP types
 */
export async function getActiveSopTypes() {
  return await prisma.sopType.findMany({
    where: { active: true },
    orderBy: [
      { sortOrder: 'asc' },
      { name: 'asc' }
    ]
  });
}

/**
 * Get all SOP types (including inactive) - Admin only
 */
export async function getAllSopTypes() {
  return await prisma.sopType.findMany({
    orderBy: [
      { sortOrder: 'asc' },
      { name: 'asc' }
    ]
  });
}

/**
 * Create new SOP type
 */
export async function createSopType(data: {
  name: string;
  description?: string;
  sortOrder?: number;
}) {
  // Check if name already exists
  const existing = await prisma.sopType.findUnique({
    where: { name: data.name }
  });

  if (existing) {
    throw new Error('SOP type with this name already exists');
  }

  return await prisma.sopType.create({
    data: {
      name: data.name,
      description: data.description,
      sortOrder: data.sortOrder ?? 0,
      active: true
    }
  });
}

/**
 * Update SOP type
 */
export async function updateSopType(
  id: string,
  data: {
    name?: string;
    description?: string;
    sortOrder?: number;
    active?: boolean;
  }
) {
  // If updating name, check for duplicates
  if (data.name) {
    const existing = await prisma.sopType.findFirst({
      where: {
        name: data.name,
        id: { not: id }
      }
    });

    if (existing) {
      throw new Error('SOP type with this name already exists');
    }
  }

  return await prisma.sopType.update({
    where: { id },
    data
  });
}

/**
 * Delete SOP type
 */
export async function deleteSopType(id: string) {
  // Check if any trades use this SOP type
  const tradesCount = await prisma.individualTrade.count({
    where: { sopTypeId: id }
  });

  if (tradesCount > 0) {
    throw new Error(`Cannot delete SOP type: ${tradesCount} trades are using it. Deactivate instead.`);
  }

  return await prisma.sopType.delete({
    where: { id }
  });
}

/**
 * Get SOP performance statistics for a user
 */
export async function getSopPerformanceStats(
  userId: string,
  period: 'week' | 'month' | 'year' | 'all' = 'month'
) {
  const dateFilter = getDateFilter(period);

  const trades = await prisma.individualTrade.findMany({
    where: {
      userId,
      tradeTimestamp: dateFilter,
      sopTypeId: { not: null }
    },
    include: {
      sopType: true
    }
  });

  // Group by SOP type
  const sopStats = new Map<string, {
    sopTypeId: string;
    sopTypeName: string;
    totalTrades: number;
    wins: number;
    losses: number;
    winRate: number;
    totalProfitLoss: number;
  }>();

  trades.forEach(trade => {
    if (!trade.sopType) return;

    const existing = sopStats.get(trade.sopTypeId!) || {
      sopTypeId: trade.sopTypeId!,
      sopTypeName: trade.sopType.name,
      totalTrades: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      totalProfitLoss: 0
    };

    existing.totalTrades++;
    if (trade.result === 'WIN') existing.wins++;
    else existing.losses++;
    existing.totalProfitLoss += trade.profitLossUsd;

    sopStats.set(trade.sopTypeId!, existing);
  });

  // Calculate win rates and sort by win rate
  const stats = Array.from(sopStats.values()).map(stat => ({
    ...stat,
    winRate: stat.totalTrades > 0 ? (stat.wins / stat.totalTrades) * 100 : 0
  })).sort((a, b) => b.winRate - a.winRate);

  return stats;
}

/**
 * Get best performing SOP type
 */
export async function getBestSopType(
  userId: string,
  period: 'week' | 'month' | 'year' | 'all' = 'month'
) {
  const stats = await getSopPerformanceStats(userId, period);
  
  if (stats.length === 0) {
    return null;
  }

  return stats[0]; // Already sorted by win rate descending
}

// Helper function
function getDateFilter(period: 'week' | 'month' | 'year' | 'all') {
  const now = new Date();
  
  switch (period) {
    case 'week': {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return { gte: weekAgo };
    }
    case 'month': {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return { gte: monthAgo };
    }
    case 'year': {
      const yearAgo = new Date(now);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      return { gte: yearAgo };
    }
    case 'all':
    default:
      return undefined;
  }
}
