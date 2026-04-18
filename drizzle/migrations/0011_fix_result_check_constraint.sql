-- Migration 0011: Fix result CHECK constraint to include 'BE' (break-even)
-- 
-- The staging/production database has a CHECK constraint result IN ('WIN','LOSS')
-- This was set by an earlier drizzle-kit push that predates migration files.
-- Migration 0010 changed result to nullable but did NOT update the CHECK constraint.
-- This migration recreates individual_trades with the correct constraint.
--
-- SQLite does not support ALTER TABLE to modify CHECK constraints.
-- We must recreate the table with the new definition.

PRAGMA foreign_keys=OFF;
--> statement-breakpoint

-- Step 1: Create new table with updated CHECK constraint
CREATE TABLE `individual_trades_new` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `daily_summary_id` text,
  `sop_type_id` text,
  `entry_type` text NOT NULL DEFAULT 'TRANSACTION',
  `trade_timestamp` integer NOT NULL,
  `result` text CHECK(`result` IN ('WIN','LOSS','BE')),
  `sop_followed` integer,
  `profit_loss_usd` real NOT NULL,
  `market_session` text NOT NULL,
  `symbol` text,
  `notes` text,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint

-- Step 2: Copy all existing data
INSERT INTO `individual_trades_new` SELECT * FROM `individual_trades`;
--> statement-breakpoint

-- Step 3: Drop old table
DROP TABLE `individual_trades`;
--> statement-breakpoint

-- Step 4: Rename new table to original name
ALTER TABLE `individual_trades_new` RENAME TO `individual_trades`;
--> statement-breakpoint

-- Step 5: Recreate all indexes
CREATE INDEX `individual_trades_user_timestamp_idx` ON `individual_trades` (`user_id`,`trade_timestamp`);
--> statement-breakpoint
CREATE INDEX `individual_trades_daily_summary_idx` ON `individual_trades` (`daily_summary_id`);
--> statement-breakpoint
CREATE INDEX `individual_trades_sop_type_idx` ON `individual_trades` (`sop_type_id`);
--> statement-breakpoint
CREATE INDEX `individual_trades_market_session_idx` ON `individual_trades` (`market_session`);
--> statement-breakpoint
CREATE INDEX `individual_trades_result_idx` ON `individual_trades` (`result`);
--> statement-breakpoint
CREATE INDEX `idx_trades_user_timestamp_result` ON `individual_trades` (`user_id`,`trade_timestamp`,`result`);
--> statement-breakpoint
CREATE INDEX `idx_trades_user_date_result` ON `individual_trades` (`user_id`,`trade_timestamp`,`result`);
--> statement-breakpoint
CREATE INDEX `idx_trades_user_session` ON `individual_trades` (`user_id`,`market_session`);
--> statement-breakpoint

PRAGMA foreign_keys=ON;
