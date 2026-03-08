# Admin Features Documentation

**Document Version**: 3.0  
**Last Updated**: March 9, 2026  
**Status**: ✅ Production (v1.10.0)

---

## Table of Contents

1. [Overview](#overview)
2. [Admin Dashboard](#admin-dashboard)
3. [User Management](#user-management)
4. [Performance Monitoring](#performance-monitoring)
5. [Discipline Tracker Monitoring](#discipline-tracker-monitoring)
6. [Coaching Tools](#coaching-tools)
7. [Economic Calendar Management](#economic-calendar-management)
8. [Cron Job Monitoring](#cron-job-monitoring)
9. [Settings Dropdown Navigation](#settings-dropdown-navigation)
10. [Admin Profile Editing](#admin-profile-editing)
11. [Security & Authorization](#security--authorization)
12. [API Endpoints](#api-endpoints)
13. [Visual Reference](#visual-reference)

---

## Overview

WekangTradingJournal includes a comprehensive admin panel for monitoring team performance, managing users, and providing coaching insights. The admin role is completely separated from regular user features—admins focus exclusively on oversight and analysis.

### Key Features

- **System-Wide Statistics**: Total users, trades, average performance
- **User Rankings**: Leaderboard based on win rate and SOP compliance
- **Performance Comparison**: Visual charts comparing top performers
- **User Management**: Search, sort, and analyze individual users
- **Coaching Dashboard**: SOP analysis and best practices identification
- **Calendar View**: User activity heatmap with performance indicators
- **Economic Calendar Management**: Import and sync economic events
- **Cron Job Monitoring**: Track scheduled task execution
- **Settings Navigation**: Dropdown menu for admin settings
- **Profile Management**: Edit admin name, email, and password
- **Role Separation**: Admins cannot trade, users cannot access admin panel

---

## Admin Dashboard

**Route**: `/admin/overview`  
**Access**: ADMIN role only

### Dashboard Statistics (7 Cards)

1. **Total Users**
   - Count of all regular users (excludes admins)
   - Shows total registered traders

2. **Active This Month**
   - Users who placed at least one trade this month
   - Engagement indicator

3. **Total Trades**
   - All-time trade count across all users
   - System usage metric

4. **Trades This Month**
   - Current month trade volume
   - Activity trend indicator

5. **Average Win Rate**
   - Mean win rate across all users
   - Team performance benchmark

6. **Average SOP Rate**
   - Mean SOP compliance across all users
   - Discipline indicator

7. **Total P&L (USD)**
   - Combined profit/loss of all users
   - Overall profitability metric

### Top 5 Performers Table

**Ranking Logic**:
- Primary: Win Rate (descending)
- Secondary: SOP Rate (descending)

**Display Columns**:
- Rank (🥇🥈🥉 for top 3)
- Name
- Email
- Total Trades
- Win Rate (color-coded badge)
- SOP Rate (color-coded badge)
- Total P&L
- Best Session

**Badge Colors**:
- 🟢 Green: Win Rate ≥60%, SOP Rate ≥80%
- 🟡 Yellow: Win Rate ≥50%, SOP Rate ≥60%
- 🔴 Red: Below thresholds

### Recent Activity (Last 30 Days)

**Purpose**: Identify usage patterns and engagement trends

**Columns**:
- Date
- Total Trades
- Active Users

**Shows**: Last 10 days of system activity

### User Comparison Charts

**1. Win Rate Comparison**
- Bar chart comparing top 10 users by win rate
- Blue bars, percentage labels
- Helps identify consistently profitable traders

**2. SOP Rate Comparison**
- Bar chart comparing top 10 users by SOP compliance
- Green bars, percentage labels
- Identifies disciplined traders

**3. Profit/Loss Comparison**
- Bar chart comparing top 10 users by total P&L
- Green (profit) / Red (loss) bars
- Shows actual dollar performance

---

## User Management

**Route**: `/admin/users`  
**Access**: ADMIN role only

### Features

**Search & Filter**:
- Real-time search by name or email
- Shows filtered count (e.g., "Showing 3 of 10 users")
- Instant results as you type

**Sortable Table**:
- Click column headers to sort ascending/descending
- Sort indicators: ▲ (ascending) ▼ (descending)
- Persists during search

**Table Columns**:
1. Rank (with medals for top 3)
2. User (name + email)
3. Trades (W/L breakdown, e.g., "45 (30/15)")
4. Win Rate (color-coded badge)
5. SOP Rate (color-coded badge)
6. P&L (total $ / average $/trade)
7. Best Session (ASIA/EUROPE/US)
8. Last Trade (relative time, e.g., "2 days ago")

**Visual Features**:
- Medal icons: 🥇🥈🥉 for top 3
- Color-coded performance badges
- Hover effects on rows
- Mobile-responsive with horizontal scroll

### User Deletion & Reset

**User Deletion**:
- Admins can delete users from `/admin/users`
- Cascades to all related data (trades, summaries, targets)
- Confirmation required
- Tracked in admin logs

**Reset Count Tracking** (v0.4.0):
- Tracks how many times each user has reset their data
- Displayed in user list (`resetCount` column)
- Helps identify users who frequently restart
- Cannot be manipulated by users

---

## Performance Monitoring

### User Performance Calendar

**Component**: `UserPerformanceCalendar.tsx`  
**Location**: `/admin/users` (per-user view)

**Features**:
- Heatmap visualization of daily activity
- Color intensity based on win rate:
  - 🟢 Dark Green: 80-100% win rate
  - 🟢 Medium Green: 60-79% win rate
  - 🟡 Yellow: 50-59% win rate
  - 🟠 Orange: 40-49% win rate
  - 🔴 Red: 0-39% win rate
  - ⚪ Gray: No trades that day

**Hover Details**:
- Date
- Total trades
- Win rate
- SOP rate
- Net P&L

**Purpose**: Identify trading patterns, consistency, and performance trends over time

### Daily Loss Alert Feature

**Purpose**: Monitor users approaching daily loss limits (especially for prop firm accounts)

**Features**:
- Real-time alerts when user approaches daily loss threshold
- Configurable threshold per user (default: -$100)
- Visual indicator on admin dashboard
- Prevents catastrophic losses
- Email notifications (future enhancement)

**Alert Levels**:
- 🟡 Warning: 70-90% of daily loss limit
- 🔴 Critical: 90-100% of daily loss limit
- 🚫 Limit Reached: Trading should stop

---

## Discipline Tracker Monitoring

**Routes**:  
- `/admin/discipline-tracker` - Team overview dashboard  
- `/admin/users/[id]/discipline-tracker` - Individual trader monitoring  
**Access**: ADMIN role only  
**Version**: v1.10.0

### Purpose

Monitor team discipline trading performance across all users, tracking adherence to trading plans, rule violations, and individual trader progress over extended periods. The admin discipline tracker provides oversight without infringing on user privacy by showing summary metrics rather than replicating the user's personal tracker interface.

---

### Team Overview Dashboard

**Route**: `/admin/discipline-tracker`

#### Summary Statistics (4 Cards)

1. **Active Traders**
   - Count of users with discipline tracker data in selected period
   - Excludes admins
   - Shows engagement with discipline tracking

2. **Win Days**
   - Percentage of trading days that ended profitable
   - Color-coded: Green (≥60%), Yellow (≥50%), Red (<50%)
   - Team discipline effectiveness indicator

3. **Total P&L**
   - Combined profit/loss across all traders in selected period
   - Shows team profitability from disciplined trading

4. **Total Violations**
   - Sum of all rule violations across team
   - Indicates unauthorized trading (exceeding max trades, wrong session, etc.)
   - Lower is better

#### Timeline Grid View

**Desktop Layout**: Timeline table (traders × days)

**Columns**:
- Trader name (clickable to view individual performance)
- Daily columns showing last N days (configurable: 7/14/30)

**Cell Display**:
- Color-coded by daily outcome:
  - 🟢 **Green**: Winning day
  - 🔴 **Red**: Losing day
  - 🟡 **Yellow**: Break-even day
  - ⚪ **Gray**: No data (no trades)
- Hover tooltip shows:
  - Date
  - Day P&L
  - Win/Loss/BE counts
  - Violations (if any)

**Mobile Layout**: Card-based view
- One card per trader
- Timeline shown vertically within each card
- Expandable for additional stats

#### Expandable Trader Details

Click arrow icon to expand inline statistics:
- **Total P&L**: Net profit/loss for period
- **Win Rate**: Percentage of winning trades
- **Violations**: Count of rule violations
- **Best Day**: Highest single-day P&L
- **Worst Day**: Lowest single-day P&L

#### Features

- **Period Selection**: 7 days, 14 days (default), 30 days
- **Timezone-Aware**: Dates displayed in admin's preferred timezone
- **Real-Time**: Refreshes on data changes
- **Privacy**: Admin users excluded from team view
- **Navigation**: Click trader name to view individual performance

---

### Individual Trader Monitoring

**Route**: `/admin/users/[id]/discipline-tracker`

**Purpose**: Monitor specific trader's discipline performance over extended periods (up to all-time history)

#### Summary Statistics (4 Cards)

1. **Total P&L**
   - Net profit/loss for selected period
   - Color-coded: Green (profit), Red (loss)
   - Shows total trading days below

2. **Win Rate**
   - Percentage of winning trades
   - W/L/BE breakdown displayed
   - Target: ≥60% for good performance

3. **Total Trades**
   - Count of all trades in period
   - Average trades per day shown below
   - Indicates activity level

4. **Rule Violations**
   - Count of unauthorized trades
   - Color-coded: Green (0), Red (>0)
   - Shows discipline adherence

#### Time Range Selector

Extended period options (beyond team view's 30-day limit):
- Last 7 Days
- Last Month
- Last 3 Months
- **Last 6 Months** ✨
- **Last Year** ✨
- **All Time** ✨

**Use Case**: Long-term coaching and progress tracking

#### Plan Configuration Display

Shows trader's discipline plan settings:
- Max Trades/Day
- SL Value (stop loss)
- TP1 Value (take profit 1)
- TP2 Value (take profit 2)
- TP3 Mode (fixed/dynamic)
- TP3 Fixed Value (if applicable)
- Win Rate Formula (exclude BE / include BE)

**Purpose**: Understand trader's plan before analyzing results

#### Daily Performance Summary Table

**Simplified Admin View** (privacy-conscious design)

**Columns**:
1. **Date**: Clean format (e.g., "Mar 7, 2026")
2. **Day P&L**: Daily profit/loss (color-coded)
3. **Trades**: Total trade count for the day
4. **W/L/BE**: Win/Loss/Breakeven breakdown
5. **A+ Day**: Badge indicator (Yes if qualified)
6. **Range Exp**: Range expansion day badge
7. **Session**: Prime / Non-Prime badge
8. **Violations**: Red badge if rule broken, green checkmark if compliant
9. **Notes**: Truncated notes preview (max width)

**Features**:
- Sortable columns
- Pagination for large datasets
- No editing capabilities (read-only monitoring)
- No full tracker interface replication (respects privacy)

#### Privacy Design Principles

**What Admins CAN See**:
- Summary statistics (P&L, win rate, violations)
- Daily outcomes (win/loss/BE)
- Plan configuration
- Performance trends over time
- Notes (user-written)

**What Admins CANNOT See**:
- Full tracker editing interface
- Trade-by-trade entry fields
- Personal tracker workflow
- Trade 1/2/3 individual outcome selectors

**Rationale**: Admins need monitoring capability without accessing user's personal trading journal interface

---

### Navigation

**Admin Nav Tab**: "Discipline" with Target icon (🎯)

**Breadcrumb Flow**:
1. `/admin/discipline-tracker` - Team overview
2. Click trader name → `/admin/users/[id]/discipline-tracker` - Individual view
3. Back to Team Overview link at top

---

### API Endpoints

**Team Overview**:
- `GET /api/admin/discipline-tracker/team-overview?days=14`
- Returns: Array of users with timeline data
- Protected: requireAdmin middleware

**Individual User**:
- `GET /api/admin/users/[id]/discipline-tracker/settings`
- `GET /api/admin/users/[id]/discipline-tracker/rows`
- Returns: User's plan settings and all-time rows
- Protected: requireAdmin middleware

---

### Use Cases

1. **Daily Team Check-in**: Review team performance grid each morning
2. **Long-term Coaching**: Analyze individual trader over 6 months/1 year
3. **Rule Violation Investigation**: Identify traders with frequent violations
4. **Performance Trends**: Track improvement or regression over time
5. **Plan Effectiveness**: Compare traders with similar plans

---

## Coaching Tools

### Best SOP Coaching Dashboard

**Route**: `/admin/coaching` (future enhancement)  
**Current**: Available in `/admin/overview` charts

**Purpose**: Identify which SOP types lead to best performance

**Analysis**:
1. **Best SOP Type by Win Rate**
   - Shows which SOP types have highest success rate
   - Minimum 10 trades required for statistical significance
   - Helps recommend best practices to users

2. **SOP Type Performance Breakdown**
   - Table showing all SOP types with:
     - Total trades
     - Win rate
     - Average P&L
     - Users using this SOP

3. **User-Specific SOP Analysis**
   - Compare each user's SOP type performance
   - Identify which SOPs work best for each trader
   - Personalized coaching recommendations

**Example Insights**:
- "Breakout Strategy" has 75% win rate across all users
- "Scalping" works well for User A (80% WR) but poorly for User B (40% WR)
- "Swing Trading" has highest average profit per trade

### SOP Types Management

**Route**: `/admin/sop-types`  
**Access**: ADMIN role only

**Features**:
- Create custom SOP types (e.g., "Breakout", "Scalping", "Reversal")
- Edit SOP type descriptions
- Activate/deactivate SOP types
- Delete unused SOP types (with usage validation)
- Sort order management

**SOP Type Fields**:
- Name (required, max 50 chars)
- Description (optional, max 200 chars)
- Sort Order (for dropdown display order)
- Active (boolean, controls visibility to users)

**Usage**:
- Users select SOP type during trade entry
- Defaults to "Others" if no specific type selected
- Admin can analyze which SOP types perform best

---

## Economic Calendar Management

**Route**: `/admin/economic-calendar`  
**Access**: ADMIN role only

### Features

**Event Management**:
- View all upcoming economic events
- Filter by impact (HIGH/MEDIUM/LOW)
- Filter by country
- Search by event title
- Sort by date/time

**Data Sources**:
1. **RapidAPI Integration**: Automated daily sync
2. **CSV Import**: Bulk import from file
3. **Manual Sync**: On-demand API fetch

**Sync Operations**:
- **Daily Automatic Sync**: Runs at 00:00 UTC via cron job
- **Manual Sync Button**: Fetch latest data immediately
- **CSV Import**: Upload custom event list

### Sync Dashboard

**Statistics Cards**:
- Total Events (next 7 days)
- Last Sync Time
- High Impact Events
- Sync Status (success/error)

**Sync History Table**:
- Sync timestamp
- Source (API/CSV/Manual)
- Records synced
- Records updated
- Status
- Duration

**Manual Sync Button**:
- Triggers immediate API call to RapidAPI
- Shows loading state during sync
- Displays results (synced, updated, skipped)
- Error handling with retry option

### CSV Import

**Upload Interface**:
- Drag-and-drop file upload
- CSV format validation
- Preview imported data
- Duplicate detection

**CSV Format**:
```csv
title,country,date,time,impact,forecast,previous,currency
Non-Farm Payrolls,US,2026-01-17,13:30,HIGH,200K,195K,USD
```

**Validation Rules**:
- All required fields present
- Valid date format (YYYY-MM-DD)
- Valid time format (HH:MM)
- Impact must be HIGH/MEDIUM/LOW
- Country code exists
- No duplicate events

**Import Results**:
- Total rows processed
- Successfully imported
- Duplicates skipped
- Errors (with row numbers)

### API Endpoints

- `GET /api/admin/economic-calendar/events` - List all events
- `POST /api/admin/economic-calendar/sync` - Manual sync
- `POST /api/admin/economic-calendar/import` - CSV upload
- `DELETE /api/admin/economic-calendar/events/[id]` - Delete event
- `GET /api/admin/economic-calendar/cron-logs` - Sync history

---

## Cron Job Monitoring

**Route**: `/admin/settings/cron-monitoring`  
**Access**: ADMIN role only

### Purpose

Monitor automated scheduled tasks (cron jobs) to ensure they execute successfully and troubleshoot failures.

### Monitored Jobs

1. **sync-calendar**: Daily economic calendar sync (00:00 UTC)
2. **recalc-summaries**: Daily summary recalculation (future)
3. **cleanup-old-data**: Data retention cleanup (future)

### Dashboard Features

**Statistics Overview**:
- Total Executions (24 hours)
- Success Rate (%)
- Average Duration (ms)
- Last Run Timestamp
- Failed Jobs (24 hours)

**Execution Logs Table**:
- Job Name (with icon)
- Status (🟢 SUCCESS / 🔴 ERROR / 🟡 IN_PROGRESS)
- Started At
- Completed At
- Duration (ms)
- Records Processed
- Error Message (if failed)

**Filtering**:
- Filter by job name
- Filter by status
- Date range selector
- Search by error message

**Status Indicators**:
- 🟢 **SUCCESS**: Job completed without errors
- 🔴 **ERROR**: Job failed with error
- 🟡 **IN_PROGRESS**: Job currently running
- ⏸️ **TIMEOUT**: Job exceeded maximum duration

### Log Details

**Click on log row to expand**:
- Full error stack trace (if error)
- Detailed execution metrics
- Related records (e.g., events synced)
- Retry button (if failed)

### Alerts (Future Enhancement)

- Email notification on consecutive failures (3+)
- Slack/Discord webhook integration
- SMS alerts for critical jobs
- Custom alert thresholds per job

### API Endpoints

- `GET /api/admin/settings/cron-logs` - List logs (paginated)
- `GET /api/admin/settings/cron-logs/[id]` - Log details
- `GET /api/admin/settings/cron-stats` - Statistics
- `POST /api/admin/settings/cron-logs/[id]/retry` - Retry failed job

---

## Settings Dropdown Navigation

**Location**: Admin navigation bar (top-right corner)  
**Access**: ADMIN role only

### Features

Enhanced admin navigation with a settings dropdown menu next to the user profile icon.

**Dropdown Menu Items**:
1. **Profile Settings** → `/admin/settings/profile`
2. **Cron Job Monitoring** → `/admin/settings/cron-monitoring`
3. **System Settings** → `/admin/settings/system` (future)

**UI Components**:
- Settings gear icon (⚙️)
- Dropdown trigger on click
- Smooth animation
- Keyboard navigation support
- Mobile-responsive

**Implementation**:
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <Settings className="h-5 w-5" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem asChild>
      <Link href="/admin/settings/profile">
        <User className="mr-2 h-4 w-4" />
        Profile Settings
      </Link>
    </DropdownMenuItem>
    <DropdownMenuItem asChild>
      <Link href="/admin/settings/cron-monitoring">
        <Clock className="mr-2 h-4 w-4" />
        Cron Jobs
      </Link>
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## Admin Profile Editing

**Route**: `/admin/settings/profile`  
**Access**: ADMIN role only

### Features

**View Profile Information**:
- Name
- Email
- Role (ADMIN)
- Account created date
- Last login (future)

**Edit Profile**:
- Change Name
- Change Email (with validation)
- Upload Profile Picture (future)

**Change Password**:
- Current Password (required)
- New Password (min 8 chars)
- Confirm New Password (must match)
- Password strength indicator

**Form Validation**:
- Email format validation
- Password strength requirements
- Duplicate email check
- Current password verification

### UI Layout

**Profile Card**:
```
┌──────────────────────────────────────┐
│ Admin Profile                        │
├──────────────────────────────────────┤
│ Name:    [John Admin        ] [Edit] │
│ Email:   [admin@example.com ] [Edit] │
│ Role:    ADMIN                       │
│ Created: January 1, 2026             │
└──────────────────────────────────────┘
```

**Password Change Section**:
```
┌──────────────────────────────────────┐
│ Change Password                      │
├──────────────────────────────────────┤
│ Current Password: [*************]    │
│ New Password:     [*************]    │
│ Confirm Password: [*************]    │
│                                      │
│ [Cancel]  [Update Password]          │
└──────────────────────────────────────┘
```

### API Endpoints

- `GET /api/admin/settings/profile` - Get admin profile
- `PATCH /api/admin/settings/profile` - Update name/email
- `PATCH /api/admin/settings/password` - Change password

### Security Features

- Current password verification required
- Password hashing (bcrypt)
- Session refresh after password change
- Email change requires re-authentication (future)
- Audit log for profile changes (future)

---

## Security & Authorization

### Role Separation

**ADMIN Role**:
- Full access to `/admin/*` routes
- Cannot access user trading features (`/dashboard`, `/trades`, `/targets`)
- Redirected to `/admin/overview` after login
- No trade entry capabilities

**USER Role**:
- Full access to user features
- Cannot access `/admin/*` routes (403 Forbidden)
- Redirected to `/dashboard` after login

### Middleware Protection

**File**: `middleware.ts`

```typescript
// Protect admin routes
if (pathname.startsWith('/admin')) {
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (token.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  return NextResponse.next();
}

// Prevent admins from accessing user routes
if (pathname.startsWith('/dashboard') || 
    pathname.startsWith('/trades') || 
    pathname.startsWith('/targets') || 
    pathname.startsWith('/analytics')) {
  if (token.role === 'ADMIN') {
    return NextResponse.redirect(new URL('/admin/overview', request.url));
  }
}
```

### API Route Protection

**Helper Function**: `requireAdmin(session)`

```typescript
export function requireAdmin(session: Session | null) {
  if (!session) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    );
  }
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
      { status: 403 }
    );
  }
  return null;
}
```

**Usage in API Routes**:
```typescript
const session = await auth();
const adminError = requireAdmin(session);
if (adminError) return adminError;
```

### Layout Protection

**Server-Side Validation**: All admin pages validate session on server

```typescript
const session = await auth();
if (!session || session.user.role !== 'ADMIN') {
  redirect('/dashboard');
}
```

---

## API Endpoints

### GET `/api/admin/stats`

**Description**: Get admin dashboard statistics

**Access**: ADMIN only

**Query Parameters**:
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Response**:
```json
{
  "success": true,
  "data": {
    "totalUsers": 5,
    "activeThisMonth": 3,
    "totalTrades": 450,
    "tradesThisMonth": 120,
    "averageWinRate": 62.5,
    "averageSopRate": 75.0,
    "totalProfitLoss": 12500.50
  }
}
```

### GET `/api/admin/users`

**Description**: Get all users with statistics

**Access**: ADMIN only

**Query Parameters**:
- `startDate` (optional): Filter stats by date range
- `endDate` (optional): Filter stats by date range

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "usr_123",
      "name": "John Trader",
      "email": "john@example.com",
      "role": "USER",
      "resetCount": 0,
      "createdAt": "2026-01-01T00:00:00Z",
      "stats": {
        "totalTrades": 45,
        "totalWins": 30,
        "totalLosses": 15,
        "winRate": 66.67,
        "sopRate": 80.0,
        "totalProfitLoss": 2500.00,
        "avgProfitPerTrade": 55.56,
        "bestSession": "EUROPE",
        "lastTradeDate": "2026-01-11T14:30:00Z"
      }
    }
  ]
}
```

### GET `/api/admin/comparison`

**Description**: Get comparison data for charts

**Access**: ADMIN only

**Query Parameters**:
- `startDate` (optional): Filter by date range
- `endDate` (optional): Filter by date range

**Response**:
```json
{
  "success": true,
  "data": {
    "winRateComparison": [
      { "name": "John", "winRate": 75.0 },
      { "name": "Jane", "winRate": 70.5 }
    ],
    "sopRateComparison": [
      { "name": "John", "sopRate": 85.0 },
      { "name": "Jane", "sopRate": 82.3 }
    ],
    "profitLossComparison": [
      { "name": "John", "profitLoss": 5000 },
      { "name": "Jane", "profitLoss": 3500 }
    ]
  }
}
```

### GET `/api/admin/sop-types`

**Description**: Get all SOP types

**Access**: ADMIN only

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "sop_1",
      "name": "Breakout Strategy",
      "description": "Trading breakouts from consolidation",
      "sortOrder": 1,
      "active": true,
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

### POST `/api/admin/sop-types`

**Description**: Create a new SOP type

**Access**: ADMIN only

**Request Body**:
```json
{
  "name": "Breakout Strategy",
  "description": "Trading breakouts from consolidation",
  "sortOrder": 1,
  "active": true
}
```

### DELETE `/api/admin/users/[id]`

**Description**: Delete a user and all related data

**Access**: ADMIN only

**Response**:
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## Visual Reference

### Admin Dashboard Layout

```
┌─────────────────────────────────────────────────────────┐
│ Admin Panel           john@admin.com [Sign Out]         │
├─────────────────────────────────────────────────────────┤
│ [Overview] [Users] [SOP Types]                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │
│ │Total │ │Active│ │Total │ │Trades│ │Avg  │ │Avg  │ │
│ │Users │ │This │ │Trades│ │This │ │Win  │ │SOP  │ │
│ │  5   │ │Month│ │ 450  │ │Month│ │Rate │ │Rate │ │
│ │      │ │  3  │ │      │ │ 120 │ │62.5%│ │75.0%│ │
│ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ │
│                                                          │
│ Top 5 Performers                                        │
│ ┌──────────────────────────────────────────────────────┐│
│ │Rank│Name  │Email      │Trades│Win Rate│SOP │P&L    ││
│ │🥇 1│John  │john@...   │  45  │ 75.0%  │85% │$5,000 ││
│ │🥈 2│Jane  │jane@...   │  38  │ 70.5%  │82% │$3,500 ││
│ │🥉 3│Bob   │bob@...    │  52  │ 68.2%  │78% │$4,200 ││
│ └──────────────────────────────────────────────────────┘│
│                                                          │
│ Recent Activity (Last 30 Days)                         │
│ ┌──────────────────────────────────────────────────────┐│
│ │Date      │Total Trades│Active Users                 ││
│ │Jan 11    │     45     │     3                       ││
│ │Jan 10    │     38     │     2                       ││
│ └──────────────────────────────────────────────────────┘│
│                                                          │
│ [Win Rate Comparison Chart]                            │
│ [SOP Rate Comparison Chart]                            │
│ [Profit/Loss Comparison Chart]                         │
└─────────────────────────────────────────────────────────┘
```

### User Management Layout

```
┌─────────────────────────────────────────────────────────┐
│ User Management                                          │
├─────────────────────────────────────────────────────────┤
│ Search: [________________]    Showing 5 of 5 users      │
│                                                          │
│ ┌──────────────────────────────────────────────────────┐│
│ │Rank↕│User↕    │Trades↕│Win Rate↕│SOP↕│P&L↕ │Session↕││
│ │🥇 1 │John     │  45   │  75.0%  │85% │$5K  │EUROPE ││
│ │🥈 2 │Jane     │  38   │  70.5%  │82% │$3.5K│US     ││
│ │🥉 3 │Bob      │  52   │  68.2%  │78% │$4.2K│ASIA   ││
│ │ #4  │Alice    │  30   │  65.0%  │75% │$2K  │EUROPE ││
│ │ #5  │Charlie  │  25   │  60.0%  │70% │$1K  │US     ││
│ └──────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

---

## Best Practices

### For Admins

1. **Regular Monitoring**: Check dashboard daily for user activity
2. **Identify Struggling Users**: Look for low win rates or SOP compliance
3. **Recognize Top Performers**: Acknowledge and learn from top traders
4. **SOP Analysis**: Use SOP comparison to identify best strategies
5. **Calendar Review**: Check user activity patterns for consistency
6. **Loss Prevention**: Monitor daily loss alerts proactively

### For System Management

1. **User Cleanup**: Regularly review inactive users
2. **SOP Type Management**: Keep SOP list relevant and organized
3. **Performance Benchmarking**: Track average metrics over time
4. **Coaching Sessions**: Use data to guide trader improvement
5. **Reset Tracking**: Identify users who need additional support

---

## Future Enhancements

- [ ] Email notifications for daily loss alerts
- [ ] Exportable admin reports (PDF/CSV)
- [ ] User activity trends over time (graphs)
- [ ] Coaching notes per user
- [ ] Bulk user operations (invite, delete, reset)
- [ ] Advanced filtering (by date range, performance tiers)
- [ ] Real-time dashboard updates (WebSocket)
- [ ] User performance predictions (ML-based)

---

## Related Documentation

- [User Management](02-SYSTEM-ARCHITECTURE.md#user-management)
- [Database Schema](03-DATABASE-SCHEMA.md)
- [API Specification](04-API-SPECIFICATION.md#admin-endpoints)
- [Authentication & Authorization](../setup/LOCAL-DEV-GUIDE.md#authentication)

---

**Last Updated**: January 18, 2026  
**Version**: 2.0  
**Status**: ✅ Production (v1.2.0)
