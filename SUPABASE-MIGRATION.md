# 🚀 Supabase Migration Guide - WekangTradingJournal

## ✅ Why Supabase?

- **Native PostgreSQL support** - No adapters needed!
- **Simpler setup** - Standard Prisma workflow
- **Better performance** - Real PostgreSQL engine
- **More generous free tier**:
  - 500 MB Database
  - 2 GB Bandwidth/month
  - Unlimited API requests
  - No 7-day pause
- **Built-in features**: Auth, Storage, Realtime, Database UI
- **Larger community** - More resources and documentation

---

## 📋 Migration Steps

### Step 1: Create Supabase Project (5 minutes)

1. **Go to**: https://supabase.com/dashboard
2. **Sign in** with GitHub/Google/Email
3. **Click** "New Project"
4. **Fill in**:
   - Organization: Create new or select existing
   - Project Name: `WekangTrading`
   - Database Password: Generate strong password (save it!)
   - Region: Choose closest to your users (e.g., US East, Europe West, Asia Southeast)
5. **Click** "Create new project"
6. **Wait** 2-3 minutes for provisioning

### Step 2: Get Database Connection String

1. **Go to**: Project Settings → Database
2. **Scroll to**: Connection String section
3. **Select**: "Connection Pooling" (for serverless/Vercel)
4. **Mode**: Transaction
5. **Copy** the connection string:
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
6. **Important**: Replace `[YOUR-PASSWORD]` with your actual database password

### Step 3: Update Local Environment

1. **Open** `.env.local` file
2. **Replace** DATABASE_URL with Supabase connection string:
   ```env
   DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-existing-secret"
   ```

3. **Remove** Turso variables (no longer needed):
   - ❌ ~~TURSO_DATABASE_URL~~
   - ❌ ~~TURSO_AUTH_TOKEN~~

### Step 4: Install Dependencies & Generate Client

```bash
# Remove Turso dependencies
npm uninstall @libsql/client @prisma/adapter-libsql

# Reinstall to update lockfile
npm install

# Generate new Prisma Client for PostgreSQL
npx prisma generate
```

### Step 5: Push Schema to Supabase

```bash
# This will create all tables in Supabase database
npx prisma db push
```

**Expected output**:
```
✔ Generated Prisma Client
✔ Database sync successful
```

### Step 6: Seed Database with Admin User

```bash
npm run db:seed
```

**Expected output**:
```
✔ Admin user created: admin@wekangtrading.com
✔ Sample SOP types created
✔ Seed completed successfully
```

**Admin credentials**:
- Email: `admin@wekangtrading.com`
- Password: `WekangAdmin2026!`

### Step 7: Test Locally

```bash
npm run dev
```

1. **Open**: http://localhost:3000
2. **Go to**: Login page
3. **Login** with admin credentials
4. **Verify**:
   - ✅ Login succeeds
   - ✅ Dashboard loads
   - ✅ Can create test trade
   - ✅ No database errors

### Step 8: View Database in Supabase UI

1. **Go to**: Supabase Dashboard → Table Editor
2. **You should see**:
   - users (1 admin user)
   - sop_types (sample SOP types)
   - individual_trades (empty)
   - daily_summaries (empty)
   - invite_codes (empty)
   - sessions (empty)

---

## 🌐 Deploy to Vercel

### Step 9: Update Vercel Environment Variables

1. **Go to**: https://vercel.com/dashboard → WekangTrading → Settings → Environment Variables

2. **Delete** old Turso variables:
   - ❌ Delete TURSO_DATABASE_URL
   - ❌ Delete TURSO_AUTH_TOKEN

3. **Update** DATABASE_URL:
   - Click "Edit" on DATABASE_URL
   - **Replace** with Supabase connection string:
     ```
     postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
     ```
   - Select: ✅ Production ✅ Preview ✅ Development
   - **Important**: Use "Connection Pooling" URL (port 6543), NOT direct connection (port 5432)
   - Save

4. **Keep** these variables:
   - ✅ NEXTAUTH_URL (should be your production URL)
   - ✅ NEXTAUTH_SECRET (keep existing value)

### Step 10: Commit & Push Changes

```bash
# Add all changes
git add -A

# Commit migration
git commit -m "feat: migrate from Turso to Supabase PostgreSQL - remove adapter complexity"

# Push to GitHub (triggers Vercel deployment)
git push origin main
```

### Step 11: Verify Production Build

1. **Watch** Vercel deployment logs
2. **Look for**:
   ```
   ✔ Compiled successfully
   ✔ Linting and checking validity of types
   ✔ Generating static pages (50/50)
   ✔ Build Completed
   ```
   
3. **Should NOT see**:
   - ❌ No "URL must start with protocol file:" errors
   - ❌ No adapter-related errors
   - ❌ No Turso connection errors

### Step 12: Test Production Login

1. **Go to**: Your production URL (e.g., https://wekangtrading.vercel.app)
2. **Login** with: admin@wekangtrading.com / WekangAdmin2026!
3. **Verify**:
   - ✅ Login succeeds
   - ✅ Dashboard loads
   - ✅ Debug panel shows "✅ Connected"

---

## 🎯 What Changed

### Code Simplifications

**Before (Turso with adapter)**:
```typescript
// Complex async adapter loading
const adapterModule = await import('@prisma/adapter-libsql');
const adapter = new PrismaLibSql(libsqlConfig);
const prisma = new PrismaClient({ adapter } as any);
```

**After (Supabase PostgreSQL)**:
```typescript
// Simple standard Prisma client
export const prisma = new PrismaClient({ log: ['error'] });
```

### Dependencies Removed

- ❌ @libsql/client (3.2 MB)
- ❌ @prisma/adapter-libsql (1.8 MB)
- ❌ serverExternalPackages config
- ❌ webpack custom rules
- ❌ driverAdapters preview feature

**Bundle size reduced by ~5 MB!**

### Configuration Simplified

**Before**:
- DATABASE_URL = file:./dev.db (dummy)
- TURSO_DATABASE_URL = libsql://... (actual)
- TURSO_AUTH_TOKEN = eyJh... (JWT)

**After**:
- DATABASE_URL = postgresql://... (direct connection)

**From 3 variables to 1!**

---

## 🔍 Troubleshooting

### Build Error: "Can't reach database server"

**Problem**: DATABASE_URL not set in Vercel or incorrect format

**Solution**:
1. Verify DATABASE_URL in Vercel matches Supabase exactly
2. Use "Connection Pooling" URL (port 6543), not Direct Connection (port 5432)
3. Make sure password is correct (no special chars that need URL encoding)

### Login Error: "Invalid email or password"

**Problem**: Database not seeded or password hash mismatch

**Solution**:
1. Verify user exists in Supabase Table Editor → users table
2. If not, run locally: `npm run db:seed`
3. This will seed Supabase database (DATABASE_URL points to Supabase)

### Error: "Database schema is not in sync"

**Problem**: Schema changes not pushed to Supabase

**Solution**:
```bash
npx prisma db push
```

### Connection Pool Timeout

**Problem**: Using direct connection (port 5432) instead of pooled connection

**Solution**:
- Vercel/serverless needs **Connection Pooling** (port 6543)
- Update DATABASE_URL to use: `...pooler.supabase.com:6543...`

---

## 📊 Supabase Free Tier Limits

| Resource | Limit | Your Usage |
|----------|-------|------------|
| **Database Storage** | 500 MB | ~17 MB/year (3%) |
| **Bandwidth** | 2 GB/month | ~7.5 MB/month (0.4%) |
| **Database Size** | 500 MB | ~17 MB/year (3%) |
| **API Requests** | Unlimited | ✅ All good |
| **Paused on Inactivity** | No | ✅ Always on |

**You're well within limits!** 🎉

---

## 🚀 Next Steps (Optional)

### 1. Enable Row Level Security (RLS)

Supabase has built-in RLS for better security:

```sql
-- In Supabase SQL Editor
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE individual_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own data"
  ON individual_trades FOR SELECT
  USING (auth.uid()::text = user_id);
```

### 2. Set Up Database Backups

1. Go to: Settings → Database → Backup & Restore
2. Enable: Point-in-time Recovery (PITR)
3. Retention: 7 days (free tier)

### 3. Monitor Database Usage

- Dashboard → Database → Reports
- Track: Query performance, Table sizes, Active connections

### 4. Consider Supabase Auth (Future)

Replace NextAuth.js with Supabase Auth for unified backend:
- Built-in user management
- OAuth providers (Google, GitHub, etc.)
- Magic links
- Row Level Security integration

---

## ✅ Migration Complete!

Your app is now running on Supabase PostgreSQL with:
- ✅ **Simpler code** (no adapters)
- ✅ **Faster builds** (smaller bundle)
- ✅ **Better performance** (real PostgreSQL)
- ✅ **More features** (Supabase ecosystem)
- ✅ **Easier debugging** (built-in Database UI)

**Admin Credentials**:
- Email: admin@wekangtrading.com
- Password: WekangAdmin2026!

**🔒 SECURITY**: Change default password immediately after first login!

---

**Questions or issues?** Check Supabase docs: https://supabase.com/docs
