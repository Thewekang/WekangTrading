import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

// ============================================
// INVITE CODE MODEL
// ============================================
export const inviteCodes = sqliteTable('invite_codes', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: text('code').notNull().unique(),
  createdBy: text('created_by').notNull(),
  maxUses: integer('max_uses').notNull().default(1),
  usedCount: integer('used_count').notNull().default(0),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
}, (table) => ({
  codeIdx: index('invite_codes_code_idx').on(table.code),
  activeExpiresIdx: index('invite_codes_active_expires_idx').on(table.active, table.expiresAt),
}));

// Export types
export type InviteCode = typeof inviteCodes.$inferSelect;
export type NewInviteCode = typeof inviteCodes.$inferInsert;
