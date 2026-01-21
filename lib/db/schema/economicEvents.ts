import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const economicEvents = sqliteTable('economic_events', {
  id: text('id').primaryKey(),
  eventDate: integer('event_date', { mode: 'timestamp' }).notNull(),
  country: text('country', { length: 3 }).notNull(),
  currency: text('currency', { length: 3 }).notNull(),
  eventName: text('event_name').notNull(),
  indicator: text('indicator'),
  importance: text('importance').notNull(), // 'HIGH', 'MEDIUM', 'LOW'
  forecast: text('forecast'),
  actual: text('actual'),
  previous: text('previous'),
  period: text('period'),
  source: text('source').notNull().default('API'), // 'API' or 'MANUAL'
  fetchedAt: integer('fetched_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export type EconomicEvent = typeof economicEvents.$inferSelect;
export type NewEconomicEvent = typeof economicEvents.$inferInsert;
