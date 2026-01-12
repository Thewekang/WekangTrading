import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';

// ============================================
// INDIVIDUAL TRADE MODEL
// ============================================
export const individualTrades = sqliteTable('individual_trades', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull(),
  dailySummaryId: text('daily_summary_id'),
  sopTypeId: text('sop_type_id'),
  tradeTimestamp: integer('trade_timestamp', { mode: 'timestamp' }).notNull(),
  result: text('result', { enum: ['WIN', 'LOSS'] }).notNull(),
  sopFollowed: integer('sop_followed', { mode: 'boolean' }).notNull(),
  profitLossUsd: real('profit_loss_usd').notNull(),
  marketSession: text('market_session', { enum: ['ASIA', 'EUROPE', 'US', 'ASIA_EUROPE_OVERLAP', 'EUROPE_US_OVERLAP'] }).notNull(),
  symbol: text('symbol'), // Trading symbol (e.g., EURUSD, GBPJPY) - optional
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
}, (table) => ({
  userTimestampIdx: index('individual_trades_user_timestamp_idx').on(table.userId, table.tradeTimestamp),
  dailySummaryIdx: index('individual_trades_daily_summary_idx').on(table.dailySummaryId),
  sopTypeIdx: index('individual_trades_sop_type_idx').on(table.sopTypeId),
  marketSessionIdx: index('individual_trades_market_session_idx').on(table.marketSession),
  resultIdx: index('individual_trades_result_idx').on(table.result),
}));

// Export types
export type IndividualTrade = typeof individualTrades.$inferSelect;
export type NewIndividualTrade = typeof individualTrades.$inferInsert;
