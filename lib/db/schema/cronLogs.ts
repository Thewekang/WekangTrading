import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const cronLogs = sqliteTable('cron_logs', {
  id: text('id').primaryKey(),
  jobName: text('job_name').notNull(), // e.g., 'economic-calendar-sync'
  status: text('status', { enum: ['SUCCESS', 'ERROR', 'RUNNING'] }).notNull(),
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  duration: integer('duration'), // milliseconds
  message: text('message'),
  details: text('details'), // JSON string with additional info
  itemsProcessed: integer('items_processed'),
  errorCode: text('error_code'),
  errorMessage: text('error_message'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export type CronLog = typeof cronLogs.$inferSelect;
export type NewCronLog = typeof cronLogs.$inferInsert;
