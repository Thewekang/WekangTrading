/**
 * Check trader's badges in database
 */

import { db } from '../lib/db';
import { userBadges, badges, users, userStats } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function checkTraderBadges() {
  try {
    // Get trader user
    const trader = await db.select().from(users).where(eq(users.email, 'trader@trader.com')).limit(1);
    
    if (trader.length === 0) {
      console.log('❌ Trader user not found');
      return;
    }
    
    const traderId = trader[0].id;
    console.log('✅ Found trader:', trader[0].email, `(${traderId})`);
    console.log();
    
    // Get user stats
    const stats = await db.select().from(userStats).where(eq(userStats.userId, traderId)).limit(1);
    
    if (stats.length > 0) {
      const s = stats[0];
      console.log('📊 User Stats:');
      console.log(`  - Total Trades: ${s.totalTrades}`);
      console.log(`  - Win Rate: ${s.winRate.toFixed(2)}%`);
      console.log(`  - SOP Rate: ${s.sopComplianceRate.toFixed(2)}%`);
      console.log(`  - Total Profit: $${s.totalProfitUsd.toFixed(2)}`);
      console.log(`  - Longest Win Streak: ${s.longestWinStreak}`);
      console.log(`  - Longest Log Streak: ${s.longestLogStreak}`);
      console.log(`  - Longest SOP Streak: ${s.longestSopStreak}`);
      console.log(`  - First Trade: ${s.firstTradeDate}`);
      console.log();
    }
    
    // Get earned badges
    const earnedBadges = await db
      .select({
        badge: badges,
        earnedAt: userBadges.earnedAt,
      })
      .from(userBadges)
      .innerJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(eq(userBadges.userId, traderId));
    
    console.log(`🏆 Earned Badges: ${earnedBadges.length}`);
    console.log();
    
    if (earnedBadges.length > 0) {
      for (const { badge, earnedAt } of earnedBadges) {
        console.log(`  ✅ ${badge.icon} ${badge.name} (${badge.tier})`);
        console.log(`     ${badge.description}`);
        console.log(`     Requirement: ${badge.requirement}`);
        console.log(`     Points: ${badge.points} | Earned: ${earnedAt}`);
        console.log();
      }
      
      const totalPoints = earnedBadges.reduce((sum, { badge }) => sum + badge.points, 0);
      console.log(`📈 Total Points: ${totalPoints}`);
    } else {
      console.log('  ❌ No badges earned yet');
    }
    
    console.log();
    console.log('✅ Check complete!');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

checkTraderBadges();
