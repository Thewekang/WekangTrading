import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserRanking, invalidateUserRanking } from '@/lib/services/rankingService';

/**
 * GET /api/stats/ranking
 * Get current user's ranking
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const ranking = await getUserRanking(session.user.id);

    return NextResponse.json({ success: true, data: ranking });
  } catch (error) {
    console.error('Error fetching user ranking:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch ranking' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/stats/ranking
 * Invalidate ranking cache and force recalculation
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    await invalidateUserRanking(session.user.id);
    const ranking = await getUserRanking(session.user.id);

    return NextResponse.json({ success: true, data: ranking });
  } catch (error) {
    console.error('Error refreshing user ranking:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to refresh ranking' } },
      { status: 500 }
    );
  }
}
