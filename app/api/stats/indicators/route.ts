/**
 * API Route: GET /api/stats/indicators
 * Get trend indicators (improving/declining/stable) for key metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTrendIndicators } from '@/lib/services/trendAnalysisService';

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
    const userId = searchParams.get('userId') || session.user.id;

    // Admin can view any user's indicators
    if (userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    const indicators = await getTrendIndicators(userId);

    return NextResponse.json({
      success: true,
      data: indicators,
    });
  } catch (error) {
    console.error('Error fetching indicators:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch indicators' } },
      { status: 500 }
    );
  }
}
