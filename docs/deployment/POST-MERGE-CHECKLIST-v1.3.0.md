# Post-Merge Deployment Checklist - v1.3.0

**PR**: https://github.com/Thewekang/WekangTrading/pull/5  
**Date**: January 28, 2026  
**Version**: 1.3.0  
**Status**: Ready for production deployment

---

## 🚨 CRITICAL - Before Merging PR

### Step 1: Add CRON_SECRET to Vercel Production

**Where**: Vercel Dashboard → WekangTrading Project → Settings → Environment Variables

**Action**: Add new environment variable:
- **Key**: `CRON_SECRET`
- **Value**: `JEewUgvoyzF1Sw20kINAT/Wa24HidBwbYo2FfV681y4=`
- **Environment**: ✅ Production (ONLY)
- **Expose to**: All functions

**Screenshot Verification**:
- [ ] Variable shows in Production environment
- [ ] Value is correct (case-sensitive)
- [ ] No extra spaces or line breaks

---

## ✅ Merge Process

### Step 2: Merge Pull Request
- [ ] Open PR: https://github.com/Thewekang/WekangTrading/pull/5
- [ ] Review changes one final time
- [ ] Click "Merge pull request"
- [ ] Confirm merge
- [ ] Delete `develop` branch? **NO** (keep it)

### Step 3: Monitor Deployment
- [ ] Open Vercel Dashboard
- [ ] Watch deployment progress (should start automatically)
- [ ] Wait for "Ready" status (usually 2-3 minutes)
- [ ] Check deployment logs for errors

---

## 🔍 Post-Deployment Verification

### Step 4: Verify Application (Immediate)
- [ ] Visit production URL: https://wekangtrading.vercel.app
- [ ] Login as admin
- [ ] Check Admin Dashboard loads
- [ ] Check Economic Calendar page works
- [ ] Check User Management page works
- [ ] Check SOP Types Management page works

### Step 5: Verify Cron Endpoint (Immediate)
Test the cron endpoint manually:

```bash
# Should return 401 (no authorization)
curl https://wekangtrading.vercel.app/api/admin/economic-calendar/sync-cron

# Should return 200 with success message (with correct secret)
curl -H "Authorization: Bearer JEewUgvoyzF1Sw20kINAT/Wa24HidBwbYo2FfV681y4=" \
     https://wekangtrading.vercel.app/api/admin/economic-calendar/sync-cron
```

**Expected Results**:
- [ ] Without auth: 401 Unauthorized
- [ ] With auth: 200 OK with sync results
- [ ] Cron log entry created in database

### Step 6: Verify Cron Schedule (Monday 05:00 UTC)
Wait for next scheduled cron execution:

**Next Execution**: Monday, [DATE], 05:00 UTC

After Monday 05:00 UTC:
- [ ] Check Vercel Logs: https://vercel.com/thewekang/wekangtrading/logs
- [ ] Filter by: "cron" or "sync-cron"
- [ ] Verify: Status 200, execution time <10s
- [ ] Check Admin Dashboard → Cron Logs
- [ ] Verify: New log entry with "success" status
- [ ] Check Economic Calendar page
- [ ] Verify: New events for the week appear

---

## 🧪 Optional Testing (If Available)

### Test User Deletion (Staging Only - DO NOT TEST IN PROD)
If you have staging environment:
1. Create test user in staging
2. Add some trades/targets/badges
3. Delete user via Admin panel
4. Verify no orphaned records in database:
   ```sql
   SELECT COUNT(*) FROM individual_trades WHERE user_id = '[deleted_user_id]';
   SELECT COUNT(*) FROM accounts WHERE user_id = '[deleted_user_id]';
   ```

Expected: All counts should be 0

---

## 📊 Monitoring Schedule

### Week 1 (Jan 28 - Feb 3)
- [ ] Monday: Check cron execution logs
- [ ] Wednesday: Verify economic events updated
- [ ] Friday: Check for any error logs

### Week 2 (Feb 4 - Feb 10)
- [ ] Monday: Verify cron still working
- [ ] Check user feedback (if any)

---

## 🚨 Rollback Plan (If Issues Arise)

### If Cron Fails:
1. Check Vercel logs for error message
2. Verify CRON_SECRET is correct
3. If still failing, disable cron in vercel.json:
   ```json
   "crons": []
   ```
4. Commit and push to main
5. Manual sync still works via Admin panel

### If Application Errors:
1. Check Vercel deployment logs
2. If critical, revert to previous deployment:
   - Vercel Dashboard → Deployments
   - Find previous working deployment
   - Click "Promote to Production"

---

## 📝 Success Criteria

- [x] CRON_SECRET added to Vercel Production
- [ ] PR merged successfully
- [ ] Deployment completed without errors
- [ ] Application loads and functions normally
- [ ] Cron endpoint responds correctly (manual test)
- [ ] Scheduled cron executes successfully (wait for Monday)
- [ ] Economic calendar data updates weekly

---

## 🎉 Deployment Complete

Once all checkboxes are marked:
- Update this checklist with actual results
- Save for future reference
- Document any issues encountered
- Update team on successful deployment

---

**Deployed By**: [Your Name]  
**Deployment Date**: [Actual Date]  
**Deployment Time**: [Actual Time]  
**Status**: [ ] Success / [ ] Issues Encountered / [ ] Rolled Back

**Notes**:
