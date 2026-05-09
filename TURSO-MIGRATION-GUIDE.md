# Manual Migration Guide - Turso CLI via WSL

**Last Updated:** April 20, 2026

---

## 🗺️ Migration History

| Version | Drizzle Tag | Description | Applied to Prod |
|---------|-------------|-------------|-----------------|
| 0009 | `0009_condemned_invisible_woman` | Quote system, discipline tracker rows | ✅ Done |
| 0010 | `0010_big_johnny_blaze` | BE result type, nullable result column | ✅ Done |
| 0010-fix | `0011_fix_result_check_constraint.sql` *(manual, not in journal)* | Recreates `individual_trades` with correct `CHECK (result IN ('WIN','LOSS','BE'))` constraint | ✅ Done |
| 0011 | `0011_watery_night_thrasher` | Multi-account: adds `trading_account_id` to 9 tables; new `trading_accounts`, `account_rules`, `withdrawal_events`, `drawdown_templates`, `admin_settings` tables | ✅ Done |
| 0012 | `0012_clever_blue_blade` | Fixes `daily_summaries` unique index for multi-account: replaces `(user_id, trade_date)` with `(user_id, trade_date, trading_account_id)` | ⬜ Pending |
| 0013 | `0013_add_daily_reset_timezone` | Per-account daily reset timezone: adds `daily_reset_timezone` column to `account_rules` and `drawdown_templates` | ⬜ Pending |

---

## 📋 Prerequisites
- WSL installed and configured
- Turso CLI installed at `~/.turso/turso`
- Logged in to Turso (run `turso auth login` if needed)

---

## 🚀 v2.0.0 Production Migration (Migration 0012 + 0013)

### Current Prod State (as of April 20, 2026)

| Migration | Status | Notes |
|-----------|--------|-------|
| 0011 | ✅ Applied | `trading_accounts`, `account_rules`, `withdrawal_events`, `drawdown_templates`, `admin_settings` all created |
| 0012 | ⬜ Pending | `daily_summaries` unique index fix — apply before deploying multi-account code |
| 0013 | ⬜ Pending | `daily_reset_timezone` columns — apply before deploying timezone feature |

### Overview

Two migrations remain before the current feature branch can go to production:

1. **0012** — Fixes `daily_summaries` unique index to allow multiple accounts per day  
2. **0013** — Adds `daily_reset_timezone` to `account_rules` and `drawdown_templates`

> ⚠️ **Order matters:** Apply 0012 before 0013.

---

### Step 1: Open WSL
```powershell
# From PowerShell, enter WSL
wsl
```

**Wait for WSL prompt:** `h4mim@H4MIM:...`

---

### Step 2: Setup Environment
```bash
cd /mnt/g/'Hasil Kerja'/Website/WekangTrading
export PATH=/home/h4mim/.turso:$PATH

# Verify Turso CLI
turso --version
turso db list
```

---

### Step 3: Pre-Migration Health Check
```bash
turso db shell wekangtrading-prod
```

```sql
-- Confirm 0011 is already applied
SELECT name FROM sqlite_master WHERE type='table' AND name IN ('trading_accounts','account_rules','withdrawal_events','drawdown_templates','admin_settings');
-- Expected: 5 rows

-- Confirm 0012 NOT yet applied (old index still present)
SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'daily_summaries%';
-- Expected: daily_summaries_user_date_unique still present (NOT daily_summaries_user_account_date_unique)

-- Confirm 0013 NOT yet applied (column absent)
PRAGMA table_info(account_rules);
-- Expected: no daily_reset_timezone column

.exit
```

If `daily_summaries_user_account_date_unique` already exists, skip Step 4 (0012 already applied). 
If `daily_reset_timezone` column already exists in `account_rules`, skip Step 5.

---

### Step 4: Apply Migration 0012 (Fix daily_summaries unique index)
```bash
turso db shell wekangtrading-prod < drizzle/migrations/0012_clever_blue_blade.sql
```

**Why this is needed:** The old unique index `(user_id, trade_date)` would reject a second daily summary for the same user on the same day — which happens when they use multiple accounts. The new index `(user_id, trade_date, trading_account_id)` allows one summary per account per day.

**Verify 0012:**
```bash
turso db shell wekangtrading-prod
```
```sql
-- Old index is gone, new index exists
SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'daily_summaries%';
-- Expected: daily_summaries_user_account_date_unique (NOT daily_summaries_user_date_unique)

.exit
```

---

### Step 5: Apply Migration 0013 (Per-account daily reset timezone)
```bash
turso db shell wekangtrading-prod < drizzle/migrations/0013_add_daily_reset_timezone.sql
```

**Why this is needed:** Adds `daily_reset_timezone` (nullable text) to `account_rules` and `drawdown_templates`. This allows each account to specify its broker's trading day boundary (e.g. `America/Chicago` for Tradovate, `Europe/Prague` for FTMO). Existing rows default to `NULL` which the app treats as `'UTC'`.

**Verify 0013:**
```bash
turso db shell wekangtrading-prod
```
```sql
PRAGMA table_info(account_rules);
-- Expected: daily_reset_timezone column present (nullable text)

PRAGMA table_info(drawdown_templates);
-- Expected: daily_reset_timezone column present (nullable text)

.exit
```

---

### Step 6: Seed Default Account for Existing Users

> Only needed once per environment after first deploying the multi-account code. Existing users have no `trading_accounts` rows — this creates a default one so their existing trades remain accessible.

> **Status:** Already done on staging. Run this on prod after deploying.

```bash
turso db shell wekangtrading-prod
```

```sql
-- Insert a default account for every existing user (skip users who already have one)
INSERT INTO trading_accounts (id, user_id, name, account_type, currency, starting_balance, is_default, active, created_at, updated_at)
SELECT
  lower(hex(randomblob(16))),
  id,
  'My Account',
  'FUTURES',
  'USD',
  0,
  1,
  1,
  unixepoch(),
  unixepoch()
FROM users
WHERE id NOT IN (SELECT user_id FROM trading_accounts);

-- Confirm
SELECT u.email, ta.name FROM users u JOIN trading_accounts ta ON ta.user_id = u.id;

.exit
```

> 💡 **Note:** Existing trades will have `trading_account_id = NULL` — they are still visible because the app gracefully handles null account IDs (shows all trades when no account filter is active).

---

### Step 7: Exit WSL
```bash
exit
```

---

## ✅ Post-Migration Checklist

- [ ] `trading_accounts`, `account_rules`, `withdrawal_events`, `drawdown_templates`, `admin_settings` tables exist (0011 ✅ already done)
- [ ] `daily_summaries_user_date_unique` index **removed** (0012)
- [ ] `daily_summaries_user_account_date_unique` index **present** (0012)
- [ ] `account_rules.daily_reset_timezone` column present (0013)
- [ ] `drawdown_templates.daily_reset_timezone` column present (0013)
- [ ] Default accounts seeded for all existing users
- [ ] v2.x Vercel deployment live
- [ ] `/dashboard` shows account picker
- [ ] `/accounts/[id]/settings` shows Daily Reset Timezone selector

---

## ⚠️ Rollback Plan

Migrations 0012 and 0013 are **additive only** (index swap, new nullable columns). To rollback:

```sql
-- Rollback 0013 (column removal not supported in SQLite — columns are nullable so no harm)
-- Nothing needed for 0013 rollback; just redeploy without the feature

-- Rollback 0012 (restore old unique index)
DROP INDEX IF EXISTS daily_summaries_user_account_date_unique;
CREATE UNIQUE INDEX daily_summaries_user_date_unique ON daily_summaries (user_id, trade_date);

-- Rollback 0011 new tables (if needed — WARNING: drops all multi-account data)
DROP TABLE IF EXISTS withdrawal_events;
DROP TABLE IF EXISTS account_rules;
DROP TABLE IF EXISTS admin_settings;
DROP TABLE IF EXISTS drawdown_templates;
DROP TABLE IF EXISTS trading_accounts;
```

> Columns added by `ALTER TABLE` cannot be dropped in SQLite — but since all are nullable, they cause no harm.

---

## 📜 Legacy: Migration 0009 (Quote System)

For historical reference — this was the previous production migration guide.

### Step-by-Step Instructions (legacy)

**Step 1: Open WSL**
```powershell
wsl
```

**Step 2: Navigate to Project Directory**
```bash
cd /mnt/g/'Hasil Kerja'/Website/WekangTrading
```

**Step 3: Verify Turso CLI is Working**
```bash
export PATH=/home/h4mim/.turso:$PATH
turso --version
turso db list
```

**Step 4: Apply Migration**
```bash
# Apply the migration SQL file
turso db shell wekangtrading-prod < apply-migration-0009.sql
```

**Watch for errors:** If you see "duplicate column" or "table already exists", that's OK (skip those)

---

#### Method B: Apply Statements One by One (If Method A has errors)
```bash
# Open database shell
turso db shell wekangtrading-prod
```

**Then paste each statement one at a time:**

```sql
-- 1. Create trading_quotes table
CREATE TABLE trading_quotes (
  id text PRIMARY KEY NOT NULL,
  enabled integer DEFAULT 1 NOT NULL,
  category text NOT NULL,
  weight integer DEFAULT 5 NOT NULL,
  text_en text NOT NULL,
  text_bm text NOT NULL,
  author text,
  source_type text,
  display_count integer DEFAULT 0 NOT NULL,
  created_at integer DEFAULT (unixepoch()) NOT NULL,
  updated_at integer DEFAULT (unixepoch()) NOT NULL
);
CREATE INDEX trading_quotes_category_idx ON trading_quotes (category);
CREATE INDEX trading_quotes_enabled_idx ON trading_quotes (enabled);
```

```sql
-- 2. Update discipline_tracker_rows
ALTER TABLE discipline_tracker_rows ADD COLUMN is_aplus_day integer DEFAULT 0 NOT NULL;
ALTER TABLE discipline_tracker_rows ADD COLUMN is_range_expansion_day integer DEFAULT 0 NOT NULL;
```

```sql
-- 3. Update users table (paste one at a time)
ALTER TABLE users ADD COLUMN show_quotes integer DEFAULT 1 NOT NULL;
ALTER TABLE users ADD COLUMN quotes_cooldown_minutes integer DEFAULT 15 NOT NULL;
ALTER TABLE users ADD COLUMN last_quote_shown_at integer;
ALTER TABLE users ADD COLUMN last_quote_id text;
ALTER TABLE users ADD COLUMN last_quote_language text DEFAULT 'en';
ALTER TABLE users ADD COLUMN quote_show_count integer DEFAULT 0 NOT NULL;
```

**Note:** "duplicate column name" errors are safe to ignore — the column already exists.

---

## ⚠️ Common Issues

### Issue 1: "turso: command not found"
```bash
export PATH=/home/h4mim/.turso:$PATH
```

### Issue 2: "You are not logged in"
```bash
turso auth login
```

### Issue 3: "duplicate column name"
**Safe to ignore.** The column was already added in a previous attempt.

### Issue 4: "table already exists"
**Safe to ignore.** The table was already created.

---

## 🔧 Useful Debug SQL

```sql
-- List all tables
.tables

-- See full table definition
.schema <table_name>

-- See column names and types
PRAGMA table_info(<table_name>);

-- See all indexes
SELECT name, tbl_name FROM sqlite_master WHERE type = 'index' ORDER BY tbl_name;
```
