import { getBadgeProgress } from '../lib/services/badgeService';
import { db } from '../lib/db';
import { users } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function testStreakProgress() {
  const [trader] = await db.select().from(users).where(eq(users.email, 'trader@trader.com'));
  
  console.log('\n=== Testing Badge Progress (After Fix) ===\n');
  
  const progress = await getBadgeProgress(trader.id);
  
  // Show ALL badges to debug
  console.log(`Total badges in progress: ${progress.length}\n`);
  
  // Filter streak badges
  const streakBadges = progress.filter(p => {
    const req = JSON.parse(p.badge.requirement);
    return req.type === 'WIN_STREAK' || req.type === 'LOG_STREAK' || req.type === 'SOP_STREAK';
  });
  
  console.log('⚡ STREAK BADGES PROGRESS:\n');
  streakBadges.forEach(b => {
    const req = JSON.parse(b.badge.requirement);
    console.log(`${b.badge.icon} ${b.badge.name} (${b.badge.tier}) - ${req.type}`);
    console.log(`   Progress: ${b.currentValue}/${b.targetValue} (${Math.round(b.progress)}%)`);
    console.log(`   Requirement: ${b.badge.description}`);
    console.log('');
  });
}

testStreakProgress().catch(console.error);
