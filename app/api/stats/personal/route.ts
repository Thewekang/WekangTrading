/**
 * Personal Statistics API
 * GET /api/stats/personal?period=week|month|year|all
 * 
 * Returns aggregated trading statistics for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPersonalStats, getDailyTrends } from '@/lib/services/statsService';
import { z } from 'zod';

// Query params validation
const querySchema = z.object({
  period: z.enum(['week', 'month', 'year', 'all']).optional().default('month'),
});

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Parse and validate query params
    const { searchParams } = new URL(req.url);
    const periodParam = searchParams.get('period') || 'month';
    
    const validation = querySchema.safeParse({ period: periodParam });
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid period parameter. Must be one of: week, month, year, all',
            details: validation.error.format()
          } 
        },
        { status: 400 }
      );
    }

    const { period } = validation.data;

    // Get stats and trends
    const [stats, trends] = await Promise.all([
      getPersonalStats(session.user.id, period),
      getDailyTrends(session.user.id, period === 'all' ? 'month' : period),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        stats,
        trends,
        period,
      },
    });

  } catch (error) {
    console.error('[Personal Stats API Error]', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to fetch statistics' 
        } 
      },
      { status: 500 }
    );
  }
}
