import { sqliteTable, text, integer, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { users } from './users';

// ============================================
// TRADING ACCOUNTS MODEL
// ============================================

/**
 * trading_accounts — One user can have many trading accounts.
 * All per-user data (trades, summaries, targets, badges, rankings, etc.)
 * is scoped to a tradingAccountId so accounts are fully isolated.
 */
export const tradingAccounts = sqliteTable('trading_accounts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(), // e.g. "Main Account", "FTMO Challenge", "Demo"
  accountType: text('account_type', {
    enum: ['PROP_FIRM', 'FUTURES', 'CFD', 'FOREX', 'SHARE', 'DEMO'],
  }).notNull().default('FUTURES'),
  currency: text('currency').notNull().default('USD'),
  startingBalance: real('starting_balance').notNull().default(0),
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
}, (table) => ({
  userIdIdx: index('trading_accounts_user_id_idx').on(table.userId),
  userDefaultIdx: index('trading_accounts_user_default_idx').on(table.userId, table.isDefault),
}));

// ============================================
// ACCOUNT RULES MODEL (1:1 with trading_accounts)
// ============================================

/**
 * account_rules — Per-account drawdown and consistency configuration.
 * One row per trading account. All fields nullable (NULL = no limit set).
 *
 * Cycle resets on each withdrawal_event:
 *   - dailyDrawdownPct  → current cycle's daily DD tracked from trades after last withdrawal
 *   - totalDrawdownPct  → total cycle DD tracked from startingBalance after last withdrawal
 *   - consistencyTargetPct → (bestDayCyclePnl / totalCyclePnl) × 100 ≤ target
 *   - cycleTargetProfitUsd → profit goal for current cycle; shows progress bar
 */
export const accountRules = sqliteTable('account_rules', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  tradingAccountId: text('trading_account_id')
    .notNull()
    .unique()
    .references(() => tradingAccounts.id, { onDelete: 'cascade' }),
  // Drawdown limits (as % of starting balance, e.g. 5 = 5%)
  dailyDrawdownPct: real('daily_drawdown_pct'),    // NULL = no daily DD limit
  totalDrawdownPct: real('total_drawdown_pct'),    // NULL = no total DD limit
  // Consistency rule: max % any single trading day can be of total cycle profit
  consistencyTargetPct: real('consistency_target_pct'), // NULL = no consistency rule
  // Cycle profit target (USD) — resets on withdrawal; distinct from user_targets
  cycleTargetProfitUsd: real('cycle_target_profit_usd'), // NULL = no profit target
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
});

// ============================================
// WITHDRAWAL EVENTS MODEL
// ============================================

/**
 * withdrawal_events — Each row records a withdrawal on a trading account.
 *
 * Inserting a row effectively starts a new "cycle":
 *   - currentCyclePnl  = SUM of trades AFTER this withdrawal_date
 *   - cumulativePnl    = SUM of ALL trades ever (never resets)
 *   - Daily DD, total DD, and consistency are all computed relative to the cycle start
 */
export const withdrawalEvents = sqliteTable('withdrawal_events', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  tradingAccountId: text('trading_account_id')
    .notNull()
    .references(() => tradingAccounts.id, { onDelete: 'cascade' }),
  withdrawalDate: text('withdrawal_date').notNull(), // ISO date string YYYY-MM-DD
  withdrawalAmount: real('withdrawal_amount').notNull(),
  balanceAtWithdrawal: real('balance_at_withdrawal').notNull(),
  cyclePnlAtWithdrawal: real('cycle_pnl_at_withdrawal').notNull(), // currentCyclePnl snapshot
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  accountIdIdx: index('withdrawal_events_account_id_idx').on(table.tradingAccountId),
  accountDateIdx: index('withdrawal_events_account_date_idx').on(table.tradingAccountId, table.withdrawalDate),
}));

// ============================================
// TYPES
// ============================================
export type TradingAccount = typeof tradingAccounts.$inferSelect;
export type NewTradingAccount = typeof tradingAccounts.$inferInsert;
export type AccountRules = typeof accountRules.$inferSelect;
export type NewAccountRules = typeof accountRules.$inferInsert;
export type WithdrawalEvent = typeof withdrawalEvents.$inferSelect;
export type NewWithdrawalEvent = typeof withdrawalEvents.$inferInsert;
