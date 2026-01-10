/**
 * Admin User Comparison API
 * GET /api/admin/comparison - Get user comparison data for charts
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/utils/apiErrors';
import { getUsersComparison } from '@/lib/services/adminStatsService';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // Verify admin access
    const session = await auth();
    const adminError = requireAdmin(session);
    if (adminError) return adminError;

    // Get query params for date filtering
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Parse dates if provided
    const dateStart = startDate ? new Date(startDate) : undefined;
    const dateEnd = endDate ? new Date(endDate) : undefined;

    // Get user comparison data
    const comparison = await getUsersComparison(dateStart, dateEnd);

    return NextResponse.json({
      success: true,
      data: comparison,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    console.error('Admin comparison error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch comparison data' } },
      { status: 500 }
    );
  }
}
