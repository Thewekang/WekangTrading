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
  return db.select().from(badges).where(eq(badges.isActive, true)).orderBy(badges.category, badges.order);
}

/**
 * Get user's earned badges
 */
export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  return db.select().from(userBadges).where(eq(userBadges.userId, userId)).orderBy(desc(userBadges.earnedAt));
}

/**
 * Check if user already has a badge
 */
export async function hasUserBadge(userId: string, badgeId: string): Promise<boolean> {
  const result = await db
    .select()
    .from(userBadges)
    .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badgeId)))
    .limit(1);
  
  return result.length > 0;
}

/**
 * Award badge to user
 */
export async function awardBadge(userId: string, badgeId: string): Promise<UserBadge> {
  // Get badge details
  const badge = await db.select().from(badges).where(eq(badges.id, badgeId)).limit(1);
  
  if (badge.length === 0) {
    throw new Error(`Badge not found: ${badgeId}`);
  }

  // Insert user badge
  const [userBadge] = await db.insert(userBadges).values({
    userId,
    badgeId,
    notified: false,
  }).returning();

  // Update user stats - increment badges earned and total points
  await db
    .update(userStats)
    .set({
      badgesEarned: db.$count(userBadges, eq(userBadges.userId, userId)),
      // @ts-ignore - SQL expression
      totalPoints: db.$sum(badges.points).where(eq(userBadges.userId, userId)),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(userStats.userId, userId));

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
 * Check and award badges for a user based on trigger
 */
export async function checkAndAwardBadges(userId: string, trigger: BadgeTrigger): Promise<Badge[]> {
  // Get user stats
  const stats = await db.select().from(userStats).where(eq(userStats.userId, userId)).limit(1);
  
  if (stats.length === 0) {
    // User stats don't exist yet, create them
    await initializeUserStats(userId);
    return [];
  }

  const userStat = stats[0];
  
  // Get all active badges
  const allBadges = await getAllBadges();
  
  // Filter badges relevant to this trigger
  const eligibleBadges = filterBadgesByTrigger(allBadges, trigger);
  
  const earnedBadges: Badge[] = [];
  
  for (const badge of eligibleBadges) {
    // Check if already earned
    const alreadyEarned = await hasUserBadge(userId, badge.id);
    if (alreadyEarned) continue;
    
    // Evaluate requirement
    const meetsRequirement = evaluateBadgeRequirement(badge, userStat);
    
    if (meetsRequirement) {
      try {
        await awardBadge(userId, badge.id);
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
 * Initialize user stats (called when user first creates trade)
 */
export async function initializeUserStats(userId: string): Promise<void> {
  const existing = await db.select().from(userStats).where(eq(userStats.userId, userId)).limit(1);
  
  if (existing.length > 0) {
    return; // Already initialized
  }

  await db.insert(userStats).values({
    userId,
    firstTradeDate: new Date().toISOString().split('T')[0],
  });
}

/**
 * Send achievement notification to user
 */
async function sendAchievementNotification(userId: string, badge: Badge): Promise<void> {
  // Use notification service for consistent notification handling
  await notifyBadgeUnlock(userId, badge);
}

/**
 * Get badge progress for user (next badges to earn)
 */
export async function getBadgeProgress(userId: string): Promise<Array<{
  badge: Badge;
  progress: number;
  current: number;
  target: number;
}>> {
  const stats = await db.select().from(userStats).where(eq(userStats.userId, userId)).limit(1);
  
  if (stats.length === 0) {
    return [];
  }

  const userStat = stats[0];
  const allBadges = await getAllBadges();
  const earnedBadgeIds = (await getUserBadges(userId)).map(ub => ub.badgeId);
  
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
        current = userStat.longestWinStreak;
        break;
      case 'LOG_STREAK':
        current = userStat.longestLogStreak;
        break;
      case 'SOP_STREAK':
        current = userStat.longestSopStreak;
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
    
    const progressPercent = target > 0 ? Math.min((current / target) * 100, 100) : 0;
    
    return {
      badge,
      progress: progressPercent,
      current,
      target,
    };
  });
  
  // Sort by progress descending (closest to earning first)
  return progress.sort((a, b) => b.progress - a.progress);
}

/**
 * Get user's total badge count and points
 */
export async function getUserBadgeStats(userId: string): Promise<{
  totalBadges: number;
  totalPoints: number;
  badgesByTier: Record<string, number>;
}> {
  const earnedBadges = await db
    .select({ badge: badges })
    .from(userBadges)
    .innerJoin(badges, eq(userBadges.badgeId, badges.id))
    .where(eq(userBadges.userId, userId));

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
