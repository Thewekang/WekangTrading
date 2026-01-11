/**
 * Target Service
 * Business logic for target tracking and management
 */

import { db } from '@/lib/db';
import { userTargets, dailySummaries } from '@/lib/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import type { UserTarget } from '@/lib/db/schema/targets';
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
    targetType: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    targetWinRate: number;
    targetSopRate: number;
    targetProfitUsd?: number;
    startDate: Date;
    endDate: Date;
    notes?: string;
  }
): Promise<UserTarget> {
  // Deactivate any existing active targets of the same type
  await db
    .update(userTargets)
    .set({ active: false })
    .where(
      and(
        eq(userTargets.userId, userId),
        eq(userTargets.targetType, data.targetType),
        eq(userTargets.active, true)
      )
    );

  // Create new target
  const [newTarget] = await db
    .insert(userTargets)
    .values({
      userId: userId,
      targetType: data.targetType,
      targetWinRate: data.targetWinRate,
      targetSopRate: data.targetSopRate,
      targetProfitUsd: data.targetProfitUsd,
      startDate: data.startDate,
      endDate: data.endDate,
      notes: data.notes,
      active: true,
    })
    .returning();

  return newTarget;
}

/**
 * Get all targets for a user
 */
export async function getTargets(
  userId: string,
  options?: {
    active?: boolean;
    targetType?: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    includeExpired?: boolean;
  }
): Promise<UserTarget[]> {
  const conditions = [eq(userTargets.userId, userId)];

  if (options?.active !== undefined) {
    conditions.push(eq(userTargets.active, options.active));
  }

  if (options?.targetType) {
    conditions.push(eq(userTargets.targetType, options.targetType));
  }

  if (!options?.includeExpired) {
    const now = new Date();
    conditions.push(gte(userTargets.endDate, now));
  }

  return db
    .select()
    .from(userTargets)
    .where(and(...conditions))
    .orderBy(desc(userTargets.active), desc(userTargets.startDate));
}

/**
 * Get active target by type
 */
export async function getActiveTarget(
  userId: string,
  targetType: 'WEEKLY' | 'MONTHLY' | 'YEARLY'
): Promise<UserTarget | null> {
  const now = new Date();
  
  const [target] = await db
    .select()
    .from(userTargets)
    .where(
      and(
        eq(userTargets.userId, userId),
        eq(userTargets.targetType, targetType),
        eq(userTargets.active, true),
        lte(userTargets.startDate, now),
        gte(userTargets.endDate, now)
      )
    )
    .limit(1);

  return target || null;
}

/**
 * Get target with calculated progress
 */
export async function getTargetWithProgress(
  userId: string,
  targetId: string
): Promise<TargetWithProgress | null> {
  const [target] = await db
    .select()
    .from(userTargets)
    .where(and(eq(userTargets.id, targetId), eq(userTargets.userId, userId)))
    .limit(1);

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
  try {
    const now = new Date();
    
    // Get today's date in Malaysia timezone (GMT+8)
    const malaysiaOffset = 8 * 60; // 8 hours in minutes
    const malaysiaTime = new Date(now.getTime() + malaysiaOffset * 60 * 1000);
    
    // Get start of today in Malaysia (00:00:00 Malaysia time)
    const todayMalaysiaStart = new Date(Date.UTC(
      malaysiaTime.getUTCFullYear(),
      malaysiaTime.getUTCMonth(),
      malaysiaTime.getUTCDate(),
      0, 0, 0, 0
    ));
    
    // Get end of today in Malaysia (23:59:59 Malaysia time)
    const todayMalaysiaEnd = new Date(Date.UTC(
      malaysiaTime.getUTCFullYear(),
      malaysiaTime.getUTCMonth(),
      malaysiaTime.getUTCDate(),
      23, 59, 59, 999
    ));
    
    const activeTargets = await db
      .select()
      .from(userTargets)
      .where(
        and(
          eq(userTargets.userId, userId),
          eq(userTargets.active, true),
          lte(userTargets.startDate, todayMalaysiaEnd),   // Target starts on or before today
          gte(userTargets.endDate, todayMalaysiaStart)    // Target ends on or after today
        )
      )
      .orderBy(desc(userTargets.createdAt));

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
  } catch (error) {
    console.error('[getActiveTargetsWithProgress] Error:', error);
    // Return empty array on error to prevent dashboard crash
    return [];
  }
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
  const summaries = await db
    .select()
    .from(dailySummaries)
    .where(
      and(
        eq(dailySummaries.userId, userId),
        gte(dailySummaries.tradeDate, target.startDate),
        lte(dailySummaries.tradeDate, target.endDate)
      )
    );

  // Calculate totals
  const totalTrades = summaries.reduce((sum, s) => sum + s.totalTrades, 0);
  const totalWins = summaries.reduce((sum, s) => sum + s.totalWins, 0);
  const totalSopCompliant = summaries.reduce((sum, s) => sum + s.totalSopFollowed, 0);
  const totalProfitUsd = summaries.reduce((sum, s) => sum + s.totalProfitLossUsd, 0);

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
  const targetStartDate = target.startDate;
  const targetEndDate = target.endDate;
  
  const daysTotal = Math.ceil(
    (targetEndDate.getTime() - targetStartDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysElapsed = Math.ceil(
    (now.getTime() - targetStartDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysRemaining = Math.max(
    Math.ceil((targetEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
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
  
  if (now > targetEndDate) {
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
    active: boolean;
  }>
): Promise<UserTarget> {
  const [updated] = await db
    .update(userTargets)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(userTargets.id, targetId), eq(userTargets.userId, userId)))
    .returning();

  return updated;
}

/**
 * Delete a target
 */
export async function deleteTarget(
  userId: string,
  targetId: string
): Promise<void> {
  await db
    .delete(userTargets)
    .where(and(eq(userTargets.id, targetId), eq(userTargets.userId, userId)));
}

/**
 * Deactivate a target
 */
export async function deactivateTarget(
  userId: string,
  targetId: string
): Promise<UserTarget> {
  const [deactivated] = await db
    .update(userTargets)
    .set({ active: false, updatedAt: new Date() })
    .where(and(eq(userTargets.id, targetId), eq(userTargets.userId, userId)))
    .returning();

  return deactivated;
}

/**
 * Get target suggestions based on historical performance
 */
export async function getTargetSuggestions(
  userId: string,
  targetType: 'WEEKLY' | 'MONTHLY' | 'YEARLY'
): Promise<{
  suggestedWinRate: number;
  suggestedSopRate: number;
  suggestedProfitUsd: number;
  reasoning: string;
}> {
  // Get last 30 days of performance
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const summaries = await db
    .select()
    .from(dailySummaries)
    .where(
      and(
        eq(dailySummaries.userId, userId),
        gte(dailySummaries.tradeDate, thirtyDaysAgo)
      )
    );

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
  const totalSopCompliant = summaries.reduce((sum, s) => sum + (s.totalSopFollowed || 0), 0);
  const totalProfit = summaries.reduce((sum, s) => sum + s.totalProfitLossUsd, 0);
  const avgProfitPerDay = summaries.length > 0 ? totalProfit / summaries.length : 0;

  const currentWinRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 50;
  const currentSopRate = totalTrades > 0 ? (totalSopCompliant / totalTrades) * 100 : 70;

  // Ensure no NaN values
  const safeWinRate = isNaN(currentWinRate) ? 50 : currentWinRate;
  const safeSopRate = isNaN(currentSopRate) ? 70 : currentSopRate;

  // Suggest 5-10% improvement
  const suggestedWinRate = Math.min(Math.round((safeWinRate * 1.05) * 10) / 10, 100);
  const suggestedSopRate = Math.min(Math.round((safeSopRate * 1.05) * 10) / 10, 100);
  
  // Calculate profit based on target type
  let daysInPeriod = 7;
  if (targetType === 'MONTHLY') daysInPeriod = 30;
  if (targetType === 'YEARLY') daysInPeriod = 365;
  
  // If profit is negative or zero, suggest a modest positive target
  let suggestedProfitUsd: number;
  if (avgProfitPerDay > 0) {
    suggestedProfitUsd = Math.round(avgProfitPerDay * daysInPeriod * 1.1); // 10% improvement
  } else {
    // Suggest modest targets based on period
    suggestedProfitUsd = targetType === 'WEEKLY' ? 500 : targetType === 'MONTHLY' ? 2000 : 20000;
  }

  return {
    suggestedWinRate,
    suggestedSopRate,
    suggestedProfitUsd: Math.max(suggestedProfitUsd, 100),
    reasoning: `Based on your last 30 days (${safeWinRate.toFixed(1)}% win rate, ${safeSopRate.toFixed(1)}% SOP), targeting 5-10% improvement`,
  };
}
