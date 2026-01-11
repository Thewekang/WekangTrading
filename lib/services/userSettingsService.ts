/**
 * User Settings Service
 * Business logic for user self-service operations
 */

import { db } from '@/lib/db';
import { users, individualTrades, dailySummaries, userTargets } from '@/lib/db/schema';
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
 * Reset user account (delete all trading data but keep account)
 */
export async function resetUserAccount(userId: string): Promise<{
  deletedTrades: number;
  deletedSummaries: number;
  deletedTargets: number;
}> {
  // Delete all user data (Drizzle doesn't support interactive transactions like Prisma)
  // Delete in correct order to avoid FK constraints
  
  // Delete individual trades
  await db
    .delete(individualTrades)
    .where(eq(individualTrades.userId, userId));
  
  // Count before deletion
  const [tradesCount] = await db
    .select({ count: count() })
    .from(individualTrades)
    .where(eq(individualTrades.userId, userId));
  
  // Delete daily summaries
  await db
    .delete(dailySummaries)
    .where(eq(dailySummaries.userId, userId));
  
  const [summariesCount] = await db
    .select({ count: count() })
    .from(dailySummaries)
    .where(eq(dailySummaries.userId, userId));
  
  // Delete targets
  await db
    .delete(userTargets)
    .where(eq(userTargets.userId, userId));
  
  const [targetsCount] = await db
    .select({ count: count() })
    .from(userTargets)
    .where(eq(userTargets.userId, userId));
  
  // Increment reset count
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
    deletedTrades: tradesCount?.count || 0,
    deletedSummaries: summariesCount?.count || 0,
    deletedTargets: targetsCount?.count || 0,
  };
}

/**
 * Get user account summary (for reset confirmation)
 */
export async function getUserAccountSummary(userId: string): Promise<{
  totalTrades: number;
  totalSummaries: number;
  totalTargets: number;
}> {
  const [tradesResult, summariesResult, targetsResult] = await Promise.all([
    db.select({ count: count() }).from(individualTrades).where(eq(individualTrades.userId, userId)),
    db.select({ count: count() }).from(dailySummaries).where(eq(dailySummaries.userId, userId)),
    db.select({ count: count() }).from(userTargets).where(eq(userTargets.userId, userId)),
  ]);

  return {
    totalTrades: tradesResult[0]?.count || 0,
    totalSummaries: summariesResult[0]?.count || 0,
    totalTargets: targetsResult[0]?.count || 0,
  };
}
