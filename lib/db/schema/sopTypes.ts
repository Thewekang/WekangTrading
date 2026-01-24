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
  detailContent: text('detail_content'), // HTML content with base64 images
  detailEnabled: integer('detail_enabled', { mode: 'boolean' }).notNull().default(false),
  detailUpdatedAt: integer('detail_updated_at', { mode: 'timestamp' }),
  detailUpdatedBy: text('detail_updated_by').references(() => users.id),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
}, (table) => ({
  activeSortIdx: index('sop_types_active_sort_idx').on(table.active, table.sortOrder),
  detailEnabledIdx: index('sop_types_detail_enabled_idx').on(table.detailEnabled),
}));

// Export types
export type SopType = typeof sopTypes.$inferSelect;
export type NewSopType = typeof sopTypes.$inferInsert;
