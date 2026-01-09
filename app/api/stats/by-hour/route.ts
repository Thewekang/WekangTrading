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
  timezone: z
    .string()
    .optional()
    .default('0')
    .transform((val) => {
      const offset = parseInt(val, 10);
      // Validate timezone offset range (-12 to +14)
      if (isNaN(offset) || offset < -12 || offset > 14) {
        return 0; // Default to UTC if invalid
      }
      return offset;
    }),
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
    const timezoneParam = searchParams.get('timezone') || '0';
    
    const validation = querySchema.safeParse({ 
      period: periodParam,
      timezone: timezoneParam 
    });
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid query parameters',
            details: validation.error.format()
          } 
        },
        { status: 400 }
      );
    }

    const { period, timezone } = validation.data;

    // Get hourly stats with timezone conversion
    const stats = await getHourlyStats(session.user.id, period, timezone);

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
