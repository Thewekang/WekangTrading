/**
 * Admin: Recalculate Daily Summaries
 * POST /api/admin/recalculate-summaries
 *
 * Re-derives all daily_summaries rows from individual_trades, grouped by
 * userId + tradingAccountId + date. This fixes any mismatch between
 * individual_trades and daily_summaries that can occur after:
 *   - Multi-account migration (old summaries had tradingAccountId = NULL)
 *   - CSV/bulk imports that didn't pass accountId through
 *   - Schema changes requiring summary backfill
 *
 * Optional body: { userId: string } — recalculate only one user (admin use)
 * Without body: recalculates all users
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, individualTrades } from '@/lib/db/schema';
import { updateDailySummaryForDate } from '@/lib/services/dailySummaryService';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } }, { status: 403 });
  }

  let targetUserId: string | undefined;
  try {
    const body = await request.json().catch(() => ({}));
    targetUserId = body.userId ?? undefined;
  } catch {
    // no body — recalculate all users
  }

  try {
    // Fetch all trades (or scoped to one user)
    const query = db
      .select({
        userId: individualTrades.userId,
        tradeTimestamp: individualTrades.tradeTimestamp,
        tradingAccountId: individualTrades.tradingAccountId,
      })
      .from(individualTrades);

    const allTrades = targetUserId
      ? await query.where(eq(individualTrades.userId, targetUserId))
      : await query;

    // Group: userId → accountId (null OK) → Set<dateStr>
    const userAccountDates = new Map<string, Map<string | null, Set<string>>>();

    for (const trade of allTrades) {
      const dateKey = trade.tradeTimestamp.toISOString().split('T')[0];
      const accountId = trade.tradingAccountId ?? null;

      if (!userAccountDates.has(trade.userId)) {
        userAccountDates.set(trade.userId, new Map());
      }
      const accountMap = userAccountDates.get(trade.userId)!;
      if (!accountMap.has(accountId)) {
        accountMap.set(accountId, new Set());
      }
      accountMap.get(accountId)!.add(dateKey);
    }

    let totalUpdated = 0;
    const usersSummary: { userId: string; email: string; dateAccountPairs: number }[] = [];

    for (const [userId, accountMap] of userAccountDates) {
      const [userRow] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      let dateAccountPairs = 0;

      for (const [accountId, dates] of accountMap) {
        for (const dateStr of dates) {
          await updateDailySummaryForDate(userId, new Date(dateStr), accountId ?? undefined);
          totalUpdated++;
          dateAccountPairs++;
        }
      }

      usersSummary.push({ userId, email: userRow?.email ?? userId, dateAccountPairs });
    }

    return NextResponse.json({
      success: true,
      data: {
        totalSummariesRecalculated: totalUpdated,
        usersProcessed: usersSummary.length,
        users: usersSummary,
      },
      message: `Recalculated ${totalUpdated} daily summaries across ${usersSummary.length} user(s)`,
    });
  } catch (error) {
    console.error('[recalculate-summaries]', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Recalculation failed' } }, { status: 500 });
  }
}
