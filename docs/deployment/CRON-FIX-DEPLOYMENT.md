# Economic Calendar Cron Fix - Deployment Guide

**Issue**: Cron job not triggering automatically on main/production branch  
**Root Cause**: Missing sync-cron endpoint and incorrect vercel.json configuration  
**Date Fixed**: January 28, 2026  
**Status**: ✅ FIXED - Ready for deployment

---

## Problem Analysis

### What Was Wrong

1. **Missing Endpoint**: The `sync-cron/route.ts` file didn't exist
   - Documentation referenced `/api/admin/economic-calendar/sync-cron`
   - Only `/api/admin/economic-calendar/sync` existed (POST only, for manual use)

2. **Wrong Path in vercel.json**:
   ```json
   // ❌ BEFORE (incorrect)
   {
     "path": "/api/admin/economic-calendar/sync?action=api",
     "schedule": "0 5 * * 1-5"
   }
   ```

3. **Wrong HTTP Method**: 
   - Existing sync endpoint only accepted POST requests
   - Vercel Cron sends GET requests by default

### Why Manual Sync Worked

The manual sync button called `POST /api/admin/economic-calendar/sync?action=api` which worked because:
- ✅ Correct HTTP method (POST)
- ✅ User authentication provided
- ✅ Direct browser request (not cron)

---

## Solution Implemented

### 1. Created Dedicated Cron Endpoint

**File**: `app/api/admin/economic-calendar/sync-cron/route.ts` (NEW)

**Features**:
- ✅ GET method (Vercel Cron compatible)
- ✅ Authorization via `CRON_SECRET` (Bearer token)
- ✅ No user authentication required (cron-specific)
- ✅ Full logging to `cron_logs` table
- ✅ Error handling with detailed logs
- ✅ Console logging for Vercel logs

**Security**:
```typescript
// Verifies cron requests using environment variable
const authHeader = request.headers.get('authorization');
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return 401 Unauthorized
}
```

### 2. Fixed vercel.json Configuration

```json
// ✅ AFTER (correct)
{
  "crons": [{
    "path": "/api/admin/economic-calendar/sync-cron",
    "schedule": "0 5 * * 1-5"
  }]
}
```

**Schedule Explanation**:
- `0 5 * * 1-5` = Monday-Friday at 05:00 UTC (00:00 EST)
- Runs 5 days/week = ~22 requests/month
- API limit: 50 requests/month (safe buffer)

### 3. Updated .env.example

Added required environment variables:
```env
# Economic Calendar API (RapidAPI)
RAPIDAPI_KEY="your-rapidapi-key-here"

# Vercel Cron Job Security
CRON_SECRET="generate-this-with-openssl-rand-base64-32"
```

---

## Deployment Steps

### Step 1: Generate CRON_SECRET

Run this command locally to generate a secure random secret:

```bash
# PowerShell (Windows)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Or use OpenSSL
openssl rand -base64 32
```

**Example output**: `Kv8X5Yz9Qw3Lm7Np2Rs4Ut6Vx8Az0Bc1Df3Gh5Ij7Kl9Mn0Pq2St4==`

### Step 2: Add Environment Variable to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **WekangTrading**
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   - **Name**: `CRON_SECRET`
   - **Value**: (paste the generated secret from Step 1)
   - **Environment**: Production, Preview, Development (all)
5. Click **Save**

### Step 3: Verify RAPIDAPI_KEY Exists

1. In Vercel Settings → Environment Variables
2. Check if `RAPIDAPI_KEY` exists
3. If missing, add it:
   - **Name**: `RAPIDAPI_KEY`
   - **Value**: Your RapidAPI key from [RapidAPI Dashboard](https://rapidapi.com/hub)
   - **Environment**: Production, Preview, Development

### Step 4: Deploy to Production

#### Option A: Deploy from Local

```bash
# Ensure you're on the branch with fixes
git status

# If on feature branch, merge to main first
git checkout main
git merge develop  # or your fix branch

# Push to trigger deployment
git push origin main
```

#### Option B: Deploy via Vercel CLI

```bash
# Deploy to production
vercel --prod

# Or deploy specific branch
git push origin main  # Vercel auto-deploys
```

### Step 5: Verify Deployment

1. **Check Vercel Deployment**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Find latest deployment
   - Wait for "Ready" status

2. **Verify Cron Configuration**:
   - In Vercel project → **Settings** → **Cron Jobs**
   - Should show: `/api/admin/economic-calendar/sync-cron` with schedule `0 5 * * 1-5`

3. **Test Endpoint Manually** (optional):
   ```bash
   # Replace with your CRON_SECRET and domain
   curl -X GET https://your-domain.vercel.app/api/admin/economic-calendar/sync-cron \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

4. **Check Admin Dashboard**:
   - Login to your app as admin
   - Go to Economic Calendar admin page
   - Check "Next Scheduled Sync" countdown
   - Verify cron logs table shows entries

---

## Monitoring Cron Execution

### Via Vercel Logs

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Logs** tab
4. Filter by:
   - Function: `/api/admin/economic-calendar/sync-cron`
   - Time range: Last 7 days

**Look for**:
- ✅ `🔄 Cron job started: economic-calendar-sync`
- ✅ `✅ Cron job completed: X events imported in Xms`
- ❌ `❌ Cron job failed: error message`

### Via Admin Dashboard

1. Login as admin
2. Go to `/admin/economic-calendar`
3. Check:
   - **Next Scheduled Sync**: Shows countdown timer
   - **Cron Execution History**: Shows last 10 runs
   - **Status badges**: SUCCESS (green) or ERROR (red)

### Via Database Logs

```sql
-- Query recent cron logs
SELECT 
  id,
  jobName,
  status,
  startedAt,
  completedAt,
  duration,
  itemsProcessed,
  errorMessage
FROM cron_logs
WHERE jobName = 'economic-calendar-sync'
ORDER BY startedAt DESC
LIMIT 10;
```

---

## Expected Behavior After Fix

### Automatic Sync (Cron)

- **Frequency**: Every weekday at 05:00 UTC (00:00 EST)
- **Next runs**:
  - Monday, January 29, 2026 at 05:00 UTC
  - Tuesday, January 30, 2026 at 05:00 UTC
  - (continues daily Mon-Fri)

### Manual Sync (Admin Button)

- Still works via `POST /api/admin/economic-calendar/sync?action=api`
- Requires admin authentication
- Available anytime (not limited to schedule)

### Logs

Both automatic and manual syncs will appear in:
- ✅ Admin dashboard cron logs table
- ✅ Database `cron_logs` table
- ✅ Vercel function logs

---

## Troubleshooting

### Cron Still Not Running

**Check 1: Environment Variables**
```bash
# In Vercel dashboard, verify:
# - CRON_SECRET exists and has value
# - RAPIDAPI_KEY exists and has value
```

**Check 2: Vercel Cron Configuration**
- Go to Settings → Cron Jobs
- Verify path matches: `/api/admin/economic-calendar/sync-cron`
- Verify schedule: `0 5 * * 1-5`

**Check 3: Function Logs**
- Go to Vercel Logs
- Look for 401 errors (invalid CRON_SECRET)
- Look for 500 errors (API issues)

### Getting 401 Unauthorized

**Cause**: CRON_SECRET mismatch

**Fix**:
1. Verify `CRON_SECRET` in Vercel matches expected value
2. Regenerate secret if needed
3. Update Vercel environment variable
4. Redeploy application

### Getting 500 Internal Server Error

**Possible Causes**:
1. **Missing RAPIDAPI_KEY**: Add to Vercel
2. **RapidAPI quota exceeded**: Check usage on RapidAPI dashboard
3. **Database connection issue**: Check Turso database status

**Debug Steps**:
1. Check Vercel function logs for detailed error
2. Check `cron_logs` table for error messages
3. Test manual sync to isolate issue

### No Events Imported (0 events)

**Possible Causes**:
1. **No events in next 7 days**: Normal (API returns empty array)
2. **Wrong country filter**: Service defaults to USA (country ID = 5)
3. **API rate limit**: Check RapidAPI dashboard

---

## Rollback Plan (If Needed)

If deployment causes issues:

1. **Revert vercel.json**:
   ```json
   {
     "crons": []  // Disable cron temporarily
   }
   ```

2. **Redeploy**:
   ```bash
   git commit -am "Temporarily disable cron"
   git push origin main
   ```

3. **Use Manual Sync**: Admin can still sync via dashboard button

---

## Success Criteria

After deployment, verify:

- ✅ Cron job shows in Vercel Settings → Cron Jobs
- ✅ Next scheduled run displayed in admin dashboard
- ✅ Countdown timer updates every second
- ✅ First automatic sync executes on next scheduled day
- ✅ Cron logs table shows SUCCESS status
- ✅ Events appear in calendar after sync
- ✅ Manual sync still works

---

## Files Changed

1. **NEW**: `app/api/admin/economic-calendar/sync-cron/route.ts`
2. **MODIFIED**: `vercel.json` (cron path fixed)
3. **MODIFIED**: `.env.example` (added CRON_SECRET and RAPIDAPI_KEY)
4. **NEW**: This deployment guide

---

## Next Automatic Sync

Based on schedule `0 5 * * 1-5`:

- **Next run**: Next weekday at 05:00 UTC
- **If deployed Tuesday**: Will run Wednesday at 05:00 UTC
- **If deployed Friday**: Will run Monday at 05:00 UTC
- **Never runs**: Saturday, Sunday (markets closed)

---

## Support

If issues persist after deployment:

1. Check Vercel function logs for errors
2. Check `cron_logs` table in database
3. Test manual sync to verify API connectivity
4. Verify all environment variables set correctly
5. Contact Vercel support if cron configuration issues

---

**Document Version**: 1.0  
**Last Updated**: January 28, 2026  
**Author**: GitHub Copilot  
**Status**: Ready for Production Deployment
