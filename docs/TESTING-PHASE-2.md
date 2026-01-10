# Phase 2 Testing Checklist - User Management & Trade Viewer

**Date**: January 10, 2026  
**Status**: Ready for Testing  
**URL**: http://localhost:3000  
**Test Credentials**: admin@wekangtradingjournal.com / admin123

---

## Pre-Testing Setup

- [x] Database migrated with invite_codes table
- [x] All API endpoints compiled successfully
- [x] Development server running on port 3000
- [x] Admin user available in database
- [x] Seed data (5 traders with 3 months data) loaded

---

## Feature 1: Invite Code System (Phase 1 - Already Tested)

### Admin: Create Invite Code
- [ ] Navigate to `/admin/invite-codes`
- [ ] Click "Create Invite Code" button
- [ ] Set max uses (e.g., 5)
- [ ] Set expiration date (optional)
- [ ] Submit form
- [ ] Verify code appears in table
- [ ] Click code to copy to clipboard
- [ ] Verify toast notification appears

### Admin: Deactivate Invite Code
- [ ] Find available code in table
- [ ] Click "Deactivate" button
- [ ] Verify status changes to "Inactive"
- [ ] Verify code cannot be used for registration

### User: Register with Invite Code
- [ ] Navigate to `/register`
- [ ] Fill in name, email, password
- [ ] Enter valid invite code
- [ ] Submit form
- [ ] Verify registration succeeds
- [ ] Verify redirect to dashboard
- [ ] Check invite code usage count incremented

### User: Register with Invalid Code
- [ ] Navigate to `/register`
- [ ] Fill in name, email, password
- [ ] Enter invalid/expired/maxed-out invite code
- [ ] Submit form
- [ ] Verify error message appears
- [ ] Verify registration fails

---

## Feature 2: Admin User Management (NEW - Phase 2)

### Admin: Create New User
- [ ] Navigate to `/admin/users`
- [ ] Click "Create User" button
- [ ] Fill in form:
  - Name: Test Trader
  - Email: test@example.com
  - Password: testpass123
  - Role: USER
- [ ] Submit form
- [ ] Verify success toast appears
- [ ] Verify new user appears in table
- [ ] Verify user stats show 0 trades

### Admin: Edit User Details
- [ ] Click "Edit" button on any user row
- [ ] Change name (e.g., "Updated Name")
- [ ] Change email (ensure unique)
- [ ] Change role (USER → ADMIN or vice versa)
- [ ] Submit form
- [ ] Verify success toast appears
- [ ] Verify changes reflected in table
- [ ] Refresh page to confirm persistence

### Admin: Reset User Password
- [ ] Click "Reset Password" button on any user row
- [ ] Click "Generate Password" button
- [ ] Verify temporary password displays (10 characters)
- [ ] Click "Copy Password" button
- [ ] Verify toast notification appears
- [ ] Close modal
- [ ] Try logging in as that user with temp password
- [ ] Verify login succeeds

### Admin: Delete User (Normal)
- [ ] Click "Delete" button on a non-admin user
- [ ] Review confirmation dialog showing:
  - Number of trades
  - Number of daily summaries
  - Number of targets
- [ ] Click "Delete User" button
- [ ] Verify success toast appears
- [ ] Verify user removed from table
- [ ] Verify related data cascaded (check database or try viewing deleted user's trades)

### Admin: Delete User (Self-Deletion Prevention)
- [ ] Click "Delete" button on your own admin account
- [ ] Click "Delete User" button
- [ ] Verify error message: "Cannot delete yourself"
- [ ] Verify deletion fails

### Admin: Delete Last Admin (Prevention)
- [ ] Ensure only 1 admin exists in system
- [ ] Try to delete that admin
- [ ] Click "Delete User" button
- [ ] Verify error message: "Cannot delete the last admin"
- [ ] Verify deletion fails

### Admin: Search Users
- [ ] Type user name in search box
- [ ] Verify filtered results show only matching names
- [ ] Clear search
- [ ] Type email in search box
- [ ] Verify filtered results show only matching emails

### Admin: Sort Users
- [ ] Click "Name" column header
- [ ] Verify sort order (ascending/descending)
- [ ] Click "Win Rate" column header
- [ ] Verify sort by win rate
- [ ] Click "Total Trades" column header
- [ ] Verify sort by trade count

---

## Feature 3: Admin Trade Viewer (NEW - Phase 2)

### Admin: View All Trades
- [ ] Navigate to `/admin/trades`
- [ ] Verify navigation link appears in admin menu
- [ ] Verify table loads with all trades from all users
- [ ] Verify columns display correctly:
  - User (name + email)
  - Date/Time (formatted)
  - Session (colored badge)
  - Result (WIN/LOSS badge)
  - SOP (✓ or ✗)
  - P&L (colored red/green)
  - Notes (truncated if long)
  - Actions (Delete button)

### Admin: Filter by User
- [ ] Select a user from "User" dropdown
- [ ] Verify only that user's trades display
- [ ] Change to another user
- [ ] Verify trades update
- [ ] Select "All Users"
- [ ] Verify all trades display again

### Admin: Filter by Result
- [ ] Select "Win" from "Result" dropdown
- [ ] Verify only WIN trades display
- [ ] Select "Loss"
- [ ] Verify only LOSS trades display
- [ ] Select "All Results"
- [ ] Verify all trades display

### Admin: Filter by Session
- [ ] Select "Asia" from "Session" dropdown
- [ ] Verify only ASIA session trades display
- [ ] Try each session (Europe, US, Overlap)
- [ ] Verify correct filtering
- [ ] Select "All Sessions"
- [ ] Verify all trades display

### Admin: Filter by Date Range
- [ ] Set "Date From" to 2 months ago
- [ ] Set "Date To" to today
- [ ] Verify only trades in that range display
- [ ] Clear date filters
- [ ] Verify all trades display

### Admin: Search Trades
- [ ] Type user name in search box
- [ ] Verify trades from that user appear
- [ ] Type partial email in search box
- [ ] Verify matching trades appear
- [ ] Type keyword from trade notes
- [ ] Verify trades with that keyword appear
- [ ] Clear search
- [ ] Verify all trades display

### Admin: Reset All Filters
- [ ] Apply multiple filters (user, result, date range)
- [ ] Click "Reset Filters" button
- [ ] Verify all filters cleared
- [ ] Verify all trades display

### Admin: Pagination
- [ ] If more than 50 trades, verify pagination controls appear
- [ ] Click "Next" button
- [ ] Verify page 2 loads
- [ ] Verify pagination info updates ("Showing X to Y of Z")
- [ ] Click "Previous" button
- [ ] Verify page 1 loads

### Admin: Delete Trade
- [ ] Click "Delete" button on any trade
- [ ] Review confirmation dialog showing:
  - User name
  - Date/time
  - Result
  - P&L
- [ ] Click "Delete Trade" button
- [ ] Verify success toast appears
- [ ] Verify trade removed from table
- [ ] Navigate to that user's dashboard
- [ ] Verify daily summary updated (total trades decreased)

---

## Integration Tests

### User Management + Invite Codes
- [ ] Create invite code with maxUses=1
- [ ] Use admin to create user (should NOT consume invite code)
- [ ] Register new user with invite code (should consume code)
- [ ] Verify invite code maxed out
- [ ] Verify both users appear in admin users table

### Trade Deletion + Daily Summary
- [ ] Note current daily summary stats for a user
- [ ] Delete one of their trades via admin trades page
- [ ] Navigate to user's dashboard
- [ ] Verify stats updated correctly:
  - Total trades decreased by 1
  - Win rate recalculated
  - Net P&L adjusted
  - Session counts updated

### User Deletion + Trade Cascading
- [ ] Create test user via admin
- [ ] Add some trades for that user
- [ ] Delete user via admin users page
- [ ] Navigate to admin trades page
- [ ] Search for deleted user
- [ ] Verify no trades appear (cascaded deletion)

---

## Edge Cases & Error Handling

### User Management
- [ ] Try to create user with existing email (should fail with error)
- [ ] Try to edit user to duplicate email (should fail)
- [ ] Try to create user with password < 8 chars (should fail)
- [ ] Try to create user with empty name (should fail)

### Trade Management
- [ ] Try to delete non-existent trade ID (should return 404)
- [ ] Try to access admin pages as regular user (should redirect)

### UI Responsiveness
- [ ] Test on mobile viewport (375px width)
- [ ] Verify tables scroll horizontally on mobile
- [ ] Verify modals display correctly on mobile
- [ ] Verify buttons are touch-friendly (min 44px)

---

## Performance Tests

- [ ] Load admin users page with all 5 users
  - Expected: < 200ms load time
- [ ] Load admin trades page with ~4,500 trades (3 months × 5 users × 30 trades/day)
  - Expected: < 500ms load time (paginated)
- [ ] Apply multiple filters on trades page
  - Expected: < 300ms filter response
- [ ] Delete trade and verify daily summary recalculation
  - Expected: < 500ms total operation time

---

## Security Tests

### Authentication
- [ ] Try to access `/admin/users` without login (should redirect to `/login`)
- [ ] Try to access `/admin/trades` without login (should redirect to `/login`)
- [ ] Login as USER role, try to access admin pages (should redirect to `/dashboard`)

### Authorization
- [ ] Try to call `POST /api/admin/users/create` as USER (should return 403)
- [ ] Try to call `DELETE /api/admin/trades/[id]` as USER (should return 403)

---

## Bug Report Template

If you find any issues, document them using this template:

```
**Bug Title**: [Brief description]
**Severity**: Critical / High / Medium / Low
**Steps to Reproduce**:
1. 
2. 
3. 

**Expected Result**: 
**Actual Result**: 
**Screenshots**: [If applicable]
**Console Errors**: [If any]
**Browser/Device**: 
```

---

## Sign-Off

Once all tests pass:
- [ ] Mark all checkboxes above as complete
- [ ] Document any bugs found
- [ ] Update CHANGELOG.md with Phase 2 completion
- [ ] Update RESUME.md with testing results
- [ ] Proceed to Phase 3 implementation

---

**Tester**: _________________  
**Date Tested**: _________________  
**Result**: Pass / Fail / Partial  
**Notes**: _________________

