# 🔧 VERCEL ENVIRONMENT VARIABLES FIX

## ⚠️ CRITICAL: Update these in Vercel Dashboard NOW

Go to: https://vercel.com/dashboard → WekangTrading → Settings → Environment Variables

### Replace/Update These Variables:

#### 1. DATABASE_URL (CHANGE THIS)
**Old value** (WRONG):
```
libsql://wekangtrading-prod-thewekang.aws-eu-west-1.turso.io
```

**New value** (CORRECT):
```
file:./dev.db
```
**Why**: This is a dummy file path to satisfy Prisma schema validation. Actual connection uses TURSO_DATABASE_URL.

---

#### 2. TURSO_DATABASE_URL (ADD NEW)
**Value**:
```
libsql://wekangtrading-prod-thewekang.aws-eu-west-1.turso.io
```
**Environment**: Production, Preview, Development (all 3)

---

#### 3. TURSO_AUTH_TOKEN (ADD NEW)
**Value**:
```
eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjgwNjk4MDcsImlkIjoiMTA3YzJmOTktOGQ1NC00Nzg1LTk4MWUtYjE0OTE1YWUzYTEzIiwicmlkIjoiZjE1ZjhiODEtNjg0Yy00MDVjLWE4NDItZjdjM2EwZGU3NTgxIn0.S1RAM3l61VJEM04GjMd7nBgaF-D4yFFZZ7wSTvjryIMh2cg2J9H7kxxXCi09abWsbyvW-mhSpqVkfvmPmpeaAw
```
**Environment**: Production, Preview, Development (all 3)

---

#### 4. Keep These As-Is:
- ✅ NEXTAUTH_URL = https://wekangtrading.vercel.app
- ✅ NEXTAUTH_SECRET = (your existing secret)
- ✅ NODE_ENV = production

---

## 📋 Step-by-Step Instructions:

1. **Go to Vercel Dashboard**
   - https://vercel.com/dashboard
   - Click on your `WekangTrading` project

2. **Go to Settings → Environment Variables**

3. **Update DATABASE_URL**:
   - Find existing `DATABASE_URL` variable
   - Click "Edit"
   - Change value to: `file:./dev.db`
   - Save

4. **Add TURSO_DATABASE_URL**:
   - Click "Add New" button
   - Name: `TURSO_DATABASE_URL`
   - Value: `libsql://wekangtrading-prod-thewekang.aws-eu-west-1.turso.io`
   - Select: ✅ Production ✅ Preview ✅ Development
   - Save

5. **Add TURSO_AUTH_TOKEN**:
   - Click "Add New" button
   - Name: `TURSO_AUTH_TOKEN`
   - Value: `eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjgwNjk4MDcsImlkIjoiMTA3YzJmOTktOGQ1NC00Nzg1LTk4MWUtYjE0OTE1YWUzYTEzIiwicmlkIjoiZjE1ZjhiODEtNjg0Yy00MDVjLWE4NDItZjdjM2EwZGU3NTgxIn0.S1RAM3l61VJEM04GjMd7nBgaF-D4yFFZZ7wSTvjryIMh2cg2J9H7kxxXCi09abWsbyvW-mhSpqVkfvmPmpeaAw`
   - Select: ✅ Production ✅ Preview ✅ Development
   - Save

6. **Redeploy**:
   - Go to "Deployments" tab
   - Click on latest deployment (the "Ready" one)
   - Click three dots menu (⋯)
   - Click "Redeploy"
   - Wait 2-3 minutes for build to complete

---

## ✅ Expected Result:

After redeploy:
- Database connection will work ✅
- Login will succeed ✅
- Debug info will show "Status: ✅ Connected"
- Admin user will be found ✅

---

## 🔍 Why This Fix Works:

**The Problem**:
- Prisma validates `schema.prisma` at build time
- With `provider = "sqlite"`, it requires `DATABASE_URL` to start with `file:`
- But Turso uses `libsql://` protocol
- So Prisma rejects it before your code even runs

**The Solution**:
- Set `DATABASE_URL = file:./dev.db` (satisfies Prisma validation)
- Set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` (actual connection)
- Use `@prisma/adapter-libsql` at runtime to connect to Turso
- Prisma schema validation passes ✅
- Runtime connection uses Turso ✅

---

## 📝 Final Checklist:

- [ ] DATABASE_URL changed to `file:./dev.db`
- [ ] TURSO_DATABASE_URL added
- [ ] TURSO_AUTH_TOKEN added
- [ ] All 3 environments selected (Production, Preview, Development)
- [ ] Redeployed from Vercel dashboard
- [ ] Wait 2-3 minutes for deployment
- [ ] Test login again

---

**This WILL fix the login issue!** 🎉
