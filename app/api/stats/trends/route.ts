/**
 * API Route: GET /api/stats/trends
 * Get daily performance trends for a date range
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDailyTrends } from '@/lib/services/trendAnalysisService';
import { subDays } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30', 10);
    const userId = searchParams.get('userId') || session.user.id;

    // Admin can view any user's trends
    if (userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    const endDate = new Date();
    const startDate = subDays(endDate, days);

    const trends = await getDailyTrends(userId, startDate, endDate);

    return NextResponse.json({
      success: true,
      data: trends,
    });
  } catch (error) {
    console.error('Error fetching trends:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch trends' } },
      { status: 500 }
    );
  }
}
