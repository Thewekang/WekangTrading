/**
 * Invite Codes API
 * GET: List all invite codes (admin only)
 * POST: Create new invite code (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createInviteCode, getAllInviteCodes } from '@/lib/services/inviteCodeService';
import { z } from 'zod';

const createInviteCodeSchema = z.object({
  maxUses: z.number().int().min(1).max(100).optional(),
  expiresInDays: z.number().int().min(1).max(365).optional(),
});

export async function GET() {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const inviteCodes = await getAllInviteCodes();

    return NextResponse.json({
      success: true,
      data: inviteCodes,
    });
  } catch (error) {
    console.error('Error fetching invite codes:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch invite codes' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = createInviteCodeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: validation.error.message } },
        { status: 400 }
      );
    }

    const inviteCode = await createInviteCode(session.user.id, validation.data);

    return NextResponse.json(
      {
        success: true,
        data: inviteCode,
        message: 'Invite code created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating invite code:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create invite code' } },
      { status: 500 }
    );
  }
}
