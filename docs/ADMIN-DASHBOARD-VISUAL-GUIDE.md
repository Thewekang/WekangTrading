# Admin Dashboard - Visual Layout Guide

## Desktop Layout (1920x1080)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  COACHING DASHBOARD                                                          │
│  Performance monitoring, benchmarking, and trader development insights      │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┬──────────────┐
│  👥 Total    │  🏆 Top      │  ⚠️ Needs    │  ⚡ High     │
│  Traders     │  Performer   │  Attention   │  Potential   │
│              │              │              │              │
│     5        │   68.0%      │     2        │     1        │
│ 5 active     │ Sarah        │ 40% of       │ Great        │
│ this month   │ Johnson      │ traders      │ discipline   │
└──────────────┴──────────────┴──────────────┴──────────────┘

┌──────────────┬──────────────┬──────────────┬──────────────┐
│  🎯 Team Avg │  ✓ Team Avg  │  📊 Total    │  💵 Team    │
│  Win Rate    │  SOP Rate    │  Trades      │  P&L         │
│              │              │              │              │
│   56.8%      │   68.0%      │    816       │  +$3,450     │
│ Benchmark:   │ Benchmark:   │ This month   │ All time     │
│ 55%          │ 75%          │              │              │
└──────────────┴──────────────┴──────────────┴──────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│  ⚠️ PRIORITY: TRADERS NEEDING IMMEDIATE ATTENTION                        │
│  These traders have win rates below 50% or SOP compliance below 65%      │
│  - schedule coaching sessions                                             │
├───────────────────────────────────────────────────────────────────────────┤
│  Name             Win Rate    SOP Rate     P&L        Action              │
│  David Rodriguez  45.0% ↓    60.0% ↓     -$1,230    Urgent: Risk Mgmt   │
│  Lisa Thompson    58.0% →    68.0% →     +$820      Focus: Discipline    │
└───────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│  PERFORMANCE LEADERBOARD                                                  │
│  Ranked by win rate (primary) and SOP compliance (secondary)             │
├───────────────────────────────────────────────────────────────────────────┤
│  Rank  Trader          Trades   Win Rate  SOP Rate  P&L      Avg    Status│
│  🥇    Sarah Johnson    198     68.0% ↑   87.0% ✓   +$3,420  $17.27  ⭐ Role Model    │
│                         (135W/63L)  ASIA                                   │
│  🥈    Michael Chen      138     62.0% ↑   75.0% ✓   +$1,890  $13.70  ⭐ Role Model    │
│                         (86W/52L)   EUROPE                                 │
│  🥉    Emma Davis        198     55.0% →   72.0% ✓   +$890    $4.49   💎 High Potential│
│                         (109W/89L)  US                                     │
│  #4    Lisa Thompson    162     58.0% →   68.0% ⚠️   +$820    $5.06   📊 Inconsistent │
│                         (94W/68L)   ASIA                                   │
│  #5    David Rodriguez  120     45.0% ↓   60.0% ⚠️   -$1,230  -$10.25 ⚠️ Needs Help   │
│                         (54W/66L)   EUROPE                                 │
└───────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────┬────────────────────────────────┐
│  WIN RATE COMPARISON           │  DISCIPLINE COMPARISON         │
│  Who's winning more trades?    │  Who's following the plan?     │
│  Team Average: 56.8%           │  Team Average: 68.0%           │
│                                │                                │
│  ████████████████ Sarah 68%    │  ████████████████ Sarah 87%    │
│  █████████████ Michael 62%     │  ███████████ Michael 75%       │
│  ███████████ Emma 55%          │  ████████████ Emma 72%         │
│  ███████████ Lisa 58%          │  ███████████ Lisa 68%          │
│  █████████ David 45%           │  ██████████ David 60%          │
│                                │                                │
└────────────────────────────────┴────────────────────────────────┘
```

## Color Coding

### Stat Cards
- 🟢 **Green**: Good performance (above benchmarks)
  - Top Performer: Green background
  - Team Avg Win Rate ≥55%: Green
  - Team Avg SOP ≥75%: Green
  - Team P&L positive: Green

- 🟡 **Orange/Yellow**: Warning zone (near benchmarks)
  - Team Avg Win Rate 50-54%: Orange
  - Team Avg SOP 65-74%: Orange

- 🔴 **Red**: Needs attention
  - Needs Attention count: Red badge
  - Team P&L negative: Red

- 🟣 **Purple**: Potential/Special
  - High Potential: Purple background
  - Total Trades: Purple (neutral metric)

- 🔵 **Blue**: Neutral/Info
  - Total Traders: Blue background

### Priority Alert Box
- 🔴 **Red Background**: Urgent attention required
- 🔴 **Red Badges**: Win Rate/SOP below thresholds
- 🔴 **Red Text**: "Urgent: Risk Management"
- 🟠 **Orange Text**: "Focus: Discipline"

### Performance Leaderboard

#### Row Backgrounds:
- 🟢 **Light Green**: Top 2 performers (#1, #2)
- 🔴 **Light Red**: Needs Attention (WR <50% or SOP <65%)
- ⚪ **White**: Normal performers

#### Win Rate Badges:
- 🟢 **Green**: ≥65% (excellent)
- 🔵 **Blue**: 55-64% (good)
- 🟡 **Yellow**: 50-54% (marginal)
- 🔴 **Red**: <50% (poor)

#### SOP Rate Badges:
- 🟢 **Green**: ≥85% (excellent)
- 🔵 **Blue**: 75-84% (good)
- 🟡 **Yellow**: 65-74% (marginal)
- 🔴 **Red**: <65% (poor)

#### Status Badges:
- ⭐ **Role Model**: Green badge
- 💎 **High Potential**: Purple badge
- ⚠️ **Needs Help**: Red badge
- 📊 **Inconsistent**: Orange badge

#### Trend Indicators:
- ↑ **TrendingUp** (green): Above team average
- ↓ **TrendingDown** (red): Below team average
- ✓ **CheckCircle** (green): Good SOP compliance
- ⚠️ **AlertTriangle** (orange): Poor SOP compliance

### Comparison Charts
- 🟢 **Green Bars**: Above team average
- 🔵 **Blue Bars**: At team average (±5%)
- 🟠 **Orange Bars**: Below team average

---

## Mobile Layout (375px width)

```
┌─────────────────────────┐
│  COACHING DASHBOARD     │
│  Performance monitoring │
└─────────────────────────┘

┌─────────────────────────┐
│  👥 Total Traders       │
│                         │
│     5                   │
│ 5 active this month     │
└─────────────────────────┘

┌─────────────────────────┐
│  🏆 Top Performer       │
│                         │
│   68.0%                 │
│ Sarah Johnson           │
└─────────────────────────┘

┌─────────────────────────┐
│  ⚠️ Needs Attention     │
│                         │
│     2                   │
│ 40% of traders          │
└─────────────────────────┘

... (all 8 cards stacked)

┌─────────────────────────┐
│  ⚠️ PRIORITY: TRADERS   │
│  NEEDING IMMEDIATE      │
│  ATTENTION              │
│                         │
│  [Horizontal scroll →]  │
│                         │
│  David Rodriguez        │
│  45.0% WR ↓            │
│  60.0% SOP ↓           │
│  -$1,230                │
│  Urgent: Risk Mgmt      │
└─────────────────────────┘

┌─────────────────────────┐
│  PERFORMANCE            │
│  LEADERBOARD            │
│                         │
│  [Horizontal scroll →]  │
│                         │
│  🥇 Sarah Johnson       │
│  198 trades             │
│  68.0% WR ↑            │
│  87.0% SOP ✓           │
│  +$3,420                │
│  ⭐ Role Model          │
│                         │
│  🥈 Michael Chen        │
│  138 trades             │
│  ... (tap to expand)    │
└─────────────────────────┘

┌─────────────────────────┐
│  WIN RATE COMPARISON    │
│  Team Avg: 56.8%        │
│                         │
│  [Responsive chart]     │
│                         │
└─────────────────────────┘

┌─────────────────────────┐
│  DISCIPLINE COMPARISON  │
│  Team Avg: 68.0%        │
│                         │
│  [Responsive chart]     │
│                         │
└─────────────────────────┘
```

---

## Interaction Patterns

### Hover States
- **Stat Cards**: Subtle shadow on hover
- **Table Rows**: Light gray background on hover
- **Chart Bars**: Tooltip shows exact values
- **Buttons**: Darken slightly on hover

### Click Actions
- **Stat Cards**: No action (display only)
- **Priority Alert Rows**: Could link to trader detail (future)
- **Leaderboard Rows**: Could link to trader detail (future)
- **Chart Bars**: No action (display only)

### Loading States
- **Initial Load**: Skeleton loaders for all sections
- **Chart Load**: Spinner in chart area
- **Empty State**: "No data available yet" message

---

## Responsive Breakpoints

```
Mobile:   < 640px   (1 column, horizontal scroll tables)
Tablet:   640-1024px (2 columns for stats grid)
Desktop:  1024-1280px (4 columns for stats grid)
Large:    > 1280px  (4 columns, wider charts)
```

---

## Accessibility Features

- **ARIA Labels**: All icons have descriptive labels
- **Color + Text**: Not relying on color alone (badges have text)
- **Keyboard Navigation**: Tab through all interactive elements
- **Screen Readers**: Semantic HTML (table, headings, etc.)
- **Contrast Ratios**: WCAG AA compliant (4.5:1 minimum)

---

## Print Layout (Optional Future)

```
┌─────────────────────────────────────────────┐
│  Coaching Report                             │
│  Date: January 9, 2026                       │
│  Generated by: Admin                         │
└─────────────────────────────────────────────┘

Team Performance Summary
  Total Traders: 5
  Team Avg Win Rate: 56.8%
  Team Avg SOP: 68.0%
  Team P&L: +$3,450

Priority Traders (Needs Attention)
  1. David Rodriguez - 45% WR, 60% SOP
     Action: Urgent Risk Management
  2. Lisa Thompson - 58% WR, 68% SOP
     Action: Focus on Discipline

Performance Leaderboard
  [Table printed in black & white]
  Status indicators as text only

[Charts printed as bar graphs]
```

---

## Animation Effects (Subtle)

- **Page Load**: Cards fade in sequentially (0.1s delay each)
- **Alert Box**: Pulse animation on red border (1s interval)
- **Badge Updates**: Number changes with count-up animation
- **Chart Bars**: Grow from bottom on load (0.5s duration)
- **Hover**: Smooth transition on background colors (0.2s)

---

## Dark Mode (Future Consideration)

Currently using light mode only. If dark mode added:

- Background: Gray-900
- Text: Gray-100
- Cards: Gray-800
- Borders: Gray-700
- Green badges: Darker green (readable on dark bg)
- Red alerts: Slightly lighter red
- Charts: Inverted colors for dark background

---

**Last Updated**: January 9, 2026
**Version**: 1.0 - Coaching Dashboard Visual Guide
