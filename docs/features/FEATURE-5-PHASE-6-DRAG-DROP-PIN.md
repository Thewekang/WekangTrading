# Feature 5 Phase 6: Drag-Drop Sorting & Pin Favorites

**Feature**: Admin UX Enhancements - Drag-Drop Sorting and Pin Favorites  
**Status**: ✅ COMPLETE  
**Branch**: feature/sop-details-mobile → merged to develop  
**Completion Date**: January 25, 2026  
**Migration**: 0007_add_user_pinned_sops.sql  
**Dependencies**: @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities

---

## Table of Contents
1. [Overview](#overview)
2. [User Stories](#user-stories)
3. [Technical Implementation](#technical-implementation)
4. [Database Changes](#database-changes)
5. [API Endpoints](#api-endpoints)
6. [UI/UX Enhancements](#uiux-enhancements)
7. [Bug Fixes](#bug-fixes)
8. [Testing](#testing)
9. [Production Deployment](#production-deployment)

---

## Overview

### Problem Statement
- **Sorting Issue**: Manual sortOrder input was not user-friendly
- **Access Pattern**: Users frequently access same 3-5 SOPs during trading sessions
- **Navigation**: Need quick way to identify and access favorite strategies

### Solution
1. **Drag-and-Drop Sorting**: Replace manual numeric input with intuitive drag-and-drop interface
2. **Pin Favorites**: Allow users to pin up to 3 favorite SOPs for quick access
3. **Visual Indicators**: Show pinned status and count in real-time

---

## User Stories

### 1. As an Admin
- ✅ I want to reorder SOPs by dragging them, so I can organize strategies without typing numbers
- ✅ I want to see a visual grab handle (⋮⋮), so I know which rows are draggable
- ✅ I want the order to save automatically, so I don't need a separate save button

### 2. As a User
- ✅ I want to pin my top 3 favorite SOPs, so they appear first in the strategies list
- ✅ I want to see star icons (⭐) on pinned SOPs, so I know which are my favorites
- ✅ I want clear feedback when I reach the max 3 pins, so I know the limit

### 3. As a Developer
- ✅ I want reusable drag-drop components, so I can apply this pattern elsewhere
- ✅ I want server-side validation, so pin limits are enforced
- ✅ I want clean database schema, so pins are user-specific and scalable

---

## Technical Implementation

### Libraries Added

```json
{
  "@dnd-kit/core": "^6.3.1",
  "@dnd-kit/sortable": "^9.0.1",
  "@dnd-kit/utilities": "^3.2.2"
}
```

**Why @dnd-kit?**
- ✅ Lightweight (~20KB gzipped)
- ✅ Accessible (keyboard navigation, screen readers)
- ✅ Framework-agnostic (works with React Server Components)
- ✅ Touch-friendly (mobile + desktop)
- ✅ No jQuery or legacy dependencies

---

## Database Changes

### Migration 0007: user_pinned_sops

**File**: `drizzle/migrations/0007_add_user_pinned_sops.sql`

```sql
CREATE TABLE IF NOT EXISTS "user_pinned_sops" (
  "user_id" TEXT NOT NULL,
  "sop_type_id" TEXT NOT NULL,
  "pinned_at" TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY("user_id", "sop_type_id"),
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY ("sop_type_id") REFERENCES "sop_types"("id") ON UPDATE no action ON DELETE cascade
);

CREATE INDEX IF NOT EXISTS "user_pinned_sops_user_id_idx" ON "user_pinned_sops" ("user_id");
CREATE INDEX IF NOT EXISTS "user_pinned_sops_sop_type_id_idx" ON "user_pinned_sops" ("sop_type_id");
```

**Schema Features**:
- **Composite Primary Key**: (userId, sopTypeId) - prevents duplicate pins
- **Cascade Delete**: Auto-remove pins when user or SOP is deleted
- **Indexes**: Fast lookups by user or SOP
- **Timestamp**: Track when pin was created

---

## API Endpoints

### 1. Reorder SOPs (Admin Only)

**POST** `/api/admin/sop-types/reorder`

**Request Body**:
```json
{
  "orderedIds": ["sop-id-1", "sop-id-2", "sop-id-3"]
}
```

**Response**:
```json
{
  "success": true,
  "message": "SOP types reordered successfully"
}
```

**Validation**:
- ✅ Requires admin role
- ✅ Array cannot be empty
- ✅ All IDs must exist in database

**Logic**:
1. Receive ordered array of SOP IDs
2. Loop through array
3. Update sortOrder = array index
4. Return success

---

### 2. Pin SOP (All Users)

**POST** `/api/sop-types/[id]/pin`

**Response Success**:
```json
{
  "success": true,
  "message": "SOP type pinned successfully"
}
```

**Response Error - Max Limit**:
```json
{
  "success": false,
  "error": {
    "code": "MAX_PINS_EXCEEDED",
    "message": "Maximum 3 SOP types can be pinned. Please unpin one before adding another."
  }
}
```

**Response Error - Already Pinned**:
```json
{
  "success": false,
  "error": {
    "code": "ALREADY_PINNED",
    "message": "This SOP type is already pinned"
  }
}
```

**Validation**:
- ✅ Requires authentication (any user)
- ✅ Check if already pinned (return friendly error)
- ✅ Check if user has 3 pins (return MAX_PINS_EXCEEDED)
- ✅ Insert into user_pinned_sops table

---

### 3. Unpin SOP (All Users)

**DELETE** `/api/sop-types/[id]/pin`

**Response**:
```json
{
  "success": true,
  "message": "SOP type unpinned successfully"
}
```

**Logic**:
1. Verify user is authenticated
2. Delete row from user_pinned_sops
3. Return success (no error if not pinned)

---

## Service Layer Functions

### lib/services/sopTypeService.ts

#### 1. getActiveSopTypes(userId?: string)
```typescript
// Returns SOPs with isPinned flag
// Sorting: pinned first, then by sortOrder
SELECT 
  sop_types.*,
  CASE WHEN user_pinned_sops.user_id IS NOT NULL THEN 1 ELSE 0 END as isPinned
FROM sop_types
LEFT JOIN user_pinned_sops 
  ON sop_types.id = user_pinned_sops.sop_type_id 
  AND user_pinned_sops.user_id = ?
WHERE sop_types.is_active = 1
ORDER BY isPinned DESC, sop_types.sort_order ASC
```

#### 2. reorderSopTypes(orderedIds: string[])
```typescript
// Batch update sortOrder based on array position
for (let i = 0; i < orderedIds.length; i++) {
  await db
    .update(sopTypes)
    .set({ sortOrder: i })
    .where(eq(sopTypes.id, orderedIds[i]));
}
```

#### 3. pinSopType(userId: string, sopTypeId: string)
```typescript
// Check max limit
const existingPins = await getUserPinnedSops(userId);
if (existingPins.length >= 3) {
  throw new Error('MAX_PINS_EXCEEDED');
}

// Insert pin
await db.insert(userPinnedSops).values({
  userId,
  sopTypeId,
  pinnedAt: new Date(),
});
```

#### 4. unpinSopType(userId: string, sopTypeId: string)
```typescript
await db
  .delete(userPinnedSops)
  .where(
    and(
      eq(userPinnedSops.userId, userId),
      eq(userPinnedSops.sopTypeId, sopTypeId)
    )
  );
```

#### 5. getUserPinnedSops(userId: string)
```typescript
// Get user's pinned SOPs with full details
SELECT sop_types.*, user_pinned_sops.pinned_at
FROM user_pinned_sops
JOIN sop_types ON user_pinned_sops.sop_type_id = sop_types.id
WHERE user_pinned_sops.user_id = ?
ORDER BY user_pinned_sops.pinned_at ASC
```

---

## UI/UX Enhancements

### Admin Page: app/(admin)/admin/sop-types/page.tsx

#### 1. Drag-and-Drop Interface

**Visual Elements**:
- **Grab Handle**: `<GripVertical className="h-5 w-5 text-gray-400" />`
- **Sortable Row**: Each table row is draggable
- **Cursor Change**: `cursor-grab` on hover, `cursor-grabbing` while dragging

**Implementation**:
```tsx
<DndContext
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragEnd={handleDragEnd}
>
  <SortableContext
    items={sopTypes.map(s => s.id)}
    strategy={verticalListSortingStrategy}
  >
    {sopTypes.map(sop => (
      <SortableRow key={sop.id} sop={sop} />
    ))}
  </SortableContext>
</DndContext>
```

**Auto-Save Logic**:
```tsx
const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over || active.id === over.id) return;

  // Reorder local state
  const oldIndex = sopTypes.findIndex(s => s.id === active.id);
  const newIndex = sopTypes.findIndex(s => s.id === over.id);
  const newOrder = arrayMove(sopTypes, oldIndex, newIndex);
  setSopTypes(newOrder);

  // Save to database
  await fetch('/api/admin/sop-types/reorder', {
    method: 'POST',
    body: JSON.stringify({ orderedIds: newOrder.map(s => s.id) }),
  });
};
```

---

#### 2. Pin/Favorite System

**Header Pin Counter**:
```tsx
<div className="flex items-center gap-2 text-sm text-muted-foreground">
  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
  <span className="font-medium">{pinnedCount}/3 Pinned</span>
</div>
```

**Star Icon in Table**:
```tsx
<Button
  size="sm"
  variant="ghost"
  onClick={() => handleTogglePin(sop.id)}
  disabled={!sop.isPinned && pinnedCount >= 3}
  title={
    sop.isPinned 
      ? "Unpin this SOP" 
      : pinnedCount >= 3 
        ? "Maximum 3 pins reached. Unpin one first." 
        : "Pin this SOP for quick access"
  }
>
  <Star 
    className={cn(
      "h-4 w-4",
      sop.isPinned 
        ? "text-yellow-500 fill-yellow-500" 
        : "text-gray-400"
    )}
  />
</Button>
```

**Client-Side Validation**:
```tsx
const handleTogglePin = async (sopId: string) => {
  const sop = sopTypes.find(s => s.id === sopId);
  if (!sop) return;

  // Prevent API call if max limit reached
  if (!sop.isPinned && pinnedCount >= 3) {
    toast.error('Maximum 3 pins reached', {
      description: 'Please unpin one SOP before adding another.',
    });
    return;
  }

  // Make API call
  const method = sop.isPinned ? 'DELETE' : 'POST';
  const res = await fetch(`/api/sop-types/${sopId}/pin`, { method });
  
  // Refresh data
  if (res.ok) {
    await fetchSopTypes();
    toast.success(sop.isPinned ? 'Unpinned' : 'Pinned successfully');
  }
};
```

---

#### 3. Removed Features

**Before** (Manual sortOrder):
```tsx
<Input
  type="number"
  value={formData.sortOrder}
  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
/>
```

**After** (Drag-and-drop only):
- ✅ Removed sortOrder from form
- ✅ Removed numeric input field
- ✅ Database column still exists (managed by drag-drop)

---

## Bug Fixes

### Critical Bug: JSON Structure in Content Display

**Problem**: When editing existing SOPs, remnant text `","images":` appeared at the end of strategy content.

**Root Cause**:
- Old data stored full JSON structure in `detail_content_short/long` columns:
  ```json
  {"content":"<p>Strategy text</p>","images":[...],"notes":"Chart notes"}
  ```
- `sanitizeHtml` function used `DOMPurify` to extract HTML from this string
- DOMPurify returned: `<p>Strategy text</p>","images":` (HTML + JSON remnants)

**Investigation Steps**:
1. Added comprehensive console.log to trace data flow
2. Created `check-sop-content.ts` script to inspect database
3. Identified 2 SOPs with JSON in content columns: "Breakout" and "BB Mastery"
4. Understood: Migration 0006 added dedicated columns, but old data wasn't cleaned

**Solution**:
1. Created `fix-sop-json-content.ts` cleanup script:
   ```typescript
   // Find SOPs with JSON in content columns
   const sopsWithJson = sopTypes.filter(sop => 
     sop.detailContentShort?.includes('{"content"') || 
     sop.detailContentLong?.includes('{"content"')
   );

   // Extract and separate data
   for (const sop of sopsWithJson) {
     const jsonShort = JSON.parse(sop.detailContentShort);
     await updateSopDetail(sop.id, {
       detailContentShort: jsonShort.content,
       detailImagesShort: jsonShort.images,
       detailImageNotesShort: jsonShort.notes,
     });
   }
   ```

2. Ran script on staging database
3. Fixed 2 SOPs successfully
4. User confirmed bug resolved

**Prevention**:
- ✅ Admin API now separates content/images/notes before saving
- ✅ Migration 0006 provides dedicated columns
- ✅ Future data will be stored correctly

---

### Import Error Fix

**Problem**: `validateImageSize` import error in `app/api/admin/sop-types/[id]/route.ts`

**Error Message**:
```
Module '"@/lib/services/sopDetailService"' has no exported member 'validateImageSize'
```

**Root Cause**:
- Function was moved to `lib/utils/imageValidation.ts` but import wasn't updated

**Fix**:
```typescript
// Before
import { validateImageSize } from '@/lib/services/sopDetailService';

// After
import { validateImageSize } from '@/lib/utils/imageValidation';
```

---

## Testing

### Test Scenarios

#### Drag-and-Drop Sorting
- ✅ Drag SOP from top to bottom
- ✅ Drag SOP from bottom to top
- ✅ Drag SOP to middle position
- ✅ Order persists after page refresh
- ✅ Order syncs across admin users
- ✅ Grab handle cursor changes on hover

#### Pin/Unpin Functionality
- ✅ Pin 1st SOP (success)
- ✅ Pin 2nd SOP (success)
- ✅ Pin 3rd SOP (success)
- ✅ Try to pin 4th SOP (disabled button, tooltip shows message)
- ✅ Unpin 1 SOP (counter decreases to 2/3)
- ✅ Pin another SOP (counter increases to 3/3)
- ✅ Pinned SOPs appear first in strategies page
- ✅ Pin counter badge updates in real-time
- ✅ Star icons fill correctly

#### Client-Side Validation
- ✅ Pin button disabled when max reached
- ✅ Toast notification shows error message
- ✅ Tooltip explains why button is disabled
- ✅ No API call made when disabled

#### Server-Side Validation
- ✅ POST /pin returns MAX_PINS_EXCEEDED when at limit
- ✅ POST /pin returns ALREADY_PINNED when duplicate
- ✅ DELETE /pin succeeds even if not pinned
- ✅ Unauthorized users get 401 error

#### Content Display
- ✅ No JSON structure visible in strategy content
- ✅ Images display correctly
- ✅ Chart notes display correctly
- ✅ HTML sanitization works properly

---

## Production Deployment

### Pre-Deployment Checklist

#### Database Migration
```bash
# Check staging database
turso db show wekangtrading-staging

# Apply migration 0007 to production
turso db shell wekangtrading-prod < drizzle/migrations/0007_add_user_pinned_sops.sql

# Verify table created
SELECT name FROM sqlite_master WHERE type='table' AND name='user_pinned_sops';
```

#### Data Cleanup (If Needed)
```bash
# Check for JSON in content columns
SELECT id, name 
FROM sop_types 
WHERE detail_content_short LIKE '%{"content"%' 
   OR detail_content_long LIKE '%{"content"%';

# If any found, run cleanup script
tsx scripts/fix-sop-json-content.ts
```

#### Code Deployment
```bash
# Verify build succeeds
npm run build

# Deploy to Vercel
vercel --prod

# Monitor for errors
vercel logs --follow
```

---

### Post-Deployment Verification

#### Admin Tests
- [ ] Login as admin
- [ ] Navigate to SOP Types page
- [ ] Drag and drop a SOP
- [ ] Verify order saved (refresh page)
- [ ] Pin 3 SOPs
- [ ] Verify star icons filled
- [ ] Try to pin 4th (should be disabled)
- [ ] Unpin 1 SOP
- [ ] Pin another SOP

#### User Tests
- [ ] Login as regular user
- [ ] Navigate to Strategies page
- [ ] Verify pinned SOPs appear first
- [ ] Verify star icons visible
- [ ] Pin/unpin from strategies page (if implemented)
- [ ] Verify content displays without JSON remnants

#### Database Tests
```sql
-- Check pin counts per user
SELECT user_id, COUNT(*) as pin_count 
FROM user_pinned_sops 
GROUP BY user_id;

-- Verify no user has more than 3 pins
SELECT user_id, COUNT(*) as pin_count 
FROM user_pinned_sops 
GROUP BY user_id 
HAVING COUNT(*) > 3;

-- Check sort order is sequential
SELECT id, name, sort_order 
FROM sop_types 
WHERE is_active = 1 
ORDER BY sort_order;
```

---

## Performance Considerations

### Database Query Optimization
- ✅ **Indexes**: `user_pinned_sops_user_id_idx` and `user_pinned_sops_sop_type_id_idx` ensure fast lookups
- ✅ **LEFT JOIN**: Efficient query to get pinned status without separate API call
- ✅ **Batch Updates**: Reorder uses loop but could be optimized with CASE statement for large datasets

### Frontend Performance
- ✅ **Client-Side Validation**: Prevents unnecessary API calls
- ✅ **Optimistic Updates**: UI updates immediately, API call happens in background
- ✅ **Debouncing**: Not needed (drag happens once, no rapid-fire events)
- ✅ **Bundle Size**: @dnd-kit adds ~20KB gzipped (acceptable)

### Scalability
- **Current Load**: 5 users × 15 SOPs = 75 total SOPs, 15 max pins
- **Expected Load**: 10 users × 20 SOPs = 200 total SOPs, 30 max pins
- **Performance**: Current architecture scales to 100+ users without issues

---

## Future Enhancements

### Possible Improvements
1. **Global Pins** (Admin): Admin sets top 3 recommended SOPs for all users
2. **Pin Sorting**: Allow users to reorder their pinned SOPs
3. **Pin Icons**: Custom icon per SOP (beyond star)
4. **Pin Categories**: Separate pins for SHORT vs LONG strategies
5. **Drag-Drop on Mobile**: Test and optimize touch gestures
6. **Undo Reorder**: Add undo button after drag-drop
7. **Batch Reorder**: Select multiple SOPs and move together

### Not Planned
- ❌ More than 3 pins (design decision for focus)
- ❌ Nested drag-drop (SOPs don't have hierarchy)
- ❌ Drag to delete (too risky, better to use explicit delete button)

---

## Lessons Learned

### What Went Well
- ✅ @dnd-kit library was easy to integrate
- ✅ Composite PK design worked perfectly for user-specific pins
- ✅ Client-side validation improved UX significantly
- ✅ Cleanup script automated tedious data migration

### Challenges Faced
- ⚠️ JSON in content columns (unexpected legacy data)
- ⚠️ Import errors (function moved but import not updated)
- ⚠️ Max pin limit UX (initially showed API error, now client-side validation)

### Best Practices
- ✅ Always validate both client and server side
- ✅ Use tooltips to explain disabled states
- ✅ Real-time feedback (toast notifications, loading spinners)
- ✅ Comprehensive error codes (MAX_PINS_EXCEEDED, ALREADY_PINNED)
- ✅ Database cleanup scripts for data migrations

---

## References

### Documentation
- [@dnd-kit Docs](https://docs.dndkit.com/)
- [Drizzle ORM Composite Keys](https://orm.drizzle.team/docs/sql-schema-declaration#composite-primary-key)
- [Radix UI Tooltip](https://www.radix-ui.com/primitives/docs/components/tooltip)

### Files Modified
1. `app/(admin)/admin/sop-types/page.tsx` (977 lines)
2. `lib/services/sopTypeService.ts` (338 lines)
3. `lib/db/schema/userPinnedSops.ts` (NEW - 23 lines)
4. `drizzle/migrations/0007_add_user_pinned_sops.sql` (NEW)
5. `app/api/admin/sop-types/reorder/route.ts` (NEW - 58 lines)
6. `app/api/sop-types/[id]/pin/route.ts` (NEW - 83 lines)
7. `app/api/admin/sop-types/[id]/route.ts` (import fix)

### Related Features
- Feature 5 Phase 1: Database schema (SHORT/LONG separation)
- Feature 5 Phase 3: Admin UI with Tiptap editor
- Feature 5 Phase 5: Mobile responsiveness

---

**Document Version**: 1.0  
**Last Updated**: January 25, 2026  
**Author**: AI Assistant (GitHub Copilot)  
**Status**: ✅ COMPLETE & MERGED TO DEVELOP
