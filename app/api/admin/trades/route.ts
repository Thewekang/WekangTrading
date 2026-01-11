/**
 * Admin All Trades API
 * GET: View all trades across all users (paginated, filterable)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { individualTrades, users as usersTable } from '@/lib/db/schema';
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

    // Get total count
    const [{ total }] = await db
      .select({ total: count() })
      .from(individualTrades)
      .leftJoin(usersTable, eq(individualTrades.userId, usersTable.id))
      .where(whereClause);

    // Get trades with user info
    const trades = await db
      .select({
        id: individualTrades.id,
        userId: individualTrades.userId,
        tradeTimestamp: individualTrades.tradeTimestamp,
        result: individualTrades.result,
        sopFollowed: individualTrades.sopFollowed,
        profitLossUsd: individualTrades.profitLossUsd,
        marketSession: individualTrades.marketSession,
        notes: individualTrades.notes,
        sopTypeId: individualTrades.sopTypeId,
        dailySummaryId: individualTrades.dailySummaryId,
        createdAt: individualTrades.createdAt,
        updatedAt: individualTrades.updatedAt,
        userName: usersTable.name,
        userEmail: usersTable.email,
      })
      .from(individualTrades)
      .leftJoin(usersTable, eq(individualTrades.userId, usersTable.id))
      .where(whereClause)
      .orderBy(desc(individualTrades.tradeTimestamp))
      .limit(pageSize)
      .offset(skip);

    return NextResponse.json({
      success: true,
      data: {
        trades,
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
