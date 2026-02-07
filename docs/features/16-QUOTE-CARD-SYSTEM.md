# Quote Card System - Feature Documentation

**Version:** 1.0.0  
**Status:** 📋 Planning Phase  
**Branch:** `feature/quote-card-system`  
**Created:** February 7, 2026

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Strategic Analysis](#strategic-analysis)
3. [Core Requirements](#core-requirements)
4. [Database Schema](#database-schema)
5. [System Architecture](#system-architecture)
6. [Component Design](#component-design)
7. [Integration Strategy](#integration-strategy)
8. [Implementation Plan](#implementation-plan)
9. [User Experience Flow](#user-experience-flow)
10. [Testing Strategy](#testing-strategy)

---

## 1. Overview

### What is the Quote Card System?

A **globally accessible motivational quote system** that displays trading wisdom at strategic moments to reinforce discipline, manage emotions, and maintain trader psychology. The system uses contextual triggers, bilingual support, and smart anti-spam logic to deliver the right message at the right time.

### Key Characteristics

- ✅ **Context-Aware**: Shows relevant quotes based on trading outcomes (WIN/LOSS/BE)
- ✅ **Bilingual Rotation**: Alternates between English and Bahasa Melayu automatically
- ✅ **Weighted Selection**: Higher-weighted quotes appear more frequently
- ✅ **Anti-Spam**: Cooldown periods and user preferences prevent annoyance
- ✅ **Admin Managed**: Full CRUD interface for quote management
- ✅ **Reusable**: Works across all pages without hardcoding

### Primary Use Cases

1. **Post-Trade Motivation**: Show discipline quotes after losses, humility quotes after wins
2. **Random Inspiration**: Display wisdom during page loads (low probability)
3. **Dialog Enhancement**: Show quotes in large input dialogs (trade entry, bulk entry)
4. **Quote of the Day**: Display rotating quote on dashboard (persistent for 24 hours)
5. **Admin Control**: Manage quote library, enable/disable, adjust weights

---

## 2. Strategic Analysis

### 2.1 Psychological Impact

**Problem**: Traders often experience emotional responses after trades:
- **After WIN**: Overconfidence → Leads to overtrading
- **After LOSS**: Frustration → Leads to revenge trading
- **After BE**: Impatience → Leads to forcing trades

**Solution**: Context-aware quotes provide:
- **Immediate Emotional Reset**: Break the emotional cycle
- **Reinforcement**: Remind trader of their rules and strategy
- **Perspective**: Shift focus from outcome to process

### 2.2 Timing Strategy

**When to Show Quotes** (Priority Order):

| Trigger | Priority | Category Filter | Reason |
|---------|----------|----------------|--------|
| After LOSS | HIGH | `loss`, `discipline` | Most critical - prevent tilt |
| After WIN | HIGH | `confidence`, `discipline` | Prevent overconfidence |
| After BE | MEDIUM | `patience` | Reinforce patience |
| Page Load | LOW | `general` | Ambient motivation |
| Manual | ALWAYS | User selected | Admin/testing |

### 2.3 Display Strategy

**Placement Options** (Recommended):

1. **Toast Notification** (Default) ✅
   - Top-right corner
   - Non-blocking, dismissible
   - Auto-dismiss after 8-10 seconds
   - Best for post-trade triggers

2. **Modal Overlay** (Alternative)
   - Center screen
   - Requires user dismissal
   - Use for critical moments only
   - Best for dialog integration

3. **Inline Card** (Future)
   - Dashboard section
   - Always visible "Quote of the Day"
   - No auto-dismiss
   - Persistent for 24 hours (refreshes daily)
   - Different styling from toast (card-based)

**Recommendation**: Use **Toast** as primary for post-trade triggers, **Inline Card** for "Quote of the Day" on dashboard.

### 2.4 Language Rotation Logic

**Goals**:
- Equal exposure to both languages (helps bilingual traders)
- Predictable pattern for user familiarity
- Persistent state across sessions

**Strategy**:
```
Session 1: Show quote in EN → Store "lastLanguage: EN"
Session 2: Show quote in BM → Store "lastLanguage: BM"
Session 3: Show quote in EN → Store "lastLanguage: EN"
...
```

**Storage**: User preferences table (`preferredLanguage`, `lastQuoteLanguage`)

### 2.5 Anti-Spam Design

**Problem**: Too many quotes become noise.

**Solution**:
1. **Cooldown Timer**: Don't show within X minutes of last quote
   - Default: 15 minutes
   - Configurable per user

2. **Max Shows per Session**: Limit total quotes per browsing session
   - Default: 5 quotes per session
   - Reset on browser close

3. **User Toggle**: Allow users to disable quotes entirely
   - `user_preferences.showQuotes: boolean`

4. **Anti-Repeat Memory**: Don't repeat same quote within last N shows
   - Default: N = 10
   - Stored in user state or session

---

## 3. Core Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | Display quote cards globally on any page | HIGH | 📋 Planned |
| FR-02 | Trigger quotes after trade outcome recorded | HIGH | 📋 Planned |
| FR-03 | Rotate language EN ↔ BM automatically | HIGH | 📋 Planned |
| FR-04 | Weighted random selection within category | HIGH | 📋 Planned |
| FR-05 | Anti-spam cooldown and user preferences | HIGH | 📋 Planned |
| FR-06 | Admin CRUD interface for quotes | HIGH | 📋 Planned |
| FR-07 | Seed from JSON on first run | MEDIUM | 📋 Planned |
| FR-08 | Preview card design in admin | MEDIUM | 📋 Planned |
| FR-09 | Show in input dialogs (conditional) | LOW | 📋 Planned |
| FR-10 | Export/import quotes (backup) | LOW | 🔮 Future |

### 3.2 Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-01 | Quote display latency | < 200ms |
| NFR-02 | No blocking of main UI | Non-blocking toast |
| NFR-03 | Mobile responsive design | 100% responsive |
| NFR-04 | Accessibility (ARIA labels) | WCAG 2.1 AA |
| NFR-05 | Animation performance | 60 FPS |

---

## 4. Database Schema

### 4.1 New Table: `trading_quotes`

```typescript
export const tradingQuotes = sqliteTable('trading_quotes', {
  id: text('id').primaryKey(), // "q-101", "q-102"
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  category: text('category').notNull(), // "discipline" | "loss" | "win" | "patience" | "general"
  weight: integer('weight').notNull().default(5), // 1-10
  textEn: text('text_en').notNull(),
  textBm: text('text_bm').notNull(),
  author: text('author'), // Optional
  sourceType: text('source_type'), // "original" | "publicFigure"
  displayCount: integer('display_count').notNull().default(0), // Analytics
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});
```

### 4.2 Update Table: `users`

**IMPORTANT**: User preferences are stored directly in `users` table (not separate table).

Add new fields to existing `users` table in `lib/db/schema/users.ts`:

```typescript
// New fields to add to users table
showQuotes: integer('show_quotes', { mode: 'boolean' }).notNull().default(true),
quotesCooldownMinutes: integer('quotes_cooldown_minutes').notNull().default(15),
lastQuoteShownAt: integer('last_quote_shown_at', { mode: 'timestamp' }),
lastQuoteId: text('last_quote_id'), // For anti-repeat
lastQuoteLanguage: text('last_quote_language', { enum: ['en', 'bm'] }).default('en'),
quoteShowCount: integer('quote_show_count').notNull().default(0), // Session counter (reset manually)
```

### 4.3 Category Enum

```typescript
export type QuoteCategory = 
  | 'discipline'    // General discipline reminders
  | 'loss'          // After loss - emotional recovery
  | 'win'           // After win - stay humble
  | 'confidence'    // Build confidence
  | 'patience'      // Wait for setups
  | 'overtrading'   // Anti-revenge trading
  | 'risk'          // Risk management
  | 'mental'        // Psychology
  | 'general';      // Ambient wisdom
```

---

## 5. System Architecture

### 5.1 Component Hierarchy

```
App Layout (RootLayout)
├─ QuoteSystemProvider (Context)
│  ├─ State: cooldown, preferences, history
│  ├─ Functions: showQuote(), checkCooldown()
│  └─ QuoteCardToast (Global Component)
│     ├─ Card Container (animated)
│     ├─ Quote Text (highlighted)
│     ├─ Author + Category Tag
│     └─ Dismiss Button
└─ All Pages (can trigger quotes)
```

### 5.2 Data Flow

```
┌─────────────────┐
│ Trade Saved     │ (WIN/LOSS/BE)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ triggerQuote()  │ Check cooldown + preferences
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ getRandomQuote()│ Weighted selection + category filter
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ showQuote()     │ Display toast + update state
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ User Dismisses  │ Update lastQuoteShownAt
└─────────────────┘
```

### 5.3 Service Layer

**lib/services/quoteService.ts**

```typescript
// Core functions
export async function getRandomQuote(category?: QuoteCategory): Promise<Quote>
export async function getQuoteById(id: string): Promise<Quote | null>
export async function updateQuoteDisplayCount(id: string): Promise<void>
export async function seedQuotesFromJSON(): Promise<void>

// Weighted selection
export function selectWeightedRandom(quotes: Quote[]): Quote
export function filterAntiRepeat(quotes: Quote[], lastN: string[]): Quote[]
```

**lib/services/userPreferencesService.ts** (NEW - extend existing pattern)

```typescript
// New service file following existing service patterns
export async function canShowQuote(userId: string): Promise<boolean>
export async function updateLastQuoteShown(userId: string, quoteId: string, language: string): Promise<void>
export async function getNextQuoteLanguage(userId: string): Promise<'en' | 'bm'>
export async function getUserQuotePreferences(userId: string): Promise<UserQuotePreferences>
export async function updateQuotePreferences(userId: string, prefs: Partial<UserQuotePreferences>): Promise<void>
```

---

## 6. Component Design

### 6.1 QuoteCard Component

**components/quotes/QuoteCard.tsx**

```typescript
interface QuoteCardProps {
  quote: Quote;
  language: 'en' | 'bm';
  variant?: 'toast' | 'modal' | 'inline';
  onDismiss: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number; // milliseconds
}

export function QuoteCard({ ... }: QuoteCardProps) {
  // Image-style card design
  // - Rounded corners (rounded-xl)
  // - Shadow (shadow-2xl)
  // - Gradient background
  // - Highlighted quote text (bg-yellow-200/30)
  // - Category badge
  // - Smooth animations (fade + slide)
}
```

**Design Specs**:
- Width: 400px (desktop), 90vw (mobile)
- Padding: 24px
- Border radius: 16px
- Shadow: `0 25px 50px -12px rgba(0, 0, 0, 0.25)`
- Background: Gradient (subtle)
- Font: Quote text 18px, Author 14px
- Animation: `fade-in-up` 300ms ease-out

### 6.2 QuoteSystemProvider

**contexts/QuoteSystemContext.tsx** (follows TimezoneContext pattern)

```typescript
interface QuoteSystemContextType {
  showQuote: (options?: ShowQuoteOptions) => Promise<void>;
  dismissQuote: () => void;
  canShowQuote: boolean;
  isQuoteVisible: boolean;
}

interface ShowQuoteOptions {
  category?: QuoteCategory;
  reason?: 'page' | 'win' | 'loss' | 'be' | 'manual' | 'trade' | 'bulk' | 'import' | 'discipline-tracker';
  forceShow?: boolean; // Skip cooldown check
}

export function QuoteSystemProvider({ children, userId }: { children: ReactNode; userId: string }) {
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [language, setLanguage] = useState<'en' | 'bm'>('en');

  // Functions...
}

export function useQuoteSystem() {
  const context = useContext(QuoteSystemContext);
  if (!context) {
    throw new Error('useQuoteSystem must be used within QuoteSystemProvider');
  }
  return context;
}
```

**Integration in layout**: Add to `app/(user)/layout.tsx` (already has TimezoneProvider)

### 6.3 Admin Management Page

**app/(admin)/quotes/page.tsx**

Features:
- Table view with all quotes
- Enable/disable toggle (inline)
- Edit modal (full form)
- Add new quote button
- Preview card in modal
- Weight slider (1-10)
- Category dropdown
- Delete with confirmation
- "Reset to Defaults" button (re-seed)
- Search/filter by category
- Sort by weight, category, author

---

## 7. Integration Strategy

### 7.1 Existing Infrastructure Analysis

**✅ Toast System**: Already using `sonner` library (Toaster in layout.tsx)
- Current: `import { toast } from 'sonner';`
- Usage: `toast.success()`, `toast.error()`, `toast.info()`
- **Decision**: Reuse sonner for quote toast notifications

**✅ Context Pattern**: Already using TimezoneProvider in (user) layout
- Provider wraps all user pages
- **Decision**: Create QuoteSystemProvider following same pattern

**✅ User Preferences**: Users table already has `preferredTimezone` field
- **Decision**: Add new fields to users table (NOT separate user_preferences table)
- Fields to add: `showQuotes`, `quotesCooldownMinutes`, `lastQuoteShownAt`, `lastQuoteId`, `lastQuoteLanguage`, `quoteShowCount`

**✅ Admin Structure**: Already has organized admin pages
- Path: `app/(admin)/admin/[feature]/page.tsx`
- **Decision**: Create `app/(admin)/admin/quotes/page.tsx`

**✅ Badge Celebration**: Already has BadgeCelebration component
- Used in CSV import after successful imports
- **Decision**: Similar animation pattern for quote cards

### 7.2 Integration Points (Actual Locations)

**1. Quick Trade Entry** (Real-Time)
- **Component**: `components/forms/RealTimeTradeEntryForm.tsx`
- **Page**: `app/(user)/trades/new/page.tsx`
- **Trigger Point**: After successful API response from `/api/trades/individual`
- **Existing Toast**: Already uses sonner `toast.success()` / `toast.error()`
- **Integration**: Add quote trigger after toast success
```typescript
// In RealTimeTradeEntryForm.tsx after successful save
if (response.ok && data.success) {
  toast.success('Trade recorded successfully!');
  
  // NEW: Trigger quote based on trade result
  const category = formData.result === 'WIN' ? 'win' : 
                   formData.result === 'LOSS' ? 'loss' : 'patience';
  await showQuote({ category, reason: 'trade' });
}
```

**2. Bulk Trade Entry**
- **Component**: `components/forms/BulkTradeEntryForm.tsx`
- **Page**: `app/(user)/trades/bulk/page.tsx`
- **Trigger Point**: After all trades successfully saved
- **Existing Toast**: Uses sonner toasts
- **Integration**: Show quote after bulk save completes
```typescript
// After bulk save success
toast.success(`${trades.length} trades saved successfully!`);

// NEW: Analyze last trade or aggregate outcome
const lastTrade = trades[trades.length - 1];
const category = lastTrade.result === 'WIN' ? 'win' : 
                 lastTrade.result === 'LOSS' ? 'loss' : 'general';
await showQuote({ category, reason: 'bulk' });
```

**3. CSV Import**
- **Page**: `app/(user)/trades/import/page.tsx`
- **Trigger Point**: After successful import (already has BadgeCelebration)
- **Existing Pattern**: Shows badge celebration after import
- **Integration**: Show quote after badge celebration dismisses
```typescript
// After successful import
setShowCelebration(true); // Badge celebration
// NEW: Show quote after celebration (3s delay)
setTimeout(async () => {
  await showQuote({ category: 'general', reason: 'import' });
}, 3000);
```

**4. Discipline Tracker**
- **Page**: `app/(user)/discipline-tracker/page.tsx`
- **Trigger Point**: After Trade 1/2/3 outcome updated
- **Existing Toast**: Uses `toast.info()` for rule changes
- **Integration**: Add quote trigger in handleUpdateRow
```typescript
// In handleUpdateRow after successful update
if (data.success) {
  setRows(rows.map((r) => (r.id === id ? data.data : r)));
  
  // NEW: Trigger quote if trade outcome changed
  if (updates.trade1Outcome || updates.trade2Outcome || updates.trade3Outcome) {
    const outcome = updates.trade1Outcome || updates.trade2Outcome || updates.trade3Outcome;
    const category = outcome === 'TP1' || outcome === 'TP2' || outcome === 'TP3' ? 'win' :
                     outcome === 'SL' ? 'loss' : 'patience';
    await showQuote({ category, reason: 'discipline-tracker' });
  }
}
```

**5. Page Loads** (Random - Low Priority)
- **Location**: QuoteSystemProvider (global)
- **Probability**: 5% on component mount
- **Cooldown**: Still applies
- **Implementation**: useEffect in provider checks random + cooldown

### 7.2 Event Emitter Pattern

**lib/utils/quoteEvents.ts**

```typescript
// Simple event emitter for quote triggers
class QuoteEventEmitter extends EventEmitter {
  triggerQuote(category?: QuoteCategory, reason?: string) {
    this.emit('show-quote', { category, reason });
  }
}

export const quoteEmitter = new QuoteEventEmitter();
```

Usage:
```typescript
// In any component
import { quoteEmitter } from '@/lib/utils/quoteEvents';

quoteEmitter.triggerQuote('loss', 'trade-saved');
```

---

## 8. Implementation Plan

### Phase 1: Foundation (Database + Seed)
**Estimated Time**: 2 hours

- [x] Create branch `feature/quote-card-system`
- [ ] Define database schema (`trading_quotes`)
- [ ] Update `user_preferences` schema
- [ ] Generate migration
- [ ] Apply migration to database
- [ ] Create `quotes.json` seed file (from provided sample)
- [ ] Create seed script `scripts/seed-quotes.ts`
- [ ] Add seed function to check if quotes table empty → import JSON

**Deliverables**:
- `lib/db/schema/tradingQuotes.ts` (NEW)
- `lib/db/schema/users.ts` (UPDATED - add quote fields)
- `public/data/quotes.json` (NEW - seed data)
- `scripts/seed-quotes.ts` (NEW)
- Update `lib/db/schema/index.ts` to export tradingQuotes

---

### Phase 2: Core Services (Business Logic)
**Estimated Time**: 3 hours

- [ ] Create quote service (`lib/services/quoteService.ts`)
  - [ ] Weighted random selection algorithm
  - [ ] Category filtering
  - [ ] Anti-repeat logic
  - [ ] Display count tracking
- [ ] Extend user preferences service
  - [ ] Cooldown check function
  - [ ] Language rotation function
  - [ ] Quote state management
- [ ] Create validation schemas (`lib/validations/quote.ts`)
- [ ] Unit tests for weighted selection

**Deliverables**:
- `lib/services/quoteService.ts` (NEW)
- `lib/services/userQuotePreferencesService.ts` (NEW - following existing service patterns)
- `lib/validations/quote.ts` (NEW)
- `lib/utils/weightedRandom.ts` (NEW)

---

### Phase 3: API Layer
**Estimated Time**: 2 hours

- [ ] `GET /api/quotes` - List all quotes (admin)
- [ ] `POST /api/quotes` - Create quote (admin)
- [ ] `GET /api/quotes/[id]` - Get single quote
- [ ] `PATCH /api/quotes/[id]` - Update quote (admin)
- [ ] `DELETE /api/quotes/[id]` - Delete quote (admin)
- [ ] `POST /api/quotes/random` - Get random quote (user)
- [ ] `POST /api/quotes/seed` - Re-seed from JSON (admin)

**Deliverables**:
- `app/api/quotes/route.ts`
- `app/api/quotes/[id]/route.ts`
- `app/api/quotes/random/route.ts`
- `app/api/quotes/seed/route.ts`

---

### Phase 4: UI Components
**Estimated Time**: 4 hours

- [ ] Create QuoteCard component
  - [ ] Image-style design with Tailwind
  - [ ] Highlight effect for quote text
  - [ ] Category badge
  - [ ] Author display
  - [ ] Smooth animations (framer-motion)
- [ ] Create QuoteSystemProvider context
  - [ ] State management
  - [ ] showQuote() function
  - [ ] Cooldown logic
  - [ ] Language rotation
- [ ] Create QuoteToast component (global)
  - [ ] Toast positioning (top-right)
  - [ ] Auto-dismiss timer
  - [ ] Manual dismiss button
- [ ] Add provider to root layout

**Deliverables**:
- `components/quotes/QuoteCard.tsx` (NEW)
- `contexts/QuoteSystemContext.tsx` (NEW - follows TimezoneContext pattern)
- `hooks/useQuoteSystem.ts` (NEW - export from context)
- Update `app/(user)/layout.tsx` to wrap with QuoteSystemProvider (after TimezoneProvider)

---

### Phase 5: Admin Interface
**Estimated Time**: 4 hours

- [ ] Create admin quotes management page
  - [ ] Table view with all quotes
  - [ ] Add new quote form
  - [ ] Edit quote modal
  - [ ] Delete confirmation
  - [ ] Enable/disable toggle (inline)
  - [ ] Weight adjustment slider
  - [ ] Category filter/search
  - [ ] Preview card button
- [ ] Create quote form component
  - [ ] Both language inputs
  - [ ] Weight slider
  - [ ] Category dropdown
  - [ ] Author input
  - [ ] Source type select
- [ ] Add "Reset to Defaults" button (re-seed)

**Deliverables**:
- `app/(admin)/admin/quotes/page.tsx` (NEW - follows existing admin page structure)
- `components/admin/QuoteForm.tsx` (NEW)
- `components/admin/QuoteTable.tsx` (NEW)
- `components/admin/QuotePreview.tsx` (NEW)
- Update admin navigation if needed

---

### Phase 6: Integration
**Estimated Time**: 3 hours

- [ ] Integrate with quick trade entry
- [ ] Integrate with bulk trade entry
- [ ] Integrate with discipline tracker
- [ ] Add random page load trigger (5% probability)
- [ ] Add user preferences toggle in settings
  - [ ] Enable/disable quotes
  - [ ] Adjust cooldown minutes
- [ ] Add navigation link (admin only)
- [ ] Test all trigger points

**Deliverables**:
- Updated `components/forms/RealTimeTradeEntryForm.tsx` (add quote trigger)
- Updated `components/forms/BulkTradeEntryForm.tsx` (add quote trigger)
- Updated `app/(user)/trades/import/page.tsx` (add quote trigger after badge celebration)
- Updated `app/(user)/discipline-tracker/page.tsx` (add quote trigger in handleUpdateRow)
- Updated `app/(user)/settings/page.tsx` (add quote preferences section)
- Integration examples and documentation

---

### Phase 7: Polish & Testing
**Estimated Time**: 2 hours

- [ ] Mobile responsive testing
- [ ] Animation performance testing
- [ ] Accessibility audit (ARIA labels)
- [ ] Cross-browser testing
- [ ] Admin interface usability
- [ ] Documentation update

**Total Estimated Time**: **20 hours** (~2.5 days)

---

## 9. User Experience Flow

### 9.1 Scenario: After Losing Trade

```
User enters trade → Result: LOSS → Saves trade
                                         ↓
                              [Check cooldown: OK?]
                                         ↓ YES
                              [Check user preference: Enabled?]
                                         ↓ YES
                              [Get random quote from "loss" category]
                                         ↓
                              [Select language: EN or BM (rotate)]
                                         ↓
                              [Show QuoteCard toast - top right]
                                         ↓
                   ┌─────────────────────────────────────┐
                   │  Trading Reminder                   │
                   │                                     │
                   │  "Losses are part of the plan.     │
                   │   Rule-breaking is not."            │ ← Highlighted
                   │                                     │
                   │  — Trading Discipline Reminder      │
                   │  [Discipline]                       │
                   │                          [✕]        │
                   └─────────────────────────────────────┘
                                         ↓
                              [Auto-dismiss after 10s OR user clicks ✕]
                                         ↓
                              [Update lastQuoteShownAt, lastQuoteId]
                                         ↓
                              [Cooldown starts → 15 min wait]
```

### 9.2 Scenario: Admin Managing Quotes

```
Admin → Quotes Management Page
             ↓
    ┌────────────────────────┐
    │  All Quotes (16)       │
    │  [+ Add New]           │
    │  [Reset to Defaults]   │
    │                        │
    │  Filter: [All ▼]       │
    │  Search: [_______]     │
    │                        │
    │  ID    | Text | Weight │
    │  q-101 | ...  |  ★★★★  │ [Edit] [Delete] [Preview]
    │  q-102 | ...  |  ★★★   │ [Edit] [Delete] [Preview]
    │  ...                   │
    └────────────────────────┘
             ↓ Click [Edit]
    ┌────────────────────────┐
    │  Edit Quote            │
    │                        │
    │  Enabled: [✓]          │
    │  Category: [loss ▼]    │
    │  Weight: [●────────] 7 │
    │                        │
    │  English Text:         │
    │  [________________]    │
    │                        │
    │  Malay Text:           │
    │  [________________]    │
    │                        │
    │  Author: [_______]     │
    │  Source: [original ▼]  │
    │                        │
    │  [Preview Card]        │
    │  [Cancel]  [Save]      │
    └────────────────────────┘
```

---

## 10. Testing Strategy

### 10.1 Unit Tests

```typescript
describe('Weighted Random Selection', () => {
  it('should select higher weighted quotes more often')
  it('should handle empty quote list')
  it('should respect anti-repeat list')
});

describe('Language Rotation', () => {
  it('should alternate EN → BM → EN')
  it('should persist last language in preferences')
  it('should default to EN for new users')
});

describe('Cooldown Logic', () => {
  it('should block quotes within cooldown period')
  it('should allow quotes after cooldown expires')
  it('should respect forceShow flag')
});
```

### 10.2 Integration Tests

- [ ] Seed quotes from JSON on empty database
- [ ] Get random quote with category filter
- [ ] Update display count after showing quote
- [ ] User preference toggle disables quotes
- [ ] Cooldown prevents spam
- [ ] Language rotates correctly

### 10.3 E2E Tests

- [ ] Complete trade entry → Quote appears
- [ ] Admin creates new quote → Appears in random selection
- [ ] Admin disables quote → Never appears
- [ ] User disables quotes → No quotes shown
- [ ] Quote auto-dismisses after timer
- [ ] Preview card in admin works

---

## 12. Existing Infrastructure vs New Additions

### ✅ What Already Exists (REUSE)

| Component | Location | Usage |
|-----------|----------|-------|
| **Toast System** | `sonner` library in layout.tsx | Reuse for quote notifications |
| **Context Pattern** | `TimezoneProvider` in (user) layout | Follow same pattern for QuoteSystemProvider |
| **User Table** | `lib/db/schema/users.ts` | Add new quote fields here |
| **Admin Pages** | `app/(admin)/admin/[feature]/` | Follow structure for quotes page |
| **Service Pattern** | `lib/services/*.ts` | Follow naming and pattern |
| **Badge Celebration** | `components/animations/BadgeCelebration.tsx` | Similar animation pattern |
| **Validation Pattern** | `lib/validations/*.ts` with Zod | Follow same approach |
| **API Pattern** | `app/api/[feature]/route.ts` | Standard response format |

### 🆕 What to Create (NEW)

| Component | Type | Purpose |
|-----------|------|---------|
| `lib/db/schema/tradingQuotes.ts` | Schema | Quote data model |
| `lib/services/quoteService.ts` | Service | Quote CRUD + weighted selection |
| `lib/services/userQuotePreferencesService.ts` | Service | User quote preferences |
| `lib/validations/quote.ts` | Validation | Zod schemas for quotes |
| `lib/utils/weightedRandom.ts` | Utility | Weighted random algorithm |
| `contexts/QuoteSystemContext.tsx` | Context | Global quote state |
| `components/quotes/QuoteCard.tsx` | Component | Visual quote card |
| `app/api/quotes/**` | API | Quote endpoints |
| `app/(admin)/admin/quotes/page.tsx` | Page | Admin management |
| `components/admin/Quote*.tsx` | Components | Admin UI |
| `public/data/quotes.json` | Data | Seed file |
| `scripts/seed-quotes.ts` | Script | Database seeding |

### 🔧 What to Update (MODIFY)

| File | Change | Reason |
|------|--------|--------|
| `lib/db/schema/users.ts` | Add 6 quote fields | Store user preferences |
| `lib/db/schema/index.ts` | Export tradingQuotes | Schema registration |
| `app/(user)/layout.tsx` | Wrap with QuoteSystemProvider | Global quote access |
| `components/forms/RealTimeTradeEntryForm.tsx` | Add quote trigger | Post-trade quotes |
| `components/forms/BulkTradeEntryForm.tsx` | Add quote trigger | Post-bulk quotes |
| `app/(user)/trades/import/page.tsx` | Add quote trigger | Post-import quotes |
| `app/(user)/discipline-tracker/page.tsx` | Add quote trigger | Post-update quotes |
| `app/(user)/settings/page.tsx` | Add quote preferences UI | User control |

---

## 11. Key Design Decisions

### ✅ Decisions Made

1. **Toast over Modal**: Less intrusive, allows continued work
2. **Language Rotation**: Automatic alternation for equal exposure
3. **Category Mapping**: WIN → confidence/discipline, LOSS → loss/discipline
4. **Cooldown Default**: 15 minutes (user adjustable)
5. **Weight Range**: 1-10 (simple, intuitive)
6. **Anti-Repeat**: Last 10 quotes (prevent monotony)
7. **Seed Strategy**: JSON seed on first run, DB as source of truth after
8. **Admin Only**: Quote management restricted to admin role

### ❌ Non-Goals

- ❌ NOT for strategy tips or technical analysis
- ❌ NOT for market news or alerts
- ❌ NOT for mandatory reading (always dismissible)
- ❌ NOT for tracking user mood/sentiment
- ❌ NOT for A/B testing quote effectiveness (future maybe)

---

## 12. Future Enhancements (v2.0)

- [ ] User-submitted quotes (moderation queue)
- [ ] Quote reactions (like/dislike for personal filtering)
- [ ] "Quote of the Day" dashboard widget
- [ ] Share quote as image (social media)
- [ ] Quote analytics (most shown, highest engagement)
- [ ] Custom quote categories per user
- [ ] AI-generated personalized quotes
- [ ] Integration with achievement system

---

**End of Planning Document**

**Next Step**: Review with user → Proceed with Phase 1 implementation

