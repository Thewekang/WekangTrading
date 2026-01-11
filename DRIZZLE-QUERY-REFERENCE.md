# 🔄 Drizzle Migration Quick Reference

**Purpose**: Quick lookup for Prisma → Drizzle query conversions  
**Date**: January 11, 2026  
**Migration Status**: ✅ **COMPLETE** - All 12 services migrated successfully

> **Note**: This is a reference guide for Drizzle ORM query patterns.  
> For migration completion summary, see [DRIZZLE-MIGRATION-COMPLETE.md](DRIZZLE-MIGRATION-COMPLETE.md)

---

## 📦 Imports

### Prisma
```typescript
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
```

### Drizzle
```typescript
import { db } from '@/lib/db';
import { eq, and, or, desc, asc, sql, count, sum, avg } from 'drizzle-orm';
import { users, individualTrades, dailySummaries } from '@/lib/db/schema';
import type { User, IndividualTrade, DailySummary } from '@/lib/db/schema';
```

---

## 🔍 SELECT Queries

### Find Many
```typescript
// PRISMA
const trades = await prisma.individualTrade.findMany({
  where: { userId },
  orderBy: { tradeTimestamp: 'desc' },
  take: 10,
  skip: 0,
});

// DRIZZLE
const trades = await db
  .select()
  .from(individualTrades)
  .where(eq(individualTrades.userId, userId))
  .orderBy(desc(individualTrades.tradeTimestamp))
  .limit(10)
  .offset(0);
```

### Find First
```typescript
// PRISMA
const user = await prisma.user.findFirst({
  where: { email },
});

// DRIZZLE
const [user] = await db
  .select()
  .from(users)
  .where(eq(users.email, email))
  .limit(1);
```

### Find Unique (by ID)
```typescript
// PRISMA
const trade = await prisma.individualTrade.findUnique({
  where: { id },
});

// DRIZZLE
const [trade] = await db
  .select()
  .from(individualTrades)
  .where(eq(individualTrades.id, id))
  .limit(1);
```

### Select Specific Fields
```typescript
// PRISMA
const users = await prisma.user.findMany({
  select: { id: true, email: true, name: true },
});

// DRIZZLE
const users = await db
  .select({
    id: users.id,
    email: users.email,
    name: users.name,
  })
  .from(users);
```

---

## ✏️ INSERT Queries

### Create Single
```typescript
// PRISMA
const trade = await prisma.individualTrade.create({
  data: {
    userId,
    result: 'WIN',
    sopFollowed: true,
    profitLossUsd: 100,
    tradeTimestamp: new Date(),
    marketSession: 'ASIA',
  },
});

// DRIZZLE
const [trade] = await db
  .insert(individualTrades)
  .values({
    userId,
    result: 'WIN',
    sopFollowed: true,
    profitLossUsd: 100,
    tradeTimestamp: new Date(),
    marketSession: 'ASIA',
  })
  .returning();
```

### Create Many
```typescript
// PRISMA
await prisma.individualTrade.createMany({
  data: [
    { userId, result: 'WIN', ... },
    { userId, result: 'LOSS', ... },
  ],
});

// DRIZZLE
await db
  .insert(individualTrades)
  .values([
    { userId, result: 'WIN', ... },
    { userId, result: 'LOSS', ... },
  ]);
```

---

## 🔄 UPDATE Queries

### Update Single
```typescript
// PRISMA
const updated = await prisma.individualTrade.update({
  where: { id },
  data: { result: 'LOSS', profitLossUsd: -50 },
});

// DRIZZLE
const [updated] = await db
  .update(individualTrades)
  .set({ result: 'LOSS', profitLossUsd: -50 })
  .where(eq(individualTrades.id, id))
  .returning();
```

### Update Many
```typescript
// PRISMA
await prisma.user.updateMany({
  where: { role: 'USER' },
  data: { resetCount: 0 },
});

// DRIZZLE
await db
  .update(users)
  .set({ resetCount: 0 })
  .where(eq(users.role, 'USER'));
```

---

## 🗑️ DELETE Queries

### Delete Single
```typescript
// PRISMA
await prisma.individualTrade.delete({
  where: { id },
});

// DRIZZLE
await db
  .delete(individualTrades)
  .where(eq(individualTrades.id, id));
```

### Delete Many
```typescript
// PRISMA
await prisma.session.deleteMany({
  where: { expires: { lt: new Date() } },
});

// DRIZZLE
import { lt } from 'drizzle-orm';

await db
  .delete(sessions)
  .where(lt(sessions.expires, new Date()));
```

---

## 🔢 AGGREGATE Queries

### Count
```typescript
// PRISMA
const total = await prisma.individualTrade.count({
  where: { userId, result: 'WIN' },
});

// DRIZZLE
const [result] = await db
  .select({ count: count() })
  .from(individualTrades)
  .where(and(
    eq(individualTrades.userId, userId),
    eq(individualTrades.result, 'WIN')
  ));
const total = result.count;
```

### Sum
```typescript
// PRISMA
const result = await prisma.individualTrade.aggregate({
  where: { userId },
  _sum: { profitLossUsd: true },
});
const totalProfit = result._sum.profitLossUsd;

// DRIZZLE
const [result] = await db
  .select({ total: sum(individualTrades.profitLossUsd) })
  .from(individualTrades)
  .where(eq(individualTrades.userId, userId));
const totalProfit = result.total;
```

### Average
```typescript
// PRISMA
const result = await prisma.individualTrade.aggregate({
  where: { userId },
  _avg: { profitLossUsd: true },
});

// DRIZZLE
const [result] = await db
  .select({ average: avg(individualTrades.profitLossUsd) })
  .from(individualTrades)
  .where(eq(individualTrades.userId, userId));
```

---

## 🔗 JOINS

### Basic Join
```typescript
// PRISMA
const trades = await prisma.individualTrade.findMany({
  where: { userId },
  include: { user: true },
});

// DRIZZLE
const trades = await db
  .select({
    id: individualTrades.id,
    result: individualTrades.result,
    userName: users.name,
    userEmail: users.email,
  })
  .from(individualTrades)
  .leftJoin(users, eq(individualTrades.userId, users.id))
  .where(eq(individualTrades.userId, userId));
```

---

## 🎯 WHERE Conditions

### AND
```typescript
// PRISMA
where: {
  userId,
  result: 'WIN',
  sopFollowed: true,
}

// DRIZZLE
where(and(
  eq(individualTrades.userId, userId),
  eq(individualTrades.result, 'WIN'),
  eq(individualTrades.sopFollowed, true)
))
```

### OR
```typescript
// PRISMA
where: {
  OR: [
    { result: 'WIN' },
    { sopFollowed: true },
  ],
}

// DRIZZLE
where(or(
  eq(individualTrades.result, 'WIN'),
  eq(individualTrades.sopFollowed, true)
))
```

### Comparison Operators
```typescript
// PRISMA
where: {
  profitLossUsd: { gt: 0 },
  tradeTimestamp: { gte: startDate, lte: endDate },
}

// DRIZZLE
import { gt, gte, lte } from 'drizzle-orm';

where(and(
  gt(individualTrades.profitLossUsd, 0),
  gte(individualTrades.tradeTimestamp, startDate),
  lte(individualTrades.tradeTimestamp, endDate)
))
```

### IN Operator
```typescript
// PRISMA
where: {
  marketSession: { in: ['ASIA', 'EUROPE'] },
}

// DRIZZLE
import { inArray } from 'drizzle-orm';

where(inArray(individualTrades.marketSession, ['ASIA', 'EUROPE']))
```

### LIKE (contains)
```typescript
// PRISMA
where: {
  email: { contains: '@example.com' },
}

// DRIZZLE
import { like } from 'drizzle-orm';

where(like(users.email, '%@example.com%'))
```

---

## 📊 GROUP BY

```typescript
// PRISMA
const sessionStats = await prisma.individualTrade.groupBy({
  by: ['marketSession'],
  where: { userId },
  _count: true,
  _sum: { profitLossUsd: true },
});

// DRIZZLE
const sessionStats = await db
  .select({
    marketSession: individualTrades.marketSession,
    count: count(),
    totalProfit: sum(individualTrades.profitLossUsd),
  })
  .from(individualTrades)
  .where(eq(individualTrades.userId, userId))
  .groupBy(individualTrades.marketSession);
```

---

## 🔄 UPSERT (Insert or Update)

```typescript
// PRISMA
await prisma.dailySummary.upsert({
  where: { userId_tradeDate: { userId, tradeDate } },
  create: { userId, tradeDate, totalTrades: 1, ... },
  update: { totalTrades: { increment: 1 }, ... },
});

// DRIZZLE
// Method 1: INSERT ... ON CONFLICT (best for Turso)
await db
  .insert(dailySummaries)
  .values({ userId, tradeDate, totalTrades: 1, ... })
  .onConflictDoUpdate({
    target: [dailySummaries.userId, dailySummaries.tradeDate],
    set: { totalTrades: sql`${dailySummaries.totalTrades} + 1` },
  });

// Method 2: Check and Insert/Update
const [existing] = await db
  .select()
  .from(dailySummaries)
  .where(and(
    eq(dailySummaries.userId, userId),
    eq(dailySummaries.tradeDate, tradeDate)
  ))
  .limit(1);

if (existing) {
  await db
    .update(dailySummaries)
    .set({ totalTrades: existing.totalTrades + 1 })
    .where(eq(dailySummaries.id, existing.id));
} else {
  await db
    .insert(dailySummaries)
    .values({ userId, tradeDate, totalTrades: 1, ... });
}
```

---

## 🧪 Transactions

```typescript
// PRISMA
await prisma.$transaction([
  prisma.individualTrade.create({ data: tradeData }),
  prisma.dailySummary.update({ where: { id }, data: summaryData }),
]);

// DRIZZLE
await db.transaction(async (tx) => {
  await tx.insert(individualTrades).values(tradeData);
  await tx.update(dailySummaries).set(summaryData).where(eq(dailySummaries.id, id));
});
```

---

## 📅 Date Handling

### Date Comparison
```typescript
// PRISMA
where: {
  tradeTimestamp: {
    gte: startOfDay(date),
    lte: endOfDay(date),
  },
}

// DRIZZLE
import { and, gte, lte } from 'drizzle-orm';

where(and(
  gte(individualTrades.tradeTimestamp, startOfDay(date)),
  lte(individualTrades.tradeTimestamp, endOfDay(date))
))
```

### Date Extraction (SQL)
```typescript
// PRISMA
// Use raw query

// DRIZZLE
const trades = await db
  .select({
    date: sql`DATE(${individualTrades.tradeTimestamp} / 1000, 'unixepoch')`,
    count: count(),
  })
  .from(individualTrades)
  .groupBy(sql`DATE(${individualTrades.tradeTimestamp} / 1000, 'unixepoch')`);
```

---

## 🎯 Common Operators Reference

| Operator | Import | Usage |
|----------|--------|-------|
| `eq` | `drizzle-orm` | `eq(column, value)` |
| `ne` | `drizzle-orm` | `ne(column, value)` |
| `gt` | `drizzle-orm` | `gt(column, value)` |
| `gte` | `drizzle-orm` | `gte(column, value)` |
| `lt` | `drizzle-orm` | `lt(column, value)` |
| `lte` | `drizzle-orm` | `lte(column, value)` |
| `and` | `drizzle-orm` | `and(condition1, condition2)` |
| `or` | `drizzle-orm` | `or(condition1, condition2)` |
| `inArray` | `drizzle-orm` | `inArray(column, [val1, val2])` |
| `like` | `drizzle-orm` | `like(column, '%pattern%')` |
| `count` | `drizzle-orm` | `count()` or `count(column)` |
| `sum` | `drizzle-orm` | `sum(column)` |
| `avg` | `drizzle-orm` | `avg(column)` |
| `min` | `drizzle-orm` | `min(column)` |
| `max` | `drizzle-orm` | `max(column)` |

---

## ⚠️ Important Differences

### 1. Timestamps
- **Prisma**: Handles Date objects automatically
- **Drizzle**: Stores as Unix timestamp (milliseconds), converts with `{ mode: 'timestamp' }`

### 2. Booleans
- **Prisma**: Native boolean type
- **Drizzle**: Stored as INTEGER (0/1), converts with `{ mode: 'boolean' }`

### 3. Enums
- **Prisma**: Database-level enums
- **Drizzle**: Check constraints with `text({ enum: [...] })`

### 4. Relations
- **Prisma**: Automatic relation resolution with `include`
- **Drizzle**: Manual joins required

### 5. Returning Values
- **Prisma**: Automatically returns created/updated record
- **Drizzle**: Need `.returning()` to get values back

---

## 🚀 Performance Tips

1. **Use indexes** - Already defined in schema
2. **Select only needed fields** - Don't use `select()` without fields
3. **Limit results** - Always use `.limit()` for lists
4. **Batch operations** - Use `values([...])` for multiple inserts
5. **Prepared statements** - Drizzle automatically prepares queries

---

**Last Updated**: January 11, 2026  
**Reference**: Drizzle ORM Documentation - https://orm.drizzle.team/docs/
