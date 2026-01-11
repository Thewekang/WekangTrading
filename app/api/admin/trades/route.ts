/**
 * Admin All Trades API
 * GET: View all trades across all users (paginated, filterable)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { individualTrades, users as usersTable } from '@/lib/db/schema';
import { eq, and, gte, lte, like, or, count, desc } from 'drizzle-orm';

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

    // Build where clause
    const where: any = {};

    if (userId) where.userId = userId;
    if (result) where.result = result;
    if (session_) where.marketSession = session_;
    
    if (dateFrom || dateTo) {
      where.tradeTimestamp = {};
      if (dateFrom) where.tradeTimestamp.gte = new Date(dateFrom);
      if (dateTo) where.tradeTimestamp.lte = new Date(dateTo);
    }

    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    // For now, return empty result - TODO: implement admin getAllTrades with filters
    return NextResponse.json({
      success: false,
      error: { code: 'NOT_IMPLEMENTED', message: 'Admin trades list temporarily unavailable during migration' },
    }, { status: 501 });
  } catch (error) {
    console.error('Error fetching trades:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch trades' } },
      { status: 500 }
    );
  }
}
