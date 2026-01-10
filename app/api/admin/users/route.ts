/**
 * Admin Users API
 * GET /api/admin/users - Get all users with statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/utils/apiErrors';
import { getUserStats } from '@/lib/services/adminStatsService';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    // Verify admin access
    const session = await auth();
    const adminError = requireAdmin(session);
    if (adminError) return adminError;

    // Get ALL users (including admins) for user management page
    const users = await prisma.user.findMany({
      select: { 
        id: true,
        name: true,
        email: true,
        role: true,
        resetCount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Get stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const stats = await getUserStats(user.id);
        return {
          userId: user.id,
          userName: user.name || 'Unknown',
          userEmail: user.email,
          userRole: user.role,
          resetCount: user.resetCount,
          createdAt: user.createdAt,
          totalTrades: stats.totalTrades,
          totalWins: stats.totalWins,
          totalLosses: stats.totalLosses,
          winRate: stats.winRate,
          sopRate: stats.sopRate,
          netProfitLoss: stats.netProfitLoss,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: usersWithStats,
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
