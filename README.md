# WekangTradingJournal

🏍️💰 Trading Performance Tracking System with Individual Trade Timing Analysis & Gamification

> **App Icon**: Fast motorcycle with money element

> **Status**: ✅ Production Deployed (v1.2.0)  
> **Current Version**: 1.2.0  
> **Live URL**: https://wekangtrading.vercel.app  
> **Scale**: 5 users, 30 trades/day, 1 year retention  
> **Stack**: Next.js 15 + TypeScript + Turso (LibSQL) + Drizzle ORM + NextAuth.js v5

---

## 🎯 Key Features

### Core Trading Features
- **Individual Trade Tracking** with timestamps for timing analysis
- **Dual Entry Workflows**: Real-time (mobile) + Bulk entry (desktop)
- **Market Session Analysis**: Auto-detect ASIA/EUROPE/US + Overlap sessions (Malaysia GMT+8)
- **Hourly Performance Analytics**: Identify most profitable trading hours with timezone support
- **Target Management**: Custom names, categories (Prop Firm/Personal), flexible timelines
- **Performance Trends**: MA7/MA30 analysis with trend indicators
- **Advanced Filtering**: Multi-select, P/L range, presets, URL sync
- **Data Export**: CSV + PDF reports with filter support
- **Profit/Loss Tracking**: USD per trade with aggregated insights
- **Fast Dashboard**: Pre-calculated daily summaries with interactive charts

### 🎮 Gamification & Achievements (v1.2.0)
- **34 Achievement Badges**: Bronze, Silver, Gold, Platinum tiers
- **9 Badge Categories**: Trades, Win Streak, Profit, Win Rate, SOP, Log Streak, Sessions, Targets, Max Trades/Day
- **Streak Tracking**: Win streaks, logging streaks, SOP compliance streaks
- **Real-time Progress**: Automatic badge awarding with celebration animations
- **Points System**: Earn points to track overall progress
- **Motivational Messages**: Contextual encouragement on achievements
- **Achievement Gallery**: Visual badge collection display

### User Experience
- **Toast Notifications**: Non-blocking, modern UX feedback
- **Mobile-Friendly**: Optimized for on-the-go trade entry
- **Achievement Celebrations**: Animated badge reveals with confetti
- **Smart Refresh**: Updates only when needed (no reload spam)

---

## 📁 Project Structure

```
WekangTradingJournal/
├── .github/
│   └── copilot-instructions.md    # AI coding context (prevents hallucination)
├── docs/
│   ├── 00-DESIGN-SUMMARY.md       # Executive summary
│   ├── 01-TECHNOLOGY-STACK.md     # Tech decisions
│   ├── 02-SYSTEM-ARCHITECTURE.md  # Architecture design
│   ├── 03-DATABASE-SCHEMA.md      # Database design
│   ├── 04-API-SPECIFICATION.md    # API documentation
│   ├── 05-MILESTONES-ROADMAP.md   # Implementation plan
│   ├── 06-PROGRESS-TRACKING.md    # Progress tracking
│   ├── 07-ENHANCED-FEATURES.md    # Enhanced features (v2.0)
│   ├── 08-ADMIN-FEATURES.md       # Admin panel guide
│   ├── 09-TARGET-MANAGEMENT.md    # Target system v0.4.0
│   ├── 10-TESTING-GUIDE.md        # Testing procedures
│   ├── 11-VERSION-1.1.0-ROADMAP.md # v1.1.0 planning
│   ├── 12-GAMIFICATION-SYSTEM.md  # Badge & achievement system 🆕
│   ├── setup/                     # Setup & configuration guides
│   ├── deployment/                # Deployment procedures
│   ├── reference/                 # Technical references
│   └── archive/                   # Historical records
└── README.md                       # This file
```

---

## 🚀 Implementation Roadmap

**Phase 0** (Week 1): ✅ Project Setup - COMPLETE  
**Phase 1** (Week 2): ✅ Authentication & Users - COMPLETE  
**Phase 2** (Week 3-5): ✅ Individual Trade Features - COMPLETE  
**Phase 3** (Week 6-7): ✅ Dashboard & Analytics - COMPLETE  
**Phase 4** (Week 8): ✅ Advanced Features - COMPLETE  
**Phase 5** (Week 9-10): ✅ Enhanced Features & Security - COMPLETE  
**Phase 6** (Documentation): ✅ Documentation Consolidation - COMPLETE  
**Phase 7** (Gamification): ✅ Badge & Achievement System - COMPLETE

### Phase 7 Completed Features ✅ (v1.2.0)
- **Badge System**: 34 unique badges across 9 categories with 4 tiers
- **Streak Tracking**: Win, log, and SOP compliance streaks
- **Achievement Gallery**: Visual badge collection with progress tracking
- **Real-time Awarding**: Automatic badge detection on trade submission
- **Celebration Animations**: Multi-badge modals with confetti effects
- **Points System**: Accumulate points from earned badges
- **Progress Indicators**: Real-time progress bars for unearned badges
- **Motivational System**: Context-aware achievement notifications
- **Stats Synchronization**: Automatic recalculation on all trade operations
- **Enhanced Account Reset**: Includes all gamification data

### Phase 5 Completed Features ✅ (v1.0.0)
- **Invite-Only Registration**: Security with admin-generated invite codes
- **Admin User Management**: Full CRUD operations for user accounts
- **Admin Trade Viewer**: View and delete trades across all users
- **SOP Types System**: Categorize trades by strategy (6 default types)
- **Daily Loss Limit Alert**: Soft reminder after 2 losses per day
- **User Password Change**: Secure password update with validation
- **Account Reset**: User can reset all trading data (fresh start)
- **Reset Count Tracking**: Admin monitoring of account resets
- **24-Hour Trade Deletion**: Window to prevent data tampering
- **User Performance Calendar**: Admin heatmap of user activity
- **Best SOP Analysis**: Dashboard card showing best performing strategy

### Phase 4 Completed Features ✅
- **Target Management v0.4.0**: Custom names, categories (Prop Firm/Personal), multiple active targets
- **Session Split**: OVERLAP → ASIA_EUROPE_OVERLAP + EUROPE_US_OVERLAP (Malaysia GMT+8)
- **Performance Trends**: MA7/MA30 moving averages with trend indicators
- **Advanced Filtering**: Multi-select sessions, P/L range, filter presets
- **Data Export**: CSV + PDF reports with comprehensive filter support
- **Toast Notifications**: Modern, non-blocking user feedback (Sonner)
- **Drizzle ORM Migration**: Complete migration from Prisma (51 functions, 12 services)

### Phase 3 Completed Features ✅
- Dashboard statistics with personal performance metrics
- Session performance comparison charts (Recharts)
- Hourly performance heatmap with timezone support
- Session insights with win/loss breakdown
- Color-coded performance indicators

### Phase 2 Completed Features ✅
- Real-time trade entry form (mobile-optimized)
- Bulk trade entry (up to 100 trades)
- Trade list with filters (date, result, session, SOP)
- Pagination with customizable page size (10/25/50/100)
- localStorage persistence for user preferences
- Auto-calculated market sessions
- Daily summary auto-updates  

---

## 📊 Confirmed Requirements

- **Users**: 5 active users
- **Trade Volume**: 30 trades/day/user = 4,500 trades/month
- **Data Retention**: 1 year (auto-cleanup older data)
- **Annual Data**: ~54,000 trades/year (~50-100MB)
- **Mobile Support**: Real-time entry optimized for mobile devices
- **Database**: Turso (SQLite for serverless) - Free tier sufficient

---

## 🔐 Design Principles

✅ **Single Source of Truth (SSOT)**: No duplication across codebase  
✅ **Type Safety**: 100% TypeScript coverage  
✅ **Mobile-First**: Real-time entry workflow optimized for mobile  
✅ **Performance**: Dashboard queries <200ms using daily summaries  
✅ **Security**: Role-based access, bcrypt passwords, session-based auth  
✅ **Scalability**: Designed for confirmed load, easy to scale up  

---

## 📖 Documentation

### Core Documentation (Numbered 00-10)

1. **[Design Summary](docs/00-DESIGN-SUMMARY.md)** - Start here for overview
2. **[Technology Stack](docs/01-TECHNOLOGY-STACK.md)** - Tech decisions and rationale
3. **[System Architecture](docs/02-SYSTEM-ARCHITECTURE.md)** - Architecture design
4. **[Database Schema](docs/03-DATABASE-SCHEMA.md)** - Complete database design
5. **[API Specification](docs/04-API-SPECIFICATION.md)** - API endpoints documentation
6. **[Implementation Roadmap](docs/05-MILESTONES-ROADMAP.md)** - Development plan
7. **[Progress Tracking](docs/06-PROGRESS-TRACKING.md)** - Progress monitoring
8. **[Enhanced Features](docs/07-ENHANCED-FEATURES.md)** - 11 enhanced features (v2.0)
9. **[Admin Features](docs/08-ADMIN-FEATURES.md)** - Complete admin panel guide
10. **[Target Management](docs/09-TARGET-MANAGEMENT.md)** - Target system v0.4.0
11. **[Testing Guide](docs/10-TESTING-GUIDE.md)** - Testing procedures & checklists

### Additional Documentation

- **[Setup Guides](docs/setup/)** - Local development & Turso setup
- **[Deployment](docs/deployment/)** - Production deployment guides
- **[Reference](docs/reference/)** - Technical references & quick guides
- **[Archive](docs/archive/)** - Historical records & session summaries

**AI Context**: `.github/copilot-instructions.md` - Critical for AI-assisted coding

---

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm
- Turso account (for database)

### Installation

```bash
# Clone the repository
git clone https://github.com/Thewekang/WekangTrading.git
cd WekangTrading

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Turso credentials

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

### Available Commands

```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run start       # Start production server
npm run db:push     # Push Drizzle schema changes
npm run db:studio   # Open Drizzle Studio
npm run db:seed     # Seed database with test data
```

---

## 📝 Recent Updates

### January 12, 2026 - Documentation Consolidation Complete
- ✅ Created comprehensive feature documentation (4 new docs)
- ✅ Organized documentation into categorized folders
- ✅ Consolidated 15+ fragmented files into single sources of truth
- ✅ Phase 6 complete - Clean, maintainable documentation structure

### January 11, 2026 - Phase 5 Complete
- ✅ Invite-only registration system with admin codes
- ✅ SOP types for strategy categorization
- ✅ Daily loss limit alerts (2 losses max)
- ✅ Complete admin user management
- ✅ User self-service features (password, reset)
- ✅ Security enhancements (24-hour deletion window)

### January 9, 2026 - Phase 4 Complete
- ✅ Target Management v0.4.0 with categories
- ✅ Advanced filtering and data export (CSV/PDF)
- ✅ Performance trends with MA7/MA30
- ✅ Complete Drizzle ORM migration

### January 9, 2026 - Phase 3 Complete
- ✅ Dashboard with interactive charts
- ✅ Session and hourly performance analytics
- ✅ Timezone support (Malaysia GMT+8)

### January 9, 2026 - Phase 2 Complete
- ✅ Individual trade tracking system
- ✅ Real-time and bulk entry workflows
- ✅ Trade list with comprehensive filters

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

---

## 🛠️ Tech Stack

### Core Dependencies
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Turso (libSQL)**: Serverless SQLite database
- **Drizzle ORM**: Type-safe database client (migrated from Prisma)
- **NextAuth.js v5**: Authentication with sessions
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Beautiful UI components
- **Recharts**: React charting library
- **Sonner**: Modern toast notifications
- **date-fns**: Date manipulation utilities
- **Zod**: Schema validation

### Development Tools
- **TypeScript Compiler**: Strict mode enabled
- **ESLint**: Code linting
- **Turbo**: Fast build system

---

## 🔐 Security Features

- Invite-only registration with admin codes
- Type-safe codebase (TypeScript)
- Input validation (client + server with Zod)
- Session-based authentication (NextAuth v5)
- Role-based access control (USER/ADMIN)
- Password hashing (bcrypt)
- SQL injection prevention (Drizzle ORM)
- 24-hour trade deletion window
- Secure password change workflow

---

## ⚡ Single Source of Truth

This project follows strict SSOT principles:
- No duplication of types, constants, or validation
- All database models defined in Drizzle schema
- All types derived from Drizzle (`$inferSelect`, `$inferInsert`)
- All validation rules in centralized Zod schemas
- All constants in `lib/constants.ts`
- All services in `lib/services/`

---

## 📄 License

This project is private and proprietary.

---

**Current Version**: 0.4.0+  
**Last Updated**: January 12, 2026  
**Status**: Production Ready ✅ - All Phases Complete 🎉