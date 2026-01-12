# Target Management Documentation

**Document Version**: 1.0  
**Last Updated**: January 12, 2026  
**Feature Version**: v0.4.0  
**Status**: ✅ Production

---

## Table of Contents

1. [Overview](#overview)
2. [Feature Evolution](#feature-evolution)
3. [Database Schema](#database-schema)
4. [Target Categories](#target-categories)
5. [Status Calculation](#status-calculation)
6. [API Endpoints](#api-endpoints)
7. [UI Components](#ui-components)
8. [Usage Examples](#usage-examples)
9. [Best Practices](#best-practices)

---

## Overview

The Target Management system allows traders to set and track performance goals with customizable names, categories, and flexible timelines. Designed to support both prop firm challenges (absolute deadlines) and personal improvement goals (pace-based tracking).

### Key Features

- **Custom Names**: User-defined labels (e.g., "MAVEN Prop Firm Phase 1")
- **Categories**: PROP_FIRM (absolute deadlines) vs PERSONAL (pace-based)
- **Flexible Dates**: Start dates can be in the past (e.g., challenge started Dec 15, ends Jan 15)
- **Multiple Active Targets**: Users can have multiple concurrent goals
- **Status Tracking**: Automatic calculation based on category type
- **Profit Goals**: Optional USD profit targets (beyond win rate)

### Use Cases

1. **Prop Firm Challenges**: Track funded account evaluations with hard deadlines
2. **Personal Goals**: Monthly improvement targets without strict deadlines
3. **Team Challenges**: Quarterly objectives for trading teams
4. **Skill Development**: Weekly focus areas (e.g., "Master Breakout Strategy")

---

## Feature Evolution

### v0.3.0 (Original Implementation)
- Basic target tracking
- targetType: WEEKLY, MONTHLY, YEARLY
- Single active target per type
- Auto-deactivation on creation

### v0.4.0 (Enhanced - January 2026)
**What Changed:**

1. **Custom Names Added**
   - `name` TEXT field (required)
   - User-defined labels for better organization
   - Example: "MAVEN Prop Firm Phase 1" vs generic "Monthly Target"

2. **Category System**
   - `targetCategory` ENUM: PROP_FIRM | PERSONAL
   - Different status calculation logic per category
   - PROP_FIRM: Absolute deadline (must finish by end date)
   - PERSONAL: Pace-based (on track vs off track)

3. **Flexible Date Ranges**
   - `startDate` and `endDate` fields
   - Past start dates allowed (e.g., challenge already in progress)
   - Auto-calculated end date based on targetType + startDate

4. **Multiple Active Targets**
   - Removed unique constraint on active targets
   - Users manage their own target lifecycle
   - No auto-deactivation when creating new targets

5. **Optional Profit Targets**
   - `targetProfitUsd` DECIMAL (nullable)
   - Track dollar goals in addition to win/SOP rates
   - Useful for prop firm profit milestones

6. **Required SOP Rate**
   - `targetSopRate` changed from NULLABLE to NOT NULL
   - Emphasizes discipline in all goals

7. **Notes Field**
   - `notes` TEXT field for context
   - Store challenge rules, reminders, or strategies

---

## Database Schema

### Table: `user_targets`

```sql
CREATE TABLE user_targets (
  id                  TEXT PRIMARY KEY,
  user_id             TEXT NOT NULL,
  name                TEXT NOT NULL,
  target_category     TEXT NOT NULL DEFAULT 'PERSONAL',  -- 'PROP_FIRM' | 'PERSONAL'
  target_type         TEXT NOT NULL,                     -- 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  target_win_rate     REAL NOT NULL,                     -- 0-100
  target_sop_rate     REAL NOT NULL,                     -- 0-100
  target_profit_usd   REAL,                              -- Optional profit goal
  start_date          INTEGER NOT NULL,                  -- Timestamp
  end_date            INTEGER NOT NULL,                  -- Auto-calculated
  notes               TEXT,                              -- Optional context
  active              INTEGER NOT NULL DEFAULT 1,        -- Boolean
  created_at          INTEGER NOT NULL,
  updated_at          INTEGER NOT NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX user_targets_user_idx ON user_targets(user_id);
CREATE INDEX user_targets_user_type_active_idx ON user_targets(user_id, target_type, active);
CREATE INDEX user_targets_user_active_dates_idx ON user_targets(user_id, active, start_date, end_date);
```

### Drizzle ORM Schema

```typescript
// lib/db/schema/targets.ts
import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';

export const userTargets = sqliteTable('user_targets', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  targetCategory: text('target_category', { enum: ['PROP_FIRM', 'PERSONAL'] })
    .notNull()
    .default('PERSONAL'),
  targetType: text('target_type', { enum: ['WEEKLY', 'MONTHLY', 'YEARLY'] }).notNull(),
  targetWinRate: real('target_win_rate').notNull(),
  targetSopRate: real('target_sop_rate').notNull(),
  targetProfitUsd: real('target_profit_usd'),
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp' }).notNull(),
  notes: text('notes'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
}, (table) => ({
  userIdx: index('user_targets_user_idx').on(table.userId),
  userTypeActiveIdx: index('user_targets_user_type_active_idx')
    .on(table.userId, table.targetType, table.active),
  userActiveDatesIdx: index('user_targets_user_active_dates_idx')
    .on(table.userId, table.active, table.startDate, table.endDate),
}));

export type UserTarget = typeof userTargets.$inferSelect;
export type NewUserTarget = typeof userTargets.$inferInsert;
```

### Validation (Zod Schema)

```typescript
// lib/validations.ts
import { z } from 'zod';

export const createTargetSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  targetCategory: z.enum(['PROP_FIRM', 'PERSONAL']),
  targetType: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']),
  targetWinRate: z.number().min(0).max(100),
  targetSopRate: z.number().min(0).max(100),
  targetProfitUsd: z.number().positive().optional(),
  startDate: z.string().datetime(),
  notes: z.string().max(500).optional(),
});

export const updateTargetSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  targetCategory: z.enum(['PROP_FIRM', 'PERSONAL']).optional(),
  targetWinRate: z.number().min(0).max(100).optional(),
  targetSopRate: z.number().min(0).max(100).optional(),
  targetProfitUsd: z.number().positive().nullable().optional(),
  startDate: z.string().datetime().optional(),
  notes: z.string().max(500).nullable().optional(),
  active: z.boolean().optional(),
});
```

---

## Target Categories

### PROP_FIRM (Absolute Deadlines)

**Use Case**: Funded account challenges, prop firm evaluations

**Characteristics**:
- Fixed start and end dates (cannot be extended)
- Must achieve targets by end date
- Fail if end date passes without reaching goals
- Strict adherence to timelines

**Status Calculation**:
```typescript
if (now > endDate) {
  if (currentWinRate >= targetWinRate && currentSopRate >= targetSopRate) {
    return 'ACHIEVED';
  } else {
    return 'FAILED';  // Time's up, didn't meet goals
  }
}

if (currentWinRate >= targetWinRate && currentSopRate >= targetSopRate) {
  return 'ACHIEVED';
} else {
  return 'IN_PROGRESS';  // Still have time
}
```

**Example**:
- Name: "MAVEN Prop Firm Phase 1"
- Category: PROP_FIRM
- Start: Jan 1, 2026
- End: Jan 31, 2026
- Target: 65% WR, 80% SOP, $5,000 profit
- Status: If Jan 31 passes and WR is 63%, status = FAILED

### PERSONAL (Pace-Based Tracking)

**Use Case**: Self-improvement goals, learning objectives, long-term development

**Characteristics**:
- Flexible timelines (not strict deadlines)
- Focus on being "on track" vs "off track"
- No failure state (only "not met" after end date)
- Encourages consistent progress

**Status Calculation**:
```typescript
const elapsedRatio = (now - startDate) / (endDate - startDate);
const expectedWinRate = targetWinRate * elapsedRatio;
const expectedSopRate = targetSopRate * elapsedRatio;

if (now > endDate) {
  if (currentWinRate >= targetWinRate && currentSopRate >= targetSopRate) {
    return 'ACHIEVED';
  } else {
    return 'NOT_MET';  // Ended, didn't meet goals (not a failure)
  }
}

if (currentWinRate >= expectedWinRate && currentSopRate >= expectedSopRate) {
  return 'ON_TRACK';
} else {
  return 'OFF_TRACK';
}
```

**Example**:
- Name: "Improve Consistency Q1 2026"
- Category: PERSONAL
- Start: Jan 1, 2026
- End: Mar 31, 2026
- Target: 70% WR, 85% SOP
- Status at Jan 15 (16.7% elapsed):
  - Expected WR: 11.7% (70 × 0.167)
  - Current WR: 15%
  - Status: ON_TRACK (ahead of pace)

---

## Status Calculation

### Status Enum

```typescript
type TargetStatus = 
  | 'IN_PROGRESS'   // PROP_FIRM: Working toward goal, time remaining
  | 'ACHIEVED'      // Both: Goals met
  | 'FAILED'        // PROP_FIRM: Time expired, goals not met
  | 'ON_TRACK'      // PERSONAL: Progressing at expected pace
  | 'OFF_TRACK'     // PERSONAL: Behind expected pace
  | 'NOT_MET';      // PERSONAL: Time expired, goals not met (not a failure)
```

### Service Function

```typescript
// lib/services/targetService.ts
export function calculateTargetStatus(
  target: UserTarget,
  currentStats: { winRate: number; sopRate: number; profitUsd?: number }
): TargetStatus {
  const now = new Date();
  const { targetCategory, startDate, endDate, targetWinRate, targetSopRate } = target;
  
  const { winRate: currentWinRate, sopRate: currentSopRate } = currentStats;
  
  // Check if goals are met
  const goalsMet = 
    currentWinRate >= targetWinRate && 
    currentSopRate >= targetSopRate;
  
  if (targetCategory === 'PROP_FIRM') {
    // Absolute deadline logic
    if (now > endDate) {
      return goalsMet ? 'ACHIEVED' : 'FAILED';
    }
    return goalsMet ? 'ACHIEVED' : 'IN_PROGRESS';
  } else {
    // Pace-based logic (PERSONAL)
    if (now > endDate) {
      return goalsMet ? 'ACHIEVED' : 'NOT_MET';
    }
    
    // Calculate expected progress
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    const elapsedRatio = Math.max(0, Math.min(1, elapsed / totalDuration));
    
    const expectedWinRate = targetWinRate * elapsedRatio;
    const expectedSopRate = targetSopRate * elapsedRatio;
    
    const onPace = 
      currentWinRate >= expectedWinRate && 
      currentSopRate >= expectedSopRate;
    
    return onPace ? 'ON_TRACK' : 'OFF_TRACK';
  }
}
```

### Days Calculation Fix (v0.4.0)

**Bug Fixed**: Days remaining calculation was off by 1

```typescript
// WRONG (v0.3.0):
const daysRemaining = Math.floor((endDate - now) / (1000 * 60 * 60 * 24));

// CORRECT (v0.4.0):
const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
```

**Why**: Used `Math.floor` which rounded down, causing "0 days" to show when there's still time left. Changed to `Math.ceil` to always round up.

---

## API Endpoints

### GET `/api/targets`

**Description**: Get all targets for authenticated user

**Access**: USER, ADMIN (own targets only)

**Query Parameters**:
- `active` (optional): "true" | "false" - Filter by active status
- `category` (optional): "PROP_FIRM" | "PERSONAL" - Filter by category

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "tgt_abc123",
      "userId": "usr_xyz789",
      "name": "MAVEN Prop Firm Phase 1",
      "targetCategory": "PROP_FIRM",
      "targetType": "MONTHLY",
      "targetWinRate": 65.0,
      "targetSopRate": 80.0,
      "targetProfitUsd": 5000.00,
      "startDate": "2026-01-01T00:00:00Z",
      "endDate": "2026-01-31T23:59:59Z",
      "notes": "First evaluation phase",
      "active": true,
      "createdAt": "2025-12-28T10:00:00Z",
      "updatedAt": "2025-12-28T10:00:00Z",
      "currentStats": {
        "winRate": 68.2,
        "sopRate": 82.5,
        "profitUsd": 3250.50,
        "totalTrades": 44
      },
      "status": "ACHIEVED",
      "daysRemaining": 19
    }
  ]
}
```

### POST `/api/targets`

**Description**: Create a new target

**Access**: USER, ADMIN

**Request Body**:
```json
{
  "name": "Q1 2026 Improvement Goal",
  "targetCategory": "PERSONAL",
  "targetType": "YEARLY",
  "targetWinRate": 70.0,
  "targetSopRate": 85.0,
  "targetProfitUsd": 10000,
  "startDate": "2026-01-01T00:00:00Z",
  "notes": "Focus on consistency and discipline"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "tgt_new456",
    "name": "Q1 2026 Improvement Goal",
    "targetCategory": "PERSONAL",
    "startDate": "2026-01-01T00:00:00Z",
    "endDate": "2026-12-31T23:59:59Z",
    "active": true
  },
  "message": "Target created successfully"
}
```

**Auto-Calculation**:
- `endDate` calculated from `startDate` + `targetType`:
  - WEEKLY: +7 days
  - MONTHLY: +30 days
  - YEARLY: +365 days

### PATCH `/api/targets/[id]`

**Description**: Update an existing target

**Access**: USER (own targets), ADMIN (any target)

**Request Body** (all fields optional):
```json
{
  "name": "MAVEN Phase 1 (Extended)",
  "active": false,
  "notes": "Challenge completed successfully"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "tgt_abc123",
    "name": "MAVEN Phase 1 (Extended)",
    "active": false
  },
  "message": "Target updated successfully"
}
```

### DELETE `/api/targets/[id]`

**Description**: Delete a target

**Access**: USER (own targets), ADMIN (any target)

**Response** (200):
```json
{
  "success": true,
  "message": "Target deleted successfully"
}
```

---

## UI Components

### Target List (`/targets`)

**Component**: `app/(user)/targets/page.tsx`

**Features**:
- Display all user targets (active and inactive)
- Color-coded status badges:
  - 🟢 ACHIEVED (green)
  - 🔵 IN_PROGRESS / ON_TRACK (blue)
  - 🟠 OFF_TRACK (orange)
  - 🔴 FAILED (red)
  - ⚪ NOT_MET (gray)
- Category icons:
  - 🏢 PROP_FIRM
  - 👤 PERSONAL
- Progress bars showing current vs target metrics
- Days remaining countdown
- Filter by category/status
- Create new target button

**Layout**:
```
┌────────────────────────────────────────────┐
│ My Targets              [+ New Target]     │
├────────────────────────────────────────────┤
│ Filters: [All] [Prop Firm] [Personal]     │
│          [Active] [Completed]              │
├────────────────────────────────────────────┤
│ 🏢 MAVEN Prop Firm Phase 1                │
│ PROP_FIRM • MONTHLY • 🟢 ACHIEVED          │
│ ─────────────────────────────────────────  │
│ Win Rate:   68.2% / 65.0% ✓               │
│ SOP Rate:   82.5% / 80.0% ✓               │
│ Profit:     $3,250 / $5,000               │
│ Days Left:  19 days                       │
│ [View Details] [Deactivate]               │
├────────────────────────────────────────────┤
│ 👤 Q1 2026 Improvement                    │
│ PERSONAL • YEARLY • 🔵 ON_TRACK            │
│ ─────────────────────────────────────────  │
│ Win Rate:   15.0% / 11.7% (expected) ✓    │
│ SOP Rate:   18.0% / 14.2% (expected) ✓    │
│ Progress:   16.7% of time elapsed         │
│ [View Details] [Edit]                     │
└────────────────────────────────────────────┘
```

### Create Target Modal

**Component**: `components/targets/CreateTargetModal.tsx`

**Fields**:
1. Name (text input, required)
2. Category (dropdown: PROP_FIRM | PERSONAL)
3. Type (dropdown: WEEKLY | MONTHLY | YEARLY)
4. Target Win Rate (number input, %, required)
5. Target SOP Rate (number input, %, required)
6. Target Profit USD (number input, $, optional)
7. Start Date (date picker, required)
8. Notes (textarea, optional, 500 char max)

**Validation**:
- Name: 3-100 characters
- Win Rate: 0-100
- SOP Rate: 0-100
- Profit: Positive number or empty
- Start Date: Any date (past or future)

**Auto-Calculation**:
- End Date displays after selecting start date + type
- Example: "Jan 1, 2026 → Jan 31, 2026 (30 days)"

### Target Detail View

**Component**: `app/(user)/targets/[id]/page.tsx`

**Sections**:
1. **Target Header**
   - Name, category icon, status badge
   - Created date, last updated
   - Edit/Delete actions

2. **Target Metrics**
   - Current vs target win rate (with progress bar)
   - Current vs target SOP rate (with progress bar)
   - Current vs target profit (if set)
   - Total trades toward this target

3. **Timeline**
   - Start date
   - End date
   - Days elapsed / Days remaining
   - Progress percentage (visual bar)

4. **Status Details**
   - Current status explanation
   - For PERSONAL targets: Expected vs actual pace
   - Recommendations (if off track)

5. **Notes**
   - Display user notes
   - Edit inline

6. **Related Trades**
   - List of trades within target date range
   - Filtered by start/end dates
   - Link to full trade list

---

## Usage Examples

### Example 1: Prop Firm Challenge

**Scenario**: Trader has 30-day MAVEN prop firm evaluation

```typescript
const target = {
  name: "MAVEN Phase 1 Evaluation",
  targetCategory: "PROP_FIRM",
  targetType: "MONTHLY",
  targetWinRate: 65,
  targetSopRate: 80,
  targetProfitUsd: 5000,
  startDate: new Date("2026-01-01"),
  notes: "Rules: Max 2% daily loss, $5K profit target, 65% WR minimum"
};
```

**Timeline**:
- Jan 1: Target created, status = IN_PROGRESS
- Jan 15: WR 50%, SOP 75% → status = IN_PROGRESS
- Jan 25: WR 68%, SOP 85%, Profit $5,200 → status = ACHIEVED
- Jan 31: Challenge ends (achieved early)

### Example 2: Personal Improvement Goal

**Scenario**: Trader wants to improve consistency over Q1

```typescript
const target = {
  name: "Q1 2026 Consistency Focus",
  targetCategory: "PERSONAL",
  targetType: "YEARLY",
  targetWinRate: 70,
  targetSopRate: 85,
  startDate: new Date("2026-01-01"),
  notes: "Focus: Stick to SOP, avoid emotional trading"
};
```

**Timeline**:
- Jan 1: Target created
- Jan 15 (16.7% elapsed):
  - Expected WR: 11.7%, Actual: 15% → ON_TRACK
  - Expected SOP: 14.2%, Actual: 12% → OFF_TRACK (overall)
- Feb 1 (33.3% elapsed):
  - Expected: 23.3% WR, Actual: 25% → ON_TRACK
- Apr 1: End date, WR 72%, SOP 87% → ACHIEVED

### Example 3: Weekly Sprint Goal

**Scenario**: Trader sets weekly focus on breakout strategies

```typescript
const target = {
  name: "Master Breakouts - Week 2",
  targetCategory: "PERSONAL",
  targetType: "WEEKLY",
  targetWinRate: 75,
  targetSopRate: 90,
  startDate: new Date("2026-01-06"),
  notes: "Only trade breakouts. Review each setup."
};
```

**Timeline**:
- Jan 6-12: 7-day sprint
- End: Jan 13 (7 days)
- Status updated daily based on pace

---

## Best Practices

### For Users

1. **Be Realistic**: Set achievable targets based on your history
2. **Use Categories Wisely**: 
   - PROP_FIRM for hard deadlines
   - PERSONAL for learning and improvement
3. **Start Simple**: Begin with one target, add more as needed
4. **Review Regularly**: Check progress weekly
5. **Adjust Targets**: Use PATCH to modify if circumstances change
6. **Name Clearly**: Use descriptive names for quick identification
7. **Set SOP Targets High**: Discipline is key to consistency

### For Developers

1. **Always Calculate Status**: Never trust client-side calculations
2. **Validate Date Ranges**: Ensure endDate > startDate
3. **Handle Timezone Correctly**: Store UTC, display user timezone
4. **Batch Status Updates**: Calculate status for all targets efficiently
5. **Cache Current Stats**: Don't recalculate on every request
6. **Index Properly**: Queries filter by userId + active + dates
7. **Test Edge Cases**: End of month, leap years, DST transitions

### For Admins

1. **Monitor Target Usage**: Track which categories are popular
2. **Identify Struggling Users**: Look for multiple FAILED targets
3. **Recommend Targets**: Suggest realistic goals based on user history
4. **Analyze Success Rates**: Which target types lead to achievement?
5. **Provide Templates**: Pre-fill common prop firm challenges

---

## Migration Guide (v0.3.0 → v0.4.0)

### Database Migration

```sql
-- Add new columns
ALTER TABLE user_targets ADD COLUMN name TEXT;
ALTER TABLE user_targets ADD COLUMN target_category TEXT DEFAULT 'PERSONAL';
ALTER TABLE user_targets ADD COLUMN target_profit_usd REAL;
ALTER TABLE user_targets ADD COLUMN start_date INTEGER;
ALTER TABLE user_targets ADD COLUMN end_date INTEGER;
ALTER TABLE user_targets ADD COLUMN notes TEXT;

-- Update existing records
UPDATE user_targets SET name = 'Target ' || target_type WHERE name IS NULL;
UPDATE user_targets SET start_date = created_at WHERE start_date IS NULL;
UPDATE user_targets SET end_date = CASE
  WHEN target_type = 'WEEKLY' THEN start_date + (7 * 24 * 60 * 60)
  WHEN target_type = 'MONTHLY' THEN start_date + (30 * 24 * 60 * 60)
  WHEN target_type = 'YEARLY' THEN start_date + (365 * 24 * 60 * 60)
END WHERE end_date IS NULL;

-- Make new columns required
ALTER TABLE user_targets ALTER COLUMN name SET NOT NULL;
ALTER TABLE user_targets ALTER COLUMN target_sop_rate SET NOT NULL;

-- Drop unique constraint (allow multiple active targets)
DROP INDEX IF EXISTS user_targets_user_type_active_unique;
```

### Code Changes

**Before (v0.3.0)**:
```typescript
const target = await db.insert(userTargets).values({
  userId,
  targetType: 'MONTHLY',
  targetWinRate: 65,
  targetSopRate: 80, // Optional
});
```

**After (v0.4.0)**:
```typescript
const target = await db.insert(userTargets).values({
  userId,
  name: 'My Monthly Goal',
  targetCategory: 'PERSONAL',
  targetType: 'MONTHLY',
  targetWinRate: 65,
  targetSopRate: 80, // Required
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-01-31'),
  notes: 'Focus on discipline',
});
```

---

## Related Documentation

- [Database Schema](03-DATABASE-SCHEMA.md#user_targets)
- [API Specification](04-API-SPECIFICATION.md#targets-endpoints)
- [User Dashboard](../setup/LOCAL-DEV-GUIDE.md#target-tracking)

---

**Last Updated**: January 12, 2026  
**Version**: 1.0 (v0.4.0)  
**Status**: ✅ Production
