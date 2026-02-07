# Manual Migration Guide - Turso CLI via WSL

## 📋 Prerequisites
- WSL installed and configured
- Turso CLI installed at `~/.turso/turso`
- Logged in to Turso (run `turso auth login` if needed)

---

## 🚀 Step-by-Step Instructions

### Step 1: Open WSL
```powershell
# From PowerShell, enter WSL
wsl
```

**Wait for WSL prompt:** `h4mim@H4MIM:...`

---

### Step 2: Navigate to Project Directory
```bash
cd /mnt/g/'Hasil Kerja'/Website/WekangTrading
```

---

### Step 3: Verify Turso CLI is Working
```bash
# Add turso to PATH
export PATH=/home/h4mim/.turso:$PATH

# Test turso command
turso --version

# List your databases (should show wekangtrading-prod)
turso db list
```

**Expected output:**
```
NAME                   TYPE     LOCATION         
wekangtrading-prod     ...      aws-eu-west-1
wekangtrading-staging  ...      aws-eu-west-1
```

---

### Step 4: Check Current Production Schema
```bash
# Open production database shell
turso db shell wekangtrading-prod

# Inside the shell, check if trading_quotes exists
.schema trading_quotes

# Check users table structure
PRAGMA table_info(users);

# Exit the shell
.exit
```

**If `trading_quotes` already exists:** Migration may have been partially applied

**If error "no such table":** Migration needs to be applied

---

### Step 5: Apply Migration (Choose ONE method)

#### Method A: Apply Full Migration File (Recommended)
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
```

```sql
-- 2. Create indexes
CREATE INDEX trading_quotes_category_idx ON trading_quotes (category);
CREATE INDEX trading_quotes_enabled_idx ON trading_quotes (enabled);
```

```sql
-- 3. Update discipline_tracker_rows
ALTER TABLE discipline_tracker_rows ADD COLUMN is_aplus_day integer DEFAULT 0 NOT NULL;
ALTER TABLE discipline_tracker_rows ADD COLUMN is_range_expansion_day integer DEFAULT 0 NOT NULL;
```

```sql
-- 4. Update users table (paste one at a time)
ALTER TABLE users ADD COLUMN show_quotes integer DEFAULT 1 NOT NULL;
ALTER TABLE users ADD COLUMN quotes_cooldown_minutes integer DEFAULT 15 NOT NULL;
ALTER TABLE users ADD COLUMN last_quote_shown_at integer;
ALTER TABLE users ADD COLUMN last_quote_id text;
ALTER TABLE users ADD COLUMN last_quote_language text DEFAULT 'en';
ALTER TABLE users ADD COLUMN quote_show_count integer DEFAULT 0 NOT NULL;
```

**Note:** If you get "duplicate column name" error, that column already exists - skip it and continue with the next one.

---

### Step 6: Verify Migration Success
```bash
# Still in turso db shell wekangtrading-prod
```

```sql
-- Check trading_quotes table
.schema trading_quotes

-- Expected output: Should show table definition with all columns

-- Check users table has new columns
PRAGMA table_info(users);

-- Expected output: Should see show_quotes, quotes_cooldown_minutes, etc.

-- Count rows (should be 0 initially)
SELECT COUNT(*) FROM trading_quotes;

-- Check discipline_tracker_rows columns
PRAGMA table_info(discipline_tracker_rows);

-- Expected output: Should see is_aplus_day, is_range_expansion_day
```

---

### Step 7: Exit WSL
```bash
# Exit database shell (if still in it)
.exit

# Exit WSL
exit
```

---

## ✅ Success Indicators

After running the migration, you should see:

1. **trading_quotes table exists** with columns: id, enabled, category, weight, text_en, text_bm, author, source_type, display_count, created_at, updated_at

2. **users table has 6 new columns:**
   - show_quotes
   - quotes_cooldown_minutes
   - last_quote_shown_at
   - last_quote_id
   - last_quote_language
   - quote_show_count

3. **discipline_tracker_rows has 2 new columns:**
   - is_aplus_day
   - is_range_expansion_day

4. **No critical errors** (duplicate column errors are OK)

---

## ⚠️ Common Issues

### Issue 1: "turso: command not found"
```bash
# Solution: Add to PATH
export PATH=/home/h4mim/.turso:$PATH
```

### Issue 2: "You are not logged in"
```bash
# Solution: Login to Turso
turso auth login
# This will open a browser - complete the authentication
```

### Issue 3: "duplicate column name"
**This is OK!** It means that column was already added in a previous attempt. Skip and continue.

### Issue 4: "table already exists"
**This is OK!** The table was already created. You can skip the CREATE TABLE statement.

---

## 🎯 After Migration Success

1. ✅ Come back to this chat and confirm migration is complete
2. ✅ We'll merge PR #15 to main
3. ✅ Vercel will auto-deploy to production
4. ✅ Test quote system in production

---

## 📞 Need Help?

If you encounter errors:
1. Copy the error message
2. Share it in this chat
3. We'll troubleshoot together

**Common SQL that helps debug:**
```sql
-- See all tables
.tables

-- See table structure
.schema [table_name]

-- See column info
PRAGMA table_info([table_name]);
```
