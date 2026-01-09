# � Resume Development Guide

**Last Updated**: January 9, 2026  
**Last Session**: January 9, 2026  
**Current Phase**: Phase 5 (Polish & Deployment)  
**Next Task**: Admin Features

---

## ✅ Quick Start Checklist

Before coding, verify:

- [x] Dev server starts: `npm run dev`
- [x] Database connected (Turso)
- [x] Git status clean: `git status`
- [x] Node version correct: `node --version` (v18+)
- [x] Dependencies installed: `npm install`
- [x] Environment variables set (`.env.local`)

---

## 📍 Current State

### What's Working ✅
- **Phase 0**: Project setup (Next.js 15 + Turso + Prisma)
- **Phase 1**: Authentication (NextAuth.js v5, login/register)
- **Phase 2**: Individual trade tracking (real-time + bulk entry, pagination)
- **Phase 3**: Dashboard & Analytics (charts, heatmap, session insights)
- **Phase 4**: Advanced features (targets, trends, filtering, export)
- **All Core Features**: Fully functional and tested

### Known Issues ⚠️
- None - All bugs fixed ✅

### In Progress 🔨
- **Phase 5**: Awaiting start
  - Admin features (0% complete)
  - Error handling polish (0% complete)
  - Mobile optimization (0% complete)
  - Performance tuning (0% complete)
  - Production deployment (0% complete)

---

## 🎯 Next Priorities

### Immediate (This Session)
1. **Admin Features - User Management**
   - [ ] Create admin dashboard layout
   - [ ] User list with search/filter
   - [ ] User details view
   - [ ] User statistics cards
   - **Files to modify**: app/(admin)/dashboard/page.tsx, app/(admin)/users/page.tsx
   - **Estimated time**: 4 hours

2. **Admin Features - Rankings & Comparisons**
   - [ ] User rankings table
   - [ ] Comparison charts (win rate, profit/loss)
   - [ ] Admin statistics API
   - **Files to modify**: app/api/stats/admin/route.ts, components/admin/*
   - **Estimated time**: 3 hours

### Short-term (This Week)
- Error handling improvements
- Mobile optimization testing
- Performance profiling
- Deployment preparation

### Long-term (This Phase)
- Production deployment to Vercel
- User acceptance testing
- Documentation finalization
- Project handoff

---

## 🗺️ Context for AI Assistants

### Project Structure Reminder
```
Key Files:
├── lib/services/         # Business logic (SSOT)
│   ├── individualTradeService.ts
│   ├── dailySummaryService.ts
│   ├── statsService.ts
│   ├── targetService.ts
│   ├── trendAnalysisService.ts
│   └── exportService.ts
├── lib/validations.ts    # Zod schemas (SSOT)
├── lib/constants.ts      # Enums & constants (SSOT)
├── lib/types.ts          # TypeScript types (extended from Prisma)
├── app/api/              # API routes
└── components/           # React components
```

### Coding Principles
1. **SSOT**: Never duplicate types, validation, or constants
2. **Market Session**: Always auto-calculate server-side from UTC hour
3. **Daily Summary**: Auto-update on every trade change
4. **Validation**: Always client + server
5. **Mobile-first**: Real-time entry optimized for mobile
6. **Performance**: Use daily_summaries for dashboard stats

### Recent Changes to Remember
- Phase 4 completed with all advanced features
- CSV/PDF export working with proper validation
- Toast notifications using Sonner (non-blocking)
- Advanced filtering with presets and URL sync
- Target tracking with AI suggestions
- Performance trends with MA7/MA30 analysis

---

## 🔗 Quick Reference Links

- **GitHub Repo**: https://github.com/Thewekang/WekangTrading
- **Turso Dashboard**: https://turso.tech/
- **Design Docs**: `docs/` folder
- **Copilot Instructions**: `.github/copilot-instructions.md`
- **Progress Tracking**: `docs/06-PROGRESS-TRACKING.md`
- **API Spec**: `docs/04-API-SPECIFICATION.md`
- **Session Summary**: `docs/SESSION-SUMMARY-2026-01-09.md`

---

## 🧪 Testing Checklist

Before marking Phase 5 complete:

**Phase 5 Checklist**:
- [ ] Admin can view all users
- [ ] Admin can see user rankings
- [ ] Comparison charts working
- [ ] All errors handled gracefully
- [ ] Loading states implemented
- [ ] Empty states designed
- [ ] Mobile responsive tested
- [ ] Lighthouse score > 90
- [ ] Build succeeds: `npm run build`
- [ ] Production deployment successful

**Phase 4 Checklist** ✅ COMPLETE:
- [x] CSV export works (downloads file)
- [x] PDF export works (opens print dialog)
- [x] Toast notifications show properly
- [x] Filters apply correctly
- [x] No console errors
- [x] Mobile responsive
- [x] Build succeeds: `npm run build`

---

## 💾 Last Known Good State

**Commit**: bc6b419  
**Branch**: main  
**Server Running**: Yes (localhost:3000)  
**Build Status**: ✅ Passing  
**Test Coverage**: N/A

**If something breaks, rollback to**:
```bash
git checkout bc6b419
```

---

## 📞 When to Ask for Help

- Build fails after dependency update
- TypeScript errors in Prisma-generated types
- Authentication flow breaks
- Database migration fails
- Performance degrades significantly
- Vercel deployment issues

---

## 🎓 Lessons Learned This Session

1. **Empty String Validation**: Always check for empty strings in optional filters before passing to Prisma
2. **Toast Notifications**: Use Sonner for modern, non-blocking UX feedback
3. **PDF Generation**: Client-side HTML print is more serverless-friendly than Puppeteer
4. **Filter Persistence**: localStorage + URL params = great UX for filter states
5. **Moving Averages**: Handle edge cases where historical data < MA period
6. **Chart Performance**: Recharts handles large datasets well with ResponsiveContainer
7. **Seed Data**: Comprehensive test data is crucial for testing analytics features
8. **API Error Messages**: Specific error messages make debugging much easier

---

**Remember**: Check `.github/copilot-instructions.md` for full context before coding!
```typescript
// File: app/(user)/dashboard/page.tsx
- Query daily_summaries for statistics
- Calculate win rate, SOP rate, net P/L
- Display best performing session
- Show monthly/weekly trends
- Use existing StatCard components
```

**API Endpoint Needed**:
```typescript
// File: app/api/stats/personal/route.ts
GET /api/stats/personal
Response: {
  totalTrades: number,
  winRate: number,
  sopRate: number,
  netProfitLoss: number,
  bestSession: 'ASIA' | 'EUROPE' | 'US' | 'OVERLAP',
  weeklyTrend: Array<{date, trades, wins}>,
  monthlyTrend: Array<{month, trades, wins}>
}
```

**Service Function**:
```typescript
// File: lib/services/statsService.ts
export async function getPersonalStats(userId: string, timeframe?: string)
// Query daily_summaries, aggregate data, calculate trends
```

---

### Priority 2: Session Performance Charts
**Goal**: Visualize performance by market session

**What to Build**:
```typescript
// File: components/charts/SessionComparisonChart.tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
// Show win rate by session (ASIA, EUROPE, US, OVERLAP)
// Show total trades per session
// Show profit/loss by session
```

**API Endpoint Needed**:
```typescript
// File: app/api/stats/by-session/route.ts
GET /api/stats/by-session
Response: {
  sessions: Array<{
    session: string,
    totalTrades: number,
    wins: number,
    losses: number,
    winRate: number,
    profitLoss: number
  }>
}
```

---

### Priority 3: Hourly Performance Heatmap
**Goal**: Identify best trading hours

**What to Build**:
```typescript
// File: components/charts/HourlyHeatmap.tsx
// Visual heatmap showing win rate by hour (0-23)
// Color intensity based on win rate
// Tooltip showing trades count + win rate
```

**API Endpoint Needed**:
```typescript
// File: app/api/stats/by-hour/route.ts
GET /api/stats/by-hour
Response: {
  hours: Array<{
    hour: number,
    totalTrades: number,
    wins: number,
    winRate: number
  }>
}
```

---

## 🗂️ Key Files to Know

### Configuration
- `prisma/schema.prisma` - Database schema (SSOT)
- `lib/validations.ts` - Zod schemas (form vs API)
- `lib/constants.ts` - Constants and enums
- `lib/auth.ts` - NextAuth configuration

### Core Services
- `lib/services/individualTradeService.ts` - Trade CRUD
- `lib/services/dailySummaryService.ts` - Auto-update summaries
- `lib/utils/marketSessions.ts` - Session calculator

### Database
- `prisma/dev.db` - Local SQLite database
- Run `npm run db:studio` to view data in browser

---

## 🚀 Quick Start Commands

```bash
# Start development server
npm run dev

# View database
npm run db:studio

# Run migrations
npm run db:migrate

# Check for errors
npm run lint

# Build for production
npm run build
```

---

## 📊 Current Database State

**Tables in Use**:
- `users` - 5 test users
- `individual_trades` - User trades with timestamps
- `daily_summaries` - Auto-calculated aggregates
- `sessions` - NextAuth sessions

**Sample Data**: Use `npm run db:seed` to add test trades

---

## 🔧 Technical Notes

### Type Safety
- Form schemas: Accept `Date` objects
- API schemas: Transform `string` → `Date`
- Never use `any` type - always explicit types

### Validation Pattern
```typescript
// Form validation
const form = useForm({ resolver: zodResolver(individualTradeSchema) });

// API validation
const validatedData = individualTradeApiSchema.parse(body);
```

### Market Session Logic
```typescript
// ASIA: 00:00-09:00 UTC
// EUROPE: 07:00-16:00 UTC
// US: 13:00-22:00 UTC
// OVERLAP: When sessions overlap
calculateMarketSession(timestamp) // Auto-calculated server-side
```

### Daily Summary Auto-Update
- Triggered after trade INSERT/UPDATE/DELETE
- Aggregates all trades for userId + date
- Upserts into daily_summaries table
- Never manually create summaries

---

## 🎯 When You Resume

1. **Start dev server**: `npm run dev`
2. **Choose a feature**: Start with Priority 1 (Dashboard Statistics)
3. **Create service function**: Add to `lib/services/statsService.ts`
4. **Create API endpoint**: Add to `app/api/stats/personal/route.ts`
5. **Update dashboard**: Modify `app/(user)/dashboard/page.tsx`
6. **Test with real data**: Use existing trades or add via forms

---

## 📝 Commit History

**Latest Commits**:
1. `6685daa` - docs: Update documentation for Phase 2 completion
2. `9bf2fb2` - Phase 2 Complete: Individual Trade Features

**Branch**: `main`  
**Remote**: https://github.com/Thewekang/WekangTrading.git

---

## 💡 Tips for Phase 3

1. **Use daily_summaries**: Faster than querying individual_trades
2. **Recharts documentation**: https://recharts.org/en-US/
3. **Test with filters**: Use date range to limit data
4. **Mobile responsive**: Test charts on mobile viewport
5. **Loading states**: Always show loading spinner during data fetch

---

**Ready to continue? Start with Priority 1: Dashboard Statistics** 🚀
