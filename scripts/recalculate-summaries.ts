/**
 * Recalculate all daily summaries for all users
 * Run this after schema changes or data imports to update existing data
 * Environment variables loaded via tsx -r dotenv/config
 */

import { db } from '../lib/db';
import { users, individualTrades } from '../lib/db/schema';
import { updateDailySummaryForDate } from '../lib/services/dailySummaryService';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('🔄 Recalculating all daily summaries...\n');

  // Get all unique user + date combinations from individual_trades
  const trades = await db
    .select({
      userId: individualTrades.userId,
      tradeTimestamp: individualTrades.tradeTimestamp,
    })
    .from(individualTrades);

  // Group by user and date
  const userDates = new Map<string, Set<string>>();
  
  trades.forEach(trade => {
    const dateKey = trade.tradeTimestamp.toISOString().split('T')[0];
    
    if (!userDates.has(trade.userId)) {
      userDates.set(trade.userId, new Set());
    }
    userDates.get(trade.userId)!.add(dateKey);
  });

  console.log(`Found ${userDates.size} users with trades\n`);

  let totalUpdated = 0;

  // Recalculate summaries for each user-date combination
  for (const [userId, dates] of userDates) {
    const userResult = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const user = userResult[0];

    console.log(`📊 User: ${user?.email || userId}`);
    console.log(`   Updating ${dates.size} daily summaries...`);

    for (const dateStr of dates) {
      const date = new Date(dateStr);
      await updateDailySummaryForDate(userId, date);
      totalUpdated++;
    }

    console.log(`   ✅ Done\n`);
  }

  console.log(`✨ Successfully recalculated ${totalUpdated} daily summaries!`);
}

main()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((e) => {
    console.error('❌ Recalculation failed:', e);
    process.exit(1);
  });
