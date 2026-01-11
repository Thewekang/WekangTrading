import { sqliteTable, text, integer, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

// ============================================
// DAILY SUMMARY MODEL (Auto-calculated)
// ============================================
export const dailySummaries = sqliteTable('daily_summaries', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull(),
  tradeDate: integer('trade_date', { mode: 'timestamp' }).notNull(),
  totalTrades: integer('total_trades').notNull().default(0),
  totalWins: integer('total_wins').notNull().default(0),
  totalLosses: integer('total_losses').notNull().default(0),
  totalSopFollowed: integer('total_sop_followed').notNull().default(0),
  totalSopNotFollowed: integer('total_sop_not_followed').notNull().default(0),
  totalProfitLossUsd: real('total_profit_loss_usd').notNull().default(0),
  asiaSessionTrades: integer('asia_session_trades').notNull().default(0),
  asiaSessionWins: integer('asia_session_wins').notNull().default(0),
  europeSessionTrades: integer('europe_session_trades').notNull().default(0),
  europeSessionWins: integer('europe_session_wins').notNull().default(0),
  usSessionTrades: integer('us_session_trades').notNull().default(0),
  usSessionWins: integer('us_session_wins').notNull().default(0),
  overlapSessionTrades: integer('overlap_session_trades').notNull().default(0),
  overlapSessionWins: integer('overlap_session_wins').notNull().default(0),
  bestSession: text('best_session', { enum: ['ASIA', 'EUROPE', 'US', 'ASIA_EUROPE_OVERLAP', 'EUROPE_US_OVERLAP'] }),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
}, (table) => ({
  userDateUnique: uniqueIndex('daily_summaries_user_date_unique').on(table.userId, table.tradeDate),
  userDateIdx: index('daily_summaries_user_date_idx').on(table.userId, table.tradeDate),
  tradeDateIdx: index('daily_summaries_trade_date_idx').on(table.tradeDate),
}));

// Export types
export type DailySummary = typeof dailySummaries.$inferSelect;
export type NewDailySummary = typeof dailySummaries.$inferInsert;
