# Database Schema Design

## Document Control
- **Version**: 3.0
- **Last Updated**: January 18, 2026
- **Implementation Status**: ✅ CURRENT (v1.2.0)
- **Database**: Turso (LibSQL - SQLite for edge)
- **ORM**: Drizzle ORM (migrated from Prisma, January 11, 2026)
- **Migration**: 100% Complete (All gamification, SOP types, economic calendar, and invite code features)

---

## 1. Schema Overview

### 1.1 Tables Summary
| Table | Purpose | Relationships |
|-------|---------|---------------|
| `users` | User accounts (traders + admins) | Has many: individual_trades, daily_summaries, user_targets, sessions, user_badges, streaks, user_stats, motivational_messages |
| `individual_trades` | Individual transaction records with timestamp | Belongs to: user, daily_summary, sop_type |
| `daily_summaries` | Aggregated daily statistics (auto-calculated) | Belongs to: user; Has many: individual_trades |
| `user_targets` | Customizable winning rate targets | Belongs to: user |
| `badges` | Achievement badge definitions | Has many: user_badges |
| `user_badges` | User earned badges (junction table) | Belongs to: user, badge |
| `streaks` | User streak tracking (wins, logging, SOP) | Belongs to: user |
| `user_stats` | Denormalized user statistics for badge calculation | Belongs to: user |
| `motivational_messages` | Achievement notifications and motivational messages | Belongs to: user |
| `sop_types` | Admin-configurable SOP type definitions | Has many: individual_trades |
| `economic_events` | Economic calendar events | Standalone |
| `cron_logs` | Cron job execution logs | Standalone |
| `invite_codes` | Registration invite codes | Referenced by: users |
| `sessions` | Authentication sessions | Belongs to: user |
| `accounts` | OAuth accounts (future use) | Belongs to: user |

**Total Tables**: 15  
**Core Trading Tables**: 5 (users, individual_trades, daily_summaries, user_targets, sop_types)  
**Gamification Tables**: 5 (badges, user_badges, streaks, user_stats, motivational_messages)  
**System Tables**: 5 (economic_events, cron_logs, invite_codes, sessions, accounts)

### 1.2 Entity Relationship Diagram (ERD)

```
┌─────────────────┐
│     users       │
│─────────────────│
│ id (PK)         │
│ email           │◄──────────────────────┐
│ name            │                       │
│ password_hash   │                       │
│ role            │                       │
│ invite_code_id  │                       │
│ preferred_tz    │                       │
│ created_at      │                       │
│ updated_at      │                       │
└─────────────────┘                       │
        │                                 │
        │ 1:N                             │
        ├─────────────────────────────────┼────────┐
        │                                 │        │
        ▼                                 │        ▼
┌───────────────────────┐                 │  ┌──────────────┐
│ individual_trades     │                 │  │ user_stats   │
│───────────────────────│                 │  │──────────────│
│ id (PK)               │                 │  │ id (PK)      │
│ user_id (FK) ─────────┼─────────────────┘  │ user_id (FK) │
│ daily_summary_id (FK) │                    │ total_trades │
│ sop_type_id (FK) ─────┼───┐                │ total_wins   │
│ trade_timestamp       │   │                │ win_rate     │
│ result (WIN/LOSS)     │   │                │ badges_earned│
│ sop_followed (BOOL)   │   │                │ ...stats...  │
│ profit_loss_usd       │   │                └──────────────┘
│ market_session (ENUM) │   │
│ symbol (e.g. EURUSD)  │   │                       │
│ notes                 │   │                       │ 1:1
│ created_at            │   │                       ▼
│ updated_at            │   │                ┌──────────────┐
└───────────────────────┘   │                │   streaks    │
        │                   │                │──────────────│
        │ N:1               │                │ id (PK)      │
        ▼                   │                │ user_id (FK) │
┌───────────────────────┐   │                │ streak_type  │
│  daily_summaries      │   │                │ current      │
│───────────────────────│   │                │ longest      │
│ id (PK)               │   │                │ last_date    │
│ user_id (FK) ─────────┼───┼────┐           └──────────────┘
│ trade_date (DATE)     │   │    │
│ total_trades          │   │    │                  │
│ total_wins            │   │    │                  │ 1:N
│ total_losses          │   │    │                  ▼
│ asia_session_trades   │   │    │           ┌──────────────────┐
│ europe_session_trades │   │    │           │ user_badges      │
│ us_session_trades     │   │    │           │──────────────────│
│ overlap_session_trades│   │    │           │ id (PK)          │
│ best_session          │   │    │           │ user_id (FK)     │
│ created_at            │   │    │           │ badge_id (FK) ───┼────┐
│ updated_at            │   │    │           │ earned_at        │    │
└───────────────────────┘   │    │           │ progress         │    │
                            │    │           │ notified         │    │
┌─────────────────┐         │    │           └──────────────────┘    │
│ user_targets    │         │    │                                   │
│─────────────────│         │    │                                   │
│ id (PK)         │         │    │                                   │
│ user_id (FK) ───┼─────────┘    │           ┌──────────────────┐   │
│ name            │              │           │     badges       │   │
│ target_category │              │           │──────────────────│   │
│ target_type     │              │           │ id (PK)          │◄──┘
│ target_win_rate │              │           │ name             │
│ start_date      │              │           │ description      │
│ end_date        │              │           │ category         │
│ active          │              │           │ tier             │
│ created_at      │              │           │ icon             │
│ updated_at      │              │           │ requirement      │
└─────────────────┘              │           │ points           │
                                 │           │ order            │
┌────────────────────────┐       │           └──────────────────┘
│ motivational_messages  │       │
│────────────────────────│       │
│ id (PK)                │       │
│ user_id (FK) ──────────┼───────┘
│ message_type           │                ┌─────────────────┐
│ title                  │                │   sop_types     │
│ message                │                │─────────────────│
│ metadata               │                │ id (PK)         │◄───┐
│ is_read                │                │ name            │    │
│ created_at             │                │ description     │    │
└────────────────────────┘                │ active          │    │
                                          │ sort_order      │    │
┌─────────────────┐                       └─────────────────┘    │
│    sessions     │                                              │
│─────────────────│                                              │
│ id (PK)         │                                              │
│ session_token   │             (sop_type_id FK from             │
│ user_id (FK) ───┼────────┐     individual_trades) ─────────────┘
│ expires         │        │
└─────────────────┘        │
                           │
┌─────────────────┐        │
│   accounts      │        │
│─────────────────│        │
│ id (PK)         │        │
│ user_id (FK) ───┼────────┘
│ provider        │
│ provider_id     │
│ access_token    │
│ refresh_token   │
└─────────────────┘

┌──────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│ economic_events  │     │  invite_codes   │     │   cron_logs      │
│──────────────────│     │─────────────────│     │──────────────────│
│ id (PK)          │     │ id (PK)         │     │ id (PK)          │
│ event_date       │     │ code            │     │ job_name         │
│ country          │     │ created_by      │     │ status           │
│ currency         │     │ max_uses        │     │ started_at       │
│ event_name       │     │ used_count      │     │ completed_at     │
│ importance       │     │ expires_at      │     │ duration         │
│ forecast/actual  │     │ active          │     │ message          │
│ source           │     │ created_at      │     │ items_processed  │
└──────────────────┘     └─────────────────┘     └──────────────────┘
   (Standalone)           (Referenced by users)     (Standalone)
```

**Key Relationships**:
- **Users** (1:N) → Individual Trades, Daily Summaries, User Targets, Streaks, User Badges, Motivational Messages, Sessions, Accounts
- **Users** (1:1) → User Stats (denormalized performance data)
- **Individual Trades** (N:1) → Daily Summary (auto-linked)
- **Individual Trades** (N:1) → SOP Type (optional SOP categorization)
- **User Badges** (N:1) → Users, Badges (many-to-many junction)
- **Economic Events** → Standalone (no foreign keys)
- **Invite Codes** → Referenced by Users (soft reference via invite_code_id)
- **Cron Logs** → Standalone (system monitoring)

---

## 2. Detailed Table Definitions

### 2.1 Table: `users`

**Purpose**: Store user account information for authentication and profile management.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | STRING | PRIMARY KEY, UUID | Unique user identifier |
| `email` | STRING | UNIQUE, NOT NULL | User email (login identifier) |
| `name` | STRING | NOT NULL | User display name |
| `password_hash` | STRING | NOT NULL | Bcrypt hashed password |
| `role` | ENUM | NOT NULL, DEFAULT 'USER' | User role: USER or ADMIN |
| `email_verified` | DATETIME | NULLABLE | Email verification timestamp (future) |
| `image` | STRING | NULLABLE | Profile image URL (future) |
| `invite_code_id` | STRING | NULLABLE, FK (invite_codes.id) | Invite code used for registration |
| `reset_count` | INTEGER | NOT NULL, DEFAULT 0 | Count of password resets |
| `preferred_timezone` | STRING | NOT NULL, DEFAULT 'Asia/Kuala_Lumpur' | User's preferred timezone for display |
| `created_at` | DATETIME | NOT NULL, DEFAULT NOW | Account creation timestamp |
| `updated_at` | DATETIME | NOT NULL, AUTO UPDATE | Last update timestamp |

**Indexes**:
- Primary Key: `id`
- Unique Index: `email`
- Index: `role` (for admin queries)
- Index: `invite_code_id` (for tracking invite code usage)

**Sample Data**:
```sql
{
  id: "usr_abc123",
  email: "trader1@example.com",
  name: "John Trader",
  password_hash: "$2b$10$...",
  role: "USER",
  email_verified: null,
  image: null,
  invite_code_id: "inv_xyz789",
  reset_count: 0,
  preferred_timezone: "Asia/Kuala_Lumpur",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z"
}
```

---

### 2.2 Table: `individual_trades`

**Purpose**: Record individual trading transactions with precise timestamps for detailed analysis.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | STRING | PRIMARY KEY, UUID | Unique trade identifier |
| `user_id` | STRING | FOREIGN KEY (users.id), NOT NULL | Reference to user who made trade |
| `daily_summary_id` | STRING | FOREIGN KEY (daily_summaries.id), NULLABLE | Reference to daily summary (auto-linked) |
| `sop_type_id` | STRING | FOREIGN KEY (sop_types.id), NULLABLE | Reference to SOP type category |
| `trade_timestamp` | DATETIME | NOT NULL | Exact date and time of trade |
| `result` | ENUM | NOT NULL | WIN or LOSS |
| `sop_followed` | BOOLEAN | NOT NULL | Whether SOP was followed |
| `profit_loss_usd` | DECIMAL | NOT NULL | Profit or loss in USD (negative for loss) |
| `market_session` | ENUM | NOT NULL, AUTO-CALCULATED | ASIA, EUROPE, US, ASIA_EUROPE_OVERLAP, EUROPE_US_OVERLAP |
| `symbol` | STRING | NULLABLE | Trading symbol/pair (e.g., EURUSD, GBPJPY, XAUUSD) |
| `notes` | TEXT | NULLABLE | Optional notes for this specific trade |
| `created_at` | DATETIME | NOT NULL, DEFAULT NOW | Record creation timestamp |
| `updated_at` | DATETIME | NOT NULL, AUTO UPDATE | Last update timestamp |

**Constraints**:
- `CHECK (profit_loss_usd != 0)` - Profit/loss cannot be zero
- Trade can be WIN with negative profit_loss (rare but possible)
- Trade can be LOSS with positive profit_loss (rare but possible)

**Indexes**:
- Primary Key: `id`
- Composite Index: `user_id, trade_timestamp` (for time-based queries)
- Index: `daily_summary_id` (for linking to summaries)
- Index: `sop_type_id` (for SOP type filtering)
- Index: `market_session` (for session analysis)
- Index: `result` (for win/loss filtering)

**Sample Data**:
```sql
{
  id: "itrd_abc123",
  user_id: "usr_xyz789",
  daily_summary_id: "dsm_def456",
  sop_type_id: "sop_scalping",
  trade_timestamp: "2026-01-05T14:30:00Z",  // 2:30 PM UTC
  result: "WIN",
  sop_followed: true,
  profit_loss_usd: 125.50,
  market_session: "US",  // Auto-calculated from timestamp
  symbol: "EURUSD",
  notes: "Clean breakout trade",
  created_at: "2026-01-05T14:35:00Z",
  updated_at: "2026-01-05T14:35:00Z"
}
```

**Market Session Auto-Detection Logic**:
```typescript
// Based on trade_timestamp UTC (Malaysia GMT+8 perspective)
ASIA:                   00:00 - 06:59 UTC (08:00 - 14:59 MYT)
ASIA_EUROPE_OVERLAP:    07:00 - 08:59 UTC (15:00 - 16:59 MYT)
EUROPE:                 09:00 - 12:59 UTC (17:00 - 20:59 MYT)
EUROPE_US_OVERLAP:      13:00 - 15:59 UTC (21:00 - 23:59 MYT)
US:                     16:00 - 23:59 UTC (00:00 - 07:59 MYT next day)
```

**Business Rules**:
- Users can enter trades in real-time or bulk at end of day
- Each trade is linked to a daily_summary (auto-created if needed)
- Market session auto-calculated on insert/update
- Symbol field optional for backward compatibility
- SOP type categorization helps analyze which strategies work best
- Time-based analysis enables finding best trading hours

---

### 2.3 Table: `daily_summaries`

**Purpose**: Auto-calculated daily aggregations for quick dashboard queries (denormalized for performance).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | STRING | PRIMARY KEY, UUID | Unique summary identifier |
| `user_id` | STRING | FOREIGN KEY (users.id), NOT NULL | Reference to user |
| `trade_date` | DATE | NOT NULL | Trading date (extracted from timestamps) |
| `total_trades` | INTEGER | NOT NULL, DEFAULT 0 | Total trades for the day (auto-calculated) |
| `total_wins` | INTEGER | NOT NULL, DEFAULT 0 | Total winning trades (auto-calculated) |
| `total_losses` | INTEGER | NOT NULL, DEFAULT 0 | Total losing trades (auto-calculated) |
| `total_sop_followed` | INTEGER | NOT NULL, DEFAULT 0 | Trades following SOP (auto-calculated) |
| `total_sop_not_followed` | INTEGER | NOT NULL, DEFAULT 0 | Trades not following SOP (auto-calculated) |
| `total_profit_loss_usd` | DECIMAL | NOT NULL, DEFAULT 0 | Net profit/loss for day (auto-calculated) |
| `asia_session_trades` | INTEGER | NOT NULL, DEFAULT 0 | Trades during Asia session |
| `asia_session_wins` | INTEGER | NOT NULL, DEFAULT 0 | Wins during Asia session |
| `europe_session_trades` | INTEGER | NOT NULL, DEFAULT 0 | Trades during Europe session |
| `europe_session_wins` | INTEGER | NOT NULL, DEFAULT 0 | Wins during Europe session |
| `us_session_trades` | INTEGER | NOT NULL, DEFAULT 0 | Trades during US session |
| `us_session_wins` | INTEGER | NOT NULL, DEFAULT 0 | Wins during US session |
| `overlap_session_trades` | INTEGER | NOT NULL, DEFAULT 0 | Trades during overlap sessions |
| `overlap_session_wins` | INTEGER | NOT NULL, DEFAULT 0 | Wins during overlap sessions |
| `best_session` | ENUM | NULLABLE | Session with highest win rate (ASIA/EUROPE/US/ASIA_EUROPE_OVERLAP/EUROPE_US_OVERLAP) |
| `notes` | TEXT | NULLABLE | Optional daily notes (user-entered) |
| `created_at` | DATETIME | NOT NULL, DEFAULT NOW | Record creation timestamp |
| `updated_at` | DATETIME | NOT NULL, AUTO UPDATE | Last update timestamp |

**Constraints**:
- `UNIQUE (user_id, trade_date)` - One summary per user per day
- `CHECK (total_wins + total_losses = total_trades)`
- `CHECK (total_sop_followed + total_sop_not_followed = total_trades)`

**Indexes**:
- Primary Key: `id`
- Unique Composite Index: `user_id, trade_date` (for quick lookups)
- Composite Index: `user_id, trade_date` (for range queries)
- Index: `trade_date` (for admin aggregate queries)

**Sample Data**:
```sql
{
  id: "dsm_def456",
  user_id: "usr_xyz789",
  trade_date: "2026-01-05",
  total_trades: 12,
  total_wins: 8,
  total_losses: 4,
  total_sop_followed: 10,
  total_sop_not_followed: 2,
  total_profit_loss_usd: 450.75,
  asia_session_trades: 3,
  asia_session_wins: 2,
  europe_session_trades: 4,
  europe_session_wins: 3,
  us_session_trades: 5,
  us_session_wins: 3,
  overlap_session_trades: 0,
  overlap_session_wins: 0,
  best_session: "US",  // 80% win rate in US session
  notes: "Strong trend day, good discipline",
  created_at: "2026-01-05T14:30:00Z",
  updated_at: "2026-01-05T23:59:00Z"
}
```

**Business Rules**:
- Auto-created when first individual trade is entered for a date
- Auto-updated whenever individual trades are added/edited/deleted
- Users can add daily notes (separate from individual trade notes)
- Provides fast dashboard queries without aggregating individual trades
- Recalculated on any change to related individual_trades
- Session wins tracked separately for accurate win rate calculation

---

### 2.4 Table: `user_targets`

**Purpose**: Store customizable performance targets set by users (v0.4.0 enhanced).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | STRING | PRIMARY KEY, UUID | Unique target identifier |
| `user_id` | STRING | FOREIGN KEY (users.id), NOT NULL | Reference to user |
| `name` | STRING | NOT NULL | Custom target name (e.g., "MAVEN Prop Firm Phase 1") |
| `target_category` | ENUM | NOT NULL, DEFAULT 'PERSONAL' | PROP_FIRM (absolute) or PERSONAL (pace-based) |
| `target_type` | ENUM | NOT NULL | Type: WEEKLY, MONTHLY, YEARLY |
| `target_win_rate` | DECIMAL | NOT NULL, CHECK 0-100 | Target winning rate (percentage) |
| `target_sop_rate` | DECIMAL | NOT NULL, CHECK 0-100 | Target SOP compliance rate |
| `target_profit_usd` | DECIMAL | NULLABLE | Optional profit target in USD |
| `start_date` | DATETIME | NOT NULL | Target start date (can be past date) |
| `end_date` | DATETIME | NOT NULL | Target end date (auto-calculated from type + start) |
| `notes` | TEXT | NULLABLE | Optional notes for target context |
| `active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Is this target currently active |
| `created_at` | DATETIME | NOT NULL, DEFAULT NOW | Target creation timestamp |
| `updated_at` | DATETIME | NOT NULL, AUTO UPDATE | Last update timestamp |

**Constraints**:
- No unique constraint on active targets (users can have multiple active targets)
- `CHECK (end_date > start_date)`
- `CHECK (target_win_rate >= 0 AND target_win_rate <= 100)`
- `CHECK (target_sop_rate >= 0 AND target_sop_rate <= 100)`

**Indexes**:
- Primary Key: `id`
- Index: `user_id` (for user target queries)
- Composite Index: `user_id, target_type, active` (for filtering)
- Composite Index: `user_id, active, start_date, end_date` (for date range queries)

**Sample Data**:
```sql
{
  id: "tgt_def456",
  user_id: "usr_abc123",
  name: "MAVEN Prop Firm Phase 1",
  target_category: "PROP_FIRM",
  target_type: "MONTHLY",
  target_win_rate: 65.0,
  target_sop_rate: 80.0,
  target_profit_usd: 5000.00,
  start_date: "2026-01-01T00:00:00Z",
  end_date: "2026-01-31T23:59:59Z",
  notes: "First phase - need to hit absolute targets",
  active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z"
}
```

**v0.4.0 Enhancements**:
- **Custom Names**: User-defined labels for better organization
- **Categories**: PROP_FIRM (absolute deadline) vs PERSONAL (pace-based)
- **Flexible Dates**: Past start dates allowed (e.g., started Dec 15, ends Jan 15)
- **Multiple Active**: No auto-deactivation, users manage their own targets
- **Profit Targets**: Optional USD profit goals

---

### 2.5 Table: `badges`

**Purpose**: Define all available achievement badges for gamification system.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | STRING | PRIMARY KEY | Badge identifier (e.g., 'hundred_club', 'hot_streak') |
| `name` | STRING | NOT NULL | Display name (e.g., 'Century', 'On Fire') |
| `description` | STRING | NOT NULL | Badge description (e.g., 'Reached 100 recorded trades') |
| `category` | ENUM | NOT NULL | VOLUME, STREAK, PROFIT, CONSISTENCY, SOP, PERFORMANCE, SPECIAL |
| `tier` | ENUM | NOT NULL | BRONZE, SILVER, GOLD, PLATINUM |
| `icon` | STRING | NOT NULL | Emoji icon (e.g., '📊', '🔥', '💰') |
| `requirement` | TEXT | NOT NULL | JSON string with badge requirements |
| `points` | INTEGER | NOT NULL, DEFAULT 10 | Points awarded for earning badge |
| `order` | INTEGER | NOT NULL | Display order within category |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Is badge currently active? |
| `created_at` | DATETIME | NOT NULL, DEFAULT NOW | Record creation timestamp |

**Indexes**:
- Primary Key: `id`
- Index: `category` (for filtering badges by category)
- Index: `order` (for sorting badges)

**Sample Data**:
```sql
{
  id: "hundred_club",
  name: "Century",
  description: "Reached 100 recorded trades",
  category: "VOLUME",
  tier: "BRONZE",
  icon: "📊",
  requirement: "{\"totalTrades\": 100}",
  points: 50,
  order: 1,
  is_active: true,
  created_at: "2026-01-01T00:00:00Z"
}
```

---

### 2.6 Table: `user_badges`

**Purpose**: Junction table tracking which badges users have earned.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | STRING | PRIMARY KEY, UUID | Unique user badge identifier |
| `user_id` | STRING | FOREIGN KEY (users.id), NOT NULL | Reference to user |
| `badge_id` | STRING | FOREIGN KEY (badges.id), NOT NULL | Reference to badge |
| `earned_at` | DATETIME | NOT NULL, DEFAULT NOW | When badge was earned |
| `progress` | INTEGER | DEFAULT 0 | Current progress to next tier (if applicable) |
| `notified` | BOOLEAN | NOT NULL, DEFAULT FALSE | Has user been notified? |

**Constraints**:
- `UNIQUE (user_id, badge_id)` - User can only earn each badge once

**Indexes**:
- Primary Key: `id`
- Unique Composite Index: `user_id, badge_id` (prevent duplicates)
- Index: `user_id` (for user badge queries)
- Index: `earned_at` (for recent badges)

**Sample Data**:
```sql
{
  id: "ubd_abc123",
  user_id: "usr_xyz789",
  badge_id: "hundred_club",
  earned_at: "2026-01-15T10:30:00Z",
  progress: 0,
  notified: true
}
```

---

### 2.7 Table: `streaks`

**Purpose**: Track user streaks for winning days, logging consistency, and SOP compliance.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | STRING | PRIMARY KEY, UUID | Unique streak identifier |
| `user_id` | STRING | FOREIGN KEY (users.id), NOT NULL | Reference to user |
| `streak_type` | ENUM | NOT NULL | WIN_STREAK, LOG_STREAK, SOP_STREAK |
| `current_streak` | INTEGER | NOT NULL, DEFAULT 0 | Current consecutive streak count |
| `longest_streak` | INTEGER | NOT NULL, DEFAULT 0 | All-time longest streak |
| `last_streak_date` | DATE | NULLABLE | ISO date string (YYYY-MM-DD) of last streak day |
| `start_date` | DATE | NULLABLE | When current streak started |
| `updated_at` | DATETIME | NOT NULL, DEFAULT NOW | Last update timestamp |

**Constraints**:
- `UNIQUE (user_id, streak_type)` - One record per user per streak type

**Indexes**:
- Primary Key: `id`
- Unique Composite Index: `user_id, streak_type` (one per type)

**Sample Data**:
```sql
{
  id: "str_abc123",
  user_id: "usr_xyz789",
  streak_type: "WIN_STREAK",
  current_streak: 5,
  longest_streak: 12,
  last_streak_date: "2026-01-15",
  start_date: "2026-01-11",
  updated_at: "2026-01-15T18:00:00Z"
}
```

---

### 2.8 Table: `user_stats`

**Purpose**: Denormalized user statistics for fast badge calculation and progress tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | STRING | PRIMARY KEY, UUID | Unique stats identifier |
| `user_id` | STRING | FOREIGN KEY (users.id), UNIQUE, NOT NULL | Reference to user (1:1 relationship) |
| `total_trades` | INTEGER | NOT NULL, DEFAULT 0 | Lifetime total trades |
| `total_wins` | INTEGER | NOT NULL, DEFAULT 0 | Lifetime total wins |
| `total_losses` | INTEGER | NOT NULL, DEFAULT 0 | Lifetime total losses |
| `total_profit_usd` | DECIMAL | NOT NULL, DEFAULT 0 | Lifetime total profit/loss |
| `current_win_streak` | INTEGER | NOT NULL, DEFAULT 0 | Current winning streak (consecutive wins) |
| `longest_win_streak` | INTEGER | NOT NULL, DEFAULT 0 | All-time longest winning streak |
| `current_log_streak` | INTEGER | NOT NULL, DEFAULT 0 | Current logging streak (consecutive days) |
| `longest_log_streak` | INTEGER | NOT NULL, DEFAULT 0 | All-time longest logging streak |
| `total_sop_compliant` | INTEGER | NOT NULL, DEFAULT 0 | Total SOP-compliant trades |
| `sop_compliance_rate` | DECIMAL | NOT NULL, DEFAULT 0 | SOP compliance percentage (0-100) |
| `current_sop_streak` | INTEGER | NOT NULL, DEFAULT 0 | Current SOP compliance streak |
| `longest_sop_streak` | INTEGER | NOT NULL, DEFAULT 0 | Longest SOP compliance streak |
| `asia_trades` | INTEGER | NOT NULL, DEFAULT 0 | Total Asia session trades |
| `europe_trades` | INTEGER | NOT NULL, DEFAULT 0 | Total Europe session trades |
| `us_trades` | INTEGER | NOT NULL, DEFAULT 0 | Total US session trades |
| `overlap_trades` | INTEGER | NOT NULL, DEFAULT 0 | Total overlap session trades |
| `win_rate` | DECIMAL | NOT NULL, DEFAULT 0 | Current win rate percentage (0-100) |
| `best_win_rate` | DECIMAL | NOT NULL, DEFAULT 0 | Best win rate achieved (min 50 trades) |
| `badges_earned` | INTEGER | NOT NULL, DEFAULT 0 | Total badges earned |
| `total_points` | INTEGER | NOT NULL, DEFAULT 0 | Total gamification points |
| `first_trade_date` | DATE | NULLABLE | Date of first trade |
| `last_trade_date` | DATE | NULLABLE | Date of most recent trade |
| `consecutive_logging_days` | INTEGER | NOT NULL, DEFAULT 0 | Current consecutive logging days |
| `total_logging_days` | INTEGER | NOT NULL, DEFAULT 0 | Total unique days with trades |
| `has_completed_target` | BOOLEAN | NOT NULL, DEFAULT FALSE | Has completed at least one target |
| `has_perfect_month` | BOOLEAN | NOT NULL, DEFAULT FALSE | Has achieved 100% win rate in a month |
| `max_trades_in_day` | INTEGER | NOT NULL, DEFAULT 0 | Highest trades in single day |
| `updated_at` | DATETIME | NOT NULL, DEFAULT NOW | Last update timestamp |

**Indexes**:
- Primary Key: `id`
- Unique Index: `user_id` (1:1 with users)

**Sample Data**:
```sql
{
  id: "ust_abc123",
  user_id: "usr_xyz789",
  total_trades: 150,
  total_wins: 95,
  total_losses: 55,
  total_profit_usd: 2450.50,
  current_win_streak: 3,
  longest_win_streak: 12,
  current_log_streak: 15,
  longest_log_streak: 30,
  total_sop_compliant: 135,
  sop_compliance_rate: 90.0,
  current_sop_streak: 10,
  longest_sop_streak: 25,
  asia_trades: 40,
  europe_trades: 50,
  us_trades: 60,
  overlap_trades: 0,
  win_rate: 63.33,
  best_win_rate: 68.5,
  badges_earned: 5,
  total_points: 250,
  first_trade_date: "2025-12-01",
  last_trade_date: "2026-01-15",
  consecutive_logging_days: 15,
  total_logging_days: 45,
  has_completed_target: true,
  has_perfect_month: false,
  max_trades_in_day: 12,
  updated_at: "2026-01-15T20:00:00Z"
}
```

**Business Rules**:
- Auto-updated when trades/summaries are modified
- Provides fast lookups for badge eligibility
- Denormalized for performance (no complex aggregations needed)

---

### 2.9 Table: `motivational_messages`

**Purpose**: Store achievement notifications and motivational messages for users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | STRING | PRIMARY KEY, UUID | Unique message identifier |
| `user_id` | STRING | FOREIGN KEY (users.id), NOT NULL | Reference to user |
| `message_type` | ENUM | NOT NULL | ACHIEVEMENT, STREAK, MILESTONE, ENCOURAGEMENT, PERFORMANCE, REMINDER |
| `title` | STRING | NOT NULL | Message title (e.g., '🏆 New Achievement Unlocked!') |
| `message` | STRING | NOT NULL | Message body |
| `metadata` | TEXT | NULLABLE | JSON string with additional data (badge details, streak count, etc.) |
| `is_read` | BOOLEAN | NOT NULL, DEFAULT FALSE | Has user read this message? |
| `created_at` | DATETIME | NOT NULL, DEFAULT NOW | Message creation timestamp |

**Indexes**:
- Primary Key: `id`
- Index: `user_id` (for user message queries)
- Index: `created_at` (for chronological ordering)
- Index: `is_read` (for filtering unread messages)

**Sample Data**:
```sql
{
  id: "msg_abc123",
  user_id: "usr_xyz789",
  message_type: "ACHIEVEMENT",
  title: "🏆 New Achievement Unlocked!",
  message: "You've earned the 'Century' badge by reaching 100 trades!",
  metadata: "{\"badgeId\": \"hundred_club\", \"points\": 50}",
  is_read: false,
  created_at: "2026-01-15T10:30:00Z"
}
```

---

### 2.10 Table: `sop_types`

**Purpose**: Admin-configurable SOP (Standard Operating Procedure) type definitions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | STRING | PRIMARY KEY, UUID | Unique SOP type identifier |
| `name` | STRING | NOT NULL, UNIQUE | SOP type name (e.g., 'Scalping', 'Swing Trading') |
| `description` | TEXT | NULLABLE | SOP type description |
| `active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Is this SOP type currently active? |
| `sort_order` | INTEGER | NOT NULL, DEFAULT 0 | Display order for dropdown lists |
| `created_at` | DATETIME | NOT NULL, DEFAULT NOW | Record creation timestamp |
| `updated_at` | DATETIME | NOT NULL, AUTO UPDATE | Last update timestamp |

**Indexes**:
- Primary Key: `id`
- Unique Index: `name`
- Composite Index: `active, sort_order` (for sorting active SOP types)

**Sample Data**:
```sql
{
  id: "sop_scalping",
  name: "Scalping",
  description: "Quick in-and-out trades, holding for minutes",
  active: true,
  sort_order: 1,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z"
}
```

---

### 2.11 Table: `economic_events`

**Purpose**: Store economic calendar events for market analysis.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | STRING | PRIMARY KEY | Unique event identifier |
| `event_date` | DATETIME | NOT NULL | Date and time of economic event |
| `country` | STRING(3) | NOT NULL | Country code (e.g., 'USD', 'EUR', 'GBP') |
| `currency` | STRING(3) | NOT NULL | Currency code |
| `event_name` | STRING | NOT NULL | Name of economic event |
| `indicator` | STRING | NULLABLE | Economic indicator name |
| `importance` | ENUM | NOT NULL | HIGH, MEDIUM, LOW |
| `forecast` | STRING | NULLABLE | Forecasted value |
| `actual` | STRING | NULLABLE | Actual value (filled after event) |
| `previous` | STRING | NULLABLE | Previous value |
| `period` | STRING | NULLABLE | Time period of data |
| `source` | STRING | NOT NULL, DEFAULT 'API' | Data source (API or MANUAL) |
| `fetched_at` | DATETIME | NULLABLE | When data was fetched from API |
| `created_at` | DATETIME | NOT NULL, DEFAULT NOW | Record creation timestamp |

**Indexes**:
- Primary Key: `id`
- Index: `event_date` (for date range queries)
- Index: `importance` (for filtering high-impact events)

**Sample Data**:
```sql
{
  id: "evt_nfp_jan26",
  event_date: "2026-01-15T13:30:00Z",
  country: "US",
  currency: "USD",
  event_name: "Non-Farm Payrolls",
  indicator: "Employment Change",
  importance: "HIGH",
  forecast: "150K",
  actual: "165K",
  previous: "145K",
  period: "December 2025",
  source: "API",
  fetched_at: "2026-01-14T00:00:00Z",
  created_at: "2026-01-14T00:00:00Z"
}
```

---

### 2.12 Table: `cron_logs`

**Purpose**: Log cron job executions for monitoring and debugging.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | STRING | PRIMARY KEY | Unique log identifier |
| `job_name` | STRING | NOT NULL | Cron job name (e.g., 'economic-calendar-sync') |
| `status` | ENUM | NOT NULL | SUCCESS, ERROR, RUNNING |
| `started_at` | DATETIME | NOT NULL | Job start timestamp |
| `completed_at` | DATETIME | NULLABLE | Job completion timestamp |
| `duration` | INTEGER | NULLABLE | Execution duration in milliseconds |
| `message` | TEXT | NULLABLE | Log message |
| `details` | TEXT | NULLABLE | JSON string with additional info |
| `items_processed` | INTEGER | NULLABLE | Number of items processed |
| `error_code` | STRING | NULLABLE | Error code if failed |
| `error_message` | TEXT | NULLABLE | Error message if failed |
| `created_at` | DATETIME | NOT NULL, DEFAULT NOW | Record creation timestamp |

**Indexes**:
- Primary Key: `id`
- Index: `job_name` (for filtering by job)
- Index: `started_at` (for chronological queries)
- Index: `status` (for filtering by status)

**Sample Data**:
```sql
{
  id: "cron_abc123",
  job_name: "economic-calendar-sync",
  status: "SUCCESS",
  started_at: "2026-01-15T00:00:00Z",
  completed_at: "2026-01-15T00:02:15Z",
  duration: 135000,
  message: "Successfully synced 45 economic events",
  details: "{\"newEvents\": 10, \"updatedEvents\": 35}",
  items_processed: 45,
  error_code: null,
  error_message: null,
  created_at: "2026-01-15T00:00:00Z"
}
```

---

### 2.13 Table: `invite_codes`

**Purpose**: Manage registration invite codes for controlled user onboarding.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | STRING | PRIMARY KEY, UUID | Unique invite code identifier |
| `code` | STRING | NOT NULL, UNIQUE | Invite code string |
| `created_by` | STRING | NOT NULL | Admin user ID who created code |
| `max_uses` | INTEGER | NOT NULL, DEFAULT 1 | Maximum number of uses allowed |
| `used_count` | INTEGER | NOT NULL, DEFAULT 0 | Number of times code has been used |
| `expires_at` | DATETIME | NULLABLE | Expiration timestamp (null = never expires) |
| `active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Is code currently active? |
| `created_at` | DATETIME | NOT NULL, DEFAULT NOW | Record creation timestamp |
| `updated_at` | DATETIME | NOT NULL, AUTO UPDATE | Last update timestamp |

**Indexes**:
- Primary Key: `id`
- Unique Index: `code`
- Composite Index: `active, expires_at` (for validating codes)

**Sample Data**:
```sql
{
  id: "inv_abc123",
  code: "MAVEN2026",
  created_by: "usr_admin",
  max_uses: 5,
  used_count: 2,
  expires_at: "2026-12-31T23:59:59Z",
  active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-15T10:00:00Z"
}
```

---

### 2.14 Table: `sessions` (NextAuth.js)

**Purpose**: Manage user authentication sessions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | STRING | PRIMARY KEY, UUID | Unique session identifier |
| `session_token` | STRING | UNIQUE, NOT NULL | Session token |
| `user_id` | STRING | FOREIGN KEY (users.id), NOT NULL | Reference to user |
| `expires` | DATETIME | NOT NULL | Session expiration timestamp |

**Indexes**:
- Primary Key: `id`
- Unique Index: `session_token`
- Index: `user_id`

---

### 2.15 Table: `accounts` (NextAuth.js - Future OAuth)

**Purpose**: Store OAuth provider accounts (future feature).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | STRING | PRIMARY KEY, UUID | Unique account identifier |
| `user_id` | STRING | FOREIGN KEY (users.id), NOT NULL | Reference to user |
| `type` | STRING | NOT NULL | Account type (oauth, credentials) |
| `provider` | STRING | NOT NULL | Provider name (google, github, etc.) |
| `provider_account_id` | STRING | NOT NULL | Provider's user ID |
| `refresh_token` | TEXT | NULLABLE | OAuth refresh token |
| `access_token` | TEXT | NULLABLE | OAuth access token |
| `expires_at` | INTEGER | NULLABLE | Token expiration timestamp |
| `token_type` | STRING | NULLABLE | Token type |
| `scope` | STRING | NULLABLE | OAuth scope |
| `id_token` | TEXT | NULLABLE | OpenID token |

**Constraints**:
- `UNIQUE (provider, provider_account_id)`

---

## 3. Enums and Constants (SSOT)

### 3.1 User Role
```typescript
enum Role {
  USER  = "USER"
  ADMIN = "ADMIN"
}
```

### 3.2 Trade Result
```typescript
enum TradeResult {
  WIN  = "WIN"
  LOSS = "LOSS"
}
```

### 3.3 Market Session
```typescript
enum MarketSession {
  ASIA                = "ASIA"                // 00:00-06:59 UTC
  ASIA_EUROPE_OVERLAP = "ASIA_EUROPE_OVERLAP" // 07:00-08:59 UTC
  EUROPE              = "EUROPE"              // 09:00-12:59 UTC
  EUROPE_US_OVERLAP   = "EUROPE_US_OVERLAP"   // 13:00-15:59 UTC
  US                  = "US"                  // 16:00-23:59 UTC
}
```

### 3.4 Target Type
```typescript
enum TargetType {
  WEEKLY  = "WEEKLY"
  MONTHLY = "MONTHLY"
  YEARLY  = "YEARLY"
}
```

### 3.5 Target Category
```typescript
enum TargetCategory {
  PROP_FIRM = "PROP_FIRM"  // Absolute deadline-based targets
  PERSONAL  = "PERSONAL"   // Pace-based flexible targets
}
```

### 3.6 Badge Category
```typescript
enum BadgeCategory {
  VOLUME       = "VOLUME"       // Trade volume milestones
  STREAK       = "STREAK"       // Win/logging/SOP streaks
  PROFIT       = "PROFIT"       // Profit milestones
  CONSISTENCY  = "CONSISTENCY"  // Consistent performance
  SOP          = "SOP"          // SOP compliance
  PERFORMANCE  = "PERFORMANCE"  // Win rate achievements
  SPECIAL      = "SPECIAL"      // Special achievements
}
```

### 3.7 Badge Tier
```typescript
enum BadgeTier {
  BRONZE   = "BRONZE"
  SILVER   = "SILVER"
  GOLD     = "GOLD"
  PLATINUM = "PLATINUM"
}
```

### 3.8 Streak Type
```typescript
enum StreakType {
  WIN_STREAK = "WIN_STREAK"  // Consecutive winning days
  LOG_STREAK = "LOG_STREAK"  // Consecutive logging days
  SOP_STREAK = "SOP_STREAK"  // Consecutive SOP-compliant trades
}
```

### 3.9 Message Type
```typescript
enum MessageType {
  ACHIEVEMENT   = "ACHIEVEMENT"   // Badge unlocked
  STREAK        = "STREAK"        // Streak milestone
  MILESTONE     = "MILESTONE"     // Performance milestone
  ENCOURAGEMENT = "ENCOURAGEMENT" // Motivational message
  PERFORMANCE   = "PERFORMANCE"   // Performance update
  REMINDER      = "REMINDER"      // Activity reminder
}
```

### 3.10 Economic Event Importance
```typescript
enum Importance {
  HIGH   = "HIGH"
  MEDIUM = "MEDIUM"
  LOW    = "LOW"
}
```

### 3.11 Cron Job Status
```typescript
enum CronStatus {
  SUCCESS = "SUCCESS"
  ERROR   = "ERROR"
  RUNNING = "RUNNING"
}
```

---

## 4. Drizzle ORM Schema (Implementation)

**Note**: This project uses Drizzle ORM (migrated from Prisma on January 11, 2026). Schema definitions are located in `lib/db/schema/` directory with the following files:

- `users.ts` - User accounts and authentication
- `trades.ts` - Individual trade records
- `summaries.ts` - Daily summary aggregations
- `targets.ts` - User performance targets
- `badges.ts` - Badge definitions and user badges junction
- `streaks.ts` - Streak tracking
- `userStats.ts` - Denormalized user statistics
- `motivationalMessages.ts` - User notifications and messages
- `sopTypes.ts` - SOP type definitions
- `economicEvents.ts` - Economic calendar events
- `cronLogs.ts` - Cron job execution logs
- `inviteCodes.ts` - Registration invite codes
- `auth.ts` - NextAuth sessions and accounts

**Key Implementation Details**:
- Database: Turso (LibSQL - SQLite for edge)
- ORM: Drizzle ORM with TypeScript
- Type Safety: Full type inference with `$inferSelect` and `$inferInsert`
- Migrations: Generated via `drizzle-kit generate` and applied via `drizzle-kit push`
- Client: Singleton pattern in `lib/db.ts` for connection management

**Schema Export Pattern**:
```typescript
// Example from lib/db/schema/users.ts
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  // ... other fields
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

**Foreign Key Relationships** (enforced at application level):
- `individual_trades.user_id` → `users.id`
- `individual_trades.daily_summary_id` → `daily_summaries.id`
- `individual_trades.sop_type_id` → `sop_types.id`
- `daily_summaries.user_id` → `users.id`
- `user_targets.user_id` → `users.id`
- `user_badges.user_id` → `users.id`
- `user_badges.badge_id` → `badges.id`
- `streaks.user_id` → `users.id`
- `user_stats.user_id` → `users.id`
- `motivational_messages.user_id` → `users.id`
- `sessions.user_id` → `users.id`
- `accounts.user_id` → `users.id`
- `users.invite_code_id` → `invite_codes.id` (soft reference)

---

## 5. Sample Queries (Drizzle ORM)

## 5. Sample Queries (Drizzle ORM)

**Note**: The following examples use Drizzle ORM syntax. Actual implementations are in `lib/services/` directory.

### 5.1 Create Individual Trade (Real-time Entry)
```typescript
// User enters trade immediately after closing
import { db } from '@/lib/db';
import { individualTrades } from '@/lib/db/schema';
import { calculateMarketSession } from '@/lib/utils/marketSessions';

const tradeData = {
  userId: "usr_abc123",
  tradeTimestamp: new Date("2026-01-05T14:30:00Z"),
  result: "WIN" as const,
  sopFollowed: true,
  profitLossUsd: 125.50,
  marketSession: calculateMarketSession(new Date("2026-01-05T14:30:00Z")),
  symbol: "EURUSD",
  notes: "Clean breakout trade"
};

const [trade] = await db.insert(individualTrades).values(tradeData).returning();

// Auto-update or create daily summary
await updateDailySummary(userId, tradeDate);
```

### 5.2 Bulk Create Trades (End of Day Entry)
```typescript
// User enters all trades at end of day
const trades = [
  {
    userId: "usr_abc123",
    tradeTimestamp: new Date("2026-01-05T08:30:00Z"),
    result: "WIN",
    sopFollowed: true,
    profitLossUsd: 80.00,
    marketSession: "ASIA",
    notes: "Tokyo open trade"
  },
  {
    userId: "usr_abc123",
    tradeTimestamp: new Date("2026-01-05T14:15:00Z"),
    result: "LOSS",
    sopFollowed: false,
    profitLossUsd: -45.25,
    marketSession: "US",
    notes: "FOMO trade - broke rules"
  }
  // ... more trades
];

await prisma.individualTrade.createMany({
  data: trades
});

// Recalculate daily summary after bulk insert
await recalculateDailySummary(userId, "2026-01-05");
```

### 5.3 Get Individual Trades with Daily Summary
```typescript
const dailyData = await prisma.dailySummary.findUnique({
  where: {
    userId_tradeDate: {
      userId: "usr_abc123",
      tradeDate: new Date("2026-01-05")
    }
  },
  include: {
    individualTrades: {
      orderBy: {
        tradeTimestamp: 'asc'
      }
    }
  }
});

// Result includes summary stats + all individual trades
```

### 5.4 Calculate Win Rate by Market Session
```typescript
const sessionStats = await prisma.individualTrade.groupBy({
  by: ['marketSession', 'result'],
  where: {
    userId: userId,
    tradeTimestamp: {
      gte: startDate,
      lte: endDate
    }
  },
  _count: {
    id: true
  }
});

// Process to find best session
const asiaWins = sessionStats.filter(s => s.marketSession === 'ASIA' && s.result === 'WIN');
const asiaTotalTrades = sessionStats.filter(s => s.marketSession === 'ASIA');
const asiaWinRate = (asiaWins._count.id / asiaTotalTrades._count.id) * 100;
```

### 5.5 Get Trades by Hour of Day (Time Analysis)
```typescript
const trades = await prisma.individualTrade.findMany({
  where: {
    userId: userId,
    tradeTimestamp: {
      gte: startDate,
      lte: endDate
    }
  },
  select: {
    tradeTimestamp: true,
    result: true,
    profitLossUsd: true
  }
});

// Group by hour in application code
const tradesByHour = trades.reduce((acc, trade) => {
  const hour = trade.tradeTimestamp.getUTCHours();
  if (!acc[hour]) acc[hour] = { wins: 0, losses: 0, profit: 0 };
  
  acc[hour][trade.result === 'WIN' ? 'wins' : 'losses']++;
  acc[hour].profit += trade.profitLossUsd;
  
  return acc;
}, {});

// Find most profitable hour
```

### 5.6 Get Daily Summaries for Dashboard (Fast)
```typescript
// Use pre-calculated summaries for quick dashboard load
const summaries = await prisma.dailySummary.findMany({
  where: {
    userId: userId,
    tradeDate: {
      gte: startDate,
      lte: endDate
    }
  },
  orderBy: {
    tradeDate: 'desc'
  }
});

// No need to aggregate individual trades - already calculated
const totalWins = summaries.reduce((sum, s) => sum + s.totalWins, 0);
const totalTrades = summaries.reduce((sum, s) => sum + s.totalTrades, 0);
const winRate = (totalWins / totalTrades) * 100;
```

### 5.7 Admin: Get All Users with Trade Counts
```typescript
const users = await prisma.user.findMany({
  where: {
    role: 'USER'
  },
  include: {
    dailySummaries: {
      where: {
        tradeDate: {
          gte: startDate,
          lte: endDate
        }
      }
    },
    _count: {
      select: {
        individualTrades: true
      }
    }
  }
});
```

---

## 6. Data Validation Rules

### 6.1 Individual Trade Validation (Zod)
```typescript
const individualTradeSchema = z.object({
  tradeTimestamp: z.date(),
  result: z.enum(['WIN', 'LOSS']),
  sopFollowed: z.boolean(),
  profitLossUsd: z.number()
    .refine(val => val !== 0, { message: "Profit/loss cannot be zero" }),
  notes: z.string().max(500).optional()
});
```

### 6.2 Bulk Trade Entry Validation (Zod)
```typescript
const bulkTradeEntrySchema = z.object({
  trades: z.array(individualTradeSchema).min(1).max(100),
  tradeDate: z.date() // For validation - all trades should be from same day
}).refine(data => {
  // Ensure all trades are from the specified date
  return data.trades.every(trade => 
    isSameDay(trade.tradeTimestamp, data.tradeDate)
  );
}, { message: "All trades must be from the same day" });
```

### 6.3 Daily Summary Notes Validation (Zod)
```typescript
const dailySummaryNotesSchema = z.object({
  tradeDate: z.date(),
  notes: z.string().max(1000).optional()
});
```

### 6.4 Target Validation (Zod)
```typescript
const targetSchema = z.object({
  targetType: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']),
  targetWinRate: z.number().min(0).max(100),
  targetSopRate: z.number().min(0).max(100).optional()
});
```

---

## 7. Market Session Calculation Logic

```typescript
function calculateMarketSession(timestamp: Date): MarketSession {
  const hour = timestamp.getUTCHours();
  
  // ASIA: 00:00-09:00 UTC
  // EUROPE: 07:00-16:00 UTC
  // US: 13:00-22:00 UTC
  
  // Overlap periods
  if (hour >= 7 && hour < 9) {
    return 'OVERLAP'; // Asia-Europe overlap
  }
  if (hour >= 13 && hour < 16) {
    return 'OVERLAP'; // Europe-US overlap
  }
  
  // Single sessions
  if (hour >= 0 && hour < 7) {
    return 'ASIA';
  }
  if (hour >= 9 && hour < 13) {
    return 'EUROPE';
  }
  if (hour >= 16 && hour < 22) {
    return 'US';
  }
  
  // Late US/Early Asia (22:00-24:00)
  return 'ASIA';
}
```

---

## 8. Daily Summary Auto-Update Logic

```typescript
async function updateDailySummary(userId: string, tradeDate: Date) {
  // Get all individual trades for the date
  const trades = await prisma.individualTrade.findMany({
    where: {
      userId,
      tradeTimestamp: {
        gte: startOfDay(tradeDate),
        lte: endOfDay(tradeDate)
      }
    }
  });
  
  // Calculate aggregates
  const totalTrades = trades.length;
  const totalWins = trades.filter(t => t.result === 'WIN').length;
  const totalLosses = trades.filter(t => t.result === 'LOSS').length;
  const totalSopFollowed = trades.filter(t => t.sopFollowed).length;
  const totalSopNotFollowed = trades.filter(t => !t.sopFollowed).length;
  const totalProfitLossUsd = trades.reduce((sum, t) => sum + t.profitLossUsd, 0);
  
  // Calculate session breakdowns
  const asiaSessionTrades = trades.filter(t => t.marketSession === 'ASIA').length;
  const europeSessionTrades = trades.filter(t => t.marketSession === 'EUROPE').length;
  const usSessionTrades = trades.filter(t => t.marketSession === 'US').length;
  
  // Find best session (highest win rate)
  const sessions = [
    { name: 'ASIA', trades: trades.filter(t => t.marketSession === 'ASIA') },
    { name: 'EUROPE', trades: trades.filter(t => t.marketSession === 'EUROPE') },
    { name: 'US', trades: trades.filter(t => t.marketSession === 'US') }
  ];
  
  const bestSession = sessions
    .filter(s => s.trades.length > 0)
    .map(s => ({
      name: s.name,
      winRate: s.trades.filter(t => t.result === 'WIN').length / s.trades.length
    }))
    .sort((a, b) => b.winRate - a.winRate)[0]?.name;
  
  // Upsert daily summary
  await prisma.dailySummary.upsert({
    where: {
      userId_tradeDate: { userId, tradeDate }
    },
    update: {
      totalTrades,
      totalWins,
      totalLosses,
      totalSopFollowed,
      totalSopNotFollowed,
      totalProfitLossUsd,
      asiaSessionTrades,
      europeSessionTrades,
      usSessionTrades,
      bestSession
    },
    create: {
      userId,
      tradeDate,
      totalTrades,
      totalWins,
      totalLosses,
      totalSopFollowed,
      totalSopNotFollowed,
      totalProfitLossUsd,
      asiaSessionTrades,
      europeSessionTrades,
      usSessionTrades,
      bestSession
    }
  });
}
```

---

## 9. Migration Strategy

### 9.1 Initial Setup
```bash
# Initialize Prisma
npx prisma init

# Create migration (with new schema)
npx prisma migrate dev --name init_individual_trades

# Generate Prisma Client
npx prisma generate
```

### 9.2 Seed Data (Admin User)
```typescript
// scripts/seed-production.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  
  await prisma.user.create({
    data: {
      email: 'admin@wekangtradingjournal.com',
      name: 'Admin User',
      passwordHash: adminPassword,
      role: 'ADMIN'
    }
  });
  
  console.log('Seed data created');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## 10. Database Performance Considerations

### 10.1 Indexing Strategy
- Index frequently queried columns (userId, tradeTimestamp, tradeDate)
- Composite indexes for common query patterns
- Unique constraints for data integrity
- **CRITICAL**: Index on market_session for session analysis
- **CRITICAL**: Index on result for win/loss filtering

### 10.2 Query Optimization
- Use `select` to fetch only needed fields
- **Use daily_summaries for dashboard** (fast, pre-calculated)
- **Use individual_trades for detailed analysis** (slower, more data)
- Implement pagination for large result sets (especially individual trades)
- Batch inserts for bulk trade entry (createMany)

### 10.3 Connection Management
- Single Prisma client instance (singleton pattern)
- Connection pooling handled by Turso

### 10.4 Data Volume Estimates (Based on Client Requirements)

**Core Trading Data**:
- **Users**: 5 active users
- **Individual trades**: 30 trades/day/user = 900/month/user
- **Daily summaries**: 1 record/day/user = 30/month/user
- **Monthly totals**: 5 users × 900 trades = 4,500 individual trades/month
- **Annual totals**: 4,500 × 12 = 54,000 individual trades/year

**Gamification Data**:
- **Badges**: ~50 badge definitions (static)
- **User badges**: ~250 earned badges total (5 users × ~50 badges)
- **Streaks**: 15 streak records (5 users × 3 streak types)
- **User stats**: 5 records (1 per user)
- **Motivational messages**: ~500/month (100/user), retention 30 days

**System Data**:
- **SOP types**: ~10 types (admin-configurable)
- **Economic events**: ~500 events/month (auto-synced)
- **Cron logs**: ~100 logs/month (30 days retention)
- **Invite codes**: ~20 codes total
- **Sessions**: ~10 active sessions at any time

**Total Database Size Estimate**:
- 1 year core data: ~50-100MB
- Gamification data: ~5-10MB
- System data: ~10-20MB
- **Total**: ~65-130MB for 1 year

**Turso Free Tier**: 500MB storage, 1B reads/month (MORE than sufficient)

**Data Retention Strategy**:
- Individual trades: 1 year (archive older data)
- Daily summaries: Indefinite (small size)
- User badges/streaks/stats: Indefinite
- Motivational messages: 30 days
- Economic events: 6 months
- Cron logs: 30 days
- Sessions: Auto-cleanup on expiration

---

## 11. Backup and Recovery (Future)

### 11.1 Backup Strategy
- Turso automatic backups (based on plan)
- Manual exports via Prisma Studio
- CSV export functionality for users

### 11.2 Data Retention
- Keep all trade records indefinitely (unless user requests deletion)
- Inactive sessions: Auto-cleanup after expiration
- Audit logs: Consider adding in future

---

## 12. Compliance Considerations

### 12.1 Data Privacy
- User data encrypted in transit (HTTPS)
- Passwords hashed with bcrypt
- User can request data deletion (GDPR compliance - future)

### 12.2 Data Access
- Users can only access own data
- Admins can view all data (for monitoring)
- Audit trail for admin actions (future enhancement)

---

## 13. Schema Evolution Plan

### 13.1 Phase 1 (MVP) - ✅ COMPLETE
- Individual trade tracking with timestamps
- Auto-calculated daily summaries
- Market session analysis
- Profit/loss tracking in USD
- User targets with categories
- SOP type categorization

### 13.2 Phase 2 (Gamification) - ✅ COMPLETE (v1.2.0)
- Badge system (badges, user_badges tables)
- Streak tracking (streaks table)
- User statistics (user_stats table)
- Motivational messages (motivational_messages table)
- Economic calendar integration (economic_events table)
- Cron job monitoring (cron_logs table)
- Invite code system (invite_codes table)
- Symbol tracking in trades
- Timezone preferences

### 13.3 Phase 3 (Future Enhancements)
- Add `trade_attachments` table for screenshots
- Add `notifications` table for real-time alerts
- Add `audit_logs` table for admin actions
- Add `reports` table for saved custom reports
- Add `trade_tags` for custom categorization
- Add `user_preferences` for detailed settings

### 13.4 Phase 4 (Advanced Features)
- Add `teams` table for team management
- Add `trading_strategies` table with strategy performance
- Add `market_conditions` tracking (volatility, news events)
- Add `broker_accounts` for multi-account tracking
- Add `social_features` (following, sharing, competitions)

---

## 14. Key Design Decisions

### 14.1 Why Both Individual Trades AND Daily Summaries?

**Individual Trades**:
- ✅ Detailed time-based analysis
- ✅ Find best trading hours
- ✅ Analyze by market session
- ✅ Track exact profit/loss per trade
- ❌ Slower queries when aggregating

**Daily Summaries**:
- ✅ Fast dashboard loading
- ✅ Pre-calculated statistics
- ✅ Efficient for charts/graphs
- ✅ Reduces database load
- ❌ Additional storage (minimal)

**Solution**: Use both in complementary fashion
- Dashboard queries → daily_summaries (fast)
- Detailed analysis → individual_trades (comprehensive)
- Auto-sync keeps summaries accurate

### 14.2 Market Session Auto-Detection

**Why auto-detect instead of manual entry?**
- ✅ Eliminates user error
- ✅ Ensures consistency
- ✅ Allows reliable session analysis
- ✅ One less field for user to enter

**Implementation**: Calculate on insert/update using timestamp

### 14.3 Denormalized User Stats

**Why user_stats table?**
- ✅ Fast badge eligibility checks (no complex aggregations)
- ✅ Quick dashboard stats display
- ✅ Reduces database load for common queries
- ✅ Single source for leaderboard data
- ❌ Requires careful synchronization with trades

**Solution**: Auto-update user_stats whenever trades are modified
- Batch updates for performance
- Idempotent operations for reliability
- Recalculation scripts available for data integrity

### 14.4 Badge System Design

**Why separate badges and user_badges tables?**
- ✅ Badge definitions centralized (easy to add new badges)
- ✅ Users can earn same badge at different times
- ✅ Progress tracking for multi-tier badges
- ✅ Notification system integration
- ✅ Admin can activate/deactivate badges

**Badge Requirement Format**: JSON string for flexibility
```json
{
  "totalTrades": 100,
  "minWinRate": 65,
  "consecutiveWins": 5
}
```

### 14.5 Economic Calendar Integration

**Why store economic events?**
- ✅ Correlate trade performance with news events
- ✅ Avoid trading during high-impact news
- ✅ Offline access to calendar data
- ✅ Historical analysis of volatility periods

**Data Source**: Forex Factory API (or similar)
**Sync Strategy**: Daily cron job fetches upcoming week of events
**Retention**: 6 months for historical analysis

---

## 15. Table Count and Size Summary

| Category | Tables | Purpose |
|----------|--------|---------|
| **Core Trading** | 5 | users, individual_trades, daily_summaries, user_targets, sop_types |
| **Gamification** | 5 | badges, user_badges, streaks, user_stats, motivational_messages |
| **System** | 5 | economic_events, cron_logs, invite_codes, sessions, accounts |
| **TOTAL** | **15** | Complete v1.2.0 implementation |

**Estimated Row Counts (5 users, 1 year)**:
- individual_trades: 54,000 rows
- daily_summaries: 1,825 rows
- user_targets: ~50 rows
- badges: 50 rows
- user_badges: 250 rows
- streaks: 15 rows
- user_stats: 5 rows
- motivational_messages: 6,000 rows (30-day retention)
- sop_types: 10 rows
- economic_events: 3,000 rows (6-month retention)
- cron_logs: 1,000 rows (30-day retention)
- invite_codes: 20 rows
- sessions: ~10 active
- accounts: 0 (future OAuth)

**Total**: ~66,235 rows (core data ~56K, gamification ~6K, system ~4K)

---

## Acceptance Criteria

### Core Trading Features
- ✅ All 15 tables defined with proper relationships
- ✅ Foreign key relationships documented (enforced at application level)
- ✅ Data validation rules specified
- ✅ Indexes for query optimization
- ✅ Single Source of Truth (Drizzle ORM schema in lib/db/schema/)
- ✅ Migration strategy defined and executed
- ✅ Individual trade tracking enabled
- ✅ Dual-entry system (real-time + bulk)
- ✅ Market session auto-detection with overlap sessions
- ✅ Daily summary auto-calculation

### Gamification Features (v1.2.0)
- ✅ Badge system with 7 categories and 4 tiers
- ✅ Streak tracking (win, logging, SOP)
- ✅ User statistics denormalization
- ✅ Motivational message system
- ✅ Progress tracking for badges

### Advanced Features (v1.2.0)
- ✅ SOP type categorization
- ✅ Economic calendar integration
- ✅ Cron job monitoring
- ✅ Invite code system for registration control
- ✅ Trading symbol tracking
- ✅ Timezone preference support

### Data Integrity
- ✅ Unique constraints prevent duplicates
- ✅ Check constraints enforce business rules
- ✅ Indexes optimize common queries
- ✅ Auto-update triggers maintain consistency
- ✅ Cascading deletes prevent orphaned records

---

## Document Status

**Status**: ✅ CURRENT - v1.2.0 Complete Implementation  
**Version**: 3.0  
**Last Updated**: January 18, 2026  
**Database Schema**: 15 tables, fully implemented  
**ORM**: Drizzle ORM (migrated from Prisma January 11, 2026)  
**Next Update**: When Phase 3 features are added

**Change Log**:
- **v3.0** (Jan 18, 2026): Added all v1.2.0 tables (gamification, SOP types, economic calendar, invite codes), updated enums, comprehensive documentation
- **v2.3** (Jan 12, 2026): Updated daily_summaries with overlap session tracking
- **v2.0** (Previous): Individual trade tracking model, Drizzle ORM migration
- **v1.0** (Initial): Basic schema design

**Related Documents**:
- API Specification: `04-API-SPECIFICATION.md`
- System Architecture: `02-SYSTEM-ARCHITECTURE.md`
- Gamification System: `12-GAMIFICATION-SYSTEM.md`
- Milestones Roadmap: `05-MILESTONES-ROADMAP.md`

---

*End of Database Schema Documentation v3.0*

