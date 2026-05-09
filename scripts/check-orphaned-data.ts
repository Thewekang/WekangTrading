/**
 * Check and clean up orphaned data left from account deletion using old code.
 * Run with: npx tsx -r dotenv/config scripts/check-orphaned-data.ts dotenv_config_path=.env.local
 *
 * Orphaned rows = rows in child tables whose tradingAccountId no longer exists
 * in the trading_accounts table (because the account was hard-deleted without
 * cascading, since PRAGMA foreign_keys is OFF in libsql by default).
 */

import { db } from '../lib/db';
import {
  tradingAccounts,
  accountRules,
  withdrawalEvents,
  individualTrades,
  dailySummaries,
  userTargets,
  userBadges,
  userStats,
  streaks,
  disciplineTrackerRows,
  disciplineTrackerSettings,
  userRankings,
} from '../lib/db/schema';
import { notInArray, isNotNull, inArray } from 'drizzle-orm';

async function main() {
  const DRY_RUN = process.argv.includes('--dry-run');
  console.log(`\n🔍 Checking for orphaned data... (${DRY_RUN ? 'DRY RUN' : 'LIVE — will delete'})\n`);

  // Get all valid trading account IDs
  const validAccounts = await db.select({ id: tradingAccounts.id }).from(tradingAccounts);
  const validIds = validAccounts.map((a) => a.id);
  console.log(`✅ Valid trading_accounts in DB: ${validIds.length}`);
  if (validIds.length > 0) {
    console.log('   IDs:', validIds.join(', '));
  }

  // Helper: find orphans in a table by tradingAccountId
  async function findOrphans<T extends { tradingAccountId: string | null }>(
    label: string,
    rows: T[],
  ) {
    const orphans = rows.filter(
      (r) => r.tradingAccountId !== null && !validIds.includes(r.tradingAccountId),
    );
    if (orphans.length === 0) {
      console.log(`  ✅ ${label}: no orphans`);
    } else {
      console.log(`  ⚠️  ${label}: ${orphans.length} orphaned row(s)`);
      const orphanAccountIds = [...new Set(orphans.map((r) => r.tradingAccountId))];
      console.log(`     Dangling account IDs: ${orphanAccountIds.join(', ')}`);
    }
    return orphans;
  }

  console.log('\n--- Scanning tables ---');

  // Fetch all rows that have a non-null tradingAccountId
  const [
    ar, we, it, ds, ut, ub, us, sk, dtr, dts, ur,
  ] = await Promise.all([
    db.select({ tradingAccountId: accountRules.tradingAccountId }).from(accountRules),
    db.select({ tradingAccountId: withdrawalEvents.tradingAccountId }).from(withdrawalEvents),
    db.select({ tradingAccountId: individualTrades.tradingAccountId }).from(individualTrades),
    db.select({ tradingAccountId: dailySummaries.tradingAccountId }).from(dailySummaries),
    db.select({ tradingAccountId: userTargets.tradingAccountId }).from(userTargets),
    db.select({ tradingAccountId: userBadges.tradingAccountId }).from(userBadges),
    db.select({ tradingAccountId: userStats.tradingAccountId }).from(userStats),
    db.select({ tradingAccountId: streaks.tradingAccountId }).from(streaks),
    db.select({ tradingAccountId: disciplineTrackerRows.tradingAccountId }).from(disciplineTrackerRows),
    db.select({ tradingAccountId: disciplineTrackerSettings.tradingAccountId }).from(disciplineTrackerSettings),
    db.select({ tradingAccountId: userRankings.tradingAccountId }).from(userRankings),
  ]);

  const orphanGroups = await Promise.all([
    findOrphans('account_rules', ar as any),
    findOrphans('withdrawal_events', we as any),
    findOrphans('individual_trades', it as any),
    findOrphans('daily_summaries', ds as any),
    findOrphans('user_targets', ut as any),
    findOrphans('user_badges', ub as any),
    findOrphans('user_stats', us as any),
    findOrphans('streaks', sk as any),
    findOrphans('discipline_tracker_rows', dtr as any),
    findOrphans('discipline_tracker_settings', dts as any),
    findOrphans('user_rankings', ur as any),
  ]);

  const totalOrphans = orphanGroups.reduce((sum, g) => sum + g.length, 0);
  console.log(`\n--- Total orphaned rows: ${totalOrphans} ---`);

  if (totalOrphans === 0) {
    console.log('\n✅ Database is clean — no orphaned data found.\n');
    return;
  }

  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN — no data deleted. Re-run without --dry-run to clean up.\n');
    return;
  }

  // Collect all dangling account IDs across every table
  const allDanglingIds = [
    ...new Set(
      orphanGroups
        .flat()
        .map((r: any) => r.tradingAccountId)
        .filter(Boolean),
    ),
  ] as string[];

  console.log(`\n🗑️  Deleting orphans for dangling account IDs: ${allDanglingIds.join(', ')}`);

  await db.delete(accountRules).where(inArray(accountRules.tradingAccountId, allDanglingIds));
  await db.delete(withdrawalEvents).where(inArray(withdrawalEvents.tradingAccountId, allDanglingIds));
  await db.delete(individualTrades).where(inArray(individualTrades.tradingAccountId, allDanglingIds));
  await db.delete(dailySummaries).where(inArray(dailySummaries.tradingAccountId, allDanglingIds));
  await db.delete(userTargets).where(inArray(userTargets.tradingAccountId, allDanglingIds));
  await db.delete(userBadges).where(inArray(userBadges.tradingAccountId, allDanglingIds));
  await db.delete(userStats).where(inArray(userStats.tradingAccountId, allDanglingIds));
  await db.delete(streaks).where(inArray(streaks.tradingAccountId, allDanglingIds));
  await db.delete(disciplineTrackerRows).where(inArray(disciplineTrackerRows.tradingAccountId, allDanglingIds));
  await db.delete(disciplineTrackerSettings).where(inArray(disciplineTrackerSettings.tradingAccountId, allDanglingIds));
  await db.delete(userRankings).where(inArray(userRankings.tradingAccountId, allDanglingIds));

  console.log('\n✅ Cleanup complete. All orphaned rows deleted.\n');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
