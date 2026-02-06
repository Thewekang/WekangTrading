# Discipline Tracker - Feature Documentation

**Version:** 1.0.0  
**Status:** In Development  
**Branch:** `feature/discipline-tracker`  
**Created:** February 7, 2026

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Objectives](#objectives)
3. [Core Concepts](#core-concepts)
4. [Database Schema](#database-schema)
5. [Rules Engine](#rules-engine)
6. [API Specification](#api-specification)
7. [UI Components](#ui-components)
8. [User Workflows](#user-workflows)
9. [Implementation Plan](#implementation-plan)
10. [Testing Strategy](#testing-strategy)

---

## 1. Overview

### What is the Discipline Tracker?

The Discipline Tracker is a **standalone feature** designed to enforce daily trading discipline rules and prevent overtrading. It is NOT a strategy discovery tool, but rather an **execution discipline and rule enforcement system**.

### Key Characteristics

- ✅ Instrument-agnostic (works for any market or account)
- ✅ Configurable rules and P&L values
- ✅ Real-time rule evaluation
- ✅ Visual feedback (colors, locked cells, reasons)
- ✅ Cumulative statistics tracking
- ✅ Isolated from existing trade tracking (no database dependencies)

### Primary Use Cases

1. **Prevent Overtrading**: Automatically lock Trade 2 and Trade 3 based on outcomes
2. **Enforce Setup Quality**: Require "A+ Confirmed" after BE/SL results
3. **Risk Management**: Stop trading after wins to preserve profits
4. **Session Awareness**: Only allow Trade 3 in prime trading sessions
5. **Performance Tracking**: Monitor discipline adherence over time

---

## 2. Objectives

### Primary Objective
**Enforce daily trading discipline rules and prevent rule-breaking through automated guardrails.**

### Secondary Objectives
- Provide clear visual feedback on why trades are locked
- Track cumulative performance metrics (P&L, win rate, trade counts)
- Allow flexible configuration for different trading plans
- Enable historical analysis and filtering
- Maintain data isolation from existing trade tracking

---

## 3. Core Concepts

### 3.1 Trade Outcomes

Fixed set of outcomes for each trade:

| Outcome | Type | P&L Behavior | Color |
|---------|------|--------------|-------|
| `""` (Empty) | None | 0 | Gray (neutral) |
| `TP3` | Win | Manual input OR fixed value | Emerald green |
| `TP2` | Win | Configurable positive value | Green |
| `TP1` | Win | Configurable positive value | Lime green |
| `BE` | Breakeven | 0 (configurable) | Amber |
| `SL` | Loss | Configurable negative value | Rose red |

### 3.2 Plan Settings

Global configuration per user:

```typescript
{
  maxTradesPerDay: 2,              // Default: 2
  slValue: -80,                    // Stop loss P&L
  beValue: 0,                      // Breakeven P&L
  tp1Value: 80,                    // Take profit 1 P&L
  tp2Value: 160,                   // Take profit 2 P&L
  tp3Mode: 'manual' | 'fixed',     // TP3 handling mode
  tp3FixedValue: 240,              // Used if tp3Mode = 'fixed'
  winRateFormula: 'excludeBE' | 'includeBE'
}
```

### 3.3 Row Toggles (Per Day)

Conditions that affect rule evaluation:

- **A+ Confirmed**: High-quality setup verified
- **Range Expansion Confirmed**: Market volatility requirement for Trade 3
- **Session Window**: `prime` (best trading hours) or `non-prime`

### 3.4 Win Rate Formulas

**Formula A (excludeBE)**: `wins / (wins + losses)`
- BE trades are excluded from calculation
- More conservative metric

**Formula B (includeBE)**: `wins / (wins + losses + BE)`
- BE trades count in denominator
- Shows overall outcome distribution

---

## 4. Database Schema

### 4.1 Table: `discipline_tracker_settings`

Stores user-specific plan configuration.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | TEXT (UUID) | auto | Primary key |
| `user_id` | TEXT | - | FK to users.id (cascade delete) |
| `max_trades_per_day` | INTEGER | 2 | Maximum trades allowed |
| `sl_value` | REAL | -80 | Stop loss P&L amount |
| `be_value` | REAL | 0 | Breakeven P&L amount |
| `tp1_value` | REAL | 80 | Take profit 1 P&L amount |
| `tp2_value` | REAL | 160 | Take profit 2 P&L amount |
| `tp3_mode` | TEXT (enum) | 'manual' | TP3 mode: manual or fixed |
| `tp3_fixed_value` | REAL | 240 | Fixed TP3 value (if mode = fixed) |
| `win_rate_formula` | TEXT (enum) | 'excludeBE' | Win rate calculation method |
| `created_at` | TIMESTAMP | now | Creation timestamp |
| `updated_at` | TIMESTAMP | now | Last update timestamp |

**Indexes:**
- `user_id` (unique)

**Constraints:**
- One settings record per user
- Auto-created on first access with defaults

---

### 4.2 Table: `discipline_tracker_rows`

Stores daily trading records.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | TEXT (UUID) | auto | Primary key |
| `user_id` | TEXT | - | FK to users.id (cascade delete) |
| `trade_date` | TIMESTAMP | - | Trading date (unique per user) |
| `notes` | TEXT | '' | User notes/tags |
| `trade1_outcome` | TEXT (enum) | '' | Trade 1 outcome |
| `trade2_outcome` | TEXT (enum) | '' | Trade 2 outcome |
| `trade3_outcome` | TEXT (enum) | '' | Trade 3 outcome |
| `trade1_tp3_amount` | REAL | 0 | Manual TP3 amount for Trade 1 |
| `trade2_tp3_amount` | REAL | 0 | Manual TP3 amount for Trade 2 |
| `trade3_tp3_amount` | REAL | 0 | Manual TP3 amount for Trade 3 |
| `aplus_confirmed` | BOOLEAN | false | A+ setup confirmed toggle |
| `range_expansion_confirmed` | BOOLEAN | false | Range expansion toggle |
| `session_window` | TEXT (enum) | 'non-prime' | Session timing |
| `created_at` | TIMESTAMP | now | Creation timestamp |
| `updated_at` | TIMESTAMP | now | Last update timestamp |

**Indexes:**
- `user_id`
- `trade_date`
- Composite: `(user_id, trade_date)` (unique)

**Constraints:**
- One row per user per date
- Outcome enum: `['', 'TP3', 'TP2', 'TP1', 'BE', 'SL']`
- Session window enum: `['prime', 'non-prime']`

---

## 5. Rules Engine

### 5.1 Core Functions

```typescript
// Evaluate a single day's row
evaluateDayRow(row, settings): DayEvaluation {
  allowedTrade2: boolean
  allowedTrade3: boolean
  lockReasonTrade2: string
  lockReasonTrade3: string
  dayPnl: number
  wins: number
  losses: number
  bes: number
  totalTrades: number
  trade1Color: string
  trade2Color: string
  trade3Color: string
}

// Aggregate multiple rows
aggregateRows(rows, settings): AggregatedStats {
  totalPnl: number
  totalWins: number
  totalLosses: number
  totalBE: number
  totalTrades: number
  winRate: number  // 0-100 percentage
}

// Validate trade changes
validateTradeChange(row, tradeNumber, newOutcome, settings): {
  isValid: boolean
  reason: string
}
```

---

### 5.2 Discipline Rules (Detailed)

#### **DEFAULT RULE**
- Maximum trades per day = `maxTradesPerDay` setting (default: 2)

---

#### **TRADE 1 RULES**

**Rule 1.1: Win → STOP**
```
IF Trade 1 = TP1 OR TP2 OR TP3:
  → Trade 2: DISABLED
  → Trade 3: DISABLED
  → Reason: "✓ Trade 1 was a win - STOP for the day"
```

**Rule 1.2: Breakeven → Conditional Trade 2**
```
IF Trade 1 = BE:
  IF A+ Confirmed = true:
    → Trade 2: ENABLED
  ELSE:
    → Trade 2: DISABLED
    → Reason: "Trade 1 BE - Need A+ Confirmed"
```

**Rule 1.3: Stop Loss → Conditional Trade 2**
```
IF Trade 1 = SL:
  IF A+ Confirmed = true:
    → Trade 2: ENABLED
  ELSE:
    → Trade 2: DISABLED
    → Reason: "Trade 1 SL - Need A+ Confirmed"
```

---

#### **TRADE 2 RULES**

**Rule 2.1: Win → STOP**
```
IF Trade 2 = TP1 OR TP2 OR TP3:
  → Trade 3: DISABLED
  → Reason: "✓ Trade 2 was a win - STOP for the day"
```

**Rule 2.2: Stop Loss → STOP**
```
IF Trade 2 = SL:
  → Trade 3: DISABLED
  → Reason: "✗ Trade 2 was a loss - STOP for the day"
```

**Rule 2.3: Breakeven → STOP (Default)**
```
IF Trade 2 = BE:
  → Trade 3: DISABLED by default
  → Exception: See Trade 3 rules
```

---

#### **TRADE 3 RULES (RARE EXCEPTION)**

**Rule 3.1: Strict Multi-Condition Gate**
```
Trade 3 ENABLED ONLY IF ALL conditions are true:
  ✓ Trade 1 = BE
  ✓ Trade 2 = BE
  ✓ No realized losses for the day (losses count = 0)
  ✓ Range Expansion Confirmed = true
  ✓ Session Window = prime

OTHERWISE: Trade 3 DISABLED
```

**Lock Reasons (Priority Order):**
1. "Complete Trade 1 first" (if Trade 1 empty)
2. "Complete Trade 2 first" (if Trade 2 empty)
3. "Trade 1 & 2 are both BE" (if not both BE)
4. "Trade 3 not allowed - realized loss detected"
5. "Trade 3 needs Range Expansion Confirmed"
6. "Trade 3 only in Prime session"

---

### 5.3 Evaluation Triggers

Rules are re-evaluated whenever:
- ✅ Any trade outcome changes
- ✅ Any toggle changes (A+, Range Expansion, Session)
- ✅ Settings are updated
- ✅ Filters change (for aggregation)

### 5.4 Auto-Cleaning Rules

When Trade 1 changes:
- Re-evaluate all rules
- **Auto-clear Trade 2 if it becomes invalid**
- **Auto-clear Trade 3 if it becomes invalid**
- Display notice: "Trade 2/3 cleared due to rule changes"

---

## 6. API Specification

### 6.1 Settings Endpoints

#### `GET /api/discipline-tracker/settings`
Get user's current settings (creates defaults if none exist).

**Auth:** Required  
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "user123",
    "maxTradesPerDay": 2,
    "slValue": -80,
    "beValue": 0,
    "tp1Value": 80,
    "tp2Value": 160,
    "tp3Mode": "manual",
    "tp3FixedValue": 240,
    "winRateFormula": "excludeBE",
    "createdAt": "2026-02-07T...",
    "updatedAt": "2026-02-07T..."
  }
}
```

#### `PATCH /api/discipline-tracker/settings`
Update user settings.

**Auth:** Required  
**Body:**
```json
{
  "maxTradesPerDay": 3,
  "tp3Mode": "fixed",
  "winRateFormula": "includeBE"
}
```

**Response:**
```json
{
  "success": true,
  "data": { ...updated settings... },
  "message": "Settings updated successfully"
}
```

---

### 6.2 Rows Endpoints

#### `GET /api/discipline-tracker/rows`
Get all rows with optional filters.

**Auth:** Required  
**Query Params:**
- `month` (optional): `YYYY-MM` format
- `search` (optional): Search in notes
- `sortBy` (optional): `date-asc`, `date-desc`, `pnl-asc`, `pnl-desc`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "user123",
      "tradeDate": "2026-02-07T...",
      "notes": "Morning session",
      "trade1Outcome": "TP1",
      "trade2Outcome": "",
      "trade3Outcome": "",
      "trade1Tp3Amount": 0,
      "trade2Tp3Amount": 0,
      "trade3Tp3Amount": 0,
      "aplusConfirmed": true,
      "rangeExpansionConfirmed": false,
      "sessionWindow": "prime",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

#### `POST /api/discipline-tracker/rows`
Create a new row.

**Auth:** Required  
**Body:**
```json
{
  "tradeDate": "2026-02-07T00:00:00.000Z",
  "notes": "Test day",
  "aplusConfirmed": false,
  "rangeExpansionConfirmed": false,
  "sessionWindow": "non-prime"
}
```

**Response:** 201 Created
```json
{
  "success": true,
  "data": { ...new row... },
  "message": "Row created successfully"
}
```

**Errors:**
- 400: Duplicate date exists
- 400: Validation error

#### `GET /api/discipline-tracker/rows/[id]`
Get single row by ID.

**Auth:** Required  
**Response:** Same as GET list, single object

#### `PATCH /api/discipline-tracker/rows/[id]`
Update a row.

**Auth:** Required  
**Body:** Partial row updates
```json
{
  "trade1Outcome": "TP2",
  "aplusConfirmed": true
}
```

#### `DELETE /api/discipline-tracker/rows/[id]`
Delete a row.

**Auth:** Required  
**Response:**
```json
{
  "success": true,
  "message": "Row deleted successfully"
}
```

---

## 7. UI Components

### 7.1 Page Layout

```
┌─────────────────────────────────────────────────────────┐
│                   DISCIPLINE TRACKER                    │
│                  Rules before results                   │
├─────────────────────────────────────────────────────────┤
│                   SETTINGS PANEL                        │
│  [Max Trades] [SL] [BE] [TP1] [TP2] [TP3 Mode] [Win%]  │
│                    [Edit] [Save]                        │
├─────────────────────────────────────────────────────────┤
│                    FILTER BAR                           │
│  [This Month] [Last Month] [All Time] [🔍 Search...]   │
├─────────────────────────────────────────────────────────┤
│                 CUMULATIVE STATS                        │
│  P&L: $XXX | Wins: X | Losses: X | BE: X | Win%: XX%   │
├─────────────────────────────────────────────────────────┤
│                   TRACKER TABLE                         │
│ Date │ Notes │ T1 │ T2 │ T3 │ TP3$ │ A+ │ REx │ Sess  │
│─────────────────────────────────────────────────────────│
│ 2/7  │ Test  │TP1 │ 🔒 │ 🔒 │  -   │ ✓  │  -  │ Prime │
│ 2/6  │ Win   │TP2 │ 🔒 │ 🔒 │  -   │ ✓  │  -  │ Prime │
│                    [+ Add New Day]                      │
└─────────────────────────────────────────────────────────┘
```

### 7.2 Component Hierarchy

```
DisciplineTrackerPage
├── SettingsPanel
│   ├── Input fields (editable)
│   └── Save/Cancel buttons
├── FilterBar
│   ├── Month selector
│   ├── Quick filters
│   └── Search input
├── StatsDisplay
│   └── Metric cards
└── TrackerTable
    ├── Table header
    ├── Row[] (foreach row)
    │   ├── Date picker
    │   ├── Notes input
    │   ├── TradeCell (Trade 1)
    │   ├── TradeCell (Trade 2) - conditional lock
    │   ├── TradeCell (Trade 3) - conditional lock
    │   ├── TP3Input (conditional visibility)
    │   ├── Toggle checkboxes (A+, REx)
    │   ├── Session selector
    │   ├── Computed values (P&L, counts)
    │   └── RowActions (edit/delete/duplicate)
    └── AddRowDialog
```

### 7.3 Key Component Details

#### **TradeCell Component**
- Dropdown with 6 options: Empty, TP3, TP2, TP1, BE, SL
- Background color based on outcome
- Disabled state with lock icon
- Tooltip showing lock reason
- On change: triggers rule re-evaluation

#### **TP3Input Component**
- Only visible when outcome = TP3 AND tp3Mode = 'manual'
- Numeric input with validation
- Real-time P&L update

#### **Lock Indicators**
- Visual: Grayed background, reduced opacity
- Icon: Lock symbol (🔒)
- Cursor: `cursor-not-allowed`
- Tooltip: Shows exact lock reason

#### **Color Palette**
```typescript
OUTCOME_COLORS = {
  empty: 'bg-gray-50 border-gray-200',
  TP3: 'bg-emerald-100 border-emerald-300 text-emerald-900',
  TP2: 'bg-green-100 border-green-300 text-green-900',
  TP1: 'bg-lime-100 border-lime-300 text-lime-900',
  BE: 'bg-amber-50 border-amber-200 text-amber-900',
  SL: 'bg-rose-100 border-rose-300 text-rose-900',
  disabled: 'bg-gray-100 border-gray-300 text-gray-500 opacity-50',
}
```

---

## 8. User Workflows

### 8.1 First-Time Setup

1. Navigate to "Discipline Tracker" page
2. System auto-creates default settings
3. User clicks "Edit Settings"
4. Adjust P&L values, TP3 mode, win rate formula
5. Click "Save Settings"

### 8.2 Daily Entry Workflow

1. Click "+ Add New Day"
2. Date defaults to today (editable)
3. Add optional notes/tags
4. Set toggles: A+, Range Expansion, Session
5. Enter Trade 1 outcome
   - If Win: Trade 2/3 locked automatically
   - If BE/SL: Trade 2 enabled if A+ checked
6. If Trade 2 enabled, enter outcome
7. If Trade 3 enabled (rare), enter outcome
8. Click "Save Row"

### 8.3 Editing Existing Day

1. Find row in table
2. Click "Edit" icon
3. Change outcomes or toggles
4. System auto-clears invalid trades
5. See notification: "Trade X cleared due to rules"
6. Click "Save Changes"

### 8.4 Historical Analysis

1. Select month filter or use quick filters
2. View cumulative stats for period
3. Search by notes/tags
4. Sort by date or P&L
5. Export data (future enhancement)

---

## 9. Implementation Plan

### Phase 1: Foundation (Database)
- [x] Create `disciplineTracker.ts` schema
- [x] Update schema index
- [ ] Generate migration
- [ ] Apply migration to database

### Phase 2: Business Logic
- [ ] Create type definitions
- [ ] Create validation schemas
- [ ] Implement rules engine
- [ ] Implement database service

### Phase 3: API Layer
- [ ] Settings endpoints
- [ ] Rows list endpoint
- [ ] Single row CRUD endpoints

### Phase 4: UI Components
- [ ] SettingsPanel
- [ ] StatsDisplay
- [ ] FilterBar
- [ ] TradeCell
- [ ] TP3Input
- [ ] RowActions
- [ ] TrackerTable
- [ ] AddRowDialog

### Phase 5: Integration
- [ ] Main page assembly
- [ ] Add navigation link
- [ ] Update middleware (if needed)
- [ ] Add demo rows
- [ ] Full testing

---

## 10. Testing Strategy

### 10.1 Unit Tests (Rules Engine)

```typescript
describe('evaluateDayRow', () => {
  it('should disable Trade 2 when Trade 1 is a win')
  it('should require A+ for Trade 2 after BE')
  it('should require A+ for Trade 2 after SL')
  it('should disable Trade 3 when Trade 2 is a win')
  it('should disable Trade 3 when Trade 2 is a loss')
  it('should enable Trade 3 with double BE + conditions')
  it('should calculate P&L correctly')
  it('should classify outcomes correctly')
});

describe('aggregateRows', () => {
  it('should sum P&L across rows')
  it('should calculate win rate with excludeBE formula')
  it('should calculate win rate with includeBE formula')
});
```

### 10.2 Integration Tests

- [ ] Settings CRUD operations
- [ ] Row CRUD operations
- [ ] Duplicate date prevention
- [ ] Filter functionality
- [ ] Auto-cleaning on rule violations

### 10.3 E2E Tests

- [ ] Complete daily entry workflow
- [ ] Settings update flow
- [ ] Trade outcome changes trigger re-evaluation
- [ ] Lock states display correctly
- [ ] Stats update in real-time

### 10.4 Manual Testing Scenarios

**Scenario 1: Perfect Day**
- Trade 1: TP1 → Trade 2/3 locked ✓

**Scenario 2: Comeback**
- Trade 1: SL, A+ = true → Trade 2 enabled
- Trade 2: TP2 → Trade 3 locked ✓

**Scenario 3: Triple BE (Rare)**
- Trade 1: BE, A+ = true → Trade 2 enabled
- Trade 2: BE, Range Expansion = true, Session = Prime → Trade 3 enabled
- Trade 3: TP1 ✓

**Scenario 4: Settings Change**
- Change TP1 value from 80 to 100
- Historical rows recalculate automatically ✓

---

## 11. Future Enhancements

### Version 1.1
- [ ] CSV export functionality
- [ ] Weekly/monthly summary reports
- [ ] Discipline score calculation
- [ ] Violation tracking (rules broken count)

### Version 1.2
- [ ] Multiple trading plans support
- [ ] Plan templates library
- [ ] Rule customization UI
- [ ] Advanced filtering (date ranges, P&L ranges)

### Version 1.3
- [ ] Mobile app companion
- [ ] Push notifications for rule violations
- [ ] Sharing discipline stats with team
- [ ] Coaching mode (admin oversight)

---

## 12. Key Constraints & Decisions

### Technical Constraints
- ✅ No dependencies on existing trade tables
- ✅ User-scoped data only (no cross-user access)
- ✅ Real-time evaluation (no background jobs)
- ✅ Client-side state management for immediate feedback

### Design Decisions
- ✅ One row per date (prevents confusion)
- ✅ Auto-create settings (no setup friction)
- ✅ Visual locking > Error messages (better UX)
- ✅ Inline editing > Modal forms (faster workflow)
- ✅ Preserve history (no cascade deletes on outcome changes)

### Non-Goals
- ❌ NOT for strategy backtesting
- ❌ NOT for pattern discovery
- ❌ NOT for market analysis
- ❌ NOT for position sizing calculations
- ❌ NOT integrated with broker data

---

## 13. Success Metrics

### Launch Metrics (Week 1)
- 100% of users can create settings
- 100% of users can add rows
- 95% rule accuracy (no false locks/unlocks)
- < 200ms rule evaluation time

### Adoption Metrics (Month 1)
- 70% daily active usage rate
- Average 15 rows per user
- < 5% support tickets related to feature

### Impact Metrics (Month 3)
- Measurable reduction in overtrading
- Increased win rate adherence
- User-reported discipline improvement

---

## 14. Documentation & Training

### User Guide Topics
1. Understanding discipline rules
2. Configuring your trading plan
3. Daily entry best practices
4. Interpreting lock reasons
5. Using filters and stats

### Developer Notes
- Rules engine is stateless (pure functions)
- All validation happens twice (client + server)
- Colors defined in types file (single source)
- Database service handles all queries (no raw SQL in API)

---

## Appendix A: Example Data

### Sample Settings
```json
{
  "maxTradesPerDay": 2,
  "slValue": -80,
  "beValue": 0,
  "tp1Value": 80,
  "tp2Value": 160,
  "tp3Mode": "manual",
  "tp3FixedValue": 240,
  "winRateFormula": "excludeBE"
}
```

### Sample Row
```json
{
  "tradeDate": "2026-02-07T00:00:00.000Z",
  "notes": "NFP day - prime session",
  "trade1Outcome": "TP1",
  "trade2Outcome": "",
  "trade3Outcome": "",
  "trade1Tp3Amount": 0,
  "aplusConfirmed": true,
  "rangeExpansionConfirmed": false,
  "sessionWindow": "prime"
}
```

### Sample Evaluation
```json
{
  "allowedTrade2": false,
  "allowedTrade3": false,
  "lockReasonTrade2": "✓ Trade 1 was a win - STOP for the day",
  "lockReasonTrade3": "Complete Trade 1 first",
  "dayPnl": 80,
  "wins": 1,
  "losses": 0,
  "bes": 0,
  "totalTrades": 1,
  "trade1Color": "bg-lime-100 border-lime-300",
  "trade2Color": "bg-gray-100 border-gray-300 opacity-50",
  "trade3Color": "bg-gray-100 border-gray-300 opacity-50"
}
```

---

**End of Documentation**

For implementation questions, refer to the codebase or contact the development team.
