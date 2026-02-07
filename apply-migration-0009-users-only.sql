-- Migration 0009: Add Users Quote Columns ONLY
-- Only adds missing columns to users table
-- Date: February 8, 2026

ALTER TABLE `users` ADD `show_quotes` integer DEFAULT true NOT NULL;
ALTER TABLE `users` ADD `quotes_cooldown_minutes` integer DEFAULT 15 NOT NULL;
ALTER TABLE `users` ADD `last_quote_shown_at` integer;
ALTER TABLE `users` ADD `last_quote_id` text;
ALTER TABLE `users` ADD `last_quote_language` text DEFAULT 'en';
ALTER TABLE `users` ADD `quote_show_count` integer DEFAULT 0 NOT NULL;
