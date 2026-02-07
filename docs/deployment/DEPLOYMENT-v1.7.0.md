# 🚀 Deployment Guide - v1.7.0 Release

**Release Date:** February 8, 2026  
**Version:** 1.7.0  
**PR:** #15 (develop → main)  
**Tag:** v1.7.0

---

## 📋 Pre-Deployment Checklist

- [x] All TypeScript errors resolved
- [x] Local build passes (`npm run build`)
- [x] All tests pass
- [x] PR #15 created and reviewed
- [x] Git tag v1.7.0 created
- [x] Migration 0009 prepared
- [ ] Migration 0009 applied to production
- [ ] PR #15 merged to main
- [ ] Vercel production deployment successful
- [ ] Production testing completed

---

## 🗄️ Database Migration

### Migration 0009: Quote System + Discipline Tracker

**What's Included:**
- New `trading_quotes` table with indexes
- Add quote system fields to `users` table (show_quotes, cooldown, tracking)
- Update `discipline_tracker_rows` (is_aplus_day, is_range_expansion_day)

### Apply Migration

**Option 1: Using PowerShell Script (Recommended)**
```powershell
cd g:\Hasil Kerja\Website\WekangTrading
.\apply-migration-0009-prod.ps1
```

**Option 2: Manual WSL + Turso CLI**
```bash
# Enter WSL
wsl

# Navigate to project
cd /mnt/g/'Hasil Kerja'/Website/WekangTrading

# Apply migration
export PATH=/home/h4mim/.turso:$PATH
turso db shell wekangtrading-prod < apply-migration-0009.sql

# Verify
turso db shell wekangtrading-prod '.schema trading_quotes'
turso db shell wekangtrading-prod 'PRAGMA table_info(users)' | grep show_quotes

# Exit WSL
exit
```

### Verify Migration Success

Check for these new structures:

**1. trading_quotes table exists**
```sql
SELECT COUNT(*) FROM trading_quotes;
-- Should return: 0 (initially empty, will be seeded by API)
```

**2. users table has new columns**
```sql
PRAGMA table_info(users);
-- Should show: show_quotes, quotes_cooldown_minutes, last_quote_shown_at, etc.
```

**3. discipline_tracker_rows updated**
```sql
PRAGMA table_info(discipline_tracker_rows);
-- Should show: is_aplus_day, is_range_expansion_day
```

---

## 🔀 Git Workflow

### 1. Merge PR to Main

```powershell
# Option A: Via GitHub UI (Recommended)
# 1. Go to https://github.com/Thewekang/WekangTrading/pull/15
# 2. Click "Merge pull request"
# 3. Confirm merge

# Option B: Via Git (if PR already approved)
git checkout main
git pull origin main
git merge origin/develop --no-ff -m "Merge PR #15: v1.7.0 Release"
git push origin main
```

### 2. Sync Develop with Main

```powershell
git checkout develop
git pull origin main
git push origin develop
```

### 3. Verify Tag is Pushed

```powershell
git tag
# Should show: v1.7.0

git ls-remote --tags origin
# Should show: refs/tags/v1.7.0
```

---

## 🌐 Vercel Deployment

### Automatic Deployment

After merging PR #15 to main, Vercel will automatically:
1. Detect push to main branch
2. Start build process
3. Run `npm run build`
4. Deploy to production

**Monitor deployment:**
- Dashboard: https://vercel.com/dashboard/deployments
- Expected build time: ~2-3 minutes

### Environment Variables (Already Set)

Verify these are configured in Vercel:

```env
# Database
DATABASE_URL=libsql://[production-url]
DATABASE_AUTH_TOKEN=[production-token]

# Auth
NEXTAUTH_URL=https://wekangtrading.vercel.app
NEXTAUTH_SECRET=[existing-secret]
```

### Build Success Indicators

```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
✓ Build completed in [time]
```

---

## 🧪 Post-Deployment Testing

### 1. Quote System Testing

**Test Case 1: Contextual Quotes**
- Login to production
- Navigate to Bulk Trade Entry page
- **Expected:** See quote card related to bulk entry (e.g., "Planning prevents poor performance")

**Test Case 2: Quote Settings**
- Go to Settings page
- Toggle "Show Motivational Quotes"
- Adjust cooldown minutes
- **Expected:** Settings save successfully

**Test Case 3: Language Toggle**
- On any quote card, toggle EN/BM language
- **Expected:** Quote text changes language

### 2. Performance Testing

**Test Case 4: Individual Trade Entry**
- Enter a single trade
- **Expected:** Response time < 300ms (75% faster than v1.6.1)

**Test Case 5: Bulk Trade Entry**
- Enter 10 trades via bulk entry
- **Expected:** Response time < 800ms (68% faster)

**Test Case 6: CSV Import**
- Import CSV with 20 trades
- **Expected:** Response time < 1300ms (69% faster)

### 3. Discipline Tracker Testing

**Test Case 7: Daily Row Creation**
- Create new discipline tracker row
- Check "A+ Day" and "Range Expansion" checkboxes
- **Expected:** Saves successfully with is_aplus_day and is_range_expansion_day

### 4. Dashboard Testing

**Test Case 8: Collapsible Sections**
- Open dashboard
- Click section headers to expand/collapse
- **Expected:** Sections expand/collapse smoothly

### 5. Admin Testing

**Test Case 9: Version Display**
- Login as admin
- Navigate to Admin → Settings
- **Expected:** Version shows "1.7.0"

---

## 🛠️ Rollback Plan (If Needed)

### If Critical Bug Found

**Option 1: Revert to Previous Deployment**
```
1. Go to Vercel Dashboard → Deployments
2. Find previous successful deployment (v1.6.1)
3. Click "..." → "Promote to Production"
```

**Option 2: Revert Git Commits**
```powershell
# On main branch
git revert HEAD --no-commit
git commit -m "Revert v1.7.0 release due to [issue]"
git push origin main

# Vercel will auto-deploy reverted version
```

**Option 3: Revert Database Migration**
```sql
-- Revert migration 0009 (if needed)
DROP TABLE trading_quotes;
ALTER TABLE users DROP COLUMN show_quotes;
ALTER TABLE users DROP COLUMN quotes_cooldown_minutes;
ALTER TABLE users DROP COLUMN last_quote_shown_at;
ALTER TABLE users DROP COLUMN last_quote_id;
ALTER TABLE users DROP COLUMN last_quote_language;
ALTER TABLE users DROP COLUMN quote_show_count;
-- Note: discipline_tracker_rows changes may need manual handling
```

---

## 📊 Monitoring

### Key Metrics to Watch

**Performance Metrics:**
- API response times (should be 50-80% faster)
- Database query latency
- Build times

**Error Monitoring:**
- Check Vercel logs for runtime errors
- Monitor API error rates
- Watch for quote system errors

**User Metrics:**
- Quote display count
- Quote interaction rate
- User settings changes

### Vercel Logs

```
1. Go to Vercel Dashboard
2. Click on deployment
3. Navigate to "Logs" tab
4. Filter by:
   - Time range: Last 1 hour
   - Type: Errors, Warnings
```

---

## 📝 Documentation Updates

Files updated in this release:

- ✅ `package.json` (version 1.7.0)
- ✅ `README.md` (version 1.7.0)
- ✅ `CHANGELOG.md` (v1.7.0 section added)
- ✅ `app/(admin)/admin/settings/page.tsx` (version display)
- ✅ `docs/PERFORMANCE-OPTIMIZATION-v1.7.0.md` (renamed from v1.6.1)
- ✅ This deployment guide

---

## ✅ Deployment Completion Checklist

- [ ] Migration 0009 applied to production ✅
- [ ] PR #15 merged to main
- [ ] Vercel build successful
- [ ] Production URL accessible
- [ ] Quote system tested (3 test cases)
- [ ] Performance tested (3 test cases)
- [ ] Discipline tracker tested
- [ ] Dashboard collapsible sections working
- [ ] Admin version display correct
- [ ] No errors in Vercel logs
- [ ] Database migration verified
- [ ] Main and develop branches synced
- [ ] Unused branches deleted
- [ ] GitHub Release created from v1.7.0 tag
- [ ] Team notified of deployment

---

## 🎯 Next Steps After Deployment

1. **Create GitHub Release**
   - Go to: https://github.com/Thewekang/WekangTrading/releases
   - Click "Draft a new release"
   - Select tag: v1.7.0
   - Use PR #15 description as release notes
   - Publish release

2. **Monitor for 24 Hours**
   - Check Vercel logs hourly for first 4 hours
   - Monitor error rates
   - Watch performance metrics

3. **Notify Team**
   - Send deployment announcement
   - Share testing results
   - Document any issues found

4. **Plan Next Sprint**
   - Review Phase 3 features (Dashboard & Analytics)
   - Prioritize upcoming work
   - Update roadmap

---

## 📞 Support

**If issues arise:**
1. Check Vercel logs first
2. Review error messages in browser console
3. Test in staging environment
4. Use rollback plan if critical
5. Document all issues for post-mortem

**Key Files:**
- Migration: `apply-migration-0009.sql`
- Deployment script: `apply-migration-0009-prod.ps1`
- PR: https://github.com/Thewekang/WekangTrading/pull/15
- Tag: https://github.com/Thewekang/WekangTrading/releases/tag/v1.7.0

---

**Deployment Prepared By:** GitHub Copilot Agent  
**Last Updated:** February 8, 2026  
**Status:** ✅ Ready for Deployment
