ALTER TABLE `sop_types` ADD `detail_content` text;--> statement-breakpoint
ALTER TABLE `sop_types` ADD `detail_enabled` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `sop_types` ADD `detail_updated_at` integer;--> statement-breakpoint
ALTER TABLE `sop_types` ADD `detail_updated_by` text REFERENCES users(id);--> statement-breakpoint
CREATE INDEX `sop_types_detail_enabled_idx` ON `sop_types` (`detail_enabled`);