/**
 * Admin API - Get specific user's discipline tracker settings
 * GET /api/admin/users/[id]/discipline-tracker/settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireAdmin } from '@/lib/utils/apiErrors';
import { getUserSettings } from '@/lib/services/disciplineTrackerService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const adminError = requireAdmin(session);
    if (adminError) return adminError;

    const { id: userId } = await params;

    // Fetch user's settings
    const settings = await getUserSettings(userId);

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('[GET /api/admin/users/[id]/discipline-tracker/settings]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch settings' } },
      { status: 500 }
    );
  }
}
