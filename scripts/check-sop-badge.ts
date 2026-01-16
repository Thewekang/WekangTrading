import { db } from '../lib/db';
import { users, userStats, individualTrades, userBadges, badges } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function checkSopBadge() {
  const [trader] = await db.select().from(users).where(eq(users.email, 'trader@trader.com'));
  
  console.log('\n=== TRADER ACCOUNT VERIFICATION ===\n');
  
  // Get all trades
  const trades = await db.select().from(individualTrades).where(eq(individualTrades.userId, trader.id));
  console.log('Total Trades in DB:', trades.length);
  console.log('SOP-compliant trades:', trades.filter(t => t.sopFollowed).length);
  
  // Get user stats
  const stats = await db.select().from(userStats).where(eq(userStats.userId, trader.id));
  console.log('\n=== USER STATS ===');
  console.log('Total Trades (stats):', stats[0]?.totalTrades);
  console.log('Total SOP Compliant:', stats[0]?.totalSopCompliant);
  console.log('Current SOP Streak:', stats[0]?.currentSopStreak);
  console.log('Longest SOP Streak:', stats[0]?.longestSopStreak);
  
  // Check badge
  const byTheBookBadge = await db.select().from(badges).where(eq(badges.name, 'By the Book')).get();
  const earned = await db.select()
    .from(userBadges)
    .where(eq(userBadges.userId, trader.id))
    .where(eq(userBadges.badgeId, byTheBookBadge!.id))
    .get();
  
  console.log('\n=== "BY THE BOOK" BADGE ===');
  console.log('Badge ID:', byTheBookBadge?.id);
  console.log('Requirement:', byTheBookBadge?.description);
  console.log('Is Earned:', !!earned);
  if (earned) {
    console.log('Earned At:', earned.earnedAt);
  }
  
  console.log('\n=== ALL TRADES (chronological, SOP status) ===');
  trades.forEach((t, i) => {
    console.log(`${i+1}. ${t.tradeTimestamp.toISOString()} - SOP: ${t.sopFollowed ? '✓' : '✗'}`);
  });
}

checkSopBadge().catch(console.error);
