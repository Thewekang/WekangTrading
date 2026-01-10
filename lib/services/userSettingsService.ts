/**
 * User Settings Service
 * Business logic for user self-service operations
 */

import { prisma } from '@/lib/db';
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
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

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
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hashedPassword },
  });
}

/**
 * Reset user account (delete all trading data but keep account)
 */
export async function resetUserAccount(userId: string): Promise<{
  deletedTrades: number;
  deletedSummaries: number;
  deletedTargets: number;
}> {
  // Delete all user data in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Delete targets
    const deletedTargets = await tx.userTarget.deleteMany({
      where: { userId },
    });

    // Delete daily summaries
    const deletedSummaries = await tx.dailySummary.deleteMany({
      where: { userId },
    });

    // Delete individual trades
    const deletedTrades = await tx.individualTrade.deleteMany({
      where: { userId },
    });

    // Increment reset count
    await tx.user.update({
      where: { id: userId },
      data: { resetCount: { increment: 1 } },
    });

    return {
      deletedTrades: deletedTrades.count,
      deletedSummaries: deletedSummaries.count,
      deletedTargets: deletedTargets.count,
    };
  });

  return result;
}

/**
 * Get user account summary (for reset confirmation)
 */
export async function getUserAccountSummary(userId: string): Promise<{
  totalTrades: number;
  totalSummaries: number;
  totalTargets: number;
}> {
  const [totalTrades, totalSummaries, totalTargets] = await Promise.all([
    prisma.individualTrade.count({ where: { userId } }),
    prisma.dailySummary.count({ where: { userId } }),
    prisma.userTarget.count({ where: { userId } }),
  ]);

  return {
    totalTrades,
    totalSummaries,
    totalTargets,
  };
}
