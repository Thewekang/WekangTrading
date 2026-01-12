# Admin Features Documentation

**Document Version**: 1.0  
**Last Updated**: January 12, 2026  
**Status**: ✅ Production (v0.4.0)

---

## Table of Contents

1. [Overview](#overview)
2. [Admin Dashboard](#admin-dashboard)
3. [User Management](#user-management)
4. [Performance Monitoring](#performance-monitoring)
5. [Coaching Tools](#coaching-tools)
6. [Security & Authorization](#security--authorization)
7. [API Endpoints](#api-endpoints)
8. [Visual Reference](#visual-reference)

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

**Last Updated**: January 12, 2026  
**Version**: 1.0  
**Status**: ✅ Production
