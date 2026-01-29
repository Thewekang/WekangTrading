# Production SOP Save Issue - Diagnosis Report
**Date**: January 30, 2026  
**Issue**: Cannot save SOP details in production (wekangtrading.vercel.app)

---

## 🔍 Problem Identified

**Error**: `405 Method Not Allowed` on `PATCH /api/admin/sop-types/{id}`

**Root Cause**: The PATCH endpoint exists in the `main` branch code but is **NOT deployed** to Vercel production.

---

## ✅ What We Verified

### 1. Database Migration Status: ✅ CORRECT
- Production database has all required columns:
  - `detail_images_short` ✓
  - `detail_images_long` ✓
  - `detail_image_notes_short` ✓
  - `detail_image_notes_long` ✓
- Migration 0006 was applied correctly

### 2. Code Repository: ✅ CORRECT
- File `app/api/admin/sop-types/[id]/route.ts` exists in `main` branch
- PATCH endpoint implementation is correct
- Commit: `b2f393a` (tag: v1.4.1)

### 3. Production Deployment: ❌ ISSUE FOUND
- Endpoint test: `PATCH https://wekangtrading.vercel.app/api/admin/sop-types/sop-news-trading`
- Response: **405 Method Not Allowed**
- Expected: 401 Unauthorized (endpoint exists but requires auth)

---

## 🔧 Solution

The PATCH endpoint is missing from the Vercel production build. This is a **deployment issue**, not a code or database issue.

### Recommended Actions (Choose ONE):

#### Option 1: Manual Redeploy via Vercel Dashboard ⭐ RECOMMENDED
1. Visit: https://vercel.com/dashboard
2. Select project: `wekangtrading`
3. Go to **Deployments** tab
4. Find the latest production deployment (should be v1.4.1)
5. Click **...** (three dots) → **Redeploy**
6. **IMPORTANT**: Uncheck "Use existing Build Cache"
7. Click **Redeploy**
8. Wait 2-3 minutes for build to complete

#### Option 2: Force Redeploy via Git
Run the script:
```powershell
.\force-vercel-redeploy.ps1
```

This will:
- Switch to `main` branch
- Create an empty commit with message: `chore: trigger Vercel redeploy for SOP PATCH endpoint [force-deploy]`
- Push to `origin/main`
- Trigger automatic Vercel deployment

---

## 🧪 Verification Steps

After redeployment, run:
```powershell
.\test-prod-endpoint.ps1
```

**Expected Result After Fix**:
- Status: `401 Unauthorized` (NOT 405)
- This confirms the PATCH endpoint exists and is working

**Current Result (Before Fix)**:
- Status: `405 Method Not Allowed`
- Confirms endpoint is missing from deployment

---

## 📋 Additional Context

### Console Errors Seen:
```
PATCH https://wekangtrading.vercel.app/api/admin/sop-types/sop-news-trading 405 (Method Not Allowed)
```

### Other Warnings (Non-Critical):
- TipTap duplicate 'link' extension warnings - cosmetic issue
- Browser extension errors - unrelated to deployment

---

## ⏱️ Timeline

- **Last main branch commit**: `b2f393a` (v1.4.1) - Merge from develop
- **File commit history**: File exists since commit `0722ed4` (feat: SOP details Phase 1)
- **Issue**: Vercel deployment did not include this route file

---

## 🎯 Root Cause Analysis

**Likely Cause**: Next.js build cache or Vercel deployment config issue

**Why this happened**:
- The route file `app/api/admin/sop-types/[id]/route.ts` exists in git
- Vercel build process may have cached an older version
- Dynamic route folders `[id]` sometimes require cache clearing

**Prevention**:
- After major API changes, always clear Vercel build cache
- Consider adding build verification tests
- Monitor Vercel deployment logs for route detection

---

## 📞 Support

If redeployment doesn't fix the issue, check:
1. Vercel build logs for errors
2. Next.js configuration (`next.config.ts`)
3. Vercel project settings → Output Directory (should be `.next`)

---

**Status**: Ready for redeploy ✅
