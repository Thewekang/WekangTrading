# Manual Migration Guide - Turso CLI via WSL

**Last Updated:** April 20, 2026

---

## 🗺️ Migration History

| Version | Drizzle Tag | Description | Applied to Prod |
|---------|-------------|-------------|-----------------|
| 0009 | `0009_condemned_invisible_woman` | Quote system, discipline tracker rows | ✅ Done |
| 0010 | `0010_big_johnny_blaze` | BE result type, nullable result column | ✅ Done |
| 0010-fix | `0011_fix_result_check_constraint.sql` *(manual, not in journal)* | Recreates `individual_trades` with correct `CHECK (result IN ('WIN','LOSS','BE'))` constraint | ✅ Done |
| 0011 | `0011_watery_night_thrasher` | Multi-account: adds `trading_account_id` to 9 tables; new `trading_accounts`, `account_rules`, `withdrawal_events`, `drawdown_templates`, `admin_settings` tables | ⬜ Pending |
| 0012 | `0012_clever_blue_blade` | Fixes `daily_summaries` unique index for multi-account: replaces `(user_id, trade_date)` with `(user_id, trade_date, trading_account_id)` | ⬜ Pending |

---

## 📋 Prerequisites
- WSL installed and configured
- Turso CLI installed at `~/.turso/turso`
- Logged in to Turso (run `turso auth login` if needed)

---

## 🚀 v2.0.0 Production Migration (Migrations 0011 + 0012)

### Overview

Two migrations must be applied together for the multi-account feature:

1. **0011** — Adds the `trading_accounts` system (new tables + `trading_account_id` FK columns on 9 existing tables)
2. **0012** — Fixes `daily_summaries` unique index to allow multiple accounts per day

> ⚠️ **Order matters:** Apply 0011 before 0012. Both must succeed before deploying v2.0.0 code.

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
-- Confirm tables NOT yet present (expected before migration)
SELECT name FROM sqlite_master WHERE type='table' AND name IN ('trading_accounts','account_rules','withdrawal_events','drawdown_templates','admin_settings');
-- Expected: 0 rows

-- Confirm trading_account_id NOT yet on individual_trades
PRAGMA table_info(individual_trades);
-- Expected: no trading_account_id column

-- Confirm old unique index on daily_summaries
SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'daily_summaries%';
-- Expected: daily_summaries_user_date_unique, daily_summaries_user_date_idx, etc.

.exit
```

If `trading_accounts` already exists, skip Step 4 (0011 already applied) and go straight to Step 5.

---

### Step 4: Apply Migration 0011 (Multi-account tables + columns)
```bash
turso db shell wekangtrading-prod < drizzle/migrations/0011_watery_night_thrasher.sql
```

**Expected output:** Series of blank lines (statements executed silently). Errors to watch for:
- `duplicate column name` → column already added, safe to ignore
- `table already exists` → table already created, safe to ignore
- Any other error → stop and investigate

**Verify 0011:**
```bash
turso db shell wekangtrading-prod
```
```sql
-- New tables exist
SELECT name FROM sqlite_master WHERE type='table' AND name IN ('trading_accounts','account_rules','withdrawal_events','drawdown_templates','admin_settings');
-- Expected: 5 rows

-- trading_account_id column added
PRAGMA table_info(individual_trades);
-- Expected: see trading_account_id column (nullable)

PRAGMA table_info(daily_summaries);
-- Expected: see trading_account_id column (nullable)

PRAGMA table_info(user_targets);
-- Expected: see trading_account_id column (nullable)

.exit
```

---

### Step 5: Apply Migration 0012 (Fix daily_summaries unique index)
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
-- Also: daily_summaries_user_date_idx, daily_summaries_trade_date_idx, etc.

.exit
```

---

### Step 6: Seed Default Account for Existing Users

After deploying the v2.0.0 code, existing users have no `trading_accounts` rows. Run this once to create a default account for each user so their existing trades remain accessible:

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

- [ ] `trading_accounts` table exists with 5 columns minimum
- [ ] `account_rules`, `withdrawal_events`, `drawdown_templates`, `admin_settings` tables exist
- [ ] `individual_trades.trading_account_id` column present (nullable)
- [ ] `daily_summaries.trading_account_id` column present (nullable)
- [ ] `daily_summaries_user_date_unique` index **removed**
- [ ] `daily_summaries_user_account_date_unique` index **present**
- [ ] `user_targets.trading_account_id`, `user_badges.trading_account_id`, `user_rankings.trading_account_id` present
- [ ] Default accounts seeded for all existing users
- [ ] v2.0.0 Vercel deployment live
- [ ] `/dashboard` shows account picker
- [ ] `/accounts/[id]` loads account landing page

---

## ⚠️ Rollback Plan

Migrations 0011 and 0012 are **additive only** (new tables, new nullable columns, index swap). To rollback:

```sql
-- Drop 0012 change (restore old unique index)
DROP INDEX IF EXISTS daily_summaries_user_account_date_unique;
CREATE UNIQUE INDEX daily_summaries_user_date_unique ON daily_summaries (user_id, trade_date);

-- Drop 0011 new tables (column removal not possible in SQLite without table recreation)
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
