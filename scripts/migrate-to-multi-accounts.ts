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
} from '../lib/db/schema';
import { eq, asc } from 'drizzle-orm';
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
    const existingAccounts = await db
      .select({ id: tradingAccounts.id, isDefault: tradingAccounts.isDefault })
      .from(tradingAccounts)
      .where(eq(tradingAccounts.userId, user.id))
      .orderBy(asc(tradingAccounts.createdAt));

    let defaultAccountId = existingAccounts.find((account) => account.isDefault)?.id;

    if (!defaultAccountId && existingAccounts.length > 0) {
      defaultAccountId = existingAccounts[0].id;

      await db
        .update(tradingAccounts)
        .set({ isDefault: false })
        .where(eq(tradingAccounts.userId, user.id));

      await db
        .update(tradingAccounts)
        .set({ isDefault: true })
        .where(eq(tradingAccounts.id, defaultAccountId));

      console.log(`  🔧 ${user.name}: assigned existing account as default (${defaultAccountId})`);
    }

    if (!defaultAccountId) {
      defaultAccountId = createId();
      await db.insert(tradingAccounts).values({
        id: defaultAccountId,
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

      console.log(`  ✅ ${user.name}: created "Main Account" (${defaultAccountId})`);
    }

    const tablesToBackfill = [
      'individual_trades',
      'daily_summaries',
      'user_targets',
      'user_badges',
      'streaks',
      'user_stats',
      'user_rankings',
      'discipline_tracker_settings',
      'discipline_tracker_rows',
    ];

    for (const tableName of tablesToBackfill) {
      try {
        await rawClient.execute({
          sql: `UPDATE ${tableName} SET trading_account_id = ? WHERE user_id = ? AND trading_account_id IS NULL`,
          args: [defaultAccountId, user.id],
        });
      } catch (e) {
        console.warn(`  ⚠️  Could not update ${tableName}: ${(e as Error).message}`);
      }
    }

    console.log(`  ✅ ${user.name}: legacy rows mapped to default account (${defaultAccountId})`);
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
