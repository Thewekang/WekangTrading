/**
 * Recalculate all daily summaries for all users
 * Run this after schema changes to update existing data
 */

import { PrismaClient } from '@prisma/client';
import { updateDailySummaryForDate } from '../lib/services/dailySummaryService';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Recalculating all daily summaries...\n');

  // Get all unique user + date combinations from individual_trades
  const trades = await prisma.individualTrade.findMany({
    select: {
      userId: true,
      tradeTimestamp: true,
    },
  });

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
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    console.log(`📊 User: ${user?.email}`);
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
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
