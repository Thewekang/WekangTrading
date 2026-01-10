# Enhanced Features - Phase 5B Implementation Guide

**Date**: January 10, 2026  
**Status**: In Progress  
**Phase**: 5B - Security & User Management Enhancements

---

## Overview

This document outlines the new security and user management features being added to WekangTradingJournal to improve security, prevent spam, and provide better user management capabilities.

---

## Feature 1: Invite-Only Registration ✅ COMPLETED

### Purpose
Prevent spam registrations by requiring an invite code from admin.

### Database Changes
**New Table**: `invite_codes`
```prisma
model InviteCode {
  id          String    @id @default(uuid())
  code        String    @unique // 8-char code (e.g., "A1B2C3D4")
  createdBy   String    // Admin who created it
  maxUses     Int       @default(1)
  usedCount   Int       @default(0)
  expiresAt   DateTime? // Optional expiration
  active      Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  users       User[]    // Who registered with this code
}
```

**User Model Update**:
- Added `inviteCodeId` field (nullable)
- Relation to `InviteCode`

### API Endpoints
**Admin Endpoints** (require ADMIN role):
- `GET /api/admin/invite-codes` - List all codes with usage stats
- `POST /api/admin/invite-codes` - Create new code
- `DELETE /api/admin/invite-codes/[id]` - Deactivate/delete code

**Registration Update**:
- `POST /api/auth/register` - Now requires `inviteCode` field
- Validates code before allowing registration
- Increments `usedCount` on successful registration

### Service Layer
**File**: `lib/services/inviteCodeService.ts`

Functions:
- `createInviteCode()` - Generate unique 8-char code
- `validateInviteCode()` - Check if code is valid and available
- `useInviteCode()` - Mark code as used
- `getAllInviteCodes()` - List all codes (admin)
- `deactivateInviteCode()` - Disable code
- `deleteInviteCode()` - Permanent deletion

### UI Changes
**Registration Page** (`app/(auth)/register/page.tsx`):
- Added invite code input field
- Uppercase transformation
- Helper text: "Contact admin to get an invite code"

**Validation** (`lib/validations.ts`):
- Updated `registerSchema` to require 8-character invite code

### Status
✅ Database migration complete  
✅ Service layer implemented  
✅ API endpoints created  
✅ Registration updated  
✅ Admin UI page complete

---

## Feature 2: Admin User Management ✅ COMPLETED

### Purpose
Allow admins to create, edit, and delete user accounts directly.

### Service Layer
**File**: `lib/services/userManagementService.ts`

Functions:
- `createUserByAdmin()` - Create user without invite code
- `updateUserByAdmin()` - Update user details (name, email, role)
- `deleteUserByAdmin()` - Delete user (prevents self-deletion and last admin deletion)
- `resetUserPasswordByAdmin()` - Generate 10-char temporary password
- `getUserWithStats()` - Get user details with trade statistics

Business Rules:
- Admins cannot delete themselves
- Cannot delete the last admin
- Email must be unique
- Temporary passwords are random 10-character strings

### API Endpoints
**Admin Endpoints** (require ADMIN role):
- `POST /api/admin/users/create` - Create new user bypassing invite code
- `GET /api/admin/users/[id]` - Get user details with stats
- `PATCH /api/admin/users/[id]` - Update user (name, email, role)
- `DELETE /api/admin/users/[id]` - Delete user account
- `POST /api/admin/users/[id]/reset-password` - Generate temp password

### UI Pages
**Admin Users Page** (`app/(admin)/admin/users/page.tsx`):
- Enhanced with full CRUD capabilities:
  - "Create User" button with modal
  - Edit user modal (name, email, role)
  - Delete confirmation dialog
  - Reset password action with temp password display
  - Search and sort functionality preserved

**Features**:
- Create user modal with form (name, email, password, role)
- Edit user modal (update name, email, role)
- Delete confirmation dialog with data summary
- Reset password action with temp password display
- Copy to clipboard functionality
- Success/error toasts
- Search by name/email
- Sort by any column

### Business Rules
- Admin can create users without invite codes
- Admin can change user roles (USER ↔ ADMIN)
- Deleting user cascades to trades, summaries, targets
- Cannot delete self (prevent lockout)
- Cannot delete last admin (minimum 1 admin required)
- Email uniqueness enforced

### Status
✅ Service layer implemented  
✅ API endpoints created  
✅ Admin users page enhanced  
✅ Build successful  
✅ Ready for testing

---

## Feature 3: Admin Trade Viewer with Delete ✅ COMPLETED

### Purpose
Allow admin to view all trades across all users and delete erroneous entries.

### Service Layer
Uses existing `individualTradeService` with admin override.

### API Endpoints
**Admin Endpoints** (require ADMIN role):
- `GET /api/admin/trades` - List all trades with pagination and filters
  - Query params: `userId`, `dateFrom`, `dateTo`, `result`, `session`, `search`, `page`, `pageSize`
  - Returns: Trades array with user details, pagination metadata
- `DELETE /api/admin/trades/[id]` - Delete any trade (admin override)
  - Automatically updates daily summary

### UI Page
**File**: `app/(admin)/admin/trades/page.tsx`

**Features**:
- Table showing all trades from all users
- Columns: User (name + email), Date/Time, Session, Result, SOP, P&L, Notes, Actions
- Filters: 
  - User dropdown (all users)
  - Result (WIN/LOSS)
  - Session (ASIA/EUROPE/US/OVERLAP)
  - Date range (from/to)
  - Search query (searches name, email, notes)
- Reset filters button
- Delete action with confirmation modal
- Pagination (50 per page)
- Responsive design

**Use Cases**:
- Find duplicate entries
- Remove test data
- Correct mistakes across team
- Investigate specific trading patterns

### Navigation
- Added "Trades" link to admin navigation menu
- Located between "Users" and "Invite Codes"

### Status
✅ Service layer ready  
✅ API endpoints created  
✅ Admin trades page implemented  
✅ Navigation updated  
✅ Build successful  
✅ Ready for testing

---

## Feature 4: User Password Change ✅ COMPLETED

### Purpose
Allow users to change their own password securely.

### Service Layer
**File**: `lib/services/userSettingsService.ts`

Functions:
- `changeUserPassword()` - Change password with verification

### API Endpoint
- `PATCH /api/users/me/password`
  - Requires current password verification
  - Validates new password strength (min 8 chars)
  - Checks new password is different from current
  - Updates password hash

### UI Page
**User Settings Page** (`app/(user)/settings/page.tsx`):

**Sections**:
1. **Profile Information**
   - Name (read-only, contact admin to change)
   - Email (read-only, contact admin to change)
   - Role display

2. **Change Password**
   - Current password field
   - New password field (min 8 chars)
   - Confirm new password field
   - Submit button with loading state

### Validation
- Current password must match
- New password: min 8 chars, must be different from current
- Confirm password must match new password

### Status
✅ Service layer implemented  
✅ API endpoint created  
✅ Settings page complete  
✅ Navigation updated  
✅ Build successful

---

## Feature 5: User Account Reset ✅ COMPLETED

### Purpose
Allow users to change their own password securely.

### API Endpoint (TO IMPLEMENT)
- `PATCH /api/users/me/password`
  - Requires current password verification
  - Validates new password strength
  - Updates password hash

### UI Page (TO IMPLEMENT)
**User Settings Page** (`app/(user)/settings/page.tsx`):

**Sections**:
1. **Profile Information**
   - Name (read-only for now)
   - Email (read-only for now)

2. **Change Password**
   - Current password field
   - New password field
   - Confirm new password field
   - Submit button

3. **Account Actions**
   - Reset account button (see Feature 5)

### Validation
- Current password must match
- New password: min 8 chars, must be different from current
- Confirm password must match new password

---

## Feature 5: User Account Reset ✅ COMPLETED

### Purpose
Allow user to completely reset their trading data (fresh start).

### Service Layer
**File**: `lib/services/userSettingsService.ts`

Functions:
- `resetUserAccount()` - Delete all trading data in transaction
- `getUserAccountSummary()` - Get counts for confirmation

### API Endpoints
- `GET /api/users/me/reset` - Get account summary before reset
- `POST /api/users/me/reset` - Reset account
  - Deletes all trades
  - Deletes all daily summaries
  - Deletes all targets
  - Keeps user account and login credentials

### UI Implementation
**Location**: User Settings Page

**Danger Zone Section**:
- Big red "Reset My Account" button
- Opens confirmation modal with data summary
- Requires typing "RESET MY ACCOUNT" to confirm
- Shows warning about permanent data loss

**Confirmation Modal**:
- ⚠️ WARNING header
- Lists items to be deleted (with counts)
- Text input requiring exact confirmation phrase
- Disabled submit until phrase matches
- Cancel button

### Business Rules
- User can only reset their own account
- Confirmation phrase required: "RESET MY ACCOUNT"
- Cannot be undone
- Uses database transaction for atomicity
- Page reloads after reset to show empty state

### Status
✅ Service layer implemented  
✅ API endpoints created  
✅ Confirmation modal complete  
✅ Build successful

---

## Feature 6: 24-Hour Trade Deletion Window ✅ COMPLETED

### Purpose
Allow user to completely reset their trading data (fresh start).

### API Endpoint (TO IMPLEMENT)
- `POST /api/users/me/reset`
  - Deletes all trades
  - Deletes all daily summaries
  - Deletes all targets
  - Keeps user account and login credentials

### UI Implementation
**Location**: User Settings Page

**Reset Button**:
- Big red button
- Opens confirmation modal
- Requires typing "RESET MY ACCOUNT" to confirm
- Shows warning about permanent data loss

**Confirmation Modal**:
```
⚠️ WARNING: This action cannot be undone!

This will permanently delete:
- All your trades (XXX total)
- All daily summaries
- All performance targets

Your account and login will remain active.

Type "RESET MY ACCOUNT" to confirm:
[________________]

[Cancel] [Reset Account]
```

### Business Rules
- User can only reset their own account
- Admin reset is separate (via user management)
- Cannot be undone
- Triggers immediate recalculation (should be zero)

---

## Feature 6: 24-Hour Trade Deletion Window ✅ COMPLETED

### Purpose
Allow users to delete their own trades within 24 hours, prevent accidental permanent deletions.

### Implementation
**Updated Service**: `lib/services/individualTradeService.ts`

Modified `deleteTrade()` function:
- Added `isAdmin` parameter (default: false)
- Checks trade age before deletion
- Throws error if > 24 hours for regular users
- Admins bypass the window check

### Logic
```typescript
const hoursSinceCreation = (Date.now() - trade.createdAt.getTime()) / (1000 * 60 * 60);

if (!isAdmin && hoursSinceCreation > 24) {
  throw new Error('Trades can only be deleted within 24 hours of creation');
}
```

### API Endpoint
**Updated**: `DELETE /api/trades/individual/[id]`

**Current Behavior**: Users can only delete trades within 24 hours  
**Admin Override**: Admins can delete any trade via `/api/admin/trades/[id]`

### Error Handling
- Returns 403 Forbidden if deletion window expired
- Error message: "Trades can only be deleted within 24 hours of creation. Contact admin for assistance."

### UI Updates
**Note**: Trade list UI can be enhanced in future to:
- Show delete button only if trade age < 24 hours
- Gray out delete button with tooltip if > 24 hours
- Tooltip: "Can only delete trades within 24 hours. Contact admin."

### Status
✅ Service layer updated  
✅ 24-hour window enforced  
✅ Admin override available  
✅ Build successful

---

## Feature 7: Monthly Analytics Chart (PLANNED)

### Purpose
Allow users to delete their own trades within 24 hours, prevent accidental permanent deletions.

### Implementation
**Update Existing Delete Endpoint**:
`DELETE /api/trades/individual/[id]`

**Current Behavior**: Anyone can delete any of their own trades  
**New Behavior**: Can only delete trades created within last 24 hours

### Logic
```typescript
const trade = await prisma.individualTrade.findUnique({
  where: { id, userId: session.user.id }
});

const hoursSinceCreation = (Date.now() - trade.createdAt.getTime()) / (1000 * 60 * 60);

if (hoursSinceCreation > 24) {
  return NextResponse.json(
    { success: false, error: { 
      code: 'DELETE_WINDOW_EXPIRED',
      message: 'Trades can only be deleted within 24 hours of creation'
    }},
    { status: 403 }
  );
}
```

### UI Updates
**Trade List Page** (`app/(user)/trades/page.tsx`):
- Delete button only shown if trade age < 24 hours
- Grayed out delete button with tooltip if > 24 hours
- Tooltip: "Can only delete trades within 24 hours"

**Alternative for Old Trades**:
- Show "Request Deletion" button
- Opens contact admin form
- Admin can delete via Feature 3

---

## Feature 7: Monthly Analytics Chart (PLANNED)

### Purpose
Show monthly performance trends for current year with selectable metrics.

### API Endpoint (TO IMPLEMENT)
- `GET /api/stats/monthly?metric=winRate&year=2026`
  - Returns monthly aggregates for specified year
  - Metrics: `winRate`, `sopRate`, `profitLoss`, `totalTrades`

### UI Implementation
**Location**: `app/(user)/analytics/trends/page.tsx` (enhance existing page)

**New Section**: "Monthly Performance (Current Year)"

**Features**:
- Bar chart showing 12 months (Jan-Dec)
- Dropdown to select metric:
  - Win Rate (%)
  - SOP Rate (%)
  - Profit/Loss ($)
  - Total Trades (#)
- Highlights current month
- Shows year-to-date average line
- Responsive design

**Chart Library**: Recharts (already in use)

**Data Structure**:
```typescript
[
  { month: 'Jan', value: 65.5, label: '65.5%' },
  { month: 'Feb', value: 58.2, label: '58.2%' },
  // ... for each month
]
```

---

## Implementation Order (Phased Approach)

### ✅ Phase 1A: Invite Code Backend (COMPLETED)
- [x] Database schema
- [x] Migration
- [x] Service layer
- [x] API endpoints
- [x] Registration update
- [x] Validation update

### ⏳ Phase 1B: Invite Code UI (IN PROGRESS)
- [ ] Admin page to manage invite codes
- [ ] Create code modal
- [ ] List codes with usage stats
- [ ] Deactivate/delete actions

### Phase 2: Critical Admin Features
- [ ] Admin user CRUD UI
- [ ] Admin trades viewer
- [ ] User management service enhancements

### Phase 3: User Self-Service
- [ ] Settings page layout
- [ ] Password change form
- [ ] Account reset with confirmation
- [ ] 24-hour deletion window

### Phase 4: Analytics Enhancement
- [ ] Monthly data aggregation endpoint
- [ ] Bar chart component
- [ ] Metric selector
- [ ] Integration into analytics page

---

## Security Considerations

### Invite Codes
- ✅ Unique 8-character codes (collision-resistant)
- ✅ Optional expiration dates
- ✅ Usage limits (prevent abuse)
- ✅ Admin-only creation
- ✅ Cannot reuse fully-used codes

### Password Changes
- ⏳ Requires current password verification
- ⏳ Password strength validation
- ⏳ Hash with bcrypt
- ⏳ Invalidate sessions after change (optional)

### Account Deletion
- ⏳ Requires explicit confirmation
- ⏳ Type-to-confirm for reset
- ⏳ Cascade rules properly set in Prisma
- ⏳ Cannot delete last admin

### Trade Deletion
- ⏳ 24-hour window prevents historical tampering
- ⏳ Users can only delete own trades
- ⏳ Admin can delete any trade (audit log future enhancement)

---

## Testing Checklist

### Invite Codes
- [ ] Admin can create code
- [ ] Code is unique (8 chars, uppercase)
- [ ] Registration requires valid code
- [ ] Invalid code shows error
- [ ] Expired code rejected
- [ ] Fully-used code rejected
- [ ] Code usage increments correctly
- [ ] Admin can deactivate code
- [ ] Admin can delete unused code

### User Management (Future)
- [ ] Admin can create user
- [ ] Admin can edit user details
- [ ] Admin can change user role
- [ ] Admin can delete user
- [ ] Cannot delete self
- [ ] Cascade deletion works
- [ ] Cannot delete last admin

### Password Change (Future)
- [ ] Current password validation
- [ ] New password strength check
- [ ] Passwords don't match error
- [ ] Success updates hash
- [ ] Can login with new password
- [ ] Old password doesn't work

### Account Reset (Future)
- [ ] Confirmation required
- [ ] All trades deleted
- [ ] All summaries deleted
- [ ] All targets deleted
- [ ] User account remains
- [ ] Can still login

### 24-Hour Deletion (Future)
- [ ] Can delete new trade (< 24hrs)
- [ ] Cannot delete old trade (> 24hrs)
- [ ] Button disabled for old trades
- [ ] Error message shown
- [ ] Tooltip displays correctly

### Monthly Analytics (Future)
- [ ] Chart loads for current year
- [ ] All 12 months displayed
- [ ] Metric selector works
- [ ] Data matches calculations
- [ ] Responsive on mobile
- [ ] Empty months show zero

---

## Migration Path

### Current Users (Post-Deployment)
1. **Existing users**: Not affected, can continue trading
2. **New registrations**: Will require invite code
3. **Admin creates codes**: Use admin panel to generate codes for new traders
4. **Share codes**: Admin sends codes via email/message

### Data Migration
No data migration needed - all changes are additive:
- New `invite_codes` table (starts empty)
- New `inviteCodeId` field in users (nullable, defaults to null for existing users)

---

## Future Enhancements (Post-Phase 5B)

1. **Email Invite Links**: Generate unique URLs instead of codes
2. **Bulk Code Generation**: Create 10 codes at once
3. **Code Analytics**: Track which codes bring best performers
4. **Audit Log**: Track all admin actions (user edits, trade deletions)
5. **Self-Service Email Change**: With verification
6. **Export Account Data**: GDPR compliance
7. **2FA Authentication**: Time-based one-time passwords

---

**Last Updated**: January 10, 2026  
**Next Review**: After Phase 1B completion
