/**
 * Test API endpoints for badge data
 */

import { db } from '../lib/db';
import { users, userBadges, badges } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUserBadges, getUserBadgeStats, getBadgeProgress } from '../lib/services/badgeService';

async function testBadgeAPIs() {
  try {
    // Get trader
    const trader = await db.select().from(users).where(eq(users.email, 'trader@trader.com')).limit(1);
    if (trader.length === 0) {
      console.log('❌ Trader not found');
      return;
    }
    
    const traderId = trader[0].id;
    console.log('Testing Badge APIs for trader:', traderId);
    console.log('═══════════════════════════════════════════════');
    console.log();
    
    // Test 1: getUserBadges
    console.log('📋 TEST 1: getUserBadges()');
    const userBadgesResult = await getUserBadges(traderId);
    console.log(`   Result: ${userBadgesResult.length} badges`);
    userBadgesResult.forEach(ub => {
      console.log(`   - Badge ID: ${ub.badgeId}, Earned: ${ub.earnedAt}`);
    });
    console.log();
    
    // Test 2: getUserBadgeStats
    console.log('📊 TEST 2: getUserBadgeStats()');
    const stats = await getUserBadgeStats(traderId);
    console.log('   Result:', JSON.stringify(stats, null, 2));
    console.log();
    
    // Test 3: API endpoint structure - /api/badges/user
    console.log('🔍 TEST 3: Simulating /api/badges/user endpoint');
    const userBadgesData = await getUserBadges(traderId);
    const badgesWithDetails = await Promise.all(
      userBadgesData.map(async (ub) => {
        const [badge] = await db.select().from(badges).where(eq(badges.id, ub.badgeId)).limit(1);
        return {
          badge,
          userBadge: ub,
        };
      })
    );
    const apiStats = await getUserBadgeStats(traderId);
    
    const apiResponse = {
      success: true,
      data: {
        badges: badgesWithDetails,
        totalBadges: apiStats.totalBadges,
        totalPoints: apiStats.totalPoints,
        badgesByTier: apiStats.badgesByTier,
      },
    };
    
    console.log('   API Response structure:');
    console.log(`   - badges.length: ${apiResponse.data.badges.length}`);
    console.log(`   - totalBadges: ${apiResponse.data.totalBadges}`);
    console.log(`   - totalPoints: ${apiResponse.data.totalPoints}`);
    console.log(`   - badgesByTier:`, apiResponse.data.badgesByTier);
    console.log();
    console.log('   Badges detail:');
    apiResponse.data.badges.forEach(item => {
      console.log(`   ✅ ${item.badge.icon} ${item.badge.name} (${item.badge.tier}, ${item.badge.points}pts)`);
      console.log(`      Earned: ${item.userBadge.earnedAt}`);
    });
    console.log();
    
    // Test 4: getBadgeProgress
    console.log('📈 TEST 4: getBadgeProgress()');
    const progress = await getBadgeProgress(traderId);
    console.log(`   Result: ${progress.length} badges with progress`);
    console.log(`   First 3 badges:`);
    progress.slice(0, 3).forEach(item => {
      console.log(`   - ${item.badge.name}: ${item.progress.toFixed(1)}% (${item.currentValue}/${item.targetValue})`);
    });
    console.log();
    
    // Test 5: Direct database query
    console.log('💾 TEST 5: Direct database query for user_badges');
    const directQuery = await db.select().from(userBadges).where(eq(userBadges.userId, traderId));
    console.log(`   Result: ${directQuery.length} rows in user_badges table`);
    directQuery.forEach(row => {
      console.log(`   - ID: ${row.id}, Badge: ${row.badgeId}, Earned: ${row.earnedAt}`);
    });
    console.log();
    
    console.log('═══════════════════════════════════════════════');
    console.log('✅ All tests complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

testBadgeAPIs();
