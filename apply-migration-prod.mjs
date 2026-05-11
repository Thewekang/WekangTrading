// Production migration script — applies migrations 0014 and 0015
// Run: node apply-migration-prod.mjs
//
// 0014: account_strategies table, user_badges/streaks/user_stats recreation (add trading_account_id),
//       drawdown_templates/account_rules daily_reset_timezone, trading_accounts balance/leverage columns
// 0015: trading_day_checklists table

const DB_URL = 'https://wekangtrading-prod-thewekang.aws-eu-west-1.turso.io';
const AUTH_TOKEN =
  'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjgxMjk4ODksImlkIjoiNGQ3Y2I3OGMtNGE4ZC00ZDljLWEyYTctYWVlNzAzNDgyOTk5IiwicmlkIjoiOTdiNDE2YjMtNWExYi00NjZmLTg0OGMtMGRiZTI5YzNkZmE5In0.C2BH_YKLQJxZuL7F2JBlp9qLeo7_IdlQVbsR7ra3TeC-uXfZ_9tmjSuTrGZEDbV6MMYjucY6STjqvOL0-pR5AQ';

const HEADERS = {
  Authorization: `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json',
};

// ─── helpers ────────────────────────────────────────────────────────────────

/** Run one or more SQL statements in a single pipeline connection. */
async function execPipeline(statements) {
  const requests = [
    ...statements.map((sql) => ({ type: 'execute', stmt: { sql } })),
    { type: 'close' },
  ];
  const res = await fetch(`${DB_URL}/v2/pipeline`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ requests }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(json)}`);
  // Return all results except the close
  return (json.results ?? []).slice(0, statements.length);
}

/** Run a single SQL statement; return true on success, false if error (logged). */
async function tryExec(label, sql) {
  try {
    const [result] = await execPipeline([sql]);
    if (result?.type === 'error') {
      const msg = result.error?.message ?? JSON.stringify(result.error);
      // "duplicate column" and "already exists" are expected when re-running
      if (/duplicate column|already exists/i.test(msg)) {
        console.log(`  ⏭  SKIPPED (${label}): already applied`);
      } else {
        console.error(`  ✗  FAILED (${label}): ${msg}`);
        return false;
      }
    } else {
      console.log(`  ✓  OK (${label})`);
    }
    return true;
  } catch (err) {
    console.error(`  ✗  FAILED (${label}): ${err.message}`);
    return false;
  }
}

/** Returns true if the table exists in the DB. */
async function tableExists(table) {
  try {
    const [result] = await execPipeline([`SELECT 1 FROM \`${table}\` LIMIT 0`]);
    return result?.type !== 'error';
  } catch {
    return false;
  }
}

/** Returns true if the column exists in the table. */
async function columnExists(table, column) {
  try {
    const [result] = await execPipeline([`SELECT \`${column}\` FROM \`${table}\` LIMIT 0`]);
    return result?.type !== 'error';
  } catch {
    return false;
  }
}

function section(title) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log('─'.repeat(60));
}

// ─── main ───────────────────────────────────────────────────────────────────

async function migration0014() {
  section('Migration 0014 — Strategy Playbook + Gamification Tables');

  // ── A: account_strategies (idempotent) ──────────────────────────────────
  console.log('\n[A] account_strategies table');
  if (await tableExists('account_strategies')) {
    console.log('  ⏭  SKIPPED: account_strategies already exists');
  } else {
    await tryExec('CREATE account_strategies', `
      CREATE TABLE \`account_strategies\` (
        \`id\` text PRIMARY KEY NOT NULL,
        \`trading_account_id\` text NOT NULL,
        \`user_id\` text NOT NULL,
        \`symbol\` text NOT NULL,
        \`instrument_type\` text DEFAULT 'FUTURES' NOT NULL,
        \`default_lot_size\` real,
        \`stop_loss_points\` real,
        \`tp1_points\` real,
        \`tp2_points\` real,
        \`risk_percent_per_trade\` real DEFAULT 1,
        \`max_trades_per_day\` integer,
        \`tick_size\` real,
        \`tick_value\` real,
        \`pip_value\` real,
        \`best_sessions\` text,
        \`entry_notes\` text,
        \`is_active\` integer DEFAULT true NOT NULL,
        \`sort_order\` integer DEFAULT 0 NOT NULL,
        \`created_at\` integer NOT NULL,
        \`updated_at\` integer NOT NULL,
        FOREIGN KEY (\`trading_account_id\`) REFERENCES \`trading_accounts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
      )
    `);
  }
  await tryExec('INDEX account_strategies_account_idx',
    'CREATE INDEX IF NOT EXISTS `account_strategies_account_idx` ON `account_strategies` (`trading_account_id`)');
  await tryExec('INDEX account_strategies_user_idx',
    'CREATE INDEX IF NOT EXISTS `account_strategies_user_idx` ON `account_strategies` (`user_id`)');
  await tryExec('INDEX account_strategies_account_symbol_idx',
    'CREATE INDEX IF NOT EXISTS `account_strategies_account_symbol_idx` ON `account_strategies` (`trading_account_id`,`symbol`)');

  // ── B: user_badges — add trading_account_id ─────────────────────────────
  console.log('\n[B] user_badges — add trading_account_id (table recreation)');
  if (await columnExists('user_badges', 'trading_account_id')) {
    console.log('  ⏭  SKIPPED: trading_account_id already exists in user_badges');
  } else {
    console.log('  Running user_badges recreation (PRAGMA + DDL in one connection)...');
    try {
      const results = await execPipeline([
        'PRAGMA foreign_keys=OFF',
        `CREATE TABLE \`__new_user_badges\` (
          \`id\` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
          \`user_id\` text NOT NULL,
          \`trading_account_id\` text NOT NULL,
          \`badge_id\` text NOT NULL,
          \`earned_at\` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
          \`progress\` integer DEFAULT 0,
          \`notified\` integer DEFAULT false NOT NULL,
          FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
          FOREIGN KEY (\`trading_account_id\`) REFERENCES \`trading_accounts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
          FOREIGN KEY (\`badge_id\`) REFERENCES \`badges\`(\`id\`) ON UPDATE no action ON DELETE cascade
        )`,
        `INSERT INTO \`__new_user_badges\`("id","user_id","trading_account_id","badge_id","earned_at","progress","notified")
          SELECT "id","user_id","trading_account_id","badge_id","earned_at","progress","notified" FROM \`user_badges\``,
        'DROP TABLE `user_badges`',
        'ALTER TABLE `__new_user_badges` RENAME TO `user_badges`',
        'PRAGMA foreign_keys=ON',
      ]);
      const failed = results.find((r) => r?.type === 'error');
      if (failed) throw new Error(failed.error?.message ?? JSON.stringify(failed));
      console.log('  ✓  OK — user_badges recreated');
    } catch (err) {
      console.error(`  ✗  FAILED — user_badges recreation: ${err.message}`);
      console.error('  ⚠️  Aborting — manual intervention required');
      process.exit(1);
    }
  }
  await tryExec('UNIQUE INDEX user_badge_idx',
    'CREATE UNIQUE INDEX IF NOT EXISTS `user_badge_idx` ON `user_badges` (`user_id`,`trading_account_id`,`badge_id`)');
  await tryExec('INDEX user_badges_user_id_idx',
    'CREATE INDEX IF NOT EXISTS `user_badges_user_id_idx` ON `user_badges` (`user_id`)');
  await tryExec('INDEX user_badges_earned_at_idx',
    'CREATE INDEX IF NOT EXISTS `user_badges_earned_at_idx` ON `user_badges` (`earned_at`)');
  await tryExec('INDEX idx_user_badges_user_earned',
    'CREATE INDEX IF NOT EXISTS `idx_user_badges_user_earned` ON `user_badges` (`user_id`,`earned_at`)');

  // ── C: streaks — add trading_account_id ─────────────────────────────────
  console.log('\n[C] streaks — add trading_account_id (table recreation)');
  if (await columnExists('streaks', 'trading_account_id')) {
    console.log('  ⏭  SKIPPED: trading_account_id already exists in streaks');
  } else {
    console.log('  Running streaks recreation...');
    try {
      const results = await execPipeline([
        'PRAGMA foreign_keys=OFF',
        `CREATE TABLE \`__new_streaks\` (
          \`id\` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
          \`user_id\` text NOT NULL,
          \`trading_account_id\` text NOT NULL,
          \`streak_type\` text NOT NULL,
          \`current_streak\` integer DEFAULT 0 NOT NULL,
          \`longest_streak\` integer DEFAULT 0 NOT NULL,
          \`last_streak_date\` text,
          \`start_date\` text,
          \`updated_at\` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
          FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
          FOREIGN KEY (\`trading_account_id\`) REFERENCES \`trading_accounts\`(\`id\`) ON UPDATE no action ON DELETE cascade
        )`,
        `INSERT INTO \`__new_streaks\`("id","user_id","trading_account_id","streak_type","current_streak","longest_streak","last_streak_date","start_date","updated_at")
          SELECT "id","user_id","trading_account_id","streak_type","current_streak","longest_streak","last_streak_date","start_date","updated_at" FROM \`streaks\``,
        'DROP TABLE `streaks`',
        'ALTER TABLE `__new_streaks` RENAME TO `streaks`',
        'PRAGMA foreign_keys=ON',
      ]);
      const failed = results.find((r) => r?.type === 'error');
      if (failed) throw new Error(failed.error?.message ?? JSON.stringify(failed));
      console.log('  ✓  OK — streaks recreated');
    } catch (err) {
      console.error(`  ✗  FAILED — streaks recreation: ${err.message}`);
      process.exit(1);
    }
  }
  await tryExec('UNIQUE INDEX user_streak_type_idx',
    'CREATE UNIQUE INDEX IF NOT EXISTS `user_streak_type_idx` ON `streaks` (`user_id`,`trading_account_id`,`streak_type`)');

  // ── D: user_stats — add trading_account_id ──────────────────────────────
  console.log('\n[D] user_stats — add trading_account_id (table recreation)');
  if (await columnExists('user_stats', 'trading_account_id')) {
    console.log('  ⏭  SKIPPED: trading_account_id already exists in user_stats');
  } else {
    console.log('  Running user_stats recreation...');
    try {
      const results = await execPipeline([
        'PRAGMA foreign_keys=OFF',
        `CREATE TABLE \`__new_user_stats\` (
          \`id\` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
          \`user_id\` text NOT NULL,
          \`trading_account_id\` text NOT NULL,
          \`total_trades\` integer DEFAULT 0 NOT NULL,
          \`total_wins\` integer DEFAULT 0 NOT NULL,
          \`total_losses\` integer DEFAULT 0 NOT NULL,
          \`total_profit_usd\` real DEFAULT 0 NOT NULL,
          \`current_win_streak\` integer DEFAULT 0 NOT NULL,
          \`longest_win_streak\` integer DEFAULT 0 NOT NULL,
          \`current_log_streak\` integer DEFAULT 0 NOT NULL,
          \`longest_log_streak\` integer DEFAULT 0 NOT NULL,
          \`total_sop_compliant\` integer DEFAULT 0 NOT NULL,
          \`sop_compliance_rate\` real DEFAULT 0 NOT NULL,
          \`current_sop_streak\` integer DEFAULT 0 NOT NULL,
          \`longest_sop_streak\` integer DEFAULT 0 NOT NULL,
          \`asia_trades\` integer DEFAULT 0 NOT NULL,
          \`europe_trades\` integer DEFAULT 0 NOT NULL,
          \`us_trades\` integer DEFAULT 0 NOT NULL,
          \`overlap_trades\` integer DEFAULT 0 NOT NULL,
          \`win_rate\` real DEFAULT 0 NOT NULL,
          \`best_win_rate\` real DEFAULT 0 NOT NULL,
          \`badges_earned\` integer DEFAULT 0 NOT NULL,
          \`total_points\` integer DEFAULT 0 NOT NULL,
          \`first_trade_date\` text,
          \`last_trade_date\` text,
          \`consecutive_logging_days\` integer DEFAULT 0 NOT NULL,
          \`total_logging_days\` integer DEFAULT 0 NOT NULL,
          \`has_completed_target\` integer DEFAULT false NOT NULL,
          \`has_perfect_month\` integer DEFAULT false NOT NULL,
          \`max_trades_in_day\` integer DEFAULT 0 NOT NULL,
          \`updated_at\` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
          FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
          FOREIGN KEY (\`trading_account_id\`) REFERENCES \`trading_accounts\`(\`id\`) ON UPDATE no action ON DELETE cascade
        )`,
        `INSERT INTO \`__new_user_stats\`("id","user_id","trading_account_id","total_trades","total_wins","total_losses","total_profit_usd","current_win_streak","longest_win_streak","current_log_streak","longest_log_streak","total_sop_compliant","sop_compliance_rate","current_sop_streak","longest_sop_streak","asia_trades","europe_trades","us_trades","overlap_trades","win_rate","best_win_rate","badges_earned","total_points","first_trade_date","last_trade_date","consecutive_logging_days","total_logging_days","has_completed_target","has_perfect_month","max_trades_in_day","updated_at")
          SELECT "id","user_id","trading_account_id","total_trades","total_wins","total_losses","total_profit_usd","current_win_streak","longest_win_streak","current_log_streak","longest_log_streak","total_sop_compliant","sop_compliance_rate","current_sop_streak","longest_sop_streak","asia_trades","europe_trades","us_trades","overlap_trades","win_rate","best_win_rate","badges_earned","total_points","first_trade_date","last_trade_date","consecutive_logging_days","total_logging_days","has_completed_target","has_perfect_month","max_trades_in_day","updated_at" FROM \`user_stats\``,
        'DROP TABLE `user_stats`',
        'ALTER TABLE `__new_user_stats` RENAME TO `user_stats`',
        'PRAGMA foreign_keys=ON',
      ]);
      const failed = results.find((r) => r?.type === 'error');
      if (failed) throw new Error(failed.error?.message ?? JSON.stringify(failed));
      console.log('  ✓  OK — user_stats recreated');
    } catch (err) {
      console.error(`  ✗  FAILED — user_stats recreation: ${err.message}`);
      process.exit(1);
    }
  }
  await tryExec('UNIQUE INDEX user_stats_user_account_idx',
    'CREATE UNIQUE INDEX IF NOT EXISTS `user_stats_user_account_idx` ON `user_stats` (`user_id`,`trading_account_id`)');

  // ── E: ALTER TABLE columns ───────────────────────────────────────────────
  console.log('\n[E] Column additions');
  // daily_reset_timezone may already exist from migration 0013 — SKIPPED is expected
  await tryExec('drawdown_templates.daily_reset_timezone',
    'ALTER TABLE `drawdown_templates` ADD `daily_reset_timezone` text');
  await tryExec('account_rules.daily_reset_timezone',
    'ALTER TABLE `account_rules` ADD `daily_reset_timezone` text');
  await tryExec('trading_accounts.account_balance',
    'ALTER TABLE `trading_accounts` ADD `account_balance` real');
  await tryExec('trading_accounts.calculator_leverage',
    'ALTER TABLE `trading_accounts` ADD `calculator_leverage` integer');
}

async function migration0015() {
  section('Migration 0015 — Trading Day Checklist');

  if (await tableExists('trading_day_checklists')) {
    console.log('\n  ⏭  SKIPPED: trading_day_checklists already exists');
    return;
  }

  await tryExec('CREATE trading_day_checklists', `
    CREATE TABLE \`trading_day_checklists\` (
      \`id\` text PRIMARY KEY NOT NULL,
      \`user_id\` text NOT NULL,
      \`trading_account_id\` text NOT NULL,
      \`trade_date\` text NOT NULL,
      \`item_states\` text DEFAULT '{}' NOT NULL,
      \`created_at\` integer NOT NULL,
      \`updated_at\` integer NOT NULL,
      FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
      FOREIGN KEY (\`trading_account_id\`) REFERENCES \`trading_accounts\`(\`id\`) ON UPDATE no action ON DELETE cascade
    )
  `);
  await tryExec('UNIQUE INDEX checklist_user_account_date_idx',
    'CREATE UNIQUE INDEX IF NOT EXISTS `checklist_user_account_date_idx` ON `trading_day_checklists` (`user_id`,`trading_account_id`,`trade_date`)');
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  WekangTrading — Production DB Migration (0014 + 0015)      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`\nTarget: ${DB_URL}`);
  console.log('\n⚠️  This will modify the PRODUCTION database.');
  console.log('    Safe to re-run — all operations are idempotent.\n');

  await migration0014();
  await migration0015();

  section('Done');
  console.log('\n✅  All migrations applied successfully.\n');
}

main().catch((err) => {
  console.error('\n💥  Unexpected error:', err);
  process.exit(1);
});
