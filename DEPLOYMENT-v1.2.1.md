# Deployment Instructions - v1.2.1 (Performance Optimization)

**Version**: v1.2.1  
**Date**: January 21, 2026  
**Type**: Performance optimization + Documentation updates  
**Risk Level**: 🟡 MEDIUM (includes database index migration)

---

## 📋 Pre-Deployment Checklist

### ✅ Build Verification
- [x] Production build successful (`npm run build`)
- [x] No TypeScript errors
- [x] All tests passing
- [x] Bundle sizes optimized (Analytics: 106KB, Dashboard: 240KB)
- [x] Documentation complete

### ✅ Code Quality
- [x] All commits merged to develop branch
- [x] Performance optimizations verified (60-80% improvement)
- [x] Dynamic imports working correctly
- [x] Gzip compression enabled

### ⚠️ Migration Required
- [ ] Database indexes need to be applied in production
- [ ] 5 composite indexes ready for deployment
- [ ] Migration script: `drizzle/migrations/phase2-indexes-only.sql`

---

## 🚀 Deployment Steps

### Step 1: Verify Vercel Deployment Status

Vercel should auto-deploy from `develop` branch. Check:
- https://vercel.com/your-project/deployments
- Wait for build to complete
- Verify deployment URL: https://wekangtrading.vercel.app

**Expected**:
- Build time: ~2-3 minutes
- All routes deployed successfully
- No build errors

---

### Step 2: Apply Database Migrations (CRITICAL)

**⚠️ IMPORTANT**: Database indexes MUST be applied to production database.

#### Option A: Using Drizzle Push (Recommended)

```bash
# 1. Ensure production environment variables are set
# Verify DATABASE_URL points to PRODUCTION Turso database

# 2. Push schema changes (includes indexes)
npm run drizzle:push

# 3. Verify indexes were created
npm run drizzle:studio
# Open Studio → Check indexes tab for:
# - idx_user_badges_user_earned
# - idx_trades_user_timestamp_result
# - idx_trades_user_date_result
# - idx_trades_user_session
# - idx_summary_user_date
```

#### Option B: Using Turso CLI (Alternative)

```bash
# 1. Enter WSL
wsl

# 2. Connect to production database
turso db shell wekangtrading-prod

# 3. Run the migration SQL
.read drizzle/migrations/phase2-indexes-only.sql

# 4. Verify indexes created
SELECT name, tbl_name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%' ORDER BY name;

# Expected output: 5 indexes listed

# 5. Exit
.exit
exit
```

---

### Step 3: Smoke Test Production

After deployment and migration, verify critical functionality:

#### 3.1 Basic Functionality
- [ ] Login works (https://wekangtrading.vercel.app/login)
- [ ] Dashboard loads (<2s)
- [ ] Trade list loads with filters
- [ ] Charts render correctly (dynamic imports working)
- [ ] Analytics page loads fast (106KB bundle)

#### 3.2 Performance Verification
- [ ] Dashboard feels faster (60-80% improvement)
- [ ] Analytics/Trends page loads quickly (lazy charts)
- [ ] Form inputs are smooth (debouncing working)
- [ ] Large trade lists scroll smoothly (virtualization)

#### 3.3 Database Index Verification
Run this query in production to verify indexes:

```sql
-- In Turso CLI or Drizzle Studio
SELECT 
  name, 
  tbl_name, 
  sql 
FROM sqlite_master 
WHERE type='index' 
  AND name LIKE 'idx_%' 
ORDER BY name;
```

**Expected**: 5 indexes returned
- idx_summary_user_date
- idx_trades_user_date_result
- idx_trades_user_session
- idx_trades_user_timestamp_result
- idx_user_badges_user_earned

---

### Step 4: Monitor Performance

After deployment, monitor for 24 hours:

#### Vercel Analytics (if enabled)
- Check Web Vitals: FCP, LCP, CLS
- Monitor page load times
- Check error rates

#### Manual Checks
- [ ] Dashboard query response time (<200ms)
- [ ] TradesList filter performance (should be faster)
- [ ] Badge progress queries (60% faster expected)
- [ ] Session analysis (50% faster expected)

---

## 📊 Expected Performance Impact

### Before vs After

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Runtime | Baseline | Optimized | 60-80% |
| Analytics Bundle | 232 KB | 106 KB | -54% |
| Dashboard Transfer | 238 KB | ~80 KB (gzip) | -67% |
| API Payload | Baseline | Optimized | -76% |
| TradesList (100+) | Baseline | Virtualized | -70% |
| Database Queries | Baseline | Indexed | -40-80% |

### Bundle Sizes (After)
- Dashboard: 11.3 kB page + 240 kB First Load JS (~80 KB gzipped)
- Analytics/Trends: 4.31 kB page + 106 kB First Load JS (~35 KB gzipped)
- Admin Overview: ~227 kB First Load JS (~75 KB gzipped)
- Shared bundle: 102 kB

---

## 🐛 Rollback Plan

If issues are detected:

### Quick Rollback (Vercel)
1. Go to Vercel Dashboard
2. Deployments → Find previous deployment (commit 41b4a23 or earlier)
3. Click "Promote to Production"
4. Deployment rolls back in ~30 seconds

### Database Rollback (If Needed)
If indexes cause issues (unlikely):

```bash
# Connect to production database
turso db shell wekangtrading-prod

# Drop indexes one by one
DROP INDEX IF EXISTS idx_user_badges_user_earned;
DROP INDEX IF EXISTS idx_trades_user_timestamp_result;
DROP INDEX IF EXISTS idx_trades_user_date_result;
DROP INDEX IF EXISTS idx_trades_user_session;
DROP INDEX IF EXISTS idx_summary_user_date;

# Exit
.exit
```

**Note**: Indexes are safe to drop - they only improve performance, not functionality.

---

## 📝 Post-Deployment Tasks

### Update Documentation
- [x] Update CHANGELOG.md with v1.2.1 release notes
- [x] Mark Phase 8 as complete in MILESTONES-ROADMAP.md
- [x] Archive performance optimization docs
- [x] Update README.md to v1.2.1

### Notify Stakeholders
- [ ] Inform team about deployment
- [ ] Share performance improvements summary
- [ ] Request feedback on perceived speed improvements

### Monitor & Document
- [ ] Monitor error logs for 24 hours
- [ ] Document any issues in GitHub Issues
- [ ] Update performance metrics if needed

---

## ✅ Deployment Completion Checklist

- [ ] Vercel deployment successful
- [ ] Database indexes applied
- [ ] Smoke tests passed
- [ ] Performance improvements verified
- [ ] No errors in production logs
- [ ] Team notified
- [ ] Monitoring set up

---

## 🆘 Emergency Contacts

**If Issues Arise**:
1. Check Vercel deployment logs
2. Check Turso database status
3. Review error logs in Vercel Dashboard
4. Rollback if critical issues detected

**Support Channels**:
- Vercel Support: https://vercel.com/support
- Turso Discord: https://discord.gg/turso
- GitHub Issues: https://github.com/Thewekang/WekangTrading/issues

---

## 📚 Related Documentation

- [PERFORMANCE-OPTIMIZATION-COMPLETE.md](docs/features/PERFORMANCE-OPTIMIZATION-COMPLETE.md) - Complete technical summary
- [DOCS-CONSISTENCY-VERIFICATION.md](docs/features/DOCS-CONSISTENCY-VERIFICATION.md) - Verification report
- [CHANGELOG.md](CHANGELOG.md) - Version history
- [05-MILESTONES-ROADMAP.md](docs/05-MILESTONES-ROADMAP.md) - Project roadmap

---

**Deployment Prepared By**: GitHub Copilot  
**Deployment Date**: January 21, 2026  
**Version**: v1.2.1  
**Status**: ⏳ READY FOR DEPLOYMENT
