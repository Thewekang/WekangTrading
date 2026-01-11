/**
 * Targets API
 * GET /api/targets - Get all targets for authenticated user
 * POST /api/targets - Create a new target
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createTarget, getTargets, getActiveTargetsWithProgress } from '@/lib/services/targetService';
import { z } from 'zod';

// Validation schema for creating a target
const createTargetSchema = z.object({
  targetType: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']),
  targetWinRate: z.number().min(0).max(100),
  targetSopRate: z.number().min(0).max(100),
  targetProfitUsd: z.number().optional(),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
  notes: z.string().max(500).optional(),
}).refine(
  (data) => data.endDate > data.startDate,
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
);

// Query params schema
const querySchema = z.object({
  active: z.string().optional().transform((val) => val === 'true'),
  targetType: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']).optional(),
  includeExpired: z.string().optional().transform((val) => val === 'true'),
  withProgress: z.string().optional().transform((val) => val === 'true'),
});

/**
 * GET /api/targets
 * Get all targets for the authenticated user
 */
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
    const validation = querySchema.safeParse({
      active: searchParams.get('active'),
      targetType: searchParams.get('targetType'),
      includeExpired: searchParams.get('includeExpired'),
      withProgress: searchParams.get('withProgress'),
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: validation.error.format(),
          },
        },
        { status: 400 }
      );
    }

    const { active, targetType, includeExpired, withProgress } = validation.data;

    // Get targets with or without progress calculation
    let targets;
    if (withProgress && active) {
      targets = await getActiveTargetsWithProgress(session.user.id);
    } else {
      targets = await getTargets(session.user.id, {
        active,
        targetType: targetType as 'WEEKLY' | 'MONTHLY' | 'YEARLY' | undefined,
        includeExpired,
      });
    }

    return NextResponse.json({
      success: true,
      data: { targets },
    });

  } catch (error) {
    console.error('[Targets API Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch targets',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/targets
 * Create a new target
 */
export async function POST(req: NextRequest) {
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
    const validation = createTargetSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid target data',
            details: validation.error.format(),
          },
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Validate end date must be in the future (to allow measuring against ongoing prop firm targets)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (data.endDate < today) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'End date must be in the future. Start date can be in the past to track ongoing targets.',
          },
        },
        { status: 400 }
      );
    }

    // Create target
    const target = await createTarget(session.user.id, data);

    return NextResponse.json(
      {
        success: true,
        data: { target },
        message: 'Target created successfully',
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('[Create Target API Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create target',
        },
      },
      { status: 500 }
    );
  }
}
