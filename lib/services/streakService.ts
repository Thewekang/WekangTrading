/**
 * Streak Service - Track and update user streaks (win, log, SOP)
 */

import { db } from '@/lib/db';
import { streaks, dailySummaries, userStats, motivationalMessages, type Streak } from '@/lib/db/schema';
import { eq, and, desc, gte, lt } from 'drizzle-orm';

export type StreakType = 'WIN_STREAK' | 'LOG_STREAK' | 'SOP_STREAK';

/**
 * Get user's streak by type
 */
export async function getUserStreak(userId: string, streakType: StreakType): Promise<Streak | null> {
  const result = await db
    .select()
    .from(streaks)
    .where(and(eq(streaks.userId, userId), eq(streaks.streakType, streakType)))
    .limit(1);
  
  return result[0] || null;
}

/**
 * Get all streaks for user
 */
export async function getAllUserStreaks(userId: string): Promise<Streak[]> {
  return db.select().from(streaks).where(eq(streaks.userId, userId));
}

/**
 * Initialize streak for user
 */
async function initializeStreak(userId: string, streakType: StreakType): Promise<Streak> {
  const [streak] = await db.insert(streaks).values({
    userId,
    streakType,
    currentStreak: 0,
    longestStreak: 0,
    lastStreakDate: null,
    startDate: null,
  }).returning();
  
  return streak;
}

/**
 * Update win streak based on daily summary
 */
export async function updateWinStreak(userId: string, tradeDate: Date): Promise<void> {
  const dateStr = tradeDate.toISOString().split('T')[0];
  
  // Get daily summary for this date
  const summary = await db
    .select()
    .from(dailySummaries)
    .where(and(eq(dailySummaries.userId, userId), eq(dailySummaries.tradeDate, dateStr)))
    .limit(1);
  
  if (summary.length === 0) return; // No trades for this date
  
  const dayResult = summary[0];
  const isWinningDay = dayResult.totalProfitLossUsd > 0;
  
  // Get or create streak
  let streak = await getUserStreak(userId, 'WIN_STREAK');
  if (!streak) {
    streak = await initializeStreak(userId, 'WIN_STREAK');
  }
  
  // Check if this is the next consecutive day
  const lastDate = streak.lastStreakDate ? new Date(streak.lastStreakDate) : null;
  const isConsecutive = lastDate ? isNextTradingDay(lastDate, tradeDate) : false;
  
  if (isWinningDay) {
    // Winning day - increment or start streak
    const newStreak = isConsecutive ? streak.currentStreak + 1 : 1;
    const newLongest = Math.max(newStreak, streak.longestStreak);
    
    await db
      .update(streaks)
      .set({
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastStreakDate: dateStr,
        startDate: isConsecutive ? streak.startDate : dateStr,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(streaks.id, streak.id));
    
    // Update user stats
    await db
      .update(userStats)
      .set({
        currentWinStreak: newStreak,
        longestWinStreak: newLongest,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(userStats.userId, userId));
    
    // Send streak milestone messages
    if ([3, 5, 7, 10, 15].includes(newStreak)) {
      await sendStreakMilestoneMessage(userId, 'WIN_STREAK', newStreak);
    }
  } else {
    // Losing day - break streak
    if (streak.currentStreak > 0) {
      await db
        .update(streaks)
        .set({
          currentStreak: 0,
          lastStreakDate: dateStr,
          startDate: null,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(streaks.id, streak.id));
      
      await db
        .update(userStats)
        .set({
          currentWinStreak: 0,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(userStats.userId, userId));
    }
  }
}

/**
 * Update logging streak (consecutive days with trades)
 */
export async function updateLogStreak(userId: string, tradeDate: Date): Promise<void> {
  const dateStr = tradeDate.toISOString().split('T')[0];
  
  // Get or create streak
  let streak = await getUserStreak(userId, 'LOG_STREAK');
  if (!streak) {
    streak = await initializeStreak(userId, 'LOG_STREAK');
  }
  
  // Check if already logged today
  const lastDate = streak.lastStreakDate ? new Date(streak.lastStreakDate) : null;
  if (lastDate && lastDate.toISOString().split('T')[0] === dateStr) {
    return; // Already counted today
  }
  
  // Check if consecutive
  const isConsecutive = lastDate ? isNextCalendarDay(lastDate, tradeDate) : false;
  
  const newStreak = isConsecutive ? streak.currentStreak + 1 : 1;
  const newLongest = Math.max(newStreak, streak.longestStreak);
  
  await db
    .update(streaks)
    .set({
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastStreakDate: dateStr,
      startDate: isConsecutive ? streak.startDate : dateStr,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(streaks.id, streak.id));
  
  // Update user stats
  await db
    .update(userStats)
    .set({
      currentLogStreak: newStreak,
      longestLogStreak: newLongest,
      consecutiveLoggingDays: newStreak,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(userStats.userId, userId));
  
  // Send streak milestone messages
  if ([7, 14, 30, 60, 90].includes(newStreak)) {
    await sendStreakMilestoneMessage(userId, 'LOG_STREAK', newStreak);
  }
}

/**
 * Update SOP compliance streak (consecutive SOP-compliant trades)
 */
export async function updateSopStreak(userId: string, sopFollowed: boolean): Promise<void> {
  // Get or create streak
  let streak = await getUserStreak(userId, 'SOP_STREAK');
  if (!streak) {
    streak = await initializeStreak(userId, 'SOP_STREAK');
  }
  
  if (sopFollowed) {
    // SOP followed - increment streak
    const newStreak = streak.currentStreak + 1;
    const newLongest = Math.max(newStreak, streak.longestStreak);
    
    await db
      .update(streaks)
      .set({
        currentStreak: newStreak,
        longestStreak: newLongest,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(streaks.id, streak.id));
    
    // Update user stats
    await db
      .update(userStats)
      .set({
        currentSopStreak: newStreak,
        longestSopStreak: newLongest,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(userStats.userId, userId));
    
    // Send streak milestone messages
    if ([10, 20, 50, 100].includes(newStreak)) {
      await sendStreakMilestoneMessage(userId, 'SOP_STREAK', newStreak);
    }
  } else {
    // SOP not followed - break streak
    if (streak.currentStreak > 0) {
      await db
        .update(streaks)
        .set({
          currentStreak: 0,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(streaks.id, streak.id));
      
      await db
        .update(userStats)
        .set({
          currentSopStreak: 0,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(userStats.userId, userId));
    }
  }
}

/**
 * Check if streak broken (for daily job - detect missed days)
 */
export async function checkStreakStatus(userId: string): Promise<void> {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  // Check log streak
  const logStreak = await getUserStreak(userId, 'LOG_STREAK');
  if (logStreak && logStreak.currentStreak > 0) {
    const lastDate = logStreak.lastStreakDate ? new Date(logStreak.lastStreakDate) : null;
    if (lastDate && lastDate < yesterday) {
      // Streak broken - no trades logged
      await db
        .update(streaks)
        .set({
          currentStreak: 0,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(streaks.id, logStreak.id));
      
      await db
        .update(userStats)
        .set({
          currentLogStreak: 0,
          consecutiveLoggingDays: 0,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(userStats.userId, userId));
      
      // Send reminder message
      await sendStreakBrokenMessage(userId, 'LOG_STREAK', logStreak.currentStreak);
    }
  }
}

/**
 * Helper: Check if dates are next trading day (skips weekends)
 */
function isNextTradingDay(lastDate: Date, currentDate: Date): boolean {
  const diff = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Same day or 1 day apart
  if (diff <= 1) return true;
  
  // Check if gap is only weekend
  const lastDay = lastDate.getDay();
  const currentDay = currentDate.getDay();
  
  // Friday to Monday (3 days)
  if (lastDay === 5 && currentDay === 1 && diff <= 3) return true;
  
  // Saturday to Monday (2 days) - for users who trade on Saturday
  if (lastDay === 6 && currentDay === 1 && diff <= 2) return true;
  
  return false;
}

/**
 * Helper: Check if dates are next calendar day
 */
function isNextCalendarDay(lastDate: Date, currentDate: Date): boolean {
  const diff = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  return diff === 1;
}

/**
 * Send streak milestone notification
 */
async function sendStreakMilestoneMessage(userId: string, streakType: StreakType, streakCount: number): Promise<void> {
  const streakName = streakType === 'WIN_STREAK' ? 'winning days' : 
                     streakType === 'LOG_STREAK' ? 'logging days' : 
                     'SOP-compliant trades';
  
  const icon = streakType === 'WIN_STREAK' ? '🔥' : 
               streakType === 'LOG_STREAK' ? '📝' : 
               '✅';
  
  await db.insert(motivationalMessages).values({
    userId,
    messageType: 'STREAK',
    title: `${icon} Streak Milestone!`,
    message: `${streakCount} consecutive ${streakName}! Keep the momentum going!`,
    metadata: JSON.stringify({
      streakType,
      streakCount,
    }),
    isRead: false,
  });
}

/**
 * Send streak broken notification
 */
async function sendStreakBrokenMessage(userId: string, streakType: StreakType, lastStreak: number): Promise<void> {
  await db.insert(motivationalMessages).values({
    userId,
    messageType: 'REMINDER',
    title: '📊 We miss you!',
    message: `Your ${lastStreak}-day logging streak ended. Log your trades to start a new streak!`,
    metadata: JSON.stringify({
      streakType,
      lastStreak,
    }),
    isRead: false,
  });
}

/**
 * Get streak summary for dashboard
 */
export async function getStreakSummary(userId: string): Promise<{
  winStreak: { current: number; longest: number };
  logStreak: { current: number; longest: number };
  sopStreak: { current: number; longest: number };
}> {
  const allStreaks = await getAllUserStreaks(userId);
  
  const winStreak = allStreaks.find(s => s.streakType === 'WIN_STREAK');
  const logStreak = allStreaks.find(s => s.streakType === 'LOG_STREAK');
  const sopStreak = allStreaks.find(s => s.streakType === 'SOP_STREAK');
  
  return {
    winStreak: {
      current: winStreak?.currentStreak || 0,
      longest: winStreak?.longestStreak || 0,
    },
    logStreak: {
      current: logStreak?.currentStreak || 0,
      longest: logStreak?.longestStreak || 0,
    },
    sopStreak: {
      current: sopStreak?.currentStreak || 0,
      longest: sopStreak?.longestStreak || 0,
    },
  };
}
