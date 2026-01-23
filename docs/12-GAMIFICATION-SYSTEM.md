# Gamification & Achievement System

## Document Control
- **Version**: 1.0
- **Status**: COMPLETE ✅
- **Last Updated**: January 17, 2026
- **Release Version**: v1.2.0
- **Feature Set**: Badge System, Achievements, Streaks

---

## 1. Overview

The Gamification System introduces a comprehensive achievement and motivation framework to encourage consistent trading habits, SOP compliance, and performance improvement.

### 1.1 Core Components

```
Gamification System
├── Badge System (34 unique badges)
│   ├── Bronze Tier (11 badges, 30-40 points)
│   ├── Silver Tier (10 badges, 50 points)
│   ├── Gold Tier (9 badges, 100 points)
│   └── Platinum Tier (4 badges, 150 points)
├── Streak Tracking
│   ├── Win Streak (consecutive winning days)
│   ├── Log Streak (consecutive logging days)
│   └── SOP Streak (consecutive SOP-compliant trades)
├── Progress Tracking
│   ├── Real-time badge progress
│   ├── Current vs. longest streaks
│   └── Percentage completion
└── Celebration System
    ├── Multi-badge award modals
    ├── Animated celebrations
    └── Achievement notifications
```

### 1.2 Key Features

- **34 Unique Badges**: 4 tiers (Bronze, Silver, Gold, Platinum)
- **8 Categories**: Trades, Wins, Profit, Streaks, SOP, Sessions, Targets, Logging
- **Real-time Progress**: Automatic badge awarding on trade submission
- **Streak Monitoring**: Track consecutive achievements
- **Achievement Gallery**: Visual badge collection display
- **Motivational System**: Contextual encouragement messages

---

## 2. Badge System

### 2.1 Badge Categories

#### 2.1.1 TRADES (Total Trade Volume)
| Badge | Tier | Points | Requirement |
|-------|------|--------|-------------|
| 🔥 On Fire | Bronze | 30 | 30 total trades |
| 📊 Century | Bronze | 40 | 100 total trades |
| 💪 Hard Worker | Gold | 100 | 500 total trades |
| 🏛️ Unstoppable | Platinum | 150 | 1,000 total trades |

#### 2.1.2 WIN_STREAK (Consecutive Winning Days)
| Badge | Tier | Points | Requirement |
|-------|------|--------|-------------|
| ⚡ Electric | Silver | 50 | 5 days winning streak |
| 🌟 Flawless | Gold | 100 | 7 days winning streak |
| 👑 Unstoppable | Gold | 100 | 10 days winning streak |
| 🦅 Legendary | Platinum | 150 | 15 days winning streak |

#### 2.1.3 PROFIT_TOTAL (Cumulative Profit)
| Badge | Tier | Points | Requirement |
|-------|------|--------|-------------|
| 🚀 Rising Star | Silver | 50 | $2,500 profit |
| 💰 Big League | Silver | 50 | $5,000 profit |
| 💎 Diamond Trader | Gold | 100 | $10,000 profit |
| 🏆 Elite Trader | Platinum | 150 | $25,000 profit |

#### 2.1.4 WIN_RATE (Win Percentage)
| Badge | Tier | Points | Requirement |
|-------|------|--------|-------------|
| 🎯 Accurate | Bronze | 30 | 60% win rate (50+ trades) |
| 🔫 Precision | Silver | 50 | 70% win rate (50+ trades) |
| 🎖️ Top Tier | Gold | 100 | 80% win rate (50+ trades) |
| 👑 Untouchable | Platinum | 150 | 90% win rate (100+ trades) |

#### 2.1.5 SOP (Standard Operating Procedure Compliance)
| Badge | Tier | Points | Requirement |
|-------|------|--------|-------------|
| ✅ By the Book | Bronze | 40 | 20 consecutive SOP trades |
| 📖 Rule Follower | Silver | 50 | 80% SOP rate (20+ trades) |
| 🎖️ Disciplined | Gold | 100 | 30 consecutive SOP trades |
| 🎓 Flawless Execution | Gold | 100 | 50 consecutive SOP trades |
| 🏆 The Disciplined One | Platinum | 150 | 90% SOP rate (50+ trades) |

#### 2.1.6 LOG_STREAK (Consecutive Logging Days)
| Badge | Tier | Points | Requirement |
|-------|------|--------|-------------|
| 📝 Committed | Bronze | 30 | 7 days logging streak |
| 📅 Dedicated | Silver | 50 | 30 days logging streak |

#### 2.1.7 SESSION_TRADES (Market Session Specialization)
| Badge | Tier | Points | Requirement |
|-------|------|--------|-------------|
| 🌅 Dawn Trader | Bronze | 40 | 50 trades in ASIA session |
| 🌃 Night Trader | Bronze | 40 | 50 trades in US session |

#### 2.1.8 TARGET_ACHIEVEMENT (Goal Completion)
| Badge | Tier | Points | Requirement |
|-------|------|--------|-------------|
| 🏁 Goal Achieved | Bronze | 40 | 1 weekly target achieved |
| 🔄 Resilient | Gold | 100 | 3 weekly targets achieved |
| 🎯 Flawless Month | Platinum | 150 | 1 monthly target achieved |

#### 2.1.9 MAX_TRADES_DAY (Daily Activity)
| Badge | Tier | Points | Requirement |
|-------|------|--------|-------------|
| 💥 Day Trader | Bronze | 30 | 15 trades in one day |

### 2.2 Badge Data Structure

```typescript
interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  category: BadgeCategory;
  points: number;
  requirement: string; // JSON: { type, value, minTrades?, sessionType? }
}

interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  earnedAt: Date;
}
```

---

## 3. Streak System

### 3.1 Streak Types

#### 3.1.1 Win Streak
- **Definition**: Consecutive calendar days with positive daily profit (totalProfitLossUsd > 0)
- **Calculation**: Daily summaries sorted chronologically
- **Reset Condition**: Any day with zero or negative profit
- **Tracking**: 
  - `currentStreak`: Current consecutive winning days
  - `longestStreak`: All-time best winning streak

#### 3.1.2 Log Streak
- **Definition**: Consecutive calendar days with at least one trade logged
- **Calculation**: Daily summaries sorted chronologically
- **Reset Condition**: Any day without trades
- **Tracking**:
  - `currentStreak`: Current consecutive logging days
  - `longestStreak`: All-time best logging streak

#### 3.1.3 SOP Streak
- **Definition**: Consecutive SOP-compliant TRADES (not days)
- **Calculation**: Individual trades sorted chronologically
- **Reset Condition**: Any trade with `sopFollowed = false`
- **Tracking**:
  - `currentStreak`: Current consecutive SOP-compliant trades
  - `longestStreak`: All-time best SOP streak

**Important**: SOP streak counts **consecutive trades**, not days. This is different from Win/Log streaks.

### 3.2 Streak Calculation Logic

#### Win/Log Streaks (Day-based)
```typescript
function isConsecutiveDay(lastDate: Date, currentDate: Date): boolean {
  const oneDayMs = 24 * 60 * 60 * 1000;
  const diffMs = currentDate.getTime() - lastDate.getTime();
  const diffDays = Math.round(diffMs / oneDayMs);
  return diffDays === 1;
}

// Process daily summaries chronologically
for (const summary of dailySummaries) {
  if (isWinningDay && isConsecutiveDay(lastDate, summary.date)) {
    currentWinStreak++;
  } else if (!isWinningDay) {
    currentWinStreak = isWinningDay ? 1 : 0;
  }
  longestWinStreak = Math.max(longestWinStreak, currentWinStreak);
}
```

#### SOP Streak (Trade-based)
```typescript
// Process trades chronologically
let currentSopStreak = 0;
let longestSopStreak = 0;

for (const trade of sortedTrades) {
  if (trade.sopFollowed) {
    currentSopStreak++;
    longestSopStreak = Math.max(longestSopStreak, currentSopStreak);
  } else {
    currentSopStreak = 0; // Break streak
  }
}
```

### 3.3 Streak Storage

**Database Tables**:
- `streaks`: Persistent streak records
- `userStats`: Denormalized for fast badge checks

```typescript
interface Streak {
  id: string;
  userId: string;
  streakType: 'WIN_STREAK' | 'LOG_STREAK' | 'SOP_STREAK';
  currentStreak: number;
  longestStreak: number;
  lastStreakDate: Date | null;
  startDate: Date | null;
}
```

---

## 4. Badge Progress System

### 4.1 Progress Calculation

Badge progress is calculated in real-time from `userStats` table:

```typescript
interface BadgeProgress {
  badge: Badge;
  progress: number;        // Percentage (0-100)
  currentValue: number;    // User's current stat
  targetValue: number;     // Badge requirement
}

// Example calculations
WIN_STREAK: currentValue = userStats.currentWinStreak (not longest!)
TOTAL_TRADES: currentValue = userStats.totalTrades
PROFIT_TOTAL: currentValue = userStats.totalProfitUsd
```

**Critical**: Progress shows **current streak**, but badge awarding uses **longest streak**.

### 4.2 Display Logic

#### Achievements Page
- **Earned Badges**: Sorted by earned date (newest first)
- **Unearned Badges**: Sorted by progress percentage (closest first)
- **Progress Bars**: Visual indicators with percentage
- **Dual Progress** (WIN_RATE badges): Win rate % + minimum trades count

#### Badge Details Modal
```
Status: ✅ Earned | 🔒 Locked
Category: STREAK | TRADES | PROFIT | etc.
Requirement: Clear description
Progress: X/Y (Z%)
Earned On: Date (if earned)
```

---

## 5. Badge Awarding System

### 5.1 Automatic Award Flow

```
Trade Submitted
  ↓
updateDailySummary()
  ↓
updateUserStatsFromTrades()
  ↓ (includes streak recalculation)
checkAndAwardBadges()
  ↓
evaluateBadgeRequirement()
  ↓
Insert into userBadges
  ↓
Return newly awarded badges
  ↓
Frontend: Show celebration modal
```

### 5.2 Award Triggers

Badges are checked after:
- ✅ Individual trade creation
- ✅ Bulk trade insertion
- ✅ Trade update/edit
- ✅ Trade deletion
- ✅ Manual recalculation scripts

### 5.3 Badge Requirements Evaluation

```typescript
function evaluateBadgeRequirement(badge: Badge, stats: UserStats): boolean {
  const req = JSON.parse(badge.requirement);
  
  switch (req.type) {
    case 'WIN_STREAK':
      return stats.longestWinStreak >= req.value; // Longest, not current!
    
    case 'SOP_STREAK':
      return stats.longestSopStreak >= req.value;
    
    case 'WIN_RATE':
      return stats.totalTrades >= req.minTrades && 
             stats.winRate >= req.value;
    
    case 'PROFIT_TOTAL':
      return stats.totalProfitUsd >= req.value;
    
    // ... other types
  }
}
```

---

## 6. Celebration System

### 6.1 Multi-Badge Award Modal

**Features**:
- Animated badge icon reveal
- Badge tier color-coded background
- Points awarded display
- Pagination dots for multiple badges
- "Next Badge" / "Awesome!" button
- Confetti animation

**User Experience**:
```
Award 1: "On Fire" badge (30 points)
  → Click "Next Badge"
Award 2: "Electric" badge (50 points)
  → Click "Awesome!" (closes modal)
```

### 6.2 Notification System

**Motivational Messages**:
- Triggered on badge award
- Stored in `motivationalMessages` table
- Displayed in notifications dropdown
- Categories: BADGE_EARNED, STREAK_MILESTONE, TARGET_ACHIEVED

**Example Messages**:
```
"🎉 You've earned the 'On Fire' badge! Keep it up!"
"⚡ 5-day win streak! You're on a roll!"
"🏆 Goal achieved! Setting new targets keeps you sharp!"
```

---

## 7. User Stats Synchronization

### 7.1 Stats Recalculation

**When**: After every trade operation (create, update, delete, bulk)

**Process**:
```typescript
async function updateUserStatsFromTrades(userId: string) {
  // 1. Fetch all trades chronologically
  const trades = await getAllUserTrades(userId);
  
  // 2. Update win/log streaks from daily summaries
  for (const date of uniqueTradingDates) {
    await updateWinStreak(userId, date);
    await updateLogStreak(userId, date);
  }
  
  // 3. Recalculate SOP streak from trades
  await recalculateSopStreakFromTrades(userId, trades);
  
  // 4. Calculate aggregate stats
  const stats = {
    totalTrades: trades.length,
    totalWins: trades.filter(t => t.result === 'WIN').length,
    winRate: (totalWins / totalTrades) * 100,
    totalProfitUsd: trades.reduce((sum, t) => sum + t.profitLossUsd, 0),
    sopComplianceRate: (sopCompliantTrades / totalTrades) * 100,
    // ... session stats, max trades/day, etc.
  };
  
  // 5. Update userStats table
  await db.update(userStats).set(stats);
}
```

### 7.2 Performance Optimization

**Strategy**: Denormalized `userStats` table for fast badge checks

**Benefits**:
- Badge progress API: ~50ms (no complex aggregations)
- Badge awarding: Single stats lookup
- Achievements page: Fast load with progress bars

**Trade-off**: Stats recalculation adds ~200-500ms to trade operations (acceptable)

---

## 8. API Endpoints

### 8.1 Badge Management

#### `GET /api/badges`
Get all available badges (seeded in database)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "trades_starter",
      "name": "On Fire",
      "description": "Started your trading journey",
      "icon": "🔥",
      "tier": "BRONZE",
      "category": "TRADES",
      "points": 30,
      "requirement": "{\"type\":\"TOTAL_TRADES\",\"value\":30}"
    }
  ]
}
```

#### `GET /api/badges/user`
Get user's earned badges

**Response**:
```json
{
  "success": true,
  "data": {
    "badges": [
      {
        "badge": { /* badge object */ },
        "userBadge": {
          "id": "...",
          "earnedAt": "2026-01-16T19:56:22.000Z"
        }
      }
    ],
    "totalPoints": 130
  }
}
```

#### `GET /api/badges/progress`
Get progress towards unearned badges

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "badge": { /* badge object */ },
      "progress": 35,
      "currentValue": 7,
      "targetValue": 20
    }
  ]
}
```

### 8.2 Stats Endpoint

#### `GET /api/users/me`
Get user stats (includes streaks)

**Response**:
```json
{
  "success": true,
  "data": {
    "name": "Trader",
    "email": "trader@example.com",
    "totalTrades": 7,
    "winRate": 85.71,
    "totalProfitUsd": 1500.50
  }
}
```

---

## 9. Database Schema

### 9.1 Gamification Tables

#### `badges`
```sql
CREATE TABLE badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  tier TEXT NOT NULL CHECK(tier IN ('BRONZE','SILVER','GOLD','PLATINUM')),
  category TEXT NOT NULL,
  points INTEGER NOT NULL,
  requirement TEXT NOT NULL, -- JSON
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

#### `user_badges`
```sql
CREATE TABLE user_badges (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, badge_id)
);
```

#### `streaks`
```sql
CREATE TABLE streaks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  streak_type TEXT NOT NULL CHECK(streak_type IN ('WIN_STREAK','LOG_STREAK','SOP_STREAK')),
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_streak_date TEXT,
  start_date TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, streak_type)
);
```

#### `user_stats`
```sql
CREATE TABLE user_stats (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  total_trades INTEGER NOT NULL DEFAULT 0,
  win_rate REAL NOT NULL DEFAULT 0,
  total_profit_usd REAL NOT NULL DEFAULT 0,
  current_win_streak INTEGER NOT NULL DEFAULT 0,
  longest_win_streak INTEGER NOT NULL DEFAULT 0,
  current_log_streak INTEGER NOT NULL DEFAULT 0,
  longest_log_streak INTEGER NOT NULL DEFAULT 0,
  current_sop_streak INTEGER NOT NULL DEFAULT 0,
  longest_sop_streak INTEGER NOT NULL DEFAULT 0,
  total_sop_compliant INTEGER NOT NULL DEFAULT 0,
  sop_compliance_rate REAL NOT NULL DEFAULT 0,
  -- ... other stats
);
```

#### `motivational_messages`
```sql
CREATE TABLE motivational_messages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## 10. Testing Guide

### 10.1 Manual Testing Checklist

#### Badge Awarding
- [ ] Create 30 trades → "On Fire" badge awarded
- [ ] Achieve 5 consecutive winning days → "Electric" badge awarded
- [ ] Complete 20 consecutive SOP trades → "By the Book" badge awarded
- [ ] Multiple badges in one action → Celebration slider works

#### Progress Tracking
- [ ] Achievements page shows current streak values (not longest)
- [ ] Progress bars update immediately after trade submission
- [ ] Badge details modal shows correct progress
- [ ] Hard refresh (Ctrl+F5) reflects latest progress

#### Streak Behavior
- [ ] Win 3 days → Current win streak = 3
- [ ] Lose on day 4 → Current win streak resets to 0
- [ ] Longest win streak remains = 3
- [ ] Badge based on longest remains earned

#### Account Reset
- [ ] Settings → Reset Account
- [ ] Type "RESET MY ACCOUNT" exactly
- [ ] All badges removed
- [ ] All streaks reset to 0
- [ ] Can earn badges again from scratch

### 10.2 Database Verification

```sql
-- Check user's badges
SELECT b.name, b.tier, b.points, ub.earned_at
FROM user_badges ub
JOIN badges b ON ub.badge_id = b.id
WHERE ub.user_id = 'user-id';

-- Check user's streaks
SELECT streak_type, current_streak, longest_streak
FROM streaks
WHERE user_id = 'user-id';

-- Check user stats
SELECT total_trades, win_rate, total_profit_usd,
       current_win_streak, longest_win_streak,
       current_sop_streak, longest_sop_streak
FROM user_stats
WHERE user_id = 'user-id';
```

### 10.3 Known Issues & Fixes

#### Issue #1: Badge Progress Not Updating (FIXED)
**Problem**: Progress showed stale values after trade submission  
**Cause**: `userStats` not syncing on trade operations  
**Fix**: Added `updateUserStatsFromTrades()` to all trade CRUD operations

#### Issue #2: SOP Streak Incorrect (FIXED)
**Problem**: SOP streak showing 27 with only 7 trades  
**Cause**: Counting by days instead of consecutive trades  
**Fix**: Implemented `recalculateSopStreakFromTrades()` for trade-based counting

#### Issue #3: Win Streak Weekend Skipping (FIXED)
**Problem**: Win streak skipped weekends (treated Fri→Mon as consecutive)  
**Cause**: Used `isNextTradingDay()` which skips weekends  
**Fix**: Changed to `isNextCalendarDay()` for 24/7 forex markets

---

## 11. Future Enhancements

### 11.1 Planned Features (v1.3.0)

#### Leaderboards
- Global rankings by total points
- Category-specific leaderboards
- Weekly/monthly competitions
- Friend comparisons

#### Badge Rarity System
- Ultra-rare seasonal badges
- Limited-time event badges
- Anniversary badges
- Custom milestone badges

#### Enhanced Notifications
- Push notifications for badge awards
- Email digests of achievements
- Streak warning alerts (e.g., "Don't break your 7-day streak!")
- Progress reminders

#### Social Features
- Share badges on social media
- Badge showcases on profile
- Achievement timelines
- Congratulations between users

### 11.2 Optimization Ideas

#### Performance
- Cache badge progress for 5 minutes
- Batch badge checking for bulk operations
- Lazy load badge icons
- Optimize streak recalculation

#### UX Improvements
- Badge preview animations on hover
- Detailed badge statistics page
- Achievement history timeline
- Personalized badge recommendations

---

## 12. Maintenance

### 12.1 Adding New Badges

1. **Database Seed** (`prisma/seed/badges.ts`):
```typescript
const newBadge: Badge = {
  id: 'unique_id',
  name: 'Badge Name',
  description: 'Clear requirement description',
  icon: '🎯',
  tier: 'SILVER',
  category: 'CATEGORY',
  points: 50,
  requirement: JSON.stringify({ type: 'BADGE_TYPE', value: 100 })
};
```

2. **Badge Evaluation** (`lib/services/badgeService.ts`):
```typescript
case 'NEW_BADGE_TYPE':
  return stats.relevantStat >= requirement.value;
```

3. **Progress Calculation** (`lib/services/badgeService.ts`):
```typescript
case 'NEW_BADGE_TYPE':
  current = userStat.relevantStat;
  break;
```

4. **Run Migration**: `npm run seed:badges`

### 12.2 Recalculating Stats

**Script**: `scripts/recalculate-summaries.ts`

```bash
# Recalculate all users
npm run recalc

# Check specific user
npx tsx scripts/check-sop-badge.ts
```

### 12.3 Monitoring

**Key Metrics**:
- Average time to first badge
- Most popular badges
- Badge completion rates
- Streak break frequency
- Total points distribution

**Queries**:
```sql
-- Badge distribution
SELECT tier, COUNT(*) as badge_count
FROM badges
GROUP BY tier;

-- User badge counts
SELECT COUNT(DISTINCT user_id) as users_with_badges,
       AVG(badge_count) as avg_badges_per_user
FROM (
  SELECT user_id, COUNT(*) as badge_count
  FROM user_badges
  GROUP BY user_id
);

-- Popular badges
SELECT b.name, COUNT(*) as users_earned
FROM user_badges ub
JOIN badges b ON ub.badge_id = b.id
GROUP BY b.id
ORDER BY users_earned DESC
LIMIT 10;
```

---

## 13. Troubleshooting

### 13.1 Common Issues

#### "Badge progress not updating"
1. Check if `updateUserStatsFromTrades()` is called
2. Verify `userStats` table has correct values
3. Hard refresh browser (Ctrl+F5)
4. Check dev tools console for errors

#### "Incorrect streak count"
1. Run recalculation script
2. Check trade timestamps are correct
3. Verify no duplicate trades
4. Ensure trade data is chronologically ordered

#### "Badge awarded incorrectly"
1. Check badge requirement definition
2. Verify evaluation logic in `evaluateBadgeRequirement()`
3. Review user stats at time of award
4. Check for race conditions in concurrent operations

### 13.2 Debug Tools

**Browser Console**:
```javascript
// Check localStorage flags
localStorage.getItem('badgesUpdated')

// Force achievements page refresh
location.reload()
```

**Server Logs**:
```bash
# Enable debug logging
DEBUG=badge:* npm run dev
```

---

## 14. Version History

### v1.2.0 (January 17, 2026)
- ✅ Initial gamification system release
- ✅ 34 badges across 9 categories
- ✅ 4-tier badge system with point values
- ✅ Streak tracking (win, log, SOP)
- ✅ Real-time badge progress
- ✅ Celebration animations
- ✅ Account reset includes achievements
- ✅ Bug fixes: Progress sync, SOP streak calculation, win streak weekend handling

---

**Document End**
