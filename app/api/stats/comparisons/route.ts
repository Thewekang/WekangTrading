/**
 * API Route: GET /api/stats/comparisons
 * Get week-over-week or month-over-month comparisons
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getWeeklyComparison, getMonthlyComparison } from '@/lib/services/trendAnalysisService';

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
    const type = searchParams.get('type') || 'weekly'; // 'weekly' or 'monthly'
    const userId = searchParams.get('userId') || session.user.id;

    // Admin can view any user's comparisons
    if (userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    const comparison = type === 'monthly' 
      ? await getMonthlyComparison(userId)
      : await getWeeklyComparison(userId);

    return NextResponse.json({
      success: true,
      data: comparison,
    });
  } catch (error) {
    console.error('Error fetching comparison:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch comparison' } },
      { status: 500 }
    );
  }
}
