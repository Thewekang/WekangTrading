/**
 * Admin Statistics API
 * GET /api/admin/stats - Get admin dashboard statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/utils/apiErrors';
import { getAdminDashboardStats } from '@/lib/services/adminStatsService';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // Verify admin access
    const session = await auth();
    const adminError = requireAdmin(session);
    if (adminError) return adminError;

    // Get admin dashboard stats
    const stats = await getAdminDashboardStats();

    return NextResponse.json({
      success: true,
      data: stats,
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

    console.error('Admin stats error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch admin statistics' } },
      { status: 500 }
    );
  }
}
