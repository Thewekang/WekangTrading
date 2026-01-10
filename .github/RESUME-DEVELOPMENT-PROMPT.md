# 🚀 Resume Development Session Prompt

**Copy and paste this entire prompt to AI when resuming development work:**

---

## 📋 Project Context

You are resuming development on **WekangTradingJournal**, a trading performance tracking system for monitoring individual and team trading results with timing analysis.

### Quick Facts
- **App Name**: WekangTradingJournal
- **App Icon**: 🏍️💰 (Fast motorcycle with money element)
- **Repository**: GitHub.com/Thewekang/WekangTrading
- **Current Date**: {{ INSERT_CURRENT_DATE }}
- **Stack**: Next.js 15 (App Router) + TypeScript + Turso (SQLite) + Prisma + NextAuth.js v5 + Tailwind CSS + shadcn/ui + Recharts
- **Deployment Target**: Vercel (serverless)
- **Scale**: 5 users, 30 trades/day per user, 1 year data retention

---

## 📊 Current Project Status

**IMPORTANT**: Before starting, check these files for current state:
1. **[RESUME.md](../RESUME.md)** - Quick start checklist and current status
2. **[docs/06-PROGRESS-TRACKING.md](../docs/06-PROGRESS-TRACKING.md)** - Detailed progress and phase tracking
3. **[docs/SESSION-SUMMARY-2026-01-09.md](../docs/SESSION-SUMMARY-2026-01-09.md)** - Latest session summary

### Last Known Status (Update After Checking Files Above)
```
Project Completion: 80% (Phase 0-4 Complete ✅)
Current Phase: Phase 5 (Polish & Deployment)
Last Commit: efba2d0
Last Session: January 9, 2026

Completed Phases:
├─ Phase 0: Setup & Foundation       ✅ 100%
├─ Phase 1: Authentication           ✅ 100%
├─ Phase 2: Trading Features         ✅ 100%
├─ Phase 3: Dashboard & Analytics    ✅ 100%
├─ Phase 4: Advanced Features        ✅ 100%
└─ Phase 5: Polish & Deployment      ⏳ 0%
```

---

## 🎯 Your Task

**Primary Objective**: Continue development from where the last session left off.

**Before Writing Any Code**:
1. ✅ Read [RESUME.md](../RESUME.md) to understand what's working and what's next
2. ✅ Check git status: Run `git status` to see if there are uncommitted changes
3. ✅ Review last commits: Run `git log --oneline -10` to see recent work
4. ✅ Verify dev server works: Run `npm run dev` and check http://localhost:3000
5. ✅ Ask user for clarification: **"What would you like to work on today?"**

---

## 🏗️ Project Architecture Overview

### Critical Design Principles (MUST FOLLOW)

#### 1. Single Source of Truth (SSOT)
- **Database Schema**: `prisma/schema.prisma` is the ONLY source
- **Types**: Generated from Prisma, extended in `lib/types.ts`
- **Validation**: `lib/validations.ts` using Zod schemas
- **Constants**: `lib/constants.ts` for enums and fixed values
- **Services**: All business logic in `lib/services/`
- **NEVER duplicate types, validation rules, or constants across files**

#### 2. Market Session Logic (CRITICAL)
- **ALWAYS calculate server-side** from UTC timestamp
- Sessions: ASIA (00:00-09:00 UTC), EUROPE (07:00-16:00 UTC), US (13:00-22:00 UTC), OVERLAP (when sessions overlap)
- Function: `calculateMarketSession(timestamp: Date): MarketSession` in `lib/utils/marketSessions.ts`
- **NEVER let users manually select market session**

#### 3. Daily Summary Auto-Update (CRITICAL)
- Automatically triggered after ANY trade INSERT/UPDATE/DELETE
- Function: `updateDailySummary(userId: string, tradeDate: Date)` in `lib/services/dailySummaryService.ts`
- Aggregates trades, calculates stats, determines best session
- UPSERTS into `daily_summaries` table

#### 4. Performance Guidelines
- **Dashboard stats**: Query `daily_summaries` (FAST, pre-calculated)
- **Detailed analysis**: Query `individual_trades` (SLOWER, more granular)
- **ALWAYS use pagination** for individual_trades list (50 per page default)
- **Use Prisma `select`** to fetch only needed fields

#### 5. Validation Rules
- **Client-side AND server-side** validation (ALWAYS both)
- Trade timestamp cannot be in future
- Profit/loss must be non-zero
- All validation in `lib/validations.ts`

---

## 📁 Key File Locations

### Services (Business Logic - SSOT)
```
lib/services/
├── individualTradeService.ts    # Trade CRUD operations
├── dailySummaryService.ts       # Auto-update daily summaries
├── statsService.ts              # Dashboard statistics
├── targetService.ts             # Target tracking + AI suggestions
├── trendAnalysisService.ts      # MA7/MA30 trend calculations
└── exportService.ts             # CSV + PDF generation
```

### API Endpoints
```
app/api/
├── auth/[...nextauth]/route.ts  # NextAuth handler
├── trades/
│   ├── individual/route.ts      # POST (create), GET (list)
│   ├── individual/[id]/route.ts # GET, PATCH, DELETE
│   └── bulk/route.ts            # POST (bulk create)
├── stats/
│   ├── personal/route.ts        # Dashboard stats
│   ├── by-session/route.ts      # Session comparison
│   ├── by-hour/route.ts         # Hourly heatmap
│   ├── trends/route.ts          # Trend data
│   ├── indicators/route.ts      # Trend indicators
│   └── comparisons/route.ts     # Period comparisons
├── targets/
│   ├── route.ts                 # GET, POST
│   ├── [id]/route.ts            # GET, PATCH, DELETE
│   └── suggestions/route.ts     # AI target suggestions
└── export/
    ├── csv/route.ts             # CSV download
    └── pdf/route.ts             # PDF generation
```

### Core Pages
```
app/
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
├── (user)/
│   ├── dashboard/page.tsx       # Main dashboard with charts
│   ├── trades/
│   │   ├── page.tsx             # Trade list with filters
│   │   ├── new/page.tsx         # Real-time entry
│   │   └── bulk/page.tsx        # Bulk entry
│   ├── targets/page.tsx         # Target tracking
│   └── analytics/
│       └── trends/page.tsx      # Performance trends
└── (admin)/                     # ⚠️ NOT IMPLEMENTED YET
    ├── dashboard/page.tsx
    └── users/page.tsx
```

### Key Components
```
components/
├── forms/
│   ├── RealTimeTradeEntryForm.tsx
│   └── BulkTradeEntryForm.tsx
├── charts/
│   ├── SessionComparisonChart.tsx
│   ├── HourlyHeatmap.tsx
│   ├── TrendLineChart.tsx
│   ├── TrendIndicatorCard.tsx
│   └── ComparisonChart.tsx
├── targets/
│   ├── TargetCard.tsx
│   ├── TargetModal.tsx
│   └── CreateTargetButton.tsx
├── TradesList.tsx              # Advanced filtering + pagination
└── ExportModal.tsx             # CSV/PDF export UI
```

---

## 🔑 Essential Context Files

**Read these BEFORE coding**:

1. **[.github/copilot-instructions.md](copilot-instructions.md)** - CRITICAL: Full coding guidelines, SSOT principles, common mistakes to avoid
2. **[RESUME.md](../RESUME.md)** - Current state, next priorities, quick start checklist
3. **[docs/06-PROGRESS-TRACKING.md](../docs/06-PROGRESS-TRACKING.md)** - Phase tracking, task status, recent changes
4. **[docs/04-API-SPECIFICATION.md](../docs/04-API-SPECIFICATION.md)** - API endpoints, request/response formats
5. **[prisma/schema.prisma](../prisma/schema.prisma)** - Database schema (SSOT for all types)

---

## 🚨 Common Mistakes to AVOID

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

❌ **DON'T use blocking `alert()` calls**  
✅ **DO use** `toast.success()` / `toast.error()` (Sonner)

---

## 🛠️ Development Workflow

### Starting Development
```bash
# 1. Check git status
git status
git pull  # Ensure you have latest

# 2. Check for uncommitted changes
git log --oneline -5

# 3. Start dev server
npm run dev
# Should start on http://localhost:3000

# 4. Test build (optional but recommended)
npm run build

# 5. Check database connection
# Turso should auto-connect via .env.local
```

### During Development
1. **Read existing code** before modifying
2. **Follow SSOT principles** strictly
3. **Validate on both client and server**
4. **Test changes** in browser immediately
5. **Check for TypeScript errors** continuously
6. **Run build** before major commits: `npm run build`

### After Making Changes
```bash
# 1. Test the feature works
# 2. Check for console errors (F12 in browser)
# 3. Check for TypeScript errors
# 4. Build to verify no issues
npm run build

# 5. Commit with descriptive message
git add .
git commit -m "feat: add X feature

- Implemented Y
- Fixed Z
- Updated A"

# 6. Push to GitHub
git push
```

---

## 🧪 Testing Strategy

### Manual Testing Checklist
- [ ] Feature works in Chrome/Edge
- [ ] No console errors (F12 → Console tab)
- [ ] No network errors (F12 → Network tab)
- [ ] Mobile responsive (F12 → Device toolbar)
- [ ] Forms validate correctly
- [ ] Error messages display properly (toast notifications)
- [ ] Loading states show during async operations
- [ ] Data persists correctly (check database if needed)

### Build Verification
```bash
npm run build
# Should complete without errors
# TypeScript errors will fail the build
```

---

## 💬 Communication Style with User

### Always Ask First
- **Before starting work**: "What would you like to work on today?"
- **When unclear**: "Do you want me to [Option A] or [Option B]?"
- **Before major changes**: "This will affect [X, Y, Z]. Should I proceed?"
- **After completion**: "Feature X is complete. Would you like to test it or move to the next task?"

### Progress Updates
- **For quick tasks (<5 min)**: Just do it and report completion
- **For longer tasks (>5 min)**: Update every 2-3 steps
- **For multi-file changes**: List all files being modified

### Error Handling
- **If you encounter an error**: 
  1. Show the error to the user
  2. Explain what caused it
  3. Propose a solution
  4. Ask if they want you to fix it

---

## 📝 When to Update Documentation

Update documentation when:
- ✅ Completing a phase or major feature
- ✅ Fixing critical bugs
- ✅ Making architectural changes
- ✅ Adding new dependencies
- ✅ End of development session

**Use the documentation update prompt**: [.github/UPDATE-DOCS-PROMPT.md](UPDATE-DOCS-PROMPT.md)

---

## 🎯 Current Phase Details (Check RESUME.md for Updates)

### Phase 5: Polish & Deployment (NEXT)

**Priority 1: Admin Features** ⏳
- Admin dashboard layout
- User management (list, view, edit)
- User rankings table
- Comparison charts (all users)
- Admin statistics API

**Priority 2: Error Handling & UX** ⏳
- Graceful error boundaries
- Loading states for all async operations
- Empty states (no data scenarios)
- Form validation improvements
- Better error messages

**Priority 3: Mobile Optimization** ⏳
- Test on real devices
- Touch interaction improvements
- Responsive chart optimizations
- Mobile-specific UX tweaks

**Priority 4: Performance Tuning** ⏳
- Database query optimization
- Caching strategies
- Bundle size optimization
- Lighthouse score > 90

**Priority 5: Production Deployment** ⏳
- Vercel deployment
- Environment variables
- Domain configuration
- SSL certificate
- Monitoring setup

**Priority 6: Documentation** ⏳
- User guide
- Admin guide
- Developer setup guide

---

## 🔗 Quick Commands Reference

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run lint             # Run ESLint

# Database
npx prisma studio        # Open Prisma Studio (visual DB editor)
npx prisma db push       # Push schema changes to database
npx prisma generate      # Regenerate Prisma client
npm run db:seed          # Seed database with test data

# Git
git status               # Check current status
git log --oneline -10    # View recent commits
git diff                 # See uncommitted changes
git add .                # Stage all changes
git commit -m "message"  # Commit with message
git push                 # Push to GitHub

# Troubleshooting
rm -rf node_modules package-lock.json && npm install  # Reinstall dependencies
npx prisma generate      # Regenerate if Prisma types broken
```

---

## 🎓 Key Lessons from Previous Sessions

1. **Empty String Validation**: Always check for empty strings in optional filters before passing to Prisma
2. **Toast Notifications**: Use Sonner for modern, non-blocking UX (never use `alert()`)
3. **API Route Hot Reload**: Next.js sometimes doesn't hot-reload API routes - restart server if needed
4. **Prisma Type Safety**: Let Prisma generate types, extend them in `lib/types.ts` if needed
5. **Filter Persistence**: localStorage + URL params = excellent UX for stateful filters
6. **Moving Averages**: Handle edge cases where data < MA period (e.g., < 7 days for MA7)
7. **Chart Performance**: Recharts + ResponsiveContainer handles large datasets well
8. **Server Actions**: We're using API routes, not Next.js server actions (by design)
9. **Authentication**: Middleware handles auth, check `session.user.role` for admin routes
10. **Database**: Turso is serverless SQLite - queries are fast but avoid N+1 problems

---

## ✅ Pre-Flight Checklist

Before you start coding, verify:

- [ ] I've read RESUME.md
- [ ] I've checked git status
- [ ] I understand what phase we're on
- [ ] I've asked the user what they want to work on
- [ ] Dev server is running (npm run dev)
- [ ] I know which files I'll be modifying
- [ ] I understand the SSOT principles
- [ ] I'm ready to follow the coding guidelines

---

## 🚀 Ready to Start!

**Your first response should be:**

> "Hi! I've reviewed the project status. We're currently at **[PHASE]** with **[PERCENTAGE]%** completion.
> 
> Based on RESUME.md, the next priorities are:
> 1. [Priority 1]
> 2. [Priority 2]
> 3. [Priority 3]
> 
> What would you like to work on today?"

---

**End of Resume Prompt** - You now have full context to continue development!

---

## 📌 Version History

- **v1.0** (2026-01-09): Initial creation after Phase 4 completion
- Updated for Phase 5 readiness
