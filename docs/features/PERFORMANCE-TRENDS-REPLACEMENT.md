# Performance Trends Replacement

**Feature**: Enhanced Performance View  
**Version**: 1.4.0 (Planned)  
**Date**: January 28, 2026  
**Status**: In Development

---

## 📋 Overview

Replace the monthly performance chart in `/analytics/trends` with the comprehensive performance view currently used in the admin dashboard. This provides users with better visibility into their detailed trading metrics.

---

## 🎯 Current State vs. Target State

### Current State (Image 2)
**Page**: `/analytics/trends`  
**Component**: Monthly Performance Chart  
**Issues**:
- Limited information (only win rate by month)
- Empty chart for users with no trades
- Less actionable insights
- Duplicates functionality from dashboard charts

### Target State (Image 1)
**Source**: Admin Dashboard "Performance" button view  
**Features**:
- Detailed performance metrics in tabular format
- Comprehensive statistics (trades, win rate, SOP rate, P&L)
- Multiplier indicator (0x in example)
- Edit, Reset Password, Delete actions
- Clean, professional layout

---

## 🔧 Technical Implementation

### Files to Modify/Remove

#### Remove (Unused Code)
1. **Component**: `components/charts/MonthlyPerformanceChart.tsx` (if exists)
2. **Component**: `components/dashboard/PerformanceTrendsCard.tsx` (if specific to monthly chart)
3. **API**: Any endpoint specifically for monthly aggregation (if not used elsewhere)

#### Modify
1. **Page**: `app/(user)/analytics/trends/page.tsx`
   - Replace monthly chart with performance table
   - Use existing `TradesList` or create new `PerformanceTable` component

2. **Component**: Create `components/analytics/PerformanceTable.tsx`
   - Reuse design from admin performance view
   - Adapt for single-user view (no user selection)

### Data Structure

**API Endpoint**: Use existing `/api/stats/personal` or create `/api/analytics/performance`

**Response Format**:
```typescript
{
  success: true,
  data: {
    totalTrades: 3,
    winRate: 100.0,
    sopRate: 100.0,
    totalPnl: 41.22,
    multiplier: 0,        // Calculated from target achievement
    averageWin: 20.41,
    averageLoss: 0.00,
    largestWin: 25.00,
    largestLoss: 0.00,
    consecutiveWins: 3,
    consecutiveLosses: 0,
    bestSession: 'ASIA',
    worstSession: null,
    avgTradesPerDay: 1.5,
    tradingDays: 2,
    // Time period stats
    periodStart: '2026-01-26',
    periodEnd: '2026-01-28',
  }
}
```

---

## 🎨 UI Design

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  Performance Trends                                      │
│  Comprehensive analysis of your trading performance     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  [Filter Options]                                        │
│  Time Period: [Last 7 Days ▼] [Last 30 Days] [All Time]│
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Performance Summary                                     │
│  ┌──────────┬────────┬────────┬───────┬─────────┐      │
│  │ Trades   │ Win %  │ SOP %  │  P&L  │ Multi.. │      │
│  ├──────────┼────────┼────────┼───────┼─────────┤      │
│  │    3     │ 100.0% │ 100.0% │$41.22 │   0x    │      │
│  └──────────┴────────┴────────┴───────┴─────────┘      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Detailed Metrics                                        │
│  ┌─────────────────────┬─────────────────────┐         │
│  │ Average Win         │ $20.41              │         │
│  │ Average Loss        │ $0.00               │         │
│  │ Largest Win         │ $25.00              │         │
│  │ Largest Loss        │ $0.00               │         │
│  │ Consecutive Wins    │ 3 trades            │         │
│  │ Consecutive Losses  │ 0 trades            │         │
│  │ Best Session        │ ASIA                │         │
│  │ Worst Session       │ N/A                 │         │
│  │ Avg Trades/Day      │ 1.5                 │         │
│  │ Trading Days        │ 2 days              │         │
│  └─────────────────────┴─────────────────────┘         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Session Breakdown                                       │
│  [Chart: Performance by market session]                 │
└─────────────────────────────────────────────────────────┘
```

### Component Code Example

```tsx
// components/analytics/PerformanceTable.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PerformanceTableProps {
  data: {
    totalTrades: number;
    winRate: number;
    sopRate: number;
    totalPnl: number;
    multiplier: number;
    averageWin: number;
    averageLoss: number;
    largestWin: number;
    largestLoss: number;
    consecutiveWins: number;
    consecutiveLosses: number;
    bestSession: string;
    worstSession: string | null;
    avgTradesPerDay: number;
    tradingDays: number;
  };
}

export function PerformanceTable({ data }: PerformanceTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
          <CardDescription>
            Overall statistics for the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{data.totalTrades}</div>
              <div className="text-sm text-muted-foreground">Total Trades</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatPercent(data.winRate)}
              </div>
              <div className="text-sm text-muted-foreground">Win Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatPercent(data.sopRate)}
              </div>
              <div className="text-sm text-muted-foreground">SOP Rate</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                data.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(data.totalPnl)}
              </div>
              <div className="text-sm text-muted-foreground">Total P&L</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{data.multiplier}x</div>
              <div className="text-sm text-muted-foreground">Multiplier</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <MetricRow 
              label="Average Win" 
              value={formatCurrency(data.averageWin)} 
            />
            <MetricRow 
              label="Average Loss" 
              value={formatCurrency(Math.abs(data.averageLoss))} 
            />
            <MetricRow 
              label="Largest Win" 
              value={formatCurrency(data.largestWin)} 
            />
            <MetricRow 
              label="Largest Loss" 
              value={formatCurrency(Math.abs(data.largestLoss))} 
            />
            <MetricRow 
              label="Consecutive Wins" 
              value={`${data.consecutiveWins} trades`} 
            />
            <MetricRow 
              label="Consecutive Losses" 
              value={`${data.consecutiveLosses} trades`} 
            />
            <MetricRow 
              label="Best Session" 
              value={<Badge variant="outline">{data.bestSession}</Badge>} 
            />
            <MetricRow 
              label="Worst Session" 
              value={data.worstSession || 'N/A'} 
            />
            <MetricRow 
              label="Avg Trades/Day" 
              value={data.avgTradesPerDay.toFixed(1)} 
            />
            <MetricRow 
              label="Trading Days" 
              value={`${data.tradingDays} days`} 
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricRow({ 
  label, 
  value 
}: { 
  label: string; 
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-center py-2 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
```

---

## 📊 Data Aggregation Logic

### Calculation Methods

```typescript
// lib/services/performanceAnalyticsService.ts

export async function getPerformanceAnalytics(
  userId: string,
  startDate?: Date,
  endDate?: Date
) {
  const trades = await db
    .select()
    .from(individualTrades)
    .where(
      and(
        eq(individualTrades.userId, userId),
        startDate ? gte(individualTrades.tradeTimestamp, startDate) : undefined,
        endDate ? lte(individualTrades.tradeTimestamp, endDate) : undefined
      )
    )
    .orderBy(asc(individualTrades.tradeTimestamp));

  if (trades.length === 0) {
    return {
      totalTrades: 0,
      winRate: 0,
      sopRate: 0,
      totalPnl: 0,
      multiplier: 0,
      averageWin: 0,
      averageLoss: 0,
      largestWin: 0,
      largestLoss: 0,
      consecutiveWins: 0,
      consecutiveLosses: 0,
      bestSession: null,
      worstSession: null,
      avgTradesPerDay: 0,
      tradingDays: 0,
    };
  }

  // Calculate metrics
  const wins = trades.filter(t => t.result === 'WIN');
  const losses = trades.filter(t => t.result === 'LOSS');
  const sopFollowed = trades.filter(t => t.sopFollowed);

  const totalTrades = trades.length;
  const winRate = (wins.length / totalTrades) * 100;
  const sopRate = (sopFollowed.length / totalTrades) * 100;
  const totalPnl = trades.reduce((sum, t) => sum + t.profitLossUsd, 0);

  // Average win/loss
  const averageWin = wins.length > 0
    ? wins.reduce((sum, t) => sum + t.profitLossUsd, 0) / wins.length
    : 0;
  const averageLoss = losses.length > 0
    ? losses.reduce((sum, t) => sum + t.profitLossUsd, 0) / losses.length
    : 0;

  // Largest win/loss
  const largestWin = wins.length > 0
    ? Math.max(...wins.map(t => t.profitLossUsd))
    : 0;
  const largestLoss = losses.length > 0
    ? Math.min(...losses.map(t => t.profitLossUsd))
    : 0;

  // Consecutive wins/losses
  const { maxWins, maxLosses } = calculateConsecutiveStreaks(trades);

  // Best/worst session
  const sessionStats = calculateSessionStats(trades);
  const bestSession = sessionStats.best;
  const worstSession = sessionStats.worst;

  // Trading days
  const uniqueDays = new Set(
    trades.map(t => t.tradeTimestamp.toISOString().split('T')[0])
  );
  const tradingDays = uniqueDays.size;
  const avgTradesPerDay = totalTrades / tradingDays;

  // Multiplier (from target achievement - TBD)
  const multiplier = 0; // TODO: Calculate from target

  return {
    totalTrades,
    winRate,
    sopRate,
    totalPnl,
    multiplier,
    averageWin,
    averageLoss,
    largestWin,
    largestLoss,
    consecutiveWins: maxWins,
    consecutiveLosses: maxLosses,
    bestSession,
    worstSession,
    avgTradesPerDay,
    tradingDays,
  };
}

function calculateConsecutiveStreaks(trades: Trade[]) {
  let maxWins = 0;
  let maxLosses = 0;
  let currentWins = 0;
  let currentLosses = 0;

  for (const trade of trades) {
    if (trade.result === 'WIN') {
      currentWins++;
      currentLosses = 0;
      maxWins = Math.max(maxWins, currentWins);
    } else {
      currentLosses++;
      currentWins = 0;
      maxLosses = Math.max(maxLosses, currentLosses);
    }
  }

  return { maxWins, maxLosses };
}

function calculateSessionStats(trades: Trade[]) {
  const sessionGroups = trades.reduce((acc, trade) => {
    const session = trade.marketSession;
    if (!acc[session]) {
      acc[session] = { wins: 0, total: 0 };
    }
    acc[session].total++;
    if (trade.result === 'WIN') {
      acc[session].wins++;
    }
    return acc;
  }, {} as Record<string, { wins: number; total: number }>);

  let best = null;
  let worst = null;
  let bestRate = 0;
  let worstRate = 100;

  for (const [session, stats] of Object.entries(sessionGroups)) {
    const rate = (stats.wins / stats.total) * 100;
    if (rate > bestRate) {
      bestRate = rate;
      best = session;
    }
    if (rate < worstRate) {
      worstRate = rate;
      worst = session;
    }
  }

  return { best, worst };
}
```

---

## 🗑️ Cleanup Tasks

### Step 1: Identify Unused Code
```bash
# Search for monthly performance chart references
grep -r "MonthlyPerformanceChart" .
grep -r "monthly.*performance" . --include="*.tsx" --include="*.ts"
```

### Step 2: Remove Components
- [ ] `components/charts/MonthlyPerformanceChart.tsx`
- [ ] `components/charts/WinRateChart.tsx` (if only used in trends)
- [ ] Any monthly-specific API endpoints

### Step 3: Update Imports
- [ ] Remove imports in `app/(user)/analytics/trends/page.tsx`
- [ ] Remove imports from index files
- [ ] Update any storybook stories (if exist)

### Step 4: Database Cleanup
- [ ] Check if any monthly aggregation tables exist
- [ ] Remove if not used by other features

### Step 5: Update Tests
- [ ] Remove tests for deleted components
- [ ] Add tests for new `PerformanceTable` component

---

## 🚀 Implementation Plan

### Phase 1: Backend Preparation (Day 1)
1. Create `performanceAnalyticsService.ts`
2. Implement all calculation methods
3. Create API endpoint `/api/analytics/performance`
4. Add time period filtering
5. Write unit tests

### Phase 2: Frontend Component (Day 2)
1. Create `PerformanceTable.tsx` component
2. Add time period selector (Last 7/30 days, All time)
3. Implement loading states
4. Add error boundaries

### Phase 3: Page Replacement (Day 3)
1. Update `/analytics/trends/page.tsx`
2. Replace monthly chart with performance table
3. Add session breakdown chart below table
4. Test responsiveness

### Phase 4: Cleanup (Day 4)
1. Identify all unused components
2. Remove unused files
3. Update imports and exports
4. Remove unused API endpoints
5. Clean up CSS/styles
6. Update documentation

### Phase 5: Testing (Day 5)
1. Test with various data sets
2. Verify calculations accuracy
3. Test time period filters
4. Mobile responsiveness testing
5. Performance testing (large datasets)

---

## 🧪 Testing Checklist

### Functional Tests
- [ ] Performance table displays correct metrics
- [ ] Time period filter works (7 days, 30 days, all time)
- [ ] Empty state shows helpful message
- [ ] Calculations match manual verification
- [ ] Session breakdown chart displays correctly

### Data Accuracy Tests
- [ ] Win rate calculation verified
- [ ] SOP rate calculation verified
- [ ] P&L totals match individual trades
- [ ] Consecutive streaks calculated correctly
- [ ] Best/worst session identified correctly

### UI/UX Tests
- [ ] Responsive on mobile (320px+)
- [ ] Loads in < 1 second
- [ ] No layout shifts
- [ ] Accessible (keyboard navigation, screen readers)
- [ ] Matches Wekang brand styling

### Cleanup Verification
- [ ] No broken imports
- [ ] No unused components remain
- [ ] No console errors
- [ ] Build succeeds
- [ ] Bundle size decreased (due to removed code)

---

## 📈 Success Metrics

### User Engagement
- Increased time on /analytics/trends page
- Higher click-through from dashboard to trends
- Fewer support requests about performance tracking

### Technical Performance
- API response < 300ms
- Page load < 1 second
- Reduced bundle size by ~10-20KB (removed chart)

---

## 📝 Migration Notes

### For Users
- Old monthly chart removed
- New comprehensive view available
- All historical data preserved
- More detailed insights available

### For Developers
- Check `git blame` for removed files before deleting
- Archive removed components in `docs/archive/` if needed
- Update Storybook (if used)
- Update E2E tests

---

## 🔮 Future Enhancements

### Version 1.5.0+
- [ ] Export performance report as PDF
- [ ] Compare performance across time periods
- [ ] Goal tracking and progress indicators
- [ ] Custom metric definitions
- [ ] Performance forecasting (ML-based)

---

**Last Updated**: January 28, 2026  
**Feature Owner**: @Thewekang  
**Implementation Status**: Planning Phase
