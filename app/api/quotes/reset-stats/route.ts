/**
 * Reset Quote Statistics API
 * POST /api/quotes/reset-stats - Reset all quote display counts to 0 (Admin only)
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { resetDisplayCounts } from '@/lib/services/quoteService';

/**
 * POST /api/quotes/reset-stats
 * Reset all quote display counts (Admin only)
 */
export async function POST() {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    // Reset all display counts
    await resetDisplayCounts();

    return NextResponse.json({
      success: true,
      message: 'All quote display counts have been reset to 0',
    });

  } catch (error) {
    console.error('[Reset Stats API Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to reset quote statistics',
        },
      },
      { status: 500 }
    );
  }
}
