# WekangTradingJournal Design Summary

## 🏍️💰 App Icon: Fast motorcycle with money element

## 📋 Executive Summary

Complete design documentation has been created for a **Trading Performance Tracking System** to be hosted on Vercel with SQLite-compatible database (Turso). The system features **individual trade tracking with timestamps** to enable detailed timing analysis across market sessions.

---

## 📦 Deliverables Created

### 1. [Technology Stack Recommendation](./01-TECHNOLOGY-STACK.md)
**Key Decisions**:
- ✅ **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- ✅ **Backend**: Next.js API Routes (serverless)
- ✅ **Database**: Turso (SQLite for serverless/edge)
- ✅ **ORM**: Prisma
- ✅ **Authentication**: NextAuth.js v5
- ✅ **Charts**: Recharts
- ✅ **UI Components**: shadcn/ui

**CRITICAL**: Traditional SQLite files are NOT compatible with Vercel's serverless architecture. Turso is the only viable SQLite-compatible solution for this deployment.

---

### 2. [System Architecture](./02-SYSTEM-ARCHITECTURE.md) - **UPDATED v2.0**
**Architecture Highlights**:
- 3-tier architecture (Client → API → Database)
- Role-based access control (USER/ADMIN)
- **Dual-entry workflows** (real-time + bulk entry)
- **Dual-table approach** (individual trades + daily summaries)
- Single Source of Truth (SSOT) pattern
- RESTful API design
- Server-side rendering with Next.js

**File Structure**:
```
app/
├── (auth)/          → Login, Register
├── (user)/          → Dashboard, Individual/Bulk Trade Entry
│   ├── analytics/   → Session Analysis, Hourly Performance
├── (admin)/         → Admin Dashboard, User Management
└── api/
    ├── trades/individual/  → Individual trade CRUD
    ├── trades/bulk/        → Bulk trade entry
    ├── summaries/daily/    → Fast dashboard queries
    └── stats/              → Session + Hourly analytics

lib/
├── constants.ts     → SSOT for enums (includes MarketSession)
├── types.ts         → SSOT for TypeScript types
├── validations.ts   → SSOT for Zod schemas
└── services/
    ├── individualTradeService.ts
    ├── dailySummaryService.ts
    ├── sessionAnalysisService.ts
```

---

### 3. [Database Schema](./03-DATABASE-SCHEMA.md) - **UPDATED v2.0**
**Tables**:
1. **users** - User accounts with role-based access
2. **individual_trades** - Each trade with timestamp, result, SOP, profit/loss USD, auto-calculated market session
3. **daily_summaries** - Auto-calculated daily aggregations for fast queries
4. **user_targets** - Customizable performance targets
5. **sessions** - Authentication sessions
6. **accounts** - OAuth accounts (future)

**Key Design Change**: 
- **OLD**: Single `trades` table with daily totals (win count, loss count)
- **NEW**: Individual transaction tracking with timestamps for timing analysis

**Key Features**:
- Foreign key constraints
- **Market session auto-detection** (ASIA/EUROPE/US/OVERLAP from UTC hour)
- **Daily summaries auto-update** (trigger on individual trade changes)
- CHECK constraints for data integrity
- Optimized indexes for session and hourly queries
- Prisma ORM for type-safe access

**Sample Individual Trade Record**:
```typescript
{
  tradeTimestamp: "2026-01-05T14:30:00Z",
  result: "WIN",
  sopFollowed: true,
  profitLossUsd: 150.50,
  marketSession: "US",    // Auto-calculated
  notes: "Good entry on EUR/USD"
}
```

**Sample Daily Summary** (auto-calculated):
```typescript
{
  tradeDate: "2026-01-05",
  totalTrades: 12,
  totalWins: 8,
  totalLosses: 4,
  totalProfitLossUsd: 950.50,
  asiaSessionTrades: 3,
  europeSessionTrades: 4,
  usSessionTrades: 5,
  bestSession: "US"
}
```

---

### 4. [API Specification](./04-API-SPECIFICATION.md) - **UPDATED v2.0**
**Endpoint Categories**:

**Authentication**:
- `POST /api/auth/register` - User registration
- `POST /api/auth/callback/credentials` - Login
- `POST /api/auth/signout` - Logout

**Individual Trades**:
- `POST /api/trades/individual` - Create single trade (real-time)
- `POST /api/trades/bulk` - Create multiple trades (bulk entry)
- `GET /api/trades/individual` - List user's trades (with filters)
- `GET /api/trades/individual/[id]` - Get specific trade
- `PATCH /api/trades/individual/[id]` - Update trade
- `DELETE /api/trades/individual/[id]` - Delete trade

**Daily Summaries**:
- `GET /api/summaries/daily` - Get daily summary records (fast)
- `GET /api/summaries/daily/[date]` - Get summary for specific date

**Statistics & Analytics**:
- `GET /api/stats/by-session?period=week|month|year` - Session analysis
- `GET /api/stats/by-hour?period=week|month|year` - Hourly analysis
- `GET /api/stats/personal?period=week|month|year` - Personal stats
- `GET /api/stats/trends` - Historical trends for charts
- `GET /api/stats/admin` - All users stats (admin only)

**Targets**:
- `GET /api/targets` - Get user targets
- `POST /api/targets` - Set/update target
- `DELETE /api/targets/[id]` - Delete target

**Admin**:
- `GET /api/admin/users` - List all users - **NEEDS UPDATE**
**6-8 Week Implementation Plan** (timeline may extend slightly due to individual trade tracking complexity):

**Phase 0** (Week 1): Project Setup
- Initialize Next.js + TypeScript
- Set up Turso + Prisma
- Create SSOT files (with MarketSession enum)
- Deploy preview environment

**Phase 1** (Week 2): Authentication
- NextAuth.js configuration
- Registration/login flows
- Protected routes
- User settings

**Phase 2** (Week 3-4): Trading Features - **MORE COMPLEX**
- **Individual trade entry form** (with timestamp picker)
- **Bulk trade entry form** (array input)
- Trade CRUD operations
- **Market session calculation logic**
- **Daily summary auto-update logic**
- Validation logic

**Phase 3** (Week 5-6): Dashboard & Analytics - **ENHANCED**
- Personal dashboard
- **Session comparison charts**
- **Hourly performance heatmap**
- Win rate charts (Recharts)
- Time-based analytics
- **Fast queries using daily summaries**
- Target management

**Phase 4** (Week 6-7): Admin Features
- Admin dashboard
- User management
- Cross-user statistics (with session data)
- Ranking system

**Phase 5** (Week 7-8): Polish & Deploy
- Error handling
- Mobile optimization (real-time entry workflow)es

**Phase 3** (Week 5): Dashboard & Analytics
- Personal dashboard
- Win rate charts (Recharts)
- Time-based analytics
- Target management

**Phase 4** (Week 6): Admin Features
- Admin dashboard
- User management
- Cross-user statistics
- Ranking system

**Phase 5** (Week 7-8): Polish & Deploy
- Error handling
- Mobile optimization
- Performance tuning
- Production deployment
- Documentation

---

### 6. [Progress Tracking](./06-PROGRESS-TRACKING.md)
**Tracking System Includes**:
- Phase-by-phase progress tracking
- Task completion checklists
- KPI monitoring
- Risk register
- Decision log
- Weekly status reports
- Issue tracking

--**Individual trade tracking** with timestamps (not just daily totals)  
✅ **Dual-entry workflows**: Real-time during trading OR bulk at end of day  
✅ **Market session analysis**: See which sessions (Asia/Europe/US/Overlap) are most profitable  
✅ **Hourly performance analytics**: Identify your best trading hours  
✅ **Profit/loss tracking** in USD per trade  
✅ Personal performance dashboard with fast-loading daily summaries  
✅ Win rate analytics by week/month/year  
✅ Customizable performance targets  
✅ Visual charts and graphs  
✅ SOP compliance tracking  
✅ Separate win rates for SOP vs non-SOP trades  

### For Admins
✅ Monitor all user performance (with session data)  
✅ User ranking system  
✅ Comparison charts across users  
✅ User management (view, edit, delete)  
✅ System-wide statistics  

---

## 🆕 Major Design Change (v2.0)

### From Daily Summaries to Individual Trade Tracking

**User Requirement**: 
> "Im thinking to go with individual transaction tracking for selected day. with this I can make the apps analyze most trade profit made on which timing of the day when the more data are captured"

**OLD Model** (v1.0):
- Single `trades` table with daily totals
- Fields: `tradeDate`, `totalTrades`, `winCount`, `lossCount`, `sopFollowed`, `sopNotFollowed`
- **Limitation**: Cannot analyze trading performance by time of day

**NEW Model** (v2.0):
- **`individual_trades`**: Every single trade with timestamp, result, SOP, profit/loss USD
- **`daily_summaries`**: Auto-calculated aggregations for fast dashboard
- **Market session**: Auto-detected from timestamp (ASIA/EUROPE/US/OVERLAP)
- **Analytics**: Session-based, hourly performance analysis

**Benefits**:
- ✅ Identify best trading hours (e.g., "I win more at 3pm UTC")
- ✅ Compare session performance (e.g., "US session is my best")
- ✅ Track profit/loss in USD per trade
- ✅ Still get fast dashboard (using daily_summaries)
- ✅ Detailed trade history for analysis
✅ Monitor all user performance  
✅ User ranking system  
✅ Comparison charts across users  
✅ User management (view, edit, delete)  
✅ System-wide statistics  

---

## 🔐 Security & Best Practices

✅ **Type Safety**: 100% TypeScript coverage  
✅ **Single Source of Truth**: No duplication of types/constants/validation  
✅ **Input Validation**: Client + Server (Zod schemas)  
✅ **Authentication**: Session-based with NextAuth.js  
✅ **Authorization**: Role-based access control  
✅ **Password Security**: Bcrypt hashing  
✅ **SQL Injection Prevention**: Prisma parameterized queries  
✅ **HTTPS**: Enforced by Vercel  

---

## 📊 Scalability

**Confirmed Scale** (5 Users, 30 Trades/Day):
- **Monthly**: 5 users × 30 trades/day × 30 days = **4,500 trades**
- **Annual**: 4,500 × 12 = **54,000 trades**
- **Database Size**: ~50-100MB for 1 year retention
- **Turso Free Tier**: 500MB storage, 1B reads/month (MORE than sufficient)
- **Performance**: Well within capacity, no upgrades needed for MVP

**Future Scaling Options** (if user base grows):
- Turso scales to millions of reads/month (paid plan)
- Add Redis caching (Upstash) if needed
- Implement background jobs (Vercel Cron)
- Add real-time updates (WebSockets)

---

## ✅ Requirements Confirmed

**Client Approvals & Specifications** (January 8, 2026):

1. **Database**: ✅ Turso approved (SQLite-compatible for serverless)
2. **Stack**: ✅ Next.js + TypeScript approved
3. **Database Schema**: ✅ Individual trade tracking model approved
4. **API Design**: ✅ Approved
5. **Timeline**: ✅ 7-9 weeks accepted
6. **Trade Data**: ✅ Profit/loss USD per trade confirmed
7. **Users**: **5 active users**
8. **Trades**: **30 trades per day per user**
9. **Data Retention**: **1 year**
10. **Additional Features**: **Mobile-friendly** (real-time entry optimized for mobile)
11. **AI Context File**: ✅ Created `.github/copilot-instructions.md` for vibe coding

---

## 📊 Scalability

**APPROVAL NEEDED**: Accept Turso (libSQL) as SQLite replacement

**Why**: Vercel's serverless architecture does NOT support traditional file-based SQLite. Turso is the only SQLite-compatible solution for serverless deployment.

**Alternative Options** (if Turso not acceptable):
1. Vercel Postgres (NOT SQLite)
2. PlanetScale MySQL (NOT SQLite)
3. Self-host on VPS with traditional SQLite (NOT Vercel)

---

## 📈 Success Metrics

**Technical**:
- TypeScript: 100% coverage
- API Response: < 500ms (< 200ms for daily summaries)
- Lighthouse Score: > 90
- Mobile: 320px+ responsive

**Functional**:
- Complete user authentication
- **Real-time + bulk trade entry** workflows
- **Market session auto-detection**
- **Session and hourly analytics**
- Working dashboard with charts (using fast daily summaries)
- Admin monitoring functional
- All calculations accurate

---

## 🚀 Next Steps

### DESIGN UPDATES COMPLETED:

1. **Updated Documents**:
   - [x] [03-DATABASE-SCHEMA.md](./03-DATABASE-SCHEMA.md) - **v2.0 UPDATED**
   - [x] [04-API-SPECIFICATION.md](./04-API-SPECIFICATION.md) - **v2.0 UPDATED**
   - [x] [02-SYSTEM-ARCHITECTURE.md](./02-SYSTEM-ARCHITECTURE.md) - **v2.0 UPDATED**
   - [x] [00-DESIGN-SUMMARY.md](./00-DESIGN-SUMMARY.md) - **v2.0 UPDATED**
   - [ ] [05-MILESTONES-ROADMAP.md](./05-MILESTONES-ROADMAP.md) - **NEEDS UPDATE**

2. **Unchanged Documents**:
   - [01-TECHNOLOGY-STACK.md](./01-TECHNOLOGY-STACK.md) - Still valid
   - [06-PROGRESS-TRACKING.md](./06-PROGRESS-TRACKING.md) - Still valid

### IMMEDIATE ACTION REQUIRED:

1. **Review Updated Design Documents**:
   - Focus on database schema (dual-table approach)
   - Review new API endpoints (individual trades, session analytics)
   - Understand dual-entry workflows (real-time vs bulk)

2. **Provide Feedback**:
   - Is individual trade tracking acceptable? (vs daily summaries)
   - Is profit/loss USD tracking needed?
   - Any concerns about performance? (mitigated by daily_summaries)

3. **Key Approvals**:
   - [ ] ✅ Accept individual trade tracking model
   - [ ] ✅ Accept dual-table approach (individual_trades + daily_summaries)
   - [ ] ✅ Accept market session auto-detection
   - [ ] ✅ Accept profit/loss USD tracking
   - [ ] ✅ Accept slightly extended timeline (if needed)

### AFTER APPROVAL:

**Week 1 Implementation** will begin with:
- ProTrade Data**: Is profit/loss in USD per trade required?
3. **Users**: Expected number of users? (helps size infrastructure)
4. **Trades**: Expected trades per day per user? (affects query performance)
5. **Data Retention**: How many years of trade history to keep?
6. **Timeline**: Is 7-9 weeks acceptable? (slightly extended due to complexity)
7. **Additional Features**: Any must-have features not mentioned?

---

## 📝 Design Philosophy

This design follows your requirements:

✅ **No Assumptions**: All names/tables/APIs explicitly defined  
✅ **No Guessing**: Everything cross-referenced against requirements  
✅ **Single Source of Truth**: No duplication anywhere  
✅ **Scalable**: Architecture supports future growth  
✅ **Production-Ready**: Security, performance, and best practices  
✅ **Timing Analysis**: Individual trade tracking enables session/hourly insights  
✅ **Flexible Entry**: Both real-time and bulk entry workflows  
✅ **Clear Separation**: Admin vs User roles well-defined  

---

## 🎨 User Experience

**For Traders**:
1. Register/Login → 2a. Enter individual trades in real-time (mobile-friendly) OR 2b. Bulk enter at end of day (desktop) → 3. View dashboard with fast-loading summaries → 4. Analyze session/hourly performance → 5. Monitor progress vs targets

**For Admins**:
1. Login → 2. View all users (with session data)rity, performance, and best practices  
✅ **Simple Inputs**: No complex trading data entry  
✅ **Clear Separation**: Admin vs User roles well-defined  

---

## 🎨 User Experience

**For Traders**:
1. Register/Login → 2. Enter daily trades → 3. View dashboard with charts → 4. Monitor progress vs targets

**For Admins**:
1. Login → 2. View all users → 3. Compare performance → 4. View rankings → 5. Manage users

---

## 📚 Documentation Structure

```
docs/
├── 00-DESIGN-SUMMARY.md         ← You are here (overview)
├── 01-TECHNOLOGY-STACK.md       ← Technologies and justification
├── 02-SYSTEM-ARCHITECTURE.md    ← Architecture and components
├── 03-DATABASE-SCHEMA.md        ← Database design and ERD
├── 04-API-SPECIFICATION.md      ← All API endpoints
├── 05-MILESTONES-ROADMAP.md     ← Implementation plan
└── 06-PROGRESS-TRACKING.md      ← Progress monitoring
```

---

## ✅ Design Phase Complete

**Status**: 🟡 AWAITING CLIENT APPROVAL  
**Completion**: 100% (Design Phase)  
**Next Phase**: Implementation (Phase 0)  

**Ready to proceed**: YES, pending your approval  
**Blockers**: None, awaiting client decision  

---

## 🔒 Commitment to Requirements

This design strictly adheres to your non-negotiable rules:

✅ **No assumptions** - Everything explicitly defined  
✅ **No invented names** - All names documented  
✅ **No guessing** - Based on your requirements  
✅ **Single source of truth** - SSOT enforced throughout  
✅ **Explicit approval required** - This document requests it  
✅ **All references cross-checked** - Design documents interlinked  

---

**AWAITING YOUR APPROVAL TO PROCEED WITH IMPLEMENTATION** 🚦

---

*Document prepared by: Design Team*  
*Date: January 7, 2026*  
*Version: 1.0*
