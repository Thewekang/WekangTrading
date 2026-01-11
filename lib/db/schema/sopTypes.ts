import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

// ============================================
// SOP TYPE MODEL (Admin Configurable)
// ============================================
export const sopTypes = sqliteTable('sop_types', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull().unique(),
  description: text('description'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
}, (table) => ({
  activeSortIdx: index('sop_types_active_sort_idx').on(table.active, table.sortOrder),
}));

// Export types
export type SopType = typeof sopTypes.$inferSelect;
export type NewSopType = typeof sopTypes.$inferInsert;
