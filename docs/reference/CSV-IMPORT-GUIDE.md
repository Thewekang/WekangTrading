# CSV Trade Import Guide

This guide explains how to import trades from the CSV file for the wtrader account.

## Prerequisites

1. **wtrader account must exist** in the database
   - Email: `wtrader@wekang.com`
   - If not exists, create via registration or admin panel first

2. **Database connection** must be configured
   - `.env.local` with `DATABASE_URL` and `DATABASE_AUTH_TOKEN`

## Import Steps

### Step 1: Run the Import Script

```bash
npm run db:import-csv
```

This will:
- ✅ Find the wtrader user account
- ✅ Load existing SOP types
- ✅ Create missing SOP types (BB Mastery, W & M breakout, Engulfing Fail)
- ✅ Parse 51 trades from the CSV
- ✅ Calculate market sessions automatically
- ✅ Insert all trades into the database

### Step 2: Recalculate Daily Summaries

After importing, update the daily summaries:

```bash
npm run db:recalculate
```

This ensures all dashboard statistics are up-to-date.

### Step 3: Verify Import

1. **Login as wtrader**:
   - Email: `wtrader@wekang.com`
   - Password: (your wtrader password)

2. **Check Trades**:
   - Navigate to `/trades`
   - Should see 51 trades on 01/09/2026

3. **Check Dashboard**:
   - Navigate to `/dashboard`
   - Verify statistics:
     - Total Trades: 51
     - Wins: 31
     - Losses: 20
     - Win Rate: ~60.78%
     - Net P/L: Check total

## Trade Data Summary

**Date**: January 9, 2026  
**Total Trades**: 51 trades  
**Results**:
- Wins: 31 (60.78%)
- Losses: 20 (39.22%)

**SOP Types**:
- BB Mastery: 20 trades
- W & M breakout: 23 trades
- Engulfing Fail: 8 trades

**SOP Compliance**:
- SOP Followed: 17 trades
- SOP Not Followed: 34 trades

**Sessions** (auto-calculated):
- ASIA: Early morning trades (0:46 - 3:56)
- EUROPE: Afternoon trades (18:44 - 20:11)
- US: Evening trades (21:14 - 22:51)

## Troubleshooting

### Error: "wtrader user not found"

**Solution**: Create the wtrader account first:

**Option 1: Admin Panel** (if you have admin access)
1. Login as admin
2. Go to `/admin/users`
3. Click "Create User"
4. Fill in:
   - Name: `wtrader`
   - Email: `wtrader@wekang.com`
   - Password: (set a password)
   - Role: `USER`

**Option 2: Registration Page**
1. Go to `/register`
2. Get an invite code from admin (`/admin/invite-codes`)
3. Register with:
   - Name: `wtrader`
   - Email: `wtrader@wekang.com`
   - Password: (set a password)
   - Invite Code: (from admin)

### Error: "SOP type not found"

The script automatically creates missing SOP types, so this shouldn't happen. If it does:

1. Check the SOP types table
2. Manually create via `/admin/sop-types` (admin panel)

### Error: "Duplicate trades"

If you run the script multiple times, it will create duplicate entries. To clean up:

1. **Option 1**: Delete wtrader's trades via admin panel (`/admin/trades`)
2. **Option 2**: Reset wtrader's account (`/settings` → Reset Account)
3. Then run the import script again

## Manual Alternative (UI)

If you prefer to use the web interface:

1. Login as wtrader
2. Go to `/trades/bulk`
3. Set trade date: `01/09/2026`
4. Fill in the table with trades from CSV
5. Submit (max 100 trades per batch)

**Note**: This is more time-consuming for 51 trades. The script is recommended.

## Script Location

`scripts/import-csv-trades.ts`

The CSV data is embedded in the script. To import different data:
1. Edit the `csvData` constant in the script
2. Follow the same format: `Date & time;Result;SOP;SOP Type;Amount;;`
3. Run `npm run db:import-csv`

---

**Created**: January 12, 2026  
**Last Updated**: January 12, 2026
