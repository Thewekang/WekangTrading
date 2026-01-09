/**
 * Individual Target API
 * GET /api/targets/[id] - Get specific target with progress
 * PATCH /api/targets/[id] - Update a target
 * DELETE /api/targets/[id] - Delete a target
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { 
  getTargetWithProgress, 
  updateTarget, 
  deleteTarget,
  deactivateTarget 
} from '@/lib/services/targetService';
import { z } from 'zod';

// Validation schema for updating a target
const updateTargetSchema = z.object({
  targetWinRate: z.number().min(0).max(100).optional(),
  targetSopRate: z.number().min(0).max(100).optional(),
  targetProfitUsd: z.number().optional(),
  notes: z.string().max(500).optional(),
  active: z.boolean().optional(),
});

/**
 * GET /api/targets/[id]
 * Get a specific target with calculated progress
 */
export async function GET(
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
    const target = await getTargetWithProgress(session.user.id, id);

    if (!target) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Target not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { target },
    });

  } catch (error) {
    console.error('[Get Target API Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch target',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/targets/[id]
 * Update a target
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

    // Parse and validate request body
    const body = await req.json();
    const validation = updateTargetSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid update data',
            details: validation.error.format(),
          },
        },
        { status: 400 }
      );
    }

    const { id } = await params;
    const target = await updateTarget(session.user.id, id, validation.data);

    return NextResponse.json({
      success: true,
      data: { target },
      message: 'Target updated successfully',
    });

  } catch (error: any) {
    console.error('[Update Target API Error]', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Target not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update target',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/targets/[id]
 * Delete a target
 */
export async function DELETE(
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
    await deleteTarget(session.user.id, id);

    return NextResponse.json({
      success: true,
      message: 'Target deleted successfully',
    });

  } catch (error: any) {
    console.error('[Delete Target API Error]', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Target not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete target',
        },
      },
      { status: 500 }
    );
  }
}
