# Phase 2 Implementation Plan - Database Optimization 🗄️

**Date**: January 20, 2026  
**Branch**: `feature/performance-optimization`  
**Phase**: 2 of 5 (Database Optimization)  
**Duration**: 2-3 days  
**Dependencies**: Phase 1 Complete ✅

---

## 🎯 Phase 2 Objectives

### Primary Goals
1. **Add 5 Critical Composite Indexes** - Optimize slow queries
2. **Refactor statsService** - Use only daily_summaries for dashboard
3. **Implement Incremental Updates** - Avoid full recalculation
4. **Add Query Result Caching** - Reduce duplicate queries

### Expected Performance Gains
- **Dashboard Load**: 60-80% faster (200ms → 40-80ms)
- **TradesList Filtering**: 70% faster with composite indexes
- **Badge Progress**: 80-90% faster with incremental updates
- **Stats API**: 50-70% faster using aggregates only

---

## 📋 Task Breakdown

### Task 1: Add Composite Indexes (CRITICAL)

#### 1.1 idx_trades_user_timestamp_result
**Purpose**: Speed up TradesList filtering by user + date range + result  
**Query Optimized**: 
```typescript
// TradesList component filters
db.select().from(individualTrades)
  .where(
    and(
      eq(individualTrades.userId, userId),
      gte(individualTrades.tradeTimestamp, startDate),
      lte(individualTrades.tradeTimestamp, endDate),
      eq(individualTrades.result, 'WIN') // Optional filter
    )
  )
```

**Current**: Sequential scan on userId, then timestamp, then result  
**After Index**: Single index lookup  
**Expected Speed**: 70-80% faster

#### 1.2 idx_summary_user_date
**Purpose**: Optimize daily summary queries for date ranges  
**Query Optimized**:
```typescript
// Dashboard 7-day/30-day trends
db.select().from(dailySummaries)
  .where(
    and(
      eq(dailySummaries.userId, userId),
      gte(dailySummaries.tradeDate, startDate),
      lte(dailySummaries.tradeDate, endDate)
    )
  )
```

**Current**: Uses existing userDateIdx but not optimal for ranges  
**After Index**: Optimized for range queries  
**Expected Speed**: 40-50% faster

#### 1.3 idx_user_badges_user_earned
**Purpose**: Speed up badge progress queries  
**Query Optimized**:
```typescript
// Badge list with earned status
db.select().from(userBadges)
  .where(
    and(
      eq(userBadges.userId, userId),
      eq(userBadges.notified, false)
    )
  )
  .orderBy(desc(userBadges.earnedAt))
```

**Current**: Only has userIdIdx, then filters notified  
**After Index**: Combined lookup  
**Expected Speed**: 60% faster

#### 1.4 idx_trades_user_date_result (Streak Calculation)
**Purpose**: Optimize streak calculations  
**Query Optimized**:
```typescript
// Get trades for specific date with result
db.select().from(individualTrades)
  .where(
    and(
      eq(individualTrades.userId, userId),
      sql`DATE(${individualTrades.tradeTimestamp}) = DATE(${targetDate})`,
      eq(individualTrades.result, 'WIN')
    )
  )
```

**Current**: Full table scan with date function  
**After Index**: Faster filtering  
**Expected Speed**: 50-60% faster

#### 1.5 idx_trades_user_session
**Purpose**: Session analysis performance  
**Query Optimized**:
```typescript
// Session breakdown stats
db.select().from(individualTrades)
  .where(
    and(
      eq(individualTrades.userId, userId),
      eq(individualTrades.marketSession, 'ASIA')
    )
  )
```

**Current**: Uses marketSessionIdx but not combined with user  
**After Index**: Combined user + session lookup  
**Expected Speed**: 50% faster

---

### Task 2: Refactor statsService for Aggregates Only

#### Current Problem
statsService queries `individual_trades` directly for dashboard stats, which is slow for users with 100+ trades.

#### Solution
Refactor to use ONLY `daily_summaries` table:

**Functions to Refactor**:
1. `getPersonalStats()` - Use SUM() over daily_summaries
2. `getSessionBreakdown()` - Aggregate session columns
3. `getDailyTrends()` - Already uses daily_summaries ✅
4. `getHourlyStats()` - Move to separate endpoint (Phase 3)

**Implementation**:
```typescript
// BEFORE (Slow - queries 1000+ rows)
const trades = await db.select().from(individualTrades)
  .where(eq(individualTrades.userId, userId));
const totalWins = trades.filter(t => t.result === 'WIN').length;

// AFTER (Fast - queries 30-90 rows)
const summaries = await db.select({
  totalWins: sum(dailySummaries.totalWins),
  totalTrades: sum(dailySummaries.totalTrades)
}).from(dailySummaries)
  .where(eq(dailySummaries.userId, userId));
```

**Expected Impact**: 60-80% faster dashboard load

---

### Task 3: Implement Incremental Daily Summary Updates

#### Current Problem
`updateDailySummary()` recalculates ALL trades for a date, even when only 1 trade changes.

#### Solution: Incremental Update Pattern

**For INSERT**:
```typescript
// Instead of recalculating from scratch, just ADD to existing summary
const existingSummary = await getDailySummary(userId, tradeDate);
await db.update(dailySummaries)
  .set({
    totalTrades: existingSummary.totalTrades + 1,
    totalWins: existingSummary.totalWins + (result === 'WIN' ? 1 : 0),
    // ... increment other fields
  });
```

**For UPDATE**:
```typescript
// Subtract old trade values, add new trade values
const oldTrade = await getOldTradeValues(tradeId);
const delta = calculateDelta(oldTrade, newTrade);
await db.update(dailySummaries).set(delta);
```

**For DELETE**:
```typescript
// Subtract deleted trade values
await db.update(dailySummaries)
  .set({
    totalTrades: sql`${dailySummaries.totalTrades} - 1`,
    totalWins: sql`${dailySummaries.totalWins} - ${trade.result === 'WIN' ? 1 : 0}`,
  });
```

**Expected Impact**: 90% faster daily summary updates (10ms vs 100ms)

---

### Task 4: Add Query Result Caching (Optional)

#### Targets for Caching
1. **Badge definitions** - Cache for 1 hour (rarely changes)
2. **SOP types** - Cache for 1 hour (rarely changes)
3. **Daily summaries** - Cache for 5 minutes (changes on trade entry)

**Implementation**:
```typescript
// Simple in-memory cache with TTL
const cache = new Map<string, { data: any; expires: number }>();

function getCached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    return Promise.resolve(cached.data);
  }
  return fetcher().then(data => {
    cache.set(key, { data, expires: Date.now() + ttlMs });
    return data;
  });
}
```

**Expected Impact**: 20-30% faster for repeated queries

---

## 🚀 Implementation Steps

### Step 1: Add Indexes to Schema
1. Modify `lib/db/schema/trades.ts` - Add 3 new composite indexes
2. Modify `lib/db/schema/summaries.ts` - Enhance existing index
3. Modify `lib/db/schema/badges.ts` - Add composite index
4. Generate migration: `npm run drizzle:generate`
5. Apply migration: `npm run drizzle:push`

### Step 2: Refactor statsService
1. Backup current implementation
2. Refactor `getPersonalStats()` to use aggregates
3. Refactor `getSessionBreakdown()` to use aggregates
4. Remove direct `individual_trades` queries
5. Test with sample data

### Step 3: Implement Incremental Updates
1. Refactor `updateDailySummary()` function
2. Add `incrementDailySummary()` helper
3. Add `decrementDailySummary()` helper
4. Add `adjustDailySummary()` helper (for updates)
5. Update all trade CRUD operations
6. Test with edge cases

### Step 4: Testing
1. Run `npm run build` - Verify no TypeScript errors
2. Test dashboard load speed (before/after comparison)
3. Test TradesList filtering performance
4. Test badge progress queries
5. Test streak calculations
6. Verify data accuracy (summaries match individual trades)

---

## 📊 Success Criteria

| Metric | Current | Target | How to Measure |
|--------|---------|--------|----------------|
| Dashboard Load | 200-300ms | 40-80ms | Chrome DevTools Network tab |
| TradesList Filter | 100-150ms | 30-40ms | Console.time() in component |
| Badge Progress | 80-120ms | 15-25ms | API response time |
| Daily Summary Update | 100ms | 10ms | Service function timing |
| Stats API | 150-200ms | 50-70ms | API route response time |

**Overall Target**: 60-80% performance improvement in database operations

---

## ⚠️ Risk Assessment

### Low Risk ✅
- Adding indexes (non-breaking, can be rolled back)
- Query result caching (optional feature)

### Medium Risk ⚠️
- Refactoring statsService (requires thorough testing)
- May need to update API response types

### High Risk 🔴
- Incremental daily summary updates (data accuracy critical)
- Must ensure summaries always match individual trades
- Need comprehensive tests for edge cases

---

## 🧪 Testing Strategy

### Unit Tests
- Test incremental update calculations
- Test delta calculations for updates
- Test edge cases (first trade, last trade, date boundaries)

### Integration Tests
- Compare full recalc vs incremental results
- Verify summaries match after 100 operations
- Test concurrent trade updates

### Performance Tests
- Benchmark queries before/after indexes
- Measure dashboard load with 1000+ trades
- Test pagination with large datasets

---

## 📝 Documentation Updates

### Files to Update
1. **02-SYSTEM-ARCHITECTURE.md** - Database optimization section
2. **03-DATABASE-SCHEMA.md** - New indexes documentation
3. **PHASE-2-SUMMARY.md** - Create after completion
4. **SELECT-STAR-OPTIMIZATION-REPORT.md** - Update with Phase 2 findings

---

## 🔄 Rollback Plan

If Phase 2 causes issues:

```bash
# Rollback indexes (if needed)
git revert HEAD~1

# Revert migration
drizzle-kit drop

# Restore previous statsService
git checkout HEAD~1 -- lib/services/statsService.ts
```

**Data Safety**: All changes are additive or optimizations only. No data loss risk.

---

## 📅 Timeline

| Day | Tasks | Duration |
|-----|-------|----------|
| Day 1 | Add indexes + generate migration + apply | 3-4 hours |
| Day 1-2 | Refactor statsService + testing | 5-6 hours |
| Day 2 | Implement incremental updates + testing | 6-8 hours |
| Day 2-3 | Comprehensive testing + fixes | 4-5 hours |
| Day 3 | Documentation + commit | 2-3 hours |

**Total**: 20-26 hours (2-3 working days)

---

**Status**: 📋 PLANNED  
**Next Action**: Add composite indexes to schema files  
**Previous Phase**: Phase 1 (Quick Wins) ✅ COMPLETE

