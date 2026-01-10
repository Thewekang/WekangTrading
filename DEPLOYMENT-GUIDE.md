# 🚀 Production Deployment Guide - WekangTradingJournal

**Last Updated**: January 11, 2026  
**Target Platform**: Vercel  
**Database**: Turso (SQLite)  
**Duration**: 2-3 hours

---

## 📋 Pre-Deployment Checklist

### ✅ Completed
- [x] Build successful (`npm run build` - 56 pages)
- [x] All features implemented and tested locally
- [x] Database schema migrations created
- [x] `.gitignore` configured (excludes `.env.local`)
- [x] Documentation complete

### ⏳ To Complete
- [ ] Production database created (Turso)
- [ ] Environment variables configured
- [ ] Code pushed to GitHub
- [ ] Vercel deployment configured
- [ ] Production database seeded
- [ ] Production testing passed

---

## 🎯 Step 1: Create Production Turso Database

### 1.1 Install Turso CLI (if not installed)

**Windows (PowerShell):**
```powershell
# Download installer
Invoke-WebRequest -Uri "https://install.tur.so/install.ps1" -OutFile "turso-install.ps1"
# Run installer
.\turso-install.ps1
# Clean up
Remove-Item turso-install.ps1
```

**Verify Installation:**
```powershell
turso --version
```

### 1.2 Login to Turso

```powershell
turso auth login
```
- Opens browser for authentication
- Login with your Turso account (or create one at https://turso.tech)

### 1.3 Create Production Database

```powershell
# Create database (use a meaningful name)
turso db create wekangtrading-prod

# Get connection URL
turso db show wekangtrading-prod --url

# Get auth token
turso db tokens create wekangtrading-prod
```

**Save These Credentials** (you'll need them for Vercel):
- `DATABASE_URL`: `libsql://wekangtrading-prod-[your-org].turso.io`
- `DATABASE_AUTH_TOKEN`: `eyJ...` (long token string)

### 1.4 Test Connection (Optional)

```powershell
# Open DB shell
turso db shell wekangtrading-prod

# Run test query
.schema

# Exit
.exit
```

---

## 🔐 Step 2: Prepare Environment Variables

### 2.1 Generate NextAuth Secret

```powershell
# Generate secure random string (32 bytes)
openssl rand -base64 32
```

**Or use PowerShell:**
```powershell
# Generate secure random string
[Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Minimum 0 -Maximum 256) }))
```

### 2.2 Create Production Environment Variables File

Create a temporary file `VERCEL_ENV_VARS.txt` with these values:

```env
# Database (Turso Production)
DATABASE_URL="libsql://wekangtrading-prod-[your-org].turso.io"
DATABASE_AUTH_TOKEN="eyJ..." 

# NextAuth.js
NEXTAUTH_URL="https://wekangtrading.vercel.app"  # Your Vercel URL
NEXTAUTH_SECRET="[your-generated-secret-from-step-2.1]"

# App Environment
NODE_ENV="production"
```

**⚠️ IMPORTANT**: 
- Replace `[your-org]` with your Turso organization name
- Replace `eyJ...` with your actual Turso auth token
- Replace `[your-generated-secret...]` with the secret from Step 2.1
- Update `NEXTAUTH_URL` with your actual Vercel domain

---

## 📦 Step 3: Push to GitHub

### 3.1 Commit Remaining Changes

```powershell
# Stage all changes
git add .

# Commit
git commit -m "feat: production ready - all features complete"

# View status
git status
```

### 3.2 Create/Verify GitHub Repository

**Option A: If repository already exists**
```powershell
# Verify remote
git remote -v

# Should show:
# origin  https://github.com/Thewekang/WekangTrading.git (fetch)
# origin  https://github.com/Thewekang/WekangTrading.git (push)
```

**Option B: If need to create new repository**
1. Go to https://github.com/new
2. Repository name: `WekangTrading`
3. Visibility: Private (recommended)
4. Click "Create repository"

Then connect:
```powershell
git remote add origin https://github.com/Thewekang/WekangTrading.git
```

### 3.3 Push to GitHub

```powershell
# Push to main branch
git push origin main

# Or if first push:
git push -u origin main
```

### 3.4 Verify on GitHub

- Visit: https://github.com/Thewekang/WekangTrading
- Confirm all files are pushed
- Check latest commit message

---

## 🌐 Step 4: Deploy to Vercel

### 4.1 Login to Vercel

1. Go to https://vercel.com
2. Sign in with GitHub account
3. Allow Vercel to access your repositories

### 4.2 Import Project

1. Click "Add New Project" or "Import Project"
2. Select "Import Git Repository"
3. Find `Thewekang/WekangTrading` in the list
4. Click "Import"

### 4.3 Configure Project Settings

**Framework Preset**: Next.js (should auto-detect)

**Root Directory**: `./` (leave as default)

**Build Command**: 
```
npm run build
```

**Output Directory**: 
```
.next
```

**Install Command**: 
```
npm install
```

### 4.4 Add Environment Variables

In Vercel project settings:

1. Go to "Environment Variables" tab
2. Add each variable from your `VERCEL_ENV_VARS.txt` file:

| Name | Value | Environment |
|------|-------|-------------|
| `DATABASE_URL` | `libsql://wekangtrading-prod-...` | Production |
| `DATABASE_AUTH_TOKEN` | `eyJ...` | Production |
| `NEXTAUTH_URL` | `https://wekangtrading.vercel.app` | Production |
| `NEXTAUTH_SECRET` | `[your-secret]` | Production |
| `NODE_ENV` | `production` | Production |

**✅ Tips**:
- Click "Add" after each variable
- Select "Production" environment for each
- Double-check for typos

### 4.5 Deploy

1. Click "Deploy" button
2. Wait for build to complete (2-3 minutes)
3. Watch build logs for errors

**Expected Output**:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (48/48)
✓ Finalizing page optimization
```

---

## 🗄️ Step 5: Set Up Production Database

### 5.1 Run Migrations on Production

**Option A: From Local Machine**
```powershell
# Set production database URL temporarily
$env:DATABASE_URL = "libsql://wekangtrading-prod-[your-org].turso.io"
$env:DATABASE_AUTH_TOKEN = "eyJ..."

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Clear environment variables
$env:DATABASE_URL = ""
$env:DATABASE_AUTH_TOKEN = ""
```

**Option B: Using Turso CLI**
```powershell
# Connect to production DB
turso db shell wekangtrading-prod

# Copy/paste migration SQL from:
# prisma/migrations/[latest-migration]/migration.sql

.exit
```

### 5.2 Verify Schema

```powershell
turso db shell wekangtrading-prod

.schema users
.schema individual_trades
.schema daily_summaries
.schema sop_types

.exit
```

### 5.3 Seed Production Data

**Create Admin User:**

```powershell
# Connect to production DB
turso db shell wekangtrading-prod

# Create admin (replace password hash with bcrypt-hashed password)
INSERT INTO users (id, email, name, password_hash, role, created_at, updated_at)
VALUES (
  'admin-prod-001',
  'admin@wekangtradingjournal.com',
  'Admin User',
  '$2a$10$YourBcryptHashedPasswordHere',  -- Generate with: node -e "require('bcryptjs').hash('admin123', 10, (e,h) => console.log(h))"
  'ADMIN',
  datetime('now'),
  datetime('now')
);

.exit
```

**Seed Default SOP Types:**

```powershell
turso db shell wekangtrading-prod

INSERT INTO sop_types (id, name, description, active, sort_order, created_at, updated_at)
VALUES
  ('sop-1', 'Trend Following', 'Trade in direction of prevailing trend', 1, 1, datetime('now'), datetime('now')),
  ('sop-2', 'Support/Resistance', 'Trade at key support and resistance levels', 1, 2, datetime('now'), datetime('now')),
  ('sop-3', 'Breakout', 'Trade price breakouts from consolidation', 1, 3, datetime('now'), datetime('now')),
  ('sop-4', 'Reversal', 'Trade market reversals at extremes', 1, 4, datetime('now'), datetime('now')),
  ('sop-5', 'News Trading', 'Trade around economic news releases', 1, 5, datetime('now'), datetime('now')),
  ('sop-6', 'Scalping', 'Quick in-and-out trades for small profits', 1, 6, datetime('now'), datetime('now'));

.exit
```

**Alternative: Run Seed Script** (Recommended for realistic data)

```powershell
# Set production credentials
$env:DATABASE_URL = "libsql://wekangtrading-prod-[your-org].turso.io"
$env:DATABASE_AUTH_TOKEN = "eyJ..."

# Run seed script (creates 5 traders with 3 months data)
npx tsx prisma/seed/seed-coach.ts

# Clear environment variables
$env:DATABASE_URL = ""
$env:DATABASE_AUTH_TOKEN = ""
```

---

## ✅ Step 6: Verify Production Deployment

### 6.1 Access Production Site

Visit your Vercel URL: `https://wekangtrading.vercel.app`

**Or find it in Vercel Dashboard:**
- Go to your project
- Click "Visit" button
- Copy production URL

### 6.2 Test Critical Paths

#### 1. **Homepage**
- [ ] Loads without errors
- [ ] No console errors in browser DevTools
- [ ] Redirects to `/login` if not authenticated

#### 2. **Login**
- [ ] Navigate to `/login`
- [ ] Enter admin credentials: `admin@wekangtradingjournal.com` / `admin123`
- [ ] Click "Sign In"
- [ ] Should redirect to `/admin/overview` (admin dashboard)

#### 3. **Admin Dashboard**
- [ ] Stats cards display correctly
- [ ] Performance leaderboard shows traders
- [ ] Charts render without errors
- [ ] No "Loading..." stuck forever

#### 4. **Create Test Trade**
- [ ] Login as a trader (if seeded)
- [ ] Navigate to `/trades/new`
- [ ] Fill form with test data
- [ ] Submit trade
- [ ] Should see success toast
- [ ] Trade appears in `/trades` list

#### 5. **Admin User Management**
- [ ] Navigate to `/admin/users`
- [ ] Verify all users listed
- [ ] Try creating a new user
- [ ] Verify user creation works

#### 6. **SOP Types**
- [ ] Navigate to `/admin/sop-types`
- [ ] Verify 6 default SOP types listed
- [ ] Try creating a new SOP type
- [ ] Verify it appears in trade entry forms

### 6.3 Check for Errors

**Browser Console**:
- Open DevTools (F12)
- Go to Console tab
- Should see NO red errors

**Network Tab**:
- Check for failed API requests
- All requests should return 200/201 (success)

**Vercel Logs**:
- Go to Vercel Dashboard → Your Project → Logs
- Check "Functions" tab for errors
- Look for 500 errors or database connection issues

---

## 🐛 Troubleshooting Common Issues

### Issue 1: "Database Connection Failed"

**Symptoms**: API requests fail with 500 errors, logs show Prisma connection errors

**Solutions**:
1. Verify `DATABASE_URL` and `DATABASE_AUTH_TOKEN` in Vercel env vars
2. Check Turso database is running: `turso db list`
3. Regenerate auth token if expired: `turso db tokens create wekangtrading-prod`
4. Update Vercel environment variable with new token
5. Redeploy: Vercel Dashboard → Deployments → "Redeploy"

### Issue 2: "Build Failed" on Vercel

**Symptoms**: Deployment fails during build phase

**Solutions**:
1. Check build logs in Vercel for specific error
2. Common causes:
   - TypeScript errors → Run `npm run build` locally first
   - Missing dependencies → Verify `package.json` includes all deps
   - Prisma client not generated → Vercel should auto-run `prisma generate`
3. Try local build: `npm run build` (should succeed)
4. Push fix to GitHub
5. Vercel auto-redeploys on push

### Issue 3: "NEXTAUTH_URL Mismatch"

**Symptoms**: Login fails, redirects to localhost

**Solutions**:
1. Update `NEXTAUTH_URL` in Vercel env vars to your production URL
2. Format: `https://wekangtrading.vercel.app` (no trailing slash)
3. Redeploy after updating

### Issue 4: "Migrations Not Applied"

**Symptoms**: Database tables missing, queries fail

**Solutions**:
1. Connect to production DB: `turso db shell wekangtrading-prod`
2. Check tables: `.tables`
3. If empty, run migrations manually (Step 5.1)
4. Verify schema: `.schema users`

### Issue 5: "No Admin User"

**Symptoms**: Cannot login, "Invalid credentials" error

**Solutions**:
1. Check if admin user exists:
   ```sql
   SELECT * FROM users WHERE email = 'admin@wekangtradingjournal.com';
   ```
2. If not, run seed script (Step 5.3) or create manually
3. Verify password hash is correct (bcrypt format)

---

## 🔒 Security Best Practices

### Production Environment

✅ **DO**:
- Use strong passwords for admin accounts
- Keep `NEXTAUTH_SECRET` private (never commit to Git)
- Rotate Turso auth tokens periodically
- Enable Vercel deployment protection (password-protect preview deploys)
- Set up domain with SSL (Vercel handles this automatically)

❌ **DON'T**:
- Commit `.env.local` or production credentials to Git
- Share production database credentials publicly
- Use weak passwords in production
- Expose API keys in client-side code

### Monitoring

Set up:
- Vercel Analytics (built-in)
- Error tracking (e.g., Sentry)
- Uptime monitoring (e.g., UptimeRobot)

---

## 📊 Post-Deployment Tasks

### 1. Custom Domain (Optional)

**Add Custom Domain:**
1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Click "Add Domain"
3. Enter your domain (e.g., `wekangtrading.com`)
4. Follow DNS configuration instructions
5. Vercel automatically provisions SSL certificate

**Update Environment Variables:**
```
NEXTAUTH_URL=https://wekangtrading.com
```

### 2. Invite Traders

**Create Invite Codes:**
1. Login as admin: `/admin/invite-codes`
2. Create invite codes for each trader
3. Set max uses (1 per trader)
4. Copy codes and share with traders
5. Traders register at `/register` with invite code

### 3. Load Trading Data

**Option A: Manual Entry**
- Traders enter trades via `/trades/new` or `/trades/bulk`

**Option B: Bulk Import** (If migrating from another system)
- Use Turso CLI to bulk insert trades
- Run daily summary recalculation script:
  ```powershell
  npx tsx scripts/recalculate-summaries.ts
  ```

### 4. Backup Strategy

**Automated Turso Backups:**
```powershell
# Turso automatically backs up your database
# View backups:
turso db backups list wekangtrading-prod

# Restore from backup (if needed):
turso db restore wekangtrading-prod [backup-id]
```

**Manual Backups:**
```powershell
# Export database to SQL
turso db shell wekangtrading-prod .dump > backup-$(Get-Date -Format "yyyy-MM-dd").sql
```

### 5. User Training

Create user guides:
- [ ] Admin training: How to manage users, view reports, coach traders
- [ ] Trader training: How to enter trades, view analytics, set targets
- [ ] FAQ document for common questions

---

## 📈 Monitoring & Maintenance

### Daily Checks
- [ ] Review Vercel logs for errors
- [ ] Check uptime (Vercel dashboard)
- [ ] Monitor active users

### Weekly Tasks
- [ ] Review performance metrics (Analytics tab)
- [ ] Check database size (Turso usage)
- [ ] Respond to user feedback

### Monthly Tasks
- [ ] Review and rotate API keys if needed
- [ ] Update dependencies: `npm update`
- [ ] Review and delete old invite codes
- [ ] Backup critical data

---

## 🎉 Deployment Complete Checklist

- [ ] Production database created (Turso)
- [ ] Migrations applied to production
- [ ] Environment variables configured in Vercel
- [ ] Code pushed to GitHub
- [ ] Vercel deployment successful
- [ ] Admin user can login
- [ ] Traders can register with invite codes
- [ ] Trades can be created
- [ ] Dashboard displays correctly
- [ ] All API endpoints working
- [ ] No console errors
- [ ] Custom domain configured (optional)
- [ ] Team trained on system usage

---

## 📞 Support Resources

### Documentation
- Project Docs: `/docs` folder
- API Spec: `/docs/04-API-SPECIFICATION.md`
- Database Schema: `/docs/03-DATABASE-SCHEMA.md`

### External Resources
- Vercel Docs: https://vercel.com/docs
- Turso Docs: https://docs.turso.tech
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs

### Useful Commands

```powershell
# Check Vercel deployment status
vercel ls

# View logs
vercel logs [deployment-url]

# Redeploy
vercel --prod

# Check database status
turso db show wekangtrading-prod

# View database usage
turso db inspect wekangtrading-prod
```

---

## 🚀 Next Steps After Deployment

1. **Announce Launch**: Notify your team
2. **Collect Feedback**: Monitor user issues
3. **Iterate**: Plan Phase 3 features based on feedback
4. **Scale**: Monitor usage and upgrade Turso/Vercel plans if needed

---

**Deployment Guide Complete!** 🎊

**Need Help?** Review this guide or check Vercel/Turso documentation.

**Last Updated**: January 11, 2026  
**Version**: 1.0  
**Author**: GitHub Copilot for WekangTradingJournal
