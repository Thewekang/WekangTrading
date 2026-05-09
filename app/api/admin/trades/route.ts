/**
 * Admin All Trades API
 * GET: View all trades across all users (paginated, filterable)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { individualTrades, users as usersTable, tradingAccounts } from '@/lib/db/schema';
import { eq, and, gte, lte, like, or, count, desc, SQL, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const skip = (page - 1) * pageSize;

    // Filters
    const userId = searchParams.get('userId');
    const accountId = searchParams.get('accountId');
    const result = searchParams.get('result');
    const session_ = searchParams.get('session');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const search = searchParams.get('search');

    // Build where conditions array
    const conditions: SQL[] = [];

    if (userId) {
      conditions.push(eq(individualTrades.userId, userId));
    }
    if (accountId) {
      conditions.push(eq(individualTrades.tradingAccountId, accountId));
    }
    if (result) {
      conditions.push(eq(individualTrades.result, result as any));
    }
    if (session_) {
      conditions.push(eq(individualTrades.marketSession, session_ as any));
    }
    if (dateFrom) {
      conditions.push(gte(individualTrades.tradeTimestamp, new Date(dateFrom)));
    }
    if (dateTo) {
      conditions.push(lte(individualTrades.tradeTimestamp, new Date(dateTo)));
    }
    if (search) {
      // Search in user name, email, or trade notes
      conditions.push(
        or(
          like(usersTable.name, `%${search}%`),
          like(usersTable.email, `%${search}%`),
          like(individualTrades.notes, `%${search}%`)
        )!
      );
    }

    // Combine conditions
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Run count, stats, and paginated data queries in parallel
    const [
      [{ total }],
      [statsRow],
      trades,
    ] = await Promise.all([
      // Total count (all entry types)
      db
        .select({ total: count() })
        .from(individualTrades)
        .leftJoin(usersTable, eq(individualTrades.userId, usersTable.id))
        .leftJoin(tradingAccounts, eq(individualTrades.tradingAccountId, tradingAccounts.id))
        .where(whereClause),

      // Aggregate stats across the full filtered set
      db
        .select({
          totalTransactions: sql<number>`COUNT(CASE WHEN ${individualTrades.entryType} = 'TRANSACTION' THEN 1 END)`,
          totalWins: sql<number>`COUNT(CASE WHEN ${individualTrades.entryType} = 'TRANSACTION' AND ${individualTrades.result} = 'WIN' THEN 1 END)`,
          totalSopFollowed: sql<number>`COUNT(CASE WHEN ${individualTrades.entryType} = 'TRANSACTION' AND ${individualTrades.sopFollowed} = 1 THEN 1 END)`,
          netPnl: sql<number>`COALESCE(SUM(${individualTrades.profitLossUsd}), 0)`,
        })
        .from(individualTrades)
        .leftJoin(usersTable, eq(individualTrades.userId, usersTable.id))
        .leftJoin(tradingAccounts, eq(individualTrades.tradingAccountId, tradingAccounts.id))
        .where(whereClause),

      // Paginated trade rows
      db
        .select({
          id: individualTrades.id,
          userId: individualTrades.userId,
          tradingAccountId: individualTrades.tradingAccountId,
          tradeTimestamp: individualTrades.tradeTimestamp,
          result: individualTrades.result,
          sopFollowed: individualTrades.sopFollowed,
          profitLossUsd: individualTrades.profitLossUsd,
          marketSession: individualTrades.marketSession,
          notes: individualTrades.notes,
          createdAt: individualTrades.createdAt,
          updatedAt: individualTrades.updatedAt,
          userName: usersTable.name,
          userEmail: usersTable.email,
          accountName: tradingAccounts.name,
        })
        .from(individualTrades)
        .leftJoin(usersTable, eq(individualTrades.userId, usersTable.id))
        .leftJoin(tradingAccounts, eq(individualTrades.tradingAccountId, tradingAccounts.id))
        .where(whereClause)
        .orderBy(desc(individualTrades.tradeTimestamp))
        .limit(pageSize)
        .offset(skip),
    ]);

    const totalTx = Number(statsRow.totalTransactions);
    const totalWins = Number(statsRow.totalWins);
    const totalSop = Number(statsRow.totalSopFollowed);

    return NextResponse.json({
      success: true,
      data: {
        trades,
        stats: {
          totalTrades: totalTx,
          totalWins,
          totalSopFollowed: totalSop,
          winRate: totalTx > 0 ? (totalWins / totalTx) * 100 : 0,
          sopRate: totalTx > 0 ? (totalSop / totalTx) * 100 : 0,
          netPnl: Number(statsRow.netPnl),
        },
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching trades:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch trades' } },
      { status: 500 }
    );
  }
}
