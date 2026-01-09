/**
 * Target Service
 * Business logic for target tracking and management
 */

import { prisma } from '@/lib/db';
import type { UserTarget, TargetType } from '@prisma/client';
import { getPersonalStats } from './statsService';

export interface TargetWithProgress extends UserTarget {
  progress: {
    currentWinRate: number;
    currentSopRate: number;
    currentProfitUsd: number;
    winRateProgress: number; // Percentage of target achieved
    sopRateProgress: number;
    profitProgress: number | null;
    isWinRateOnTrack: boolean;
    isSopRateOnTrack: boolean;
    isProfitOnTrack: boolean | null;
    daysRemaining: number;
    daysTotal: number;
    status: 'on-track' | 'at-risk' | 'behind' | 'completed' | 'failed';
  };
}

/**
 * Create a new target for a user
 */
export async function createTarget(
  userId: string,
  data: {
    targetType: TargetType;
    targetWinRate: number;
    targetSopRate: number;
    targetProfitUsd?: number;
    startDate: Date;
    endDate: Date;
    notes?: string;
  }
): Promise<UserTarget> {
  // Deactivate any existing active targets of the same type
  await prisma.userTarget.updateMany({
    where: {
      userId,
      targetType: data.targetType,
      isActive: true,
    },
    data: {
      isActive: false,
    },
  });

  // Create new target
  return prisma.userTarget.create({
    data: {
      userId,
      ...data,
      isActive: true,
    },
  });
}

/**
 * Get all targets for a user
 */
export async function getTargets(
  userId: string,
  options?: {
    isActive?: boolean;
    targetType?: TargetType;
    includeExpired?: boolean;
  }
): Promise<UserTarget[]> {
  const where: any = { userId };

  if (options?.isActive !== undefined) {
    where.isActive = options.isActive;
  }

  if (options?.targetType) {
    where.targetType = options.targetType;
  }

  if (!options?.includeExpired) {
    where.endDate = {
      gte: new Date(),
    };
  }

  return prisma.userTarget.findMany({
    where,
    orderBy: [
      { isActive: 'desc' },
      { startDate: 'desc' },
    ],
  });
}

/**
 * Get active target by type
 */
export async function getActiveTarget(
  userId: string,
  targetType: TargetType
): Promise<UserTarget | null> {
  return prisma.userTarget.findFirst({
    where: {
      userId,
      targetType,
      isActive: true,
      startDate: { lte: new Date() },
      endDate: { gte: new Date() },
    },
  });
}

/**
 * Get target with calculated progress
 */
export async function getTargetWithProgress(
  userId: string,
  targetId: string
): Promise<TargetWithProgress | null> {
  const target = await prisma.userTarget.findUnique({
    where: { id: targetId, userId },
  });

  if (!target) return null;

  const progress = await calculateTargetProgress(userId, target);
  
  return {
    ...target,
    progress,
  };
}

/**
 * Get all active targets with progress
 */
export async function getActiveTargetsWithProgress(
  userId: string
): Promise<TargetWithProgress[]> {
  const activeTargets = await prisma.userTarget.findMany({
    where: {
      userId,
      isActive: true,
      startDate: { lte: new Date() },
      endDate: { gte: new Date() },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const targetsWithProgress = await Promise.all(
    activeTargets.map(async (target) => {
      const progress = await calculateTargetProgress(userId, target);
      return {
        ...target,
        progress,
      };
    })
  );

  return targetsWithProgress;
}

/**
 * Calculate progress for a target
 */
async function calculateTargetProgress(
  userId: string,
  target: UserTarget
): Promise<TargetWithProgress['progress']> {
  // Get stats for the target period
  const stats = await getPersonalStats(userId, 'all'); // Will filter by dates below

  // Filter daily summaries within target period
  const summaries = await prisma.dailySummary.findMany({
    where: {
      userId,
      tradeDate: {
        gte: target.startDate,
        lte: target.endDate,
      },
    },
  });

  // Calculate totals
  const totalTrades = summaries.reduce((sum, s) => sum + s.totalTrades, 0);
  const totalWins = summaries.reduce((sum, s) => sum + s.totalWins, 0);
  const totalSopCompliant = summaries.reduce((sum, s) => sum + s.sopCompliantTrades, 0);
  const totalProfitUsd = summaries.reduce((sum, s) => sum + s.netProfitLossUsd, 0);

  const currentWinRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
  const currentSopRate = totalTrades > 0 ? (totalSopCompliant / totalTrades) * 100 : 0;

  // Calculate progress percentages
  const winRateProgress = target.targetWinRate > 0 
    ? Math.min((currentWinRate / target.targetWinRate) * 100, 100) 
    : 0;
  const sopRateProgress = target.targetSopRate > 0 
    ? Math.min((currentSopRate / target.targetSopRate) * 100, 100) 
    : 0;
  const profitProgress = target.targetProfitUsd 
    ? Math.min((totalProfitUsd / target.targetProfitUsd) * 100, 100) 
    : null;

  // Calculate time-based metrics
  const now = new Date();
  const daysTotal = Math.ceil(
    (target.endDate.getTime() - target.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysElapsed = Math.ceil(
    (now.getTime() - target.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysRemaining = Math.max(
    Math.ceil((target.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    0
  );

  // Determine if on track (considering time elapsed)
  const expectedProgress = daysTotal > 0 ? (daysElapsed / daysTotal) * 100 : 0;
  const isWinRateOnTrack = winRateProgress >= expectedProgress * 0.9; // 90% of expected
  const isSopRateOnTrack = sopRateProgress >= expectedProgress * 0.9;
  const isProfitOnTrack = profitProgress !== null 
    ? profitProgress >= expectedProgress * 0.9 
    : null;

  // Determine overall status
  let status: TargetWithProgress['progress']['status'];
  
  if (now > target.endDate) {
    // Target period ended
    const allAchieved = 
      currentWinRate >= target.targetWinRate &&
      currentSopRate >= target.targetSopRate &&
      (target.targetProfitUsd ? totalProfitUsd >= target.targetProfitUsd : true);
    status = allAchieved ? 'completed' : 'failed';
  } else if (isWinRateOnTrack && isSopRateOnTrack && (isProfitOnTrack === null || isProfitOnTrack)) {
    status = 'on-track';
  } else if (winRateProgress < expectedProgress * 0.7 || sopRateProgress < expectedProgress * 0.7) {
    status = 'behind';
  } else {
    status = 'at-risk';
  }

  return {
    currentWinRate: Math.round(currentWinRate * 10) / 10,
    currentSopRate: Math.round(currentSopRate * 10) / 10,
    currentProfitUsd: Math.round(totalProfitUsd * 100) / 100,
    winRateProgress: Math.round(winRateProgress * 10) / 10,
    sopRateProgress: Math.round(sopRateProgress * 10) / 10,
    profitProgress: profitProgress !== null ? Math.round(profitProgress * 10) / 10 : null,
    isWinRateOnTrack,
    isSopRateOnTrack,
    isProfitOnTrack,
    daysRemaining,
    daysTotal,
    status,
  };
}

/**
 * Update a target
 */
export async function updateTarget(
  userId: string,
  targetId: string,
  data: Partial<{
    targetWinRate: number;
    targetSopRate: number;
    targetProfitUsd: number;
    notes: string;
    isActive: boolean;
  }>
): Promise<UserTarget> {
  return prisma.userTarget.update({
    where: { id: targetId, userId },
    data,
  });
}

/**
 * Delete a target
 */
export async function deleteTarget(
  userId: string,
  targetId: string
): Promise<void> {
  await prisma.userTarget.delete({
    where: { id: targetId, userId },
  });
}

/**
 * Deactivate a target
 */
export async function deactivateTarget(
  userId: string,
  targetId: string
): Promise<UserTarget> {
  return prisma.userTarget.update({
    where: { id: targetId, userId },
    data: { isActive: false },
  });
}

/**
 * Get target suggestions based on historical performance
 */
export async function getTargetSuggestions(
  userId: string,
  targetType: TargetType
): Promise<{
  suggestedWinRate: number;
  suggestedSopRate: number;
  suggestedProfitUsd: number;
  reasoning: string;
}> {
  // Get last 30 days of performance
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const summaries = await prisma.dailySummary.findMany({
    where: {
      userId,
      tradeDate: { gte: thirtyDaysAgo },
    },
  });

  if (summaries.length === 0) {
    return {
      suggestedWinRate: 60.0,
      suggestedSopRate: 80.0,
      suggestedProfitUsd: 1000.0,
      reasoning: 'Default targets for new traders',
    };
  }

  const totalTrades = summaries.reduce((sum, s) => sum + s.totalTrades, 0);
  const totalWins = summaries.reduce((sum, s) => sum + s.totalWins, 0);
  const totalSopCompliant = summaries.reduce((sum, s) => sum + s.sopCompliantTrades, 0);
  const avgProfitPerDay = summaries.reduce((sum, s) => sum + s.netProfitLossUsd, 0) / summaries.length;

  const currentWinRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 50;
  const currentSopRate = totalTrades > 0 ? (totalSopCompliant / totalTrades) * 100 : 70;

  // Suggest 5-10% improvement
  const suggestedWinRate = Math.min(Math.round((currentWinRate * 1.05) * 10) / 10, 100);
  const suggestedSopRate = Math.min(Math.round((currentSopRate * 1.05) * 10) / 10, 100);
  
  // Calculate profit based on target type
  let daysInPeriod = 7;
  if (targetType === 'MONTHLY') daysInPeriod = 30;
  if (targetType === 'YEARLY') daysInPeriod = 365;
  
  const suggestedProfitUsd = Math.round(avgProfitPerDay * daysInPeriod * 1.1); // 10% improvement

  return {
    suggestedWinRate,
    suggestedSopRate,
    suggestedProfitUsd: Math.max(suggestedProfitUsd, 100),
    reasoning: `Based on your last 30 days (${currentWinRate.toFixed(1)}% win rate, ${currentSopRate.toFixed(1)}% SOP), targeting 5-10% improvement`,
  };
}
