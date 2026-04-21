/**
 * Badge Service - Core functions for badge awarding and progress tracking
 */

import { db } from '@/lib/db';
import { badges, userBadges, userStats, motivationalMessages, type Badge, type UserBadge, type UserStats } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { notifyBadgeUnlock } from './notificationService';

/**
 * Badge requirement types
 */
export interface BadgeRequirement {
  type: 'TOTAL_TRADES' | 'WIN_STREAK' | 'LOG_STREAK' | 'SOP_STREAK' | 'SOP_RATE' | 
        'WIN_RATE' | 'PROFIT_TOTAL' | 'SESSION_TRADES' | 'TARGET_COMPLETED' | 
        'PERFECT_MONTH' | 'COMEBACK' | 'MAX_TRADES_DAY' | 'TOTAL_LOGGING_DAYS' | 'EARLY_ADOPTER';
  value?: number;
  minTrades?: number;
  minPeriod?: number;
  sessionType?: 'ASIA' | 'EUROPE' | 'US';
  losingDays?: number;
  registrationDate?: string;
}

/**
 * Badge trigger types - when to check for badges
 */
export type BadgeTrigger = 'TRADE_INSERT' | 'DAILY_SUMMARY' | 'TARGET_COMPLETE' | 'STREAK_UPDATE' | 'MANUAL';

/**
 * Get all available badges
 */
export async function getAllBadges(): Promise<Badge[]> {
  // Returns all fields - needed for badge requirement evaluation
  return db.select().from(badges).where(eq(badges.isActive, true)).orderBy(badges.category, badges.order);
}

/**
 * Get user's earned badges (scoped to trading account)
 */
export async function getUserBadges(userId: string, accountId: string): Promise<UserBadge[]> {
  // Returns all fields - needed for badge display
  return db.select().from(userBadges)
    .where(and(eq(userBadges.userId, userId), eq(userBadges.tradingAccountId, accountId)))
    .orderBy(desc(userBadges.earnedAt));
}

/**
 * Check if user already has a badge (scoped to trading account)
 */
export async function hasUserBadge(userId: string, badgeId: string, accountId: string): Promise<boolean> {
  const result = await db
    .select({ id: userBadges.id })
    .from(userBadges)
    .where(and(eq(userBadges.userId, userId), eq(userBadges.tradingAccountId, accountId), eq(userBadges.badgeId, badgeId)))
    .limit(1);
  
  return result.length > 0;
}

/**
 * Award badge to user (scoped to trading account)
 */
export async function awardBadge(userId: string, badgeId: string, accountId: string): Promise<UserBadge> {
  // Get badge details
  const badge = await db.select().from(badges).where(eq(badges.id, badgeId)).limit(1);
  
  if (badge.length === 0) {
    throw new Error(`Badge not found: ${badgeId}`);
  }

  // Insert user badge
  const [userBadge] = await db.insert(userBadges).values({
    userId,
    tradingAccountId: accountId,
    badgeId,
    notified: false,
  }).returning();

  // Calculate total badges and points for this account
  const earnedBadges = await db
    .select({ badge: badges })
    .from(userBadges)
    .innerJoin(badges, eq(userBadges.badgeId, badges.id))
    .where(and(eq(userBadges.userId, userId), eq(userBadges.tradingAccountId, accountId)));

  const totalBadges = earnedBadges.length;
  const totalPoints = earnedBadges.reduce((sum, { badge }) => sum + badge.points, 0);

  // Update user stats for this account
  await db
    .update(userStats)
    .set({
      badgesEarned: totalBadges,
      totalPoints: totalPoints,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(userStats.userId, userId), eq(userStats.tradingAccountId, accountId)));

  // Send achievement notification
  await sendAchievementNotification(userId, badge[0]);

  return userBadge;
}

/**
 * Evaluate if badge requirement is met
 */
export function evaluateBadgeRequirement(badge: Badge, stats: UserStats): boolean {
  const requirement: BadgeRequirement = JSON.parse(badge.requirement);
  
  switch (requirement.type) {
    case 'TOTAL_TRADES':
      return stats.totalTrades >= (requirement.value || 0);
      
    case 'WIN_STREAK':
      return stats.longestWinStreak >= (requirement.value || 0);
      
    case 'LOG_STREAK':
      return stats.longestLogStreak >= (requirement.value || 0);
      
    case 'SOP_STREAK':
      return stats.longestSopStreak >= (requirement.value || 0);
      
    case 'PROFIT_TOTAL':
      return stats.totalProfitUsd >= (requirement.value || 0);
      
    case 'WIN_RATE':
      if (stats.totalTrades < (requirement.minTrades || 50)) return false;
      return stats.winRate >= (requirement.value || 0);
      
    case 'SOP_RATE':
      if (stats.totalTrades < (requirement.minTrades || 20)) return false;
      return stats.sopComplianceRate >= (requirement.value || 0);
      
    case 'SESSION_TRADES':
      const sessionKey = `${requirement.sessionType?.toLowerCase()}Trades` as keyof UserStats;
      return (stats[sessionKey] as number) >= (requirement.value || 0);
      
    case 'TARGET_COMPLETED':
      return stats.hasCompletedTarget;
      
    case 'PERFECT_MONTH':
      return stats.hasPerfectMonth;
      
    case 'MAX_TRADES_DAY':
      return stats.maxTradesInDay >= (requirement.value || 0);
      
    case 'TOTAL_LOGGING_DAYS':
      return stats.totalLoggingDays >= (requirement.value || 0);
      
    case 'EARLY_ADOPTER':
      // Check if user registered before cutoff date
      if (!stats.firstTradeDate || !requirement.registrationDate) return false;
      return stats.firstTradeDate < requirement.registrationDate;
      
    case 'COMEBACK':
      // This requires additional logic - check daily summaries for pattern
      // Will be implemented in streak service
      return false;
      
    default:
      return false;
  }
}

/**
 * Check and award badges for a user based on trigger (scoped to trading account)
 */
export async function checkAndAwardBadges(userId: string, trigger: BadgeTrigger, accountId: string): Promise<Badge[]> {
  // Get user stats for this account
  const stats = await db.select().from(userStats)
    .where(and(eq(userStats.userId, userId), eq(userStats.tradingAccountId, accountId)))
    .limit(1);
  
  if (stats.length === 0) {
    // User stats don't exist yet for this account
    await initializeUserStats(userId, accountId);
    return [];
  }

  const userStat = stats[0];
  
  // Get all active badges
  const allBadges = await getAllBadges();
  
  // Filter badges relevant to this trigger
  const eligibleBadges = filterBadgesByTrigger(allBadges, trigger);
  
  const earnedBadges: Badge[] = [];
  
  for (const badge of eligibleBadges) {
    // Check if already earned for this account
    const alreadyEarned = await hasUserBadge(userId, badge.id, accountId);
    if (alreadyEarned) {
      continue;
    }
    
    // Evaluate requirement
    const meetsRequirement = evaluateBadgeRequirement(badge, userStat);
    
    if (meetsRequirement) {
      try {
        await awardBadge(userId, badge.id, accountId);
        earnedBadges.push(badge);
      } catch (error) {
        console.error(`Failed to award badge ${badge.id} to user ${userId}:`, error);
      }
    }
  }
  
  return earnedBadges;
}

/**
 * Filter badges by trigger type
 */
function filterBadgesByTrigger(badges: Badge[], trigger: BadgeTrigger): Badge[] {
  // For now, check all badges on any trigger
  // In future, can optimize by categorizing badges by trigger type
  return badges;
}

/**
 * Initialize user stats for a trading account (called when account first creates trade)
 */
export async function initializeUserStats(userId: string, accountId: string): Promise<void> {
  const existing = await db.select({ id: userStats.id })
    .from(userStats)
    .where(and(eq(userStats.userId, userId), eq(userStats.tradingAccountId, accountId)))
    .limit(1);
  
  if (existing.length > 0) {
    return; // Already initialized
  }

  await db.insert(userStats).values({
    userId,
    tradingAccountId: accountId,
    firstTradeDate: new Date().toISOString().split('T')[0],
    totalTrades: 0,
    totalWins: 0,
    totalLosses: 0,
    totalProfitUsd: 0,
    winRate: 0,
    sopComplianceRate: 0,
    currentWinStreak: 0,
    longestWinStreak: 0,
    currentLogStreak: 0,
    longestLogStreak: 0,
    currentSopStreak: 0,
    longestSopStreak: 0,
    asiaTrades: 0,
    europeTrades: 0,
    usTrades: 0,
    maxTradesInDay: 0,
    totalLoggingDays: 0,
    badgesEarned: 0,
    totalPoints: 0,
    hasCompletedTarget: false,
    hasPerfectMonth: false,
  });
}

/**
 * Update user stats from all trades for a specific account (recalculation)
 */
export async function updateUserStatsFromTrades(userId: string, accountId: string): Promise<void> {
  const { individualTrades } = await import('../db/schema');
  const { updateWinStreak, updateLogStreak, recalculateSopStreakFromTrades } = await import('./streakService');
  
  // Get all trades for this account
  const trades = await db
    .select({
      result: individualTrades.result,
      sopFollowed: individualTrades.sopFollowed,
      profitLossUsd: individualTrades.profitLossUsd,
      marketSession: individualTrades.marketSession,
      tradeTimestamp: individualTrades.tradeTimestamp,
      entryType: individualTrades.entryType,
    })
    .from(individualTrades)
    .where(and(eq(individualTrades.userId, userId), eq(individualTrades.tradingAccountId, accountId)))
    .orderBy(individualTrades.tradeTimestamp);

  if (trades.length === 0) return;

  // Separate TRANSACTION trades (exclude COMMISSION for stats/streaks)
  const transactionTrades = trades.filter(t => t.entryType === 'TRANSACTION');
  
  // Update WIN and LOG streaks for all unique trading dates (account-scoped)
  const uniqueDates = Array.from(new Set(transactionTrades.map(t => new Date(t.tradeTimestamp).toISOString().split('T')[0]))).sort();
  for (const dateStr of uniqueDates) {
    const date = new Date(dateStr + 'T00:00:00.000Z');
    await updateWinStreak(userId, date, accountId);
    await updateLogStreak(userId, date, accountId);
  }
  
  // Recalculate SOP streak from TRANSACTION trades only
  await recalculateSopStreakFromTrades(userId, transactionTrades.map(t => ({
    sopFollowed: t.sopFollowed ?? false,
    tradeTimestamp: new Date(t.tradeTimestamp)
  })), accountId);

  // Calculate stats — TRANSACTION trades only (exclude COMMISSION from counts/rates)
  const totalTrades = transactionTrades.length;
  const totalWins = transactionTrades.filter(t => t.result === 'WIN').length;
  const totalLosses = transactionTrades.filter(t => t.result === 'LOSS').length;
  // P/L includes all entries (COMMISSION reduces real profit)
  const totalProfitUsd = trades.reduce((sum, t) => sum + t.profitLossUsd, 0);
  const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
  const sopCompliantTrades = transactionTrades.filter(t => t.sopFollowed).length;
  const sopComplianceRate = totalTrades > 0 ? (sopCompliantTrades / totalTrades) * 100 : 0;

  // Session trades (TRANSACTION only)
  const asiaTrades = transactionTrades.filter(t => t.marketSession === 'ASIA').length;
  const europeTrades = transactionTrades.filter(t => t.marketSession === 'EUROPE').length;
  const usTrades = transactionTrades.filter(t => t.marketSession === 'US').length;

  // Max trades in a day (TRANSACTION only)
  const tradesByDay = transactionTrades.reduce((acc, t) => {
    const day = new Date(t.tradeTimestamp).toISOString().split('T')[0];
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const maxTradesInDay = Math.max(...Object.values(tradesByDay), 0);
  const totalLoggingDays = Object.keys(tradesByDay).length;

  // Get streak data for this account (now populated from above)
  const { streaks } = await import('../db/schema');
  const userStreaks = await db.select().from(streaks)
    .where(and(eq(streaks.userId, userId), eq(streaks.tradingAccountId, accountId)));
  
  const winStreak = userStreaks.find(s => s.streakType === 'WIN_STREAK');
  const logStreak = userStreaks.find(s => s.streakType === 'LOG_STREAK');
  const sopStreak = userStreaks.find(s => s.streakType === 'SOP_STREAK');

  // Update user stats for this account
  await db
    .update(userStats)
    .set({
      totalTrades,
      totalWins,
      totalLosses,
      totalProfitUsd,
      winRate,
      sopComplianceRate,
      asiaTrades,
      europeTrades,
      usTrades,
      maxTradesInDay,
      totalLoggingDays,
      currentWinStreak: winStreak?.currentStreak || 0,
      longestWinStreak: winStreak?.longestStreak || 0,
      currentLogStreak: logStreak?.currentStreak || 0,
      longestLogStreak: logStreak?.longestStreak || 0,
      currentSopStreak: sopStreak?.currentStreak || 0,
      longestSopStreak: sopStreak?.longestStreak || 0,
      firstTradeDate: new Date(trades[0].tradeTimestamp).toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(userStats.userId, userId), eq(userStats.tradingAccountId, accountId)));
}

/**
 * Send achievement notification to user
 */
async function sendAchievementNotification(userId: string, badge: Badge): Promise<void> {
  // Use notification service for consistent notification handling
  await notifyBadgeUnlock(userId, badge);
}

/**
 * Get badge progress for user (next badges to earn) — scoped to trading account
 */
export async function getBadgeProgress(userId: string, accountId: string): Promise<Array<{
  badge: Badge;
  progress: number;
  currentValue: number;
  targetValue: number;
}>> {
  // Get or create user stats for this account
  let stats = await db.select().from(userStats)
    .where(and(eq(userStats.userId, userId), eq(userStats.tradingAccountId, accountId)))
    .limit(1);
  
  if (stats.length === 0) {
    // Initialize with defaults
    await initializeUserStats(userId, accountId);
    // Recalculate from trades
    await updateUserStatsFromTrades(userId, accountId);
    stats = await db.select().from(userStats)
      .where(and(eq(userStats.userId, userId), eq(userStats.tradingAccountId, accountId)))
      .limit(1);
  }

  const userStat = stats[0];
  const allBadges = await getAllBadges();
  const earnedBadgeIds = (await getUserBadges(userId, accountId)).map(ub => ub.badgeId);
  
  // Get unearned badges
  const unearnedBadges = allBadges.filter(b => !earnedBadgeIds.includes(b.id));
  
  const progress = unearnedBadges.map(badge => {
    const requirement: BadgeRequirement = JSON.parse(badge.requirement);
    let current = 0;
    let target = requirement.value || 0;
    
    switch (requirement.type) {
      case 'TOTAL_TRADES':
        current = userStat.totalTrades;
        break;
      case 'WIN_STREAK':
        // Show CURRENT streak for progress (what you're building now)
        // Badge AWARDING uses longest streak (see checkAndAwardBadges)
        current = userStat.currentWinStreak;
        break;
      case 'LOG_STREAK':
        current = userStat.currentLogStreak;
        break;
      case 'SOP_STREAK':
        current = userStat.currentSopStreak;
        break;
      case 'PROFIT_TOTAL':
        current = userStat.totalProfitUsd;
        break;
      case 'WIN_RATE':
        current = userStat.winRate;
        target = requirement.value || 0;
        break;
      case 'SOP_RATE':
        current = userStat.sopComplianceRate;
        target = requirement.value || 0;
        break;
      case 'SESSION_TRADES':
        const sessionKey = `${requirement.sessionType?.toLowerCase()}Trades` as keyof UserStats;
        current = userStat[sessionKey] as number;
        break;
      case 'MAX_TRADES_DAY':
        current = userStat.maxTradesInDay;
        break;
      case 'TOTAL_LOGGING_DAYS':
        current = userStat.totalLoggingDays;
        break;
    }
    
    // Clamp 0-100: prevents negative width CSS for PROFIT_TOTAL when P&L is negative
    const progressPercent = target > 0 ? Math.max(0, Math.min((current / target) * 100, 100)) : 0;
    
    return {
      badge,
      progress: progressPercent,
      currentValue: current,
      targetValue: target,
    };
  });
  
  // Sort by progress descending (closest to earning first)
  return progress.sort((a, b) => b.progress - a.progress);
}

/**
 * Get user's total badge count and points
/**
 * Get badge stats for user (scoped to trading account)
 */
export async function getUserBadgeStats(userId: string, accountId: string): Promise<{
  totalBadges: number;
  totalPoints: number;
  badgesByTier: Record<string, number>;
}> {
  const earnedBadges = await db
    .select({ badge: badges })
    .from(userBadges)
    .innerJoin(badges, eq(userBadges.badgeId, badges.id))
    .where(and(eq(userBadges.userId, userId), eq(userBadges.tradingAccountId, accountId)));

  const totalBadges = earnedBadges.length;
  const totalPoints = earnedBadges.reduce((sum, { badge }) => sum + badge.points, 0);
  
  const badgesByTier = earnedBadges.reduce((acc, { badge }) => {
    acc[badge.tier] = (acc[badge.tier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalBadges,
    totalPoints,
    badgesByTier,
  };
}
