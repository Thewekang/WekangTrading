import { db } from '@/lib/db';
import { sopTypes, individualTrades } from '@/lib/db/schema';
import { eq, ne, and, gte, count, isNotNull } from 'drizzle-orm';
import { asc } from 'drizzle-orm';

/**
 * Get all active SOP types
 */
export async function getActiveSopTypes() {
  return await db
    .select()
    .from(sopTypes)
    .where(eq(sopTypes.active, true))
    .orderBy(asc(sopTypes.sortOrder), asc(sopTypes.name));
}

/**
 * Get all SOP types (including inactive) - Admin only
 */
export async function getAllSopTypes() {
  return await db
    .select()
    .from(sopTypes)
    .orderBy(asc(sopTypes.sortOrder), asc(sopTypes.name));
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
  const [existing] = await db
    .select()
    .from(sopTypes)
    .where(eq(sopTypes.name, data.name))
    .limit(1);

  if (existing) {
    throw new Error('SOP type with this name already exists');
  }

  const [newSopType] = await db
    .insert(sopTypes)
    .values({
      name: data.name,
      description: data.description,
      sortOrder: data.sortOrder ?? 0,
      active: true
    })
    .returning();

  return newSopType;
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
    const [existing] = await db
      .select()
      .from(sopTypes)
      .where(
        and(
          eq(sopTypes.name, data.name),
          ne(sopTypes.id, id)
        )
      )
      .limit(1);

    if (existing) {
      throw new Error('SOP type with this name already exists');
    }
  }

  const [updated] = await db
    .update(sopTypes)
    .set({
      ...data,
      updatedAt: new Date()
    })
    .where(eq(sopTypes.id, id))
    .returning();

  return updated;
}

/**
 * Delete SOP type
 */
export async function deleteSopType(id: string) {
  // Check if any trades use this SOP type
  const [result] = await db
    .select({ count: count() })
    .from(individualTrades)
    .where(eq(individualTrades.sopTypeId, id));

  const tradesCount = result?.count || 0;

  if (tradesCount > 0) {
    throw new Error(`Cannot delete SOP type: ${tradesCount} trades are using it. Deactivate instead.`);
  }

  await db
    .delete(sopTypes)
    .where(eq(sopTypes.id, id));
}

/**
 * Get SOP performance statistics for a user
 */
export async function getSopPerformanceStats(
  userId: string,
  period: 'week' | 'month' | 'year' | 'all' = 'month'
) {
  const dateFilter = getDateFilter(period);
  const conditions = [eq(individualTrades.userId, userId), isNotNull(individualTrades.sopTypeId)];
  if (dateFilter) {
    conditions.push(gte(individualTrades.tradeTimestamp, new Date(dateFilter)));
  }

  const trades = await db
    .select({
      sopTypeId: individualTrades.sopTypeId,
      result: individualTrades.result,
      profitLossUsd: individualTrades.profitLossUsd,
      sopTypeName: sopTypes.name
    })
    .from(individualTrades)
    .leftJoin(sopTypes, eq(individualTrades.sopTypeId, sopTypes.id))
    .where(and(...conditions));

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
    if (!trade.sopTypeId || !trade.sopTypeName) return;

    const existing = sopStats.get(trade.sopTypeId) || {
      sopTypeId: trade.sopTypeId,
      sopTypeName: trade.sopTypeName,
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
function getDateFilter(period: 'week' | 'month' | 'year' | 'all'): number | undefined {
  const now = new Date();
  
  switch (period) {
    case 'week': {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return Math.floor(weekAgo.getTime() / 1000);
    }
    case 'month': {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return Math.floor(monthAgo.getTime() / 1000);
    }
    case 'year': {
      const yearAgo = new Date(now);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      return Math.floor(yearAgo.getTime() / 1000);
    }
    case 'all':
    default:
      return undefined;
  }
}
