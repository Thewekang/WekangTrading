# Version 1.4.0 Roadmap

**Release Target**: February 5, 2026 (1 week)  
**Status**: Planning → Development  
**Branch**: `feature/user-ranking-and-performance-update`

---

## 📋 Release Overview

Version 1.4.0 focuses on enhancing user experience with performance insights:
1. **Anonymous User Ranking System**: Let users see their relative performance
2. **Enhanced Performance Trends**: Replace monthly chart with comprehensive performance view

---

## 🎯 Features

### Feature 1: User Ranking System
**Priority**: HIGH  
**Effort**: 3-4 days  
**Owner**: @Thewekang

**User Story**:
> As a trader, I want to see my ranking among all users so I can understand my relative performance without knowing who the other traders are.

**Acceptance Criteria**:
- [x] User sees their rank position (e.g., "Rank #2 of 5 traders")
- [x] No other users' identities revealed
- [x] Ranking based on Win Rate → SOP Rate → P&L
- [x] Minimum 10 trades required for ranking
- [x] Display prominently on dashboard
- [x] Show percentile (e.g., "Top 40%")
- [x] Indicate rank changes (up/down from last calculation)

**Technical Requirements**:
- New table: `user_rankings`
- New service: `lib/services/rankingService.ts`
- New API: `GET /api/stats/ranking`
- New component: `components/dashboard/RankingCard.tsx`
- Background job: Calculate rankings every hour

**Documentation**: [USER-RANKING-SYSTEM.md](./USER-RANKING-SYSTEM.md)

---

### Feature 2: Performance Trends Replacement
**Priority**: HIGH  
**Effort**: 4-5 days  
**Owner**: @Thewekang

**User Story**:
> As a trader, I want to see detailed performance metrics instead of just a monthly chart, so I can better understand my trading patterns.

**Acceptance Criteria**:
- [x] Monthly performance chart removed from `/analytics/trends`
- [x] Comprehensive performance table added (like admin view)
- [x] Shows: Trades, Win %, SOP %, P&L, Multiplier
- [x] Detailed metrics: Avg Win/Loss, Largest Win/Loss, Streaks
- [x] Session breakdown included
- [x] Time period filter (Last 7/30 days, All time)
- [x] All unused chart code removed

**Technical Requirements**:
- New service: `lib/services/performanceAnalyticsService.ts`
- New API: `GET /api/analytics/performance`
- New component: `components/analytics/PerformanceTable.tsx`
- Update page: `app/(user)/analytics/trends/page.tsx`
- Remove: `components/charts/MonthlyPerformanceChart.tsx`

**Documentation**: [PERFORMANCE-TRENDS-REPLACEMENT.md](./PERFORMANCE-TRENDS-REPLACEMENT.md)

---

## 📅 Sprint Schedule

### Week 1: January 28 - February 5, 2026

#### Day 1-2: User Ranking System (Backend) ✅ COMPLETED
- [x] Create database migration for `user_rankings` table
- [x] Implement `rankingService.ts` with calculation logic
- [x] Create API endpoint `/api/stats/ranking`
- [x] Write unit tests for ranking calculations
- [x] Test with seed data (multiple users)

#### Day 3: User Ranking System (Frontend) ✅ COMPLETED
- [x] Create `RankingCard.tsx` component
- [x] Integrate in dashboard page
- [x] Add loading states and error handling
- [x] Style with Wekang brand colors
- [x] Test responsiveness

#### Day 4-5: Performance Analytics (Backend & Frontend) 🔄 IN PROGRESS
- [ ] Create `performanceAnalyticsService.ts`
- [ ] Implement all calculation methods
- [ ] Create API endpoint `/api/analytics/performance`
- [ ] Add time period filtering
- [ ] Create `MonthlyPerformanceView.tsx` component
- [ ] Add year/month selector
- [ ] Implement loading states

#### Day 6: Integration & Cleanup
- [ ] Replace monthly chart in `/analytics/trends`
- [ ] Remove unused components
- [ ] Clean up imports and exports
- [ ] Update documentation
- [ ] Remove unused API endpoints

#### Day 7: Testing & Deployment
- [ ] Full functional testing
- [ ] Mobile responsiveness testing
- [ ] Performance testing
- [ ] Update CHANGELOG.md
- [ ] Create PR to develop
- [ ] Deploy to staging
- [ ] Final verification

---

## 🏗️ Technical Architecture

### New Database Tables

```sql
-- user_rankings table
CREATE TABLE user_rankings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  total_users INTEGER NOT NULL,
  win_rate REAL NOT NULL,
  sop_rate REAL NOT NULL,
  total_pnl REAL NOT NULL,
  total_trades INTEGER NOT NULL,
  percentile REAL NOT NULL,
  calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_rankings_user_id ON user_rankings(user_id);
CREATE INDEX idx_user_rankings_calculated_at ON user_rankings(calculated_at);
```

### New API Endpoints

1. **GET /api/stats/ranking**
   - Returns: User's ranking data
   - Auth: Required (user only sees their own rank)
   - Cache: 1 hour

2. **GET /api/analytics/performance**
   - Query: `?startDate=2026-01-01&endDate=2026-01-28`
   - Returns: Comprehensive performance metrics
   - Auth: Required
   - Cache: 5 minutes

### New Services

1. **lib/services/rankingService.ts**
   ```typescript
   export async function getUserRanking(userId: string)
   export async function calculateAllRankings()
   export async function updateRankings() // Background job
   ```

2. **lib/services/performanceAnalyticsService.ts**
   ```typescript
   export async function getPerformanceAnalytics(
     userId: string, 
     startDate?: Date, 
     endDate?: Date
   )
   ```

### New Components

1. **components/dashboard/RankingCard.tsx**
   - Shows user rank, percentile, metrics
   - Gold theme (Wekang brand)
   - Trophy icon

2. **components/analytics/PerformanceTable.tsx**
   - Summary metrics
   - Detailed metrics
   - Time period filter

---

## 🔒 Privacy & Security

### Ranking System
- ✅ Never expose other users' names/emails
- ✅ Only show aggregate counts
- ✅ Require authentication for API access
- ✅ Cache results to prevent tracking
- ✅ SQL injection prevention

### Performance Analytics
- ✅ User can only view their own data
- ✅ Admin can view all users (existing permission)
- ✅ Rate limiting on API endpoints

---

## 🧪 Testing Strategy

### Unit Tests
- [ ] Ranking calculation logic
- [ ] Performance analytics calculations
- [ ] Tie-breaking algorithm
- [ ] Consecutive streak calculation
- [ ] Session stats calculation

### Integration Tests
- [ ] API endpoints return correct data
- [ ] Authentication works correctly
- [ ] Cache invalidation works
- [ ] Background jobs execute

### E2E Tests
- [ ] User sees ranking on dashboard
- [ ] Performance table loads correctly
- [ ] Time period filter works
- [ ] Mobile layout works

### Performance Tests
- [ ] Ranking calculation < 1 minute (all users)
- [ ] API response < 300ms
- [ ] Page load < 1 second
- [ ] No memory leaks

---

## 📊 Success Metrics

### User Engagement
- Dashboard page views +20%
- Analytics page views +30%
- Average session time +15%
- Feature adoption rate >80%

### Technical Performance
- API P95 latency < 500ms
- Zero privacy violations
- No performance regressions
- Bundle size increase < 50KB

### Business Impact
- User satisfaction score +10%
- Feature request backlog -2 items
- Support tickets related to performance insights -50%

---

## 🚨 Risks & Mitigation

### Risk 1: Privacy Breach
**Impact**: HIGH  
**Probability**: LOW  
**Mitigation**:
- Thorough code review
- Security audit of API endpoints
- Unit tests for privacy rules
- Manual verification with test users

### Risk 2: Performance Issues with Large Datasets
**Impact**: MEDIUM  
**Probability**: MEDIUM  
**Mitigation**:
- Database indexing
- Query optimization
- Caching strategy
- Pagination if needed

### Risk 3: Calculation Accuracy
**Impact**: HIGH  
**Probability**: LOW  
**Mitigation**:
- Comprehensive unit tests
- Manual verification with known datasets
- Cross-check with existing dashboard stats
- Beta testing with real users

### Risk 4: User Confusion
**Impact**: LOW  
**Probability**: MEDIUM  
**Mitigation**:
- Clear UI labels and descriptions
- Tooltips explaining metrics
- Help documentation
- In-app guidance

---

## 📦 Deliverables

### Code
- [ ] Database migrations
- [ ] Service layer implementations
- [ ] API endpoints
- [ ] React components
- [ ] Unit tests
- [ ] Integration tests

### Documentation
- [x] USER-RANKING-SYSTEM.md
- [x] PERFORMANCE-TRENDS-REPLACEMENT.md
- [x] Version 1.4.0 Roadmap
- [ ] API documentation updates
- [ ] User guide updates
- [ ] CHANGELOG.md entry

### Deployment
- [ ] Staging deployment
- [ ] Production deployment
- [ ] Database migration scripts
- [ ] Environment variables (if needed)
- [ ] Rollback plan

---

## 🔄 Rollback Plan

If critical issues arise after deployment:

### Step 1: Immediate Actions
1. Revert PR from main branch
2. Deploy previous version (v1.3.1)
3. Communicate issue to stakeholders

### Step 2: Database Rollback
```sql
-- Drop new table if needed
DROP TABLE IF EXISTS user_rankings;
```

### Step 3: Investigation
1. Review error logs
2. Identify root cause
3. Create hotfix branch
4. Test fix thoroughly
5. Redeploy

### Step 4: Communication
- Notify users of temporary rollback
- Provide timeline for fix
- Keep users informed of progress

---

## ✅ Definition of Done

A feature is considered "done" when:
- [ ] Code complete and reviewed
- [ ] All tests passing (unit, integration, E2E)
- [ ] Documentation updated
- [ ] Deployed to staging and verified
- [ ] Performance benchmarks met
- [ ] Security review passed
- [ ] Accessibility standards met
- [ ] Mobile responsive
- [ ] Browser compatibility verified
- [ ] CHANGELOG.md updated
- [ ] Ready for production deployment

---

## 📞 Stakeholders

**Product Owner**: @Thewekang  
**Developer**: @Thewekang (with GitHub Copilot)  
**Testers**: @Thewekang + Beta users  
**Reviewers**: Self-review + automated checks

---

## 🎓 Lessons Learned (Post-Release)

*To be filled after deployment*

### What Went Well
- TBD

### What Could Be Improved
- TBD

### Action Items for Next Release
- TBD

---

**Created**: January 28, 2026  
**Last Updated**: January 28, 2026  
**Status**: ✅ Planning Complete, Ready for Development
