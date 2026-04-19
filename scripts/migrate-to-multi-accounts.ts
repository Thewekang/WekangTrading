/**
 * Data Migration Script: Seed "Main Account" per existing user
 *
 * Run once after applying migration 0011:
 *   npx ts-node --project tsconfig.json scripts/migrate-to-multi-accounts.ts
 *
 * What it does:
 * 1. For each user, create one "Main Account" with isDefault=true
 * 2. Assign that account's ID to all existing rows in:
 *    individual_trades, daily_summaries, user_targets, user_badges,
 *    user_streaks, user_stats, user_rankings,
 *    discipline_tracker_settings, discipline_tracker_rows
 * 3. Seed default admin_settings (min_trades_for_ranking, ranking_cache_duration_ms)
 */

import 'dotenv/config';
import { db } from '../lib/db';
import {
  users,
  tradingAccounts,
  individualTrades,
  dailySummaries,
  userTargets,
} from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { createClient } from '@libsql/client';

const createId = () => randomUUID();

// Raw libsql client for tables not in the typed schema
const rawClient = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

async function seedAdminSettings() {
  const { adminSettings } = await import('../lib/db/schema');
  const defaults: { key: string; value: string; description: string }[] = [
    { key: 'min_trades_for_ranking', value: '10', description: 'Minimum trades required before a user appears in rankings' },
    { key: 'ranking_cache_duration_ms', value: '3600000', description: 'How long (ms) to cache ranking calculations' },
  ];
  for (const row of defaults) {
    await db.insert(adminSettings).values({ ...row, updatedAt: new Date() }).onConflictDoNothing();
  }
  console.log('✅ Admin settings seeded');
}

async function createMainAccounts() {
  const allUsers = await db.select({ id: users.id, name: users.name }).from(users);
  console.log(`Found ${allUsers.length} users`);

  for (const user of allUsers) {
    // Check if user already has accounts
    const existing = await db
      .select({ id: tradingAccounts.id })
      .from(tradingAccounts)
      .where(eq(tradingAccounts.userId, user.id))
      .limit(1);

    if (existing.length > 0) {
      console.log(`  ⏭️  ${user.name} already has accounts — skipping`);
      continue;
    }

    const accountId = createId();
    await db.insert(tradingAccounts).values({
      id: accountId,
      userId: user.id,
      name: 'Main Account',
      accountType: 'FUTURES',
      currency: 'USD',
      startingBalance: 0,
      isDefault: true,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Assign to all existing rows for this user
    const tables = [
      { table: individualTrades, userCol: individualTrades.userId, accountCol: individualTrades.tradingAccountId },
      { table: dailySummaries, userCol: dailySummaries.userId, accountCol: dailySummaries.tradingAccountId },
      { table: userTargets, userCol: userTargets.userId, accountCol: userTargets.tradingAccountId },
    ];

    for (const { table, userCol, accountCol } of tables) {
      await db.update(table)
        .set({ [accountCol.name]: accountId } as Record<string, string>)
        .where(eq(userCol, user.id));
    }

    // Handle additional tables dynamically
    const additionalTables = [
      'user_badges',
      'user_streaks',
      'user_stats',
      'user_rankings',
      'discipline_tracker_settings',
      'discipline_tracker_rows',
    ];

    for (const tableName of additionalTables) {
      try {
        await rawClient.execute({
          sql: `UPDATE ${tableName} SET trading_account_id = ? WHERE user_id = ? AND trading_account_id IS NULL`,
          args: [accountId, user.id],
        });
      } catch (e) {
        console.warn(`  ⚠️  Could not update ${tableName}: ${(e as Error).message}`);
      }
    }

    console.log(`  ✅ ${user.name}: created "Main Account" (${accountId}) and assigned to all existing rows`);
  }
}

async function main() {
  console.log('🚀 Starting multi-account data migration...\n');

  await seedAdminSettings();
  await createMainAccounts();

  console.log('\n✨ Migration complete');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
