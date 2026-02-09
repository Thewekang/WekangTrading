/**
 * Admin Users API
 * GET /api/admin/users - Get all users with statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/utils/apiErrors';
import { getAllUsersStats } from '@/lib/services/adminStatsService';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    // Verify admin access
    const session = await auth();
    const adminError = requireAdmin(session);
    if (adminError) return adminError;

    // Get all users with complete stats including rankings
    const usersWithStats = await getAllUsersStats();

    // Get ALL users (including admins) for user metadata
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        resetCount: users.resetCount,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(asc(users.createdAt));

    // Merge stats with user metadata (keeps rank from getAllUsersStats)
    const completeUsersData = usersWithStats.map((stats) => {
      const userMetadata = allUsers.find((u) => u.id === stats.userId);
      return {
        ...stats,
        userName: userMetadata?.name || 'Unknown',
        userEmail: userMetadata?.email || 'Unknown',
        userRole: userMetadata?.role || 'USER',
        resetCount: userMetadata?.resetCount ?? 0,
        createdAt: userMetadata?.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: completeUsersData,
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

    console.error('Admin users error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch users' } },
      { status: 500 }
    );
  }
}
