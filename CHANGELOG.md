# Changelog - WekangTradingJournal

All notable changes to this project will be documented in this file.

## [0.3.0] - 2026-01-10

### Phase 5B (Phases 1-3) Complete - Security & User Management ✅

#### Enhancement: Reset Count Tracking
- **Database Schema**
  - Added `resetCount` field to `users` table (default: 0)
  - Migration: `20260110042500_add_reset_count_to_users`

- **Admin Users Page Enhancement**
  - New "Resets" column showing how many times user has reset account
  - Color-coded display: gray (0x), orange (1x+)
  - Sortable by reset count (ascending/descending)
  - Right-aligned with other numeric metrics

- **Service Layer Update**
  - `resetUserAccount()` now increments resetCount in transaction
  - Ensures atomic operation (deletion + count increment)
  - No partial updates possible

- **API Update**
  - `GET /api/admin/users` includes resetCount in response
  - Format: `{ userId, userName, ..., resetCount: 2 }`

- **Use Cases**
  - Monitor user behavior and identify users needing coaching
  - Track reset feature usage patterns
  - Data quality assurance during troubleshooting
  - Performance analysis correlation

#### Phase 1: Invite-Only Registration ✅
- **Database Schema**
  - Added `invite_codes` table with unique 8-character codes
  - Added `inviteCodeId` field to `users` table
  - Migration: `20260110024702_add_invite_codes`

- **Invite Code Service** (`lib/services/inviteCodeService.ts`)
  - Generate unique invite codes (8 chars, alphanumeric)
  - Validate codes (active status, expiration, usage limits)
  - Track usage counts and related users
  - Deactivate and delete operations

- **API Endpoints**
  - `GET /api/admin/invite-codes` - List all codes with usage stats
  - `POST /api/admin/invite-codes` - Create new invite code
  - `DELETE /api/admin/invite-codes/[id]` - Deactivate/delete code
  - `POST /api/auth/register` - Updated to require invite code

- **Admin UI** (`/admin/invite-codes`)
  - Statistics cards (total, available, used, inactive codes)
  - Create invite code modal (max uses, expiration)
  - Code list with copy-to-clipboard
  - Usage tracking per code
  - Status badges and action buttons

- **Registration Update** (`/register`)
  - Added invite code input field
  - Uppercase transformation
  - Validation on submit
  - Helper text for users

#### Phase 2: Admin User & Trade Management ✅
- **User Management Service** (`lib/services/userManagementService.ts`)
  - Create user without invite code requirement
  - Update user details (name, email, role)
  - Delete user with cascade (prevents self-deletion and last admin deletion)
  - Reset password (generates 10-char temporary password)
  - Get user with statistics (trades, win rate, SOP rate, P&L)

- **User Management API Endpoints**
  - `POST /api/admin/users/create` - Create user directly
  - `GET /api/admin/users/[id]` - Get user details with stats
  - `PATCH /api/admin/users/[id]` - Update user
  - `DELETE /api/admin/users/[id]` - Delete user with safety checks
  - `POST /api/admin/users/[id]/reset-password` - Generate temp password

- **Trade Management API Endpoints**
  - `GET /api/admin/trades` - List all trades across all users
    - Filters: userId, result, session, dateFrom, dateTo, search
    - Pagination: 50 per page default
    - Returns: Trades with user details and pagination metadata
  - `DELETE /api/admin/trades/[id]` - Delete any trade (admin override)
    - Auto-updates daily summary

- **Enhanced Admin Users Page** (`/admin/users`)
  - Create user modal (name, email, password, role)
  - Edit user modal (update name, email, role)
  - Delete confirmation dialog with data summary
  - Reset password action with temp password display
  - Copy to clipboard functionality
  - Search by name/email
  - Sort by any column (name, email, trades, win rate, SOP rate, P&L)
  - Success/error toast notifications

- **New Admin Trades Page** (`/admin/trades`)
  - View all trades from all users in one table
  - Comprehensive filters:
    - User dropdown
    - Result (WIN/LOSS)
    - Session (ASIA/EUROPE/US/OVERLAP)
    - Date range (from/to)
    - Search (name, email, notes)
  - Reset filters button
  - Delete trade with confirmation
  - Pagination (50 per page)
  - Trade count display
  - Formatted timestamps
  - Color-coded badges (session, result, SOP)

- **Navigation Updates**
  - Added "Trades" link to admin menu
  - Order: Overview → Users → Trades → Invite Codes

#### Business Rules Implemented
- Invite codes required for public registration
- Admins can create users without invite codes
- Admins cannot delete themselves (prevents lockout)
- Cannot delete last admin (minimum 1 admin required)
- Email uniqueness enforced across all creation/update operations
- Trade deletion updates daily summary automatically
- Temporary passwords are random 10-character strings

#### Phase 3: User Self-Service Features ✅
- **User Settings Service** (`lib/services/userSettingsService.ts`)
  - Change password with current password verification
  - Reset account data (delete all trades/summaries/targets)
  - Get account summary for confirmation

- **Password Change Feature**
  - API: `PATCH /api/users/me/password`
  - Validates current password with bcrypt
  - Checks new password ≥8 chars and different from current
  - Updates passwordHash securely
  - Returns detailed error codes (INVALID_PASSWORD, SAME_PASSWORD)

- **Account Reset Feature**
  - API: `GET /api/users/me/reset` - Get account data summary
  - API: `POST /api/users/me/reset` - Perform reset with confirmation
  - Requires exact phrase: "RESET MY ACCOUNT"
  - Deletes: All trades, daily summaries, targets
  - Preserves: User account, login credentials
  - Uses Prisma transaction for atomicity
  - Shows data counts before deletion

- **24-Hour Trade Deletion Window**
  - Updated `deleteTrade()` in `individualTradeService.ts`
  - Regular users: Can only delete trades <24 hours old
  - Admin users: Can delete any trade (override)
  - Time calculated from `trade.createdAt` timestamp
  - Error message for expired deletion window

- **Settings Page UI** (`/settings`)
  - Profile information display (read-only)
  - Password change form with validation
  - Danger Zone with account reset
  - Confirmation modal with typed phrase requirement
  - Toast notifications for all actions
  - Mobile-responsive design
  - Added to user navigation menu

- **User Info API**
  - `GET /api/users/me` - Returns current user's name, email, role
  - Used by settings page to display profile
  - Server-side authentication with auth() function

#### Security & Data Integrity
- Bcrypt password hashing for change password feature
- Current password verification required
- Confirmation phrases for destructive actions
- Transaction-based account reset (prevents partial deletions)
- 24-hour window prevents historical data manipulation
- Admin override for data corrections

#### Business Rules Implemented
- Invite codes required for public registration
- Admins can create users without invite codes
- Admins cannot delete themselves (prevents lockout)
- Cannot delete last admin (minimum 1 admin required)
- Email uniqueness enforced across all creation/update operations
- Trade deletion updates daily summary automatically
- Temporary passwords are random 10-character strings

#### Security Enhancements
- Invite-only registration prevents spam
- Admin-only endpoints protected by role check
- Password reset requires admin action
- User deletion requires confirmation
- Trade deletion requires admin role

## [0.2.0] - 2026-01-09

### Phase 2 Complete - Individual Trade Features ✅

#### Added
- **Real-Time Trade Entry Form**
  - Mobile-optimized with 60px touch buttons
  - Datetime-local picker with auto-set timestamp
  - Simplified amount entry (always positive, auto-calculated based on WIN/LOSS)
  - SOP compliance radio buttons with proper boolean validation
  - Auto-reset form after submission with new timestamp
  - Clear error messages and success feedback

- **Trade List with Filters**
  - Server-side initial data loading
  - Client-side interactive filters (date range, result, session, SOP)
  - Dynamic summary statistics (win rate, SOP rate, net P/L)
  - Real-time filtering via API calls
  - Mobile-responsive layout

- **Pagination System**
  - Previous/Next buttons with page indicator
  - Customizable page size (10/25/50/100 trades per page)
  - localStorage persistence for page size preference
  - Pagination resets on filter changes
  - Disabled state handling during loading

- **Bulk Trade Entry**
  - Spreadsheet-style interface for end-of-day entry
  - Dynamic rows (add/remove up to 100 trades)
  - Inline validation with real-time error display
  - Auto-calculation of profit/loss based on result
  - Empty row filtering (only submits rows with time entered)
  - Batch submission with comprehensive validation

- **Backend Services**
  - `individualTradeService.ts` - CRUD operations with pagination support
  - `dailySummaryService.ts` - Auto-update triggers on trade changes
  - Market session calculator (ASIA/EUROPE/US/OVERLAP from UTC hour)
  - Pagination metadata (page, pageSize, totalCount, totalPages)

- **API Endpoints**
  - `POST /api/trades/individual` - Create single trade
  - `GET /api/trades/individual` - List trades with filters & pagination
  - `POST /api/trades/bulk` - Create multiple trades
  - All endpoints authenticated with NextAuth
  - Comprehensive error handling with status codes

#### Fixed
- TypeScript type mismatch in form validation (split schemas)
- SOP radio button boolean conversion with Controller
- DateTime format handling for datetime-local input
- Hydration warnings from Date() in defaultValues
- Bulk entry validation error (missing tradeDate in payload)

#### Technical Details
- Created `individualTradeSchema` for forms (accepts Date objects)
- Created `individualTradeApiSchema` for APIs (transforms string → Date)
- Used react-hook-form Controller for complex field handling
- Implemented localStorage for user preferences
- Added formatDateForInput() helper for datetime-local compatibility

---

## [0.1.0] - 2026-01-08

### Phase 1 Complete - Authentication System ✅

#### Added
- **User Authentication**
  - NextAuth.js v5 with Credentials provider
  - Bcrypt password hashing (min 8 characters)
  - Database sessions (stored in SQLite)
  - Role-based access control (USER/ADMIN)

- **Auth Pages**
  - Login page with email/password
  - Register page with name/email/password/confirm
  - Protected routes with middleware
  - Auto-redirect for unauthenticated users

- **Database Schema**
  - Users table with role field
  - Sessions table for NextAuth
  - Accounts table for future OAuth
  - Proper indexes and relationships

- **UI Components**
  - shadcn/ui components (Button, Input, Label)
  - Tailwind CSS with custom configuration
  - Mobile-responsive design
  - Form validation with error messages

---

## Project Initialization

### Initial Setup
- Next.js 15 with App Router
- TypeScript configuration
- Prisma with Turso (SQLite)
- Tailwind CSS + shadcn/ui
- NextAuth.js v5
- react-hook-form + Zod validation

### Repository Structure
```
app/
├── (auth)/        # Authentication pages
├── (user)/        # User pages
├── (admin)/       # Admin pages (future)
└── api/           # API endpoints

components/
├── ui/            # shadcn/ui components
├── forms/         # Form components
└── dashboard/     # Dashboard components (future)

lib/
├── auth.ts        # NextAuth config
├── db.ts          # Prisma client
├── constants.ts   # Constants
├── types.ts       # TypeScript types
├── validations.ts # Zod schemas
├── services/      # Business logic
└── utils/         # Utility functions

prisma/
├── schema.prisma  # Database schema
└── migrations/    # Migration history
```

---

## Next Steps - Phase 3

### Planned Features
1. **Dashboard Statistics**
   - Real trade data from daily_summaries
   - Win rate, SOP rate, net P/L
   - Best performing session
   - Monthly/weekly trends

2. **Session Performance Charts** (Recharts)
   - Win rate by session (ASIA/EUROPE/US/OVERLAP)
   - Total trades per session
   - Profit/loss breakdown

3. **Hourly Performance Heatmap**
   - Best trading hours identification
   - Win rate by hour of day
   - Visual heat map for quick insights

4. **Target Tracking**
   - Set weekly/monthly targets
   - Progress visualization
   - Achievement tracking

---

**Last Updated**: January 9, 2026  
**Current Version**: 0.2.0
