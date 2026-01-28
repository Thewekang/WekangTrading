import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { users } from './users';

// ============================================
// USER RANKINGS MODEL
// ============================================
export const userRankings = sqliteTable('user_rankings', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  rank: integer('rank').notNull(),
  totalUsers: integer('total_users').notNull(),
  winRate: real('win_rate').notNull(),
  sopRate: real('sop_rate').notNull(),
  totalPnl: real('total_pnl').notNull(),
  totalTrades: integer('total_trades').notNull(),
  percentile: real('percentile').notNull(),
  rankChange: integer('rank_change').notNull().default(0), // +1 = improved, -1 = dropped
  calculatedAt: integer('calculated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  userIdIdx: index('user_rankings_user_id_idx').on(table.userId),
  calculatedAtIdx: index('user_rankings_calculated_at_idx').on(table.calculatedAt),
  rankIdx: index('user_rankings_rank_idx').on(table.rank),
}));

// Export types
export type UserRanking = typeof userRankings.$inferSelect;
export type NewUserRanking = typeof userRankings.$inferInsert;
