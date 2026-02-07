-- Migration 0009: Quote System ONLY (Production)
-- This migration only adds quote system features
-- Skips discipline_tracker_rows updates (table doesn't exist in prod)
-- Date: February 8, 2026
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

-- Update users table with quote system fields
ALTER TABLE `users` ADD `show_quotes` integer DEFAULT true NOT NULL;
ALTER TABLE `users` ADD `quotes_cooldown_minutes` integer DEFAULT 15 NOT NULL;
ALTER TABLE `users` ADD `last_quote_shown_at` integer;
ALTER TABLE `users` ADD `last_quote_id` text;
ALTER TABLE `users` ADD `last_quote_language` text DEFAULT 'en';
ALTER TABLE `users` ADD `quote_show_count` integer DEFAULT 0 NOT NULL;
