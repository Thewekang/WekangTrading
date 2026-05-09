CREATE TABLE `trading_day_checklists` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`trading_account_id` text NOT NULL,
	`trade_date` text NOT NULL,
	`item_states` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`trading_account_id`) REFERENCES `trading_accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `checklist_user_account_date_idx` ON `trading_day_checklists` (`user_id`,`trading_account_id`,`trade_date`);