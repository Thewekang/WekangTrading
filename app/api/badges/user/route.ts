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

    // Require accountId
    const accountId = request.nextUrl.searchParams.get('accountId');
    if (!accountId) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'accountId is required' } },
        { status: 400 }
      );
    }

    // Get user's earned badges with badge details
    const userBadges = await getUserBadges(session.user.id, accountId);
    
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
    
    // Filter out entries where the badge was deleted from the badges table
    const validBadgesWithDetails = badgesWithDetails.filter((item) => item.badge != null);
    
    // Get stats
    const stats = await getUserBadgeStats(session.user.id, accountId);

    return NextResponse.json({
      success: true,
      data: {
        badges: validBadgesWithDetails,
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
