/**
 * User Settings Service
 * Business logic for user self-service operations
 */

import { db } from '@/lib/db';
import { 
  users, 
  individualTrades, 
  dailySummaries, 
  userTargets,
  userBadges,
  userStats,
  streaks,
  motivationalMessages,
  notifications
} from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

/**
 * Change user password
 */
export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  // Get user with current password
  const [user] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new Error('User not found');
  }

  // Verify current password
  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    throw new Error('Current password is incorrect');
  }

  // Check new password is different
  const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
  if (isSamePassword) {
    throw new Error('New password must be different from current password');
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password
  await db
    .update(users)
    .set({ passwordHash: hashedPassword })
    .where(eq(users.id, userId));
}

/**
 * Reset user account (delete all trading data, achievements, and stats but keep account)
 */
export async function resetUserAccount(userId: string): Promise<{
  deletedTrades: number;
  deletedSummaries: number;
  deletedTargets: number;
  deletedBadges: number;
  deletedNotifications: number;
}> {
  // Delete all user data in correct order to avoid FK constraints
  
  // 1. Delete individual trades
  const [tradesCountBefore] = await db
    .select({ count: count() })
    .from(individualTrades)
    .where(eq(individualTrades.userId, userId));
  
  await db
    .delete(individualTrades)
    .where(eq(individualTrades.userId, userId));
  
  // 2. Delete daily summaries
  const [summariesCountBefore] = await db
    .select({ count: count() })
    .from(dailySummaries)
    .where(eq(dailySummaries.userId, userId));
  
  await db
    .delete(dailySummaries)
    .where(eq(dailySummaries.userId, userId));
  
  // 3. Delete targets
  const [targetsCountBefore] = await db
    .select({ count: count() })
    .from(userTargets)
    .where(eq(userTargets.userId, userId));
  
  await db
    .delete(userTargets)
    .where(eq(userTargets.userId, userId));
  
  // 4. Delete user badges (achievements)
  const [badgesCountBefore] = await db
    .select({ count: count() })
    .from(userBadges)
    .where(eq(userBadges.userId, userId));
  
  await db
    .delete(userBadges)
    .where(eq(userBadges.userId, userId));
  
  // 5. Delete user streaks
  await db
    .delete(streaks)
    .where(eq(streaks.userId, userId));
  
  // 6. Delete user stats
  await db
    .delete(userStats)
    .where(eq(userStats.userId, userId));
  
  // 7. Delete motivational messages
  const [notificationsCountBefore] = await db
    .select({ count: count() })
    .from(motivationalMessages)
    .where(eq(motivationalMessages.userId, userId));
  
  await db
    .delete(motivationalMessages)
    .where(eq(motivationalMessages.userId, userId));
  
  // 8. Delete notifications (if exists)
  try {
    await db
      .delete(notifications)
      .where(eq(notifications.userId, userId));
  } catch (error) {
    // Notifications table might not exist yet, ignore error
  }
  
  // 9. Increment reset count
  const [user] = await db
    .select({ resetCount: users.resetCount })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  await db
    .update(users)
    .set({ resetCount: (user?.resetCount || 0) + 1 })
    .where(eq(users.id, userId));

  return {
    deletedTrades: tradesCountBefore?.count || 0,
    deletedSummaries: summariesCountBefore?.count || 0,
    deletedTargets: targetsCountBefore?.count || 0,
    deletedBadges: badgesCountBefore?.count || 0,
    deletedNotifications: notificationsCountBefore?.count || 0,
  };
}

/**
 * Get user account summary (for reset confirmation)
 */
export async function getUserAccountSummary(userId: string): Promise<{
  totalTrades: number;
  totalSummaries: number;
  totalTargets: number;
  totalBadges: number;
  totalNotifications: number;
}> {
  const [tradesResult, summariesResult, targetsResult, badgesResult, notificationsResult] = await Promise.all([
    db.select({ count: count() }).from(individualTrades).where(eq(individualTrades.userId, userId)),
    db.select({ count: count() }).from(dailySummaries).where(eq(dailySummaries.userId, userId)),
    db.select({ count: count() }).from(userTargets).where(eq(userTargets.userId, userId)),
    db.select({ count: count() }).from(userBadges).where(eq(userBadges.userId, userId)),
    db.select({ count: count() }).from(motivationalMessages).where(eq(motivationalMessages.userId, userId)),
  ]);

  return {
    totalTrades: tradesResult[0]?.count || 0,
    totalSummaries: summariesResult[0]?.count || 0,
    totalTargets: targetsResult[0]?.count || 0,
    totalBadges: badgesResult[0]?.count || 0,
    totalNotifications: notificationsResult[0]?.count || 0,
  };
}
