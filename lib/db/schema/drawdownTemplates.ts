import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';

// ============================================
// DRAWDOWN TEMPLATES MODEL
// ============================================

/**
 * drawdown_templates — Admin-managed preset rule sets that users can apply to an account.
 *
 * Examples:
 *   - "FTMO Standard"     → dailyDD=5%, totalDD=10%, consistency=30%, targetGain=10%
 *   - "My Futures Rules"  → dailyDD=2%, totalDD=8%, consistency=null, targetGain=5%
 *
 * When a user creates/edits an account they can pick a template to auto-fill account_rules,
 * or configure rules manually.
 */
export const drawdownTemplates = sqliteTable('drawdown_templates', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  // Optional: only show template when creating an account of this type
  accountType: text('account_type', {
    enum: ['PROP_FIRM', 'FUTURES', 'CFD', 'FOREX', 'SHARE', 'DEMO'],
  }),
  // Rule values (all nullable — template may define only some rules)
  dailyDrawdownPct: real('daily_drawdown_pct'),
  totalDrawdownPct: real('total_drawdown_pct'),
  consistencyTargetPct: real('consistency_target_pct'),
  // targetGainPct: % of starting balance to auto-fill cycleTargetProfitUsd
  targetGainPct: real('target_gain_pct'),
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  accountTypeIdx: index('drawdown_templates_account_type_idx').on(table.accountType),
  isDefaultIdx: index('drawdown_templates_is_default_idx').on(table.isDefault),
}));

// ============================================
// TYPES
// ============================================
export type DrawdownTemplate = typeof drawdownTemplates.$inferSelect;
export type NewDrawdownTemplate = typeof drawdownTemplates.$inferInsert;
