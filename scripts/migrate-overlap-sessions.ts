/**
 * Migration Script: Update OVERLAP to Specific Overlap Types
 * 
 * This script migrates all existing trades with marketSession = 'OVERLAP'
 * to either 'ASIA_EUROPE_OVERLAP' or 'EUROPE_US_OVERLAP' based on their timestamp.
 * 
 * Run: npx tsx scripts/migrate-overlap-sessions.ts
 */

import { db } from '../lib/db';
import { individualTrades, dailySummaries } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import { calculateMarketSession } from '../lib/utils/marketSessions';

async function migrateOverlapSessions() {
  console.log('🔄 Starting migration of OVERLAP sessions...\n');

  try {
    // Find all trades with old OVERLAP value
    const overlapTrades = await db
      .select()
      .from(individualTrades)
      .where(eq(individualTrades.marketSession, 'OVERLAP' as any));

    console.log(`Found ${overlapTrades.length} trades with OVERLAP session\n`);

    if (overlapTrades.length === 0) {
      console.log('✅ No trades to migrate!');
      return;
    }

    let updated = 0;
    let errors = 0;

    for (const trade of overlapTrades) {
      try {
        // Recalculate market session from timestamp
        const correctSession = calculateMarketSession(new Date(trade.tradeTimestamp));

        await db
          .update(individualTrades)
          .set({ marketSession: correctSession })
          .where(eq(individualTrades.id, trade.id));

        console.log(`✓ Updated trade ${trade.id}: ${trade.marketSession} → ${correctSession}`);
        updated++;
      } catch (error) {
        console.error(`✗ Failed to update trade ${trade.id}:`, error);
        errors++;
      }
    }

    // Update daily summaries with old OVERLAP bestSession
    console.log('\n🔄 Updating daily summaries...\n');

    const overlapSummaries = await db
      .select()
      .from(dailySummaries)
      .where(eq(dailySummaries.bestSession, 'OVERLAP' as any));

    console.log(`Found ${overlapSummaries.length} summaries with OVERLAP best session\n`);

    let summariesUpdated = 0;

    for (const summary of overlapSummaries) {
      try {
        // For summaries, we'll set to null and let them be recalculated
        await db
          .update(dailySummaries)
          .set({ bestSession: null })
          .where(eq(dailySummaries.id, summary.id));

        console.log(`✓ Reset best session for summary ${summary.id} (will be recalculated)`);
        summariesUpdated++;
      } catch (error) {
        console.error(`✗ Failed to update summary ${summary.id}:`, error);
        errors++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   Individual Trades Updated: ${updated}`);
    console.log(`   Daily Summaries Reset: ${summariesUpdated}`);
    console.log(`   Errors: ${errors}`);

    if (errors === 0) {
      console.log('\n✅ Migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with some errors. Check logs above.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
migrateOverlapSessions()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
