/**
 * User Management Service (Admin)
 * Handles admin operations on user accounts
 */

import { prisma } from '@/lib/db';
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
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user
  return await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
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
    const existing = await prisma.user.findFirst({
      where: {
        email: data.email,
        id: { not: userId },
      },
    });

    if (existing) {
      throw new Error('Email already in use by another user');
    }
  }

  return await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/**
 * Delete user account (admin only)
 */
export async function deleteUserByAdmin(userId: string, currentAdminId: string) {
  // Prevent self-deletion
  if (userId === currentAdminId) {
    throw new Error('Cannot delete your own account');
  }

  // Check if this is the last admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role === 'ADMIN') {
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' },
    });

    if (adminCount <= 1) {
      throw new Error('Cannot delete the last admin account');
    }
  }

  // Delete user (cascade will handle trades, summaries, targets)
  await prisma.user.delete({
    where: { id: userId },
  });
}

/**
 * Reset user password (admin only)
 */
export async function resetUserPasswordByAdmin(userId: string) {
  // Generate temporary password
  const tempPassword = Math.random().toString(36).slice(-10);
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  return tempPassword;
}

/**
 * Get user with stats
 */
export async function getUserWithStats(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          individualTrades: true,
          dailySummaries: true,
          targets: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Get performance stats
  const trades = await prisma.individualTrade.aggregate({
    where: { userId },
    _count: true,
    _sum: {
      profitLossUsd: true,
    },
  });

  const wins = await prisma.individualTrade.count({
    where: { userId, result: 'WIN' },
  });

  const sopFollowed = await prisma.individualTrade.count({
    where: { userId, sopFollowed: true },
  });

  const totalTrades = trades._count;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  const sopRate = totalTrades > 0 ? (sopFollowed / totalTrades) * 100 : 0;

  return {
    ...user,
    stats: {
      totalTrades,
      totalWins: wins,
      totalLosses: totalTrades - wins,
      winRate,
      sopRate,
      netProfitLoss: trades._sum.profitLossUsd || 0,
      dailySummaries: user._count.dailySummaries,
      targets: user._count.targets,
    },
  };
}
