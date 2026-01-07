# Database Schema Design

## Document Control
- **Version**: 2.0
- **Status**: UPDATED - Individual Trade Tracking Model
- **Last Updated**: January 7, 2026
- **Database**: Turso (SQLite-compatible)

---

## 1. Schema Overview

### 1.1 Tables Summary
| Table | Purpose | Relationships |
|-------|---------|---------------|
| `users` | User accounts (traders + admins) | Has many: individual_trades, daily_summaries, user_targets, sessions |
| `individual_trades` | Individual transaction records with timestamp | Belongs to: user, daily_summary |
| `daily_summaries` | Aggregated daily statistics (auto-calculated) | Belongs to: user; Has many: individual_trades |
| `user_targets` | Customizable winning rate targets | Belongs to: user |
| `sessions` | Authentication sessions | Belongs to: user |
| `accounts` | OAuth accounts (future use) | Belongs to: user |

### 1.2 Entity Relationship Diagram (ERD)

```
┌─────────────────┐
│     users       │
│─────────────────│
│ id (PK)         │
│ email           │◄─────────────┐
│ name            │              │
│ password_hash   │              │
│ role            │              │
│ created_at      │              │
│ updated_at      │              │
└─────────────────┘              │
        │                        │
        │ 1:N                    │
        ▼                        │
┌───────────────────────┐        │
│ individual_trades     │        │
│───────────────────────│        │
│ id (PK)               │        │
│ user_id (FK) ─────────┼────────┘
│ daily_summary_id (FK) │
│ trade_timestamp       │
│ result (WIN/LOSS)     │
│ sop_followed (BOOL)   │
│ profit_loss_usd       │
│ market_session (ENUM) │
│ notes                 │
│ created_at            │
│ updated_at            │
└───────────────────────┘
        │
        │ N:1
        ▼
┌───────────────────────┐
│  daily_summaries      │
│───────────────────────│
│ id (PK)               │
│ user_id (FK) ─────────┼────────┐
│ trade_date (DATE)     │        │
│ total_trades          │        │
│ total_wins            │        │
│ total_losses          │        │
│ total_sop_followed    │        │
│ total_sop_not_follow  │        │
│ total_profit_loss_usd │        │
│ created_at            │        │
│ updated_at            │        │
└───────────────────────┘        │
                                 │
┌─────────────────┐              │
│ user_targets    │              │
│─────────────────│              │
│ id (PK)         │              │
│ user_id (FK) ───┼──────────────┘
│ target_type     │
│ target_value    │
│ created_at      │
│ updated_at      │
└─────────────────┘

┌─────────────────┐
│    sessions     │
│─────────────────│
│ id (PK)         │
│ session_token   │
│ user_id (FK) ───┼──────────────┐
│ expires         │              │
└─────────────────┘              │
                                 │
┌─────────────────┐              │
│   accounts      │              │
│─────────────────│              │
│ id (PK)         │              │
│ user_id (FK) ───┼──────────────┘
│ provider        │
│ provider_id     │
│ access_token    │
│ refresh_token   │
└─────────────────┘
```

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
| `created_at` | DATETIME | NOT NULL, DEFAULT NOW | Account creation timestamp |
| `updated_at` | DATETIME | NOT NULL, AUTO UPDATE | Last update timestamp |

**Indexes**:
- Primary Key: `id`
- Unique Index: `email`
- Index: `role` (for admin queries)

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
| `trade_timestamp` | DATETIME | NOT NULL | Exact date and time of trade |
| `result` | ENUM | NOT NULL | WIN or LOSS |
| `sop_followed` | BOOLEAN | NOT NULL | Whether SOP was followed |
| `profit_loss_usd` | DECIMAL | NOT NULL | Profit or loss in USD (negative for loss) |
| `market_session` | ENUM | NOT NULL, AUTO-CALCULATED | ASIA, EUROPE, US, OVERLAP |
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
- Index: `market_session` (for session analysis)
- Index: `result` (for win/loss filtering)

**Sample Data**:
```sql
{
  id: "itrd_abc123",
  user_id: "usr_xyz789",
  daily_summary_id: "dsm_def456",
  trade_timestamp: "2026-01-05T14:30:00Z",  // 2:30 PM UTC
  result: "WIN",
  sop_followed: true,
  profit_loss_usd: 125.50,
  market_session: "US",  // Auto-calculated from timestamp
  notes: "Clean breakout trade",
  created_at: "2026-01-05T14:35:00Z",
  updated_at: "2026-01-05T14:35:00Z"
}
```

**Market Session Auto-Detection Logic**:
```typescript
// Based on trade_timestamp UTC
ASIA:    00:00 - 09:00 UTC
EUROPE:  07:00 - 16:00 UTC
US:      13:00 - 22:00 UTC
OVERLAP: Times when sessions overlap (Asia-Europe: 07:00-09:00, Europe-US: 13:00-16:00)
```

**Business Rules**:
- Users can enter trades in real-time or bulk at end of day
- Each trade is linked to a daily_summary (auto-created if needed)
- Market session auto-calculated on insert/update
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
| `europe_session_trades` | INTEGER | NOT NULL, DEFAULT 0 | Trades during Europe session |
| `us_session_trades` | INTEGER | NOT NULL, DEFAULT 0 | Trades during US session |
| `best_session` | ENUM | NULLABLE | Session with highest win rate (ASIA/EUROPE/US) |
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
  europe_session_trades: 4,
  us_session_trades: 5,
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

---

### 2.4 Table: `user_targets`

**Purpose**: Store customizable performance targets set by users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | STRING | PRIMARY KEY, UUID | Unique target identifier |
| `user_id` | STRING | FOREIGN KEY (users.id), NOT NULL | Reference to user |
| `target_type` | ENUM | NOT NULL | Type: WEEKLY, MONTHLY, YEARLY |
| `target_win_rate` | DECIMAL | NOT NULL, CHECK 0-100 | Target winning rate (percentage) |
| `target_sop_rate` | DECIMAL | NULLABLE, CHECK 0-100 | Target SOP compliance rate (optional) |
| `active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Is this target currently active |
| `created_at` | DATETIME | NOT NULL, DEFAULT NOW | Target creation timestamp |
| `updated_at` | DATETIME | NOT NULL, AUTO UPDATE | Last update timestamp |

**Constraints**:
- `UNIQUE (user_id, target_type, active)` WHERE `active = true` - One active target per type per user

**Indexes**:
- Primary Key: `id`
- Composite Index: `user_id, target_type, active`

**Sample Data**:
```sql
{
  id: "tgt_def456",
  user_id: "usr_abc123",
  target_type: "WEEKLY",
  target_win_rate: 65.0,
  target_sop_rate: 80.0,
  active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z"
}
```

---

### 2.5 Table: `sessions` (NextAuth.js)

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

### 2.6 Table: `accounts` (NextAuth.js - Future OAuth)

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
  ASIA    = "ASIA"      // 00:00-09:00 UTC
  EUROPE  = "EUROPE"    // 07:00-16:00 UTC
  US      = "US"        // 13:00-22:00 UTC
  OVERLAP = "OVERLAP"   // Asia-Europe (07:00-09:00) or Europe-US (13:00-16:00)
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

---

## 4. Prisma Schema (Implementation)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite" // Will connect to Turso via libSQL
  url      = env("DATABASE_URL")
}

// ============================================
// USER MODEL
// ============================================
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  name          String
  passwordHash  String    @map("password_hash")
  role          Role      @default(USER)
  emailVerified DateTime? @map("email_verified")
  image         String?
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  // Relations
  individualTrades IndividualTrade[]
  dailySummaries   DailySummary[]
  targets          UserTarget[]
  sessions         Session[]
  accounts         Account[]

  @@map("users")
}

enum Role {
  USER
  ADMIN
}

// ============================================
// INDIVIDUAL TRADE MODEL
// ============================================
model IndividualTrade {
  id               String        @id @default(uuid())
  userId           String        @map("user_id")
  dailySummaryId   String?       @map("daily_summary_id")
  tradeTimestamp   DateTime      @map("trade_timestamp")
  result           TradeResult
  sopFollowed      Boolean       @map("sop_followed")
  profitLossUsd    Float         @map("profit_loss_usd")
  marketSession    MarketSession @map("market_session")
  notes            String?
  createdAt        DateTime      @default(now()) @map("created_at")
  updatedAt        DateTime      @updatedAt @map("updated_at")

  // Relations
  user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  dailySummary  DailySummary? @relation(fields: [dailySummaryId], references: [id], onDelete: SetNull)

  @@index([userId, tradeTimestamp])
  @@index([dailySummaryId])
  @@index([marketSession])
  @@index([result])
  @@map("individual_trades")
}

enum TradeResult {
  WIN
  LOSS
}

enum MarketSession {
  ASIA
  EUROPE
  US
  OVERLAP
}

// ============================================
// DAILY SUMMARY MODEL (Auto-calculated)
// ============================================
model DailySummary {
  id                      String   @id @default(uuid())
  userId                  String   @map("user_id")
  tradeDate               DateTime @map("trade_date") @db.Date
  totalTrades             Int      @default(0) @map("total_trades")
  totalWins               Int      @default(0) @map("total_wins")
  totalLosses             Int      @default(0) @map("total_losses")
  totalSopFollowed        Int      @default(0) @map("total_sop_followed")
  totalSopNotFollowed     Int      @default(0) @map("total_sop_not_followed")
  totalProfitLossUsd      Float    @default(0) @map("total_profit_loss_usd")
  asiaSessionTrades       Int      @default(0) @map("asia_session_trades")
  europeSessionTrades     Int      @default(0) @map("europe_session_trades")
  usSessionTrades         Int      @default(0) @map("us_session_trades")
  bestSession             MarketSession? @map("best_session")
  notes                   String?
  createdAt               DateTime @default(now()) @map("created_at")
  updatedAt               DateTime @updatedAt @map("updated_at")

  // Relations
  user             User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  individualTrades IndividualTrade[]

  @@unique([userId, tradeDate])
  @@index([userId, tradeDate])
  @@index([tradeDate])
  @@map("daily_summaries")
}

// ============================================
// USER TARGET MODEL
// ============================================
model UserTarget {
  id             String     @id @default(uuid())
  userId         String     @map("user_id")
  targetType     TargetType @map("target_type")
  targetWinRate  Float      @map("target_win_rate")
  targetSopRate  Float?     @map("target_sop_rate")
  active         Boolean    @default(true)
  createdAt      DateTime   @default(now()) @map("created_at")
  updatedAt      DateTime   @updatedAt @map("updated_at")

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, targetType, active])
  @@index([userId, targetType, active])
  @@map("user_targets")
}

enum TargetType {
  WEEKLY
  MONTHLY
  YEARLY
}

// ============================================
// SESSION MODEL (NextAuth)
// ============================================
model Session {
  id           String   @id @default(uuid())
  sessionToken String   @unique @map("session_token")
  userId       String   @map("user_id")
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("sessions")
}

// ============================================
// ACCOUNT MODEL (NextAuth - Future OAuth)
// ============================================
model Account {
  id                String  @id @default(uuid())
  userId            String  @map("user_id")
  type              String
  provider          String
  providerAccountId String  @map("provider_account_id")
  refreshToken      String? @map("refresh_token")
  accessToken       String? @map("access_token")
  expiresAt         Int?    @map("expires_at")
  tokenType         String? @map("token_type")
  scope             String?
  idToken           String? @map("id_token")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
  @@map("accounts")
}
```

---

## 5. Sample Queries

### 5.1 Create Individual Trade (Real-time Entry)
```typescript
// User enters trade immediately after closing
const trade = await prisma.individualTrade.create({
  data: {
    userId: "usr_abc123",
    tradeTimestamp: new Date("2026-01-05T14:30:00Z"),
    result: "WIN",
    sopFollowed: true,
    profitLossUsd: 125.50,
    marketSession: calculateMarketSession(new Date("2026-01-05T14:30:00Z")),
    notes: "Clean breakout trade"
  }
});

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
// prisma/seed.ts
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
- **Users**: 5 active users
- **Individual trades**: 30 trades/day/user = 900/month/user
- **Daily summaries**: 1 record/day/user = 30/month/user
- **Monthly totals**: 5 users × 900 trades = 4,500 individual trades/month
- **Annual totals**: 4,500 × 12 = 54,000 individual trades/year
- **Data retention**: 1 year (delete trades older than 1 year)
- **Database size estimate**: ~50-100MB for 1 year of data
- **Turso free tier**: 500MB storage, 1B reads/month (MORE than sufficient)

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

### 13.1 Phase 1 (MVP) - Current
- Individual trade tracking with timestamps
- Auto-calculated daily summaries
- Market session analysis
- Profit/loss tracking in USD

### 13.2 Phase 2 (Future)
- Add `trade_attachments` table for screenshots
- Add `notifications` table for alerts
- Add `audit_logs` table for admin actions
- Add `reports` table for saved custom reports
- Add `trade_tags` for custom categorization

### 13.3 Phase 3 (Advanced)
- Add `teams` table for team management
- Add `trading_strategies` table with strategy performance
- Add `market_conditions` tracking (volatility, news events)
- Add `broker_accounts` for multi-account tracking

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

---

## Acceptance Criteria

- ✅ All tables defined with proper relationships
- ✅ Foreign key constraints in place
- ✅ Data validation rules specified
- ✅ Indexes for query optimization
- ✅ Single Source of Truth (Prisma schema)
- ✅ Migration strategy defined
- ✅ Individual trade tracking enabled
- ✅ Dual-entry system (real-time + bulk)
- ✅ Market session auto-detection
- ✅ Daily summary auto-calculation

---

**Status**: UPDATED - Individual Trade Tracking Model
**Version**: 2.0
**Next Document**: API Specification (needs update)

