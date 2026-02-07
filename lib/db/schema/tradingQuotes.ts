import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ============================================
// TRADING QUOTES MODEL
// ============================================

export const tradingQuotes = sqliteTable('trading_quotes', {
  id: text('id').primaryKey(), // "q-101", "q-102", etc.
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  category: text('category', {
    enum: [
      'discipline',
      'loss',
      'win',
      'confidence',
      'patience',
      'overtrading',
      'risk',
      'mental',
      'general',
    ],
  }).notNull(),
  weight: integer('weight').notNull().default(5), // 1-10
  textEn: text('text_en').notNull(),
  textBm: text('text_bm').notNull(),
  author: text('author'),
  sourceType: text('source_type', { enum: ['original', 'publicFigure'] }),
  displayCount: integer('display_count').notNull().default(0), // Analytics
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  categoryIdx: index('trading_quotes_category_idx').on(table.category),
  enabledIdx: index('trading_quotes_enabled_idx').on(table.enabled),
}));

// Export types
export type TradingQuote = typeof tradingQuotes.$inferSelect;
export type NewTradingQuote = typeof tradingQuotes.$inferInsert;

export type QuoteCategory = TradingQuote['category'];
export type QuoteSourceType = TradingQuote['sourceType'];
