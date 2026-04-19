/**
 * Recalculate all daily summaries for all users
 * Run this after schema changes or data imports to update existing data
 * Environment variables loaded via tsx -r dotenv/config
 */

import { db } from '../lib/db';
import { users, individualTrades } from '../lib/db/schema';
import { updateDailySummaryForDate } from '../lib/services/dailySummaryService';
import { updateUserStatsFromTrades } from '../lib/services/badgeService';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('🔄 Recalculating all daily summaries...\n');

  // Get all unique user + date + accountId combinations from individual_trades
  const trades = await db
    .select({
      userId: individualTrades.userId,
      tradeTimestamp: individualTrades.tradeTimestamp,
      tradingAccountId: individualTrades.tradingAccountId,
    })
    .from(individualTrades);

  // Group by userId → Map of accountId → Set of date strings
  // accountId is null for legacy trades without account association
  const userAccountDates = new Map<string, Map<string | null, Set<string>>>();

  // Group by userId → Map of accountId → Set of date strings
  // accountId is null for legacy trades without account association
  const userAccountDates = new Map<string, Map<string | null, Set<string>>>();

  trades.forEach(trade => {
    const dateKey = trade.tradeTimestamp.toISOString().split('T')[0];
    const accountId = trade.tradingAccountId ?? null;

    if (!userAccountDates.has(trade.userId)) {
      userAccountDates.set(trade.userId, new Map());
    }
    const accountMap = userAccountDates.get(trade.userId)!;

    if (!accountMap.has(accountId)) {
      accountMap.set(accountId, new Set());
    }
    accountMap.get(accountId)!.add(dateKey);
  });

  console.log(`Found ${userAccountDates.size} users with trades\n`);

  let totalUpdated = 0;

  for (const [userId, accountMap] of userAccountDates) {
    const userResult = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const user = userResult[0];
    const totalDates = Array.from(accountMap.values()).reduce((sum, dates) => sum + dates.size, 0);

    console.log(`📊 User: ${user?.email || userId}`);
    console.log(`   ${accountMap.size} account bucket(s), ${totalDates} date-account pairs...`);

    for (const [accountId, dates] of accountMap) {
      for (const dateStr of dates) {
        const date = new Date(dateStr);
        await updateDailySummaryForDate(userId, date, accountId ?? undefined);
        totalUpdated++;
      }
    }

    // Update user stats after all daily summaries
    console.log('   Updating user stats from trades...');
    await updateUserStatsFromTrades(userId);

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
