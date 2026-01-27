import { sqliteTable, text, integer, primaryKey, index } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { sopTypes } from './sopTypes';

/**
 * User Pinned SOPs - Track user's favorite SOP types (max 3)
 * Each user can pin up to 3 SOP types for quick access
 */
export const userPinnedSops = sqliteTable('user_pinned_sops', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sopTypeId: text('sop_type_id').notNull().references(() => sopTypes.id, { onDelete: 'cascade' }),
  pinnedAt: integer('pinned_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.sopTypeId] }),
  userIdx: index('user_pinned_sops_user_idx').on(table.userId),
  sopTypeIdx: index('user_pinned_sops_sop_type_idx').on(table.sopTypeId),
}));

// Export types
export type UserPinnedSop = typeof userPinnedSops.$inferSelect;
export type NewUserPinnedSop = typeof userPinnedSops.$inferInsert;
