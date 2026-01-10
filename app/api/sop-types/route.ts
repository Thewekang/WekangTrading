import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getActiveSopTypes } from '@/lib/services/sopTypeService';

/**
 * GET /api/sop-types
 * Get active SOP types for trade entry
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const sopTypes = await getActiveSopTypes();

    return NextResponse.json({
      success: true,
      data: sopTypes
    });
  } catch (error) {
    console.error('Error fetching active SOP types:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch SOP types' } },
      { status: 500 }
    );
  }
}
