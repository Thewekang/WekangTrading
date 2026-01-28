# AI Handoff Prompt: Feature 5 - SOP Details & Mobile Enhancement

**Purpose**: This document provides a comprehensive prompt for continuing Feature 5 implementation in a new AI chat session.

**Status**: Planning Complete ✅ | Implementation Ready 🚀

---

## Copy This Prompt for New Chat Session

```markdown
# Context: WekangTradingJournal - Feature 5 Implementation

I'm working on Feature 5 for WekangTradingJournal (Next.js 15 + TypeScript + Turso/Drizzle + NextAuth v5).

## Current State

**Repository**: 
- Branch: `develop` 
- PR #4 open (v1.2.2 hotfixes - ready to merge)
- Working directory: `G:\Hasil Kerja\Website\WekangTrading`

**Planning Complete**:
- Full specification: `docs/features/FEATURE-5-SOP-DETAILS-AND-MOBILE.md`
- Time estimate: 17-24 hours (2-3 days)
- All technical decisions made

## What We're Building

### Feature 1: SOP Details System (Trading Strategy Documentation)

**Goal**: Enable admin to document trading strategies with rich text and images.

**Key Requirements** (based on user sketch):
1. **Rich Text Editor** with Tiptap
   - Bold, italic, headings, lists, code blocks, links
   - **Image upload/paste** (chart screenshots) - CRITICAL
   - Base64 storage (max 500KB per image)
   - HTML sanitization with DOMPurify

2. **Structured Template Format**:
   ```
   [Chart Image]
   
   Entry Condition:
   - [Trading entry rules]
   
   SL (Stop Loss):
   - [Stop loss placement]
   
   TP (Take Profit):
   - [Take profit targets]
   
   Instrument:
   - [Recommended pairs/assets]
   
   Remarks:
   - [Additional notes]
   ```

3. **Database Changes** (sop_types table):
   - `detailContent` TEXT - HTML with base64 images
   - `detailEnabled` BOOLEAN - Admin controls visibility
   - `detailUpdatedAt` TIMESTAMP
   - `detailUpdatedBy` TEXT (references users.id)

4. **Admin UI** (`/admin/sop-types`):
   - Enhanced modal with 2 tabs: [Basic Info] [Details & Formatting]
   - "Insert Template" button (pre-fills structure)
   - Image upload button in toolbar
   - Toggle visibility to users
   - "Detail Status" column (✅ Enabled / ⚠️ Draft / ➖ None)

5. **User Page** (`/strategies` - NEW):
   - Collapsible accordion cards
   - Search/filter functionality
   - Desktop: Image left, details right
   - Mobile: Stacked (image top, details below)
   - Click image for full-screen view
   - Link from trade entry forms ("📚 View Strategy Guide")

### Feature 2: Mobile Responsiveness Enhancement

**Goal**: Improve usability on mobile devices (375px - 768px).

**Key Enhancements**:
1. **Tables → Card View** on mobile:
   - Trades list (TradesList.tsx)
   - Admin tables (users, sop-types)
   - Horizontal scroll as fallback

2. **Forms**:
   - Bulk trade entry: Card-based input on mobile
   - Settings page: Accordion sections
   - All touch targets ≥ 44px

3. **Charts**:
   - Responsive height (250px mobile, 350px desktop)
   - Rotated axis labels on mobile
   - Simplified legends

4. **New Utilities**:
   - `useMediaQuery()` hook
   - `useIsMobile()` hook
   - Reusable `MobileTableCard` component

## Implementation Plan (6 Phases)

### Phase 1: Database & API (2-3 hours)
1. Update `lib/db/schema/sopTypes.ts` - Add 4 new columns
2. Generate migration: `npm run drizzle:generate`
3. Apply migration: `npm run drizzle:push`
4. Create `lib/services/sopDetailService.ts` with CRUD operations
5. Update `app/api/admin/sop-types/[id]/route.ts` - Handle detail fields
6. Create `app/api/sop-types/with-details/route.ts` - User endpoint
7. Add HTML sanitization (DOMPurify)
8. Test with Postman/curl

### Phase 2: Rich Text Editor (3-4 hours)
1. Install: `npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image dompurify @types/dompurify`
2. Create `components/editors/TiptapEditor.tsx`:
   - Toolbar: Bold, Italic, H2/H3, Lists, Link, Image
   - Image upload button → File picker → Convert to base64
   - Size validation (max 500KB)
   - "Insert Template" button → Pre-fills structure
3. Create `components/editors/TiptapReadOnly.tsx` - Display formatted content
4. Add styling (Tailwind)
5. Test image upload/paste

### Phase 3: Admin UI Enhancement (3-4 hours)
1. Update `app/(admin)/admin/sop-types/page.tsx`:
   - Add "Detail Status" column
   - Create tabbed edit modal
   - Integrate TiptapEditor in Tab 2
   - Add visibility toggle
2. Update state management for detail fields
3. Test admin workflow: Create → Edit → Toggle → Save

### Phase 4: User Strategy Page (2-3 hours)
1. Create `app/(user)/strategies/page.tsx`:
   - Fetch SOP types with details (API call)
   - Collapsible accordion cards
   - Search/filter functionality
   - Desktop: Grid/flex layout with image + details
   - Mobile: Stacked layout
2. Create `components/sop/SopStrategyCard.tsx`
3. Add link from trade forms (near SOP dropdown)
4. Test user experience

### Phase 5: Mobile Responsiveness (4-6 hours)
1. Create `lib/hooks/useMediaQuery.ts` and `useIsMobile.ts`
2. Update `components/TradesList.tsx`:
   - Add card view for mobile
   - Hide table on mobile, show cards
3. Update `components/forms/BulkTradeEntryForm.tsx`:
   - Card-based input on mobile
4. Update charts (SessionComparisonChart, HourlyHeatmap, etc.):
   - Responsive height
   - Rotated labels
5. Test on Chrome DevTools (375px, 768px, 1024px)
6. Test on physical devices if available

### Phase 6: Testing & Polish (2-3 hours)
1. Test all features on desktop and mobile
2. Fix any bugs
3. Update documentation (CHANGELOG, API docs)
4. Create testing guide
5. Prepare for deployment

## Technical Details

**File Structure**:
```
components/
├── editors/
│   ├── TiptapEditor.tsx          # NEW - Rich text editor
│   └── TiptapReadOnly.tsx        # NEW - Read-only display
├── sop/
│   └── SopStrategyCard.tsx       # NEW - Strategy card
└── mobile/
    └── MobileTableCard.tsx       # NEW - Table→card converter

app/(user)/
└── strategies/
    └── page.tsx                  # NEW - User strategy page

lib/
├── hooks/
│   ├── useMediaQuery.ts          # NEW - Media query hook
│   └── useIsMobile.ts            # NEW - Mobile detection
└── services/
    └── sopDetailService.ts       # NEW - SOP detail CRUD

Modified:
- lib/db/schema/sopTypes.ts       # Add columns
- app/(admin)/admin/sop-types/page.tsx  # Enhanced UI
- app/api/admin/sop-types/[id]/route.ts # Handle details
- components/TradesList.tsx       # Mobile cards
- components/forms/BulkTradeEntryForm.tsx # Mobile input
- components/charts/*.tsx         # Mobile responsive
```

**Database Schema Change**:
```typescript
export const sopTypes = sqliteTable('sop_types', {
  // ... existing fields (id, name, description, active, sortOrder, etc.)
  
  // NEW FIELDS
  detailContent: text('detail_content'),           // HTML with base64 images
  detailEnabled: integer('detail_enabled', { mode: 'boolean' }).default(false),
  detailUpdatedAt: integer('detail_updated_at', { mode: 'timestamp' }),
  detailUpdatedBy: text('detail_updated_by').references(() => users.id),
});
```

**Image Handling**:
- Format: Base64 encoded
- Max size: 500KB per image
- Validation client-side before encoding
- Store in `detailContent` HTML: `<img src="data:image/png;base64,..." />`

**Security**:
- DOMPurify sanitization before rendering HTML
- Prevent XSS attacks
- Validate image size server-side

## Important Context

**Project Architecture** (from copilot-instructions.md):
- Database: Turso (SQLite) with Drizzle ORM
- Schema location: `lib/db/schema/` (SSOT)
- Validation: `lib/validations.ts` (Zod schemas)
- Services: `lib/services/` (all business logic)
- API pattern: Standard response format with error handling

**Responsive Breakpoints**:
```javascript
sm: '640px'   // Small tablets
md: '768px'   // Tablets  
lg: '1024px'  // Desktops
xl: '1280px'  // Large desktops
```

**Touch Target Minimum**: 44px × 44px (WCAG AAA)

## What I Need Help With

I'm ready to start Phase 1 (Database & API). Please:

1. **Create feature branch**: `git checkout -b feature/sop-details-mobile`
2. **Begin Phase 1 implementation**:
   - Update schema with new columns
   - Generate and apply migration
   - Create SOP detail service
   - Update API endpoints
   - Add HTML sanitization

3. **Follow the implementation plan** in `docs/features/FEATURE-5-SOP-DETAILS-AND-MOBILE.md`

4. **Test locally first** before Vercel deployment

5. **Follow project patterns**:
   - Use existing validation patterns (Zod)
   - Follow API response format
   - Use TypeScript strict mode
   - Mobile-first CSS approach

## Critical Files to Reference

1. `docs/features/FEATURE-5-SOP-DETAILS-AND-MOBILE.md` - Full specification
2. `.github/copilot-instructions.md` - Project patterns and architecture
3. `lib/db/schema/sopTypes.ts` - Current schema
4. `app/(admin)/admin/sop-types/page.tsx` - Admin UI to enhance
5. `components/TradesList.tsx` - Table→card pattern reference

## Questions to Ask If Unclear

- Database migration approach (Drizzle generate vs manual SQL)?
- Image size limit (500KB good for chart screenshots)?
- User page URL (`/strategies` vs `/trades/strategies`)?
- Testing approach (local dev vs Vercel preview)?

## Expected Deliverables After Phase 1

- ✅ Migration applied to local database
- ✅ 4 new columns in sop_types table
- ✅ sopDetailService.ts with CRUD operations
- ✅ API endpoints handle detail fields
- ✅ HTML sanitization working
- ✅ Postman/curl tests passing

Let's start with Phase 1. Ready? 🚀
```

---

## Usage Instructions

**For AI in New Chat**:
1. Copy the entire prompt above (between the triple backticks)
2. Paste into new chat
3. AI will have full context to continue implementation

**For Human Developer**:
1. Review the plan in `FEATURE-5-SOP-DETAILS-AND-MOBILE.md`
2. Use this prompt to brief another developer or AI assistant
3. Reference the phase breakdown for step-by-step implementation

---

**Created**: January 25, 2026  
**Session**: Feature 5 Planning Complete  
**Next**: Implementation Phase 1
