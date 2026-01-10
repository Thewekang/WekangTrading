import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { checkDailyLosses, getTodayTradeResults } from '@/lib/services/dailyLossService';

/**
 * GET /api/daily-loss-check
 * Check if user has reached daily loss limit
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const [lossCheck, todayResults] = await Promise.all([
      checkDailyLosses(session.user.id),
      getTodayTradeResults(session.user.id)
    ]);

    return NextResponse.json({
      success: true,
      data: {
        lossesToday: lossCheck.lossesToday,
        limitReached: lossCheck.limitReached,
        remainingLosses: lossCheck.remainingLosses,
        todayResults
      }
    });
  } catch (error) {
    console.error('Error checking daily losses:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to check daily losses' } },
      { status: 500 }
    );
  }
}
