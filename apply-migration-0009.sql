-- Migration 0009: Quote System + Discipline Tracker Enhancements
-- This migration adds the trading_quotes table and updates users & discipline_tracker_rows tables
-- Apply to production: wekangtrading-prod
-- Date: February 7, 2026
-- Version: 1.7.0

-- Create trading_quotes table
CREATE TABLE `trading_quotes` (
	`id` text PRIMARY KEY NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`category` text NOT NULL,
	`weight` integer DEFAULT 5 NOT NULL,
	`text_en` text NOT NULL,
	`text_bm` text NOT NULL,
	`author` text,
	`source_type` text,
	`display_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);

-- Create indexes for trading_quotes
CREATE INDEX `trading_quotes_category_idx` ON `trading_quotes` (`category`);
CREATE INDEX `trading_quotes_enabled_idx` ON `trading_quotes` (`enabled`);

-- Update discipline_tracker_rows table
ALTER TABLE `discipline_tracker_rows` ADD `is_aplus_day` integer DEFAULT false NOT NULL;
ALTER TABLE `discipline_tracker_rows` ADD `is_range_expansion_day` integer DEFAULT false NOT NULL;

-- Drop old discipline_tracker_rows columns (if they exist)
-- Note: SQLite doesn't support DROP COLUMN directly in all versions
-- These may need to be handled separately if errors occur
-- ALTER TABLE `discipline_tracker_rows` DROP COLUMN `aplus_confirmed`;
-- ALTER TABLE `discipline_tracker_rows` DROP COLUMN `range_expansion_confirmed`;

-- Update users table with quote system fields
ALTER TABLE `users` ADD `show_quotes` integer DEFAULT true NOT NULL;
ALTER TABLE `users` ADD `quotes_cooldown_minutes` integer DEFAULT 15 NOT NULL;
ALTER TABLE `users` ADD `last_quote_shown_at` integer;
ALTER TABLE `users` ADD `last_quote_id` text;
ALTER TABLE `users` ADD `last_quote_language` text DEFAULT 'en';
ALTER TABLE `users` ADD `quote_show_count` integer DEFAULT 0 NOT NULL;
