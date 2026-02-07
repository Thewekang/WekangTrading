import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { users } from './users';

/**
 * Discipline Tracker Settings Table
 * Stores user-specific configuration for the discipline tracker
 */
export const disciplineTrackerSettings = sqliteTable('discipline_tracker_settings', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Plan configuration
  maxTradesPerDay: integer('max_trades_per_day').notNull().default(2),
  
  // Outcome P&L mapping
  slValue: real('sl_value').notNull().default(-80),
  beValue: real('be_value').notNull().default(0),
  tp1Value: real('tp1_value').notNull().default(80),
  tp2Value: real('tp2_value').notNull().default(160),
  tp3Mode: text('tp3_mode', { enum: ['manual', 'fixed'] }).notNull().default('manual'),
  tp3FixedValue: real('tp3_fixed_value').default(240),
  
  // Win-rate formula
  winRateFormula: text('win_rate_formula', { enum: ['excludeBE', 'includeBE'] }).notNull().default('excludeBE'),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

/**
 * Discipline Tracker Rows Table
 * Stores daily trading discipline records
 */
export const disciplineTrackerRows = sqliteTable('discipline_tracker_rows', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Row metadata
  tradeDate: integer('trade_date', { mode: 'timestamp' }).notNull(),
  notes: text('notes').default(''),
  
  // Trade outcomes
  trade1Outcome: text('trade1_outcome', { enum: ['', 'EMPTY', 'TP3', 'TP2', 'TP1', 'BE', 'SL'] }).default(''),
  trade2Outcome: text('trade2_outcome', { enum: ['', 'EMPTY', 'TP3', 'TP2', 'TP1', 'BE', 'SL'] }).default(''),
  trade3Outcome: text('trade3_outcome', { enum: ['', 'EMPTY', 'TP3', 'TP2', 'TP1', 'BE', 'SL'] }).default(''),
  
  // TP3 manual amounts (used when TP3 mode is manual)
  trade1Tp3Amount: real('trade1_tp3_amount').default(0),
  trade2Tp3Amount: real('trade2_tp3_amount').default(0),
  trade3Tp3Amount: real('trade3_tp3_amount').default(0),
  
  // Rule toggles
  isAPlusDay: integer('is_aplus_day', { mode: 'boolean' }).notNull().default(false),
  isRangeExpansionDay: integer('is_range_expansion_day', { mode: 'boolean' }).notNull().default(false),
  sessionWindow: text('session_window', { enum: ['prime', 'non-prime'] }).notNull().default('non-prime'),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

// Type exports
export type DisciplineTrackerSettings = typeof disciplineTrackerSettings.$inferSelect;
export type NewDisciplineTrackerSettings = typeof disciplineTrackerSettings.$inferInsert;
export type DisciplineTrackerRow = typeof disciplineTrackerRows.$inferSelect;
export type NewDisciplineTrackerRow = typeof disciplineTrackerRows.$inferInsert;
