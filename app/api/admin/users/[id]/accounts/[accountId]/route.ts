/**
 * DELETE /api/admin/users/[id]/accounts/[accountId]
 * Admin: hard-delete a specific trading account and all related data.
 * Manual cascade required — PRAGMA foreign_keys is OFF in libsql by default,
 * and several tables use onDelete:'set null' (not cascade) anyway.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  tradingAccounts, accountRules, withdrawalEvents,
  individualTrades, dailySummaries, userTargets,
  userBadges, streaks, userStats,
  disciplineTrackerRows, disciplineTrackerSettings,
  userRankings,
} from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; accountId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const { id: userId, accountId } = await params;

    // Verify the account belongs to the specified user before deleting
    const [account] = await db
      .select({ id: tradingAccounts.id, name: tradingAccounts.name })
      .from(tradingAccounts)
      .where(and(eq(tradingAccounts.id, accountId), eq(tradingAccounts.userId, userId)))
      .limit(1);

    if (!account) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Account not found' } },
        { status: 404 }
      );
    }

    // Manual cascade — PRAGMA foreign_keys is OFF in libsql by default,
    // and trades/summaries/targets etc. are onDelete:'set null' not cascade.
    await db.delete(accountRules).where(eq(accountRules.tradingAccountId, accountId));
    await db.delete(withdrawalEvents).where(eq(withdrawalEvents.tradingAccountId, accountId));
    await db.delete(individualTrades).where(eq(individualTrades.tradingAccountId, accountId));
    await db.delete(dailySummaries).where(eq(dailySummaries.tradingAccountId, accountId));
    await db.delete(userTargets).where(eq(userTargets.tradingAccountId, accountId));
    await db.delete(userBadges).where(eq(userBadges.tradingAccountId, accountId));
    await db.delete(streaks).where(eq(streaks.tradingAccountId, accountId));
    await db.delete(userStats).where(eq(userStats.tradingAccountId, accountId));
    await db.delete(disciplineTrackerRows).where(eq(disciplineTrackerRows.tradingAccountId, accountId));
    await db.delete(disciplineTrackerSettings).where(eq(disciplineTrackerSettings.tradingAccountId, accountId));
    await db.delete(userRankings).where(eq(userRankings.tradingAccountId, accountId));
    await db.delete(tradingAccounts).where(eq(tradingAccounts.id, accountId));

    return NextResponse.json({ success: true, message: `Account "${account.name}" deleted` });
  } catch (error) {
    console.error('[DELETE /api/admin/users/[id]/accounts/[accountId]]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete account' } },
      { status: 500 }
    );
  }
}
