/**
 * User Account Reset API
 * POST /api/users/me/reset - Reset own account (delete all trading data)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { resetUserAccount, getUserAccountSummary } from '@/lib/services/userSettingsService';
import { z } from 'zod';

const resetAccountSchema = z.object({
  confirmation: z.string().refine(
    (val) => val === 'RESET MY ACCOUNT',
    { message: 'You must type "RESET MY ACCOUNT" to confirm' }
  ),
});

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = resetAccountSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: validation.error.issues[0].message 
          } 
        },
        { status: 400 }
      );
    }

    // Reset account
    const result = await resetUserAccount(session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Account reset successfully',
      data: result,
    });

  } catch (error: any) {
    console.error('Reset account error:', error);

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to reset account' } },
      { status: 500 }
    );
  }
}

/**
 * GET /api/users/me/reset - Get account summary before reset
 */
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Get account summary
    const summary = await getUserAccountSummary(session.user.id);

    return NextResponse.json({
      success: true,
      data: summary,
    });

  } catch (error: any) {
    console.error('Get account summary error:', error);

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get account summary' } },
      { status: 500 }
    );
  }
}
