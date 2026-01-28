# Feature 5: SOP Details & Mobile Responsiveness Enhancement

**Feature ID**: FEAT-005  
**Version**: 1.0  
**Status**: 🟡 Planning  
**Priority**: HIGH  
**Target Release**: v1.3.0  
**Created**: January 25, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Current State Analysis](#current-state-analysis)
3. [Feature 1: SOP Details System](#feature-1-sop-details-system)
4. [Feature 2: Mobile Responsiveness](#feature-2-mobile-responsiveness)
5. [Technical Architecture](#technical-architecture)
6. [Implementation Plan](#implementation-plan)
7. [Testing Strategy](#testing-strategy)

---

## Overview

### Business Objectives

**Feature 1: Trading Strategy/SOP Detail System**
- Enable admin to document detailed trading strategies for each SOP type
- Allow admin to control which SOP details are visible to users
- Provide users with a reference library of approved trading strategies
- Support rich text formatting for comprehensive strategy documentation

**Feature 2: Mobile Responsiveness Enhancement**
- Improve usability on mobile devices (phones and tablets)
- Optimize touch interactions and form inputs
- Ensure all features are accessible on smaller screens
- Enhance mobile-first user experience

### Success Criteria

**SOP Details**:
- ✅ Admin can add/edit rich text details for SOP types
- ✅ Admin can toggle visibility of SOP details to users
- ✅ Users can view formatted SOP details in dedicated page
- ✅ Details support images, lists, code blocks, formatting

**Mobile Responsiveness**:
- ✅ All pages render correctly on 375px width (iPhone SE)
- ✅ Touch targets meet 44px minimum size
- ✅ Forms are easy to use on mobile
- ✅ Tables adapt to mobile (cards or horizontal scroll)
- ✅ Charts are readable on small screens

---

## Current State Analysis

### Existing SOP Type Implementation

**Database Schema** (`lib/db/schema/sopTypes.ts`):
```typescript
export const sopTypes = sqliteTable('sop_types', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),      // Short description
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});
```

**Current Features**:
- ✅ Admin can create/edit/delete SOP types
- ✅ Admin can activate/deactivate SOP types
- ✅ Short description field (plain text, max ~200 chars)
- ✅ Sort order for dropdown display
- ✅ Used in trade entry forms (real-time, bulk, CSV import)

**Current Pages**:
- Admin: `/admin/sop-types` - Management page
- API: `/api/admin/sop-types` - CRUD endpoints
- API: `/api/sop-types` - Public list endpoint (active only)

**Current Limitations**:
- ❌ No detailed strategy documentation
- ❌ No user-facing reference page
- ❌ No visibility control (all active types visible)
- ❌ No rich text formatting support
- ❌ Description field is too short for comprehensive strategies

### Current Mobile Responsiveness

**Existing Responsive Patterns**:
```tsx
// Grid layouts adapt to mobile
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

// Flex layouts stack on mobile
<div className="flex flex-col sm:flex-row">

// Tables with horizontal scroll (TradesList.tsx)
<div className="overflow-x-auto">

// Touch-friendly buttons
<Button className="min-h-[44px]">
```

**Pages with Good Mobile Support**:
- ✅ Dashboard - Responsive grid layouts
- ✅ Trade entry forms - Stack on mobile
- ✅ Achievements - Grid adapts
- ✅ Calendar - Responsive navigation

**Pages Needing Improvement**:
- ⚠️ Admin tables - Too wide on mobile
- ⚠️ Trades list - Horizontal scroll could be better
- ⚠️ Analytics charts - Some labels cut off
- ⚠️ Settings page - Long forms on mobile
- ⚠️ Bulk trade entry - Table input difficult on mobile

---

## Feature 1: SOP Details System

### 1.1 Database Schema Changes

**New Field in `sopTypes` Table**:
```typescript
export const sopTypes = sqliteTable('sop_types', {
  // ... existing fields
  
  // NEW FIELDS
  detailContent: text('detail_content'),           // Rich text content (HTML or Markdown)
  detailEnabled: integer('detail_enabled', { mode: 'boolean' }).default(false),  // Show in user page
  detailUpdatedAt: integer('detail_updated_at', { mode: 'timestamp' }),
  detailUpdatedBy: text('detail_updated_by').references(() => users.id),
});
```

**Migration Required**: Yes - Add 4 new columns to `sop_types` table

### 1.2 Rich Text Editor Choice

**Recommendation: Tiptap Editor**

**Why Tiptap?**
- ✅ Modern, extensible, React-friendly
- ✅ Headless (custom UI control)
- ✅ Markdown support
- ✅ Good TypeScript support
- ✅ Lightweight compared to alternatives
- ✅ Free for most use cases

**Alternative Considered: React Quill**
- ❌ Older technology (Quill.js)
- ❌ jQuery dependency (not ideal for Next.js)
- ✅ More mature, stable

**Decision**: Use **Tiptap** for modern, flexible editor

**Features to Enable**:
- Bold, italic, underline, strikethrough
- Headings (H2, H3, H4)
- Bullet lists, ordered lists
- Code blocks (for trading rules)
- Links
- **Images (REQUIRED)** - Chart examples, pattern diagrams
  - Upload via Tiptap image extension
  - Store in Vercel Blob Storage or convert to base64 (small images)
- Blockquotes (for important notes)
- Horizontal rules (dividers)

**Storage Format**: HTML (sanitized)

**Template Structure** (suggested format for consistency):
Based on user sketch, each SOP should follow this structure:
```
[SOP Name with Chart Image]

Entry Condition:
- [Conditions for entry]

SL (Stop Loss):
- [Stop loss rules]

TP (Take Profit):
- [Take profit targets]

Instrument:
- [Recommended pairs/instruments]

Remarks:
- [Additional notes, warnings, tips]
```

Admin can use rich text editor with this template pre-filled, or create their own structure.

### 1.3 Admin UI Enhancements

**Admin SOP Types Page** (`/admin/sop-types`):

**Current Layout**:
```
[Name] [Description] [Sort Order] [Status] [Actions]
```

**Enhanced Layout**:
```
[Name] [Description] [Sort Order] [Status] [Detail Status] [Actions]
       
Actions expanded:
- Edit → Opens modal with tabs: [Basic Info] [Details & Formatting]
- Toggle Active
- Delete
```

**New "Edit SOP Details" Modal**:

**Tab 1: Basic Info** (existing):
- Name
- Short description (for dropdown)
- Sort order
- Active status

**Tab 2: Details & Formatting** (NEW):
- Detail enabled toggle
  - Label: "Show detailed strategy guide to users"
  - Sublabel: "When enabled, users can view this strategy in their reference library"
- Rich text editor (Tiptap)
  - Toolbar: Bold, Italic, Headings, Lists, Code, Link, **Image Upload**
  - Image upload button with file picker
  - Image size limit indicator (max 500KB recommended)
  - Character count indicator
  - Preview button
- Template helper button
  - "Insert Template" - Pre-fills structured format:
    ```
    Entry Condition:
    
    SL:
    
    TP:
    
    Instrument:
    
    Remarks:
    ``` (Based on user sketch):
```
┌─────────────────────────────────────────┐
│  📚 Trading Strategies Reference        │
│  Your approved SOP strategies           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Search: [                    ] 🔍       │
│ Active Strategies: 5                    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 📌 Engulfing Fail                                  ↓│
│ Bearish engulfing pattern reversal strategy        │
└─────────────────────────────────────────────────────┘
  [Expanded view:]
  ┌───────────────────┬─────────────────────────────┐
  │ [Chart Image]     │ Entry Condition:            │
  │                   │ • [Formatted conditions]    │
  │ (Supports paste/  │                             │
  │  upload photos)   │ SL: [Stop loss rules]       │
  │                   │                             │
  │                   │ TP: [Take profit targets]   │
  │                   │                             │
  │                   │ Instrument: [Pairs/Assets]  │
  │                   │                             │
  │                   │ Remarks: [Additional notes] │
  └───────────────────┴─────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 📌 W & M Breakout                                  ↓│
│ Price action breakout pattern trading               │
└─────────────────────────────────────────────────────┘
  [Detailed content - collapsed by default]
```

**Image Display**:
- Desktop: Side-by-side layout (image left, details right)
- Mobile: Stacked layout (image top, details below)
- Click image to view full-screen
- Support multiple images per strategyearch: [                    ] 🔍       │
│ Active Strategies: 5                    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 📌 BB Mastery                          ↓│
│ Bollinger Bands mean reversion strategy │
└─────────────────────────────────────────┘
  [Detailed content - collapsed by default]

┌─────────────────────────────────────────┐
│ 📌 W & M Breakout                      ↓│
│ Price action breakout pattern trading   │
└─────────────────────────────────────────┘
  [Detailed content - collapsed by default]
```

**Features**:
- Accordion/collapsible layout
- Search/filter by name
- Last updated date
- Print-friendly view
- Mobile-optimized reading experience
- Link from trade entry forms
  - "📚 View Strategy Guide" link near SOP type dropdown

**Empty State**:
- "No strategies available yet"
- "Your admin hasn't published strategy guides"
- Icon: 📖

### 1.5 API Endpoints

**Existing Endpoints** (no changes needed):
- `GET /api/admin/sop-types` - List all (admin)
- `POST /api/admin/sop-types` - Create (admin)
- `GET /api/sop-types` - List active (users)

**Enhanced Endpoints**:
- `PATCH /api/admin/sop-types/[id]` - Update
  - Accept new fields: `detailContent`, `detailEnabled`
  - Sanitize HTML content
  - Track `detailUpdatedBy`
  
**New Endpoints**:
- `GET /api/sop-types/with-details` - List active with details (users)
  - Only returns types where `detailEnabled = true`
  - Excludes internal admin fields
  - Response:
    ```json
    {
      "success": true,
      "data": [
        {
          "id": "uuid",
          "name": "BB Mastery",
          "description": "Short description",
          "detailContent": "<h2>Overview</h2><p>...</p>",
          "detailUpdatedAt": "2026-01-25T10:00:00Z"
        }
      ]
    }
    ```

---

## Feature 2: Mobile Responsiveness

### 2.1 Responsive Breakpoints

**Current Tailwind Breakpoints** (already configured):
```javascript
sm: '640px'   // Small tablets
md: '768px'   // Tablets
lg: '1024px'  // Desktops
xl: '1280px'  // Large desktops
```

**Target Devices**:
- 📱 iPhone SE: 375px width
- 📱 iPhone 12/13/14: 390px width
- 📱 Android phones: 360px - 412px
- 📱 Tablets: 768px - 1024px

**Touch Target Sizes** (WCAG AAA):
- Minimum: 44px × 44px
- Preferred: 48px × 48px
- Spacing: 8px between targets

### 2.2 Component Enhancements

#### 2.2.1 Tables (High Priority)

**Current Issue**: Tables overflow on mobile, require horizontal scroll

**Solution Options**:

**Option A: Card View on Mobile** (Recommended)
```tsx
// Desktop: Table
// Mobile: Card list

<div className="hidden md:block">
  <table>...</table>
</div>

<div className="md:hidden">
  {items.map(item => (
    <Card>
      <div className="p-4">
        <div className="font-bold">{item.name}</div>
        <div className="text-sm text-gray-600">{item.date}</div>
        {/* Key info displayed vertically */}
      </div>
    </Card>
  ))}
</div>
```

**Option B: Horizontal Scroll with Sticky Column**
```tsx
<div className="overflow-x-auto">
  <table className="min-w-[640px]">
    <thead>
      <tr>
        <th className="sticky left-0 bg-white z-10">Date</th>
        {/* Other columns scroll */}
      </tr>
    </thead>
  </table>
</div>
```

**Apply to**:
- `/trades` - TradesList table
- `/admin/users` - User management table
- `/admin/sop-types` - SOP types table

#### 2.2.2 Forms

**Current Good Practices**:
- ✅ Labels above inputs
- ✅ Full-width inputs on mobile
- ✅ Touch-friendly buttons (44px min)

**Enhancements Needed**:

**Bulk Trade Entry Form**:
```tsx
// Current: Table-style input (difficult on mobile)
// Enhanced: Add mobile-specific card input

// Desktop (md+): Keep table layout
// Mobile (<md): Card-based input with vertical layout

<div className="hidden md:block">
  {/* Current table layout */}
</div>

<div className="md:hidden">
  {rows.map((row, index) => (
    <Card className="p-4 mb-4">
      <div className="space-y-3">
        <Label>Time</Label>
        <Input type="time" {...} />
        <Label>Result</Label>
        <Select {...} />
        {/* All fields stacked vertically */}
      </div>
    </Card>
  ))}
</div>
```

**Settings Page**:
- Current: Long single form
- Enhanced: Accordion sections for mobile
  - Profile, Password, Timezone, Preferences collapse individually

#### 2.2.3 Charts

**Current Issues**:
- Some axis labels cut off on mobile
- Touch interactions not optimized
- Legend can overflow

**Enhancements**:
```tsx
// Responsive height
<ResponsiveContainer 
  width="100%" 
  height={isMobile ? 250 : 350}
>

// Rotate X-axis labels on mobile
<XAxis 
  angle={isMobile ? -45 : 0}
  height={isMobile ? 70 : 30}
/>

// Simplified legend on mobile
<Legend 
  layout={isMobile ? "horizontal" : "vertical"}
  verticalAlign={isMobile ? "bottom" : "middle"}
/>
```

**Apply to**:
- SessionComparisonChart
- HourlyHeatmap
- MonthlyAnalyticsChart
- All Recharts components

#### 2.2.4 Navigation

**Current Mobile Nav**: Hamburger menu (already good)

**Enhancements**:
- Bottom navigation bar for key actions on mobile
  - Dashboard, New Trade, Trades, Profile
- Sticky header with back button on subpages

#### 2.2.5 Modals

**Current**: Full-screen modals work well on desktop

**Enhancement**:
```tsx
// Mobile: Full-screen with slide animation
// Desktop: Centered with backdrop

<Dialog>
  <DialogContent className="
    sm:max-w-[600px]           // Desktop: Fixed width
    max-h-[90vh]               // Desktop: Max height
    
    h-full w-full              // Mobile: Full screen
    sm:h-auto sm:w-auto        // Desktop: Auto size
    
    sm:rounded-lg              // Desktop: Rounded
    rounded-none               // Mobile: Sharp edges
  ">
```

### 2.3 Mobile-Specific Utilities

**New Utility Hook** (`lib/hooks/useMediaQuery.ts`):
```typescript
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);
  
  return matches;
}

// Usage:
const isMobile = useMediaQuery('(max-width: 768px)');
```

**New Utility Hook** (`lib/hooks/useIsMobile.ts`):
```typescript
export function useIsMobile() {
  return useMediaQuery('(max-width: 768px)');
}
```

### 2.4 Testing Matrix

**Devices to Test**:
- [ ] iPhone SE (375px) - Safari
- [ ] iPhone 12/13/14 (390px) - Safari
- [ ] Samsung Galaxy S21 (412px) - Chrome
- [ ] iPad Mini (768px) - Safari
- [ ] iPad Pro (1024px) - Safari
- [ ] Desktop (1920px) - Chrome, Firefox

**Pages to Test**:
- [ ] Dashboard
- [ ] Trades list
- [ ] Trade entry (real-time, bulk, CSV)
- [ ] Analytics pages
- [ ] Settings
- [ ] Admin pages (if accessible)

**Interactions to Test**:
- [ ] Button taps (44px target met)
- [ ] Form inputs (keyboard doesn't overlap)
- [ ] Dropdown selects
- [ ] Modal interactions
- [ ] Table scrolling
- [ ] Chart touch interactions

---

## Technical Architecture

### 3.1 Technology Stack Additions

**Rich Text Editor**:
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image
```

**HTML Sanitization** (security):
```bash
npm install dompurify
npm install --save-dev @types/dompurify
```

**Image Storage Options**:

**Option A: Vercel Blob Storage** (Recommended)
```bash
npm install @vercel/blob
```
- Pros: Native Vercel integration, CDN, automatic optimization
- Cons: Paid service (free tier: 100GB bandwidth/month)
- Best for: Production deployment

**Option B: Base64 Encoding** (Alternative)
- Pros: No external service, simple implementation
- Cons: Increases database size, slower loading for large images
- Best for: Small images (<100KB), local testing
- Limit: Max 500KB per image

**Decision**: Use **Option B (Base64)** for MVP, migrate to Vercel Blob later if needed
- Simpler implementation for local testing
- No additional service dependencies
- Sufficient for chart screenshots (typically 50-200KB)

**Optional - Mobile Detection** (if needed):
```bash
npm install react-device-detect
```

### 3.2 File Structure Changes

**New Files**:
```
components/
├── editors/
│   ├── TiptapEditor.tsx               # Rich text editor component
│   └── TiptapReadOnly.tsx             # Read-only formatted display
├── sop/
│   ├── SopStrategyCard.tsx            # Collapsible strategy card
│   ├── SopStrategyList.tsx            # List view with search
│   └── SopDetailModal.tsx             # Full-screen detail view (mobile)
└── mobile/
    ├── MobileTableCard.tsx            # Generic table→card converter
    └── MobileBulkTradeInput.tsx       # Mobile bulk entry

app/(user)/
├── strategies/
│   └── page.tsx                       # User strategy reference page

lib/
├── hooks/
│   ├── useMediaQuery.ts               # Media query hook
│   └── useIsMobile.ts                 # Mobile detection hook
└── services/
    └── sopDetailService.ts            # SOP detail CRUD operations

drizzle/
└── migrations/
    └── 0XXX_add_sop_details.sql       # Database migration
```

**Modified Files**:
```
lib/db/schema/sopTypes.ts              # Add new columns
app/(admin)/admin/sop-types/page.tsx   # Enhanced admin UI
app/api/admin/sop-types/[id]/route.ts  # Handle detail fields
app/api/sop-types/route.ts             # Add with-details endpoint
components/TradesList.tsx              # Mobile card view
components/forms/BulkTradeEntryForm.tsx # Mobile input
components/charts/*.tsx                # Mobile responsiveness
```

### 3.3 Database Migration

**Migration File**: `0XXX_add_sop_details.sql`
```sql
-- Add SOP detail fields
ALTER TABLE sop_types ADD COLUMN detail_content TEXT;
ALTER TABLE sop_types ADD COLUMN detail_enabled INTEGER DEFAULT 0;
ALTER TABLE sop_types ADD COLUMN detail_updated_at INTEGER;
ALTER TABLE sop_types ADD COLUMN detail_updated_by TEXT REFERENCES users(id);

-- Create index for faster queries
CREATE INDEX sop_types_detail_enabled_idx ON sop_types(detail_enabled) WHERE detail_enabled = 1;
```

**Apply with**:
```bash
npm run drizzle:generate
npm run drizzle:push
```

---
3-4 hours)

**Tasks**:
1. ✅ Install Tiptap packages (including image extension)
2. ✅ Create `TiptapEditor.tsx` component
3. ✅ Configure toolbar and extensions
4. ✅ **Implement image upload handler**
   - File picker for image upload
   - Image size validation (max 500KB)
   - Convert to base64 for storage
   - Show upload progress
5. ✅ Add "Insert Template" button
   - Pre-fills structured format (Entry Condition, SL, TP, etc.)
6. ✅ Create `TiptapReadOnly.tsx` for display
7. ✅ Add styling for editor and images
8. ✅ Test editor functionality with images

**Deliverables**:
- Working rich text editor component
- Image upload/paste working
- Template insertion working
- Preview rendering correctly (including images)
- Sanitization working

### Phase 3: Admin UI Enhancement (3-4 hours)

**Tasks**:
1. ✅ Update admin SOP types page
2. ✅ Add "Detail Status" column
3. ✅ Create tabbed edit modal
4. ✅ Integrate Tiptap editor in Tab 2
5. ✅ Add toggle for detail visibility
6. ✅ Update API calls
7. ✅ Test admin workflow

**Deliverables**:
- Admin can edit SOP details
- Toggle visibility working
- Changes saved to database

### Phase 4: User Strategy Page (2-3 hours)
- API endpoints tested and working
- Type definitions updated

### Phase 2: Rich Text Editor (2-3 hours)

**Tasks**:
1. ✅ Install Tiptap packages
2. ✅ Create `TiptapEditor.tsx` component
3. ✅ Configure toolbar and extensions
4. ✅ Create `TiptapReadOnly.tsx` for display
5. ✅ Add styling for editor
6. ✅ Test editor functionality

**Deliverables**:
- Working rich text editor component
- Preview rendering correctly
- Sanitization working

### Phase 3: Admin UI Enhancement (3-4 hours)

**Tasks**:
1. ✅ Update admin SOP types page
2. ✅ Add "Detail Status" column
3. ✅ Create tabbed edit modal
4. ✅ Integrate Tiptap editor in Tab 2
5. ✅ Add toggle for detail visibility
6. ✅ Update API calls
7. ✅ Test admin workflow

**Deliverables**:
- Admin can edit SOP details
- Toggle visibility working
- Changes saved to database

### Phase 4: User Strategy Page (2-3 hours)

**Tasks**:
1. ✅ Create `/strategies` page
2. ✅ Fetch SOP types with details
3. ✅ Create collapsible card components
4. ✅ Add search/filter functionality
5. ✅ Render sanitized HTML
6. ✅ Add links from trade forms
7. ✅ Test user experience

**Deliverables**:
- User can view strategy guides
- Collapsible cards working
- Formatted content displays correctly

### Phase 5: Mobile Responsiveness (4-6 hours)

**Tasks**:
1. ✅ Create mobile utility hooks
2. ✅ Update TradesList with card view
3. ✅ Enhance BulkTradeEntry for mobile
4. ✅ Optimize charts for mobile
5. ✅ Update modals for mobile
6. ✅ Test on multiple devices
7. ✅ Fix any layout issues

**Deliverables**:
- All pages mobile-friendly
- Touch targets meet 44px minimum
- Tables work on mobile
- Forms easy to use on mobile

### Phase 6: Testing & Polish (2-3 hours)

**Tasks**:
1. ✅ Test on physical devices
2. ✅ Fix any bugs found
3. ✅ Performance optimization
4. ✅ Update documentation7-24 hours (2-3 days)
- Image upload support adds ~2 hours to Phase 2
- Template structure adds ~1 hour to Phase 3
5. ✅ Create testing guide
6. ✅ Prepare for deployment

**Deliverables**:
- All features tested on mobile
- Documentation updated
- Ready for production

**Total Estimated Time**: 15-22 hours (2-3 days)

---

## Testing Strategy

### 7.1 Unit Tests

**API Endpoints**:
- Test SOP detail CRUD operations
- Test HTML sanitization
- Test visibility toggle logic

**Components**:
- Test TiptapEditor saves content
- Test read-only rendering
- Test mobile hooks

### 7.2 Integration Tests

**Admin Workflow**:
- Create SOP type with details
- Edit existing details
- Toggle visibility
- Verify database updates

**User Workflow**:
- View strategy list
- Expand/collapse details
- Search strategies
- Navigate from trade forms

### 7.3 Mobile Testing

**Manual Testing**:
- Test on real devices (iPhone, Android)
- Test landscape orientation
- Test different screen sizes
- Test touch interactions

**Responsive Testing Tools**:
- Chrome DevTools device emulation
- Firefox Responsive Design Mode
- BrowserStack (if available)

### 7.4 Acceptance Criteria

**SOP Details**:
- [ ] Admin can add rich text content
- [ ] Formatting renders correctly
- [ ] HTML is sanitized (no XSS)
- [ ] Users see only enabled details
- [ ] Search/filter works
- [ ] Links from trade forms work

**Mobile Responsiveness**:
- [ ] All pages render on 375px width
- [ ] Touch targets ≥ 44px
- [ ] Forms usable on mobile
- [ ] Tables adapt to mobile
- [ ] Charts readable on mobile
- [ ] No horizontal overflow

---

## Documentation Updates

**Files to Update**:
1. `docs/03-DATABASE-SCHEMA.md` - Add SOP detail fields
2. `docs/04-API-SPECIFICATION.md` - Document new endpoints
3. `docs/07-ENHANCED-FEATURES.md` - Add SOP details feature
4. `CHANGELOG.md` - Document v1.3.0 changes
5. `README.md` - Update features list

---

## Deployment Plan

### Local Testing First
```bash
# 1. Create feature branch
git checkout -b feature/sop-details-mobile

# 2. Apply migrations
npm run drizzle:generate
npm run drizzle:push

# 3. Install dependencies
npm install

# 4. Test locally
npm run dev
# Test on localhost:3000

# 5. Build test
npm run build
npm run start
```

### Staging Deployment
```bash
# 1. Push to staging branch
git push origin feature/sop-details-mobile

# 2. Vercel preview deployment
# (automatic on push)

# 3. Test on Vercel preview URL
# Apply production database migrations if needed
```

### Production Deployment
```bash
# 1. Merge to main via PR
# 2. Apply production migrations
# 3. Vercel auto-deploys
# 4. Monitor for issues
```

---

## Risk Assessment

**Potential Risks**:

1. **HTML Sanitization Failure** (HIGH)
   - Risk: XSS vulnerability if HTML not properly sanitized
   - Mitigation: Use DOMPurify, test with malicious inputs

2. **Mobile Layout Breaking** (MEDIUM)
   - Risk: Existing layouts break on mobile
   - Mitigation: Test thoroughly, use mobile-first approach

3. **Migration Issues** (MEDIUM)
   - Risk: Migration fails in production
   - Mitigation: Test migration on staging, backup database

4. **Performance Impact** (LOW)
   - Risk: Rich text editor slows down page
   - Mitigation: Lazy load editor, optimize bundle

5. **Browser Compatibility** (LOW)
   - Risk: Editor doesn't work on older browsers
   - Mitigation: Test on Safari, Chrome, Firefox

---

## Success Metrics

**Post-Launch Metrics** (after 1 week):
- [ ] Admin has documented ≥3 SOP strategies
- [ ] Users view strategy page (track page views)
- [ ] Mobile bounce rate decreases
- [ ] Mobile session duration increases
- [ ] No mobile-related bug reports
- [ ] Admin satisfaction with editor

---

## Appendix

### A. Rich Text Editor Alternatives Comparison

| Editor | Pros | Cons | Score |
|--------|------|------|-------|
| Tiptap | Modern, headless, React-friendly | Learning curve | 9/10 |
| Quill | Mature, stable | Older tech, jQuery | 7/10 |
| Draft.js | Facebook-backed | Complex API | 6/10 |
| Slate | Highly customizable | Very complex | 5/10 |

**Winner**: Tiptap ✅

### B. Mobile Responsiveness Checklist

**Layout**:
- [ ] No horizontal scroll (except intentional tables)
- [ ] Content fits within viewport width
- [ ] Proper spacing between elements
- [ ] Text readable without zooming

**Touch Interactions**:
- [ ] Buttons ≥ 44px tap target
- [ ] Links ≥ 44px tap target
- [ ] Form inputs ≥ 44px height
- [ ] 8px spacing between targets

**Forms**:
- [ ] Labels above inputs
- [ ] Full-width inputs on mobile
- [ ] Keyboard doesn't cover inputs
- [ ] Proper input types (tel, email, etc.)

**Navigation**:
- [ ] Mobile menu accessible
- [ ] Back navigation clear
- [ ] Breadcrumbs visible

**Performance**:
- [ ] Page loads in <3s on 4G
- [ ] Images optimized
- [ ] Lazy loading for charts

---

**End of Document**

**Next Steps**: 
1. Review and approve plan
2. Create feature branch
3. Begin Phase 1 implementation
