CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`provider_account_id` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text
);
--> statement-breakpoint
CREATE INDEX `accounts_user_idx` ON `accounts` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_provider_account_unique` ON `accounts` (`provider`,`provider_account_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`session_token` text NOT NULL,
	`user_id` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_session_token_unique` ON `sessions` (`session_token`);--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'USER' NOT NULL,
	`email_verified` integer,
	`image` text,
	`invite_code_id` text,
	`reset_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_invite_code_idx` ON `users` (`invite_code_id`);--> statement-breakpoint
CREATE TABLE `invite_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`created_by` text NOT NULL,
	`max_uses` integer DEFAULT 1 NOT NULL,
	`used_count` integer DEFAULT 0 NOT NULL,
	`expires_at` integer,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invite_codes_code_unique` ON `invite_codes` (`code`);--> statement-breakpoint
CREATE INDEX `invite_codes_code_idx` ON `invite_codes` (`code`);--> statement-breakpoint
CREATE INDEX `invite_codes_active_expires_idx` ON `invite_codes` (`active`,`expires_at`);--> statement-breakpoint
CREATE TABLE `sop_types` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sop_types_name_unique` ON `sop_types` (`name`);--> statement-breakpoint
CREATE INDEX `sop_types_active_sort_idx` ON `sop_types` (`active`,`sort_order`);--> statement-breakpoint
CREATE TABLE `individual_trades` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`daily_summary_id` text,
	`sop_type_id` text,
	`trade_timestamp` integer NOT NULL,
	`result` text NOT NULL,
	`sop_followed` integer NOT NULL,
	`profit_loss_usd` real NOT NULL,
	`market_session` text NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `individual_trades_user_timestamp_idx` ON `individual_trades` (`user_id`,`trade_timestamp`);--> statement-breakpoint
CREATE INDEX `individual_trades_daily_summary_idx` ON `individual_trades` (`daily_summary_id`);--> statement-breakpoint
CREATE INDEX `individual_trades_sop_type_idx` ON `individual_trades` (`sop_type_id`);--> statement-breakpoint
CREATE INDEX `individual_trades_market_session_idx` ON `individual_trades` (`market_session`);--> statement-breakpoint
CREATE INDEX `individual_trades_result_idx` ON `individual_trades` (`result`);--> statement-breakpoint
CREATE TABLE `daily_summaries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`trade_date` integer NOT NULL,
	`total_trades` integer DEFAULT 0 NOT NULL,
	`total_wins` integer DEFAULT 0 NOT NULL,
	`total_losses` integer DEFAULT 0 NOT NULL,
	`total_sop_followed` integer DEFAULT 0 NOT NULL,
	`total_sop_not_followed` integer DEFAULT 0 NOT NULL,
	`total_profit_loss_usd` real DEFAULT 0 NOT NULL,
	`asia_session_trades` integer DEFAULT 0 NOT NULL,
	`asia_session_wins` integer DEFAULT 0 NOT NULL,
	`europe_session_trades` integer DEFAULT 0 NOT NULL,
	`europe_session_wins` integer DEFAULT 0 NOT NULL,
	`us_session_trades` integer DEFAULT 0 NOT NULL,
	`us_session_wins` integer DEFAULT 0 NOT NULL,
	`overlap_session_trades` integer DEFAULT 0 NOT NULL,
	`overlap_session_wins` integer DEFAULT 0 NOT NULL,
	`best_session` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_summaries_user_date_unique` ON `daily_summaries` (`user_id`,`trade_date`);--> statement-breakpoint
CREATE INDEX `daily_summaries_user_date_idx` ON `daily_summaries` (`user_id`,`trade_date`);--> statement-breakpoint
CREATE INDEX `daily_summaries_trade_date_idx` ON `daily_summaries` (`trade_date`);--> statement-breakpoint
CREATE TABLE `user_targets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`target_type` text NOT NULL,
	`target_win_rate` real NOT NULL,
	`target_sop_rate` real NOT NULL,
	`target_profit_usd` real,
	`start_date` integer NOT NULL,
	`end_date` integer NOT NULL,
	`notes` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `user_targets_user_idx` ON `user_targets` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_targets_user_type_active_idx` ON `user_targets` (`user_id`,`target_type`,`active`);--> statement-breakpoint
CREATE INDEX `user_targets_user_active_dates_idx` ON `user_targets` (`user_id`,`active`,`start_date`,`end_date`);