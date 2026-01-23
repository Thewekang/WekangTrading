/**
 * GET /api/streaks - Get user's streaks
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getStreakSummary } from '@/lib/services/streakService';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const streaks = await getStreakSummary(session.user.id);

    return NextResponse.json({
      success: true,
      data: streaks,
    });
  } catch (error) {
    console.error('Error fetching streaks:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch streaks' } },
      { status: 500 }
    );
  }
}
