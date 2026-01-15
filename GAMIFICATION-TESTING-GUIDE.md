# Gamification System - Testing Guide

## Testing Environment
- **Branch**: main
- **Database**: Staging Turso
- **Features**: Phases 1-4 Complete

---

## Pre-Testing Checklist

### 1. Database State
```bash
# Check if badges are seeded (should have 34 badges)
# Run in Turso CLI or database query tool
SELECT COUNT(*) FROM badges WHERE is_active = 1;

# Check if tables exist
SELECT name FROM sqlite_master WHERE type='table' 
  AND name IN ('badges', 'user_badges', 'streaks', 'motivational_messages', 'user_stats');
```

### 2. Start Dev Server
```bash
npm run dev
```
Expected: Server starts on http://localhost:3000

---

## Test Plan

### ✅ Phase 1: Database & Core Services

**Test 1.1: Badge Seeding**
- Expected: 34 badges in database
- Categories: VOLUME (5), STREAK (5), PROFIT (5), CONSISTENCY (4), SOP (4), PERFORMANCE (4), SPECIAL (7)
- Verify: Check `scripts/seed-badges.ts` was run successfully

**Test 1.2: User Stats Table**
- Create a trade
- Verify: `user_stats` table created for user
- Fields: totalTrades, winRate, sopComplianceRate, etc.

---

### ✅ Phase 2: Dashboard Widgets

**Test 2.1: Achievement Showcase**
Navigate to: `/dashboard`

Expected Display:
- "🏆 Recent Achievements" section
- If no badges: "No badges earned yet" message
- If badges exist: Shows up to 4 recent badges
- "View All" link to `/dashboard/achievements`

**Test 2.2: Active Streaks Widget**
Expected Display:
- Win Streak card (orange) - Current/Longest
- Log Streak card (blue) - Current/Longest
- SOP Streak card (green) - Current/Longest
- If no streaks: "No active streaks" message

**Test 2.3: Next Badges Progress**
Expected Display:
- Top 3 badges closest to earning
- Progress bars with percentages
- Current/Target values formatted properly
- Points display

**Test 2.4: Motivational Messages Feed**
Expected Display:
- Latest 5 messages
- Unread count badge
- Message types with color coding
- Relative time stamps
- Click to mark as read

---

### ✅ Phase 3: Achievements Page

**Test 3.1: Navigate to Achievements**
Path: Click "🏆 Achievements" in top menu OR click "View All" from dashboard

Expected URL: `/dashboard/achievements`

**Test 3.2: Stats Overview Cards**
Expected Display:
- Badges Earned: X / 34
- Total Points: calculated sum
- Completion: percentage
- By Tier: Bronze/Silver/Gold/Platinum breakdown

**Test 3.3: Search & Filters**
Test Actions:
1. **Search**: Type "first" → Should show "First Trade" badge
2. **Status Filter**: 
   - Click "Earned" → Shows only unlocked badges
   - Click "Locked" → Shows only locked badges
3. **Category Filter**: Click "VOLUME" → Shows 5 volume badges
4. **Tier Filter**: Click "BRONZE" → Shows bronze badges only

**Test 3.4: Badge Gallery**
Expected Display:
- Responsive grid (2-5 columns based on screen size)
- Locked badges: Grayscale + lock icon
- Earned badges: Full color + checkmark
- Points display on each badge

**Test 3.5: Badge Detail Modal**
Test Action: Click any badge

Expected Display:
- Badge icon, name, tier, points
- Status: Earned ✓ or Locked 🔒
- Earned date (if earned)
- Requirement description
- Progress bar (if locked)
- Current/Target values
- Category info

**Test 3.6: Category Progress**
Expected Display:
- Progress bars for all 7 categories
- Earned / Total count for each
- Visual progress indicator

---

### ✅ Phase 4: Notification System

**Test 4.1: Badge Auto-Awarding**
Test Steps:
1. Go to `/trades/new`
2. Submit a trade (first trade of the session)
3. Check console logs: Should see "Awarded X new badge(s)"
4. Go to `/dashboard/achievements`
5. Verify: "First Trade" badge (Bronze, VOLUME) is earned

**Test 4.2: Notification Bell**
Location: Top-right header

Expected Display:
- Bell icon
- Red badge with unread count
- Shows "9+" if more than 9 unread
- Click → Navigate to `/notifications`

**Test 4.3: Notification Center**
Navigate to: `/notifications`

Expected Display:
- Header: "Notifications" with unread count
- "Mark all as read" button (if unread > 0)
- Filter tabs: All / Unread
- Message cards with:
  - Icon based on type
  - Title and message
  - Relative time
  - Mark as read button (✓)
  - Badge details (for ACHIEVEMENT type)
  - Streak details (for STREAK type)

**Test 4.4: Create Multiple Trades**
Test Steps:
1. Create 3-5 winning trades
2. Expected badges to unlock:
   - "First Trade" (1 trade)
   - "Baby Steps" (10 trades) - if you complete 10
   - Potential streak badges if consecutive winning days
3. Check `/notifications` → Should see multiple achievement notifications
4. Check `/dashboard/achievements` → Multiple badges earned

**Test 4.5: Mark Notifications as Read**
Test Steps:
1. In `/notifications`, click checkmark on a message
2. Expected: Message loses blue highlight
3. Unread count decreases by 1
4. Click "Mark all as read"
5. Expected: All messages marked, unread count = 0

---

## Edge Cases to Test

### Edge Case 1: No User Stats
- Create brand new user
- Submit first trade
- Verify: `user_stats` auto-created

### Edge Case 2: Badge Already Earned
- Try to award same badge twice
- Expected: No duplicate in `user_badges` table
- No duplicate notification

### Edge Case 3: Trade Submission Failure
- Submit invalid trade (e.g., future timestamp)
- Expected: Badge check doesn't run
- No crash, proper error message

### Edge Case 4: Streak Breaking
Test Steps:
1. Create winning trades for 3 consecutive days
2. Expected: Win streak = 3
3. Create a losing trade
4. Expected: Win streak resets to 0
5. Check notifications for streak milestone (day 3)

### Edge Case 5: Empty States
Test with new user (no data):
- Dashboard widgets show "No badges earned yet"
- Achievements page shows 0 / 34
- Notifications page shows "No notifications"
- Streaks show 0 current, 0 longest

---

## Performance Tests

### Load Test 1: Badge Progress Calculation
- User with 100+ trades
- Navigate to `/dashboard/achievements`
- Expected: Page loads in < 500ms
- Progress calculations accurate

### Load Test 2: Notification Pagination
- User with 50+ notifications
- Navigate to `/notifications`
- Expected: Shows latest 100, loads quickly

---

## Mobile Responsiveness Tests

Test on mobile viewport (375px width):
1. Dashboard widgets stack vertically
2. Achievements page: 2-column badge grid
3. Notification center: Full-width cards
4. Badge modal: Fits on small screen
5. Navigation menu: Hamburger menu (if implemented)

---

## Known Limitations (Phase 4)

1. **No Real-Time Updates**: Notifications require page refresh
2. **No Toast Animations**: Badge unlocks don't show animated popup
3. **No Share Feature**: Can't share achievements on social media
4. **No Admin Management**: Admins can't create custom badges yet
5. **No Badge Unlock Sounds**: Silent badge awarding
6. **No Progress Predictions**: Doesn't estimate when next badge will unlock

These are planned for Phase 5 (Polish & Enhancement).

---

## Success Criteria

✅ All 34 badges display correctly  
✅ Badge auto-awarding works on trade submission  
✅ Notifications created for badge unlocks  
✅ Notification bell shows unread count  
✅ Achievements page filterable and searchable  
✅ Badge modal shows detailed info  
✅ Streaks track correctly  
✅ No console errors  
✅ Build succeeds (npm run build)  
✅ All pages load without crashes  

---

## Bug Reporting Template

If you find issues:

```
**Bug**: [Short description]
**Page**: [URL where bug occurs]
**Steps to Reproduce**:
1. 
2. 
3. 

**Expected**: [What should happen]
**Actual**: [What actually happens]
**Console Errors**: [Copy any error messages]
**Screenshot**: [If applicable]
```

---

## Next Steps After Testing

If all tests pass:
- ✅ Mark v1.2.0 gamification as complete
- Document any bugs found
- Decide on Phase 5 features (optional enhancements)
- Prepare for production deployment

If tests fail:
- Document failures
- Fix critical bugs
- Re-test
- Update documentation

---

**Last Updated**: January 16, 2026  
**Tested By**: [Your Name]  
**Test Duration**: ~30-45 minutes  
**Status**: Ready for Testing
