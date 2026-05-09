CREATE TABLE `admin_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`description` text,
	`updated_at` integer NOT NULL,
	`updated_by` text,
	FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `drawdown_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`account_type` text,
	`daily_drawdown_pct` real,
	`total_drawdown_pct` real,
	`consistency_target_pct` real,
	`target_gain_pct` real,
	`is_default` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `drawdown_templates_account_type_idx` ON `drawdown_templates` (`account_type`);--> statement-breakpoint
CREATE INDEX `drawdown_templates_is_default_idx` ON `drawdown_templates` (`is_default`);--> statement-breakpoint
CREATE TABLE `account_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`trading_account_id` text NOT NULL,
	`daily_drawdown_pct` real,
	`total_drawdown_pct` real,
	`consistency_target_pct` real,
	`cycle_target_profit_usd` real,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`trading_account_id`) REFERENCES `trading_accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `account_rules_trading_account_id_unique` ON `account_rules` (`trading_account_id`);--> statement-breakpoint
CREATE TABLE `trading_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`account_type` text DEFAULT 'FUTURES' NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`starting_balance` real DEFAULT 0 NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `trading_accounts_user_id_idx` ON `trading_accounts` (`user_id`);--> statement-breakpoint
CREATE INDEX `trading_accounts_user_default_idx` ON `trading_accounts` (`user_id`,`is_default`);--> statement-breakpoint
CREATE TABLE `withdrawal_events` (
	`id` text PRIMARY KEY NOT NULL,
	`trading_account_id` text NOT NULL,
	`withdrawal_date` text NOT NULL,
	`withdrawal_amount` real NOT NULL,
	`balance_at_withdrawal` real NOT NULL,
	`cycle_pnl_at_withdrawal` real NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`trading_account_id`) REFERENCES `trading_accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `withdrawal_events_account_id_idx` ON `withdrawal_events` (`trading_account_id`);--> statement-breakpoint
CREATE INDEX `withdrawal_events_account_date_idx` ON `withdrawal_events` (`trading_account_id`,`withdrawal_date`);--> statement-breakpoint
ALTER TABLE `user_badges` ADD `trading_account_id` text REFERENCES trading_accounts(id);--> statement-breakpoint
ALTER TABLE `discipline_tracker_rows` ADD `trading_account_id` text REFERENCES trading_accounts(id);--> statement-breakpoint
ALTER TABLE `discipline_tracker_settings` ADD `trading_account_id` text REFERENCES trading_accounts(id);--> statement-breakpoint
ALTER TABLE `individual_trades` ADD `trading_account_id` text REFERENCES trading_accounts(id);--> statement-breakpoint
CREATE INDEX `individual_trades_account_id_idx` ON `individual_trades` (`trading_account_id`);--> statement-breakpoint
ALTER TABLE `daily_summaries` ADD `trading_account_id` text REFERENCES trading_accounts(id);--> statement-breakpoint
CREATE INDEX `daily_summaries_account_id_idx` ON `daily_summaries` (`trading_account_id`);--> statement-breakpoint
ALTER TABLE `user_targets` ADD `trading_account_id` text REFERENCES trading_accounts(id);--> statement-breakpoint
ALTER TABLE `streaks` ADD `trading_account_id` text REFERENCES trading_accounts(id);--> statement-breakpoint
ALTER TABLE `user_stats` ADD `trading_account_id` text REFERENCES trading_accounts(id);--> statement-breakpoint
ALTER TABLE `user_rankings` ADD `trading_account_id` text REFERENCES trading_accounts(id);--> statement-breakpoint
ALTER TABLE `user_rankings` ADD `display_name` text DEFAULT '' NOT NULL;