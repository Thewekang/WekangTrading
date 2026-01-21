/**
 * Reset and recalculate streaks from scratch
 */

import { db } from '../lib/db';
import { streaks, users } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import { updateUserStatsFromTrades } from '../lib/services/badgeService';

async function resetStreaks() {
  console.log('🔄 RESETTING AND RECALCULATING STREAKS\n');
  console.log('═══════════════════════════════════════════════\n');

  // Get all users
  const allUsers = await db.select().from(users);

  console.log(`Found ${allUsers.length} users\n`);

  for (const user of allUsers) {
    console.log(`Processing: ${user.email}...`);
    
    // Delete existing streak records
    await db.delete(streaks).where(eq(streaks.userId, user.id));
    console.log('  ✅ Deleted old streak records');
    
    // Recalculate everything
    await updateUserStatsFromTrades(user.id);
    console.log('  ✅ Recalculated streaks and stats');
    
    // Check new values
    const newStreaks = await db.select().from(streaks).where(eq(streaks.userId, user.id));
    const winStreak = newStreaks.find(s => s.streakType === 'WIN_STREAK');
    
    if (winStreak) {
      console.log(`  🔥 Win Streak: Current=${winStreak.currentStreak}, Longest=${winStreak.longestStreak}`);
    }
    
    console.log();
  }

  console.log('═══════════════════════════════════════════════');
  console.log('✅ Reset complete!\n');
}

resetStreaks().catch(console.error);
