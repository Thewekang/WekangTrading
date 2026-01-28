import { db } from '../lib/db';
import { badges, userStats, users, individualTrades } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function debugBadges() {
  console.log('=== BADGE DEBUG ===\n');
  
  // Check users
  console.log('1. Checking users...');
  const allUsers = await db.select().from(users);
  console.log(`Found ${allUsers.length} users:`);
  allUsers.forEach(u => {
    console.log(`  - ${u.name} (${u.email}) - ID: ${u.id}`);
  });
  console.log('');
  
  // Check badges table
  console.log('2. Checking badges table...');
  const allBadges = await db.select().from(badges).limit(5);
  console.log(`Found ${allBadges.length} badges (showing first 5):`);
  allBadges.forEach(b => {
    console.log(`  - ${b.name} (${b.identifier})`);
    console.log(`    Requirement: ${b.requirement}`);
  });
  console.log('');
  
  // Check user stats
  console.log('3. Checking user stats...');
  const stats = await db.select().from(userStats);
  console.log(`Found ${stats.length} user stats:`);
  for (const s of stats) {
    const user = await db.select().from(users).where(eq(users.id, s.userId)).limit(1);
    console.log(`  User: ${user[0]?.email || s.userId}`);
    console.log(`    Total Trades: ${s.totalTrades}`);
    console.log(`    Win Rate: ${s.winRate}%`);
    console.log(`    SOP Rate: ${s.sopComplianceRate}%`);
    console.log(`    Longest Win Streak: ${s.longestWinStreak}`);
    console.log(`    Badges Earned: ${s.badgesEarned}`);
    
    // Check actual trade count
    const trades = await db.select().from(individualTrades).where(eq(individualTrades.userId, s.userId));
    console.log(`    Actual Trades in DB: ${trades.length}`);
  }
  console.log('');
  
  process.exit(0);
}

debugBadges();
