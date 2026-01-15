/**
 * GET /api/badges/user - Get user's earned badges
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserBadges, getUserBadgeStats } from '@/lib/services/badgeService';
import { db } from '@/lib/db';
import { badges } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Get user's earned badges with badge details
    const userBadges = await getUserBadges(session.user.id);
    
    // Get badge details for each earned badge
    const badgesWithDetails = await Promise.all(
      userBadges.map(async (ub) => {
        const [badge] = await db.select().from(badges).where(eq(badges.id, ub.badgeId)).limit(1);
        return {
          badge,
          userBadge: ub,
        };
      })
    );
    
    // Get stats
    const stats = await getUserBadgeStats(session.user.id);

    return NextResponse.json({
      success: true,
      data: {
        badges: badgesWithDetails,
        totalBadges: stats.totalBadges,
        totalPoints: stats.totalPoints,
        badgesByTier: stats.badgesByTier,
      },
    });
  } catch (error) {
    console.error('Error fetching user badges:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch badges' } },
      { status: 500 }
    );
  }
}
