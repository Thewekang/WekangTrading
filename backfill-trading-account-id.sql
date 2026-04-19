-- ============================================================
-- DATA MIGRATION: Backfill trading_account_id for legacy rows
-- ============================================================
-- Run AFTER migration 0011 (which added the trading_account_id column).
-- For every row where trading_account_id IS NULL, assigns the user's
-- default trading account (is_default = 1), falling back to the
-- earliest-created account if no default is set.
-- ============================================================

-- 1. individual_trades
UPDATE individual_trades
SET trading_account_id = COALESCE(
  (SELECT id FROM trading_accounts WHERE user_id = individual_trades.user_id AND is_default = 1 LIMIT 1),
  (SELECT id FROM trading_accounts WHERE user_id = individual_trades.user_id ORDER BY created_at ASC LIMIT 1)
)
WHERE trading_account_id IS NULL;

-- 2. daily_summaries
UPDATE daily_summaries
SET trading_account_id = COALESCE(
  (SELECT id FROM trading_accounts WHERE user_id = daily_summaries.user_id AND is_default = 1 LIMIT 1),
  (SELECT id FROM trading_accounts WHERE user_id = daily_summaries.user_id ORDER BY created_at ASC LIMIT 1)
)
WHERE trading_account_id IS NULL;

-- 3. discipline_tracker_rows
UPDATE discipline_tracker_rows
SET trading_account_id = COALESCE(
  (SELECT id FROM trading_accounts WHERE user_id = discipline_tracker_rows.user_id AND is_default = 1 LIMIT 1),
  (SELECT id FROM trading_accounts WHERE user_id = discipline_tracker_rows.user_id ORDER BY created_at ASC LIMIT 1)
)
WHERE trading_account_id IS NULL;

-- 4. discipline_tracker_settings
UPDATE discipline_tracker_settings
SET trading_account_id = COALESCE(
  (SELECT id FROM trading_accounts WHERE user_id = discipline_tracker_settings.user_id AND is_default = 1 LIMIT 1),
  (SELECT id FROM trading_accounts WHERE user_id = discipline_tracker_settings.user_id ORDER BY created_at ASC LIMIT 1)
)
WHERE trading_account_id IS NULL;

-- 5. user_targets
UPDATE user_targets
SET trading_account_id = COALESCE(
  (SELECT id FROM trading_accounts WHERE user_id = user_targets.user_id AND is_default = 1 LIMIT 1),
  (SELECT id FROM trading_accounts WHERE user_id = user_targets.user_id ORDER BY created_at ASC LIMIT 1)
)
WHERE trading_account_id IS NULL;

-- 6. streaks
UPDATE streaks
SET trading_account_id = COALESCE(
  (SELECT id FROM trading_accounts WHERE user_id = streaks.user_id AND is_default = 1 LIMIT 1),
  (SELECT id FROM trading_accounts WHERE user_id = streaks.user_id ORDER BY created_at ASC LIMIT 1)
)
WHERE trading_account_id IS NULL;

-- 7. user_stats
UPDATE user_stats
SET trading_account_id = COALESCE(
  (SELECT id FROM trading_accounts WHERE user_id = user_stats.user_id AND is_default = 1 LIMIT 1),
  (SELECT id FROM trading_accounts WHERE user_id = user_stats.user_id ORDER BY created_at ASC LIMIT 1)
)
WHERE trading_account_id IS NULL;

-- 8. user_rankings
UPDATE user_rankings
SET trading_account_id = COALESCE(
  (SELECT id FROM trading_accounts WHERE user_id = user_rankings.user_id AND is_default = 1 LIMIT 1),
  (SELECT id FROM trading_accounts WHERE user_id = user_rankings.user_id ORDER BY created_at ASC LIMIT 1)
)
WHERE trading_account_id IS NULL;

-- 9. user_badges
UPDATE user_badges
SET trading_account_id = COALESCE(
  (SELECT id FROM trading_accounts WHERE user_id = user_badges.user_id AND is_default = 1 LIMIT 1),
  (SELECT id FROM trading_accounts WHERE user_id = user_badges.user_id ORDER BY created_at ASC LIMIT 1)
)
WHERE trading_account_id IS NULL;

-- ============================================================
-- Verification queries (run separately to confirm results)
-- ============================================================
-- SELECT 'individual_trades', COUNT(*) FROM individual_trades WHERE trading_account_id IS NULL;
-- SELECT 'daily_summaries', COUNT(*) FROM daily_summaries WHERE trading_account_id IS NULL;
-- SELECT 'discipline_tracker_rows', COUNT(*) FROM discipline_tracker_rows WHERE trading_account_id IS NULL;
-- SELECT 'discipline_tracker_settings', COUNT(*) FROM discipline_tracker_settings WHERE trading_account_id IS NULL;
-- SELECT 'user_targets', COUNT(*) FROM user_targets WHERE trading_account_id IS NULL;
-- SELECT 'streaks', COUNT(*) FROM streaks WHERE trading_account_id IS NULL;
-- SELECT 'user_stats', COUNT(*) FROM user_stats WHERE trading_account_id IS NULL;
-- SELECT 'user_rankings', COUNT(*) FROM user_rankings WHERE trading_account_id IS NULL;
-- SELECT 'user_badges', COUNT(*) FROM user_badges WHERE trading_account_id IS NULL;
