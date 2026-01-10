/**
 * User Info API
 * GET /api/users/me - Get current user information
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

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

    // Return user info from session
    return NextResponse.json({
      success: true,
      data: {
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      },
    });

  } catch (error: any) {
    console.error('Get user info error:', error);

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get user info' } },
      { status: 500 }
    );
  }
}
