# System Architecture Design

## Document Control
- **Version**: 2.1
- **Last Updated**: January 9, 2026
- **Implementation Status**: ✅ Phase 2 Complete (Trade Features)
- **Original Version**: 2.0
- **Status**: UPDATED - Individual Trade Tracking Model
- **Last Updated**: January 7, 2026

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
- Personal performance dashboards with time-based analytics
- Auto-calculated daily summaries for fast dashboard queries
- Customizable winning rate targets
- Visual performance charts and graphs
- Admin monitoring and user ranking system
- User settings management

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
│  ┌─────────────────────────────────────────────────┐       │
│  │        Middleware (Auth, Validation)            │       │
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
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ Targets      │  │ Sessions     │                        │
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
│├── new/page.tsx            → Real-time trade entry form
│   │   └── bulk/page.tsx           → Bulk entry (end of day)
│   ├── analytics/
│   │   ├── sessions/page.tsx       → Session analysis view
│   │   └── hourly/page.tsx         → Hourly performance view
├── (user)/
│   ├── dashboard/page.tsx          → User dashboard (main)
│   ├── trades/
│   │   ├── page.tsx                → Trade list view
│   │   └── new/page.tsx            → New trade entry form
│   └── settings/page.tsx           → User settings
│individual/
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
    ├── users/
    │   ├── route.ts                → GET users (admin)
    │   ├── [id]/route.ts           → GET/PATCH user
    │   └── [id]/targets/route.ts   → GET/PATCH user targets
    └── targets/
        └── route.ts                → GET/POST target
    │   ├── route.ts                → POST new trade, GET trades
    │   └── [id]/route.ts           → GET/PATCH/DELETE specific trade
    ├── users/
    │   ├── route.ts                → GET users (admin)
    │   ├── [id]/route.ts           → GET/PATCH user
    │   └── [id]/targets/route.ts   → GET/PATCH user targets
    └── stats/
        ├── personal/route.ts       → GET personal statistics
        └── admin/route.ts          → GET all users statistics
```

### 3.2 SessionComparisonChart.tsx  → Session performance comparison
│   ├── HourlyHeatmap.tsx           → Hourly performance heatmap
│   ├── Reusable Components

```IndividualTradeForm.tsx     → Single trade entry (real-time)
│   ├── BulkTradeForm.tsx           → Bulk trade entry (end of day)
│   ├── LoginForm.tsx               → Login
│   ├── TargetSettingsForm.tsx      → User target settings
│   └── PasswordChangeForm.tsx 
│   ├── card.tsx
│   ├── form.tsx
│   ├── input.tsx
│   ├── select.tsx
│   └── table.tsx
│
├── charts/
│   ├── WinRateChart.tsx            → Line/bar chart for win rates
│   ├── ComparisonChart.tsx         → Multi-user comparison
│   └── TrendChart.tsx              → Time-based trend analysis
│
├── forms/
│   ├── TradeEntryForm.tsx          → Daily trade entry
│   ├── LoginForm.tsx               → Login
│   ├── TargetSettingsForm.tsx     → User target settings
│   └── PasswordChangeForm.tsx     → Password change
│
├── dashboard/
│   ├── StatCard.tsx                → Stat display card
│   ├── PerformanceMetrics.tsx     → Performance summary
│   └── RankingTable.tsx            → User ranking (admin)
│
└── layoindividualTradeService.ts   → Individual trade CRUD
│   ├── dailySummaryService.ts      → Daily summary calculations
│   ├── sessionAnalysisService.ts   → Session analytic
    ├── Navbar.tsx                  → Navigation bar
    ├── Sidebar.tsx                 → Dashboard sidebar
    └── Footer.tsx                  → Footer
```
marketSessions.ts           → Market session detection
    ├── 
### 3.3 Backend Structure

```
lib/
├── auth.ts                         → NextAuth configuration
├── db.ts                           → Prisma client instance (SSOT)
├── constants.ts                    → App constants (SSOT)
├── types.ts                        → Shared TypeScript types (SSOT)
├── validations.ts                  → Zod validation schemas (SSOT)
│
├── services/                       → Business logic (SSOT)
│   ├── tradeService.ts             → Trade CRUD operations
│   ├── userService.ts              → User operations
│   ├── statsService.ts             → Statistics calculations
│   └── targetService.ts            → Target management
│
└── utils/
    ├── calculations.ts             → Win rate calculations
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

### 4.3 Admin Monitoring Flow
```
Admin opens Admin Dashboard
    ↓
API GET /api/stats/admin
    ↓
Middleware: Check role = ADMIN
    ↓
statsService.calculateAllUserStats()
    ↓
Prisma Query (all users + trades)
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
| **USER** | - View own dashboard<br>- Enter daily trades<br>- View personal stats<br>- Edit own settings<br>- Set personal targets |
| **ADMIN** | - All USER capabilities<br>- View all user dashboards<br>- View comparative stats<br>- Manage users<br>- View system-wide reports<br>- Rank users |

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

individual_trades (many) >── (1) daily_summaries
  (dailySummaryId FK links trades to their daily summary)
```

**Key Design**: Dual-table approach
- `individual_trades`: Granular timestamp-level data for detailed analysis
- `daily_summaries`: Auto-calculated aggregations for fast dashboard queries

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
- Use Prisma `select` to fetch only needed fields
- Implement pagination for large datasets (especially individual_trades)
- **Use daily_summaries for dashboard** (fast pre-calculated data)
- **Use individual_trades for detailed analysis** (slower but comprehensive)
- Add database indexes on:
  - `individual_trades.userId`
  - `individual_trades.tradeTimestamp`
  - `individual_trades.marketSession`
  - `individual_trades.result`
  - `daily_summaries.userId`
  - `daily_summaries.tradeDate`
- Batch inserts for bulk trade entry (Prisma `createMany`)
- Use aggregate functions for statistics

### 8.2 Frontend Optimization
- Server-side rendering for initial page load
- Client-side caching with React Query (future)
- Lazy loading for charts
- Code splitting by route
- Virtualized lists for large trade histories

### 8.3 Caching Strategy (Future Phase)
- API response caching for session/hourly statistics
- Client-side state management (Zustand)
- Memoization for expensive calculations
- Redis caching for frequently accessed stats (future)

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
  if (error instanceof PrismaClientKnownRequestError) {
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
**Location**: `prisma/schema.prisma`
- All table definitions
- All relationships
- All field types

### 11.2 TypeScript Types
**Location**: `lib/types.ts`
- Derived from Prisma schema
- Additional application types
- Shared between frontend and backend

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
  OVERLAP: 'OVERLAP'
} as const;

export const TARGET_TYPE = {
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  YEARLY: 'YEARLY'
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
- **Migrations**: Prisma Migrate

### 12.3 Environment Variables
```
DATABASE_URL=                    # Turso connection string
DATABASE_AUTH_TOKEN=             # Turso auth token
NEXTAUTH_URL=                    # App URL
NEXTAUTH_SECRET=                 # Secret for NextAuth
```

---

## 13. Testing Strategy (Future Phase)

### 13.1 Unit Tests
- Service layer functions
- Utility functions (calculations)
- Component logic

### 13.2 Integration Tests
- API routes
- Database operations

### 13.3 E2E Tests
- Critical user flows
- Authentication flow
- Trade entry flow

---

## 14. Monitoring & Logging (Future Phase)

### 14.1 Application Monitoring
- Vercel Analytics
- Error tracking (Sentry - optional)

### 14.2 Logging
- Server-side logging for errors
- Audit trail for critical operations

---

## 15. Future Scalability

### 15.1 Immediate Scalability (MVP)
- Supports up to 100 users
- Handles thousands of trades per month

### 15.2 Future Enhancements
- **Caching**: Add Redis (Upstash)
- **Background Jobs**: Vercel Cron for daily/weekly reports
- **File Storage**: Cloudinary for profile images
- **Notifications**: Email notifications for targets
- **Export**: CSV/PDF export of reports
- **Advanced Analytics**: More sophisticated charts

---

## 16. Acceptance Criteria

### 16.1 Technical Requirements
- ✅ Type-safe codebase (TypeScript + Zod + Prisma)
- ✅ No duplication (SSOT enforced)
- ✅ Scalable architecture
- ✅ Mobile-responsive design
- ✅ Admin and user separation

### 16.2 Functional Requirements
- ✅ User registration and login
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
- ✅ Customizable targets
- ✅ Admin monitoring
- ✅ User ranking

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

---

## 18. Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Turso free tier limit | Medium | Monitor usage, plan upgrade path |
| Performance issues with individual trades | Medium | Use daily_summaries for dashboards, implement pagination |
| Security vulnerabilities | High | Follow security best practices, regular updates |
| User adoption | Medium | Focus on simple UX, support both entry workflows |
| Data consistency (summaries) | Low | Auto-update triggers on every individual trade change |

---

## 19. Next Steps

1. ✅ **Client Approval**: Review and approve architecture
2. ➡️ **Database Schema**: Design detailed schema
3. ➡️ **API Specification**: Define all endpoints
4. ➡️ **Implementation Plan**: Break down into milestones

---

**Status**: AWAITING CLIENT APPROVAL
**Next Document**: Database Schema Design
