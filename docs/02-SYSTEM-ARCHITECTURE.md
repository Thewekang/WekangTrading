# System Architecture Design

## Document Control
- **Version**: 3.0
- **Last Updated**: January 18, 2026
- **Implementation Status**: ✅ Production (v1.2.0)
- **ORM**: Drizzle ORM (migrated from Prisma, January 11, 2026)
- **Database**: Turso (LibSQL - SQLite for edge)
- **Production URL**: https://wekangtrading.vercel.app

---

## 1. System Overview

### 1.1 Purpose
A web-based trading performance tracking system for monitoring individual and team trading results with focus on SOP (Standard Operating Procedure) compliance.

### 1.2 Key Features
- Multi-user authentication system (User/Admin roles)
- **Individual trade tracking with timestamps** (real-time + bulk entry)
- **Market session analysis** (Asia/Europe/US/Overlap)
- **Hourly performance analytics** to identify best trading times
- **Profit/loss tracking** in USD per trade
- **Gamification system** with badges, streaks, and achievements
- **Economic calendar integration** with high-impact events
- **SOP type management** with categorized trading rules
- **Target management** with weekly/monthly/yearly goals
- **Daily loss protection** with automatic alerts
- **Admin monitoring tools** with invite codes and user management
- Personal performance dashboards with time-based analytics
- Auto-calculated daily summaries for fast dashboard queries
- Customizable winning rate targets
- Visual performance charts and graphs
- User settings management with timezone support

### 1.3 Success Criteria
- ✅ Single Source of Truth (no duplication)
- ✅ Scalable architecture
- ✅ Type-safe codebase
- ✅ Responsive design
- ✅ Admin and user role separation

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                         │
│  (Browser - Next.js Frontend with React Components)         │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ User Portal  │  │ Admin Portal │  │ Auth Pages   │     │
│  │              │  │              │  │              │     │
│  │ - Dashboard  │  │ - Overview   │  │ - Login      │     │
│  │ - Trades     │  │ - Users      │  │ - Register   │     │
│  │ - Analytics  │  │ - Stats      │  │              │     │
│  │ - Targets    │  │ - Calendar   │  │              │     │
│  │ - Badges     │  │ - Settings   │  │              │     │
│  │ - Settings   │  │ - SOP Types  │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                       │
│              (Next.js API Routes - Serverless)              │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Auth API     │  │ Trade API    │  │ User API     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Badge API    │  │ Streak API   │  │ Calendar API │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Stats API    │  │ Target API   │  │ Admin API    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌─────────────────────────────────────────────────┐       │
│  │        Middleware (Auth, Validation, Roles)     │       │
│  └─────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            ↕ libSQL
┌─────────────────────────────────────────────────────────────┐
│                        DATA LAYER                            │
│                    (Turso - SQLite Edge)                     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Users        │  │ Individual   │  │ Daily        │     │
│  │              │  │ Trades       │  │ Summaries    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Trader       │  │ Trader       │  │ Badges       │     │
│  │ Badges       │  │ Streaks      │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Targets      │  │ SOP Types    │  │ Economic     │     │
│  │              │  │              │  │ Events       │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ Invite Codes │  │ Sessions     │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Component Architecture

### 3.1 Frontend Components (React/Next.js)

```
app/
├── (auth)/
│   ├── login/page.tsx              → Login page
│   └── register/page.tsx           → Registration page
│
├── (user)/
│   ├── dashboard/
│   │   ├── page.tsx                → User dashboard (main)
│   │   ├── achievements/page.tsx   → Achievements & badges view
│   │   └── loading.tsx             → Loading state
│   ├── trades/
│   │   ├── page.tsx                → Trade list view
│   │   ├── new/page.tsx            → Real-time trade entry form
│   │   └── bulk/page.tsx           → Bulk entry (end of day)
│   ├── analytics/
│   │   ├── sessions/page.tsx       → Session analysis view
│   │   └── hourly/page.tsx         → Hourly performance view
│   ├── targets/page.tsx            → Target management
│   └── settings/page.tsx           → User settings
│
├── (admin)/
│   └── admin/
│       ├── overview/page.tsx       → Admin dashboard
│       ├── users/page.tsx          → User management
│       ├── trades/page.tsx         → All trades view
│       ├── sop-types/page.tsx      → SOP type management
│       ├── invite-codes/page.tsx   → Invite code management
│       ├── economic-calendar/
│       │   ├── page.tsx            → Economic events calendar
│       │   └── view/page.tsx       → Calendar view
│       └── settings/page.tsx       → Admin settings
│
└── api/
    ├── auth/[...nextauth]/route.ts → NextAuth handler
    ├── trades/
    │   ├── individual/
    │   │   ├── route.ts            → POST individual trade, GET trades
    │   │   └── [id]/route.ts       → GET/PATCH/DELETE specific trade
    │   └── bulk/route.ts           → POST bulk trades
    ├── summaries/
    │   └── daily/
    │       ├── route.ts            → GET daily summaries
    │       └── [date]/route.ts     → GET summary for specific date
    ├── stats/
    │   ├── personal/route.ts       → GET personal statistics
    │   ├── by-session/route.ts     → GET session analysis
    │   ├── by-hour/route.ts        → GET hourly analysis
    │   └── admin/route.ts          → GET all users statistics
    ├── badges/
    │   ├── user/route.ts           → GET user badges
    │   ├── progress/route.ts       → GET badge progress
    │   └── recalculate/route.ts    → POST recalculate badges (admin)
    ├── streaks/route.ts            → GET/POST user streaks
    ├── targets/route.ts            → GET/POST target
    ├── sop-types/route.ts          → GET/POST/DELETE SOP types
    ├── calendar/route.ts           → GET calendar events
    ├── messages/route.ts           → GET user messages
    ├── export/route.ts             → GET export data
    ├── daily-loss-check/route.ts   → POST check daily loss
    ├── users/
    │   ├── route.ts                → GET users (admin)
    │   ├── [id]/route.ts           → GET/PATCH user
    │   └── [id]/targets/route.ts   → GET/PATCH user targets
    └── admin/
        ├── stats/route.ts          → GET admin stats
        ├── comparison/route.ts     → GET user comparison
        ├── invite-codes/route.ts   → GET/POST invite codes
        ├── sop-types/route.ts      → GET/POST/DELETE SOP types (admin)
        ├── users/route.ts          → GET/POST/PATCH users (admin)
        ├── trades/route.ts         → GET all trades (admin)
        └── economic-calendar/
            ├── sync/route.ts       → POST sync calendar events
            └── cron-logs/route.ts  → GET cron job logs
```
### 3.2 Reusable Components

```
components/
├── ui/                             → shadcn/ui components (SSOT)
│   ├── button.tsx
│   ├── card.tsx
│   ├── form.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── table.tsx
│   ├── dialog.tsx
│   ├── tabs.tsx
│   └── ... (more shadcn components)
│
├── forms/
│   ├── IndividualTradeForm.tsx     → Single trade entry (real-time)
│   ├── BulkTradeForm.tsx           → Bulk trade entry (end of day)
│   ├── LoginForm.tsx               → Login
│   ├── TargetSettingsForm.tsx      → User target settings
│   └── PasswordChangeForm.tsx      → Password change
│
├── charts/
│   ├── SessionComparisonChart.tsx  → Session performance comparison
│   ├── HourlyHeatmap.tsx           → Hourly performance heatmap
│   ├── WinRateChart.tsx            → Line/bar chart for win rates
│   ├── ComparisonChart.tsx         → Multi-user comparison
│   └── TrendChart.tsx              → Time-based trend analysis
│
├── dashboard/
│   ├── StatCard.tsx                → Stat display card
│   ├── PerformanceMetrics.tsx      → Performance summary
│   └── RankingTable.tsx            → User ranking (admin)
│
├── badges/
│   └── BadgeCard.tsx               → Badge display component
│
├── alerts/
│   └── DailyLossAlert.tsx          → Daily loss warning
│
├── animations/
│   └── BadgeCelebration.tsx        → Badge unlock animation
│
├── calendar/
│   └── ... (calendar components)
│
├── targets/
│   └── ... (target components)
│
├── admin/
│   └── ... (admin-specific components)
│
├── TradesList.tsx                  → Trade list component
├── ExportModal.tsx                 → Data export modal
├── ErrorBoundary.tsx               → Error boundary wrapper
└── TestError.tsx                   → Error testing component
``` 
### 3.3 Backend Structure

```
lib/
├── auth.ts                         → NextAuth configuration
├── db.ts                           → Drizzle client instance (SSOT)
├── constants.ts                    → App constants (SSOT)
├── types.ts                        → Shared TypeScript types (SSOT)
├── validations.ts                  → Zod validation schemas (SSOT)
├── utils.ts                        → Utility functions
│
├── db/
│   └── schema/                     → Drizzle ORM schemas (SSOT)
│       ├── index.ts                → Export all schemas
│       ├── users.ts                → User model
│       ├── trades.ts               → Individual trades
│       ├── summaries.ts            → Daily summaries
│       ├── targets.ts              → User targets
│       ├── sopTypes.ts             → SOP types
│       ├── badges.ts               → Badge definitions
│       ├── traderBadges.ts         → User badge progress
│       ├── traderStreaks.ts        → User streaks
│       ├── economicEvents.ts       → Economic calendar events
│       ├── inviteCodes.ts          → Invite codes
│       └── auth.ts                 → Sessions, accounts
│
├── services/                       → Business logic (SSOT)
│   ├── individualTradeService.ts   → Individual trade CRUD
│   ├── dailySummaryService.ts      → Daily summary calculations
│   ├── statsService.ts             → Statistics calculations
│   ├── targetService.ts            → Target management
│   ├── userManagementService.ts    → User management
│   ├── userSettingsService.ts      → User settings
│   ├── badgeService.ts             → Badge system logic
│   ├── streakService.ts            → Streak calculations
│   ├── notificationService.ts      → Notification logic
│   ├── economicCalendarService.ts  → Calendar event sync
│   ├── sopTypeService.ts           → SOP type management
│   ├── inviteCodeService.ts        → Invite code logic
│   ├── dailyLossService.ts         → Daily loss monitoring
│   ├── exportService.ts            → Data export
│   ├── trendAnalysisService.ts     → Trend analysis
│   └── adminStatsService.ts        → Admin statistics
│
└── utils/
    ├── calculations.ts             → Win rate calculations
    ├── marketSessions.ts           → Market session detection
    ├── dateUtils.ts                → Date grouping (week/month/year)
    └── validators.ts               → Custom validators
```

---

## 4. Data Flow

### 4.1 Real-Time Individual Trade Entry Flow
```
User Input (Individual Trade Form)
    ↓
Trade Timestamp, Result, SOP Followed, Profit/Loss USD
    ↓
React Hook Form + Zod Validation (Client)
    ↓
API POST /api/trades/individual
    ↓
Zod Validation (Server - individualTradeSchema)
    ↓
Calculate Market Session (UTC hour → ASIA/EUROPE/US/OVERLAP)
    ↓
individualTradeService.create()
    ↓
Prisma → Insert into individual_trades table
    ↓
Trigger: Update Daily Summary (recalculate aggregates)
    ↓
Prisma → Update daily_summaries table
    ↓
Response to Client (with auto-calculated marketSession)
    ↓
Update UI (re-fetch or optimistic update)
```

### 4.2 Bulk Trade Entry Flow (End of Day)
```
User Input (Multiple Trades for Selected Date)
    ↓
Array of trades with timestamps
    ↓
React Hook Form + Zod Validation (Client)
    ↓
API POST /api/trades/bulk
    ↓
Zod Validation (Server - bulkTradeEntrySchema)
  - Ensure all trades on same date
  - Check for duplicate timestamps
    ↓
For each trade: Calculate Market Session
    ↓
individualTradeService.createMany()
    ↓
Prisma → Batch insert into individual_trades table
    ↓
Trigger: Update Daily Summary (single recalculation)
    ↓
Prisma → Update daily_summaries table
    ↓
Response to Client (created count + summary stats)
    ↓
Redirect to Dashboard or Trade List
```

### 4.3 Dashboard Statistics Flow (Fast Query)
```
User opens Dashboard
    ↓
API GET /api/summaries/daily?startDate=...&endDate=...
    ↓
Query daily_summaries table (pre-calculated data)
    ↓
Fast aggregation across date range
    ↓
Response with totals + session breakdown
    ↓
Render Charts (Recharts) + Stat Cards
  - Win rate over time
  - Session comparison
  - Daily profit/loss
```

### 4.4 Session Analysis Flow
```
User opens Session Analysis Page
    ↓
API GET /api/stats/by-session?period=month
    ↓
sessionAnalysisService.analyze()
    ↓
Query individual_trades grouped by marketSession
    ↓
Calculate per-session stats:
  - Total trades
  - Win/loss count
  - Win rate %
  - Total profit/loss USD
  - Average profit per trade
  - SOP compliance rate
    ↓
Identify best session (highest win rate or profit)
    ↓
Response with session breakdown
    ↓
Render Session Comparison Chart
```

### 4.5 Hourly Analysis Flow
```
User opens Hourly Performance Page
    ↓
API GET /api/stats/by-hour?period=month
    ↓
Query individual_trades
    ↓
Extract hour from tradeTimestamp (UTC)
    ↓
Group by hour (0-23)
    ↓
Calculate per-hour stats:
  - Trade count
  - Win rate
  - Profit/loss
  - Market session label
    ↓
Sort by win rate or profit to find best hours
    ↓
Response with hourly breakdown + best hours
    ↓
Render Hourly Heatmap or Bar Chart
```

### 4.6 Gamification Flow (Badge & Streak System)
```
User completes an achievement (e.g., 5-day win streak)
    ↓
Trade entry or daily summary update triggers check
    ↓
badgeService.checkAndAwardBadges(userId)
    ↓
Query trader_streaks table for current streak
    ↓
Query trader_badges for existing badges
    ↓
Check badge criteria (defined in badges table)
    ↓
If criteria met: Award badge
    ↓
Insert into trader_badges (userId, badgeId, awardedAt, progress)
    ↓
notificationService.createNotification()
    ↓
Insert into user messages
    ↓
Response with badge celebration
    ↓
Frontend shows BadgeCelebration animation
```

### 4.7 Economic Calendar Sync Flow
```
Vercel Cron Job triggers (daily at 00:00 UTC)
    ↓
GET /api/admin/economic-calendar/sync
    ↓
Check authentication (admin only)
    ↓
economicCalendarService.syncEvents()
    ↓
Fetch high-impact events from external API
    ↓
Filter events for next 7 days
    ↓
Upsert into economic_events table
    ↓
Log sync status to cron_logs
    ↓
Response with sync summary
    ↓
Dashboard shows upcoming events
```

### 4.8 Daily Loss Check Flow
```
User enters trade with loss
    ↓
API POST /api/trades/individual
    ↓
After trade insert, trigger daily loss check
    ↓
dailyLossService.checkDailyLoss(userId, date)
    ↓
Query individual_trades for today
    ↓
Calculate total loss for the day
    ↓
If loss >= threshold (e.g., -$100):
    ↓
Create notification: "Daily loss limit approaching"
    ↓
Frontend shows DailyLossAlert component
    ↓
User receives warning before reaching max loss
```
### 4.9 Admin Monitoring Flow
```
Admin opens Admin Dashboard
    ↓
API GET /api/stats/admin
    ↓
Middleware: Check role = ADMIN
    ↓
adminStatsService.calculateAllUserStats()
    ↓
Drizzle Query (all users + trades)
    ↓
Aggregate data + Ranking calculation
    ↓
Response with all user stats
    ↓
Render Comparison Charts + Ranking Table
```

---

## 5. Authentication & Authorization

### 5.1 Authentication Strategy
- **Library**: NextAuth.js v5 (Auth.js)
- **Method**: Credentials Provider (email + password)
- **Session**: Database sessions (stored in Turso)
- **Password**: Hashed with bcrypt

### 5.2 Authorization Levels

| Role | Capabilities |
|------|-------------|
| **USER** | - View own dashboard<br>- Enter daily trades<br>- View personal stats<br>- Edit own settings<br>- Set personal targets<br>- View own badges and streaks<br>- View achievements<br>- View economic calendar<br>- Export own data |
| **ADMIN** | - All USER capabilities<br>- View all user dashboards<br>- View comparative stats<br>- Manage users<br>- View system-wide reports<br>- Rank users<br>- Manage SOP types<br>- Generate invite codes<br>- Sync economic calendar<br>- View cron job logs<br>- Manage system settings |

### 5.3 Route Protection

```typescript
// Middleware pattern
export async function middleware(request: NextRequest) {
  const session = await getServerSession();
  
  // Protect all dashboard routes
  if (!session) {
    return NextResponse.redirect('/login');
  }
  
  // Admin-only routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (session.user.role !== 'ADMIN') {
      return NextResponse.redirect('/dashboard');
    }
  }
  
  return NextResponse.next();
}
```

---

## 6. Database Design Principles

### 6.1 Schema Design Philosophy
- **Normalization**: 3NF (Third Normal Form)
- **Constraints**: Foreign keys, unique constraints
- **Indexes**: On frequently queried fields
- **Timestamps**: createdAt, updatedAt on all tables

### 6.2 Table Relationships
```
users (1) ──< (many) individual_trades
users (1) ──< (many) daily_summaries
users (1) ──< (many) user_targets
users (1) ──< (many) sessions
users (1) ──< (many) trader_badges
users (1) ──< (many) trader_streaks
users (1) ──< (many) invite_codes (created_by)

individual_trades (many) >── (1) daily_summaries
  (dailySummaryId FK links trades to their daily summary)

individual_trades (many) >── (1) sop_types
  (sopTypeId FK links trades to SOP rule followed)

trader_badges (many) >── (1) badges
  (badgeId FK links user badges to badge definitions)

economic_events (standalone - no FK relations)
```

**Key Design**: Multiple specialized tables
- `individual_trades`: Granular timestamp-level data for detailed analysis
- `daily_summaries`: Auto-calculated aggregations for fast dashboard queries
- `trader_badges` + `badges`: User badge progress + badge definitions
- `trader_streaks`: Current streak tracking (win, loss, SOP compliance)
- `sop_types`: Customizable SOP categories
- `economic_events`: High-impact calendar events
- `invite_codes`: Controlled user registration

### 6.3 Data Integrity
- Foreign key constraints
- NOT NULL on required fields
- CHECK constraints for valid ranges
- Unique constraints on emails

---

## 7. API Design Principles

### 7.1 RESTful Conventions
- **POST**: Create resource
- **GET**: Read resource(s)
- **PATCH**: Partial update
- **DELETE**: Remove resource

### 7.2 Response Format (Standardized)
```typescript
// Success response
{
  "success": true,
  "data": { /* resource or array */ },
  "message": "Optional success message"
}

// Error response
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { /* optional validation errors */ }
  }
}
```

### 7.3 HTTP Status Codes
- **200**: Success (GET, PATCH, DELETE)
- **201**: Created (POST)
- **400**: Bad Request (validation error)
- **401**: Unauthorized (not logged in)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **500**: Internal Server Error

---

## 8. Performance Considerations

### 8.1 Database Query Optimization
- Use Drizzle `select` to fetch only needed fields
- Implement pagination for large datasets (especially individual_trades)
- **Use daily_summaries for dashboard** (fast pre-calculated data)
- **Use individual_trades for detailed analysis** (slower but comprehensive)
- Add database indexes on:
  - `individual_trades.userId`
  - `individual_trades.tradeTimestamp`
  - `individual_trades.marketSession`
  - `individual_trades.result`
  - `individual_trades.sopTypeId`
  - `daily_summaries.userId`
  - `daily_summaries.tradeDate`
  - `trader_badges.userId`
  - `trader_badges.badgeId`
  - `trader_streaks.userId`
  - `economic_events.eventDate`
  - `sop_types.userId`
- Batch inserts for bulk trade entry (Drizzle batch insert)
- Use aggregate functions for statistics
- Cache frequently accessed data (badge definitions, SOP types)

### 8.2 Frontend Optimization
- Server-side rendering for initial page load
- Client-side caching with React Query (future)
- Lazy loading for charts and badge animations
- Code splitting by route
- Virtualized lists for large trade histories
- Optimistic UI updates for better UX
- Memoization for expensive calculations (badge progress, streaks)
- Debounced search and filters

### 8.3 Caching Strategy
- API response caching for session/hourly statistics
- Client-side state management (React Context for timezone, theme)
- Memoization for expensive calculations
- Badge definitions cached in-memory (static data)
- SOP types cached per user session
- Economic events cached (refresh daily via cron)
- Redis caching for frequently accessed stats (future enhancement)

---

## 9. Security Measures

### 9.1 Input Validation
- Client-side validation (React Hook Form + Zod)
- **Server-side validation** (Zod - MANDATORY)
- Sanitize all user inputs

### 9.2 Authentication Security
- Password hashing (bcrypt)
- Secure session management
- HTTPS only (enforced by Vercel)
- HTTP-only cookies for sessions

### 9.3 Authorization Security
- Server-side role checking
- API route protection
- Middleware for route guards

### 9.4 Database Security
- Parameterized queries (Prisma)
- SQL injection prevention
- Input length limits

---

## 10. Error Handling Strategy

### 10.1 Client-Side
- Form validation errors (inline)
- API error messages (toast notifications)
- Global error boundary (React)

### 10.2 Server-Side
```typescript
try {
  // Business logic
} catch (error) {
  if (error instanceof ZodError) {
    return { success: false, error: { code: 'VALIDATION_ERROR', ... } };
  }
  if (error && typeof error === 'object' && 'code' in error) {
    // LibSQL/Drizzle database error
    return { success: false, error: { code: 'DATABASE_ERROR', ... } };
  }
  // Log unknown errors
  console.error(error);
  return { success: false, error: { code: 'INTERNAL_ERROR', ... } };
}
```

---

## 11. Single Source of Truth (SSOT) Implementation

### 11.1 Database Schema
**Location**: `lib/db/schema/` (Drizzle ORM)
- All table definitions
- All relationships
- All field types
- All indexes and constraints

### 11.2 TypeScript Types
**Location**: `lib/types.ts`
- Derived from Drizzle schema using `$inferSelect` and `$inferInsert`
- Additional application types
- Shared between frontend and backend
- No manual type duplication

### 11.3 Validation Rules
**Location**: `lib/validations.ts`
- All Zod schemas
- Used in forms and API routes
- Single definition, multiple uses

### 11.4 Constants
**Location**: `lib/constants.ts`
```typescript
export const ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN'
} as const;

export const TRADE_RESULT = {
  WIN: 'WIN',
  LOSS: 'LOSS'
} as const;

export const MARKET_SESSION = {
  ASIA: 'ASIA',
  EUROPE: 'EUROPE',
  US: 'US',
  ASIA_EUROPE_OVERLAP: 'ASIA_EUROPE_OVERLAP',
  EUROPE_US_OVERLAP: 'EUROPE_US_OVERLAP'
} as const;

export const TARGET_TYPE = {
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  YEARLY: 'YEARLY'
} as const;

export const TARGET_CATEGORY = {
  PROP_FIRM: 'PROP_FIRM',
  PERSONAL: 'PERSONAL'
} as const;

export const BADGE_CATEGORY = {
  STREAK: 'STREAK',
  MILESTONE: 'MILESTONE',
  ACHIEVEMENT: 'ACHIEVEMENT',
  SPECIAL: 'SPECIAL'
} as const;

// Market session time ranges (UTC hours)
export const SESSION_HOURS = {
  ASIA: { start: 0, end: 9 },
  EUROPE: { start: 7, end: 16 },
  US: { start: 13, end: 22 }
} as const;
```

### 11.5 Service Layer (Business Logic)
**Location**: `lib/services/`
- All CRUD operations
- All calculations
- Reused across API routes
- No duplication of logic

---

## 12. Deployment Architecture

### 12.1 Hosting
- **Platform**: Vercel
- **Deployment**: Git-based (auto-deploy on push to main)
- **Environment**: Production + Preview

### 12.2 Database
- **Platform**: Turso
- **Connection**: libSQL client
- **Migrations**: Drizzle Kit
- **Regions**: 
  - Production: `wekangtrading-prod` (aws-eu-west-1)
  - Development: `wekangtrading-staging` (aws-eu-west-1)

### 12.3 Environment Variables
```
DATABASE_URL=                    # Turso connection string
DATABASE_AUTH_TOKEN=             # Turso auth token
NEXTAUTH_URL=                    # App URL
NEXTAUTH_SECRET=                 # Secret for NextAuth
TRADING_ECONOMICS_API_KEY=       # Economic calendar API (optional)
CRON_SECRET=                     # Vercel Cron authentication
```

### 12.4 Scheduled Jobs (Vercel Cron)
- **Economic Calendar Sync**: Daily at 00:00 UTC
  - Endpoint: `/api/admin/economic-calendar/sync`
  - Fetches high-impact events for next 7 days
  - Updates `economic_events` table
  - Logs to `cron_logs` table (future)

- **Daily Summary Recalculation**: Daily at 01:00 UTC (future)
  - Verify data integrity
  - Recalculate summaries if needed

- **Badge Progress Check**: Daily at 02:00 UTC (future)
  - Auto-award badges based on achievements
  - Send notifications

---

## 13. Testing Strategy

### 13.1 Unit Tests
- Service layer functions
- Utility functions (calculations, market sessions)
- Component logic
- Badge criteria evaluation
- Streak calculation logic

### 13.2 Integration Tests
- API routes
- Database operations
- Badge award flow
- Economic calendar sync

### 13.3 E2E Tests
- Critical user flows
- Authentication flow
- Trade entry flow
- Badge unlock flow
- Admin management flows

---

## 14. Monitoring & Logging

### 14.1 Application Monitoring
- Vercel Analytics (built-in)
- Error tracking (planned: Sentry)
- Performance monitoring

### 14.2 Logging
- Server-side logging for errors
- Audit trail for critical operations
- Cron job execution logs
- Badge award history
- User action logs (admin actions)

---

## 15. Future Scalability

### 15.1 Current Capacity (v1.2.0)
- Supports 5-20 users
- Handles thousands of trades per month
- Badge system scales with user growth
- Economic calendar updates daily
- Invite-code controlled registration

### 15.2 Future Enhancements
- **Caching**: Add Redis (Upstash) for hot data
- **Background Jobs**: More Vercel Cron jobs for automated reports
- **File Storage**: Cloudinary for badge images and user avatars
- **Notifications**: Email/push notifications for badges and targets
- **Export**: Enhanced CSV/PDF export with charts
- **Advanced Analytics**: Machine learning for trade pattern detection
- **Social Features**: Team competitions, leaderboards
- **Mobile App**: React Native app for mobile-first experience
- **Real-time Updates**: WebSocket for live badge notifications
- **Multi-language**: i18n support for international users

---

## 16. Acceptance Criteria

### 16.1 Technical Requirements
- ✅ Type-safe codebase (TypeScript + Zod + Drizzle)
- ✅ No duplication (SSOT enforced)
- ✅ Scalable architecture
- ✅ Mobile-responsive design
- ✅ Admin and user separation
- ✅ Performance optimized (<500ms API, <200ms dashboard)
- ✅ Security hardened (auth, validation, sanitization)

### 16.2 Functional Requirements
- ✅ User registration and login (with invite codes)
- ✅ **Individual trade entry** with timestamp (real-time)
- ✅ **Bulk trade entry** for end-of-day workflow
- ✅ **Market session auto-detection** (Asia/Europe/US/Overlap)
- ✅ **Profit/loss tracking** in USD per trade
- ✅ Personal dashboard with charts
- ✅ Win rate calculations (total, SOP, non-SOP)
- ✅ **Session-based performance analysis**
- ✅ **Hourly performance analytics**
- ✅ **Fast dashboard queries** (using daily summaries)
- ✅ Time-based analytics (week, month, year)
- ✅ **Gamification system** (badges, streaks, achievements)
- ✅ **Economic calendar integration**
- ✅ **SOP type management** (customizable rules)
- ✅ **Target management** (prop firm + personal)
- ✅ **Daily loss alerts**
- ✅ **User settings** (timezone, theme, password)
- ✅ Admin monitoring and user management
- ✅ Admin invite code generation
- ✅ Data export functionality
- ✅ User ranking and comparison

---

## 17. Key Design Decisions

### 17.1 Dual-Entry System
**Problem**: Users need flexibility in how they record trades
**Solution**: 
- **Real-time entry**: Mobile-friendly, immediate recording during trading session
- **Bulk entry**: Desktop-friendly, enter multiple trades at end of day
- Both workflows update the same `individual_trades` table

### 17.2 Dual-Table Approach
**Problem**: Balance between granular data and query performance
**Solution**:
- **individual_trades**: Every single trade with timestamp → Detailed analysis
- **daily_summaries**: Auto-calculated aggregates → Fast dashboard
- Auto-sync ensures accuracy (triggers on individual trade changes)

### 17.3 Market Session Auto-Calculation
**Problem**: Ensure consistent session categorization
**Solution**:
- Calculate from UTC hour ranges server-side
- Store in `individual_trades.marketSession` for fast filtering
- Eliminate user input errors

### 17.4 Timing Analysis Focus
**Problem**: User wants to identify most profitable trading times
**Solution**:
- Timestamp-level data (not just daily totals)
- Session analysis endpoint (`/api/stats/by-session`)
- Hourly analysis endpoint (`/api/stats/by-hour`)
- Enables answers to: "Do I trade better during US session?" "What's my best hour?"

### 17.5 Gamification System
**Problem**: Maintain user engagement and motivation
**Solution**:
- Badge system with multiple categories (Streak, Milestone, Achievement, Special)
- Streak tracking (win streaks, loss streaks, SOP compliance)
- Achievement notifications with celebrations
- Visual progress indicators
- Unlockable badges based on performance criteria

### 17.6 Economic Calendar Integration
**Problem**: Users need awareness of high-impact economic events
**Solution**:
- Auto-sync daily via Vercel Cron
- Filter for high-impact events only
- Display upcoming events on dashboard
- Helps users plan trading around major news

### 17.7 Controlled Registration
**Problem**: Need to control user access and prevent spam
**Solution**:
- Invite code system managed by admin
- Each code can be single-use or multi-use
- Track code usage and expiration
- Secure onboarding process

---

## 18. Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Turso free tier limit | Medium | Monitor usage, plan upgrade path to paid tier |
| Performance with large datasets | Medium | Use daily_summaries for dashboards, implement pagination |
| Security vulnerabilities | High | Follow security best practices, regular dependency updates |
| User adoption | Low | Gamification increases engagement, invite-only ensures committed users |
| Data consistency (summaries) | Low | Auto-update triggers on every trade change, recalc scripts available |
| External API dependency (calendar) | Low | Graceful degradation if API fails, cached data available |
| Badge system abuse | Low | Server-side validation, admin monitoring |
| Timezone confusion | Medium | User timezone settings, clear UTC labeling |

---

## 19. Version History

### v3.0 (January 18, 2026) - Current
- ✅ **Gamification System**: Badges, streaks, achievements
- ✅ **Economic Calendar**: High-impact event integration
- ✅ **SOP Type Management**: Customizable trading rules
- ✅ **Target Categories**: Prop firm vs personal targets
- ✅ **Daily Loss Protection**: Automatic alerts
- ✅ **Admin Enhancements**: Invite codes, settings, cron monitoring
- ✅ **User Settings**: Timezone support, theme, password change
- ✅ **Export Functionality**: CSV export with filters
- ✅ **Enhanced Analytics**: Trend analysis, comparison tools

### v2.3 (January 12, 2026)
- ✅ **ORM Migration**: Prisma → Drizzle ORM
- ✅ Performance optimizations
- ✅ Enhanced error handling

### v2.0 (December 2025)
- ✅ **Individual Trade Tracking**: Timestamp-level granularity
- ✅ **Market Session Detection**: Asia/Europe/US/Overlap
- ✅ **Dual-Entry System**: Real-time + Bulk entry
- ✅ **Session Analytics**: Performance by market session
- ✅ **Hourly Analytics**: Best trading hours

### v1.0 (November 2025)
- ✅ Initial MVP release
- ✅ Basic trade tracking
- ✅ User authentication
- ✅ Admin dashboard

---

## 20. Next Steps

**Current Status**: ✅ Production (v1.2.0 - Gamification & Calendar Complete)

**Upcoming Features** (v1.3.0):
1. ⏳ **Advanced Notifications**: Email/push for badges and targets
2. ⏳ **Enhanced Export**: PDF reports with charts
3. ⏳ **Team Features**: Group challenges and competitions
4. ⏳ **Mobile App**: React Native implementation
5. ⏳ **Real-time Updates**: WebSocket integration

**Documentation Status**:
- ✅ System Architecture (this document)
- ✅ Database Schema
- ✅ API Specification
- ✅ Gamification System
- ✅ Testing Guide
- ⏳ Deployment Guide (needs update for v1.2.0)

---

**Document Status**: ✅ CURRENT (v3.0)  
**Implementation Status**: ✅ Production (v1.2.0)  
**Next Review**: February 2026
