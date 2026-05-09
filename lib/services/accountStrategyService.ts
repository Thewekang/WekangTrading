/**
 * Account Strategy Service
 * CRUD for per-symbol strategy playbook entries, scoped to tradingAccountId.
 */

import { db } from '../db';
import { accountStrategies } from '../db/schema';
import { eq, and, asc } from 'drizzle-orm';
import type { CreateStrategyInput, UpdateStrategyInput } from '../validations';

// ============================================
// QUERIES
// ============================================

/** Returns all active strategies for an account, ordered by sortOrder. */
export async function listStrategies(tradingAccountId: string, userId: string) {
  return db
    .select()
    .from(accountStrategies)
    .where(
      and(
        eq(accountStrategies.tradingAccountId, tradingAccountId),
        eq(accountStrategies.userId, userId),
        eq(accountStrategies.isActive, true),
      ),
    )
    .orderBy(asc(accountStrategies.sortOrder), asc(accountStrategies.createdAt));
}

/** Returns a single strategy — verifies account + user ownership. */
export async function getStrategy(
  strategyId: string,
  tradingAccountId: string,
  userId: string,
) {
  const [strategy] = await db
    .select()
    .from(accountStrategies)
    .where(
      and(
        eq(accountStrategies.id, strategyId),
        eq(accountStrategies.tradingAccountId, tradingAccountId),
        eq(accountStrategies.userId, userId),
      ),
    )
    .limit(1);
  return strategy ?? null;
}

// ============================================
// MUTATIONS
// ============================================

/** Creates a new strategy card on an account. */
export async function createStrategy(
  tradingAccountId: string,
  userId: string,
  input: CreateStrategyInput,
) {
  const [created] = await db
    .insert(accountStrategies)
    .values({
      tradingAccountId,
      userId,
      symbol: input.symbol,
      instrumentType: input.instrumentType,
      defaultLotSize: input.defaultLotSize ?? null,
      stopLossPoints: input.stopLossPoints ?? null,
      tp1Points: input.tp1Points ?? null,
      tp2Points: input.tp2Points ?? null,
      riskPercentPerTrade: input.riskPercentPerTrade ?? 1.0,
      maxTradesPerDay: input.maxTradesPerDay ?? null,
      tickSize: input.tickSize ?? null,
      tickValue: input.tickValue ?? null,
      pipValue: input.pipValue ?? null,
      bestSessions: input.bestSessions ? JSON.stringify(input.bestSessions) : null,
      entryNotes: input.entryNotes ?? null,
      sortOrder: input.sortOrder ?? 0,
      isActive: true,
    })
    .returning();
  return created;
}

/** Updates a strategy. Ownership pre-verified by caller. */
export async function updateStrategy(
  strategyId: string,
  tradingAccountId: string,
  userId: string,
  patch: UpdateStrategyInput,
) {
  // Verify ownership first
  const existing = await getStrategy(strategyId, tradingAccountId, userId);
  if (!existing) return null;

  const [updated] = await db
    .update(accountStrategies)
    .set({
      ...(patch.symbol !== undefined && { symbol: patch.symbol }),
      ...(patch.instrumentType !== undefined && { instrumentType: patch.instrumentType }),
      ...(patch.defaultLotSize !== undefined && { defaultLotSize: patch.defaultLotSize }),
      ...(patch.stopLossPoints !== undefined && { stopLossPoints: patch.stopLossPoints }),
      ...(patch.tp1Points !== undefined && { tp1Points: patch.tp1Points }),
      ...(patch.tp2Points !== undefined && { tp2Points: patch.tp2Points }),
      ...(patch.riskPercentPerTrade !== undefined && {
        riskPercentPerTrade: patch.riskPercentPerTrade,
      }),
      ...(patch.maxTradesPerDay !== undefined && { maxTradesPerDay: patch.maxTradesPerDay }),
      ...(patch.tickSize !== undefined && { tickSize: patch.tickSize }),
      ...(patch.tickValue !== undefined && { tickValue: patch.tickValue }),
      ...(patch.pipValue !== undefined && { pipValue: patch.pipValue }),
      ...(patch.bestSessions !== undefined && {
        bestSessions: patch.bestSessions ? JSON.stringify(patch.bestSessions) : null,
      }),
      ...(patch.entryNotes !== undefined && { entryNotes: patch.entryNotes }),
      ...(patch.sortOrder !== undefined && { sortOrder: patch.sortOrder }),
    })
    .where(eq(accountStrategies.id, strategyId))
    .returning();
  return updated ?? null;
}

/** Soft-deletes (deactivates) a strategy. */
export async function deleteStrategy(
  strategyId: string,
  tradingAccountId: string,
  userId: string,
) {
  const existing = await getStrategy(strategyId, tradingAccountId, userId);
  if (!existing) return false;

  await db
    .update(accountStrategies)
    .set({ isActive: false })
    .where(eq(accountStrategies.id, strategyId));
  return true;
}

/**
 * Reorders strategies by updating sortOrder.
 * orderedIds must be all strategy IDs for the account in desired order.
 */
export async function reorderStrategies(
  tradingAccountId: string,
  userId: string,
  orderedIds: string[],
) {
  await Promise.all(
    orderedIds.map((id, index) =>
      db
        .update(accountStrategies)
        .set({ sortOrder: index })
        .where(
          and(
            eq(accountStrategies.id, id),
            eq(accountStrategies.tradingAccountId, tradingAccountId),
            eq(accountStrategies.userId, userId),
          ),
        ),
    ),
  );
}

// ============================================
// HELPERS
// ============================================

/** Parses the JSON bestSessions field back to a string array. */
export function parseBestSessions(raw: string | null): string[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}
