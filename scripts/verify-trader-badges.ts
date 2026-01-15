/**
 * Verify trader's badges match their actual performance
 */

import { db } from '../lib/db';
import { users, individualTrades, badges, userBadges } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function verifyTraderBadges() {
  try {
    // Get trader
    const trader = await db.select().from(users).where(eq(users.email, 'trader@trader.com')).limit(1);
    if (trader.length === 0) {
      console.log('❌ Trader not found');
      return;
    }
    
    const traderId = trader[0].id;
    const traderInfo = trader[0];
    
    console.log('🔍 VERIFICATION REPORT FOR: trader@trader.com');
    console.log('═══════════════════════════════════════════════');
    console.log();
    
    // Registration date
    console.log('📅 Registration Date:', traderInfo.createdAt);
    console.log('   Expected: Before 2026-02-01 for Founding Member badge');
    const registrationDate = new Date(traderInfo.createdAt);
    const cutoffDate = new Date('2026-02-01');
    const isFounding = registrationDate < cutoffDate;
    console.log(`   ✅ ${isFounding ? 'QUALIFIES' : 'DOES NOT QUALIFY'} for Founding Member`);
    console.log();
    
    // Get all trades
    const trades = await db.select().from(individualTrades).where(eq(individualTrades.userId, traderId));
    
    console.log('📊 TRADING PERFORMANCE:');
    console.log(`   Total Trades: ${trades.length}`);
    
    if (trades.length > 0) {
      const wins = trades.filter(t => t.result === 'WIN');
      const losses = trades.filter(t => t.result === 'LOSS');
      const totalProfit = trades.reduce((sum, t) => sum + t.profitLossUsd, 0);
      const winRate = (wins.length / trades.length) * 100;
      const sopCompliant = trades.filter(t => t.sopFollowed);
      const sopRate = (sopCompliant.length / trades.length) * 100;
      
      console.log(`   Wins: ${wins.length} | Losses: ${losses.length}`);
      console.log(`   Win Rate: ${winRate.toFixed(2)}%`);
      console.log(`   Total Profit: $${totalProfit.toFixed(2)}`);
      console.log(`   SOP Compliance: ${sopRate.toFixed(2)}%`);
      console.log();
      
      // Badge verification
      console.log('🏆 BADGE VERIFICATION:');
      console.log();
      
      // Get earned badges
      const earnedBadges = await db
        .select({ badge: badges })
        .from(userBadges)
        .innerJoin(badges, eq(userBadges.badgeId, badges.id))
        .where(eq(userBadges.userId, traderId));
      
      const earnedBadgeNames = earnedBadges.map(b => b.badge.name);
      
      // Check each badge
      const checks = [
        {
          name: 'The Beginning',
          requirement: 'Complete 1 trade',
          qualifies: trades.length >= 1,
          earned: earnedBadgeNames.includes('The Beginning'),
          points: 5,
          tier: 'BRONZE'
        },
        {
          name: 'In the Money',
          requirement: 'Earn $1+ profit',
          qualifies: totalProfit >= 1,
          earned: earnedBadgeNames.includes('In the Money'),
          points: 10,
          tier: 'BRONZE'
        },
        {
          name: 'Founding Member',
          requirement: 'Register before 2026-02-01',
          qualifies: isFounding,
          earned: earnedBadgeNames.includes('Founding Member'),
          points: 200,
          tier: 'PLATINUM'
        },
        {
          name: 'Century',
          requirement: 'Complete 100 trades',
          qualifies: trades.length >= 100,
          earned: earnedBadgeNames.includes('Century'),
          points: 50,
          tier: 'BRONZE'
        },
        {
          name: 'Money Maker',
          requirement: 'Earn $1,000+ profit',
          qualifies: totalProfit >= 1000,
          earned: earnedBadgeNames.includes('Money Maker'),
          points: 75,
          tier: 'BRONZE'
        },
        {
          name: 'Accurate',
          requirement: '70%+ win rate with 50+ trades',
          qualifies: winRate >= 70 && trades.length >= 50,
          earned: earnedBadgeNames.includes('Accurate'),
          points: 60,
          tier: 'BRONZE'
        },
      ];
      
      checks.forEach(check => {
        const status = check.qualifies && check.earned ? '✅ CORRECT' :
                       !check.qualifies && !check.earned ? '✅ CORRECT' :
                       check.qualifies && !check.earned ? '❌ MISSING' :
                       '❌ WRONG';
        
        console.log(`${status} | ${check.name} (${check.tier}, ${check.points} pts)`);
        console.log(`         Requirement: ${check.requirement}`);
        console.log(`         Qualifies: ${check.qualifies ? 'YES' : 'NO'} | Earned: ${check.earned ? 'YES' : 'NO'}`);
        console.log();
      });
      
      // Summary
      const correctChecks = checks.filter(c => 
        (c.qualifies && c.earned) || (!c.qualifies && !c.earned)
      );
      
      console.log('═══════════════════════════════════════════════');
      console.log(`✅ VERDICT: ${correctChecks.length}/${checks.length} badges verified correctly`);
      console.log();
      
      if (correctChecks.length === checks.length) {
        console.log('🎉 All badges are accurate! System working perfectly!');
      } else {
        console.log('⚠️  Some discrepancies found. Review above.');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

verifyTraderBadges();
