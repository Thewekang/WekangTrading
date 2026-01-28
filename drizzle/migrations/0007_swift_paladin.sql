CREATE TABLE `user_rankings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`rank` integer NOT NULL,
	`total_users` integer NOT NULL,
	`win_rate` real NOT NULL,
	`sop_rate` real NOT NULL,
	`total_pnl` real NOT NULL,
	`total_trades` integer NOT NULL,
	`percentile` real NOT NULL,
	`rank_change` integer DEFAULT 0 NOT NULL,
	`calculated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_rankings_user_id_idx` ON `user_rankings` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_rankings_calculated_at_idx` ON `user_rankings` (`calculated_at`);--> statement-breakpoint
CREATE INDEX `user_rankings_rank_idx` ON `user_rankings` (`rank`);