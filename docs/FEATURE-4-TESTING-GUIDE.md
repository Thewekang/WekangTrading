# Feature 4: Economic News Calendar - Testing Guide

**Status**: ✅ COMPLETE - Ready for Testing  
**Created**: January 9, 2026  
**Branch**: `feature/economic-calendar`

---

## 📋 Feature Overview

**Objective**: Provide traders with real-time economic news calendar to manage risk before major market events.

**Key Components**:
- ✅ Database schema (`economic_events` table)
- ✅ RapidAPI integration (Ultimate Economic Calendar)
- ✅ Manual JSON import fallback
- ✅ Weekly auto-sync via Vercel Cron
- ✅ Admin sync management page
- ✅ User calendar page with countdown
- ✅ Dashboard widget with 5-min alerts
- ✅ Navigation links

---

## 🔑 Environment Setup

### 1. RapidAPI Configuration

**API Key**: `5c1660f0b1msh7d55fde70e96925p1c631djsnc71c9945e37b`

**In `.env.local`**:
```env
RAPIDAPI_KEY="5c1660f0b1msh7d55fde70e96925p1c631djsnc71c9945e37b"
```

**API Limits**:
- FREE tier: 10 requests/month
- Weekly auto-sync: 4 calls/month (leaves 6 buffer)
- Manual admin sync: Uses buffer quota
- JSON import: Zero API calls

---

## 🗄️ Database Verification

### 1. Check Table Exists

```sql
-- Run in Drizzle Studio or Turso shell
SELECT name FROM sqlite_master WHERE type='table' AND name='economic_events';
```

**Expected**: `economic_events` table exists

### 2. Verify Schema

```sql
PRAGMA table_info(economic_events);
```

**Expected Columns**:
- `id` (text, PRIMARY KEY)
- `event_date` (integer, NOT NULL)
- `country` (text(3), NOT NULL)
- `currency` (text(3), NOT NULL)
- `event_name` (text, NOT NULL)
- `indicator` (text)
- `importance` (text, NOT NULL)
- `forecast` (text)
- `actual` (text)
- `previous` (text)
- `period` (text)
- `source` (text, DEFAULT 'API')
- `fetched_at` (integer)
- `created_at` (integer, DEFAULT unixepoch())

---

## 🧪 Testing Checklist

### **Test 1: Admin Page Access**

**Steps**:
1. Login as ADMIN user
2. Navigate to `/admin/economic-calendar`

**Expected**:
- ✅ Page loads without errors
- ✅ "Sync from RapidAPI" button visible
- ✅ "Manual JSON Import" section visible
- ✅ Last sync timestamp shows "No sync yet" (initial state)
- ✅ Usage tips card displays quota info (10/month)

**Screenshot Location**: `docs/screenshots/admin-calendar-initial.png`

---

### **Test 2: RapidAPI Sync (CRITICAL - Uses API Quota)**

**⚠️ WARNING**: This uses 1 of 10 monthly API calls. Test carefully!

**Steps**:
1. On `/admin/economic-calendar`
2. Click "Sync from RapidAPI" button
3. Wait for response (5-10 seconds)

**Expected**:
- ✅ Button shows loading state (disabled, spinner icon)
- ✅ Success alert appears: "✅ Successfully synced X events"
- ✅ Last sync timestamp updates to current time
- ✅ API quota used: 1/10

**Verify in Database**:
```sql
SELECT COUNT(*) as total, importance, source 
FROM economic_events 
WHERE source = 'API' 
GROUP BY importance, source;
```

**Expected**:
- Only `HIGH` and `MEDIUM` events (LOW filtered out)
- All events have `source = 'API'`
- All events are US country (`country = 'US'`)
- Events within next 14 days

**Common Issues**:
- **"API quota exceeded"**: You've used 10 calls this month. Use JSON import instead.
- **"No events found"**: API returned empty data. Check date range.
- **500 error**: Check `.env.local` has correct `RAPIDAPI_KEY`.

---

### **Test 3: Manual JSON Import**

**Steps**:
1. On `/admin/economic-calendar`
2. Click "Load Template" button
3. JSON template appears in textarea
4. (Optional) Modify dates to upcoming dates
5. Click "Import from JSON" button

**Template JSON**:
```json
[
  {
    "eventDate": "2026-02-06T13:30:00Z",
    "country": "US",
    "currency": "USD",
    "eventName": "Non-Farm Payrolls (NFP)",
    "indicator": "Employment",
    "importance": "HIGH",
    "forecast": "200K",
    "previous": "210K",
    "period": "January"
  },
  {
    "eventDate": "2026-02-12T13:30:00Z",
    "country": "US",
    "currency": "USD",
    "eventName": "Consumer Price Index (CPI)",
    "indicator": "Inflation",
    "importance": "HIGH",
    "forecast": "3.2%",
    "previous": "3.1%",
    "period": "January"
  }
]
```

**Expected**:
- ✅ Success alert: "✅ Successfully imported 2 events"
- ✅ Last sync shows "Manual" source
- ✅ Events appear in calendar page

**Verify in Database**:
```sql
SELECT * FROM economic_events WHERE source = 'MANUAL';
```

**Expected**:
- Events have `source = 'MANUAL'`
- `fetched_at` is NULL (manual import)

**Common Issues**:
- **Validation error**: Check JSON format (valid JSON array)
- **"eventDate is required"**: Ensure all events have `eventDate` field
- **"importance must be HIGH/MEDIUM/LOW"**: Fix importance values

---

### **Test 4: User Calendar Page**

**Steps**:
1. Login as regular USER
2. Navigate to `/calendar`

**Expected**:
- ✅ Page loads without errors
- ✅ "Today's Events" section visible
- ✅ "This Week" section visible
- ✅ Alert status at top (safe/warning/danger)
- ✅ If no events today: "No events scheduled today" message
- ✅ Countdown timers update every second

**Event Card Elements**:
- Time in 24h format (e.g., "13:30")
- Importance badge (HIGH=red, MEDIUM=default, LOW=secondary)
- Currency badge (USD)
- Forecast and Previous values
- Live countdown (format: "2h 15m 30s" or "Released")

**Screenshot Location**: `docs/screenshots/calendar-page.png`

---

### **Test 5: Dashboard Widget**

**Steps**:
1. Login as regular USER
2. Navigate to `/dashboard`

**Expected**:
- ✅ Widget appears below Daily Loss Alert
- ✅ Title: "Today's Economic News"
- ✅ "View Calendar" link in header
- ✅ Alert status visible (color-coded)
- ✅ If events today: Next event card with countdown
- ✅ If no events: "No economic news today" message

**Alert Types**:

1. **SAFE (Green)**: 
   - Icon: ✓ CheckCircle2
   - Message: "✅ Safe to trade - Next: NFP in 3h 45m"
   - Conditions: >10 minutes until next event

2. **WARNING (Yellow)**: 
   - Icon: ⚠️ Clock
   - Message: "⚡ Prepare to close positions - 7m until NFP"
   - Conditions: 5-10 minutes before event

3. **DANGER BEFORE (Red)**: 
   - Icon: ⚠️ AlertTriangle
   - Message: "🔴 CLOSE POSITIONS NOW! 3m until NFP"
   - Conditions: 0-5 minutes before event

4. **DANGER AFTER (Red)**: 
   - Icon: ⚠️ AlertTriangle
   - Message: "⚠️ DO NOT TRADE - NFP just released!"
   - Conditions: 0-5 minutes after event

**Screenshot Location**: `docs/screenshots/dashboard-widget.png`

---

### **Test 6: Alert Logic (Time-Sensitive)**

**⚠️ Requires event within next 15 minutes to test fully**

**Simulation Steps**:
1. Import JSON with event 15 minutes from now
2. Wait and observe countdown on dashboard widget
3. Verify alert changes:
   - At -15min: SAFE (green)
   - At -10min: SAFE (green)
   - At -7min: WARNING (yellow)
   - At -3min: DANGER (red)
   - At +1min: DANGER (red)
   - At +6min: SAFE (green)

**Expected Countdown Formats**:
- `3h 45m 20s` (>1 hour)
- `15m 30s` (1 min - 1 hour)
- `45s` (<1 minute)
- `+2m 15s` (after event)

**Test JSON** (adjust `eventDate` to 15 minutes from now):
```json
[
  {
    "eventDate": "2026-01-09T15:45:00Z",
    "country": "US",
    "currency": "USD",
    "eventName": "Test Event",
    "importance": "HIGH",
    "forecast": "100K",
    "previous": "95K"
  }
]
```

---

### **Test 7: Navigation Links**

**User Navigation**:
1. Login as USER
2. Check navigation bar
3. Expected: `/calendar` link between "Trades" and "Targets"
4. Click "📅 Calendar" → Should navigate to `/calendar`

**Admin Navigation**:
1. Login as ADMIN
2. Check admin navigation bar
3. Expected: `/admin/economic-calendar` link after "Trades"
4. Click "📅 Calendar" → Should navigate to `/admin/economic-calendar`

---

### **Test 8: Vercel Cron (Production Only)**

**⚠️ Cannot test locally - Requires Vercel deployment**

**Cron Configuration**:
```json
{
  "crons": [{
    "path": "/api/admin/economic-calendar/sync?action=api",
    "schedule": "0 0 * * 1"
  }]
}
```

**Schedule**: Every Monday 00:00 UTC

**Post-Deployment Verification**:
1. Deploy to Vercel staging
2. Wait for next Monday 00:00 UTC
3. Check Vercel logs: `vercel logs --follow`
4. Expected: Cron execution log with sync result
5. Verify database: New events with current `fetched_at`

**Manual Cron Test**:
```bash
# In Vercel deployment
curl -X POST https://your-domain.vercel.app/api/admin/economic-calendar/sync?action=api
```

---

### **Test 9: Error Handling**

#### 9.1 Invalid API Key

**Steps**:
1. Set wrong API key in `.env.local`
2. Try API sync

**Expected**:
- ❌ Error alert: "Failed to fetch events from RapidAPI"
- No events imported
- Last sync unchanged

#### 9.2 Invalid JSON Format

**Steps**:
1. Paste invalid JSON in textarea
2. Click "Import from JSON"

**Expected**:
- ❌ Error alert: "Invalid JSON format"
- No events imported

#### 9.3 API Quota Exceeded

**Steps**:
1. Make 11 API calls in same month
2. Try 12th API sync

**Expected**:
- ❌ Error alert: "API quota exceeded. Use manual JSON import."
- Fallback option available (JSON import)

#### 9.4 Unauthenticated Access

**Steps**:
1. Logout
2. Navigate to `/calendar`

**Expected**:
- Redirect to `/login`
- Middleware blocks access

#### 9.5 Non-Admin Access to Admin Page

**Steps**:
1. Login as USER (not ADMIN)
2. Navigate to `/admin/economic-calendar`

**Expected**:
- Redirect to `/dashboard`
- Layout blocks access

---

### **Test 10: Mobile Responsiveness**

**Devices to Test**:
- iPhone 13 Pro (390x844)
- Samsung Galaxy S21 (360x800)
- iPad Air (820x1180)

**Calendar Page**:
- ✅ Event cards stack vertically on mobile
- ✅ Countdown timer visible on right
- ✅ Text readable without horizontal scroll
- ✅ Badges display correctly

**Dashboard Widget**:
- ✅ Alert message wraps properly
- ✅ Countdown timer readable
- ✅ "View Calendar" link accessible

**Admin Page**:
- ✅ Sync buttons full-width on mobile
- ✅ JSON textarea scrollable
- ✅ Success/error alerts visible

**Screenshot Location**: `docs/screenshots/mobile-*.png`

---

### **Test 11: Timezone Handling**

**User's Timezone Setting**:
1. User sets timezone in `/settings` (e.g., "America/New_York")
2. Navigate to `/calendar`

**Expected**:
- Event times displayed in user's timezone (NOT UTC)
- Countdown calculations respect timezone
- Dashboard widget shows correct local times

**Verify**:
```typescript
// In components/calendar/TodayNewsWidget.tsx
// formatTime() should use user's timezone context
const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false,
    timeZone: userTimezone  // ← Should use TimezoneContext
  });
};
```

**⚠️ Current Implementation**: Uses browser's local timezone. Needs enhancement to use `TimezoneContext`.

---

### **Test 12: Data Filtering**

**Verify RapidAPI Filters**:
1. Sync from API
2. Check imported events

**Expected**:
- ✅ Only `country = 'US'`
- ✅ Only `importance = 'HIGH'` or `'MEDIUM'` (no LOW)
- ✅ Events within next 14 days only
- ✅ Old events deleted before import

**SQL Verification**:
```sql
-- Should return 0 (no LOW importance)
SELECT COUNT(*) FROM economic_events WHERE importance = 'LOW';

-- Should return 0 (no non-US events)
SELECT COUNT(*) FROM economic_events WHERE country != 'US';

-- Should return 0 (no events older than today)
SELECT COUNT(*) FROM economic_events WHERE event_date < unixepoch('now');
```

---

## 🚀 Pre-Merge Checklist

Before merging `feature/economic-calendar` → `develop`:

### Code Quality
- [ ] All TypeScript errors resolved (`npm run build`)
- [ ] No console errors in browser
- [ ] Drizzle schema matches database
- [ ] Environment variable documented

### Functionality
- [ ] Admin can sync from API ✅
- [ ] Admin can import JSON ✅
- [ ] User can view calendar ✅
- [ ] Dashboard widget displays correctly ✅
- [ ] Countdown timers update live ✅
- [ ] Alert logic works (safe/warning/danger) ✅
- [ ] Navigation links functional ✅

### Performance
- [ ] Calendar page loads <1s
- [ ] Dashboard widget loads <500ms
- [ ] No excessive API calls (only admin-triggered)
- [ ] Database queries optimized

### Security
- [ ] Admin endpoints require ADMIN role
- [ ] User endpoints require authentication
- [ ] API key not exposed to client
- [ ] No SQL injection vulnerabilities

### Documentation
- [ ] Feature 4 marked complete in roadmap
- [ ] API endpoints documented
- [ ] Admin guide updated
- [ ] User guide updated

---

## 📊 Expected Performance Metrics

**API Response Times**:
- `POST /api/admin/economic-calendar/sync?action=api`: 3-8 seconds (RapidAPI call)
- `POST /api/admin/economic-calendar/sync?action=json`: <500ms (database insert)
- `GET /api/calendar?type=upcoming`: <200ms (database query)
- `GET /api/calendar?type=today`: <100ms (filtered query)

**Database Queries**:
- Upcoming events: `SELECT * FROM economic_events WHERE event_date > ? ORDER BY event_date LIMIT 50`
- Today's events: `SELECT * FROM economic_events WHERE event_date BETWEEN ? AND ? ORDER BY event_date`

**Expected Data Volume**:
- Weekly sync: ~10-20 events imported
- Monthly total: ~80 events in database
- API usage: 4-6 calls/month (within 10 limit)

---

## 🐛 Known Issues & Limitations

### 1. Timezone Display
**Issue**: Calendar page uses browser's local timezone, not user's `preferredTimezone` setting.  
**Impact**: Times may be incorrect if browser timezone differs from user preference.  
**Fix Priority**: Medium (enhancement for Phase 5B)

### 2. Cron Job Testing
**Issue**: Cannot test Vercel Cron locally (only works in production).  
**Workaround**: Manual API sync testing via admin page.  
**Fix Priority**: N/A (Vercel limitation)

### 3. API Rate Limiting
**Issue**: FREE tier only 10 requests/month.  
**Mitigation**: Weekly cron + JSON fallback.  
**Upgrade Path**: PRO tier ($5/month, 10K requests) if needed.

### 4. Historical Data
**Issue**: Only next 14 days synced, no historical event data.  
**Rationale**: Trading alerts focus on upcoming events.  
**Enhancement**: Could add archive feature in future.

### 5. Actual Value Updates
**Issue**: No automatic update of `actual` values after event release.  
**Workaround**: Manual database update or re-sync from API (if API provides actuals).  
**Fix Priority**: Low (not critical for trading alerts)

---

## 📝 Post-Testing Actions

### After Successful Testing:
1. Create PR: `feature/economic-calendar` → `develop`
2. Add testing screenshots to PR description
3. Request code review
4. Merge to develop
5. Delete feature branch
6. Update v1.1.0 roadmap: Mark Feature 4 ✅
7. Test in staging environment
8. Deploy to production

### Update Production Environment:
1. Add `RAPIDAPI_KEY` to Vercel environment variables
2. Deploy to production
3. Verify Vercel Cron appears in dashboard
4. Monitor first Monday cron execution
5. Check API quota usage in RapidAPI dashboard

---

## 📞 Support & Troubleshooting

**RapidAPI Dashboard**: https://rapidapi.com/hub  
**Turso Dashboard**: https://app.turso.tech  
**Vercel Logs**: `vercel logs --follow`

**Common Commands**:
```bash
# Check database
npm run drizzle:studio

# View environment
cat .env.local | grep RAPIDAPI

# Test API endpoint
curl http://localhost:3000/api/calendar?type=today

# Push schema changes
npm run drizzle:push
```

---

**Version**: 1.0  
**Last Updated**: January 9, 2026  
**Tested By**: _[Add name after testing]_  
**Test Date**: _[Add date after testing]_
