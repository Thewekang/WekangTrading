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
--> statement-breakpoint
CREATE INDEX `trading_quotes_category_idx` ON `trading_quotes` (`category`);--> statement-breakpoint
CREATE INDEX `trading_quotes_enabled_idx` ON `trading_quotes` (`enabled`);--> statement-breakpoint
ALTER TABLE `discipline_tracker_rows` ADD `is_aplus_day` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `discipline_tracker_rows` ADD `is_range_expansion_day` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `discipline_tracker_rows` DROP COLUMN `aplus_confirmed`;--> statement-breakpoint
ALTER TABLE `discipline_tracker_rows` DROP COLUMN `range_expansion_confirmed`;--> statement-breakpoint
ALTER TABLE `users` ADD `show_quotes` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `quotes_cooldown_minutes` integer DEFAULT 15 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `last_quote_shown_at` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `last_quote_id` text;--> statement-breakpoint
ALTER TABLE `users` ADD `last_quote_language` text DEFAULT 'en';--> statement-breakpoint
ALTER TABLE `users` ADD `quote_show_count` integer DEFAULT 0 NOT NULL;