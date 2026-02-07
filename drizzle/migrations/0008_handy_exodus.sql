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
	`aplus_confirmed` integer DEFAULT false NOT NULL,
	`range_expansion_confirmed` integer DEFAULT false NOT NULL,
	`session_window` text DEFAULT 'non-prime' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
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
