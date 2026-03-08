/**
 * Admin API - Get specific user's discipline tracker rows
 * GET /api/admin/users/[id]/discipline-tracker/rows
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireAdmin } from '@/lib/utils/apiErrors';
import { getUserRows } from '@/lib/services/disciplineTrackerService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const adminError = requireAdmin(session);
    if (adminError) return adminError;

    const { id: userId } = await params;

    // Fetch user's rows (all time, no filters)
    const rows = await getUserRows(userId);

    return NextResponse.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error('[GET /api/admin/users/[id]/discipline-tracker/rows]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch rows' } },
      { status: 500 }
    );
  }
}
