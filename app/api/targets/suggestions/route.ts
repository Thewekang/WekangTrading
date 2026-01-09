/**
 * Target Suggestions API
 * GET /api/targets/suggestions?targetType=WEEKLY|MONTHLY|YEARLY
 * 
 * Returns suggested target values based on historical performance
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTargetSuggestions } from '@/lib/services/targetService';
import { z } from 'zod';

const querySchema = z.object({
  targetType: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']),
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

    // Parse query params
    const { searchParams } = new URL(req.url);
    const targetTypeParam = searchParams.get('targetType');

    const validation = querySchema.safeParse({ targetType: targetTypeParam });
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid targetType. Must be WEEKLY, MONTHLY, or YEARLY',
          },
        },
        { status: 400 }
      );
    }

    const { targetType } = validation.data;

    const suggestions = await getTargetSuggestions(session.user.id, targetType);

    return NextResponse.json({
      success: true,
      data: suggestions,
    });

  } catch (error) {
    console.error('[Target Suggestions API Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to generate suggestions',
        },
      },
      { status: 500 }
    );
  }
}
