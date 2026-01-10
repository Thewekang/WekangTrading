# Reset Count Tracking Feature

**Date**: January 10, 2026  
**Feature**: Admin can view how many times each user has reset their account  
**Status**: ✅ COMPLETE

---

## Overview

This feature adds a "Resets" column to the Admin Users page that displays how many times each user has used the account reset functionality. This helps admins monitor user behavior and identify users who may need assistance or coaching.

---

## Implementation Details

### Database Changes

**Field Added**: `resetCount` to `users` table

```prisma
model User {
  // ... existing fields
  resetCount    Int       @default(0) @map("reset_count")
  // ... rest of fields
}
```

**Migration**: `20260110042500_add_reset_count_to_users`
- Adds `reset_count` column with default value of 0
- Applied to existing users (all start at 0)

---

### Service Layer Update

**File**: `lib/services/userSettingsService.ts`

**Function**: `resetUserAccount()`

**Change**: Added increment operation in the transaction:

```typescript
// Increment reset count
await tx.user.update({
  where: { id: userId },
  data: { resetCount: { increment: 1 } },
});
```

**Behavior**:
- Every time a user resets their account, `resetCount` increments by 1
- Happens atomically in the same transaction as data deletion
- Cannot fail partially (transaction ensures consistency)

---

### API Update

**File**: `app/api/admin/users/route.ts`

**Changes**:
1. Added `resetCount: true` to Prisma select
2. Included `resetCount` in API response

**Response Format**:
```json
{
  "success": true,
  "data": [
    {
      "userId": "...",
      "userName": "John Doe",
      "userEmail": "john@example.com",
      "userRole": "USER",
      "resetCount": 2,
      "createdAt": "...",
      "totalTrades": 150,
      // ... other stats
    }
  ]
}
```

---

### UI Updates

**File**: `app/(admin)/admin/users/page.tsx`

#### Interface Change
```typescript
interface User {
  // ... existing fields
  resetCount?: number;
}

type SortField = 'name' | 'email' | 'winRate' | 'sopRate' | 'netProfitLoss' | 'totalTrades' | 'resetCount';
```

#### Table Header
Added new column header with sorting:
```tsx
<th className="text-right p-4 cursor-pointer" onClick={() => handleSort('resetCount')}>
  Resets {sortField === 'resetCount' && (sortDirection === 'asc' ? '↑' : '↓')}
</th>
```

#### Table Cell
Display reset count with color coding:
```tsx
<td className="text-right p-4">
  <span className={`font-semibold ${(user.resetCount ?? 0) > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
    {user.resetCount ?? 0}x
  </span>
</td>
```

**Visual Design**:
- 0 resets: Gray text (normal)
- 1+ resets: Orange text (attention)
- Format: "2x" (number followed by 'x')
- Right-aligned with other numeric columns

#### Sorting Logic
Added resetCount to sort handling:
```typescript
if (sortField === 'resetCount') {
  aValue = a.resetCount ?? 0;
  bValue = b.resetCount ?? 0;
}
```

---

## User Experience

### Admin View
1. Navigate to `/admin/users`
2. See new "Resets" column in user table
3. Click header to sort by reset count (ascending/descending)
4. Identify users with multiple resets at a glance

### Color Coding
- **Gray (0x)**: User has never reset their account
- **Orange (1x, 2x, etc.)**: User has reset their account one or more times

### Typical Values
- 0 resets: Normal, user is actively trading
- 1 reset: User experimented with feature or had a fresh start
- 2-3 resets: User may need guidance or is testing
- 4+ resets: Consider reaching out for coaching

---

## Business Use Cases

### 1. Identify Users Needing Help
**Scenario**: User has reset 3+ times in a short period
**Action**: Admin reaches out to provide coaching or support
**Benefit**: Improve user retention and trading performance

### 2. Monitor Feature Usage
**Scenario**: Track how many users utilize the reset feature
**Action**: Analyze reset patterns across user base
**Benefit**: Understand user behavior and feature adoption

### 3. Performance Analysis
**Scenario**: Compare performance of users with 0 resets vs multiple resets
**Action**: Look for correlations between resets and trading success
**Benefit**: Identify if resets help or hinder user progress

### 4. Data Quality Assurance
**Scenario**: User reports issues with account data
**Action**: Check reset count to see if user recently cleared data
**Benefit**: Faster troubleshooting and support

---

## Testing

### Test Scenario 1: Initial State
1. Check existing users in admin page
2. **Expected**: All users show "0x" in gray (no resets yet)

### Test Scenario 2: After Reset
1. Login as test user
2. Navigate to Settings → Reset Account
3. Complete reset with confirmation phrase
4. Logout and login as admin
5. Navigate to `/admin/users`
6. **Expected**: Test user shows "1x" in orange

### Test Scenario 3: Multiple Resets
1. Reset same user account 2 more times
2. Check admin page
3. **Expected**: User shows "3x" in orange

### Test Scenario 4: Sorting
1. Click "Resets" column header
2. **Expected**: Users sorted by reset count (ascending)
3. Click again
4. **Expected**: Users sorted by reset count (descending)

### Test Scenario 5: API Response
```javascript
// In browser console on /admin/users
fetch('/api/admin/users')
  .then(r => r.json())
  .then(data => console.log(data.data[0].resetCount))

// Expected: Number (0 or higher)
```

---

## Technical Notes

### Transaction Safety
The reset count increment happens in the same transaction as data deletion:
- If deletion fails, count doesn't increment
- If increment fails, deletion rolls back
- Ensures data consistency

### Default Values
- New users: `resetCount` = 0
- Existing users (after migration): `resetCount` = 0
- No manual initialization needed

### Nullable Handling
The field is NOT nullable in database but handled as optional in TypeScript:
```typescript
resetCount?: number;  // Optional in interface
user.resetCount ?? 0  // Fallback to 0 in UI
```

This allows graceful handling if API doesn't return the field.

---

## Future Enhancements

### 1. Reset History Log
Track **when** each reset occurred:
```typescript
model ResetHistory {
  id        String   @id @default(uuid())
  userId    String
  resetAt   DateTime @default(now())
  user      User     @relation(...)
}
```

### 2. Reset Reason
Ask users why they're resetting:
```typescript
{
  reason: 'FRESH_START' | 'TESTING' | 'DATA_ERROR' | 'OTHER'
  notes: string
}
```

### 3. Reset Limit
Prevent excessive resets:
```typescript
if (user.resetCount >= MAX_RESETS_PER_MONTH) {
  throw new Error('Monthly reset limit reached');
}
```

### 4. Admin Alert
Notify admin when user resets 3+ times:
```typescript
if (newResetCount >= 3) {
  await sendAdminNotification(`User ${userName} has reset ${newResetCount} times`);
}
```

### 5. Reset Analytics Dashboard
Show metrics:
- Total resets this month
- Users with most resets
- Average resets per user
- Reset frequency over time

---

## Files Modified

1. ✅ `prisma/schema.prisma` - Added resetCount field
2. ✅ `prisma/migrations/20260110042500_add_reset_count_to_users/migration.sql` - Migration file
3. ✅ `lib/services/userSettingsService.ts` - Increment count in transaction
4. ✅ `app/api/admin/users/route.ts` - Include resetCount in API response
5. ✅ `app/(admin)/admin/users/page.tsx` - Display and sort by reset count

---

## Build Status

✅ Prisma migration created and applied  
✅ TypeScript compilation successful  
✅ Next.js build passed  
✅ All pages generated without errors  
✅ API endpoints validated

---

## Completion Checklist

- [x] Database field added (resetCount)
- [x] Migration created and applied
- [x] Service layer updated (increment in transaction)
- [x] API endpoint includes resetCount
- [x] UI displays reset count
- [x] Sorting functionality works
- [x] Color coding implemented (gray/orange)
- [x] TypeScript interfaces updated
- [x] Build successful
- [x] Documentation created

---

**Feature Complete**: January 10, 2026  
**Ready for Testing**: Yes  
**Breaking Changes**: None  
**Database Impact**: New column (backward compatible)

---

**Usage**: Navigate to `/admin/users` to see the new "Resets" column. Click header to sort by reset count.
