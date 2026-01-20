-- Phase 2: Add Composite Indexes for Performance Optimization
-- Generated: 2026-01-20
-- Migration: 0003_cynical_chronomancer (indexes only)

-- 1. User Badges: Optimize badge progress queries (user + earned date)
CREATE INDEX IF NOT EXISTS `idx_user_badges_user_earned` ON `user_badges` (`user_id`, `earned_at`);

-- 2. Individual Trades: Optimize TradesList filtering (user + timestamp + result)
CREATE INDEX IF NOT EXISTS `idx_trades_user_timestamp_result` ON `individual_trades` (`user_id`, `trade_timestamp`, `result`);

-- 3. Individual Trades: Optimize streak calculations (user + date + result)
CREATE INDEX IF NOT EXISTS `idx_trades_user_date_result` ON `individual_trades` (`user_id`, `trade_timestamp`, `result`);

-- 4. Individual Trades: Optimize session analysis (user + market session)
CREATE INDEX IF NOT EXISTS `idx_trades_user_session` ON `individual_trades` (`user_id`, `market_session`);

-- 5. Daily Summaries: Optimize date range queries (user + trade date)
CREATE INDEX IF NOT EXISTS `idx_summary_user_date` ON `daily_summaries` (`user_id`, `trade_date`);

-- Verification: Check indexes were created
SELECT name, tbl_name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%' ORDER BY name;
