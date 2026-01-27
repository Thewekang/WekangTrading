DROP INDEX `sop_types_detail_enabled_idx`;--> statement-breakpoint
ALTER TABLE `sop_types` ADD `detail_content_short` text;--> statement-breakpoint
ALTER TABLE `sop_types` ADD `detail_content_long` text;--> statement-breakpoint
ALTER TABLE `sop_types` ADD `detail_enabled_short` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `sop_types` ADD `detail_enabled_long` integer DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX `sop_types_detail_enabled_short_idx` ON `sop_types` (`detail_enabled_short`);--> statement-breakpoint
CREATE INDEX `sop_types_detail_enabled_long_idx` ON `sop_types` (`detail_enabled_long`);--> statement-breakpoint
ALTER TABLE `sop_types` DROP COLUMN `detail_content`;--> statement-breakpoint
ALTER TABLE `sop_types` DROP COLUMN `detail_enabled`;