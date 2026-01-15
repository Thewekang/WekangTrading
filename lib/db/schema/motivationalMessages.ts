import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

/**
 * Motivational Messages table - Stores achievement notifications and motivational messages for users
 */
export const motivationalMessages = sqliteTable('motivational_messages', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  messageType: text('message_type').notNull(), // 'ACHIEVEMENT', 'STREAK', 'MILESTONE', 'ENCOURAGEMENT', 'PERFORMANCE', 'REMINDER'
  title: text('title').notNull(), // Message title: '🏆 New Achievement Unlocked!'
  message: text('message').notNull(), // Message body
  metadata: text('metadata'), // JSON string with additional data (badge details, streak count, etc.)
  isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userIdIdx: index('motivational_messages_user_id_idx').on(table.userId),
  createdAtIdx: index('motivational_messages_created_at_idx').on(table.createdAt),
  isReadIdx: index('motivational_messages_is_read_idx').on(table.isRead),
}));

// Type inference
export type MotivationalMessage = typeof motivationalMessages.$inferSelect;
export type NewMotivationalMessage = typeof motivationalMessages.$inferInsert;
