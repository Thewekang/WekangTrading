/**
 * Recalculate User Stats and Award Badges
 * Run this to fix existing users with trades but no badges
 */

import { db } from '../lib/db';
import { users } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import { initializeUserStats, updateUserStatsFromTrades, checkAndAwardBadges } from '../lib/services/badgeService';

async function recalculateAllUsers() {
  console.log('Starting badge recalculation for all users...\n');

  const allUsers = await db.select({ id: users.id, email: users.email }).from(users);

  console.log(`Found ${allUsers.length} users\n`);

  for (const user of allUsers) {
    try {
      console.log(`Processing user: ${user.email} (${user.id})`);

      // Initialize stats
      await initializeUserStats(user.id);
      console.log('  ✓ Stats initialized');

      // Recalculate from trades
      await updateUserStatsFromTrades(user.id);
      console.log('  ✓ Stats updated from trades');

      // Debug: Check user stats
      const { userStats: userStatsTable } = await import('../lib/db/schema');
      const stats = await db.select().from(userStatsTable).where(eq(userStatsTable.userId, user.id)).limit(1);
      if (stats.length > 0) {
        console.log('  📊 Stats:', {
          totalTrades: stats[0].totalTrades,
          totalWins: stats[0].totalWins,
          winRate: stats[0].winRate?.toFixed(2) + '%',
          sopRate: stats[0].sopComplianceRate?.toFixed(2) + '%',
          profit: '$' + stats[0].totalProfitUsd?.toFixed(2),
        });
      }

      // Award eligible badges
      const badges = await checkAndAwardBadges(user.id, 'MANUAL');
      console.log(`  ✓ Awarded ${badges.length} badge(s)`);
      
      if (badges.length > 0) {
        badges.forEach(badge => {
          console.log(`    - ${badge.icon} ${badge.name} (${badge.tier}, ${badge.points} pts)`);
        });
      }

      console.log('');
    } catch (error) {
      console.error(`  ✗ Error processing user ${user.email}:`, error);
      console.log('');
    }
  }

  console.log('✅ Recalculation complete!');
  process.exit(0);
}

recalculateAllUsers().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
