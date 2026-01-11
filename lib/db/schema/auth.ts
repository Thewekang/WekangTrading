import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

// ============================================
// SESSION MODEL (NextAuth)
// ============================================
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionToken: text('session_token').notNull().unique(),
  userId: text('user_id').notNull(),
  expires: integer('expires', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  userIdx: index('sessions_user_idx').on(table.userId),
}));

// ============================================
// ACCOUNT MODEL (NextAuth - Future OAuth)
// ============================================
export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull(),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refreshToken: text('refresh_token'),
  accessToken: text('access_token'),
  expiresAt: integer('expires_at'),
  tokenType: text('token_type'),
  scope: text('scope'),
  idToken: text('id_token'),
}, (table) => ({
  userIdx: index('accounts_user_idx').on(table.userId),
  providerAccountUnique: uniqueIndex('accounts_provider_account_unique').on(table.provider, table.providerAccountId),
}));

// Export types
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
