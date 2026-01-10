/**
 * API Routes: /api/stats/best-sop
 * GET - Get best performing SOP type by period
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getBestSopType } from '@/lib/services/sopTypeService';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const period = (searchParams.get('period') || 'month') as 'week' | 'month' | 'year' | 'all';

    // Get best SOP type
    const bestSop = await getBestSopType(session.user.id, period);

    return NextResponse.json(
      { success: true, data: bestSop },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/stats/best-sop]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
