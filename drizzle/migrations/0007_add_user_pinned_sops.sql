CREATE TABLE `user_pinned_sops` (
	`user_id` text NOT NULL,
	`sop_type_id` text NOT NULL,
	`pinned_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `sop_type_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sop_type_id`) REFERENCES `sop_types`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_pinned_sops_user_idx` ON `user_pinned_sops` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_pinned_sops_sop_type_idx` ON `user_pinned_sops` (`sop_type_id`);
