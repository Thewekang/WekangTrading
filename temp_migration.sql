CREATE TABLE `badges` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`tier` text NOT NULL,
	`icon` text NOT NULL,
	`requirement` text NOT NULL,
	`points` integer DEFAULT 10 NOT NULL,
	`order` integer NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `badges_category_idx` ON `badges` (`category`);--> statement-breakpoint
CREATE INDEX `badges_order_idx` ON `badges` (`order`);--> statement-breakpoint
CREATE TABLE `user_badges` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`user_id` text NOT NULL,
	`badge_id` text NOT NULL,
	`earned_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`progress` integer DEFAULT 0,
	`notified` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`badge_id`) REFERENCES `badges`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_badge_idx` ON `user_badges` (`user_id`,`badge_id`);--> statement-breakpoint
CREATE INDEX `user_badges_user_id_idx` ON `user_badges` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_badges_earned_at_idx` ON `user_badges` (`earned_at`);--> statement-breakpoint
CREATE INDEX `idx_user_badges_user_earned` ON `user_badges` (`user_id`,`earned_at`);--> statement-breakpoint
CREATE TABLE `cron_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`job_name` text NOT NULL,
	`status` text NOT NULL,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	`duration` integer,
	`message` text,
	`details` text,
	`items_processed` integer,
	`error_code` text,
	`error_message` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `economic_events` (
	`id` text PRIMARY KEY NOT NULL,
	`event_date` integer NOT NULL,
	`country` text(3) NOT NULL,
	`currency` text(3) NOT NULL,
	`event_name` text NOT NULL,
	`indicator` text,
	`importance` text NOT NULL,
	`forecast` text,
	`actual` text,
	`previous` text,
	`period` text,
	`source` text DEFAULT 'API' NOT NULL,
	`fetched_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `streaks` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`user_id` text NOT NULL,
	`streak_type` text NOT NULL,
	`current_streak` integer DEFAULT 0 NOT NULL,
	`longest_streak` integer DEFAULT 0 NOT NULL,
	`last_streak_date` text,
	`start_date` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_streak_type_idx` ON `streaks` (`user_id`,`streak_type`);--> statement-breakpoint
CREATE TABLE `motivational_messages` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`user_id` text NOT NULL,
	`message_type` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`metadata` text,
	`is_read` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `motivational_messages_user_id_idx` ON `motivational_messages` (`user_id`);--> statement-breakpoint
CREATE INDEX `motivational_messages_created_at_idx` ON `motivational_messages` (`created_at`);--> statement-breakpoint
CREATE INDEX `motivational_messages_is_read_idx` ON `motivational_messages` (`is_read`);--> statement-breakpoint
CREATE TABLE `user_stats` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`user_id` text NOT NULL,
	`total_trades` integer DEFAULT 0 NOT NULL,
	`total_wins` integer DEFAULT 0 NOT NULL,
	`total_losses` integer DEFAULT 0 NOT NULL,
	`total_profit_usd` real DEFAULT 0 NOT NULL,
	`current_win_streak` integer DEFAULT 0 NOT NULL,
	`longest_win_streak` integer DEFAULT 0 NOT NULL,
	`current_log_streak` integer DEFAULT 0 NOT NULL,
	`longest_log_streak` integer DEFAULT 0 NOT NULL,
	`total_sop_compliant` integer DEFAULT 0 NOT NULL,
	`sop_compliance_rate` real DEFAULT 0 NOT NULL,
	`current_sop_streak` integer DEFAULT 0 NOT NULL,
	`longest_sop_streak` integer DEFAULT 0 NOT NULL,
	`asia_trades` integer DEFAULT 0 NOT NULL,
	`europe_trades` integer DEFAULT 0 NOT NULL,
	`us_trades` integer DEFAULT 0 NOT NULL,
	`overlap_trades` integer DEFAULT 0 NOT NULL,
	`win_rate` real DEFAULT 0 NOT NULL,
	`best_win_rate` real DEFAULT 0 NOT NULL,
	`badges_earned` integer DEFAULT 0 NOT NULL,
	`total_points` integer DEFAULT 0 NOT NULL,
	`first_trade_date` text,
	`last_trade_date` text,
	`consecutive_logging_days` integer DEFAULT 0 NOT NULL,
	`total_logging_days` integer DEFAULT 0 NOT NULL,
	`has_completed_target` integer DEFAULT false NOT NULL,
	`has_perfect_month` integer DEFAULT false NOT NULL,
	`max_trades_in_day` integer DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_stats_user_id_unique` ON `user_stats` (`user_id`);--> statement-breakpoint
ALTER TABLE `users` ADD `preferred_timezone` text DEFAULT 'Asia/Kuala_Lumpur' NOT NULL;--> statement-breakpoint
ALTER TABLE `individual_trades` ADD `symbol` text;--> statement-breakpoint
CREATE INDEX `idx_trades_user_timestamp_result` ON `individual_trades` (`user_id`,`trade_timestamp`,`result`);--> statement-breakpoint
CREATE INDEX `idx_trades_user_date_result` ON `individual_trades` (`user_id`,`trade_timestamp`,`result`);--> statement-breakpoint
CREATE INDEX `idx_trades_user_session` ON `individual_trades` (`user_id`,`market_session`);--> statement-breakpoint
ALTER TABLE `user_targets` ADD `completed_at` integer;--> statement-breakpoint
CREATE INDEX `idx_summary_user_date` ON `daily_summaries` (`user_id`,`trade_date`);
