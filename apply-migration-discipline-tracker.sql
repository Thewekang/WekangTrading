-- Migration 0008 + 0009 (Discipline Tracker): Create Missing Tables in Production
-- This migration creates discipline_tracker tables that don't exist in prod
-- Date: February 8, 2026
-- Hotfix: v1.7.0

-- Create discipline_tracker_rows table
CREATE TABLE `discipline_tracker_rows` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`trade_date` integer NOT NULL,
	`notes` text DEFAULT '',
	`trade1_outcome` text DEFAULT '',
	`trade2_outcome` text DEFAULT '',
	`trade3_outcome` text DEFAULT '',
	`trade1_tp3_amount` real DEFAULT 0,
	`trade2_tp3_amount` real DEFAULT 0,
	`trade3_tp3_amount` real DEFAULT 0,
	`is_aplus_day` integer DEFAULT false NOT NULL,
	`is_range_expansion_day` integer DEFAULT false NOT NULL,
	`session_window` text DEFAULT 'non-prime' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

-- Create discipline_tracker_settings table
CREATE TABLE `discipline_tracker_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`max_trades_per_day` integer DEFAULT 2 NOT NULL,
	`sl_value` real DEFAULT -80 NOT NULL,
	`be_value` real DEFAULT 0 NOT NULL,
	`tp1_value` real DEFAULT 80 NOT NULL,
	`tp2_value` real DEFAULT 160 NOT NULL,
	`tp3_mode` text DEFAULT 'manual' NOT NULL,
	`tp3_fixed_value` real DEFAULT 240,
	`win_rate_formula` text DEFAULT 'excludeBE' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

-- Create indexes
CREATE INDEX `discipline_tracker_rows_user_id_idx` ON `discipline_tracker_rows` (`user_id`);
CREATE INDEX `discipline_tracker_rows_trade_date_idx` ON `discipline_tracker_rows` (`trade_date`);
CREATE INDEX `discipline_tracker_settings_user_id_idx` ON `discipline_tracker_settings` (`user_id`);
