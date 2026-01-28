# Feature 5 - Phase 3 Admin UI Testing Guide

## Overview
This document provides step-by-step testing procedures for Phase 3 of Feature 5: SOP Details & Mobile Enhancement. Phase 3 focuses on the admin interface for managing SOP type details with rich text documentation.

**Testing Environment**: wekangtrading-staging database  
**Server URL**: http://localhost:3000  
**Test Date**: January 2026

---

## Pre-Testing Checklist

- [x] Database migrations applied (0004 & 0005)
- [x] sopDetailService.ts implemented
- [x] API endpoints updated (/api/admin/sop-types/[id])
- [x] TiptapEditor component created
- [x] TiptapReadOnly component created
- [x] Admin page updated with tabs and editors
- [x] Dev server running (port 3000)
- [ ] Admin user logged in
- [ ] Initial SOP types exist in database

---

## Test Case 1: Detail Status Column Display

**Objective**: Verify the "Detail Status" column shows correct icons and text based on enabled states.

### Steps:
1. Navigate to http://localhost:3000/admin/sop-types
2. Login as admin if not already logged in
3. Observe the "Detail Status" column in the SOP types table

### Expected Results:
| Enabled Short | Enabled Long | Icon/Text | Color |
|--------------|-------------|-----------|-------|
| ✅ true      | ✅ true     | ✅ Both   | green |
| ✅ true      | ❌ false    | 📉 Short  | blue  |
| ❌ false     | ✅ true     | 📈 Long   | purple|
| ❌ false     | ❌ false    | ⚠️ Draft  | gray  |

**Status**: [ ] Pass / [ ] Fail  
**Notes**: 

---

## Test Case 2: Edit Modal - Basic Info Tab

**Objective**: Verify basic info editing works correctly.

### Steps:
1. Click "Edit" button on any SOP type
2. Verify modal opens with "Basic Info" tab selected by default
3. Edit Name field (e.g., "Breakout v2")
4. Edit Short Description (e.g., "Price breaks key level")
5. Edit Sort Order (e.g., change to 5)
6. Click "💾 Save Changes"

### Expected Results:
- Modal opens with tabbed interface ✅
- Basic Info tab is active by default ✅
- All fields are pre-filled with current values ✅
- Changes save successfully ✅
- Success toast appears: "SOP type updated successfully" ✅
- Modal closes ✅
- Table refreshes with new data ✅

**Status**: [ ] Pass / [ ] Fail  
**Notes**: 

---

## Test Case 3: Edit Modal - Details Tab (SHORT Strategy)

**Objective**: Verify SHORT entry strategy editor works correctly.

### Steps:
1. Click "Edit" on an SOP type (e.g., "Breakout")
2. Click "Details & Formatting" tab
3. Observe the SHORT Entry Strategy section (📉 blue background)
4. Click "Insert Template" button in editor toolbar
5. Verify template structure appears:
   ```
   Setup Criteria
   • [Describe market conditions...]
   
   Entry Trigger
   • [Define exact entry signal...]
   
   Risk Management
   • Stop Loss: [...]
   • Take Profit: [...]
   
   Example Chart
   [Upload screenshot here]
   ```
6. Edit the content (replace placeholders with real strategy)
7. Test toolbar buttons:
   - Bold (Ctrl+B)
   - Italic (Ctrl+I)
   - Heading 2
   - Heading 3
   - Bullet List
   - Numbered List
   - Code Block
   - Link
8. Toggle "Show to users" switch to ON
9. Click "💾 Save Changes"

### Expected Results:
- Details tab displays SHORT section with blue background ✅
- Template insertion works ✅
- Rich text editing works (bold, italic, headings) ✅
- List formatting works ✅
- Code blocks render correctly ✅
- Links can be inserted ✅
- Switch toggle updates formData state ✅
- Save succeeds ✅
- Content persists after modal closes and reopens ✅

**Status**: [ ] Pass / [ ] Fail  
**Notes**: 

---

## Test Case 4: Edit Modal - Details Tab (LONG Strategy)

**Objective**: Verify LONG entry strategy editor works correctly.

### Steps:
1. Same SOP type from Test Case 3
2. In "Details & Formatting" tab, scroll to LONG Entry Strategy section (📈 purple background)
3. Insert template
4. Add different content than SHORT (e.g., bullish conditions)
5. Toggle "Show to users" switch to ON
6. Click "💾 Save Changes"

### Expected Results:
- LONG section displays with purple background ✅
- Template insertion works independently ✅
- Content saved separately from SHORT ✅
- Both SHORT and LONG can be enabled simultaneously ✅
- Detail Status column updates to "✅ Both" ✅

**Status**: [ ] Pass / [ ] Fail  
**Notes**: 

---

## Test Case 5: Image Upload Validation (< 500KB)

**Objective**: Verify image upload works for valid images.

### Steps:
1. Edit an SOP type → Details tab → SHORT strategy
2. Click "Upload Image" button in toolbar
3. Select a PNG/JPG image < 500KB
4. Verify image appears in editor
5. Click outside image, then click image again
6. Verify image can be resized (drag corners)
7. Save changes

### Expected Results:
- Image uploads successfully ✅
- Image displays in editor ✅
- Image is resizable ✅
- Image saved as base64 in database ✅
- After reopening modal, image displays correctly ✅

**Status**: [ ] Pass / [ ] Fail  
**Image Size Used**: ______ KB  
**Notes**: 

---

## Test Case 6: Image Upload Validation (> 500KB)

**Objective**: Verify large image rejection.

### Steps:
1. Edit an SOP type → Details tab → LONG strategy
2. Click "Upload Image" button
3. Select a PNG/JPG image > 500KB

### Expected Results:
- Error toast appears: "Image too large. Maximum size is 500KB" ✅
- Image does NOT appear in editor ✅
- User can retry with smaller image ✅

**Status**: [ ] Pass / [ ] Fail  
**Image Size Used**: ______ KB  
**Notes**: 

---

## Test Case 7: Mixed Enable States

**Objective**: Verify independent enable/disable toggles work correctly.

### Test Scenarios:

#### Scenario A: Only SHORT Enabled
1. Edit SOP type
2. Details tab → Enable SHORT only (LONG disabled)
3. Save changes
4. Verify Detail Status shows "📉 Short"

#### Scenario B: Only LONG Enabled
1. Edit same SOP type
2. Details tab → Disable SHORT, Enable LONG
3. Save changes
4. Verify Detail Status shows "📈 Long"

#### Scenario C: Both Enabled
1. Edit same SOP type
2. Enable both SHORT and LONG
3. Save changes
4. Verify Detail Status shows "✅ Both"

#### Scenario D: Both Disabled
1. Edit same SOP type
2. Disable both SHORT and LONG
3. Save changes
4. Verify Detail Status shows "⚠️ Draft"

**Status**: [ ] Pass / [ ] Fail  
**Notes**: 

---

## Test Case 8: Modal Tab Navigation

**Objective**: Verify tab switching preserves form state.

### Steps:
1. Edit SOP type
2. Basic Info tab → Change Name to "Test Name"
3. Switch to Details tab → Add content to SHORT
4. Switch back to Basic Info tab
5. Verify Name still shows "Test Name"
6. Switch to Details tab again
7. Verify SHORT content is preserved
8. Click Cancel (don't save)
9. Reopen same SOP type
10. Verify original values are unchanged

### Expected Results:
- Tab switching preserves unsaved changes in memory ✅
- Cancel button discards all changes ✅
- No accidental saves when switching tabs ✅
- Modal state resets on close ✅

**Status**: [ ] Pass / [ ] Fail  
**Notes**: 

---

## Test Case 9: API Error Handling

**Objective**: Verify error handling for various failure scenarios.

### Test Scenarios:

#### Scenario A: Duplicate Name
1. Edit SOP type → Change name to existing SOP name
2. Save changes

**Expected**: Error toast "Failed to update SOP type" (HTTP 400)

#### Scenario B: Image Too Large in API
1. Manually craft request with 600KB base64 image (bypass client validation)
2. Send PATCH request

**Expected**: Error toast "Image too large" (HTTP 400)

#### Scenario C: Unauthorized Access (if not admin)
1. Logout, login as regular user
2. Try to access /admin/sop-types

**Expected**: Redirect to /dashboard or 403 error

**Status**: [ ] Pass / [ ] Fail  
**Notes**: 

---

## Test Case 10: Mobile Responsiveness (Admin UI)

**Objective**: Verify admin interface works on mobile screens.

### Steps:
1. Open DevTools (F12) → Device Emulation
2. Set viewport to iPhone 14 (390px width)
3. Navigate to /admin/sop-types
4. Test table scrolling (horizontal scroll if needed)
5. Click Edit on an SOP type
6. Verify modal fits screen (no overflow)
7. Test tab navigation on mobile
8. Test editor toolbar on mobile
9. Test image upload on mobile

### Expected Results:
- Table scrolls horizontally on small screens ✅
- Modal is scrollable and responsive ✅
- Tabs are touch-friendly ✅
- Editor toolbar wraps correctly ✅
- Buttons are accessible (min 44px tap targets) ✅

**Status**: [ ] Pass / [ ] Fail  
**Viewport Used**: ______px  
**Notes**: 

---

## Test Case 11: Content Persistence

**Objective**: Verify content persists correctly in database.

### Steps:
1. Edit SOP type "Breakout"
2. Add SHORT strategy with complex content:
   - Bold/italic text
   - H2/H3 headings
   - Bullet lists
   - Code blocks
   - Image (< 500KB)
   - External link
3. Enable SHORT
4. Add LONG strategy with different content
5. Enable LONG
6. Save changes
7. Close modal
8. Reopen same SOP type
9. Switch to Details tab
10. Verify SHORT content matches exactly
11. Verify LONG content matches exactly
12. Verify both toggle switches are ON

### Expected Results:
- All rich text formatting preserved ✅
- Images display correctly ✅
- Links are clickable ✅
- Enable states saved correctly ✅
- No data loss on save/reopen ✅

**Status**: [ ] Pass / [ ] Fail  
**Notes**: 

---

## Test Case 12: Delete SOP Type (Existing Functionality)

**Objective**: Verify delete still works after Phase 3 changes.

### Steps:
1. Create a new SOP type "Test Delete"
2. Edit it → Add SHORT strategy → Enable
3. Save changes
4. Click Delete button on table row
5. Confirm deletion
6. Verify SOP type removed from table

### Expected Results:
- Delete button still works ✅
- Confirmation prompt appears ✅
- SOP type and detail content deleted from database ✅
- Table refreshes ✅

**Status**: [ ] Pass / [ ] Fail  
**Notes**: 

---

## Performance Testing

### Database Query Performance
1. Open browser DevTools → Network tab
2. Edit an SOP type with large SHORT/LONG content (multiple images)
3. Save changes
4. Measure:
   - API response time: ______ ms (target: < 500ms)
   - Payload size: ______ KB
   - Database update time: ______ ms

### Editor Performance
1. Load SOP type with 5-10 images in details
2. Open edit modal
3. Measure:
   - Modal load time: ______ ms (target: < 1000ms)
   - Editor render time: ______ ms
   - Image render time: ______ ms

**Status**: [ ] Pass / [ ] Fail  
**Notes**: 

---

## Browser Compatibility Testing

Test in multiple browsers:

- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

**Issues Found**: 

---

## Bug Log

| # | Description | Severity | Steps to Reproduce | Status | Fix |
|---|------------|----------|-------------------|--------|-----|
| 1 |            |          |                   |        |     |
| 2 |            |          |                   |        |     |
| 3 |            |          |                   |        |     |

**Severity Levels**:
- Critical: Blocks core functionality
- High: Major feature broken
- Medium: Minor issue, has workaround
- Low: Cosmetic or edge case

---

## Phase 3 Sign-Off

### Completion Criteria
- [ ] All 12 test cases pass
- [ ] No critical or high severity bugs
- [ ] Mobile responsive on 375px, 768px, 1024px
- [ ] Performance targets met (API < 500ms, Editor < 1000ms)
- [ ] Browser compatibility confirmed
- [ ] Code reviewed and no TypeScript errors

### Test Summary
- **Total Test Cases**: 12
- **Passed**: _____ / 12
- **Failed**: _____ / 12
- **Blocked**: _____ / 12

### Tester Sign-Off
**Tested By**: ________________________  
**Date**: ________________________  
**Status**: [ ] Approved / [ ] Rejected  

### Developer Notes
_(Any known issues, workarounds, or future improvements)_

---

## Next Steps After Phase 3

Once Phase 3 passes all tests, proceed to:

**Phase 4: User Strategy Page** (2-3 hours)
- Create /strategies page for end users
- Display enabled SOP strategies (SHORT/LONG)
- Use TiptapReadOnly component
- Add search/filter functionality
- Link from trade entry forms

**Phase 5: Mobile Responsiveness** (4-6 hours)
- Create useIsMobile() hook
- Update TradesList.tsx (card view on mobile)
- Update BulkTradeEntryForm (mobile input)
- Make charts responsive
- Test on real mobile devices

**Phase 6: Testing & Deployment** (2-3 hours)
- Full end-to-end testing
- Update CHANGELOG.md
- Deploy to staging
- Deploy to production

---

**Document Version**: 1.0  
**Last Updated**: January 2026  
**Related Documents**:
- `/docs/features/FEATURE-5-SOP-DETAILS-MOBILE.md`
- `/docs/06-PROGRESS-TRACKING.md`
- `/docs/TESTING-CHECKLIST.md`
