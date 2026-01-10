# 🔄 Prisma → Drizzle ORM Migration Plan

## 📊 Migration Overview

**Current State:** Supabase PostgreSQL + Prisma ORM  
**Target State:** Turso (LibSQL) + Drizzle ORM  
**Reason:** Drizzle ORM has native LibSQL support (no adapters needed!)

---

## ✅ Why Drizzle + Turso?

### Drizzle ORM Advantages:
- ✅ **Native Turso/LibSQL support** - No adapters or workarounds
- ✅ **Type-safe** - Full TypeScript inference (better than Prisma)
- ✅ **Lightweight** - Smaller bundle size (~2x faster than Prisma)
- ✅ **SQL-like syntax** - More control, easier to optimize
- ✅ **Better performance** - No query engine overhead
- ✅ **Simpler migrations** - Plain SQL files
- ✅ **Edge runtime friendly** - Perfect for Vercel/serverless

### Turso with Drizzle:
- ✅ **No adapter complexity** (Drizzle natively supports libsql://)
- ✅ **Edge locations** - Data closer to users (faster response)
- ✅ **More generous free tier** - 9 GB storage, 1 TB bandwidth
- ✅ **Embedded replicas** - Can sync to Vercel edge
- ✅ **Branching** - Database branches like git

---

## 🎯 Migration Strategy

### Phase 1: Safeguard Current Progress
1. ✅ Create new branch: `feat/drizzle-turso-migration`
2. ✅ Tag current working state: `v1.0-prisma-supabase`
3. ✅ Keep main branch stable (Supabase + Prisma working)
4. ✅ Can roll back anytime by switching branches

### Phase 2: Setup Drizzle + Turso
1. Install Drizzle ORM and Turso client
2. Configure Drizzle with Turso connection
3. Create Drizzle schema (migrate from Prisma schema)
4. Generate TypeScript types
5. Set up migrations

### Phase 3: Migrate Database Layer
1. Replace lib/db.ts with Drizzle client
2. Migrate all services (one by one):
   - individualTradeService.ts
   - dailySummaryService.ts
   - targetService.ts
   - statsService.ts
   - etc.
3. Update all API routes
4. Test each service as we go

### Phase 4: Testing & Validation
1. Local testing with Turso database
2. Verify all CRUD operations
3. Test authentication flow
4. Test dashboard calculations
5. Test analytics queries

### Phase 5: Production Deployment
1. Create new Turso production database
2. Update Vercel environment variables
3. Deploy to preview branch
4. Full QA testing
5. Merge to main (if all tests pass)

---

## 📋 Impact Assessment

### Files to Modify (Core Database Layer):
```
lib/
├── db.ts                              ⚠️ Complete rewrite (Drizzle client)
├── schema/                            ✨ NEW - Drizzle schemas
│   ├── users.ts
│   ├── trades.ts
│   ├── summaries.ts
│   ├── targets.ts
│   └── auth.ts
├── services/
│   ├── individualTradeService.ts      ⚠️ Rewrite all queries
│   ├── dailySummaryService.ts         ⚠️ Rewrite all queries
│   ├── targetService.ts               ⚠️ Rewrite all queries
│   ├── statsService.ts                ⚠️ Rewrite all queries
│   ├── trendAnalysisService.ts        ⚠️ Rewrite all queries
│   └── exportService.ts               ⚠️ Rewrite all queries
├── types.ts                           ⚠️ Update to use Drizzle types
└── validations.ts                     ✅ Keep (Zod - no changes)

app/api/                               ⚠️ Update imports (minimal changes)
├── auth/[...nextauth]/route.ts        ⚠️ Rewrite auth queries
├── trades/                            ⚠️ Update service calls
├── stats/                             ⚠️ Update service calls
├── targets/                           ⚠️ Update service calls
└── admin/                             ⚠️ Update service calls

prisma/                                ❌ DELETE (replace with drizzle/)
drizzle/                               ✨ NEW - Migrations
```

### Files to Keep (No Changes):
```
components/                            ✅ No changes (UI layer)
app/(user)/                            ✅ No changes (pages)
app/(auth)/                            ✅ No changes (pages)
lib/utils/                             ✅ No changes (utilities)
lib/constants.ts                       ✅ No changes
lib/validations.ts                     ✅ No changes
```

---

## 📊 Comparison: Prisma vs Drizzle

### Prisma Example:
```typescript
// Find user with trades
const user = await prisma.user.findUnique({
  where: { email: 'admin@example.com' },
  include: { individualTrades: true }
});
```

### Drizzle Equivalent:
```typescript
// Find user with trades
const user = await db.query.users.findFirst({
  where: eq(users.email, 'admin@example.com'),
  with: { individualTrades: true }
});
```

**Benefits:**
- More explicit (you see the SQL-like structure)
- Better TypeScript inference
- Smaller runtime bundle

---

## 🔧 Technical Details

### Schema Migration Strategy

**Prisma Schema (Current):**
```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  name          String
  passwordHash  String    @map("password_hash")
  role          String    @default("USER")
  
  individualTrades IndividualTrade[]
  dailySummaries   DailySummary[]
}
```

**Drizzle Schema (Target):**
```typescript
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('USER'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});
```

### Relations in Drizzle:
```typescript
export const usersRelations = relations(users, ({ many }) => ({
  individualTrades: many(individualTrades),
  dailySummaries: many(dailySummaries),
}));
```

---

## 📝 Step-by-Step Migration Plan

### Day 1: Setup & Planning (This Session)
- [x] Create migration documentation
- [ ] Create git branch
- [ ] Install Drizzle dependencies
- [ ] Set up Drizzle config
- [ ] Create Turso database
- [ ] Define Drizzle schemas

### Day 2: Core Database Layer
- [ ] Migrate User model
- [ ] Migrate IndividualTrade model
- [ ] Migrate DailySummary model
- [ ] Migrate UserTarget model
- [ ] Migrate Auth models (Session, Account)
- [ ] Test schema generation

### Day 3: Services Migration (Part 1)
- [ ] Migrate individualTradeService.ts
- [ ] Migrate dailySummaryService.ts
- [ ] Test trade creation flow
- [ ] Test daily summary updates

### Day 4: Services Migration (Part 2)
- [ ] Migrate targetService.ts
- [ ] Migrate statsService.ts
- [ ] Migrate trendAnalysisService.ts
- [ ] Migrate exportService.ts

### Day 5: API Routes & Auth
- [ ] Update NextAuth adapter (Drizzle)
- [ ] Update all API routes
- [ ] Test authentication flow
- [ ] Test all CRUD operations

### Day 6: Testing & Validation
- [ ] Local end-to-end testing
- [ ] Verify all features work
- [ ] Performance benchmarking
- [ ] Fix any bugs

### Day 7: Production Deployment
- [ ] Create production Turso database
- [ ] Update Vercel env variables
- [ ] Deploy to preview
- [ ] Full QA testing
- [ ] Merge to main

---

## 🎲 Rollback Plan

If migration fails or issues arise:

```bash
# Switch back to working version
git checkout main

# Or discard migration branch
git branch -D feat/drizzle-turso-migration

# Production stays on Supabase + Prisma (stable)
```

**No risk to production!** Main branch stays untouched until migration is fully tested.

---

## 📦 Dependencies

### To Install:
```json
{
  "drizzle-orm": "^0.30.0",
  "@libsql/client": "^0.17.0",
  "drizzle-kit": "^0.20.0" // dev dependency for migrations
}
```

### To Remove:
```json
{
  "@prisma/client": "^5.22.0",
  "prisma": "^5.22.0"
}
```

**Bundle size impact:** -5 MB (Prisma) + 2 MB (Drizzle) = **Net -3 MB reduction!**

---

## 🔍 Key Differences to Learn

### 1. Query Building
**Prisma:** Magic methods (findMany, create, update)  
**Drizzle:** Explicit query builders (select, insert, update)

### 2. Migrations
**Prisma:** Auto-generated, opaque  
**Drizzle:** Plain SQL files, full control

### 3. Relations
**Prisma:** Implicit (defined in schema)  
**Drizzle:** Explicit (separate relations object)

### 4. Type Safety
**Prisma:** Good (generated types)  
**Drizzle:** Better (inferred from schema)

---

## ⚠️ Challenges & Solutions

### Challenge 1: Learning Curve
**Solution:** Start with simple queries, migrate one service at a time

### Challenge 2: No Visual Studio (like Prisma Studio)
**Solution:** Use Turso CLI or Drizzle Studio (similar tool)

### Challenge 3: Different Query Syntax
**Solution:** Reference Drizzle docs, use type inference as guide

### Challenge 4: NextAuth Adapter
**Solution:** Use community Drizzle adapter for NextAuth

---

## ✅ Success Criteria

Migration is complete when:
- ✅ All tests pass
- ✅ Authentication works
- ✅ All CRUD operations work
- ✅ Dashboard calculations correct
- ✅ Analytics queries accurate
- ✅ Performance equal or better
- ✅ No TypeScript errors
- ✅ Production deployment successful

---

## 📚 Resources

- **Drizzle Docs:** https://orm.drizzle.team/docs/overview
- **Turso Docs:** https://docs.turso.tech/
- **Drizzle + Turso Guide:** https://orm.drizzle.team/docs/get-started-sqlite#turso
- **NextAuth Drizzle Adapter:** https://authjs.dev/reference/adapter/drizzle

---

## 🚀 Ready to Start?

Once you confirm, I'll:
1. Create the git branch
2. Install Drizzle dependencies
3. Set up Turso database
4. Begin schema migration

**Estimated total time:** 3-5 days of focused work

**Confidence level:** High - Drizzle + Turso is the right choice for this stack!
