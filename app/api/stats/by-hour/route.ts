/**
 * Hourly Statistics API
 * GET /api/stats/by-hour?period=week|month|year|all
 * 
 * Returns trading performance broken down by hour (0-23 UTC)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getHourlyStats } from '@/lib/services/statsService';
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

    // Get hourly stats
    const stats = await getHourlyStats(session.user.id, period);

    return NextResponse.json({
      success: true,
      data: {
        hours: stats,
        period,
      },
    });

  } catch (error) {
    console.error('[Hourly Stats API Error]', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to fetch hourly statistics' 
        } 
      },
      { status: 500 }
    );
  }
}
