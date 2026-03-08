# Changelog - WekangTradingJournal

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [1.10.0] - 2026-03-09

### Added
- **👥 Admin Discipline Tracker**: Complete team monitoring system for discipline trading performance
  - Team overview dashboard with 14-day timeline grid (configurable 7/14/30 days)
  - Visual color-coded cells showing daily P&L and outcomes (green=win, red=loss, yellow=BE)
  - Expandable traders with inline statistics (total P&L, win rate, violations)
  - Desktop: Timeline grid table (traders × days), Mobile: Card-based layout
  - Clickable trader names to view individual discipline performance
  - Individual trader view with simplified admin monitoring interface
  - Summary statistics cards: Total P&L, Win Rate, Total Trades, Rule Violations
  - Daily performance summary table showing key metrics (date, P&L, W/L/BE, A+ day, session, violations)
  - Time range selector: 7 days, 1 month, 3 months, 6 months, 1 year, all time
  - Plan configuration display showing user's discipline tracker settings
  - Privacy-conscious design: Admin monitoring without replicating user's personal tracker interface
  - Timezone-aware date handling matching user timezone preferences
  - Admin users excluded from team tracker display
  - New "Discipline" tab in admin navigation with Target icon

- **🔧 Admin API Endpoints**: New endpoints for discipline tracker administration
  - `GET /api/admin/discipline-tracker/team-overview` - Fetch all users' discipline data for timeline grid
  - `GET /api/admin/users/[id]/discipline-tracker/settings` - Fetch specific user's discipline settings
  - `GET /api/admin/users/[id]/discipline-tracker/rows` - Fetch specific user's discipline rows (all time)
  - All endpoints protected with `requireAdmin` middleware
  - Automatic market session evaluation using discipline rules engine

### Fixed
- **🐛 Dashboard Widget Crashes**: Resolved multiple errors causing chart failures
  - Fixed memory leaks in Session Win Rate Comparison and Hourly Performance Heatmap
  - Added AbortController cleanup in useEffect hooks for proper component unmounting
  - Fixed empty chart data by changing period from 'month' to 'all' in default filters
  - Fixed date formatting being too verbose in table headers (now shows clean "Mar 7" format)

- **⏰ Next.js 15 Async Params**: Updated route handlers for Next.js 15 requirements
  - Changed params type signature from `{ params: { id: string } }` to `{ params: Promise<{ id: string }> }`
  - Added proper `await params` destructuring in route handlers
  - Fixes build-time type errors and runtime warnings

### Technical
- Created admin discipline tracker pages and components:
  - `app/(admin)/admin/discipline-tracker/page.tsx` - Team timeline grid (5.59 kB)
  - `app/(admin)/admin/users/[id]/discipline-tracker/page.tsx` - Individual user view (5.09 kB)
  - `app/api/admin/discipline-tracker/team-overview/route.ts` - Team data API
  - `app/api/admin/users/[id]/discipline-tracker/settings/route.ts` - User settings API
  - `app/api/admin/users/[id]/discipline-tracker/rows/route.ts` - User rows API
  - `components/admin/AdminNav.tsx` - Added Discipline tab
- Added TimezoneProvider to admin layout for consistent timezone handling
- Uses existing discipline tracker services (disciplineTrackerService, disciplineTrackerRulesEngine)
- Total build size: 105 routes, 11.5s compile time
- No breaking changes

---

## [1.9.1] - 2026-03-02

### Added
- **💰 Auto-Display of Outcome Values**: Discipline tracker now shows configured P&L values for all trade outcomes
  - Automatic display of TP2, TP1, BE, and SL values from settings (read-only with "(auto)" label)
  - Values appear inline in same row as trade selector, matching TP3 input styling
  - Color-coded by outcome type (emerald for TP3, green for TP2, lime for TP1, amber for BE, rose for SL)
  - Implemented in both desktop table and mobile card views
  - Helps users verify P&L without opening settings

### Fixed
- **🐛 TP3 Input Issues**: Resolved multiple issues with TP3 value entry in discipline tracker
  - Fixed TP3 input only working for Trade 1 (now each trade has its own independent TP3 input)
  - Added 500ms debouncing to allow proper editing and deletion of TP3 values
  - Fixed backspace/delete issues where values would immediately reset to 0
  - Each trade (1, 2, 3) now independently tracks its own TP3 amount in separate database fields
  - Added TP3 input functionality to mobile view (was previously missing)

- **📅 Bulk Trade Date Validation**: Fixed timezone-related date selection issues
  - Added +1 day buffer to accommodate timezone differences (UTC-12 to UTC+14 range)
  - Users in timezones ahead of UTC can now select their current local date
  - Example: Users in UTC+8 at 11 PM can now select their current date (tomorrow in UTC)
  - Updated both client-side (HTML date input max) and server-side (Zod validation)

### Technical
- Created OutcomeValueDisplay component with inline styling matching TP3Input
- Modified TP3Input with local state management and debounced onChange
- Updated TrackerTable and TrackerCardMobile for per-trade value displays
- Enhanced bulkTradeEntrySchema validation to allow dates up to +1 day
- Total changes: 5 files modified, 1 file created
- No breaking changes

---

## [1.9.0] - 2026-02-14

### Added
- **📱 Mobile Optimization for Discipline Tracker**: Complete responsive redesign for mobile devices
  - TrackerCardMobile component with vertical card layout for mobile (< 768px)
  - Touch-friendly controls with 44px minimum tap targets
  - Mobile-optimized FilterBar with flex-wrap layout and full-width inputs
  - Responsive page header with adaptive text and icon sizes
  - Seamless breakpoint switching between card (mobile) and table (desktop) layouts

- **📊 Comprehensive Pagination System**: Multi-mode pagination with persistent preferences
  - usePagination hook with localStorage persistence across sessions
  - Three pagination modes:
    - **Per-Page**: Configurable rows per page (10/25/50/100)
    - **Weekly**: Groups trades by calendar week (Monday start)
    - **Monthly**: Groups trades by calendar month
  - PaginationControls component with mobile and desktop responsive layouts
  - Navigation controls: Previous/Next (always), First/Last (desktop), Page numbers (desktop)
  - Smart date-based grouping for weekly and monthly views
  - Automatic page reset on mode or filter changes
  - Disabled states for unavailable navigation options

### Fixed
- **🐛 UI Fixes**: Resolved visual bugs in discipline tracker
  - Fixed doubled icon in pagination mode selector (icon was rendering in both trigger and value)
  - Removed debug info panel from production build (page size reduced from 25.7 kB to 25.5 kB)

### Technical
- Created 3 new files: TrackerCardMobile.tsx (216 lines), PaginationControls.tsx (204 lines), usePagination.ts (226 lines)
- Modified 3 files: discipline-tracker/page.tsx, TrackerTable.tsx, FilterBar.tsx
- Total changes: 9 files, 753 insertions, 46 deletions
- Build impact: Discipline Tracker page 25.6 kB (199 kB First Load JS)
- No breaking changes - seamless upgrade path

---

## [1.8.1] - 2026-02-10

### Fixed
- **🔧 Build Errors**: Fixed TypeScript compilation errors preventing Vercel deployment
  - Fixed invalid escape sequence `\?` in error logging (app/api/users/me/reset/route.ts)
  - Made params async for Next.js 15 compatibility (app/(user)/trades/[id]/page.tsx)
  - Removed userId from catch block error logs where session was out of scope (8 API routes)
  - Fixed TouchList type mismatch using React.TouchList (2 components)
  - Added empty string `''` to OUTCOME_STYLES to match TradeOutcome enum (TradeCell)

---

## [1.8.0] - 2026-02-10

### Added
- **🔒 Comprehensive Security Hardening**: Fixed 14 security vulnerabilities
  - **CRITICAL**: Debug endpoints (env, db-status, check-db) now require admin authentication
  - **CRITICAL**: Debug endpoints disabled in production (return 404)
  - **CRITICAL**: Removed database URL previews from debug endpoints
  - **CRITICAL**: Fixed password exposure in error logs
  - **HIGH**: Added security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
  - **HIGH**: Fixed error logging in 15+ API routes (safe metadata only, no sensitive data)
  - **MEDIUM**: Middleware debug logs wrapped in development-only check

### Fixed
- **🔐 Sign-out Redirect Bug**: Fixed logout redirecting to localhost instead of current host
  - Issue: NextAuth NEXTAUTH_URL caused redirects to localhost:3000 on remote access (e.g., 192.168.88.13:3000)
  - Solution: Created SignOutButton component using `signOut({ redirect: false })` + manual redirect via `window.location.href`
  - Replaced all sign-out links with SignOutButton in AdminNav, NavMenu, user layout, settings, test pages

- **🔒 Login Password in URL**: Prevented password from appearing in URL and browser history
  - Issue: Browser autofill created GET request exposing password in query parameters
  - Solution: Added `method="post"` and proper autocomplete attributes to login form

- **♻️ Reset Account Completeness**: Added discipline tracker data to reset account functionality
  - Now deletes `discipline_tracker_rows` and `discipline_tracker_settings` tables
  - Updated account summary to show discipline tracker entries count
  - Fixed orphaned data issue where discipline tracker data wasn't cleaned during account reset

- **🎨 Discipline Tracker Cell Colors**: Fixed trade outcome cells not displaying background colors
  - Issue: SelectTrigger's default `bg-background` class overriding outcome colors
  - Solution: Replaced Tailwind classes with inline styles for guaranteed color display
  - Colors: TP3 (emerald), TP2 (green), TP1 (lime), BE (amber), SL (rose)

### Documentation
- **📝 Code Comments**: Added clarification distinguishing motivationalMessages (user-specific notifications) from tradingQuotes (admin-managed quotes)

### Security
- **🛡️ Debug Endpoints**: All require admin authentication, disabled in production
- **🔐 Password Security**: Removed from error logs, URL parameters, and responses
- **🔒 Security Headers**: Protection against clickjacking, MIME sniffing, unwanted permissions
- **📊 Error Logging**: Standardized safe logging pattern `{ type, message, userId }` across all API routes

---

## [1.7.0] - 2026-02-07

### Added
- **⚡ Performance Optimization**: Trade recording speed improvements
  - **Non-blocking Badge Checking**: Badge awards now processed asynchronously (500-1000ms faster)
  - **Parallel Daily Summary Updates**: Use Promise.all for multi-date operations (70% faster)
  - **Optimized Cache Invalidation**: Single layout-level revalidatePath (100-200ms savings)
  - **Removed Redundant Operations**: Eliminated duplicate initializeUserStats calls
  - **Speed Improvements**:
    - Individual trade entry: 1200ms → 300ms (75% faster)
    - Bulk entry: 2500ms → 800ms (68% faster)
    - CSV import: 4200ms → 1300ms (69% faster)
  - See [PERFORMANCE-OPTIMIZATION-v1.7.0.md](docs/PERFORMANCE-OPTIMIZATION-v1.7.0.md) for technical details

- **📍 Pinned Quotes on Trade Entry Pages**: TradesPageQuote component added to:
  - /trades/new (Real-time entry)
  - /trades/bulk (Bulk entry)
  - /trades/import (CSV import)
  - Smart caching with 5-minute sessionStorage TTL

- **🎯 Collapsible Dashboard Sections**: Improved dashboard load performance
  - Best Trading Session (collapsible)
  - Session Win Rate Comparison (collapsible, collapsed by default)
  - Hourly Performance Heatmap (collapsible, collapsed by default)
  - Deferred data fetching for heavy charts

### Optimized
- **Quote Loading Performance**: 50-100ms cached, 200-300ms fresh
  - API-level caching with revalidate: 30-60 seconds
  - Client-side sessionStorage caching
  - Database query optimization

## [1.6.0] - 2026-02-07

### Added
- **💬 Quote Card System (Complete)**: Motivational quotes integrated across the platform
  - **26 Bilingual Quotes**: 9 categories (Discipline, Loss, Win, Patience, Confidence, Overtrading, Risk, Mental, General) in English & Bahasa Malaysia
  - **Quote of the Day Widget**: Dashboard widget with 24-hour persistence using deterministic selection
  - **Contextual Quotes**: Smart quote selection based on trading performance
    - **Discipline Tracker Quote**: Analyzes last 3 days from disciplineTrackerRows table, displays mood icon + weekly win rate
    - **My Trades Quote**: Analyzes last 3 trades from individualTrades table, displays performance context
  - **Weighted Random Selection**: 1-10 weight system with anti-repeat logic
  - **Display Count Tracking**: Analytics showing most viewed quotes
  - **Admin Management Interface**: Full CRUD operations with search, filter, sort
    - Stats dashboard showing quotes by category and most shown quotes
    - Download template, upload JSON, delete all functionality
    - Multi-select delete with checkboxes and bulk actions bar
    - Reset statistics feature with confirmation dialog
  - **Fallback Quote System**: 5 hardcoded quotes for fresh installations (zero-error experience)
  - **Auto-ID Generation**: Sequential IDs per category (q-discipline-001, q-discipline-002, etc.)
  - **Beautiful UI**: Purple gradient cards with animations, mobile-responsive design
  - **Session Limits**: Max 5 quotes per session, configurable cooldown (15 min default)

### Fixed
- **🐛 Display Count Tracking**: Fixed quotes showing 0× in statistics dashboard
  - Added `incrementQuoteDisplayCount()` calls to all 4 quote API routes
  - Routes: /api/quotes/random, /api/quotes/quote-of-the-day, /api/quotes/contextual, /api/quotes/trades-page
  - Stats now accurately reflect which quotes are most effective
- **⚠️ Next.js 15 Metadata Warnings**: Resolved console warnings
  - Moved `themeColor` from metadata export to viewport export
  - Added `metadataBase` to metadata using NEXTAUTH_URL environment variable
  - Properly configured for social media image resolution
- **🔔 Notification Badge**: Fixed bell icon count not updating immediately after marking as read
  - Converted to client-side NotificationBell component
  - Auto-refreshes on route changes using usePathname() hook
  - Eliminates server-side rendering stale data issue
  - Badge count now updates instantly when navigating between pages

### Changed
- **🔽 Collapsible Sections**: Improved UX with collapsible filters and settings
  - **My Trades**: Filters & Search section collapsible (collapsed by default)
  - **Discipline Tracker**: Plan Settings section collapsible (collapsed by default)
  - Both sections use ChevronDown/ChevronUp icons for clear visual feedback
  - Reduces visual clutter and improves initial page load experience

### Removed
- **Popup Quotes**: Removed intrusive quote popups from trade entry forms
  - Quote popups after quick trade entry ❌ (replaced with pinned contextual quote)
  - Quote popups after bulk trade entry ❌
  - Quote popups after CSV import ❌
  - **Rationale**: Non-intrusive pinned quotes provide better UX without disrupting workflow

### Technical
- **Database Schema**: Added trading_quotes, user_quote_preferences tables
- **API Endpoints**: 8 RESTful endpoints with Zod validation
  - `GET/POST /api/quotes` - List all quotes, create new quote
  - `GET/PATCH/DELETE /api/quotes/[id]` - Get, update, delete specific quote
  - `POST /api/quotes/random` - Get random quote with cooldown
  - `GET /api/quotes/quote-of-the-day` - Deterministic daily quote
  - `POST /api/quotes/seed` - Bulk seed/upsert quotes
  - `GET/PATCH /api/quotes/preferences` - User quote preferences
  - `GET /api/quotes/contextual` - Discipline Tracker contextual quote
  - `GET /api/quotes/trades-page` - My Trades contextual quote
  - `POST /api/quotes/reset-stats` - Reset all display counts (Admin only)
- **Service Layer**: 5 new services (11+ functions)
  - quoteService.ts: Core quote operations with display count tracking
  - userQuotePreferencesService.ts: Preferences management
  - contextualQuoteService.ts: Discipline Tracker analysis
  - tradesPageQuoteService.ts: My Trades analysis
  - fallbackQuotes.ts: 5 hardcoded fallback quotes
- **UI Components**: 5 new components
  - QuoteCard.tsx (toast + inline variants)
  - QuoteOfTheDayWidget.tsx (dashboard widget)
  - DisciplineTrackerQuote.tsx (contextual quote)
  - TradesPageQuote.tsx (contextual quote)
  - NotificationBell.tsx (client-side bell icon with auto-refresh)
- **Context Provider**: QuoteSystemContext for global state management
- **Documentation**: QUOTE-CARD-IMPLEMENTATION-SUMMARY.md, 16-QUOTE-CARD-SYSTEM.md updated

---

## [1.5.0] - 2026-02-07

### Added
- **🎯 Discipline Tracker Feature**: Complete execution discipline and rule enforcement system
  - **Instrument-Agnostic Daily Tracker**: Track trading discipline across any market or account
  - **Configurable P&L Settings**: Customize TP1/TP2/TP3, BE, and SL values per user
  - **Auto-Locking Trades**: Prevent overtrading with rule-based trade locking
    - Trade 1 win → Locks Trade 2 & 3 (stop for the day)
    - Trade 2 win → Locks Trade 3 (preserve profits)
    - Trade 2 loss → Locks Trade 3 (stop losses)
  - **A+ Setup Confirmation**: Require high-quality setup confirmation after BE/SL outcomes
  - **Range Expansion Tracking**: Track market conditions for Trade 3 eligibility
  - **Session Window Enforcement**: Trade 3 only allowed in prime trading sessions
  - **Real-Time Rule Evaluation**: Visual feedback with lock states and reasoning tooltips
  - **Interactive Table**: Inline editing with debounced notes input (500ms delay)
  - **Toggle Switches**: Independent A+ and Range Expansion confirmation controls
  - **Cumulative Statistics**: Track P&L, win rate, discipline adherence over time
  - **Duplicate Date Prevention**: One row per date with proper error handling
  - **Tooltips with Info Icons**: Clear explanations for A+ and Range Expansion columns
  - **CSV-Ready Structure**: Prepared for future export functionality

### Technical
- **Database Schema**: Added 2 new tables (`discipline_tracker_settings`, `discipline_tracker_rows`)
- **Migration 0008**: Created discipline tracker tables with proper column naming
- **Column Rename Migration**: Fixed aplusConfirmed → isAPlusDay, rangeExpansionConfirmed → isRangeExpansionDay
- **Rules Engine**: Pure functions with comprehensive lock state evaluation (311 lines)
- **API Endpoints**: 3 RESTful endpoints with Zod validation
  - `GET/POST /api/discipline-tracker/settings`
  - `GET/POST /api/discipline-tracker/rows`
  - `GET/PATCH/DELETE /api/discipline-tracker/rows/[id]`
- **UI Components**: 5 interactive components + main page
  - TradeCell: Dropdown with "EMPTY" handling and lock states
  - TP3Input: Manual TP3 amount entry
  - RowActions: Edit/Delete with confirmation dialog
  - AddRowDialog: Form with duplicate date handling
  - TrackerTable: 397 lines with debounced notes input
- **shadcn/ui Components**: Added alert-dialog and tooltip components
- **Performance Optimization**: Debounced notes input to prevent constant re-renders
- **Documentation**: Comprehensive 844-line feature specification

### Fixed
- **Database Column Naming**: Resolved mismatch between schema and code references
- **Validation Schema**: Fixed updateDisciplineTrackerRowSchema stripping trade outcomes
- **Notes Input Performance**: Implemented 500ms debounce to prevent constant API calls
- **Toggle State Management**: Fixed toggles resetting by fetching fresh row data
- **Error Handling**: Improved duplicate date error handling (keeps dialog open for user to fix)

### Changed
- **Progress Tracking**: Updated to v3.0, added v1.5.0 milestone
- **Feature Documentation**: Updated 15-DISCIPLINE-TRACKER.md to production-ready status

---

## [1.4.2] - 2026-02-05

### Added
- **Timezone Selection in Quick Trade Entry**: Users can now select timezone for trade timestamps (matching bulk and CSV import functionality)
  - Timezone dropdown with default to user's preferred timezone setting
  - Properly converts selected timezone to UTC for storage
  - Ensures consistent timezone handling across all 3 entry methods (Quick, Bulk, CSV)
  - Displays selected timezone in helper text for clarity

### Changed
- **Allow Duplicate Timestamps**: Removed timestamp uniqueness validation from all trade entry methods
  - **Rationale**: Time format excludes seconds, making it legitimate for multiple trades to occur within the same minute
  - Removed duplicate timestamp check from Bulk Trade Entry
  - Removed duplicate timestamp check from CSV Import (both internal and existing trade checks)
  - Updated Copilot instructions to reflect that duplicate timestamps are now allowed
  - Quick Trade Entry already allowed duplicates (no changes needed)

---

## [1.4.1] - 2026-01-30

### Fixed
- **Critical Production Bug**: Fixed 405/500 error when saving SOP details in admin panel
  - **Root Cause**: `isomorphic-dompurify` package incompatible with Vercel serverless environment (uses JSDOM internally)
  - **Solution**: Replaced with `sanitize-html` which is Node.js native and serverless-compatible
  - Updated `lib/utils/sanitize.ts` to use new sanitization library
  - Maintained same XSS protection capabilities with equivalent allowed tags and attributes
  - All admin SOP management functions now work correctly in production

---

## [1.4.0] - 2026-01-29

### Added
- **User Ranking System**: Anonymous leaderboard showing relative performance ranking (1st, 2nd, 3rd place)
  - Displays user's current rank among all active traders
  - Shows ranking based on win rate, with minimum 10 trades for last 30 days qualification
  - Medal indicators for top 3 performers (🥇🥈🥉)
  - Anonymous display (doesn't reveal other users' names)
- **Enhanced Performance Analytics View**: Complete calendar-based performance visualization
  - Month/Year view toggle (replicated from admin dashboard)
  - Interactive monthly calendar showing daily trading performance
  - Color-coded performance indicators:
    - Green: Positive P/L days
    - Blue: Break-even days  
    - Orange: Loss days
    - Gray: No trading activity
  - Year overview with 12 monthly performance cards (clickable drill-down)
  - 4 summary cards with gradient backgrounds (P/L, Win Rate, SOP Rate, Total Trades)
  - Full calendar display (all days 1-31, not just trading days)
  - Legend with performance indicators
- **Timezone-Aware Performance Aggregation**:
  - All performance data now respects user's preferred timezone setting
  - Trades grouped by day in user's timezone (not UTC)
  - Proper handling of timezone edge cases (e.g., 23:00 UTC+8 = next day)
  - Month/year boundaries calculated in user's timezone

### Changed
- Performance Trends page (`/analytics/trends`) now features comprehensive calendar view
- Performance analytics service now queries `individualTrades` directly for timezone-correct daily grouping
- Removed dependency on `dailySummaries` table for monthly performance (timezone issues)
- Date range queries now include 2-day buffer to capture timezone edge cases

### Fixed
- **Critical timezone conversion bug**: Trades not appearing on correct calendar day
  - Fixed incorrect use of `toLocaleString()` + `new Date()` parsing
  - Implemented proper `Intl.DateTimeFormat.formatToParts()` for timezone conversion
  - Trades now appear on correct date according to user's timezone setting
- Performance calendar now displays all trades accurately in user's local time
- Monthly performance aggregation now timezone-aware

### Technical Improvements
- Service layer properly extracts day/month/year in user's timezone using Intl API
- Removed duplicate `dailyBreakdown` code from performance service
- Cleaner, more maintainable timezone conversion logic

---

## [1.3.1] - 2026-01-28

### Added
- Professional Wekang Trading logo with transparent background
- Complete favicon set for all platforms (iOS, Android, PWA)
- Brand color palette in Tailwind config (red, orange, yellow, gold, black, white)
- PWA manifest with Wekang branding
- Dynamic system information display (version, environment, database)

### Changed
- Removed emojis from all metadata for professional appearance
- Updated app title to professional format
- Enhanced OpenGraph and Twitter card metadata
- System information now dynamically detects environment and database

### Fixed
- System information showing outdated version on main branch
- Missing professional branding icons

---

## [1.3.0] - 2026-01-28

### Added
- Economic Calendar Cron Job with GET endpoint for Vercel Cron compatibility
- CRON_SECRET authorization for secure cron execution
- Comprehensive cron logging to `cron_logs` table
- Pre-merge verification documentation (SOP Delete, User Delete, Cron Fix)

### Fixed
- Economic calendar cron not triggering on production (missing GET endpoint)
- Vercel.json cron path pointing to wrong endpoint
- User deletion now properly removes OAuth accounts (future-proofing)
- Complete data cleanup on user deletion (10 tables verified)

### Changed
- Environment files cleanup (removed 4 Vercel-generated .env files)
- User delete now handles accounts table for OAuth support
- Improved cron endpoint with better error handling and logging

### Documentation
- Added CRON-FIX-DEPLOYMENT.md with deployment guide
- Added ENV-FILES-CLEANUP.md with environment analysis
- Added USER-DELETE-ANALYSIS.md with comprehensive verification
- Added PRE-MERGE-VERIFICATION-SUMMARY.md for merge approval

### Security
- Added CRON_SECRET for cron endpoint authorization
- Enhanced user deletion to prevent orphaned OAuth data

---

## [Unreleased]

### Added

**Feature 5: SOP Details & Mobile Enhancement - COMPLETE** ✅

**Phase 1-3: Admin SOP Management**
- ✅ Enhanced admin SOP types page with tabbed interface (Basic Info | Details & Formatting)
- ✅ Added Detail Status column with dynamic badges (Both/Short/Long/Draft/None)
- ✅ Integrated Tiptap rich text editor with custom toolbar (Template, Bold, Italic, Headings, Lists, Code, Link)
- ✅ Two-column layout: Visual content (images + chart notes) on left, strategy text editor on right
- ✅ Image upload with validation (500KB max per image, base64 encoding)
- ✅ Clipboard paste support (Ctrl+V) for quick image insertion
- ✅ Chart Notes & Annotations textarea for documenting visual analysis
- ✅ Enable/disable toggles for SHORT (bearish) and LONG (bullish) strategies independently
- ✅ Data persistence using JSON serialization ({content, images, notes} structure)
- ✅ Template insertion for consistent strategy documentation format
- ✅ Server-side HTML sanitization with isomorphic-dompurify
- ✅ Backward compatibility for legacy plain text content

**Phase 4: User Strategies Page**
- ✅ New `/strategies` page for viewing SOP strategy guides
- ✅ Accordion layout for each SOP type with SHORT/LONG sections
- ✅ Search functionality by name or description
- ✅ Two-column display: Images+notes left, strategy content right
- ✅ Image gallery with click-to-expand full-screen view
- ✅ Chart notes display with proper formatting
- ✅ Color-coded sections (Blue for SHORT, Purple for LONG)
- ✅ Last updated timestamp display
- ✅ Added "📖 Strategies" to navigation menu

**Phase 5: Mobile Responsiveness & Navigation**
- ✅ Reorganized navigation with dropdown menus (Performance 📊, Resources 📚)
- ✅ Hamburger menu for mobile with categorized sections
- ✅ Responsive accordion headers (stack badges on mobile)
- ✅ Adaptive font sizes (xs/sm on mobile → sm/base on desktop)
- ✅ Image galleries optimized (300px mobile → 400px desktop)
- ✅ Touch-friendly spacing throughout
- ✅ Trade buttons stack vertically on mobile
- ✅ Brand name shortens on small screens
- ✅ Breakpoints: sm (640px), md (768px), lg (1024px)

**Phase 6: Admin UX Enhancements - Drag-Drop & Pin Favorites** ✅
- ✅ Drag-and-drop SOP reordering with @dnd-kit library
- ✅ Visual grab handles (⋮⋮) for intuitive drag interaction
- ✅ Auto-save order to database on drop
- ✅ Removed manual sortOrder input field
- ✅ Pin/favorite system (max 3 per user)
- ✅ Star icons with fill state (⭐)
- ✅ Pin counter badge in header (⭐ X/3 Pinned)
- ✅ Client-side validation before pin
- ✅ Disabled states when max pins reached
- ✅ Helpful tooltips for user guidance
- ✅ Migration 0007: user_pinned_sops table (composite PK)
- ✅ User-specific pins with sorting (pinned first)
- ✅ Fixed JSON content display bug (data migration cleanup)

**Phase 6: Testing & Polish**
- ✅ End-to-end workflow testing (Admin edit → User view)
- ✅ Image upload/paste validation
- ✅ Mobile navigation functionality verified
- ✅ Documentation updated (CHANGELOG, progress tracking)

**Tech Debt Resolution** ✅
- ✅ Migration 0006: Added dedicated database columns for images and notes
  - Added `detail_images_short` and `detail_images_long` (JSON arrays)
  - Added `detail_image_notes_short` and `detail_image_notes_long` (plain text)
  - Migrated existing JSON data from content columns to new structure
  - Improved database query performance and data organization
- ✅ Refactored service layer to use separate columns
  - Updated `getSopTypesWithDetails` to SELECT new columns
  - Simplified `updateSopDetail` to accept separate content/images/notes fields
  - Removed complex JSON parsing in service layer
- ✅ Updated API endpoints to extract and validate components separately
  - Backward compatible with legacy JSON format
  - Validates image arrays directly before storage
  - Cleaner error handling and validation logic
- ✅ Frontend updates for new data structure
  - Admin page: Extracts content/images/notes from stored data
  - User strategies page: Handles both new columns and legacy JSON
  - Parsing logic supports all formats (new columns, JSON, plain text)
- ✅ Added "Clear Strategy" button for each entry type (SHORT/LONG)
  - Confirmation dialog prevents accidental deletions
  - Clears content, images, and notes in one action
  - Visual feedback with toast notification

**Phase 6: Testing & Polish**
- ✅ Fixed JSON structure validation in API
- ✅ Updated service layer to parse JSON, sanitize HTML, re-wrap
- ✅ Fixed image validation to check separate images array
- ✅ All phases tested and working on staging database

**Database Changes**:
- ✅ Migration 0005: Added 6 new columns to sop_types table
  - `detailContentShort` (TEXT) - Stores SHORT strategy with JSON metadata
  - `detailContentLong` (TEXT) - Stores LONG strategy with JSON metadata
  - `detailEnabledShort` (BOOLEAN) - Toggle for SHORT visibility
  - `detailEnabledLong` (BOOLEAN) - Toggle for LONG visibility
  - `detailUpdatedAt` (TIMESTAMP) - Last update timestamp
  - `detailUpdatedBy` (FK users.id) - Tracks who updated content
- ✅ Indexes created on enabled flags for fast filtering

**New Dependencies**:
- 📦 @tiptap/react@3.17.0 - Rich text editor framework
- 📦 @tiptap/starter-kit@3.17.0 - Basic editing features
- 📦 @tiptap/extension-link@3.17.0 - Link support
- 📦 isomorphic-dompurify@2.35.0 - XSS protection
- 📦 @radix-ui/react-switch - Toggle switches

**New Components**:
- ✅ `components/editors/TiptapEditor.tsx` - WYSIWYG editor with image gallery
- ✅ `components/editors/TiptapReadOnly.tsx` - Read-only display component
- ✅ `components/navigation/NavMenu.tsx` - Responsive navigation with dropdowns
- ✅ `components/ui/switch.tsx` - Toggle component (shadcn/ui)
- ✅ `components/ui/accordion.tsx` - Collapsible sections (shadcn/ui)
- ✅ `components/ui/dropdown-menu.tsx` - Dropdown menus (shadcn/ui)
- ✅ `lib/utils/imageValidation.ts` - Client/server image validation
- ✅ `lib/utils/sanitize.ts` - Client-safe HTML sanitization

**API Updates**:
- ✅ `app/api/admin/sop-types/[id]/route.ts` - Enhanced PATCH endpoint with JSON parsing
- ✅ `app/api/sop-types/with-details/route.ts` - User-facing endpoint (pre-existing)
- ✅ `lib/services/sopDetailService.ts` - Enhanced with JSON handling

**Known Limitations** (tracked for future work):
- 📝 TECH DEBT: Images stored as base64 JSON in TEXT columns (need dedicated schema migration)
- 📝 FEATURE REQUEST: No clear/delete/reset button for strategy content
- 📝 No version history for content changes
- 📝 No preview mode before save
- 📝 No preview mode before save

---

## [1.2.2] - 2026-01-24

### Fixed

**CRITICAL: Timezone Conversion Fix**
- ✅ Fixed bulk trade form ignoring user timezone preference (used browser timezone instead)
- ✅ Fixed real-time trade form timezone handling
- ✅ Fixed bulk trade date validation error (was using local timezone instead of UTC)
- ✅ Added `datetimeLocalToUTC()` utility function for proper timezone conversion
- ✅ Trade times now correctly interpreted according to user's selected timezone setting
- ✅ Example: User in Malaysia (UTC+8) with app timezone set to New York (UTC-5) entering 14:00 now correctly saves as 19:00 UTC (not 06:00 UTC)

**Badge System Fixes**
- ✅ Fixed badges not triggering after CSV import (production badges table was empty)
- ✅ Seeded 34 badges into production database
- ✅ CSV import web UI now recalculates user stats before checking badges
- ✅ Bulk trade entry now recalculates user stats before checking badges
- ✅ CSV import script already had proper badge recalculation
- ✅ All three entry methods (real-time, bulk, CSV) now award badges consistently
- ✅ Badge celebration modal now appears after CSV import (with confetti animation)
- ✅ Notification bell count updates immediately after badge awards
- ✅ No manual recalculation needed after imports

**Security & Environment**
- ✅ Added missing `RAPIDAPI_KEY` environment variable to production (economic calendar cron fix)
- ✅ Added `.env.vercel` and `.env.preview` to `.gitignore` (prevent accidental credential commits)

### Added

**Import Timezone Selector**
- ✅ Bulk trade entry form now includes timezone dropdown
- ✅ CSV import wizard UI now has timezone selector dropdown
- ✅ CSV import script has configurable IMPORT_TIMEZONE constant
- ✅ CSV parser accepts timezone parameter for proper timestamp conversion
- ✅ Select different timezone per import session without changing account settings
- ✅ 11 common timezones available (Malaysia, Singapore, UTC, EST, PST, London, Tokyo, etc.)
- ✅ Use case: Import historical data from different timezones/brokers without manual conversion
- ✅ CSV imports via web: Select timezone in wizard before uploading file
- ✅ CSV imports via script: Change IMPORT_TIMEZONE constant at top of file

**Badge Celebration Enhancements**
- ✅ CSV import now shows `BadgeCelebration` modal with confetti when badges earned
- ✅ Success toast shows badge count: "Successfully imported X trades and earned Y badges! 🎉"
- ✅ Auto-redirects to achievements page after celebration closes
- ✅ Cache revalidation updates notification count immediately in navbar
- ✅ Consistent celebration experience across all entry methods

### Technical Improvements

**API Response Enhancements**
- ✅ CSV import API now returns full badge objects (not just count)
- ✅ Added `revalidatePath()` calls to refresh notification count and cached pages
- ✅ Both bulk and CSV import APIs call `updateUserStatsFromTrades()` before badge checks
- ✅ Proper error handling with TypeScript null checks in CSV parser

**Code Consistency**
- ✅ All trade entry methods follow same pattern:
  1. Create trades
  2. `initializeUserStats()`
  3. `updateUserStatsFromTrades()` 
  4. `checkAndAwardBadges()`
  5. `revalidatePath()` for UI updates

---

## [1.2.1] - 2026-01-24

### Added

**Performance Optimization Project** (January 20-21, 2026):
- ✅ **Phase 1: React Optimizations**
  - 13 components with React.memo(), useMemo(), useCallback()
  - Form debouncing (300ms) on 2 forms
  - SELECT field optimization - 22 queries (76% avg payload reduction)
  - Dependencies: react-window@1.8.10, use-debounce@10.1.0, @next/bundle-analyzer@15.0.3
- ✅ **Phase 2: Database Indexes**
  - 5 composite indexes for faster queries
  - idx_trades_user_timestamp_result (TradesList filtering)
  - idx_trades_user_date_result (streak calculations)
  - idx_trades_user_session (session analysis)
  - idx_summary_user_date (dashboard trends)
  - idx_user_badges_user_earned (badge progress)
- ✅ **Phase 3: Virtualization**
  - TradesTableVirtualized component for lists >100 trades
  - Conditional rendering based on trade count
  - 70% faster rendering for large lists
- ✅ **Phase 4: Bundle Optimization**
  - ChartSkeleton loading component
  - Dynamic imports for 5 chart components
  - Admin route code splitting (UserPerformanceCalendar)
  - Enhanced Next.js config (SWC minifier, gzip, optimized package imports)
  - Analytics bundle: 232 KB → 106 KB (-126 KB, -54%)
  - Transfer sizes with gzip: Dashboard ~80 KB (-67%), Analytics ~35 KB (-85%)

**Admin Navigation & UI Enhancements**:
- ✅ Settings dropdown menu in admin navigation (General, SOP Types, Invite Codes, Calendar)
- ✅ Icons throughout admin interface (lucide-react)
- ✅ Admin profile editing (name, email for admin users)
- ✅ Admin General settings page
- ✅ Separated calendar view from cron settings

**Economic Calendar Monitoring**:
- ✅ Cron job monitoring dashboard with countdown timer
- ✅ Execution history (last 10 runs) with status, duration, errors
- ✅ Real-time countdown to next cron execution
- ✅ Auto-refresh (countdown 1s, logs 30s)
- ✅ Database table: `cron_logs` for tracking

**Calendar View**:
- ✅ Dedicated admin calendar view page at `/admin/economic-calendar/view`
- ✅ Event grouping by date with visual indicators
- ✅ Impact bars (HIGH/MEDIUM/LOW)
- ✅ Country flags and currency pairs

### Changed

**Economic Calendar Optimization**:
- 🔄 Changed cron job from weekly to weekdays-only (Mon-Fri)
- ⏰ Runs at 05:00 UTC / 00:00 EST (US market start time)
- 🚫 Skips weekends (no market activity)
- 📉 Reduced fetch window from 14 days to 7 days (rolling window)
- 📊 API usage: ~22 requests/month (within 50 request monthly limit, 56% buffer)
- 📅 Cron syntax: `0 5 * * 1-5` (previously: `0 0 * * 1`)

**Admin Settings**:
- 🎯 Admin users can now edit their own profile (name, email)
- 🚫 Removed "Danger Zone" reset account for admin users
- 🎨 Added icons to all settings sections

**Documentation**:
- 📚 Created comprehensive documentation index (docs/README.md)
- 📝 Created [13-ADMIN-NAVIGATION-ENHANCEMENTS.md](docs/13-ADMIN-NAVIGATION-ENHANCEMENTS.md) - Complete guide to admin navigation improvements
- 📝 Created [14-ECONOMIC-CALENDAR-CRON-MONITORING.md](docs/14-ECONOMIC-CALENDAR-CRON-MONITORING.md) - Comprehensive cron monitoring documentation
- 📊 Updated all core docs (00-12 series) to v1.2.0 status
- 🗂️ Archived outdated planning documents
- 🔍 Conducted full documentation audit (44+ files reviewed)
- ✅ All documentation now reflects v1.2.0 production state

### Changed

**Documentation Structure**:
- 📁 Moved FEATURE-4 docs to `docs/archive/features/`
- 📁 Moved planning documents to `docs/archive/planning/`
- 📁 Moved audit report to `docs/archive/`
- 🗑️ Deprecated 06-PROGRESS-TRACKING.md (use CHANGELOG.md instead)
- 📖 Created master documentation index with quick navigation

### Fixed

- 🐛 Fixed hydration errors (removed nested html/body tags in error.tsx)
- 🐛 Fixed TimezoneProvider issue in admin pages
- 🐛 Fixed 404 error for /admin/settings page
- 🐛 Fixed dropdown positioning in admin navigation

### Technical

**Database Changes**:
- New table: `cron_logs` (id, jobName, status, startedAt, completedAt, duration, itemsProcessed, errorCode, errorMessage)
- Migration: `npm run drizzle:push` required

**API Endpoints**:
- `/api/admin/economic-calendar/cron-logs` - GET cron execution logs and next run time
- Enhanced `/api/admin/economic-calendar/sync` - Now logs all executions to database

**Files Created**:
- `app/(admin)/admin/economic-calendar/view/page.tsx` - Calendar view page
- `app/(admin)/admin/settings/page.tsx` - General settings page
- `app/api/admin/economic-calendar/cron-logs/route.ts` - Cron logs API
- `components/admin/SettingsDropdown.tsx` - Dropdown menu component
- `lib/db/schema/cronLogs.ts` - Cron logs schema

**Files Modified**:
- `app/(admin)/layout.tsx` - Navigation with icons and dropdown
- `app/(user)/settings/page.tsx` - Admin profile editing
- `app/(admin)/admin/economic-calendar/page.tsx` - Monitoring dashboard
- `lib/services/economicCalendarService.ts` - Fetch window optimization
- `vercel.json` - Updated cron schedule

---

## [1.2.0] - 2026-01-17

### 🎮 Gamification & Achievement System

Major feature release introducing comprehensive gamification to encourage consistent trading habits and motivate performance improvement.

**New Feature**: Badge & Achievement System  
**Documentation**: [12-GAMIFICATION-SYSTEM.md](./docs/12-GAMIFICATION-SYSTEM.md)

#### Added

**Badge System**:
- ✅ 34 unique achievement badges across 9 categories
- ✅ 4-tier badge system (Bronze 30-40pts, Silver 50pts, Gold 100pts, Platinum 150pts)
- ✅ Categories: Trades, Win Streak, Profit, Win Rate, SOP, Log Streak, Sessions, Targets, Max Trades/Day
- ✅ Automatic badge awarding on trade submission
- ✅ Badge progress tracking with percentage indicators
- ✅ Badge collection gallery with earned/locked states
- ✅ Total points system

**Streak Tracking**:
- ✅ Win Streak: Consecutive winning days (positive daily profit)
- ✅ Log Streak: Consecutive logging days (daily trade activity)
- ✅ SOP Streak: Consecutive SOP-compliant trades
- ✅ Current vs. Longest streak tracking
- ✅ Automatic streak reset on break
- ✅ Streak milestone notifications

**Achievement Features**:
- ✅ Real-time badge progress display
- ✅ Multi-badge celebration modals with animations
- ✅ Pagination slider for multiple simultaneous awards
- ✅ Achievement notifications system
- ✅ Motivational messages on milestones
- ✅ Badge details modal with requirements

**User Stats Enhancement**:
- ✅ Denormalized `user_stats` table for fast badge checks
- ✅ Automatic stats recalculation on trade operations
- ✅ Stats sync on create/update/delete/bulk operations
- ✅ Performance optimized progress calculations

**Database Schema**:
- ✅ New table: `badges` (34 seeded badges)
- ✅ New table: `user_badges` (earned badge records)
- ✅ New table: `streaks` (win/log/SOP streak tracking)
- ✅ Enhanced: `user_stats` (streak fields + aggregates)
- ✅ Enhanced: `motivational_messages` (achievement notifications)

**API Endpoints**:
- ✅ `GET /api/badges` - List all available badges
- ✅ `GET /api/badges/user` - Get user's earned badges
- ✅ `GET /api/badges/progress` - Get progress towards unearned badges
- ✅ Enhanced: `GET /api/users/me` - Includes badge stats

**UI Components**:
- ✅ Achievements page (`/dashboard/achievements`)
- ✅ Badge celebration modal with confetti
- ✅ Badge progress cards with dual progress bars (WIN_RATE)
- ✅ Badge details modal with category/tier display
- ✅ Notification dropdown for achievement alerts

#### Fixed

**Critical Bug Fixes**:
- ✅ **Badge Progress Sync**: Fixed stale values - now updates immediately after trade submission
- ✅ **SOP Streak Calculation**: Fixed incorrect trade counting (was 27, should be 7) - now counts consecutive trades, not days
- ✅ **Win Streak Weekend Logic**: Fixed weekend skipping for 24/7 forex markets - now uses calendar days
- ✅ **Celebration Slider Navigation**: Fixed "Next Badge" button closing instead of advancing
- ✅ **Progress Display**: Badge progress now shows CURRENT streak (not longest) for monitoring
- ✅ **Account Reset**: Now includes badges, streaks, and all gamification data

**Performance Improvements**:
- ✅ Reduced aggressive page reloading on achievements page
- ✅ Smart refresh only when badges actually updated
- ✅ Removed window focus event listener causing reload spam
- ✅ Optimized stats recalculation (~200-500ms per trade operation)

#### Changed

**Streak Behavior Clarification**:
- Current streak resets to 0 on break
- Longest streak preserved permanently
- Badges based on longest streak (remain earned after break)
- Progress bars show current streak (for monitoring)

**Enhanced Account Reset**:
- Now deletes: trades, summaries, targets, badges, streaks, stats, notifications, messages
- Preserves: login credentials, email, role, account settings
- Displays comprehensive deletion summary before confirmation

**Badge Award Logic**:
- Uses `longestStreak` for badge awarding (permanent achievements)
- Uses `currentStreak` for progress display (active monitoring)
- Dual-threshold for WIN_RATE badges (percentage + minimum trades)

#### Technical Details

**Files Modified**:
- `lib/services/badgeService.ts` - Badge evaluation and progress calculation
- `lib/services/streakService.ts` - Added `recalculateSopStreakFromTrades()`
- `lib/services/individualTradeService.ts` - Integrated stats sync on all operations
- `lib/services/userSettingsService.ts` - Enhanced account reset
- `app/(user)/dashboard/achievements/page.tsx` - Smart refresh logic
- `components/animations/BadgeCelebration.tsx` - Fixed slider navigation
- Database migrations for new tables and fields

**Scripts Added**:
- `scripts/test-badge-apis.ts` - Badge system testing
- `scripts/test-streak-progress.ts` - Streak progress verification
- `scripts/check-sop-badge.ts` - SOP streak debugging

**Dependencies**:
- No new dependencies (uses existing React, Drizzle ORM, shadcn/ui)

#### Migration Notes

**For Existing Users**:
1. Database migrations will auto-create new tables
2. Existing trades will be processed for badge eligibility
3. Run `updateUserStatsFromTrades()` for each user to initialize stats
4. Badges will be awarded retroactively based on achievements

**Admin Actions Required**:
```bash
# Apply migrations (automatic on deployment)
npm run drizzle:push

# Seed badge definitions
npm run seed:badges

# Recalculate user stats
npm run recalc
```

#### Breaking Changes
None. Fully backward compatible with v1.0.0.

---

## [1.0.0] - 2026-01-12

### 🎉 Initial Production Release

First stable production release of WekangTradingJournal. All core features implemented and tested.

**Production Deployment**: https://wekangtrading.vercel.app

#### Core Features Delivered

**Trade Management**:
- ✅ Individual trade tracking with timestamps
- ✅ Bulk trade entry (up to 100 trades per batch)
- ✅ Real-time trade entry (mobile-optimized)
- ✅ Trade list with advanced filtering
- ✅ Trade editing and deletion
- ✅ 24-hour deletion window
- ✅ Customizable page size (10/25/50/100)
- ✅ SOP types tracking (3 types: BB Mastery, W & M breakout, Engulfing Fail)
- ✅ Profit/Loss tracking in USD

**Analytics & Dashboard**:
- ✅ Daily summary auto-calculation
- ✅ Market session detection (ASIA/EUROPE/US + Overlaps)
- ✅ Dashboard with performance metrics
- ✅ Session-based analytics
- ✅ Hourly performance analysis
- ✅ Win rate trends with MA7/MA30
- ✅ Performance charts (Recharts)

**Target Management**:
- ✅ Custom target names
- ✅ Flexible target dates (past start dates allowed)
- ✅ Multiple active targets simultaneously
- ✅ Prop Firm vs Personal categories
- ✅ Differentiated status calculation
- ✅ Target progress tracking

**User Management**:
- ✅ Authentication with NextAuth.js v5
- ✅ Role-based access (USER/ADMIN)
- ✅ Invite-only registration system
- ✅ Password management
- ✅ User settings page

**Admin Features**:
- ✅ Admin dashboard with system stats
- ✅ User management (CRUD)
- ✅ Trade viewer and deletion
- ✅ User performance calendar
- ✅ Daily loss limit monitoring
- ✅ Reset count tracking
- ✅ Invite code management

**Data Management**:
- ✅ CSV import script for bulk data (admin)
- ✅ Daily summary recalculation script
- ✅ Database migration system (Drizzle ORM)
- ✅ Timezone-aware timestamps

**Technical Infrastructure**:
- ✅ Next.js 15 (App Router)
- ✅ TypeScript (full type safety)
- ✅ Turso (LibSQL) database
- ✅ Drizzle ORM (migrated from Prisma)
- ✅ Tailwind CSS + shadcn/ui
- ✅ Deployed on Vercel
- ✅ Production-ready error handling
- ✅ Mobile responsive design

#### Database Schema (v1.0.0)

**Tables**:
- `users` - User accounts (5 fields)
- `individual_trades` - Trade records (11 fields)
- `daily_summaries` - Pre-calculated aggregates (16 fields)
- `user_targets` - Performance targets (10 fields)
- `sop_types` - SOP type definitions (5 fields)
- `sessions` - NextAuth sessions (3 fields)

**Performance**:
- Individual trades: ~1,500 records
- Daily summaries: Fast dashboard loads (< 200ms)
- API response times: < 500ms

#### Migration from v0.4.0

All enhancements from v0.1.0 through v0.4.0 are included in this release:
- Custom target names
- Prop firm vs personal target categories
- Flexible target dates
- Multiple active targets
- Days remaining bug fixes
- User deletion cascade fixes
- Timezone validation fixes
- Market session type migrations
- Drizzle ORM migration (complete)

#### Known Limitations

**Not included in v1.0.0** (planned for v1.1.0):
- Trade symbol entry field
- User-initiated CSV import
- Customizable user timezone settings
- Economic news calendar

#### Deployment Notes

**Environment**: Production  
**Database**: Turso (wekangtrading-prod)  
**Hosting**: Vercel  
**Domain**: wekangtrading.vercel.app  
**Users**: 5 active traders  
**Scale**: 30 trades/day per user, 1 year retention  

#### Post-Release Actions

- [x] Production deployment successful
- [x] All core features tested
- [x] Documentation complete
- [ ] User training scheduled
- [ ] Feedback collection process established
- [ ] v1.1.0 enhancement planning initiated

---

## [0.4.0] - 2026-01-12

### Target Management Enhancements & Session Type Migration ✅

#### Feature: Custom Target Names
- **Database Schema**
  - Added `name` TEXT field to `user_targets` table
  - Migration: `0001_optimal_annihilus.sql`
  - Updated 5 existing targets with default names

- **User Interface**
  - New name input field in target creation modal
  - Required field, 1-100 characters
  - Prominent display in TargetCard component
  - Examples: "MAVEN Prop Firm Phase 1", "Q1 Personal Goal"

- **Use Cases**
  - Better organization for multiple targets
  - Clear identification of prop firm challenges
  - Custom labeling for different trading strategies

#### Feature: Prop Firm vs Personal Target Categories
- **Database Schema**
  - Added `targetCategory` ENUM field ('PROP_FIRM', 'PERSONAL')
  - Default: 'PERSONAL'
  - Migration: `0002_overconfident_whizzer.sql`

- **Differentiated Status Logic**
  - **Prop Firm (Absolute Performance)**:
    - Minimum 10 trades for statistical significance
    - On Track: current ≥ 95% of target
    - At Risk: current ≥ 85% of target OR insufficient trades
    - Behind: current < 85% of target
    - Ignores time/pace - evaluates actual results only

  - **Personal (Pace-Based Performance)**:
    - Expected progress = (daysElapsed / daysTotal) × 100
    - On Track: progress ≥ 90% of expected pace
    - At Risk: progress ≥ 70% of expected pace
    - Behind: progress < 70% of expected pace
    - Time-aware - tracks if on schedule

- **User Interface**
  - Category selector in target modal (Prop Firm / Personal)
  - Visual badges: 🏆 Purple for Prop Firm, 📊 Blue for Personal
  - Explanatory text for each category

- **Use Cases**
  - Track prop firm challenges with absolute metrics
  - Monitor personal goals with pace-based progress
  - Different evaluation criteria for different target types

#### Enhancement: Flexible Target Dates
- **Validation Changes**
  - Start date can now be in the past
  - End date must still be in the future
  - Helpful UI hints explaining the rules

- **Use Cases**
  - Track ongoing prop firm challenges (started in past)
  - Add existing targets to the system
  - Historical tracking for current challenges

#### Enhancement: Multiple Active Targets
- **Logic Changes**
  - Removed auto-deactivation of existing targets
  - Users can have unlimited active targets simultaneously
  - Each target tracked independently

- **Use Cases**
  - Track prop firm challenge + personal goal concurrently
  - Monitor multiple prop firm phases at once
  - Parallel goal tracking without conflicts

#### Bug Fix: Days Remaining Calculation (CRITICAL)
- **Issue**: Displayed "8/7" then "9/8" after first fix attempt
- **Root Cause**: Date time components causing incorrect Math.ceil rounding
- **Solution**: 
  - Normalize all dates to midnight (start of day)
  - Use Math.round instead of Math.ceil
  - Inclusive counting (both start and end dates)
- **Result**: Accurate day counting (Jan 12 → Jan 19 = 8 days)

#### Bug Fix: User Deletion Cascade (CRITICAL)
- **Issue**: Admin deleting user left orphaned data in database
- **Root Cause**: SQLite foreign key constraints not defined, no automatic cascade
- **Solution**: Implemented manual cascade deletion in correct order:
  1. individual_trades (by userId)
  2. daily_summaries (by userId)
  3. user_targets (by userId)
  4. sessions (by userId)
  5. users (by id)
- **Benefits**:
  - Clean database with no orphaned records
  - Auditability through console logging
  - User existence validation before deletion

#### Bug Fix: Dashboard Session Performance Error (CRITICAL)
- **Issue**: `TypeError: Cannot set properties of undefined (setting 'winRate')`
- **Root Cause**: `sessionBreakdown` tried to access old `OVERLAP` key from `daily_summaries`
- **Solution**: Query `individual_trades` directly instead of aggregating from `daily_summaries`
- **Result**: Dashboard loads without errors, shows current session breakdown

#### Session Type Migration Completion
- **Background**: Split `OVERLAP` session into two distinct types:
  - `ASIA_EUROPE_OVERLAP` (07:00-09:00 UTC)
  - `EUROPE_US_OVERLAP` (13:00-16:00 UTC)

- **Deployment Fixes** (Multiple Files Updated):
  - `dailySummaryService.ts`: Calculate both overlap types, sum for DB compatibility
  - `exportService.ts`: Updated filters, stats calculation, PDF template
  - `statsService.ts`: Updated MarketSession type definition
  - `individualTradeService.ts`: Updated filter interfaces
  - `app/api/trades/individual/route.ts`: Updated type casts
  - `app/api/export/pdf/route.ts`: Updated type casts
  - `app/api/export/csv/route.ts`: Updated type casts

- **PDF Export Enhancement**:
  - Now shows both overlap sessions separately
  - 🔄 Asia-Europe Overlap
  - 🔄 Europe-US Overlap

#### Code Cleanup
- **Removed Debug Logs**
  - Cleaned up 6 debug console.log statements in `targetService.ts`
  - Kept error logging in try-catch blocks
  - Production-ready logging practices

#### Files Changed
- **Database Schema**: 2 migrations applied to production
- **Services**: 6 files updated (target, summary, export, stats, trade, user management)
- **API Routes**: 4 files updated (targets, trades, export endpoints)
- **Components**: 2 files updated (TargetModal, TargetCard)
- **Validation**: Updated target validation schemas

#### Deployment
- **Total Commits**: 27 commits pushed to production
- **Build Status**: ✅ Successful
- **Production URL**: https://wekangtrading.vercel.app
- **Database**: libsql://wekangtrading-prod-thewekang.aws-eu-west-1.turso.io

---

## [0.3.0] - 2026-01-10

### Phase 5B (Phases 1-3) Complete - Security & User Management ✅

#### Enhancement: Reset Count Tracking
- **Database Schema**
  - Added `resetCount` field to `users` table (default: 0)
  - Migration: `20260110042500_add_reset_count_to_users`

- **Admin Users Page Enhancement**
  - New "Resets" column showing how many times user has reset account
  - Color-coded display: gray (0x), orange (1x+)
  - Sortable by reset count (ascending/descending)
  - Right-aligned with other numeric metrics

- **Service Layer Update**
  - `resetUserAccount()` now increments resetCount in transaction
  - Ensures atomic operation (deletion + count increment)
  - No partial updates possible

- **API Update**
  - `GET /api/admin/users` includes resetCount in response
  - Format: `{ userId, userName, ..., resetCount: 2 }`

- **Use Cases**
  - Monitor user behavior and identify users needing coaching
  - Track reset feature usage patterns
  - Data quality assurance during troubleshooting
  - Performance analysis correlation

#### Phase 1: Invite-Only Registration ✅
- **Database Schema**
  - Added `invite_codes` table with unique 8-character codes
  - Added `inviteCodeId` field to `users` table
  - Migration: `20260110024702_add_invite_codes`

- **Invite Code Service** (`lib/services/inviteCodeService.ts`)
  - Generate unique invite codes (8 chars, alphanumeric)
  - Validate codes (active status, expiration, usage limits)
  - Track usage counts and related users
  - Deactivate and delete operations

- **API Endpoints**
  - `GET /api/admin/invite-codes` - List all codes with usage stats
  - `POST /api/admin/invite-codes` - Create new invite code
  - `DELETE /api/admin/invite-codes/[id]` - Deactivate/delete code
  - `POST /api/auth/register` - Updated to require invite code

- **Admin UI** (`/admin/invite-codes`)
  - Statistics cards (total, available, used, inactive codes)
  - Create invite code modal (max uses, expiration)
  - Code list with copy-to-clipboard
  - Usage tracking per code
  - Status badges and action buttons

- **Registration Update** (`/register`)
  - Added invite code input field
  - Uppercase transformation
  - Validation on submit
  - Helper text for users

#### Phase 2: Admin User & Trade Management ✅
- **User Management Service** (`lib/services/userManagementService.ts`)
  - Create user without invite code requirement
  - Update user details (name, email, role)
  - Delete user with cascade (prevents self-deletion and last admin deletion)
  - Reset password (generates 10-char temporary password)
  - Get user with statistics (trades, win rate, SOP rate, P&L)

- **User Management API Endpoints**
  - `POST /api/admin/users/create` - Create user directly
  - `GET /api/admin/users/[id]` - Get user details with stats
  - `PATCH /api/admin/users/[id]` - Update user
  - `DELETE /api/admin/users/[id]` - Delete user with safety checks
  - `POST /api/admin/users/[id]/reset-password` - Generate temp password

- **Trade Management API Endpoints**
  - `GET /api/admin/trades` - List all trades across all users
    - Filters: userId, result, session, dateFrom, dateTo, search
    - Pagination: 50 per page default
    - Returns: Trades with user details and pagination metadata
  - `DELETE /api/admin/trades/[id]` - Delete any trade (admin override)
    - Auto-updates daily summary

- **Enhanced Admin Users Page** (`/admin/users`)
  - Create user modal (name, email, password, role)
  - Edit user modal (update name, email, role)
  - Delete confirmation dialog with data summary
  - Reset password action with temp password display
  - Copy to clipboard functionality
  - Search by name/email
  - Sort by any column (name, email, trades, win rate, SOP rate, P&L)
  - Success/error toast notifications

- **New Admin Trades Page** (`/admin/trades`)
  - View all trades from all users in one table
  - Comprehensive filters:
    - User dropdown
    - Result (WIN/LOSS)
    - Session (ASIA/EUROPE/US/OVERLAP)
    - Date range (from/to)
    - Search (name, email, notes)
  - Reset filters button
  - Delete trade with confirmation
  - Pagination (50 per page)
  - Trade count display
  - Formatted timestamps
  - Color-coded badges (session, result, SOP)

- **Navigation Updates**
  - Added "Trades" link to admin menu
  - Order: Overview → Users → Trades → Invite Codes

#### Business Rules Implemented
- Invite codes required for public registration
- Admins can create users without invite codes
- Admins cannot delete themselves (prevents lockout)
- Cannot delete last admin (minimum 1 admin required)
- Email uniqueness enforced across all creation/update operations
- Trade deletion updates daily summary automatically
- Temporary passwords are random 10-character strings

#### Phase 3: User Self-Service Features ✅
- **User Settings Service** (`lib/services/userSettingsService.ts`)
  - Change password with current password verification
  - Reset account data (delete all trades/summaries/targets)
  - Get account summary for confirmation

- **Password Change Feature**
  - API: `PATCH /api/users/me/password`
  - Validates current password with bcrypt
  - Checks new password ≥8 chars and different from current
  - Updates passwordHash securely
  - Returns detailed error codes (INVALID_PASSWORD, SAME_PASSWORD)

- **Account Reset Feature**
  - API: `GET /api/users/me/reset` - Get account data summary
  - API: `POST /api/users/me/reset` - Perform reset with confirmation
  - Requires exact phrase: "RESET MY ACCOUNT"
  - Deletes: All trades, daily summaries, targets
  - Preserves: User account, login credentials
  - Uses Prisma transaction for atomicity
  - Shows data counts before deletion

- **24-Hour Trade Deletion Window**
  - Updated `deleteTrade()` in `individualTradeService.ts`
  - Regular users: Can only delete trades <24 hours old
  - Admin users: Can delete any trade (override)
  - Time calculated from `trade.createdAt` timestamp
  - Error message for expired deletion window

- **Settings Page UI** (`/settings`)
  - Profile information display (read-only)
  - Password change form with validation
  - Danger Zone with account reset
  - Confirmation modal with typed phrase requirement
  - Toast notifications for all actions
  - Mobile-responsive design
  - Added to user navigation menu

- **User Info API**
  - `GET /api/users/me` - Returns current user's name, email, role
  - Used by settings page to display profile
  - Server-side authentication with auth() function

#### Security & Data Integrity
- Bcrypt password hashing for change password feature
- Current password verification required
- Confirmation phrases for destructive actions
- Transaction-based account reset (prevents partial deletions)
- 24-hour window prevents historical data manipulation
- Admin override for data corrections

#### Business Rules Implemented
- Invite codes required for public registration
- Admins can create users without invite codes
- Admins cannot delete themselves (prevents lockout)
- Cannot delete last admin (minimum 1 admin required)
- Email uniqueness enforced across all creation/update operations
- Trade deletion updates daily summary automatically
- Temporary passwords are random 10-character strings

#### Security Enhancements
- Invite-only registration prevents spam
- Admin-only endpoints protected by role check
- Password reset requires admin action
- User deletion requires confirmation
- Trade deletion requires admin role

## [0.2.0] - 2026-01-09

### Phase 2 Complete - Individual Trade Features ✅

#### Added
- **Real-Time Trade Entry Form**
  - Mobile-optimized with 60px touch buttons
  - Datetime-local picker with auto-set timestamp
  - Simplified amount entry (always positive, auto-calculated based on WIN/LOSS)
  - SOP compliance radio buttons with proper boolean validation
  - Auto-reset form after submission with new timestamp
  - Clear error messages and success feedback

- **Trade List with Filters**
  - Server-side initial data loading
  - Client-side interactive filters (date range, result, session, SOP)
  - Dynamic summary statistics (win rate, SOP rate, net P/L)
  - Real-time filtering via API calls
  - Mobile-responsive layout

- **Pagination System**
  - Previous/Next buttons with page indicator
  - Customizable page size (10/25/50/100 trades per page)
  - localStorage persistence for page size preference
  - Pagination resets on filter changes
  - Disabled state handling during loading

- **Bulk Trade Entry**
  - Spreadsheet-style interface for end-of-day entry
  - Dynamic rows (add/remove up to 100 trades)
  - Inline validation with real-time error display
  - Auto-calculation of profit/loss based on result
  - Empty row filtering (only submits rows with time entered)
  - Batch submission with comprehensive validation

- **Backend Services**
  - `individualTradeService.ts` - CRUD operations with pagination support
  - `dailySummaryService.ts` - Auto-update triggers on trade changes
  - Market session calculator (ASIA/EUROPE/US/OVERLAP from UTC hour)
  - Pagination metadata (page, pageSize, totalCount, totalPages)

- **API Endpoints**
  - `POST /api/trades/individual` - Create single trade
  - `GET /api/trades/individual` - List trades with filters & pagination
  - `POST /api/trades/bulk` - Create multiple trades
  - All endpoints authenticated with NextAuth
  - Comprehensive error handling with status codes

#### Fixed
- TypeScript type mismatch in form validation (split schemas)
- SOP radio button boolean conversion with Controller
- DateTime format handling for datetime-local input
- Hydration warnings from Date() in defaultValues
- Bulk entry validation error (missing tradeDate in payload)

#### Technical Details
- Created `individualTradeSchema` for forms (accepts Date objects)
- Created `individualTradeApiSchema` for APIs (transforms string → Date)
- Used react-hook-form Controller for complex field handling
- Implemented localStorage for user preferences
- Added formatDateForInput() helper for datetime-local compatibility

---

## [0.1.0] - 2026-01-08

### Phase 1 Complete - Authentication System ✅

#### Added
- **User Authentication**
  - NextAuth.js v5 with Credentials provider
  - Bcrypt password hashing (min 8 characters)
  - Database sessions (stored in SQLite)
  - Role-based access control (USER/ADMIN)

- **Auth Pages**
  - Login page with email/password
  - Register page with name/email/password/confirm
  - Protected routes with middleware
  - Auto-redirect for unauthenticated users

- **Database Schema**
  - Users table with role field
  - Sessions table for NextAuth
  - Accounts table for future OAuth
  - Proper indexes and relationships

- **UI Components**
  - shadcn/ui components (Button, Input, Label)
  - Tailwind CSS with custom configuration
  - Mobile-responsive design
  - Form validation with error messages

---

## Project Initialization

### Initial Setup
- Next.js 15 with App Router
- TypeScript configuration
- Prisma with Turso (SQLite)
- Tailwind CSS + shadcn/ui
- NextAuth.js v5
- react-hook-form + Zod validation

### Repository Structure
```
app/
├── (auth)/        # Authentication pages
├── (user)/        # User pages
├── (admin)/       # Admin pages (future)
└── api/           # API endpoints

components/
├── ui/            # shadcn/ui components
├── forms/         # Form components
└── dashboard/     # Dashboard components (future)

lib/
├── auth.ts        # NextAuth config
├── db.ts          # Prisma client
├── constants.ts   # Constants
├── types.ts       # TypeScript types
├── validations.ts # Zod schemas
├── services/      # Business logic
└── utils/         # Utility functions

prisma/
├── schema.prisma  # Database schema
└── migrations/    # Migration history
```

---

## Next Steps - Phase 3

### Planned Features
1. **Dashboard Statistics**
   - Real trade data from daily_summaries
   - Win rate, SOP rate, net P/L
   - Best performing session
   - Monthly/weekly trends

2. **Session Performance Charts** (Recharts)
   - Win rate by session (ASIA/EUROPE/US/OVERLAP)
   - Total trades per session
   - Profit/loss breakdown

3. **Hourly Performance Heatmap**
   - Best trading hours identification
   - Win rate by hour of day
   - Visual heat map for quick insights

4. **Target Tracking**
   - Set weekly/monthly targets
   - Progress visualization
   - Achievement tracking

---

**Last Updated**: January 9, 2026  
**Current Version**: 0.2.0
