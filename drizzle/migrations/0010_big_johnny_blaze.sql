DROP INDEX "accounts_user_idx";--> statement-breakpoint
DROP INDEX "accounts_provider_account_unique";--> statement-breakpoint
DROP INDEX "sessions_session_token_unique";--> statement-breakpoint
DROP INDEX "sessions_user_idx";--> statement-breakpoint
DROP INDEX "badges_category_idx";--> statement-breakpoint
DROP INDEX "badges_order_idx";--> statement-breakpoint
DROP INDEX "user_badge_idx";--> statement-breakpoint
DROP INDEX "user_badges_user_id_idx";--> statement-breakpoint
DROP INDEX "user_badges_earned_at_idx";--> statement-breakpoint
DROP INDEX "idx_user_badges_user_earned";--> statement-breakpoint
DROP INDEX "users_email_unique";--> statement-breakpoint
DROP INDEX "users_invite_code_idx";--> statement-breakpoint
DROP INDEX "invite_codes_code_unique";--> statement-breakpoint
DROP INDEX "invite_codes_code_idx";--> statement-breakpoint
DROP INDEX "invite_codes_active_expires_idx";--> statement-breakpoint
DROP INDEX "sop_types_name_unique";--> statement-breakpoint
DROP INDEX "sop_types_active_sort_idx";--> statement-breakpoint
DROP INDEX "sop_types_detail_enabled_short_idx";--> statement-breakpoint
DROP INDEX "sop_types_detail_enabled_long_idx";--> statement-breakpoint
DROP INDEX "user_pinned_sops_user_idx";--> statement-breakpoint
DROP INDEX "user_pinned_sops_sop_type_idx";--> statement-breakpoint
DROP INDEX "individual_trades_user_timestamp_idx";--> statement-breakpoint
DROP INDEX "individual_trades_daily_summary_idx";--> statement-breakpoint
DROP INDEX "individual_trades_sop_type_idx";--> statement-breakpoint
DROP INDEX "individual_trades_market_session_idx";--> statement-breakpoint
DROP INDEX "individual_trades_result_idx";--> statement-breakpoint
DROP INDEX "idx_trades_user_timestamp_result";--> statement-breakpoint
DROP INDEX "idx_trades_user_date_result";--> statement-breakpoint
DROP INDEX "idx_trades_user_session";--> statement-breakpoint
DROP INDEX "daily_summaries_user_date_unique";--> statement-breakpoint
DROP INDEX "daily_summaries_user_date_idx";--> statement-breakpoint
DROP INDEX "daily_summaries_trade_date_idx";--> statement-breakpoint
DROP INDEX "idx_summary_user_date";--> statement-breakpoint
DROP INDEX "user_targets_user_idx";--> statement-breakpoint
DROP INDEX "user_targets_user_type_active_idx";--> statement-breakpoint
DROP INDEX "user_targets_user_active_dates_idx";--> statement-breakpoint
DROP INDEX "user_streak_type_idx";--> statement-breakpoint
DROP INDEX "motivational_messages_user_id_idx";--> statement-breakpoint
DROP INDEX "motivational_messages_created_at_idx";--> statement-breakpoint
DROP INDEX "motivational_messages_is_read_idx";--> statement-breakpoint
DROP INDEX "user_stats_user_id_unique";--> statement-breakpoint
DROP INDEX "user_rankings_user_id_idx";--> statement-breakpoint
DROP INDEX "user_rankings_calculated_at_idx";--> statement-breakpoint
DROP INDEX "user_rankings_rank_idx";--> statement-breakpoint
DROP INDEX "trading_quotes_category_idx";--> statement-breakpoint
DROP INDEX "trading_quotes_enabled_idx";--> statement-breakpoint
ALTER TABLE `individual_trades` ALTER COLUMN "result" TO "result" text;--> statement-breakpoint
CREATE INDEX `accounts_user_idx` ON `accounts` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_provider_account_unique` ON `accounts` (`provider`,`provider_account_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_session_token_unique` ON `sessions` (`session_token`);--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `badges_category_idx` ON `badges` (`category`);--> statement-breakpoint
CREATE INDEX `badges_order_idx` ON `badges` (`order`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_badge_idx` ON `user_badges` (`user_id`,`badge_id`);--> statement-breakpoint
CREATE INDEX `user_badges_user_id_idx` ON `user_badges` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_badges_earned_at_idx` ON `user_badges` (`earned_at`);--> statement-breakpoint
CREATE INDEX `idx_user_badges_user_earned` ON `user_badges` (`user_id`,`earned_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_invite_code_idx` ON `users` (`invite_code_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `invite_codes_code_unique` ON `invite_codes` (`code`);--> statement-breakpoint
CREATE INDEX `invite_codes_code_idx` ON `invite_codes` (`code`);--> statement-breakpoint
CREATE INDEX `invite_codes_active_expires_idx` ON `invite_codes` (`active`,`expires_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `sop_types_name_unique` ON `sop_types` (`name`);--> statement-breakpoint
CREATE INDEX `sop_types_active_sort_idx` ON `sop_types` (`active`,`sort_order`);--> statement-breakpoint
CREATE INDEX `sop_types_detail_enabled_short_idx` ON `sop_types` (`detail_enabled_short`);--> statement-breakpoint
CREATE INDEX `sop_types_detail_enabled_long_idx` ON `sop_types` (`detail_enabled_long`);--> statement-breakpoint
CREATE INDEX `user_pinned_sops_user_idx` ON `user_pinned_sops` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_pinned_sops_sop_type_idx` ON `user_pinned_sops` (`sop_type_id`);--> statement-breakpoint
CREATE INDEX `individual_trades_user_timestamp_idx` ON `individual_trades` (`user_id`,`trade_timestamp`);--> statement-breakpoint
CREATE INDEX `individual_trades_daily_summary_idx` ON `individual_trades` (`daily_summary_id`);--> statement-breakpoint
CREATE INDEX `individual_trades_sop_type_idx` ON `individual_trades` (`sop_type_id`);--> statement-breakpoint
CREATE INDEX `individual_trades_market_session_idx` ON `individual_trades` (`market_session`);--> statement-breakpoint
CREATE INDEX `individual_trades_result_idx` ON `individual_trades` (`result`);--> statement-breakpoint
CREATE INDEX `idx_trades_user_timestamp_result` ON `individual_trades` (`user_id`,`trade_timestamp`,`result`);--> statement-breakpoint
CREATE INDEX `idx_trades_user_date_result` ON `individual_trades` (`user_id`,`trade_timestamp`,`result`);--> statement-breakpoint
CREATE INDEX `idx_trades_user_session` ON `individual_trades` (`user_id`,`market_session`);--> statement-breakpoint
CREATE UNIQUE INDEX `daily_summaries_user_date_unique` ON `daily_summaries` (`user_id`,`trade_date`);--> statement-breakpoint
CREATE INDEX `daily_summaries_user_date_idx` ON `daily_summaries` (`user_id`,`trade_date`);--> statement-breakpoint
CREATE INDEX `daily_summaries_trade_date_idx` ON `daily_summaries` (`trade_date`);--> statement-breakpoint
CREATE INDEX `idx_summary_user_date` ON `daily_summaries` (`user_id`,`trade_date`);--> statement-breakpoint
CREATE INDEX `user_targets_user_idx` ON `user_targets` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_targets_user_type_active_idx` ON `user_targets` (`user_id`,`target_type`,`active`);--> statement-breakpoint
CREATE INDEX `user_targets_user_active_dates_idx` ON `user_targets` (`user_id`,`active`,`start_date`,`end_date`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_streak_type_idx` ON `streaks` (`user_id`,`streak_type`);--> statement-breakpoint
CREATE INDEX `motivational_messages_user_id_idx` ON `motivational_messages` (`user_id`);--> statement-breakpoint
CREATE INDEX `motivational_messages_created_at_idx` ON `motivational_messages` (`created_at`);--> statement-breakpoint
CREATE INDEX `motivational_messages_is_read_idx` ON `motivational_messages` (`is_read`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_stats_user_id_unique` ON `user_stats` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_rankings_user_id_idx` ON `user_rankings` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_rankings_calculated_at_idx` ON `user_rankings` (`calculated_at`);--> statement-breakpoint
CREATE INDEX `user_rankings_rank_idx` ON `user_rankings` (`rank`);--> statement-breakpoint
CREATE INDEX `trading_quotes_category_idx` ON `trading_quotes` (`category`);--> statement-breakpoint
CREATE INDEX `trading_quotes_enabled_idx` ON `trading_quotes` (`enabled`);--> statement-breakpoint
ALTER TABLE `individual_trades` ALTER COLUMN "sop_followed" TO "sop_followed" integer;--> statement-breakpoint
ALTER TABLE `individual_trades` ADD `entry_type` text DEFAULT 'TRANSACTION' NOT NULL;--> statement-breakpoint
ALTER TABLE `daily_summaries` ADD `total_commission_usd` real DEFAULT 0 NOT NULL;