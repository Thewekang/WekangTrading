/**
 * POST /api/badges/recalculate - Recalculate user stats and award badges
 * This is useful for existing users who had trades before the gamification system
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { initializeUserStats, updateUserStatsFromTrades, checkAndAwardBadges } from '@/lib/services/badgeService';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Initialize user stats if not exists
    await initializeUserStats(session.user.id);

    // Recalculate stats from all trades
    await updateUserStatsFromTrades(session.user.id);

    // Check and award all eligible badges
    const newBadges = await checkAndAwardBadges(session.user.id, 'MANUAL');

    return NextResponse.json({
      success: true,
      data: {
        message: 'Stats recalculated successfully',
        badgesAwarded: newBadges.length,
        badges: newBadges.map(b => ({ name: b.name, tier: b.tier, points: b.points })),
      },
    });
  } catch (error) {
    console.error('Error recalculating badges:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to recalculate badges' } },
      { status: 500 }
    );
  }
}
