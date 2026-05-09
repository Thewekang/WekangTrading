/**
 * Clear all rows from user_badges, user_stats, and streaks tables
 * Required before drizzle:push makes tradingAccountId NOT NULL
 * Run only against staging DB
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  console.log('Clearing gamification tables (staging only)...');
  console.log('DB URL:', process.env.TURSO_DATABASE_URL);

  // Delete in dependency order (user_badges refs user_stats conceptually, but no FK issues)
  const result1 = await client.execute('DELETE FROM user_badges');
  console.log(`Deleted ${result1.rowsAffected} rows from user_badges`);

  const result2 = await client.execute('DELETE FROM user_stats');
  console.log(`Deleted ${result2.rowsAffected} rows from user_stats`);

  const result3 = await client.execute('DELETE FROM streaks');
  console.log(`Deleted ${result3.rowsAffected} rows from streaks`);

  console.log('Done. Tables are now empty — safe to run drizzle:push.');
  client.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
