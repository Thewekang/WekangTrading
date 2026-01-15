import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

/**
 * User Stats table - Denormalized stats for fast badge calculation and progress tracking
 * Updated automatically when trades/summaries are modified
 */
export const userStats = sqliteTable('user_stats', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  
  // Trading Volume Stats
  totalTrades: integer('total_trades').notNull().default(0),
  totalWins: integer('total_wins').notNull().default(0),
  totalLosses: integer('total_losses').notNull().default(0),
  totalProfitUsd: real('total_profit_usd').notNull().default(0),
  
  // Win Streaks
  currentWinStreak: integer('current_win_streak').notNull().default(0),
  longestWinStreak: integer('longest_win_streak').notNull().default(0),
  
  // Logging Streaks
  currentLogStreak: integer('current_log_streak').notNull().default(0),
  longestLogStreak: integer('longest_log_streak').notNull().default(0),
  
  // SOP Compliance Stats
  totalSopCompliant: integer('total_sop_compliant').notNull().default(0),
  sopComplianceRate: real('sop_compliance_rate').notNull().default(0), // Percentage (0-100)
  currentSopStreak: integer('current_sop_streak').notNull().default(0), // Consecutive SOP-compliant trades
  longestSopStreak: integer('longest_sop_streak').notNull().default(0),
  
  // Session Stats (for session-specific badges)
  asiaTrades: integer('asia_trades').notNull().default(0),
  europeTrades: integer('europe_trades').notNull().default(0),
  usTrades: integer('us_trades').notNull().default(0),
  overlapTrades: integer('overlap_trades').notNull().default(0),
  
  // Performance Stats
  winRate: real('win_rate').notNull().default(0), // Percentage (0-100)
  bestWinRate: real('best_win_rate').notNull().default(0), // All-time best win rate (min 50 trades)
  
  // Achievement Stats
  badgesEarned: integer('badges_earned').notNull().default(0),
  totalPoints: integer('total_points').notNull().default(0),
  
  // Activity Tracking
  firstTradeDate: text('first_trade_date'), // ISO date string of first trade
  lastTradeDate: text('last_trade_date'), // ISO date string of most recent trade
  consecutiveLoggingDays: integer('consecutive_logging_days').notNull().default(0),
  totalLoggingDays: integer('total_logging_days').notNull().default(0), // Total unique days with trades
  
  // Special Milestones
  hasCompletedTarget: integer('has_completed_target', { mode: 'boolean' }).notNull().default(false),
  hasPerfectMonth: integer('has_perfect_month', { mode: 'boolean' }).notNull().default(false), // 100% win rate in a month
  maxTradesInDay: integer('max_trades_in_day').notNull().default(0), // Highest trades in single day
  
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Type inference
export type UserStats = typeof userStats.$inferSelect;
export type NewUserStats = typeof userStats.$inferInsert;
