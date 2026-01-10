import { prisma } from '@/lib/db';

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
  const lossCount = await prisma.individualTrade.count({
    where: {
      userId,
      tradeTimestamp: {
        gte: today,
        lte: endOfDay
      },
      result: 'LOSS'
    }
  });

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

  const [wins, losses] = await Promise.all([
    prisma.individualTrade.count({
      where: {
        userId,
        tradeTimestamp: { gte: today, lte: endOfDay },
        result: 'WIN'
      }
    }),
    prisma.individualTrade.count({
      where: {
        userId,
        tradeTimestamp: { gte: today, lte: endOfDay },
        result: 'LOSS'
      }
    })
  ]);

  return {
    wins,
    losses,
    total: wins + losses
  };
}
