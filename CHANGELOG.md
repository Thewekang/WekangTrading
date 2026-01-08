# Changelog - WekangTradingJournal

All notable changes to this project will be documented in this file.

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
