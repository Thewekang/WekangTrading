import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { users } from './users';

// ============================================
// SOP TYPE MODEL (Admin Configurable)
// ============================================
export const sopTypes = sqliteTable('sop_types', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull().unique(),
  description: text('description'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  
  // SOP Detail Fields (Feature 5: Rich text strategy documentation)
  // Separate content for SHORT and LONG entry strategies
  detailContentShort: text('detail_content_short'), // HTML for short entry strategy
  detailContentLong: text('detail_content_long'), // HTML for long entry strategy
  detailEnabledShort: integer('detail_enabled_short', { mode: 'boolean' }).notNull().default(false),
  detailEnabledLong: integer('detail_enabled_long', { mode: 'boolean' }).notNull().default(false),
  detailUpdatedAt: integer('detail_updated_at', { mode: 'timestamp' }),
  detailUpdatedBy: text('detail_updated_by').references(() => users.id),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
}, (table) => ({
  activeSortIdx: index('sop_types_active_sort_idx').on(table.active, table.sortOrder),
  detailEnabledShortIdx: index('sop_types_detail_enabled_short_idx').on(table.detailEnabledShort),
  detailEnabledLongIdx: index('sop_types_detail_enabled_long_idx').on(table.detailEnabledLong),
}));

// Export types
export type SopType = typeof sopTypes.$inferSelect;
export type NewSopType = typeof sopTypes.$inferInsert;
