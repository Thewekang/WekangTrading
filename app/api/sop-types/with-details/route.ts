import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSopTypesWithDetails } from '@/lib/services/sopDetailService';

/**
 * GET /api/sop-types/with-details
 * Get all active SOP types with detail content enabled
 * Available to authenticated users
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

    const sopTypes = await getSopTypesWithDetails();

    return NextResponse.json({
      success: true,
      data: sopTypes,
      count: sopTypes.length
    });
  } catch (error: any) {
    console.error('Error fetching SOP types with details:', error);

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch strategy guides' } },
      { status: 500 }
    );
  }
}
