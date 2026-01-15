/**
 * Target Complete API
 * PATCH /api/targets/[id]/complete - Mark target as completed manually
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { completeTarget } from '@/lib/services/targetService';

/**
 * PATCH /api/targets/[id]/complete
 * Mark a target as manually completed
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    // Complete the target
    const success = await completeTarget(session.user.id, id);

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Target not found or already completed',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Target marked as completed successfully',
    });

  } catch (error) {
    console.error('[Complete Target API Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to complete target',
        },
      },
      { status: 500 }
    );
  }
}
