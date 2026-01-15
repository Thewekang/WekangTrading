import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

/**
 * Badges table - Defines all available achievement badges
 */
export const badges = sqliteTable('badges', {
  id: text('id').primaryKey(), // e.g., 'hundred_club', 'hot_streak'
  name: text('name').notNull(), // Display name: 'Century', 'On Fire'
  description: text('description').notNull(), // 'Reached 100 recorded trades'
  category: text('category').notNull(), // 'VOLUME', 'STREAK', 'PROFIT', 'CONSISTENCY', 'SOP', 'PERFORMANCE', 'SPECIAL'
  tier: text('tier').notNull(), // 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM'
  icon: text('icon').notNull(), // Emoji icon: '📊', '🔥', '💰'
  requirement: text('requirement').notNull(), // JSON string with badge requirements
  points: integer('points').notNull().default(10), // Points awarded for earning badge
  order: integer('order').notNull(), // Display order within category
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  categoryIdx: index('badges_category_idx').on(table.category),
  orderIdx: index('badges_order_idx').on(table.order),
}));

/**
 * User Badges table - Junction table for users and their earned badges
 */
export const userBadges = sqliteTable('user_badges', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  badgeId: text('badge_id').notNull().references(() => badges.id, { onDelete: 'cascade' }),
  earnedAt: text('earned_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  progress: integer('progress').default(0), // Current progress to next tier (if applicable)
  notified: integer('notified', { mode: 'boolean' }).notNull().default(false), // Has user been notified?
}, (table) => ({
  userBadgeIdx: uniqueIndex('user_badge_idx').on(table.userId, table.badgeId),
  userIdIdx: index('user_badges_user_id_idx').on(table.userId),
  earnedAtIdx: index('user_badges_earned_at_idx').on(table.earnedAt),
}));

// Type inference
export type Badge = typeof badges.$inferSelect;
export type NewBadge = typeof badges.$inferInsert;
export type UserBadge = typeof userBadges.$inferSelect;
export type NewUserBadge = typeof userBadges.$inferInsert;
