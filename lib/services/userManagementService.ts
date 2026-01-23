/**
 * User Management Service (Admin)
 * Handles admin operations on user accounts
 */

import { db } from '@/lib/db';
import { users, individualTrades, dailySummaries, userTargets, sessions } from '@/lib/db/schema';
import { eq, and, count, sum, ne } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

/**
 * Create a new user (admin only - bypasses invite code)
 */
export async function createUserByAdmin(data: {
  name: string;
  email: string;
  password: string;
  role?: 'USER' | 'ADMIN';
}) {
  const { name, email, password, role = 'USER' } = data;

  // Check if user already exists
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email));

  if (existing) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user
  const [newUser] = await db
    .insert(users)
    .values({
      name,
      email,
      passwordHash,
      role,
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    });

  return newUser;
}

/**
 * Update user details (admin only)
 */
export async function updateUserByAdmin(
  userId: string,
  data: {
    name?: string;
    email?: string;
    role?: 'USER' | 'ADMIN';
  }
) {
  // If email is being changed, check it's not taken
  if (data.email) {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, data.email), ne(users.id, userId)));

    if (existing) {
      throw new Error('Email already in use by another user');
    }
  }

  const [updatedUser] = await db
    .update(users)
    .set(data)
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    });

  return updatedUser;
}

/**
 * Delete user account (admin only)
 * Manually cascades to delete all user data
 */
export async function deleteUserByAdmin(userId: string, currentAdminId: string) {
  // Prevent self-deletion
  if (userId === currentAdminId) {
    throw new Error('Cannot delete your own account');
  }

  // Check if this is the last admin
  const [user] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) {
    throw new Error('User not found');
  }

  if (user.role === 'ADMIN') {
    const [adminCountResult] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, 'ADMIN'));

    if (adminCountResult.count <= 1) {
      throw new Error('Cannot delete the last admin account');
    }
  }

  // Manual cascade deletion (SQLite doesn't have foreign key constraints defined)

  // 1. Delete individual trades
  const tradesResult = await db
    .delete(individualTrades)
    .where(eq(individualTrades.userId, userId));

  // 2. Delete daily summaries
  const summariesResult = await db
    .delete(dailySummaries)
    .where(eq(dailySummaries.userId, userId));

  // 3. Delete user targets
  const targetsResult = await db
    .delete(userTargets)
    .where(eq(userTargets.userId, userId));

  // 4. Delete user sessions
  const sessionsResult = await db
    .delete(sessions)
    .where(eq(sessions.userId, userId));

  // 5. Delete user account
  await db.delete(users).where(eq(users.id, userId));
}

/**
 * Reset user password (admin only)
 */
export async function resetUserPasswordByAdmin(userId: string) {
  // Generate temporary password
  const tempPassword = Math.random().toString(36).slice(-10);
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, userId));

  return tempPassword;
}

/**
 * Get user with stats
 */
export async function getUserWithStats(userId: string) {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) {
    throw new Error('User not found');
  }

  // Get trade counts for each table
  const [tradesCount] = await db
    .select({ count: count() })
    .from(individualTrades)
    .where(eq(individualTrades.userId, userId));

  const [summariesCount] = await db
    .select({ count: count() })
    .from(dailySummaries)
    .where(eq(dailySummaries.userId, userId));

  const [targetsCount] = await db
    .select({ count: count() })
    .from(userTargets)
    .where(eq(userTargets.userId, userId));

  // Get performance stats
  const [tradesSum] = await db
    .select({
      totalProfitLoss: sum(individualTrades.profitLossUsd),
    })
    .from(individualTrades)
    .where(eq(individualTrades.userId, userId));

  const [winsCount] = await db
    .select({ count: count() })
    .from(individualTrades)
    .where(and(eq(individualTrades.userId, userId), eq(individualTrades.result, 'WIN')));

  const [sopFollowedCount] = await db
    .select({ count: count() })
    .from(individualTrades)
    .where(and(eq(individualTrades.userId, userId), eq(individualTrades.sopFollowed, true)));

  const totalTrades = tradesCount.count;
  const wins = winsCount.count;
  const sopFollowed = sopFollowedCount.count;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  const sopRate = totalTrades > 0 ? (sopFollowed / totalTrades) * 100 : 0;

  return {
    ...user,
    _count: {
      individualTrades: tradesCount.count,
      dailySummaries: summariesCount.count,
      targets: targetsCount.count,
    },
    stats: {
      totalTrades,
      totalWins: wins,
      totalLosses: totalTrades - wins,
      winRate,
      sopRate,
      netProfitLoss: Number(tradesSum.totalProfitLoss || 0),
      dailySummaries: summariesCount.count,
      targets: targetsCount.count,
    },
  };
}
