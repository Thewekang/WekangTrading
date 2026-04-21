import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users } from './users';

// ============================================
// ADMIN SETTINGS MODEL
// ============================================

/**
 * admin_settings — Key-value store for system-wide configurable constants.
 *
 * Replaces hardcoded values in services:
 *   'min_trades_for_ranking'     → was MIN_TRADES_FOR_RANKING = 10 in rankingService.ts
 *   'ranking_cache_duration_ms'  → was CACHE_DURATION = 3600000 (1h) in rankingService.ts
 *
 * Keys use snake_case strings. Values stored as TEXT and parsed at read time.
 */
export const adminSettings = sqliteTable('admin_settings', {
  key: text('key').primaryKey(),   // e.g. 'min_trades_for_ranking'
  value: text('value').notNull(),  // stored as string, parsed by consumer
  description: text('description'),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
  updatedBy: text('updated_by').references(() => users.id, { onDelete: 'set null' }),
});

// ============================================
// TYPES
// ============================================
export type AdminSetting = typeof adminSettings.$inferSelect;
export type NewAdminSetting = typeof adminSettings.$inferInsert;
