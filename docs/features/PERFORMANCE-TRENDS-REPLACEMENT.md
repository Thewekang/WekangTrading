# Performance Trends Replacement

**Feature**: Enhanced Performance View  
**Version**: 1.4.0  
**Date**: January 28, 2026  
**Status**: ✅ Completed

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
**Source**: Admin Dashboard "Performance" button view (style reference)  
**Features**:
- Clean, professional modal layout style
- Monthly breakdown cards showing performance by month
- Year/Month toggle for time period selection
- Comprehensive statistics per month (Win Rate, SOP Rate, P&L)
- Color-coded cards (orange for P&L, green for Win Rate, blue for SOP Rate, purple for Total Trades)
- Summary metrics at the top (2026 P/L, Win Rate, SOP Rate, Total Trades)
- Legend for chart metrics

---

## 🔧 Technical Implementation

### Files to Modify/Remove

#### Remove (Unused Code)
1. **Component**: `components/charts/MonthlyPerformanceChart.tsx` (if exists)
2. **Component**: `components/dashboard/PerformanceTrendsCard.tsx` (if specific to monthly chart)
3. **API**: Any endpoint specifically for monthly aggregation (if not used elsewhere)

#### Modify
1. **Page**: `app/(user)/analytics/trends/page.tsx`
   - Replace monthly chart with monthly performance card view
   - Match style from admin performance modal

2. **Component**: Create `components/analytics/MonthlyPerformanceView.tsx`
   - Reuse card layout design from admin performance modal
   - 4-column summary cards (P/L, Win Rate, SOP Rate, Total Trades)
   - 4-column monthly grid showing all 12 months
   - Year/Month toggle and year selector
   - Color-coded cards (orange, green, blue, purple)

### Data Structure

**API Endpoint**: Use existing `/api/stats/personal` or create `/api/analytics/performance`

**Response Format**:
```typescript
{
  success: true,
  data: {
    year: 2026,
    overview: {
      totalPnl: 41.22,
      winRate: 100.0,
      sopRate: 100.0,
      totalTrades: 3,
      winLossRecord: "W:3 L:0"
    },
    monthlyBreakdown: [
      {
        month: 'Jan',
        monthNumber: 1,
        winRate: 100.0,
        sopRate: 100.0,
        pnl: 41.22,
        trades: 3,
        hasData: true
      },
      {
        month: 'Feb',
        monthNumber: 2,
        winRate: 0,
        sopRate: 0,
        pnl: 0,
        trades: 0,
        hasData: false
      },
      // ... other months
    ]
  }
}
```

---

## 🎨 UI Design

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  User's Performance                                      │
│  2026 Overview                                           │
│                                      [Month] [Year] 2026▼│
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Summary Cards (4-column grid)                           │
│  ┌───────────┬───────────┬───────────┬───────────┐      │
│  │ 2026 P/L  │ Win Rate  │ SOP Rate  │Total Trade│      │
│  │  $+41.22  │  100.0%   │  100.0%   │     3     │      │
│  │  (orange) │  (green)  │  (blue)   │ (purple)  │      │
│  │           │ 3/3 trades│ 3/3 trades│ W:3 L:0   │      │
│  └───────────┴───────────┴───────────┴───────────┘      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Legend: □ Win Rate  □ SOP Rate  □ P/L (USD)            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Monthly Breakdown (4-column grid)                       │
│  ┌─────────┬─────────┬─────────┬─────────┐             │
│  │   Jan   │   Feb   │   Mar   │   Apr   │             │
│  │ WR:100% │No trades│No trades│No trades│             │
│  │ SOP:100%│         │         │         │             │
│  │ P/L:+41 │         │         │         │             │
│  ├─────────┼─────────┼─────────┼─────────┤             │
│  │   May   │   Jun   │   Jul   │   Aug   │             │
│  │No trades│No trades│No trades│No trades│             │
│  │         │         │         │         │             │
│  │         │         │         │         │             │
│  ├─────────┼─────────┼─────────┼─────────┤             │
│  │   Sep   │   Oct   │   Nov   │   Dec   │             │
│  │No trades│No trades│No trades│No trades│             │
│  │         │         │         │         │             │
│  │         │         │         │         │             │
│  └─────────┴─────────┴─────────┴─────────┘             │
└─────────────────────────────────────────────────────────┘
```

### Component Code Example

```tsx
// components/analytics/MonthlyPerformanceView.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MonthlyData {
  month: string;
  monthNumber: number;
  winRate: number;
  sopRate: number;
  pnl: number;
  trades: number;
  hasData: boolean;
}

interface MonthlyPerformanceViewProps {
  year: number;
  overview: {
    totalPnl: number;
    winRate: number;
    sopRate: number;
    totalTrades: number;
    winLossRecord: string;
  };
  monthlyBreakdown: MonthlyData[];
}

export function MonthlyPerformanceView({ year, overview, monthlyBreakdown }: MonthlyPerformanceViewProps) {
  const formatCurrency = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}$${value.toFixed(2)}`;
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Your Performance</h2>
          <p className="text-muted-foreground">{year} Overview</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">Month</Button>
          <Button variant="default" size="sm">Year</Button>
          <Select defaultValue={year.toString()}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-orange-500 bg-orange-50">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">{year} P/L</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              overview.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(overview.totalPnl)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 bg-green-50">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Win Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatPercent(overview.winRate)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(overview.winRate * overview.totalTrades / 100)} wins / {overview.totalTrades} trades
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 bg-blue-50">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">SOP Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatPercent(overview.sopRate)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(overview.sopRate * overview.totalTrades / 100)} SOP / {overview.totalTrades} trades
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 bg-purple-50">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Total Trades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {overview.totalTrades}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {overview.winLossRecord}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Win Rate (%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>SOP Rate</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-500 rounded"></div>
          <span>P/L (USD)</span>
        </div>
      </div>

      {/* Monthly Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {monthlyBreakdown.map((month) => (
          <Card key={month.monthNumber} className={month.hasData ? '' : 'opacity-50'}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{month.month}</CardTitle>
            </CardHeader>
            <CardContent>
              {month.hasData ? (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Win Rate:</span>
                    <span className="font-medium text-green-600">
                      {formatPercent(month.winRate)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">SOP Rate:</span>
                    <span className="font-medium text-blue-600">
                      {formatPercent(month.sopRate)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">P/L:</span>
                    <span className={`font-medium ${
                      month.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(month.pnl)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground py-4">
                  No trades
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

---

## 📊 Data Aggregation Logic

### Calculation Methods

```typescript
// lib/services/performanceAnalyticsService.ts

export async function getMonthlyPerformance(
  userId: string,
  year: number
) {
  const startDate = new Date(year, 0, 1); // Jan 1
  const endDate = new Date(year, 11, 31, 23, 59, 59); // Dec 31

  const trades = await db
    .select()
    .from(individualTrades)
    .where(
      and(
        eq(individualTrades.userId, userId),
        gte(individualTrades.tradeTimestamp, startDate),
        lte(individualTrades.tradeTimestamp, endDate)
      )
    )
    .orderBy(asc(individualTrades.tradeTimestamp));

  // Calculate overview
  const totalTrades = trades.length;
  const wins = trades.filter(t => t.result === 'WIN').length;
  const losses = trades.filter(t => t.result === 'LOSS').length;
  const sopFollowed = trades.filter(t => t.sopFollowed).length;
  const totalPnl = trades.reduce((sum, t) => sum + t.profitLossUsd, 0);

  const overview = {
    totalPnl,
    winRate: totalTrades > 0 ? (wins / totalTrades) * 100 : 0,
    sopRate: totalTrades > 0 ? (sopFollowed / totalTrades) * 100 : 0,
    totalTrades,
    winLossRecord: `W:${wins} L:${losses}`
  };

  // Calculate monthly breakdown
  const monthlyBreakdown = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let month = 0; month < 12; month++) {
    const monthTrades = trades.filter(t => 
      t.tradeTimestamp.getMonth() === month
    );

    if (monthTrades.length === 0) {
      monthlyBreakdown.push({
        month: monthNames[month],
        monthNumber: month + 1,
        winRate: 0,
        sopRate: 0,
        pnl: 0,
        trades: 0,
        hasData: false
      });
    } else {
      const monthWins = monthTrades.filter(t => t.result === 'WIN').length;
      const monthSop = monthTrades.filter(t => t.sopFollowed).length;
      const monthPnl = monthTrades.reduce((sum, t) => sum + t.profitLossUsd, 0);

      monthlyBreakdown.push({
        month: monthNames[month],
        monthNumber: month + 1,
        winRate: (monthWins / monthTrades.length) * 100,
        sopRate: (monthSop / monthTrades.length) * 100,
        pnl: monthPnl,
        trades: monthTrades.length,
        hasData: true
      });
    }
  }

  return {
    year,
    overview,
    monthlyBreakdown
  };
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
- [ ] `components/charts/MonthlyPerformanceChart.tsx` (old line chart)
- [ ] Any chart-specific utilities for monthly trends
- [ ] Unused monthly chart API endpoint (if separate from daily summaries)

### Step 3: Update Imports
- [ ] Remove imports in `app/(user)/analytics/trends/page.tsx`
- [ ] Remove imports from index files
- [ ] Update any storybook stories (if exist)

### Step 4: Database Cleanup
- [ ] Check if any monthly aggregation tables exist
- [ ] Remove if not used by other features

### Step 5: Update Tests
- [ ] Remove tests for deleted monthly chart component
- [ ] Add tests for new `MonthlyPerformanceView` component
- [ ] Test monthly aggregation logic
- [ ] Test year selector functionality

---

## 🚀 Implementation Plan

### Phase 1: Backend Preparation (Day 1)
1. Create `performanceAnalyticsService.ts`
2. Implement all calculation methods
3. Create API endpoint `/api/analytics/performance`
4. Add time period filtering
5. Write unit tests

### Phase 2: Frontend Component (Day 2)
1. Create `MonthlyPerformanceView.tsx` component
2. Add Year/Month toggle and year selector
3. Implement 4-column summary cards with color coding
4. Create monthly breakdown grid (4x3 cards)
5. Implement loading states and empty states

### Phase 3: Page Replacement (Day 3)
1. Update `/analytics/trends/page.tsx`
2. Replace line chart with monthly card view
3. Test year selector functionality
4. Test responsiveness (mobile: 2-column, desktop: 4-column)

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
- [ ] Monthly performance view displays correct metrics
- [ ] Year selector works (shows 2026, 2025, etc.)
- [ ] Month/Year toggle works correctly
- [ ] Empty months show "No trades" message
- [ ] Summary cards calculate totals correctly
- [ ] Color coding matches design (orange, green, blue, purple)

### Data Accuracy Tests
- [ ] Win rate calculation verified for each month
- [ ] SOP rate calculation verified for each month
- [ ] P&L totals match individual trades per month
- [ ] Year overview totals match sum of all months
- [ ] Win/Loss record accurate (W:X L:Y format)

### UI/UX Tests
- [ ] Responsive on mobile (320px+)
- [ ] Loads in < 1 second
- [ ] No layout shifts
- [ ] Accessible (keyboard navigation, screen readers)
- [ ] Matches Wekang brand styling

### Cleanup Verification
- [ ] No broken imports
- [ ] Old monthly line chart component removed
- [ ] No console errors
- [ ] Build succeeds
- [ ] Bundle size similar or reduced

---

## 📈 Success Metrics

### User Engagement
- Increased time on /analytics/trends page
- Better understanding of monthly performance patterns
- Improved ability to identify strong/weak months
- Easier year-over-year comparison

### Technical Performance
- API response < 300ms
- Page load < 1 second
- Efficient monthly aggregation query

---

## 📝 Migration Notes

### For Users
- Old line chart removed
- New monthly card view available (matches admin style)
- All historical data preserved
- Year selector added for historical viewing
- Clearer month-by-month breakdown

### For Developers
- Check `git blame` for removed chart component before deleting
- Archive old MonthlyPerformanceChart in `docs/archive/` if needed
- Component name changed: `MonthlyPerformanceChart` → `MonthlyPerformanceView`
- API endpoint: `/api/analytics/performance` with year parameter

---

## 🔮 Future Enhancements

### Version 1.5.0+
- [ ] Export monthly performance as PDF
- [ ] Compare multiple years side-by-side
- [ ] Monthly goal setting and tracking
- [ ] Month drill-down to daily trades
- [ ] Custom time range selection (Q1, Q2, etc.)
- [ ] Monthly performance heatmap visualization

---

**Last Updated**: January 28, 2026  
**Feature Owner**: @Thewekang  
**Implementation Status**: Planning Phase
