# GitHub Copilot Instructions - WekangTradingJournal

## Project Overview
Trading Performance Tracking System for monitoring individual and team trading results with timing analysis.

> **App Name**: WekangTradingJournal  
> **App Icon**: 🏍️💰 Fast motorcycle with money element

**Stack**: Next.js 15 (App Router) + TypeScript + Turso (SQLite) + Prisma + NextAuth.js v5 + Tailwind CSS + shadcn/ui + Recharts

**Deployment**: Vercel (serverless)

---

## Critical Design Principles

### 1. Single Source of Truth (SSOT)
- **Database Schema**: `prisma/schema.prisma` is the ONLY source
- **Types**: Generated from Prisma, extended in `lib/types.ts`
- **Validation**: `lib/validations.ts` using Zod schemas
- **Constants**: `lib/constants.ts` for enums and fixed values
- **Services**: All business logic in `lib/services/`

**NEVER duplicate types, validation rules, or constants across files.**

---

## Database Design (CRITICAL)

### Tables
1. **users**: User accounts (role: USER/ADMIN)
2. **individual_trades**: Each trade with timestamp, result, SOP, profit/loss USD, **auto-calculated** marketSession
3. **daily_summaries**: Auto-calculated aggregates (totalTrades, totalWins, bestSession, etc.)
4. **user_targets**: Performance targets (targetWinRate, targetSopRate)
5. **sessions**: NextAuth sessions
6. **accounts**: NextAuth OAuth (future)

### Key Relationships
- `users` (1) → (many) `individual_trades`
- `users` (1) → (many) `daily_summaries`
- `individual_trades` (many) → (1) `daily_summaries` via `dailySummaryId` FK

### Enums
```typescript
enum Role { USER, ADMIN }
enum TradeResult { WIN, LOSS }
enum MarketSession { ASIA, EUROPE, US, OVERLAP }
enum TargetType { WEEKLY, MONTHLY, YEARLY }
```

---

## Market Session Logic (CRITICAL)

**ALWAYS calculate server-side from UTC hour**:
```typescript
// ASIA: 00:00-09:00 UTC
// EUROPE: 07:00-16:00 UTC
// US: 13:00-22:00 UTC
// OVERLAP: When sessions overlap (07:00-09:00, 13:00-16:00)
```

**Function**: `calculateMarketSession(timestamp: Date): MarketSession`

**Location**: `lib/utils/marketSessions.ts`

**NEVER let users manually select market session.**

---

## Daily Summary Auto-Update (CRITICAL)

**When to trigger**:
- After individual trade INSERT
- After individual trade UPDATE
- After individual trade DELETE

**Function**: `updateDailySummary(userId: string, tradeDate: Date)`

**What it does**:
1. Aggregate all `individual_trades` for userId + tradeDate
2. Calculate totals (trades, wins, losses, SOP compliance, profit/loss USD)
3. Count trades per session (ASIA, EUROPE, US, OVERLAP)
4. Determine `bestSession` (highest win rate)
5. UPSERT into `daily_summaries` table

**Location**: `lib/services/dailySummaryService.ts`

**NEVER manually calculate daily summaries in multiple places.**

---

## Validation Rules (CRITICAL)

### Individual Trade
```typescript
{
  tradeTimestamp: z.date().max(new Date()), // Cannot be future
  result: z.enum(['WIN', 'LOSS']),
  sopFollowed: z.boolean(),
  profitLossUsd: z.number().refine(val => val !== 0), // Non-zero
  notes: z.string().max(500).optional()
}
```

### Bulk Trade Entry
```typescript
{
  tradeDate: z.date(),
  trades: z.array(individualTradeSchema).min(1).max(100),
  // All trades must be on same date (validate in API)
  // No duplicate timestamps (validate in API)
}
```

**Location**: `lib/validations.ts`

**ALWAYS validate client-side AND server-side.**

---

## API Design Patterns

### Standard Response Format
```typescript
// Success
{ success: true, data: {...}, message?: string }

// Error
{ success: false, error: { code: string, message: string, details?: object } }
```

### Status Codes
- 200: Success (GET, PATCH, DELETE)
- 201: Created (POST)
- 400: Validation error
- 401: Unauthorized (not logged in)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 500: Internal Server Error

### Error Handling Template
```typescript
try {
  // Business logic
} catch (error) {
  if (error instanceof ZodError) {
    return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.message } }, { status: 400 });
  }
  if (error instanceof PrismaClientKnownRequestError) {
    return NextResponse.json({ success: false, error: { code: 'DATABASE_ERROR', message: 'Database operation failed' } }, { status: 500 });
  }
  console.error(error);
  return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 });
}
```

---

## Performance Guidelines

### Database Queries
- **Dashboard stats**: Query `daily_summaries` (FAST, pre-calculated)
- **Detailed analysis**: Query `individual_trades` (SLOWER, more data)
- **ALWAYS use pagination** for `individual_trades` list (50 per page)
- **Use Prisma `select`** to fetch only needed fields
- **Batch inserts**: Use `createMany` for bulk trade entry

### Indexes (Already defined in schema)
- `individual_trades.userId`
- `individual_trades.tradeTimestamp`
- `individual_trades.marketSession`
- `individual_trades.result`
- `daily_summaries.userId`
- `daily_summaries.tradeDate`

### Expected Load
- Users: 5
- Trades per day per user: 30
- Monthly individual trades: 5 users × 30 trades/day × 30 days = 4,500 trades
- Data retention: 1 year
- Total trades in DB: ~54,000 trades (manageable with pagination)

---

## Authentication & Authorization

### NextAuth.js v5 Setup
- **Provider**: Credentials (email + password)
- **Session**: Database sessions (stored in `sessions` table)
- **Password**: Hashed with bcrypt (min 8 chars)

### Role-Based Access
```typescript
// USER: Own data only
if (session.user.id !== userId && session.user.role !== 'ADMIN') {
  return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } }, { status: 403 });
}

// ADMIN: All data
if (session.user.role !== 'ADMIN') {
  return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } }, { status: 403 });
}
```

### Protected Routes (middleware.ts)
- `/dashboard/*` → Authenticated users only
- `/admin/*` → Admin role only
- Redirect unauthenticated to `/login`

---

## Component Patterns

### Form Components (React Hook Form + Zod)
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm({
  resolver: zodResolver(individualTradeSchema),
  defaultValues: {...}
});

const onSubmit = async (data) => {
  const response = await fetch('/api/trades/individual', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  // Handle response
};
```

### Chart Components (Recharts)
```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="date" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Line type="monotone" dataKey="winRate" stroke="#8884d8" />
  </LineChart>
</ResponsiveContainer>
```

---

## File Structure (STRICT)

```
app/
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
├── (user)/
│   ├── dashboard/page.tsx
│   ├── trades/
│   │   ├── page.tsx              # List view
│   │   ├── new/page.tsx          # Real-time entry
│   │   ├── bulk/page.tsx         # Bulk entry
│   │   └── [id]/
│   │       ├── page.tsx          # Detail view
│   │       └── edit/page.tsx     # Edit view
│   ├── analytics/
│   │   ├── sessions/page.tsx     # Session analysis
│   │   └── hourly/page.tsx       # Hourly performance
│   └── settings/page.tsx
├── (admin)/
│   ├── dashboard/page.tsx
│   └── users/page.tsx
└── api/
    ├── auth/[...nextauth]/route.ts
    ├── trades/
    │   ├── individual/
    │   │   ├── route.ts          # POST, GET
    │   │   └── [id]/route.ts     # GET, PATCH, DELETE
    │   └── bulk/route.ts         # POST
    ├── summaries/
    │   └── daily/
    │       ├── route.ts          # GET
    │       └── [date]/route.ts   # GET
    ├── stats/
    │   ├── by-session/route.ts   # GET
    │   ├── by-hour/route.ts      # GET
    │   ├── personal/route.ts     # GET
    │   └── admin/route.ts        # GET (admin only)
    ├── targets/route.ts          # GET, POST
    └── users/
        ├── me/route.ts           # GET, PATCH
        └── me/password/route.ts  # PATCH

components/
├── ui/                   # shadcn/ui components (SSOT)
├── forms/
│   ├── IndividualTradeForm.tsx
│   ├── BulkTradeForm.tsx
│   └── LoginForm.tsx
├── charts/
│   ├── SessionComparisonChart.tsx
│   ├── HourlyHeatmap.tsx
│   └── WinRateChart.tsx
└── dashboard/
    ├── StatCard.tsx
    └── PerformanceMetrics.tsx

lib/
├── auth.ts               # NextAuth config
├── db.ts                 # Prisma client (SSOT singleton)
├── constants.ts          # All constants (SSOT)
├── types.ts              # TypeScript types (SSOT)
├── validations.ts        # Zod schemas (SSOT)
├── services/
│   ├── individualTradeService.ts
│   ├── dailySummaryService.ts
│   ├── sessionAnalysisService.ts
│   ├── userService.ts
│   └── targetService.ts
└── utils/
    ├── calculations.ts
    ├── marketSessions.ts
    └── dateUtils.ts
```

---

## Mobile-Friendly Requirements (CRITICAL)

### Responsive Breakpoints (Tailwind)
```typescript
// Mobile-first approach
sm: 640px   // Small devices
md: 768px   // Tablets
lg: 1024px  // Desktops
xl: 1280px  // Large screens
```

### Mobile Optimizations
- **Forms**: Touch-friendly (min 44px tap targets)
- **Tables**: Horizontal scroll on mobile, card view alternative
- **Charts**: Responsive container, readable on small screens
- **Navigation**: Mobile hamburger menu
- **Datetime picker**: Native mobile input (`<input type="datetime-local">`)
- **Buttons**: Full-width on mobile, inline on desktop

### Real-Time Entry Workflow (Mobile Priority)
- Quick entry during trading session
- Minimal fields: timestamp, result, SOP, profit/loss
- Large buttons, easy thumb access
- Success toast notifications

### Bulk Entry Workflow (Desktop Priority)
- Table-like input with keyboard navigation
- Copy/paste support
- Batch validation feedback

---

## Common Mistakes to AVOID

❌ **DON'T duplicate types** from Prisma schema  
✅ **DO use** `import { User, IndividualTrade } from '@prisma/client'`

❌ **DON'T manually calculate market session** in multiple places  
✅ **DO call** `calculateMarketSession()` from `lib/utils/marketSessions.ts`

❌ **DON'T forget to update daily summary** after trade changes  
✅ **DO call** `updateDailySummary()` in all trade CRUD operations

❌ **DON'T query individual_trades** for dashboard stats  
✅ **DO query** `daily_summaries` for fast dashboard

❌ **DON'T allow future timestamps**  
✅ **DO validate** `tradeTimestamp <= new Date()`

❌ **DON'T forget pagination** for individual_trades list  
✅ **DO implement** pagination (50 per page)

❌ **DON'T skip server-side validation**  
✅ **DO validate** both client and server

❌ **DON'T expose errors** to client (security)  
✅ **DO log** errors server-side, return generic message

❌ **DON'T forget role checks** in admin routes  
✅ **DO verify** `session.user.role === 'ADMIN'`

❌ **DON'T hardcode UTC hours** in multiple places  
✅ **DO use** `SESSION_HOURS` constant from `lib/constants.ts`

---

## Testing Checklist (Before Deployment)

- [ ] User can register and login
- [ ] User can enter individual trade (real-time)
- [ ] User can bulk enter trades (end of day)
- [ ] Market session auto-calculated correctly for all 24 hours
- [ ] Daily summary updates on trade insert/update/delete
- [ ] Dashboard loads fast (<200ms) using daily_summaries
- [ ] Session analysis shows correct breakdown
- [ ] Hourly analysis identifies best hours
- [ ] User can set and view targets
- [ ] Admin can view all users and stats
- [ ] Mobile responsive (tested on 375px width)
- [ ] Forms work on mobile (touch-friendly)
- [ ] All API endpoints return correct status codes
- [ ] Validation works client-side and server-side
- [ ] Pagination works for large datasets
- [ ] Performance acceptable (API <500ms, dashboard <200ms)

---

## Environment Variables

```env
DATABASE_URL="libsql://[your-turso-url]"
DATABASE_AUTH_TOKEN="[your-turso-token]"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="[generate-with-openssl-rand-base64-32]"
```

---

## Quick Reference Links

- **Design Docs**: `/docs/` folder
- **Database Schema**: `prisma/schema.prisma`
- **API Spec**: `/docs/04-API-SPECIFICATION.md`
- **System Architecture**: `/docs/02-SYSTEM-ARCHITECTURE.md`
- **Milestones**: `/docs/05-MILESTONES-ROADMAP.md`

---

## Key Takeaways for AI Coding

1. **SSOT is sacred**: Never duplicate, always reference
2. **Market session**: Auto-calculate server-side from UTC hour
3. **Daily summaries**: Auto-update triggers on every trade change
4. **Performance**: Use daily_summaries for dashboard, individual_trades for analysis
5. **Mobile-first**: Real-time entry optimized for mobile
6. **Validation**: Always both client and server
7. **Security**: Role checks, no exposed errors, bcrypt passwords
8. **Scale**: 5 users × 30 trades/day = designed for this load

---

**Last Updated**: January 8, 2026  
**Version**: 2.0 (Individual Trade Tracking Model)
