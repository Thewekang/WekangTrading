import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

/**
 * Streaks table - Tracks user streaks (winning days, logging consistency, SOP compliance)
 */
export const streaks = sqliteTable('streaks', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  streakType: text('streak_type').notNull(), // 'WIN_STREAK', 'LOG_STREAK', 'SOP_STREAK'
  currentStreak: integer('current_streak').notNull().default(0), // Current consecutive streak count
  longestStreak: integer('longest_streak').notNull().default(0), // All-time longest streak
  lastStreakDate: text('last_streak_date'), // ISO date string (YYYY-MM-DD) of last streak day
  startDate: text('start_date'), // When current streak started
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userTypeIdx: uniqueIndex('user_streak_type_idx').on(table.userId, table.streakType),
}));

// Type inference
export type Streak = typeof streaks.$inferSelect;
export type NewStreak = typeof streaks.$inferInsert;
