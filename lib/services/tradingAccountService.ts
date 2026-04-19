/**
 * Trading Account Service
 * CRUD operations for user trading accounts.
 * Every account has optional 1:1 account_rules; auto-created on first rules update.
 */

import { db } from '../db';
import { tradingAccounts, accountRules } from '../db/schema';
import { eq, and } from 'drizzle-orm';

// ============================================
// TYPES
// ============================================

export interface CreateAccountInput {
  userId: string;
  name: string;
  accountType?: 'PROP_FIRM' | 'FUTURES' | 'CFD' | 'FOREX' | 'SHARE' | 'DEMO';
  currency?: string;
  startingBalance?: number;
}

export interface UpdateAccountInput {
  name?: string;
  accountType?: 'PROP_FIRM' | 'FUTURES' | 'CFD' | 'FOREX' | 'SHARE' | 'DEMO';
  currency?: string;
  startingBalance?: number;
  active?: boolean;
}

// ============================================
// QUERIES
// ============================================

/** Returns all active accounts for a user, default account first. */
export async function getUserAccounts(userId: string) {
  return db
    .select()
    .from(tradingAccounts)
    .where(and(eq(tradingAccounts.userId, userId), eq(tradingAccounts.active, true)))
    .orderBy(tradingAccounts.isDefault, tradingAccounts.createdAt);
}

/** Returns a single account — verifies ownership. */
export async function getAccount(accountId: string, userId: string) {
  const [account] = await db
    .select()
    .from(tradingAccounts)
    .where(and(eq(tradingAccounts.id, accountId), eq(tradingAccounts.userId, userId)))
    .limit(1);
  return account ?? null;
}

/** Returns the user's default account. Creates one if none exists. */
export async function getOrCreateDefaultAccount(userId: string, userName: string) {
  const accounts = await getUserAccounts(userId);

  const defaultAccount = accounts.find((a) => a.isDefault) ?? accounts[0] ?? null;
  if (defaultAccount) return defaultAccount;

  // First-time: create "Main Account"
  return createAccount({
    userId,
    name: `${userName}'s Account`,
    accountType: 'FUTURES',
    startingBalance: 0,
  });
}

// ============================================
// MUTATIONS
// ============================================

/** Creates a new trading account. First account gets isDefault=true automatically. */
export async function createAccount(input: CreateAccountInput) {
  const existing = await getUserAccounts(input.userId);
  const isFirst = existing.length === 0;

  const [created] = await db
    .insert(tradingAccounts)
    .values({
      userId: input.userId,
      name: input.name,
      accountType: input.accountType ?? 'FUTURES',
      currency: input.currency ?? 'USD',
      startingBalance: input.startingBalance ?? 0,
      isDefault: isFirst,
      active: true,
    })
    .returning();

  return created;
}

/** Updates a trading account. Ownership must be pre-verified by caller. */
export async function updateAccount(accountId: string, input: UpdateAccountInput) {
  const [updated] = await db
    .update(tradingAccounts)
    .set({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.accountType !== undefined && { accountType: input.accountType }),
      ...(input.currency !== undefined && { currency: input.currency }),
      ...(input.startingBalance !== undefined && { startingBalance: input.startingBalance }),
      ...(input.active !== undefined && { active: input.active }),
    })
    .where(eq(tradingAccounts.id, accountId))
    .returning();

  return updated ?? null;
}

/** Soft-deletes an account (sets active=false). Cannot delete the default account. */
export async function deactivateAccount(accountId: string, userId: string) {
  const account = await getAccount(accountId, userId);
  if (!account) throw new Error('Account not found');
  if (account.isDefault) throw new Error('Cannot deactivate the default account');

  return updateAccount(accountId, { active: false });
}

/**
 * Sets accountId as the user's default account.
 * Clears isDefault on all other accounts for the user.
 */
export async function setDefaultAccount(accountId: string, userId: string) {
  // Verify ownership
  const account = await getAccount(accountId, userId);
  if (!account) throw new Error('Account not found');

  // Clear all defaults for this user
  await db
    .update(tradingAccounts)
    .set({ isDefault: false })
    .where(eq(tradingAccounts.userId, userId));

  // Set new default
  const [updated] = await db
    .update(tradingAccounts)
    .set({ isDefault: true })
    .where(eq(tradingAccounts.id, accountId))
    .returning();

  return updated;
}

/** Returns account_rules for an account, or null if not configured. */
export async function getAccountRules(accountId: string) {
  const [rules] = await db
    .select()
    .from(accountRules)
    .where(eq(accountRules.tradingAccountId, accountId))
    .limit(1);
  return rules ?? null;
}

/** Upserts account_rules for an account. */
export async function upsertAccountRules(
  accountId: string,
  input: {
    dailyDrawdownPct?: number | null;
    totalDrawdownPct?: number | null;
    consistencyTargetPct?: number | null;
    cycleTargetProfitUsd?: number | null;
  }
) {
  const existing = await getAccountRules(accountId);

  if (existing) {
    const [updated] = await db
      .update(accountRules)
      .set({
        dailyDrawdownPct: input.dailyDrawdownPct,
        totalDrawdownPct: input.totalDrawdownPct,
        consistencyTargetPct: input.consistencyTargetPct,
        cycleTargetProfitUsd: input.cycleTargetProfitUsd,
      })
      .where(eq(accountRules.tradingAccountId, accountId))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(accountRules)
    .values({
      tradingAccountId: accountId,
      dailyDrawdownPct: input.dailyDrawdownPct ?? null,
      totalDrawdownPct: input.totalDrawdownPct ?? null,
      consistencyTargetPct: input.consistencyTargetPct ?? null,
      cycleTargetProfitUsd: input.cycleTargetProfitUsd ?? null,
    })
    .returning();

  return created;
}
