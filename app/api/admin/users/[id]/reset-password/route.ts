/**
 * Reset User Password API (Admin)
 * POST: Generate temporary password
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { resetUserPasswordByAdmin } from '@/lib/services/userManagementService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const { id } = await params;
    const tempPassword = await resetUserPasswordByAdmin(id);

    return NextResponse.json({
      success: true,
      data: { temporaryPassword: tempPassword },
      message: 'Password reset successfully. Share this temporary password with the user.',
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    const message = error instanceof Error ? error.message : 'Failed to reset password';
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 }
    );
  }
}
