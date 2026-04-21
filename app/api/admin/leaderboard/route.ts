/**
 * Admin Leaderboard API
 * GET /api/admin/leaderboard - Per-account stats for overview leaderboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/utils/apiErrors';
import { getAllAccountsStats } from '@/lib/services/adminStatsService';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const adminError = requireAdmin(session);
    if (adminError) return adminError;

    const accountsStats = await getAllAccountsStats();

    // Merge in user metadata (name, email, role)
    const allUsers = await db
      .select({ id: users.id, name: users.name, email: users.email, role: users.role, resetCount: users.resetCount, createdAt: users.createdAt })
      .from(users)
      .orderBy(asc(users.createdAt));

    const data = accountsStats.map((stats) => {
      const meta = allUsers.find((u) => u.id === stats.userId);
      return {
        ...stats,
        userName: meta?.name || stats.userName,
        userEmail: meta?.email || stats.userEmail,
        userRole: meta?.role || 'USER',
        resetCount: meta?.resetCount ?? 0,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } }, { status: 403 });
    }
    console.error('Admin leaderboard error:', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch leaderboard' } }, { status: 500 });
  }
}
