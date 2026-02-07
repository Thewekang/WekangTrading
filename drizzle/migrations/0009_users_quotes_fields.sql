ALTER TABLE `users` ADD `show_quotes` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `quotes_cooldown_minutes` integer DEFAULT 15 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `last_quote_shown_at` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `last_quote_id` text;--> statement-breakpoint
ALTER TABLE `users` ADD `last_quote_language` text DEFAULT 'en';--> statement-breakpoint
ALTER TABLE `users` ADD `quote_show_count` integer DEFAULT 0 NOT NULL;
