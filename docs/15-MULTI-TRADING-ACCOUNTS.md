# Multi-Trading Accounts — v2.0.0

## Document Control
- **Version**: 1.0
- **Status**: 🔄 IN PROGRESS
- **Branch**: `feature/multi-trading-accounts`
- **Started**: April 19, 2026
- **Base Version**: v1.14.6

---

## Overview

v2.0.0 introduces multi-trading-account support as a first-class architectural concept. Every piece of
user data — trades, daily summaries, targets, badges, streaks, discipline tracker, rankings — becomes
scoped to a `tradingAccountId`. Users can manage multiple accounts (e.g., FTMO challenge, personal
futures, demo) independently under a single login.

This is a **major version bump** because it changes the fundamental data model: `userId` alone is no
longer sufficient to identify any user dataset.

---

## Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Data isolation | Full (per-account) | Prop firm + personal account P&L must never mix |
| Account type | Label only (not behavioral) | PROP_FIRM / FUTURES / CFD / FOREX / SHARE / DEMO |
| Active account | Cookie-based switcher in nav | Keeps all existing routes working without URL changes |
| Drawdown rules | `account_rules` table (1:1 per account) | Each account has independent DD limits |
| P&L tracking | Dual: `currentCyclePnl` + `cumulativePnl` | Prop firm cycle + all-time tracking |
| Withdrawal event | Inserts `withdrawal_events` row | Resets DD, currentCyclePnl, consistency; preserves cumulative |
| Consistency rule | `(bestDayCyclePnl / totalCyclePnl) × 100 ≤ target` | Standard prop firm definition |
| Cycle profit target | `cycleTargetProfitUsd` in account_rules | Per-cycle; distinct from time-period `user_targets` |
| Account health | SAFE / WARNING / BREACHED color codes | Based on DD used % and consistency pass/fail |
| Rankings | Per account; all accounts ranked together | Admin view shows "Username : Account Name" |
| /strategies & /calendar | Top-level (NOT account-scoped) | Shared resources — no account context needed |
| Migration | All existing data → "Main Account" per user | Zero data loss, seamless upgrade |

---

## New Database Tables

### `trading_accounts`
```sql
id              TEXT PRIMARY KEY
user_id         TEXT NOT NULL REFERENCES users(id)
name            TEXT NOT NULL
account_type    TEXT CHECK(IN 'PROP_FIRM','FUTURES','CFD','FOREX','SHARE','DEMO') DEFAULT 'FUTURES'
currency        TEXT NOT NULL DEFAULT 'USD'
starting_balance REAL NOT NULL DEFAULT 0
is_default      INTEGER NOT NULL DEFAULT 0  -- boolean
active          INTEGER NOT NULL DEFAULT 1  -- boolean
created_at      TEXT NOT NULL
updated_at      TEXT NOT NULL
```

### `account_rules` (1:1 with trading_accounts)
```sql
id                      TEXT PRIMARY KEY
trading_account_id      TEXT NOT NULL UNIQUE REFERENCES trading_accounts(id)
daily_drawdown_pct      REAL       -- % of starting balance; NULL = no limit
total_drawdown_pct      REAL       -- % of starting balance; NULL = no limit
consistency_target_pct  REAL       -- max % any single day can be of cycle profit; NULL = no limit
cycle_target_profit_usd REAL       -- profit goal for current cycle; NULL = no target
created_at              TEXT NOT NULL
updated_at              TEXT NOT NULL
```

### `withdrawal_events`
```sql
id                    TEXT PRIMARY KEY
trading_account_id    TEXT NOT NULL REFERENCES trading_accounts(id)
withdrawal_date       TEXT NOT NULL   -- ISO date string YYYY-MM-DD
withdrawal_amount     REAL NOT NULL
balance_at_withdrawal REAL NOT NULL
cycle_pnl_at_withdrawal REAL NOT NULL
notes                 TEXT
created_at            TEXT NOT NULL
```

### `admin_settings`
```sql
key           TEXT PRIMARY KEY  -- e.g. 'min_trades_for_ranking', 'ranking_cache_duration_ms'
value         TEXT NOT NULL
description   TEXT
updated_at    TEXT NOT NULL
updated_by    TEXT REFERENCES users(id)
```

### `drawdown_templates`
```sql
id                      TEXT PRIMARY KEY
name                    TEXT NOT NULL  -- e.g. 'FTMO Standard', 'My Futures Rules'
account_type            TEXT           -- optional filter by account type
daily_drawdown_pct      REAL
total_drawdown_pct      REAL
consistency_target_pct  REAL
target_gain_pct         REAL           -- % of starting balance as target profit
is_default              INTEGER NOT NULL DEFAULT 0
created_at              TEXT NOT NULL
```

### FK Column Additions (existing tables)

Column `trading_account_id TEXT REFERENCES trading_accounts(id)` added to:
- `individual_trades`
- `daily_summaries`
- `user_targets`
- `user_badges`
- `streaks`
- `user_stats`
- `discipline_tracker_settings`
- `discipline_tracker_rows`
- `user_rankings`

---

## Dual P&L Concept

```
cumulativePnl   = SUM(profit_loss_usd) of ALL trades on this account, ever
currentCyclePnl = SUM(profit_loss_usd) of trades AFTER last withdrawal_events.withdrawal_date
                  (or after account creation if no withdrawals yet)
```

### On Withdrawal Event
1. Insert `withdrawal_events` row (snapshot of balance, cycle P&L at time of withdrawal)
2. `currentCyclePnl` automatically resets — computed from trades after new cycle start date
3. `cumulativePnl` grows forever — never resets
4. Daily drawdown resets — computed from today's trades within current cycle
5. Consistency resets — `bestDayCyclePnl` restarts at 0

---

## Account Health Color Logic

`getDrawdownStatus(accountId)` computes and returns `healthStatus: 'SAFE' | 'WARNING' | 'BREACHED'`

| Condition | Status | UI Color |
|---|---|---|
| All DD limits < 80% used AND consistency PASS | SAFE | Green border |
| Any DD limit 80–100% used OR consistency FAIL | WARNING | Yellow border |
| Any DD limit > 100% used (actual breach) | BREACHED | Red border |

Applies to: account cards on `/accounts` overview, `DrawdownStatusCard` on dashboard.

---

## Consistency Rule

```
currentConsistencyPct = (bestDayCyclePnl / totalCyclePnl) × 100
```

- **PASS**: `currentConsistencyPct ≤ consistencyTargetPct`
- **FAIL**: `currentConsistencyPct > consistencyTargetPct`
- **Edge case**: If `totalCyclePnl ≤ 0` → treated as PASS (no profit to violate)
- Resets on each withdrawal event (new cycle)

User sets `consistencyTargetPct` in `/accounts/[id]/settings`.
Dashboard `DrawdownStatusCard` shows: `62.5% / 30% target — FAIL`

---

## Cycle Profit Target

`account_rules.cycleTargetProfitUsd` (nullable) — per-cycle profit goal.

**Distinct from** `user_targets.targetProfitUsd` (weekly/monthly/yearly time-period goals).

- `cycleProgressPct = (currentCyclePnl / cycleTargetProfitUsd) × 100`
- Shown as progress bar in `CycleProfitTargetCard`
- When `currentCyclePnl >= cycleTargetProfitUsd` → "Target Reached — Record Withdrawal?" prompt
- Settings UI helper: input % of starting balance → auto-fills USD amount
- Resets on withdrawal (new cycle starts at 0)

---

## Rankings (Per Account)

- `user_rankings` gets `trading_account_id` FK
- `calculateAllRankings()` ranks all accounts across all users (not grouped by user)
- `displayName` field: `"H4MIM : Main Account"` / `"H4MIM : FTMO Challenge"`
- Admin leaderboard and admin comparison page updated to show display name
- A user with 3 accounts can hold rank #1, #2, and #5 simultaneously (fully independent)

---

## Active Account Context

- Cookie name: `active_account_id`
- `contexts/ActiveAccountContext.tsx` reads cookie, exposes `activeAccountId` + `setActiveAccount()`
- `components/navigation/AccountSwitcher.tsx` — dropdown in nav header showing all user accounts
- On first login: middleware sets cookie to user's default account
- All existing API routes read `tradingAccountId` from cookie header (or explicit query param for admin)

---

## Implementation Phases & Progress

### Phase 1: DB Schema Foundation
- [x] 1. `lib/db/schema/tradingAccounts.ts` — 3 tables: trading_accounts, account_rules, withdrawal_events
- [x] 2. `lib/db/schema/adminSettings.ts` — admin_settings key-value table
- [x] 3. `lib/db/schema/drawdownTemplates.ts` — drawdown_templates table
- [x] 4. Add `tradingAccountId` FK to all 9 affected schema files
- [x] 5. Export new schemas from `lib/db/schema/index.ts`
- [x] 6. Write migration SQL (`drizzle/migrations/0012_multi_trading_accounts.sql`)
- [ ] 7. Data migration script: create "Main Account" per user + assign all existing rows

### Phase 2: Services Layer
- [ ] 8. `lib/services/tradingAccountService.ts`
- [ ] 9. `lib/services/accountRulesService.ts`
- [ ] 10. `lib/services/adminSettingsService.ts`
- [ ] 11. `lib/services/drawdownTemplateService.ts`
- [ ] 12. Update existing services to accept `tradingAccountId`

### Phase 3: Validation
- [ ] 13. Add Zod schemas to `lib/validations.ts`

### Phase 4: API Routes
- [ ] 14. `app/api/trading-accounts/` CRUD routes
- [ ] 15. `app/api/trading-accounts/[id]/rules`, `/overview`, `/withdrawal`
- [ ] 16. `app/api/admin/drawdown-templates/` routes
- [ ] 17. `app/api/admin/settings/` route
- [ ] 18. Update existing routes to read `tradingAccountId`

### Phase 5: Active Account Context
- [ ] 19. `contexts/ActiveAccountContext.tsx`
- [ ] 20. `components/navigation/AccountSwitcher.tsx`
- [ ] 21. Update `middleware.ts`

### Phase 6: Pages & Components
- [ ] 22. `app/(user)/accounts/page.tsx` — accounts grid
- [ ] 23. `app/(user)/accounts/new/page.tsx`
- [ ] 24. `app/(user)/accounts/[id]/settings/page.tsx`
- [ ] 25. `components/dashboard/DrawdownStatusCard.tsx`
- [ ] 26. `components/dashboard/CycleProfitTargetCard.tsx`
- [ ] 27. Update dashboard page

### Phase 7: Admin UI
- [ ] 28. `app/(admin)/settings/page.tsx`
- [ ] 29. `app/(admin)/drawdown-templates/page.tsx`
- [ ] 30. Update admin leaderboard display

---

## Verification Checklist

- [ ] First account created → `isDefault = true`; second account → `isDefault = false`
- [ ] Account switcher updates cookie → all page data reloads for new account
- [ ] Existing data (post-migration) → visible under "Main Account"
- [ ] Trade insert triggers `updateDailySummary` with correct `tradingAccountId`
- [ ] Withdrawal recorded → `currentCyclePnl` resets; `cumulativePnl` unaffected
- [ ] Consistency: trades +500, +200, +100 → bestDay=500, total=800 → 62.5% FAIL at 30% target
- [ ] Health: DD 80% used → WARNING; DD 101% → BREACHED
- [ ] Rankings: per-account; admin leaderboard shows "Username : Account Name"
- [ ] `/strategies` and `/calendar` load without account context
- [ ] Migration: zero data loss; all rows assigned to "Main Account"

---

**Last Updated**: April 19, 2026
