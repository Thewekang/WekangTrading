import { db } from '@/lib/db';
import { individualTrades } from '@/lib/db/schema';
import { eq, and, gte, lte, count } from 'drizzle-orm';

/**
 * Check if user has reached daily loss limit (2 losses per day)
 * Returns the count of losses today and whether limit is reached
 */
export async function checkDailyLosses(userId: string): Promise<{
  lossesToday: number;
  limitReached: boolean;
  remainingLosses: number;
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  // Count losses for today
  const [result] = await db
    .select({ count: count() })
    .from(individualTrades)
    .where(
      and(
        eq(individualTrades.userId, userId),
        gte(individualTrades.tradeTimestamp, today),
        lte(individualTrades.tradeTimestamp, endOfDay),
        eq(individualTrades.result, 'LOSS')
      )
    );

  const lossCount = result?.count || 0;
  const DAILY_LOSS_LIMIT = 2;
  
  return {
    lossesToday: lossCount,
    limitReached: lossCount >= DAILY_LOSS_LIMIT,
    remainingLosses: Math.max(0, DAILY_LOSS_LIMIT - lossCount)
  };
}

/**
 * Get today's trade results for display
 */
export async function getTodayTradeResults(userId: string): Promise<{
  wins: number;
  losses: number;
  total: number;
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const [winsResult, lossesResult] = await Promise.all([
    db.select({ count: count() }).from(individualTrades).where(
      and(
        eq(individualTrades.userId, userId),
        gte(individualTrades.tradeTimestamp, today),
        lte(individualTrades.tradeTimestamp, endOfDay),
        eq(individualTrades.result, 'WIN')
      )
    ),
    db.select({ count: count() }).from(individualTrades).where(
      and(
        eq(individualTrades.userId, userId),
        gte(individualTrades.tradeTimestamp, today),
        lte(individualTrades.tradeTimestamp, endOfDay),
        eq(individualTrades.result, 'LOSS')
      )
    )
  ]);

  const wins = winsResult[0]?.count || 0;
  const losses = lossesResult[0]?.count || 0;

  return {
    wins,
    losses,
    total: wins + losses
  };
}
