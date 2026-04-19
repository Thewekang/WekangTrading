import { db } from '@/lib/db';
import { userRankings, individualTrades, users } from '@/lib/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';

// Minimum trades required to be included in rankings
const MIN_TRADES_FOR_RANKING = 10;

// Cache duration in milliseconds (1 hour)
const CACHE_DURATION = 60 * 60 * 1000;

/**
 * Get user's current ranking
 * Returns null if user doesn't meet minimum trade requirement
 */
export async function getUserRanking(userId: string, accountId?: string) {
  try {
    // Check if we have a recent cached ranking (within last hour)
    const rankingConditions: any[] = [eq(userRankings.userId, userId)];
    if (accountId) rankingConditions.push(eq(userRankings.tradingAccountId, accountId));

    const cachedRanking = await db
      .select()
      .from(userRankings)
      .where(and(...rankingConditions))
      .orderBy(desc(userRankings.calculatedAt))
      .limit(1);

    const now = new Date();
    if (
      cachedRanking.length > 0 &&
      now.getTime() - cachedRanking[0].calculatedAt.getTime() < CACHE_DURATION
    ) {
      return {
        rank: cachedRanking[0].rank,
        totalUsers: cachedRanking[0].totalUsers,
        winRate: cachedRanking[0].winRate,
        sopRate: cachedRanking[0].sopRate,
        totalPnl: cachedRanking[0].totalPnl,
        totalTrades: cachedRanking[0].totalTrades,
        percentile: cachedRanking[0].percentile,
        rankChange: cachedRanking[0].rankChange,
      };
    }

    // Calculate fresh rankings
    const rankings = await calculateAllRankings();
    const userRanking = rankings.find(r => r.userId === userId);

    if (!userRanking) {
      // User doesn't have enough trades
      const userTradeCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(individualTrades)
        .where(
          and(
            eq(individualTrades.userId, userId),
            eq(individualTrades.entryType, 'TRANSACTION')
          )
        );

      return {
        rank: null,
        totalUsers: rankings.length,
        winRate: 0,
        sopRate: 0,
        totalPnl: 0,
        totalTrades: userTradeCount[0]?.count || 0,
        percentile: 0,
        rankChange: 0,
        needMoreTrades: MIN_TRADES_FOR_RANKING - (userTradeCount[0]?.count || 0),
      };
    }

    return {
      rank: userRanking.rank,
      totalUsers: userRanking.totalUsers,
      winRate: userRanking.winRate,
      sopRate: userRanking.sopRate,
      totalPnl: userRanking.totalPnl,
      totalTrades: userRanking.totalTrades,
      percentile: userRanking.percentile,
      rankChange: userRanking.rankChange,
    };
  } catch (error) {
    console.error('Error getting user ranking:', error);
    throw new Error('Failed to retrieve user ranking');
  }
}

/**
 * Calculate rankings for all eligible users
 * Users must have at least MIN_TRADES_FOR_RANKING to be included
 */
export async function calculateAllRankings() {
  try {
    // Get all users with their trading statistics (TRANSACTION rows only for counts/rates)
    const userStats = await db
      .select({
        userId: users.id,
        totalTrades: sql<number>`count(case when ${individualTrades.entryType} = 'TRANSACTION' then 1 end)`,
        wins: sql<number>`sum(case when ${individualTrades.entryType} = 'TRANSACTION' and ${individualTrades.result} = 'WIN' then 1 else 0 end)`,
        sopFollowed: sql<number>`sum(case when ${individualTrades.entryType} = 'TRANSACTION' and ${individualTrades.sopFollowed} = 1 then 1 else 0 end)`,
        totalPnl: sql<number>`sum(${individualTrades.profitLossUsd})`,
      })
      .from(users)
      .leftJoin(individualTrades, eq(users.id, individualTrades.userId))
      .where(eq(users.role, 'USER'))
      .groupBy(users.id)
      .having(sql`count(case when ${individualTrades.entryType} = 'TRANSACTION' then 1 end) >= ${MIN_TRADES_FOR_RANKING}`);

    // Calculate rates and prepare for ranking
    const userDataWithRates = userStats.map(stat => ({
      userId: stat.userId,
      totalTrades: stat.totalTrades,
      winRate: stat.totalTrades > 0 ? (stat.wins / stat.totalTrades) * 100 : 0,
      sopRate: stat.totalTrades > 0 ? (stat.sopFollowed / stat.totalTrades) * 100 : 0,
      totalPnl: stat.totalPnl || 0,
    }));

    // Sort by: Win Rate (desc) -> SOP Rate (desc) -> Total P&L (desc)
    const sortedUsers = userDataWithRates.sort((a, b) => {
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      if (b.sopRate !== a.sopRate) return b.sopRate - a.sopRate;
      return b.totalPnl - a.totalPnl;
    });

    const totalUsers = sortedUsers.length;

    // Assign ranks and calculate percentiles
    const rankedUsers = sortedUsers.map((user, index) => {
      const rank = index + 1;
      const percentile = totalUsers > 1
        ? ((totalUsers - rank) / (totalUsers - 1)) * 100
        : 100;

      return {
        userId: user.userId,
        rank,
        totalUsers,
        winRate: user.winRate,
        sopRate: user.sopRate,
        totalPnl: user.totalPnl,
        totalTrades: user.totalTrades,
        percentile,
      };
    });

    // Get previous rankings to calculate rank changes
    const previousRankings = await db
      .select()
      .from(userRankings)
      .where(
        sql`${userRankings.calculatedAt} = (
          SELECT MAX(calculated_at) 
          FROM ${userRankings}
        )`
      );

    const previousRankMap = new Map(
      previousRankings.map(r => [r.userId, r.rank])
    );

    // Assign ranks and calculate percentiles with rank changes
    const rankedUsersWithChanges = rankedUsers.map(user => {
      const previousRank = previousRankMap.get(user.userId);
      const rankChange = previousRank
        ? previousRank - user.rank // Positive = improved, negative = dropped
        : 0;

      return {
        ...user,
        rankChange,
      };
    });

    // Save new rankings
    const now = new Date();
    for (const ranking of rankedUsersWithChanges) {
      await db.insert(userRankings).values({
        userId: ranking.userId,
        rank: ranking.rank,
        totalUsers: ranking.totalUsers,
        winRate: ranking.winRate,
        sopRate: ranking.sopRate,
        totalPnl: ranking.totalPnl,
        totalTrades: ranking.totalTrades,
        percentile: ranking.percentile,
        rankChange: ranking.rankChange,
        calculatedAt: now,
      });
    }

    return rankedUsersWithChanges;
  } catch (error) {
    console.error('Error calculating rankings:', error);
    throw new Error('Failed to calculate rankings');
  }
}

/**
 * Invalidate cached ranking for a user so it recalculates on next fetch.
 * Call this after any trade insert/update/delete.
 */
export async function invalidateUserRanking(userId: string) {
  try {
    await db.delete(userRankings).where(eq(userRankings.userId, userId));
  } catch (error) {
    console.error('Error invalidating user ranking cache:', error);
  }
}

/**
 * Background job to update all rankings
 * Should be called periodically (e.g., hourly)
 */
export async function updateRankings() {
  try {
    console.log('[Ranking Service] Starting ranking update...');
    const rankings = await calculateAllRankings();
    console.log(`[Ranking Service] Updated rankings for ${rankings.length} users`);
    return { success: true, usersRanked: rankings.length };
  } catch (error) {
    console.error('[Ranking Service] Failed to update rankings:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
