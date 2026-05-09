import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { tradingAccounts } from './tradingAccounts';
import { users } from './users';

// ============================================
// TRADING DAY CHECKLIST MODEL
// ============================================

/**
 * trading_day_checklists — Per-account daily trading checklist.
 *
 * One row per (user, account, date). Date is stored as a YYYY-MM-DD string
 * in the account's dailyResetTimezone so it always reflects the correct
 * trading session day regardless of UTC offset.
 *
 * itemStates stores a JSON map:
 *   { [itemKey: string]: { checked: boolean; remark?: string } }
 *
 * All 18 checklist item keys are defined in lib/constants.ts CHECKLIST_PHASES.
 */
export const tradingDayChecklists = sqliteTable(
  'trading_day_checklists',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    tradingAccountId: text('trading_account_id')
      .notNull()
      .references(() => tradingAccounts.id, { onDelete: 'cascade' }),

    /** Local trading day in account timezone (YYYY-MM-DD) */
    tradeDate: text('trade_date').notNull(),

    /**
     * JSON map: { [itemKey]: { checked: boolean; remark?: string } }
     * Stored as a TEXT column — parse with JSON.parse on read.
     */
    itemStates: text('item_states').notNull().default('{}'),

    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),

    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex('checklist_user_account_date_idx').on(
      table.userId,
      table.tradingAccountId,
      table.tradeDate,
    ),
  ],
);

export type TradingDayChecklist = typeof tradingDayChecklists.$inferSelect;
export type NewTradingDayChecklist = typeof tradingDayChecklists.$inferInsert;
