# 🚨 HOTFIX: Discipline Tracker Missing Tables

**Issue:** Production error 500 on `/api/discipline-tracker/*` endpoints  
**Root Cause:** `discipline_tracker_rows` and `discipline_tracker_settings` tables don't exist in production database  
**Fix:** Apply migration to create missing tables  
**Date:** February 8, 2026

---

## Problem

Production deployment included discipline tracker code but the database migration was never applied to production. This causes 500 errors:

```
GET /api/discipline-tracker/settings 500 (Internal Server Error)
GET /api/discipline-tracker/rows 500 (Internal Server Error)
```

**Error:** `SQLite error: no such table: discipline_tracker_rows`

---

## Solution

Apply the discipline tracker migration to production database.

### Step 1: Apply Migration via WSL

```bash
# Enter WSL
wsl

# Navigate to project
cd /mnt/g/'Hasil Kerja'/Website/WekangTrading

# Set PATH
export PATH=/home/h4mim/.turso:$PATH

# Apply migration
turso db shell wekangtrading-prod < apply-migration-discipline-tracker.sql

# Verify tables created
turso db shell wekangtrading-prod
```

Inside the shell:
```sql
-- Check tables exist
.tables

-- Verify discipline_tracker_rows
.schema discipline_tracker_rows

-- Verify discipline_tracker_settings
.schema discipline_tracker_settings

-- Count (should be 0)
SELECT COUNT(*) FROM discipline_tracker_rows;
SELECT COUNT(*) FROM discipline_tracker_settings;

.quit
```

### Step 2: Verify in Production

After migration, test these URLs:
- https://wekangtrading.vercel.app/discipline-tracker (should load without errors)
- API should return empty arrays instead of 500 errors

---

## What This Migration Creates

1. **discipline_tracker_rows table**
   - Stores daily trading records
   - 3 trades per day with outcomes and TP3 amounts
   - Includes is_aplus_day and is_range_expansion_day flags

2. **discipline_tracker_settings table**
   - User-specific settings (max trades, SL/BE/TP values)
   - TP3 calculation mode
   - Win rate formula preference

3. **Indexes**
   - user_id indexes for fast queries
   - trade_date index for date-based filtering

---

## Timeline

- v1.7.0 deployed with discipline tracker code
- Migration 0008 (discipline tracker) was never applied to prod
- Only migration 0009 (quote system) was applied
- This hotfix applies the missing migration

---

## Files in This Hotfix

- `apply-migration-discipline-tracker.sql` - SQL migration
- `PRODUCTION-DISCIPLINE-TRACKER-HOTFIX.md` - This guide

---

## After Migration

Once migration is successful:
1. Merge this hotfix branch to main
2. No code changes needed (tables will exist)
3. Discipline tracker will work in production
