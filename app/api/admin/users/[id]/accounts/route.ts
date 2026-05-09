/**
 * GET /api/admin/users/[id]/accounts
 * Admin: list all trading accounts for a user with per-account stats.
 * Stats computed from individual_trades directly (single source of truth).
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { tradingAccounts, individualTrades } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const { id: userId } = await params;

    // Get all active accounts for this user
    const accounts = await db
      .select()
      .from(tradingAccounts)
      .where(and(eq(tradingAccounts.userId, userId), eq(tradingAccounts.active, true)))
      .orderBy(tradingAccounts.isDefault, tradingAccounts.createdAt);

    // Compute per-account stats from individual_trades (TRANSACTION only for counts/rates)
    const accountsWithStats = await Promise.all(
      accounts.map(async (account) => {
        const trades = await db
          .select({
            entryType: individualTrades.entryType,
            result: individualTrades.result,
            sopFollowed: individualTrades.sopFollowed,
            profitLossUsd: individualTrades.profitLossUsd,
          })
          .from(individualTrades)
          .where(
            and(
              eq(individualTrades.userId, userId),
              eq(individualTrades.tradingAccountId, account.id)
            )
          );

        const transactions = trades.filter((t) => t.entryType === 'TRANSACTION');
        const commissions = trades.filter((t) => t.entryType === 'COMMISSION');

        const totalTrades = transactions.length;
        const totalWins = transactions.filter((t) => t.result === 'WIN').length;
        const totalLosses = transactions.filter((t) => t.result === 'LOSS').length;
        const totalSopFollowed = transactions.filter((t) => t.sopFollowed === true).length;
        const grossPnl = transactions.reduce((sum, t) => sum + t.profitLossUsd, 0);
        const commissionTotal = commissions.reduce((sum, t) => sum + t.profitLossUsd, 0);
        const netPnl = grossPnl + commissionTotal;

        const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
        const sopRate = totalTrades > 0 ? (totalSopFollowed / totalTrades) * 100 : 0;

        return {
          id: account.id,
          name: account.name,
          accountType: account.accountType,
          currency: account.currency,
          startingBalance: account.startingBalance,
          isDefault: account.isDefault,
          createdAt: account.createdAt,
          stats: {
            totalTrades,
            totalWins,
            totalLosses,
            winRate: Math.round(winRate * 10) / 10,
            sopRate: Math.round(sopRate * 10) / 10,
            totalSopFollowed,
            grossPnl: Math.round(grossPnl * 100) / 100,
            commissionTotal: Math.round(commissionTotal * 100) / 100,
            netPnl: Math.round(netPnl * 100) / 100,
          },
        };
      })
    );

    return NextResponse.json({ success: true, data: accountsWithStats });
  } catch (error) {
    console.error('[GET /api/admin/users/[id]/accounts]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch accounts' } },
      { status: 500 }
    );
  }
}
