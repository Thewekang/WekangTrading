import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

// ============================================
// USER MODEL
// ============================================
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['USER', 'ADMIN'] }).notNull().default('USER'),
  emailVerified: integer('email_verified', { mode: 'timestamp' }),
  image: text('image'),
  inviteCodeId: text('invite_code_id'),
  resetCount: integer('reset_count').notNull().default(0),
  preferredTimezone: text('preferred_timezone').notNull().default('UTC'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
}, (table) => ({
  inviteCodeIdx: index('users_invite_code_idx').on(table.inviteCodeId),
}));

// Export types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Role = User['role'];

