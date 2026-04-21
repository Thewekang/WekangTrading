/**
 * Cleanup script: delete all USER-role accounts and their data from the DB.
 * Admins are preserved. Run in --dry-run mode first to preview.
 */
import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const isDryRun = process.argv.includes('--dry-run');

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function log(msg: string) {
  console.log(isDryRun ? `[DRY RUN] ${msg}` : msg);
}

(async () => {
  console.log(`\n🧹 Cleaning up USER accounts... ${isDryRun ? '(DRY RUN)' : '(LIVE)'}\n`);

  // Get all USER-role users
  const usersResult = await db.execute(`SELECT id, name, email FROM users WHERE role = 'USER'`);
  const userRows = usersResult.rows as Array<{ id: string; name: string; email: string }>;

  if (userRows.length === 0) {
    console.log('✅ No USER accounts found — nothing to do.');
    process.exit(0);
  }

  console.log(`Found ${userRows.length} USER account(s):`);
  userRows.forEach((u) => console.log(`  - ${u.name} <${u.email}> (${u.id})`));
  console.log('');

  for (const user of userRows) {
    await log(`Processing user: ${user.name} <${user.email}>`);

    // Get their trading account IDs
    const accResult = await db.execute({
      sql: 'SELECT id, name FROM trading_accounts WHERE user_id = ?',
      args: [user.id],
    });
    const accRows = accResult.rows as Array<{ id: string; name: string }>;
    const accIds = accRows.map((a) => a.id);
    await log(`  Trading accounts: ${accIds.length > 0 ? accIds.join(', ') : 'none'}`);

    if (!isDryRun) {
      // Delete account-scoped data
      if (accIds.length > 0) {
        const placeholders = accIds.map(() => '?').join(', ');
        for (const sql of [
          `DELETE FROM account_rules WHERE trading_account_id IN (${placeholders})`,
          `DELETE FROM withdrawal_events WHERE trading_account_id IN (${placeholders})`,
          `DELETE FROM user_rankings WHERE trading_account_id IN (${placeholders})`,
          `DELETE FROM discipline_tracker_settings WHERE trading_account_id IN (${placeholders})`,
          `DELETE FROM discipline_tracker_rows WHERE trading_account_id IN (${placeholders})`,
          `DELETE FROM user_stats WHERE trading_account_id IN (${placeholders})`,
          `DELETE FROM streaks WHERE trading_account_id IN (${placeholders})`,
          `DELETE FROM user_badges WHERE trading_account_id IN (${placeholders})`,
          `DELETE FROM user_targets WHERE trading_account_id IN (${placeholders})`,
          `DELETE FROM daily_summaries WHERE trading_account_id IN (${placeholders})`,
          `DELETE FROM individual_trades WHERE trading_account_id IN (${placeholders})`,
        ]) {
          await db.execute({ sql, args: accIds });
        }
        // Delete trading accounts
        await db.execute({
          sql: `DELETE FROM trading_accounts WHERE user_id = ?`,
          args: [user.id],
        });
      }

      // Delete user-scoped data not tied to a specific account
      for (const sql of [
        `DELETE FROM user_pinned_sops WHERE user_id = ?`,
        `DELETE FROM motivational_messages WHERE user_id = ?`,
        `DELETE FROM sessions WHERE user_id = ?`,
        `DELETE FROM accounts WHERE user_id = ?`,
      ]) {
        await db.execute({ sql, args: [user.id] }).catch(() => {}); // ignore if table doesn't exist
      }

      // Delete the user
      await db.execute({ sql: `DELETE FROM users WHERE id = ?`, args: [user.id] });
    }

    await log(`  ✅ Done: ${user.name}`);
  }

  if (!isDryRun) {
    console.log('\n✅ All USER accounts cleaned up.');
  } else {
    console.log('\n⚠️  Dry run complete — no data was deleted. Run without --dry-run to apply.');
  }

  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
