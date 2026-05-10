# GitHub Copilot Instructions - WekangTradingJournal

## Project Overview
Trading Performance Tracking System for monitoring individual and team trading results with timing analysis.

> **App Name**: WekangTradingJournal  
> **App Icon**: 🏍️💰 Fast motorcycle with money element

**Stack**: Next.js 15 (App Router) + TypeScript + Turso (SQLite) + Drizzle ORM + NextAuth.js v5 + Tailwind CSS + shadcn/ui + Recharts

**Deployment**: Vercel (serverless)

---

## Critical Design Principles

### 1. Single Source of Truth (SSOT)
- **Database Schema**: `lib/db/schema/` is the ONLY source (Drizzle ORM)
- **Types**: Generated from Drizzle schema using `$inferSelect` and `$inferInsert`
- **Validation**: `lib/validations.ts` using Zod schemas
- **Constants**: `lib/constants.ts` for enums and fixed values
- **Services**: All business logic in `lib/services/`

**NEVER duplicate types, validation rules, or constants across files.**

---

## Database Design (CRITICAL)

### Tables
1. **users**: User accounts (role: USER/ADMIN)
2. **trading_accounts**: Each user has ≥1 trading accounts (prop firm or personal); holds drawdown rules, daily reset timezone, cycle P&L tracking
3. **account_rules**: Per-account drawdown config (maxDailyLossUsd, maxTotalDrawdownUsd, cycleTargetProfitUsd, dailyResetTimezone, consistencyMaxDayPct)
4. **individual_trades**: Each row is either a `TRANSACTION` (WIN/LOSS/BE trade) or a `COMMISSION` (broker fee). Always has `tradingAccountId`. Market session auto-calculated from UTC timestamp.
5. **daily_summaries**: Auto-calculated aggregates — TRANSACTION-only counts for totalTrades/totalWins/bestSession; separate `totalCommissionUsd`. Unique index: `(userId, tradeDate, tradingAccountId)`.
6. **user_targets**: Performance targets (targetWinRate, targetSopRate). Scoped to `tradingAccountId`.
7. **withdrawal_events**: Records withdrawals per account (reduces `currentCyclePnl`, resets cycle).
8. **drawdown_templates**: Reusable rule presets (FTMO, MyFundedFx, etc.) managed by admin.
9. **user_stats**: Gamification stats per user **per account**. `UNIQUE (userId, tradingAccountId)`.
10. **user_badges**: Earned badges per user **per account**. `UNIQUE (userId, tradingAccountId, badgeId)`.
11. **streaks**: Win/log/SOP streaks per user **per account**. `UNIQUE (userId, tradingAccountId, streakType)`.
12. **user_rankings**: Ranking per account.
13. **discipline_tracker_rows**: Daily discipline grid rows. Scoped to `tradingAccountId`.
14. **discipline_tracker_settings**: User settings for discipline tracker. Scoped to `tradingAccountId`.
15. **sop_types**: Strategy/SOP categories.
16. **admin_settings**: Global app settings (key-value store).
17. **sessions**: NextAuth sessions
18. **accounts**: NextAuth OAuth (future)

### Key Relationships
- `users` (1) → (many) `trading_accounts`
- `trading_accounts` (1) → (1) `account_rules`
- `trading_accounts` (1) → (many) `individual_trades`
- `trading_accounts` (1) → (many) `daily_summaries`
- `trading_accounts` (1) → (1) `user_stats`
- `trading_accounts` (1) → (many) `user_badges`
- `trading_accounts` (1) → (many) `streaks`
- `individual_trades` (many) → (1) `daily_summaries` via `dailySummaryId` FK

### Enums
```typescript
enum Role { USER, ADMIN }
enum TradeResult { WIN, LOSS, BE }   // BE = Break-Even (profit_loss_usd = 0)
enum EntryType { TRANSACTION, COMMISSION }  // COMMISSION = broker fee row
enum MarketSession { ASIA, ASIA_EUROPE_OVERLAP, EUROPE, EUROPE_US_OVERLAP, US }
enum TargetType { WEEKLY, MONTHLY, YEARLY }
enum TargetCategory { PROP_FIRM, PERSONAL }
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
1. Separate TRANSACTION rows from COMMISSION rows
2. Aggregate TRANSACTION rows only for: totalTrades, totalWins, totalLosses, totalBeTrades, totalSopFollowed, all session counts
3. Aggregate COMMISSION rows for: totalCommissionUsd
4. Count trades per session (TRANSACTION only)
5. Determine `bestSession` (highest TRANSACTION win rate, min 3 trades)
6. UPSERT into `daily_summaries` table

**Metric Definitions (enforced app-wide)**:
- `totalTrades` = TRANSACTION count (WIN + LOSS + BE)
- `winRate` = totalWins / totalTrades × 100 (BE in denominator)
- `sopRate` = totalSopFollowed / totalTrades × 100
- `totalProfitLossUsd` = sum of TRANSACTION profit_loss_usd
- `totalCommissionUsd` = sum of COMMISSION profit_loss_usd
- `netProfitLossUsd` = totalProfitLossUsd + totalCommissionUsd

**Location**: `lib/services/dailySummaryService.ts`

**NEVER manually calculate daily summaries in multiple places.**

---

## Validation Rules (CRITICAL)

### Individual Trade — TRANSACTION
```typescript
{
  entryType: z.literal('TRANSACTION').default('TRANSACTION'),
  tradeTimestamp: z.date().max(new Date()), // Cannot be future
  result: z.enum(['WIN', 'LOSS', 'BE']),
  sopFollowed: z.boolean(),
  profitLossUsd: z.number().refine(val => result === 'BE' ? true : val !== 0), // 0 only for BE
  notes: z.string().max(500).optional()
}
```

### Individual Trade — COMMISSION
```typescript
{
  entryType: z.literal('COMMISSION'),
  tradeTimestamp: z.date().max(new Date()),
  profitLossUsd: z.number().negative(), // Must be negative
  notes: z.string().max(500).optional()
  // result and sopFollowed: absent (null in DB)
}
```

### Bulk Trade Entry
```typescript
{
  tradeDate: z.date(),
  trades: z.array(transactionTradeSchema | commissionTradeSchema).min(1).max(100),
  // All timestamps must be on same date
  // Mixed TRANSACTION + COMMISSION rows in one batch is allowed
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
  if (error && typeof error === 'object' && 'code' in error) {
    // LibSQL/Drizzle database error
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
- **Use Drizzle `select` syntax** to fetch only needed fields
- **Batch inserts**: Use Drizzle batch insert for bulk trade entry

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
├── db.ts                 # Drizzle client (SSOT singleton)
├── db/
│   └── schema/           # Drizzle ORM schemas (SSOT)
│       ├── index.ts      # Export all schemas
│       ├── users.ts      # User model
│       ├── trades.ts     # Individual trades
│       ├── summaries.ts  # Daily summaries
│       ├── targets.ts    # User targets
│       ├── sopTypes.ts   # SOP types
│       └── auth.ts       # Sessions, accounts
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
- **Timezone selection** with default to user's preferred timezone
- Minimal fields: timestamp, result, SOP, profit/loss
- Large buttons, easy thumb access
- Success toast notifications
- Timestamp converted to UTC using selected timezone

### Bulk Entry Workflow (Desktop Priority)
- Table-like input with keyboard navigation
- **Timezone selection** with default to user's preferred timezone
- Copy/paste support
- Batch validation feedback
- All timestamps converted to UTC using selected timezone

### CSV Import Workflow
- Upload CSV file with trade data
- **Timezone selection** for interpreting CSV timestamps
- Parse and validate trades
- Preview before import
- Batch insert with error handling
- All timestamps converted to UTC using selected timezone

---

## Common Mistakes to AVOID

❌ **DON'T duplicate types** from Drizzle schema  
✅ **DO use** `import type { User, IndividualTrade } from '@/lib/db/schema'`

❌ **DON'T manually calculate market session** in multiple places  
✅ **DO call** `calculateMarketSession()` from `lib/utils/marketSessions.ts`

❌ **DON'T forget to update daily summary** after trade changes  
✅ **DO call** `updateDailySummary()` in all trade CRUD operations

❌ **DON'T query individual_trades** for dashboard stats  
✅ **DO query** `daily_summaries` for fast dashboard

❌ **DON'T include COMMISSION rows** in trade counts, win rates, or SOP rates  
✅ **DO filter** `eq(individualTrades.entryType, 'TRANSACTION')` in any direct individual_trades analytics query

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

❌ **DON'T fetch or insert gamification data (badges/streaks/stats) without accountId**  
✅ **DO pass** `accountId` to ALL `badgeService` and `streakService` calls

❌ **DON'T forget the active account context on client components**  
✅ **DO use** `useActiveAccount()` from `@/contexts/ActiveAccountContext`; append `?accountId=${activeAccount.id}` to API calls

❌ **DON'T update gamification tables without scoping to tradingAccountId**  
✅ **DO ensure** all badge/streak/stat inserts and queries include `eq(table.tradingAccountId, accountId)`

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

## Development Environment Setup

### WSL (Windows Subsystem for Linux)
- ✅ **Already installed and configured on this machine**
- Use WSL for Turso CLI operations
- Reference: https://learn.microsoft.com/en-us/windows/wsl/

### Turso CLI Operations
- **Documentation**: https://docs.turso.tech/cli/introduction
- **CRITICAL**: Turso CLI MUST run inside WSL on Windows (not PowerShell)
- **Installation**: Already installed at `~/.turso/turso` in WSL

**CORRECT Workflow**:
```powershell
# Step 1: Enter WSL environment first
wsl

# Step 2: Wait for WSL prompt (h4mim@H4MIM:...)

# Step 3: Run turso commands directly
turso db list
turso db create <name> --location aws-eu-west-1
turso db show <name> --url
turso db tokens create <name>

# Step 4: Exit WSL when done
exit
```

**WRONG Workflow** (Don't do this):
```powershell
# ❌ Don't run turso from PowerShell
wsl -e bash -c "turso db list"  # This fails!

# ❌ Don't run turso directly in PowerShell
turso db list  # Command not found
```

**Common Commands**:
- `turso auth login` - Authenticate (opens browser)
- `turso db list` - List all databases
- `turso db create <name> --location aws-eu-west-1` - Create database (use same region as production)
- `turso db show <name> --url` - Get database URL
- `turso db tokens create <name>` - Generate auth token
- `turso db shell <name>` - Interactive SQL shell

### Drizzle ORM with Turso
- **Documentation**: https://orm.drizzle.team/docs/tutorials/drizzle-with-turso
- Schema location: `lib/db/schema/`
- Migration commands:
  - `npm run drizzle:generate` - Generate migrations
  - `npm run drizzle:push` - Push schema to database
  - `npm run drizzle:studio` - Open Drizzle Studio

### Environment Setup Pattern
- **Production**: `wekangtrading-prod` database
- **Staging**: `wekangtrading-staging` database (for develop branch)
- **Local Development**: Use staging database credentials

---

## Quick Reference Links

- **Design Docs**: `/docs/` folder
- **Database Schema**: `lib/db/schema/` (Drizzle ORM)
- **API Spec**: `/docs/04-API-SPECIFICATION.md`
- **System Architecture**: `/docs/02-SYSTEM-ARCHITECTURE.md`
- **Milestones**: `/docs/05-MILESTONES-ROADMAP.md`

---

## Key Takeaways for AI Coding

1. **SSOT is sacred**: Never duplicate, always reference
2. **Market session**: Auto-calculate server-side from UTC hour
3. **Daily summaries**: Auto-update triggers on every trade change; scoped to `(userId, tradeDate, tradingAccountId)`
4. **Performance**: Use daily_summaries for dashboard, individual_trades for analysis
5. **Mobile-first**: Real-time entry optimized for mobile
6. **Validation**: Always both client and server
7. **Security**: Role checks, no exposed errors, bcrypt passwords
8. **Scale**: 5 users × 30 trades/day = designed for this load
9. **Multi-account**: Every service, API route, and component must scope data by `tradingAccountId`
10. **Active account**: Cookie `active_account_id`; client → `useActiveAccount()` from `@/contexts/ActiveAccountContext`
11. **Gamification is per-account**: `badgeService`, `streakService`, `user_stats` all require `accountId` — badges earned on one account are invisible on another

---

**Last Updated**: May 10, 2026  
**Version**: 4.3 (v2.0.0-alpha.8 — Strategy Playbook UX: sizing mode toggle, auto-derived balance, leverage removed)

**v2.0.0 Multi-Account Status**: 🔄 IN PROGRESS (Phase 6: 99% complete)
- ✅ Schema: `trading_accounts`, `account_rules`, `withdrawal_events`, `drawdown_templates`, `admin_settings`
- ✅ Multi-account navigation: account picker → account landing → account dashboard
- ✅ All services, API routes, and client components scoped by `tradingAccountId`
- ✅ Per-account gamification: `user_stats`, `user_badges`, `streaks` all per-account
- ✅ Per-account timezone: `dailyResetTimezone` on account rules
- ✅ Withdrawal tracking: `withdrawal_events`, cycle P&L resets on withdrawal
- ✅ Staging DB migration applied (Turso)
- ✅ Strategy Playbook: `account_strategies` table, position calculator, INSTRUMENT_DEFAULTS
- ✅ Trading Day Checklist: `trading_day_checklists` table, 4-phase/22-item checklist, smart toasts, CandleCloseHUD
- ✅ Strategy Playbook UX: Fixed Size / Risk % mode toggle, auto-derived balance, leverage removed from UI
- ⏳ Session/hourly chart API account filtering (`/api/stats/by-session`, `/api/stats/by-hour`)
- ⏳ Admin UI account overview (Phase 7)

**Next Phase**: Complete Phase 6 (session/hourly chart scoping), then Phase 7 (Admin UI)
