/**
 * User Password Change API
 * PATCH /api/users/me/password - Change own password
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { changeUserPassword } from '@/lib/services/userSettingsService';
import { z } from 'zod';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export async function PATCH(req: NextRequest) {
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
    const validation = changePasswordSchema.safeParse(body);

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

    const { currentPassword, newPassword } = validation.data;

    // Change password
    await changeUserPassword(session.user.id, currentPassword, newPassword);

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    });

  } catch (error: any) {
    console.error('Change password error:', error);

    // Handle specific errors
    if (error.message === 'Current password is incorrect') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_PASSWORD', message: error.message } },
        { status: 400 }
      );
    }

    if (error.message === 'New password must be different from current password') {
      return NextResponse.json(
        { success: false, error: { code: 'SAME_PASSWORD', message: error.message } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to change password' } },
      { status: 500 }
    );
  }
}
