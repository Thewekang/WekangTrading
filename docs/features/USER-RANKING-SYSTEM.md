# User Ranking System

**Feature**: Anonymous Performance Leaderboard  
**Version**: 1.4.0 (Planned)  
**Date**: January 28, 2026  
**Status**: In Development

---

## 📋 Overview

Display user performance ranking in the dashboard without revealing other users' identities. This allows traders to see their relative performance while maintaining privacy.

---

## 🎯 Requirements

### User Story
> As a trader, I want to see my ranking among all users so I can understand my relative performance without knowing who the other traders are.

### Key Features
1. **Anonymous Ranking**: Show user's position (e.g., "Rank #2 of 5 traders")
2. **No Identity Disclosure**: Never reveal usernames or emails of other traders
3. **Ranking Metrics**: 
   - Win Rate (Primary)
   - SOP Compliance Rate (Secondary)
   - Total Profit/Loss (Tertiary)
4. **Real-time Updates**: Ranking updates as performance changes
5. **Dashboard Integration**: Display prominently on user dashboard

---

## 🔧 Technical Design

### Database Query
```sql
-- Get user ranking by win rate
WITH user_rankings AS (
  SELECT 
    u.id,
    u.name,
    COALESCE(
      (SUM(CASE WHEN it.result = 'WIN' THEN 1 ELSE 0 END) * 100.0) / 
      NULLIF(COUNT(it.id), 0), 
      0
    ) as win_rate,
    COALESCE(
      (SUM(CASE WHEN it.sop_followed = true THEN 1 ELSE 0 END) * 100.0) / 
      NULLIF(COUNT(it.id), 0), 
      0
    ) as sop_rate,
    COALESCE(SUM(it.profit_loss_usd), 0) as total_pnl,
    COUNT(it.id) as total_trades
  FROM users u
  LEFT JOIN individual_trades it ON u.id = it.user_id
  WHERE u.role = 'USER'
  GROUP BY u.id, u.name
  HAVING COUNT(it.id) >= 10  -- Minimum trades for ranking
)
SELECT 
  id,
  win_rate,
  sop_rate,
  total_pnl,
  total_trades,
  RANK() OVER (ORDER BY win_rate DESC, sop_rate DESC, total_pnl DESC) as rank,
  (SELECT COUNT(*) FROM user_rankings) as total_users
FROM user_rankings
WHERE id = $userId;
```

### API Endpoint
**Route**: `GET /api/stats/ranking`

**Response**:
```typescript
{
  success: true,
  data: {
    rank: 2,              // User's position
    totalUsers: 5,        // Total ranked users
    winRate: 66.67,       // User's win rate
    sopRate: 75.00,       // User's SOP rate
    totalPnl: 125.50,     // User's total P&L
    totalTrades: 30,      // User's total trades
    percentile: 60.0,     // Percentage of users below (top 40%)
    rankChange: 1         // Change from last calculation (+1 = improved)
  }
}
```

### Service Layer
**File**: `lib/services/rankingService.ts`

```typescript
export async function getUserRanking(userId: string) {
  // Calculate rankings for all users with minimum trades
  // Return user's position without exposing others
  // Cache results for 1 hour to reduce DB load
}

export async function calculateAllRankings() {
  // Background job to calculate rankings periodically
  // Store in rankings table for faster retrieval
}
```

### Database Schema Addition
**Table**: `user_rankings`

```typescript
export const userRankings = pgTable('user_rankings', {
  id: text('id').primaryKey().$defaultFn(() => generateId()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  rank: integer('rank').notNull(),
  totalUsers: integer('total_users').notNull(),
  winRate: real('win_rate').notNull(),
  sopRate: real('sop_rate').notNull(),
  totalPnl: real('total_pnl').notNull(),
  totalTrades: integer('total_trades').notNull(),
  percentile: real('percentile').notNull(),
  calculatedAt: timestamp('calculated_at', { mode: 'date' }).notNull().defaultNow(),
});
```

---

## 🎨 UI Design

### Dashboard Widget Location
**Page**: `/dashboard`  
**Position**: Below performance metrics, before charts  
**Size**: Full-width card

### Component Structure
```tsx
<Card className="border-l-4 border-l-wekang-gold">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Trophy className="h-5 w-5 text-wekang-gold" />
      Your Performance Ranking
    </CardTitle>
    <CardDescription>
      See how you rank among all traders
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="grid gap-4">
      {/* Rank Badge */}
      <div className="flex items-center justify-center">
        <div className="text-6xl font-bold text-wekang-gold">
          #{rank}
        </div>
        <div className="ml-4 text-muted-foreground">
          of {totalUsers} traders
        </div>
      </div>

      {/* Percentile */}
      <div className="text-center">
        <Badge variant="outline" className="text-lg">
          Top {100 - percentile}%
        </Badge>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-4 pt-4">
        <div>
          <div className="text-sm text-muted-foreground">Win Rate</div>
          <div className="text-2xl font-bold">{winRate}%</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">SOP Rate</div>
          <div className="text-2xl font-bold">{sopRate}%</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Total P&L</div>
          <div className="text-2xl font-bold">${totalPnl}</div>
        </div>
      </div>

      {/* Rank Change Indicator */}
      {rankChange !== 0 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          {rankChange > 0 ? (
            <>
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-green-500">
                Improved by {rankChange} position{rankChange > 1 ? 's' : ''}
              </span>
            </>
          ) : (
            <>
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="text-red-500">
                Dropped by {Math.abs(rankChange)} position{Math.abs(rankChange) > 1 ? 's' : ''}
              </span>
            </>
          )}
        </div>
      )}

      {/* Minimum Trades Notice */}
      {totalTrades < 10 && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Complete at least 10 trades to be included in rankings. 
            Current: {totalTrades} trades.
          </AlertDescription>
        </Alert>
      )}
    </div>
  </CardContent>
</Card>
```

---

## 🔒 Privacy & Security

### Privacy Rules
1. ✅ **NEVER** expose other users' names, emails, or IDs
2. ✅ **ONLY** show aggregate counts (e.g., "5 traders")
3. ✅ **NO** detailed breakdown of other users' performance
4. ✅ **MINIMUM** 10 trades required to appear in rankings
5. ✅ **CACHE** rankings for 1 hour to prevent real-time tracking

### Security Checks
```typescript
// API endpoint must verify user identity
const session = await auth();
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Only return data for the authenticated user
const ranking = await getUserRanking(session.user.id);
```

---

## 📊 Ranking Algorithm

### Ranking Criteria (Priority Order)
1. **Win Rate** (Primary) - Higher is better
2. **SOP Compliance Rate** (Secondary) - Tie-breaker
3. **Total P&L** (Tertiary) - Final tie-breaker

### Edge Cases
- **No trades**: User not ranked (shows "Not Ranked Yet")
- **< 10 trades**: User not ranked (shows "Need X more trades")
- **Tie in all metrics**: Users share same rank (e.g., "Rank #2 (tied)")
- **Single user**: Shows "Rank #1 of 1 trader"

---

## 🧪 Testing Checklist

### Functional Tests
- [ ] User with 10+ trades sees ranking
- [ ] User with < 10 trades sees "not ranked" message
- [ ] Ranking updates after new trades
- [ ] Tie-breaking works correctly (Win Rate → SOP → P&L)
- [ ] No user identities exposed in API response
- [ ] Ranking cached for 1 hour (check DB query count)

### Edge Cases
- [ ] New user (0 trades) - Shows onboarding message
- [ ] Only user in system - Shows "Rank #1 of 1"
- [ ] All users have same metrics - Shows tied rank
- [ ] User drops in ranking - Shows negative rank change
- [ ] User improves in ranking - Shows positive rank change

### Security Tests
- [ ] API requires authentication
- [ ] Cannot query other users' rankings directly
- [ ] SQL injection attempts fail
- [ ] Rate limiting prevents spam requests

---

## 🚀 Implementation Plan

### Phase 1: Backend (Day 1-2)
1. Create `user_rankings` table migration
2. Implement `rankingService.ts` with calculation logic
3. Create API endpoint `/api/stats/ranking`
4. Add background job for periodic ranking updates
5. Write unit tests for ranking calculation

### Phase 2: Frontend (Day 3)
1. Create `RankingCard.tsx` component
2. Integrate component in dashboard
3. Add loading states and error handling
4. Style with Wekang brand colors (gold for ranking)

### Phase 3: Testing & Polish (Day 4)
1. Test with multiple users
2. Verify privacy requirements
3. Optimize DB queries (add indexes)
4. Add analytics tracking
5. Write documentation

---

## 📈 Success Metrics

### User Engagement
- % of users viewing ranking widget daily
- Time spent on dashboard page
- Trades completed after viewing ranking (motivation effect)

### Performance
- API response time < 200ms
- DB query time < 100ms (with caching)
- Ranking calculation job < 1 minute for all users

---

## 🔮 Future Enhancements

### Version 1.5.0+
- [ ] Historical ranking trends (line chart over time)
- [ ] Weekly/Monthly ranking leaderboards
- [ ] Ranking by specific time periods (last 7 days, last 30 days)
- [ ] Achievement badges for ranking milestones
- [ ] Email notifications for rank changes
- [ ] Optional opt-in public leaderboard (with consent)

---

## 📝 Notes

- Ranking is calculated based on **all-time performance** by default
- Users must explicitly opt-in to appear in rankings (privacy setting)
- Admin users are excluded from rankings
- Minimum 10 trades ensures statistical significance
- Cache invalidation occurs on new trade submission

---

**Last Updated**: January 28, 2026  
**Feature Owner**: @Thewekang  
**Implementation Status**: Planning Phase
