# Phase 5B-3 Testing Guide

**Date**: January 10, 2026  
**Feature**: User Self-Service (Password Change, Account Reset, 24hr Deletion Window)  
**Status**: Ready for Testing

---

## Prerequisites

1. **Dev Server Running**: `npm run dev` on http://localhost:3000
2. **Test User Account**: Create a test user to avoid affecting real data
3. **Sample Data**: Have some trades to test deletion and reset features

---

## Test Scenario 1: Password Change

### Setup
1. Login with test user credentials
2. Remember current password for verification

### Test Cases

#### TC1.1: Successful Password Change ✅
1. Navigate to Settings page (⚙️ Settings in menu)
2. Scroll to "Change Password" section
3. Fill in:
   - Current Password: [your current password]
   - New Password: `NewPass123`
   - Confirm Password: `NewPass123`
4. Click "Change Password" button
5. **Expected**: 
   - Success toast appears: "Password changed successfully"
   - Form fields clear
   - No errors

#### TC1.2: Wrong Current Password ❌
1. Fill in:
   - Current Password: `WrongPassword`
   - New Password: `NewPass123`
   - Confirm Password: `NewPass123`
2. Click "Change Password"
3. **Expected**: Error toast: "Current password is incorrect"

#### TC1.3: New Password Too Short ❌
1. Fill in:
   - Current Password: [correct password]
   - New Password: `short`
   - Confirm Password: `short`
2. Click "Change Password"
3. **Expected**: Error toast: "New password must be at least 8 characters"

#### TC1.4: Passwords Don't Match ❌
1. Fill in:
   - Current Password: [correct password]
   - New Password: `NewPass123`
   - Confirm Password: `NewPass456`
2. Click "Change Password"
3. **Expected**: Error toast: "Passwords don't match"

#### TC1.5: Same as Current Password ❌
1. Fill in:
   - Current Password: [your current password]
   - New Password: [same as current]
   - Confirm Password: [same as current]
2. Click "Change Password"
3. **Expected**: Error toast: "New password must be different from current password"

#### TC1.6: Login with New Password ✅
1. After successful password change, logout
2. Try logging in with OLD password
3. **Expected**: Login fails with "Invalid credentials"
4. Login with NEW password
5. **Expected**: Login successful, redirects to dashboard

---

## Test Scenario 2: Account Reset

### Setup
1. Login with test user
2. Create some test data:
   - Add 5 trades (via /trades/new)
   - Create 1 target (via /targets)
3. Navigate to Settings page

### Test Cases

#### TC2.1: View Account Summary ✅
1. Scroll to "Danger Zone" section
2. Observe the data summary display
3. **Expected**: 
   - Shows total trades count
   - Shows total summaries count
   - Shows total targets count
   - Matches your actual data

#### TC2.2: Open Reset Modal ✅
1. Click "Reset My Account" button (red)
2. **Expected**: 
   - Modal opens with warning
   - Shows ⚠️ WARNING header
   - Lists items to be deleted with counts
   - Shows text input for confirmation
   - Submit button is disabled

#### TC2.3: Invalid Confirmation Phrase ❌
1. In modal, type incorrect phrase: `reset my account` (lowercase)
2. **Expected**: Submit button remains disabled
3. Try: `RESET MY ACCONT` (typo)
4. **Expected**: Submit button remains disabled

#### TC2.4: Valid Confirmation Phrase ✅
1. Type exactly: `RESET MY ACCOUNT` (all caps, exact spacing)
2. **Expected**: 
   - Submit button becomes enabled (red)
   - Button text: "Yes, Reset My Account"

#### TC2.5: Cancel Reset ✅
1. With modal open, click "Cancel" button
2. **Expected**: 
   - Modal closes
   - No data deleted
   - Still on settings page

#### TC2.6: Successful Account Reset ✅
1. Open reset modal again
2. Type confirmation phrase: `RESET MY ACCOUNT`
3. Click "Yes, Reset My Account"
4. **Expected**: 
   - Loading state during deletion
   - Success toast: "Account reset successfully. All trading data has been deleted."
   - Page reloads automatically
5. Navigate to Dashboard
6. **Expected**: 
   - All stats show 0
   - No trades in recent trades
   - Empty state
7. Navigate to Trades list
8. **Expected**: "No trades found" message
9. Navigate to Targets
10. **Expected**: No active targets displayed
11. Try logging in again
12. **Expected**: Login still works with same credentials

---

## Test Scenario 3: 24-Hour Deletion Window

### Setup
1. Create a new trade RIGHT NOW
2. Wait for database to have trade with recent `createdAt`

### Test Cases

#### TC3.1: Delete Recent Trade (<24hrs) ✅
1. Navigate to /trades list
2. Find the trade you just created
3. Click delete icon (trash can)
4. Confirm deletion
5. **Expected**: 
   - Trade deleted successfully
   - Toast: "Trade deleted successfully"
   - Daily summary updates
   - Trade no longer in list

#### TC3.2: Delete Old Trade (>24hrs) ❌
**Note**: This test requires a trade older than 24 hours. You can:
- Option A: Wait 24 hours
- Option B: Manually update database (advanced)
- Option C: Have admin create old trade via SQL

1. If you have a trade >24 hours old:
2. Try to delete it
3. **Expected**: 
   - Error toast: "Trades can only be deleted within 24 hours of creation"
   - Trade NOT deleted
   - Remains in list

#### TC3.3: Admin Override (>24hrs) ✅
**Prerequisites**: Login as admin user

1. Find a trade >24 hours old
2. Click delete icon
3. Confirm deletion
4. **Expected**: 
   - Trade deleted successfully (admin bypass)
   - No 24-hour restriction for admins
   - Toast: "Trade deleted successfully"

---

## Test Scenario 4: Settings Page UI

### Test Cases

#### TC4.1: Profile Information Display ✅
1. Navigate to Settings page
2. Check "Profile Information" section
3. **Expected**: 
   - Name displays correctly
   - Email displays correctly
   - Role displays correctly (USER or ADMIN)
   - All fields are disabled (read-only)
   - Helper text: "Contact admin to update profile information"

#### TC4.2: Mobile Responsiveness ✅
1. Open Settings page
2. Resize browser to mobile width (375px)
3. **Expected**: 
   - Forms stack vertically
   - Buttons full-width on mobile
   - Input fields readable
   - Modal works on small screen
   - No horizontal scroll

#### TC4.3: Navigation Link ✅
1. From any user page
2. Look at navigation menu
3. **Expected**: "⚙️ Settings" link visible
4. Click Settings link
5. **Expected**: Navigates to /settings page

---

## API Endpoint Tests (Optional)

### Using Browser DevTools or Postman

#### Test 1: GET /api/users/me
```bash
# In browser console (after login)
fetch('/api/users/me')
  .then(r => r.json())
  .then(console.log)

# Expected Response:
{
  "success": true,
  "data": {
    "name": "Test User",
    "email": "test@example.com",
    "role": "USER"
  }
}
```

#### Test 2: PATCH /api/users/me/password
```bash
# In browser console
fetch('/api/users/me/password', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    currentPassword: 'OldPass123',
    newPassword: 'NewPass123',
    confirmPassword: 'NewPass123'
  })
})
  .then(r => r.json())
  .then(console.log)

# Expected Response:
{
  "success": true,
  "message": "Password updated successfully"
}
```

#### Test 3: GET /api/users/me/reset
```bash
# In browser console
fetch('/api/users/me/reset')
  .then(r => r.json())
  .then(console.log)

# Expected Response:
{
  "success": true,
  "data": {
    "totalTrades": 5,
    "totalSummaries": 3,
    "totalTargets": 1
  }
}
```

#### Test 4: POST /api/users/me/reset
```bash
# In browser console
fetch('/api/users/me/reset', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    confirmation: 'RESET MY ACCOUNT'
  })
})
  .then(r => r.json())
  .then(console.log)

# Expected Response:
{
  "success": true,
  "data": {
    "deletedTrades": 5,
    "deletedSummaries": 3,
    "deletedTargets": 1
  },
  "message": "Account reset successfully"
}
```

---

## Edge Cases to Test

### Edge Case 1: Concurrent Password Changes
1. Open Settings in two browser tabs
2. Change password in Tab 1
3. Try changing password in Tab 2 (use old current password)
4. **Expected**: Tab 2 should fail with "Current password is incorrect"

### Edge Case 2: Account Reset During Active Session
1. Have multiple tabs open (Dashboard, Trades, Settings)
2. Perform account reset in Settings tab
3. Navigate to other tabs
4. **Expected**: Other pages still work but show empty data

### Edge Case 3: Rapid Fire Deletions
1. Create 5 trades quickly
2. Try deleting all 5 in rapid succession
3. **Expected**: All deletions succeed, daily summary updates correctly

### Edge Case 4: Network Failure
1. Open browser DevTools
2. Go to Network tab → Throttling → Offline
3. Try changing password
4. **Expected**: Error toast or timeout message
5. Go back online
6. Try again
7. **Expected**: Works normally

---

## Bug Reporting Template

If you find any issues, please report using this format:

```
**Issue Title**: [Brief description]

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior**: [What should happen]

**Actual Behavior**: [What actually happens]

**Error Messages**: [Any console errors or toasts]

**Environment**:
- Browser: [Chrome/Firefox/Safari]
- OS: [Windows/Mac/Linux]
- Screen Size: [Desktop/Mobile/Tablet]

**Screenshot**: [If applicable]
```

---

## Success Criteria

Phase 3 is considered fully tested when:

- [ ] All password change test cases pass
- [ ] All account reset test cases pass
- [ ] 24-hour deletion window works for users
- [ ] Admin can override deletion window
- [ ] Settings page UI works on mobile and desktop
- [ ] All API endpoints return correct responses
- [ ] No console errors during normal usage
- [ ] Toast notifications appear correctly
- [ ] Form validation works client and server-side
- [ ] Database integrity maintained after operations
- [ ] No data loss for unintended operations
- [ ] Can login after password change
- [ ] Can login after account reset

---

## Post-Testing Actions

After successful testing:

1. **Mark Phase 3 as Complete** in project docs
2. **Update user documentation** with new features
3. **Plan Phase 4 implementation** (Monthly Analytics)
4. **Consider deployment** to staging environment
5. **Schedule demo** for stakeholders (if applicable)

---

**Testing Started**: [Date]  
**Testing Completed**: [Date]  
**Tested By**: [Name]  
**Test Result**: [PASS / FAIL / BLOCKED]  
**Notes**: [Any additional observations]

---

**Need Help?** Check the completion summary at `docs/PHASE-5B-3-COMPLETION.md`
