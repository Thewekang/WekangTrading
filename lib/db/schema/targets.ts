import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';

// ============================================
// USER TARGET MODEL
// ============================================
export const userTargets = sqliteTable('user_targets', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  targetType: text('target_type', { enum: ['WEEKLY', 'MONTHLY', 'YEARLY'] }).notNull(),
  targetWinRate: real('target_win_rate').notNull(),
  targetSopRate: real('target_sop_rate').notNull(),
  targetProfitUsd: real('target_profit_usd'),
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp' }).notNull(),
  notes: text('notes'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
}, (table) => ({
  userIdx: index('user_targets_user_idx').on(table.userId),
  userTypeActiveIdx: index('user_targets_user_type_active_idx').on(table.userId, table.targetType, table.active),
  userActiveDatesIdx: index('user_targets_user_active_dates_idx').on(table.userId, table.active, table.startDate, table.endDate),
}));

// Export types
export type UserTarget = typeof userTargets.$inferSelect;
export type NewUserTarget = typeof userTargets.$inferInsert;
