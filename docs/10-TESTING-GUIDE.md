# Testing Guide

**Document Version**: 1.0  
**Last Updated**: January 12, 2026  
**Status**: ✅ Production (v0.4.0)

---

## Table of Contents

1. [Overview](#overview)
2. [Testing Philosophy](#testing-philosophy)
3. [Manual Testing Procedures](#manual-testing-procedures)
4. [API Testing](#api-testing)
5. [Production Validation](#production-validation)
6. [Automated Testing (Future)](#automated-testing-future)

---

## Overview

This guide covers testing procedures for WekangTradingJournal, focusing on manual testing workflows that ensure quality before production deployment.

### Testing Scope

- ✅ **Manual Testing**: UI/UX, user flows, edge cases
- ✅ **API Testing**: Endpoint validation, error handling
- ✅ **Production Validation**: Post-deployment checks
- ⏳ **Automated Testing**: Unit/integration tests (planned)

---

## Testing Philosophy

### Quality Standards

1. **User Experience First**: All features must work smoothly
2. **Error Handling**: Graceful failures with helpful messages
3. **Loading States**: Clear feedback during async operations
4. **Empty States**: Helpful guidance when no data exists
5. **Mobile Responsive**: Works on all screen sizes
6. **Data Integrity**: No silent failures or data loss

### Testing Principles

- **Test Early, Test Often**: Validate during development
- **Real User Scenarios**: Think like the end user
- **Edge Cases Matter**: Test boundary conditions
- **Document Failures**: Track issues for future prevention
- **Regression Testing**: Re-test fixed bugs

---

## Manual Testing Procedures

### Pre-Test Setup

```bash
# Start development server
npm run dev

# Open browser
http://localhost:3000

# Open DevTools
F12 (or Cmd+Option+I on Mac)

# Check:
✓ Console tab (for errors)
✓ Network tab (for failed requests)
✓ Application tab (for localStorage/sessions)
```

### Test Scenarios

#### 1. Authentication & Authorization

**Login Flow**:
- [ ] Navigate to `/login`
- [ ] Enter invalid credentials → See error message
- [ ] Enter valid USER credentials → Redirects to `/dashboard`
- [ ] Enter valid ADMIN credentials → Redirects to `/admin/overview`
- [ ] Logout → Redirects to `/login`

**Protected Routes**:
- [ ] Access `/dashboard` without login → Redirects to `/login`
- [ ] USER tries to access `/admin` → Redirects to `/dashboard` (403)
- [ ] ADMIN tries to access `/trades` → Redirects to `/admin/overview`

**Session Persistence**:
- [ ] Login and close browser
- [ ] Reopen browser → Still logged in
- [ ] Session expires after configured time

**Result**: ⬜ Pass | ⬜ Fail | **Notes**: _______________

---

#### 2. Trade Entry & Management

**Real-Time Entry** (`/trades/new`):
- [ ] Submit with empty fields → See validation errors
- [ ] Submit with future timestamp → See error
- [ ] Submit valid trade → Success toast + redirect to list
- [ ] Check trade appears in list with correct session type
- [ ] Verify daily summary updated

**Bulk Entry** (`/trades/bulk`):
- [ ] Add 5 rows, fill partial data → See validation errors
- [ ] Add duplicate timestamps → See error
- [ ] Submit 10 valid trades → Success + redirect
- [ ] Verify all 10 trades appear in list
- [ ] Check daily summary aggregated correctly

**Trade List** (`/trades`):
- [ ] View paginated list (default 50 per page)
- [ ] Change page size to 10/25/100 → Saves to localStorage
- [ ] Apply filters (date, result, session) → See filtered results
- [ ] Search by notes → See matching trades
- [ ] Clear filters → See all trades
- [ ] Click trade row → Navigate to detail view

**Trade Edit**:
- [ ] Edit trade timestamp → Session type recalculates
- [ ] Change result WIN → LOSS → Daily summary updates
- [ ] Update profit/loss → Summary totals update
- [ ] Save changes → See success toast

**Trade Delete**:
- [ ] Delete trade → Confirmation modal
- [ ] Confirm delete → Trade removed + summary updated
- [ ] Cancel delete → Trade remains

**Result**: ⬜ Pass | ⬜ Fail | **Notes**: _______________

---

#### 3. Target Management

**Create Target** (`/targets`):
- [ ] Click "New Target" button
- [ ] Fill all required fields
- [ ] Submit with invalid data → See validation errors
- [ ] Submit valid PROP_FIRM target → Created successfully
- [ ] Submit valid PERSONAL target → Created successfully
- [ ] Verify end date calculated correctly (start + type)

**Target Status Calculation**:
- [ ] Create PROP_FIRM target with deadline tomorrow
- [ ] Meet target goals → Status = ACHIEVED
- [ ] Don't meet goals by deadline → Status = FAILED
- [ ] Create PERSONAL target
- [ ] Progress ahead of pace → Status = ON_TRACK
- [ ] Fall behind pace → Status = OFF_TRACK

**Target List View**:
- [ ] View all targets (active + inactive)
- [ ] See correct status badges
- [ ] See category icons (🏢 PROP_FIRM, 👤 PERSONAL)
- [ ] See progress bars
- [ ] Days remaining countdown accurate

**Target Actions**:
- [ ] Edit target name → Saves successfully
- [ ] Deactivate target → Status changes
- [ ] Delete target → Confirmation + removal

**Result**: ⬜ Pass | ⬜ Fail | **Notes**: _______________

---

#### 4. Dashboard & Analytics

**Dashboard Statistics** (`/dashboard`):
- [ ] View stat cards (trades, win rate, SOP, P&L)
- [ ] Stats update after new trade
- [ ] Charts load correctly (Recharts)
- [ ] Session comparison chart shows all sessions
- [ ] Hourly heatmap displays correctly

**Performance Trends** (`/analytics/trends`):
- [ ] MA7/MA30 charts display
- [ ] Trend indicators show correctly (↑↓→)
- [ ] Filter by date range → Charts update

**Session Analysis** (`/analytics/sessions`):
- [ ] View session breakdown (ASIA, EUROPE, US, overlaps)
- [ ] Win/loss counts per session
- [ ] Best session highlighted

**Result**: ⬜ Pass | ⬜ Fail | **Notes**: _______________

---

#### 5. Admin Features

**Admin Dashboard** (`/admin/overview`):
- [ ] View system statistics (7 cards)
- [ ] Top 5 performers table with medals
- [ ] Recent activity table
- [ ] User comparison charts (win rate, SOP, P&L)

**User Management** (`/admin/users`):
- [ ] Search users by name/email
- [ ] Sort by any column (click header)
- [ ] View user stats
- [ ] Delete user → Confirmation required
- [ ] Reset user data → Confirmation required

**SOP Types** (`/admin/sop-types`):
- [ ] Create new SOP type
- [ ] Edit SOP type
- [ ] Toggle active/inactive
- [ ] Delete unused SOP type
- [ ] Cannot delete if in use

**Result**: ⬜ Pass | ⬜ Fail | **Notes**: _______________

---

#### 6. Error Handling & UX Polish

**Loading States**:
- [ ] Dashboard shows skeleton while loading
- [ ] Trades list shows loading overlay during filter
- [ ] Form buttons show "Loading..." during submit
- [ ] Charts show loading indicator

**Empty States**:
- [ ] Dashboard with no trades → Helpful empty state
- [ ] Trades list with no results → Clear message
- [ ] Targets with no active targets → CTA buttons
- [ ] Admin users with no users → Guidance message

**Error Handling**:
- [ ] Network error → Toast notification
- [ ] API 500 error → "Something went wrong" message
- [ ] Validation error → Field-specific error messages
- [ ] Session expired → Redirect to login

**Toast Notifications** (Sonner):
- [ ] Success toasts (green) for successful operations
- [ ] Error toasts (red) for failures
- [ ] Toasts auto-dismiss after 3 seconds
- [ ] Toasts stack properly (no overlap)

**Result**: ⬜ Pass | ⬜ Fail | **Notes**: _______________

---

#### 7. Mobile Responsiveness

**Test on Mobile Viewport** (375px width):
- [ ] Login page fits screen
- [ ] Dashboard cards stack vertically
- [ ] Trades table scrolls horizontally
- [ ] Forms are touch-friendly (min 44px targets)
- [ ] Navigation menu works (hamburger)
- [ ] Modals fit screen
- [ ] Charts resize correctly

**Touch Interactions**:
- [ ] Buttons respond to tap
- [ ] Dropdowns open correctly
- [ ] Date pickers work on mobile
- [ ] No double-tap zoom issues

**Result**: ⬜ Pass | ⬜ Fail | **Notes**: _______________

---

## API Testing

### Testing Tools

```bash
# Using curl
curl -X GET http://localhost:3000/api/stats/personal \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"

# Using Postman/Insomnia
# Import API spec from docs/04-API-SPECIFICATION.md
```

### Endpoint Tests

#### Authentication Endpoints

**POST `/api/auth/register`**:
```bash
# Valid registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","password":"password123"}'
# Expected: 201, user object

# Duplicate email
curl -X POST ... -d '{"email":"existing@example.com",...}'
# Expected: 400, "Email already exists"

# Invalid email
curl -X POST ... -d '{"email":"invalid",...}'
# Expected: 400, validation error
```

**POST `/api/auth/login`**:
```bash
# Valid login
# Expected: 200, session cookie set

# Invalid credentials
# Expected: 401, "Invalid credentials"
```

#### Trade Endpoints

**POST `/api/trades/individual`**:
```bash
# Valid trade
curl -X POST http://localhost:3000/api/trades/individual \
  -H "Cookie: ..." \
  -H "Content-Type: application/json" \
  -d '{"tradeTimestamp":"2026-01-12T10:30:00Z","result":"WIN","sopFollowed":true,"profitLossUsd":125.50}'
# Expected: 201, trade object with auto-calculated session

# Future timestamp
curl -X POST ... -d '{"tradeTimestamp":"2027-01-01T00:00:00Z",...}'
# Expected: 400, "Trade timestamp cannot be in the future"

# Unauthorized
curl -X POST ... (no cookie)
# Expected: 401, "Not authenticated"
```

**GET `/api/trades/individual`**:
```bash
# Get paginated trades
curl "http://localhost:3000/api/trades/individual?page=1&pageSize=50"
# Expected: 200, trades array with pagination metadata

# Filter by session
curl "http://localhost:3000/api/trades/individual?session=ASIA"
# Expected: 200, filtered trades
```

#### Target Endpoints

**POST `/api/targets`**:
```bash
# Valid target
curl -X POST http://localhost:3000/api/targets \
  -H "Cookie: ..." \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Target","targetCategory":"PERSONAL","targetType":"MONTHLY","targetWinRate":65,"targetSopRate":80,"startDate":"2026-01-01T00:00:00Z"}'
# Expected: 201, target object with auto-calculated endDate

# Missing required fields
curl -X POST ... -d '{"name":"Test"}'
# Expected: 400, validation errors
```

**GET `/api/targets`**:
```bash
# Get all targets
curl "http://localhost:3000/api/targets"
# Expected: 200, targets with currentStats and status

# Filter active only
curl "http://localhost:3000/api/targets?active=true"
# Expected: 200, active targets only
```

#### Admin Endpoints

**GET `/api/admin/stats`**:
```bash
# As admin
curl "http://localhost:3000/api/admin/stats" -H "Cookie: ADMIN_TOKEN"
# Expected: 200, system statistics

# As user
curl "http://localhost:3000/api/admin/stats" -H "Cookie: USER_TOKEN"
# Expected: 403, "Admin access required"
```

### API Test Checklist

- [ ] All GET endpoints return 200 for valid requests
- [ ] All POST endpoints return 201 for successful creation
- [ ] PATCH/DELETE return 200 for successful operations
- [ ] 400 responses include validation error details
- [ ] 401 responses for unauthenticated requests
- [ ] 403 responses for unauthorized requests (role mismatch)
- [ ] 500 responses include generic error message (no stack traces)
- [ ] All responses follow standard format (`{success, data/error}`)

---

## Production Validation

### Post-Deployment Checklist

After deploying to Vercel:

**1. Verify Deployment**:
- [ ] Access https://wekangtrading.vercel.app
- [ ] Check version number (footer or about page)
- [ ] Verify environment (should say "production")

**2. Database Connection**:
- [ ] Login as existing user → Success
- [ ] View dashboard → Data loads
- [ ] Create test trade → Saves successfully
- [ ] Check Turso dashboard → Data persists

**3. Critical User Flows**:
- [ ] Registration → Login → Dashboard → Trade Entry → View Trades
- [ ] Target creation → Progress tracking → Status updates
- [ ] Admin login → View users → View statistics

**4. Performance**:
- [ ] Dashboard loads < 2 seconds
- [ ] API responses < 500ms
- [ ] No console errors
- [ ] No 404 errors (check Network tab)

**5. Mobile Testing**:
- [ ] Test on real mobile device
- [ ] iOS Safari + Android Chrome
- [ ] All features work on mobile

**6. Cross-Browser**:
- [ ] Chrome (primary)
- [ ] Firefox
- [ ] Safari
- [ ] Edge

**7. Monitoring**:
- [ ] Check Vercel logs for errors
- [ ] Monitor Turso database usage
- [ ] Verify no rate limit issues

---

## Automated Testing (Future)

### Planned Testing Strategy

**Unit Tests** (Vitest):
```typescript
// lib/utils/marketSessions.test.ts
describe('calculateMarketSession', () => {
  it('returns ASIA for UTC hour 0-6', () => {
    const date = new Date('2026-01-12T03:00:00Z');
    expect(calculateMarketSession(date)).toBe('ASIA');
  });
  
  it('returns ASIA_EUROPE_OVERLAP for UTC hour 7-8', () => {
    const date = new Date('2026-01-12T07:30:00Z');
    expect(calculateMarketSession(date)).toBe('ASIA_EUROPE_OVERLAP');
  });
});
```

**Integration Tests** (Playwright):
```typescript
// tests/e2e/trade-entry.spec.ts
test('user can create a trade', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.fill('[name=email]', 'test@example.com');
  await page.fill('[name=password]', 'password');
  await page.click('button[type=submit]');
  
  await page.goto('/trades/new');
  await page.fill('[name=tradeTimestamp]', '2026-01-12T10:30');
  await page.click('[value=WIN]');
  await page.click('[name=sopFollowed]');
  await page.fill('[name=profitLossUsd]', '125.50');
  await page.click('button[type=submit]');
  
  await expect(page).toHaveURL('/trades');
  await expect(page.locator('text=$125.50')).toBeVisible();
});
```

**API Tests** (Supertest):
```typescript
// tests/api/trades.test.ts
describe('POST /api/trades/individual', () => {
  it('creates a trade with valid data', async () => {
    const response = await request(app)
      .post('/api/trades/individual')
      .set('Cookie', sessionCookie)
      .send({
        tradeTimestamp: '2026-01-12T10:30:00Z',
        result: 'WIN',
        sopFollowed: true,
        profitLossUsd: 125.50
      });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.marketSession).toBe('US');
  });
});
```

---

## Test Result Template

```markdown
## Test Execution Report

**Date**: _____________  
**Tester**: _____________  
**Version**: _____________  
**Environment**: [ ] Local | [ ] Staging | [ ] Production

### Summary

- Total Tests: ___
- Passed: ___
- Failed: ___
- Blocked: ___

### Failed Tests

| Test Case | Expected | Actual | Severity | Notes |
|-----------|----------|--------|----------|-------|
| Trade entry validation | Error message | Silent fail | High | Fix validation |
| Dashboard loading | <2s | 5s | Medium | Optimize query |

### Blockers

- Database connection timeout on staging
- API rate limit exceeded

### Sign-Off

- [ ] All critical tests passed
- [ ] No blockers remaining
- [ ] Ready for deployment

**Approved By**: _____________  
**Date**: _____________
```

---

## Related Documentation

- [API Specification](04-API-SPECIFICATION.md)
- [Database Schema](03-DATABASE-SCHEMA.md)
- [Deployment Guide](../deployment/DEPLOYMENT-GUIDE.md)
- [Production Checklist](../deployment/PRODUCTION-CHECKLIST.md)

---

**Last Updated**: January 12, 2026  
**Version**: 1.0  
**Status**: ✅ Production
