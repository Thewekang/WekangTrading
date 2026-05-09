CREATE TABLE `account_strategies` (
	`id` text PRIMARY KEY NOT NULL,
	`trading_account_id` text NOT NULL,
	`user_id` text NOT NULL,
	`symbol` text NOT NULL,
	`instrument_type` text DEFAULT 'FUTURES' NOT NULL,
	`default_lot_size` real,
	`stop_loss_points` real,
	`tp1_points` real,
	`tp2_points` real,
	`risk_percent_per_trade` real DEFAULT 1,
	`max_trades_per_day` integer,
	`tick_size` real,
	`tick_value` real,
	`pip_value` real,
	`best_sessions` text,
	`entry_notes` text,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`trading_account_id`) REFERENCES `trading_accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_strategies_account_idx` ON `account_strategies` (`trading_account_id`);--> statement-breakpoint
CREATE INDEX `account_strategies_user_idx` ON `account_strategies` (`user_id`);--> statement-breakpoint
CREATE INDEX `account_strategies_account_symbol_idx` ON `account_strategies` (`trading_account_id`,`symbol`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_user_badges` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`user_id` text NOT NULL,
	`trading_account_id` text NOT NULL,
	`badge_id` text NOT NULL,
	`earned_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`progress` integer DEFAULT 0,
	`notified` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`trading_account_id`) REFERENCES `trading_accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`badge_id`) REFERENCES `badges`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_user_badges`("id", "user_id", "trading_account_id", "badge_id", "earned_at", "progress", "notified") SELECT "id", "user_id", "trading_account_id", "badge_id", "earned_at", "progress", "notified" FROM `user_badges`;--> statement-breakpoint
DROP TABLE `user_badges`;--> statement-breakpoint
ALTER TABLE `__new_user_badges` RENAME TO `user_badges`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `user_badge_idx` ON `user_badges` (`user_id`,`trading_account_id`,`badge_id`);--> statement-breakpoint
CREATE INDEX `user_badges_user_id_idx` ON `user_badges` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_badges_earned_at_idx` ON `user_badges` (`earned_at`);--> statement-breakpoint
CREATE INDEX `idx_user_badges_user_earned` ON `user_badges` (`user_id`,`earned_at`);--> statement-breakpoint
CREATE TABLE `__new_streaks` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`user_id` text NOT NULL,
	`trading_account_id` text NOT NULL,
	`streak_type` text NOT NULL,
	`current_streak` integer DEFAULT 0 NOT NULL,
	`longest_streak` integer DEFAULT 0 NOT NULL,
	`last_streak_date` text,
	`start_date` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`trading_account_id`) REFERENCES `trading_accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_streaks`("id", "user_id", "trading_account_id", "streak_type", "current_streak", "longest_streak", "last_streak_date", "start_date", "updated_at") SELECT "id", "user_id", "trading_account_id", "streak_type", "current_streak", "longest_streak", "last_streak_date", "start_date", "updated_at" FROM `streaks`;--> statement-breakpoint
DROP TABLE `streaks`;--> statement-breakpoint
ALTER TABLE `__new_streaks` RENAME TO `streaks`;--> statement-breakpoint
CREATE UNIQUE INDEX `user_streak_type_idx` ON `streaks` (`user_id`,`trading_account_id`,`streak_type`);--> statement-breakpoint
CREATE TABLE `__new_user_stats` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`user_id` text NOT NULL,
	`trading_account_id` text NOT NULL,
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
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`trading_account_id`) REFERENCES `trading_accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_user_stats`("id", "user_id", "trading_account_id", "total_trades", "total_wins", "total_losses", "total_profit_usd", "current_win_streak", "longest_win_streak", "current_log_streak", "longest_log_streak", "total_sop_compliant", "sop_compliance_rate", "current_sop_streak", "longest_sop_streak", "asia_trades", "europe_trades", "us_trades", "overlap_trades", "win_rate", "best_win_rate", "badges_earned", "total_points", "first_trade_date", "last_trade_date", "consecutive_logging_days", "total_logging_days", "has_completed_target", "has_perfect_month", "max_trades_in_day", "updated_at") SELECT "id", "user_id", "trading_account_id", "total_trades", "total_wins", "total_losses", "total_profit_usd", "current_win_streak", "longest_win_streak", "current_log_streak", "longest_log_streak", "total_sop_compliant", "sop_compliance_rate", "current_sop_streak", "longest_sop_streak", "asia_trades", "europe_trades", "us_trades", "overlap_trades", "win_rate", "best_win_rate", "badges_earned", "total_points", "first_trade_date", "last_trade_date", "consecutive_logging_days", "total_logging_days", "has_completed_target", "has_perfect_month", "max_trades_in_day", "updated_at" FROM `user_stats`;--> statement-breakpoint
DROP TABLE `user_stats`;--> statement-breakpoint
ALTER TABLE `__new_user_stats` RENAME TO `user_stats`;--> statement-breakpoint
CREATE UNIQUE INDEX `user_stats_user_account_idx` ON `user_stats` (`user_id`,`trading_account_id`);--> statement-breakpoint
ALTER TABLE `drawdown_templates` ADD `daily_reset_timezone` text;--> statement-breakpoint
ALTER TABLE `account_rules` ADD `daily_reset_timezone` text;--> statement-breakpoint
ALTER TABLE `trading_accounts` ADD `account_balance` real;--> statement-breakpoint
ALTER TABLE `trading_accounts` ADD `calculator_leverage` integer;