# Git Workflow & Branching Strategy

**Document Version**: 1.0  
**Last Updated**: January 12, 2026  
**Project**: WekangTradingJournal  
**Status**: ✅ Production Ready (v1.0.0)

---

## Table of Contents
1. [Overview](#overview)
2. [Branching Strategy](#branching-strategy)
3. [Workflow for Features](#workflow-for-features)
4. [Workflow for Hotfixes](#workflow-for-hotfixes)
5. [Workflow for Major Releases](#workflow-for-major-releases)
6. [Branch Protection Rules](#branch-protection-rules)
7. [Deployment Environments](#deployment-environments)
8. [Database Migration Strategy](#database-migration-strategy)
9. [Rollback Strategy](#rollback-strategy)
10. [Version Numbering](#version-numbering)
11. [Setup Instructions](#setup-instructions)

---

## Overview

This document defines the Git workflow and branching strategy for the WekangTradingJournal project. It ensures safe, predictable deployments and protects the production environment from breaking changes.

### Key Principles
- **Never break production**: All changes tested on staging first
- **Clear version history**: Semantic versioning with descriptive commits
- **Easy rollback**: Can revert to any previous stable state
- **Separation of concerns**: Features, hotfixes, and releases handled differently

---

## Branching Strategy

We use a **simplified Git Flow** adapted for small teams and continuous deployment.

### Branch Structure


main (production)
  └─> hotfix/fix-critical-bug  ← Emergency fixes only!

develop (staging)
  ├─> feature/trade-symbol      ← Normal development
  ├─> feature/csv-import        ← Normal development
  └─> release/v1.1.0            ← When ready to release

```
main (production)
  ↓
develop (staging/testing)
  ↓
feature/* (individual features)
hotfix/* (urgent production fixes)
release/* (version preparation)
```

### Branch Descriptions

#### `main` - Production Branch
- **Purpose**: Represents the current production state
- **Protection**: Highest level (requires PR reviews, passing tests)
- **Deployment**: Auto-deploys to production on merge
- **Tags**: All versions tagged here (v1.0.0, v1.1.0, etc.)
- **Direct commits**: ❌ Not allowed

#### `develop` - Staging Branch
- **Purpose**: Integration branch for features, pre-production testing
- **Protection**: Medium level (requires passing tests)
- **Deployment**: Auto-deploys to staging/preview environment
- **Merges from**: `feature/*` branches
- **Merges to**: `main` (via release branch or direct merge)
- **Direct commits**: ⚠️ Allowed but discouraged

#### `feature/*` - Feature Branches
- **Purpose**: Development of individual features or enhancements
- **Naming**: `feature/trade-symbol-entry`, `feature/user-timezone-settings`
- **Created from**: `develop`
- **Merged to**: `develop`
- **Lifespan**: Delete after merge
- **Examples**:
  - `feature/csv-import-users`
  - `feature/economic-news-tab`
  - `feature/trade-symbol-field`

#### `hotfix/*` - Hotfix Branches
- **Purpose**: Critical production bug fixes
- **Naming**: `hotfix/fix-bulk-trade-validation`, `hotfix/session-calculation-bug`
- **Created from**: `main` (current production)
- **Merged to**: `main` AND `develop` (backport)
- **Lifespan**: Delete after merge
- **Priority**: High - fast-track merge process

#### `release/*` - Release Branches
- **Purpose**: Prepare for major version releases (v2.0.0, v3.0.0)
- **Naming**: `release/v1.1.0`, `release/v2.0.0`
- **Created from**: `develop`
- **Merged to**: `main` (then tag) AND `develop` (backport)
- **Activities**: Bug fixes only, no new features
- **Lifespan**: Delete after merge and tag

---

## Workflow for Features

### Scenario: Add "Trade Symbol Entry" Feature

```bash
# Step 1: Ensure develop is up to date
git checkout develop
git pull origin develop

# Step 2: Create feature branch
git checkout -b feature/trade-symbol-entry

# Step 3: Develop the feature
# ... make changes, commit often ...
git add .
git commit -m "feat: Add symbol field to trade entry form"

# Step 4: Keep feature branch updated (if long-running)
git checkout develop
git pull origin develop
git checkout feature/trade-symbol-entry
git rebase develop  # or merge develop

# Step 5: Push feature branch
git push origin feature/trade-symbol-entry

# Step 6: Create Pull Request on GitHub
# PR: feature/trade-symbol-entry → develop
# Title: "feat: Add trade symbol entry to individual trades"
# Description: 
#   - Added symbol field to schema
#   - Updated trade forms
#   - Added symbol to trade list
#   - Updated API validations

# Step 7: Code Review & Testing
# - Team reviews PR
# - CI/CD runs tests
# - Deployment to staging (preview URL)
# - Manual testing on staging

# Step 8: Merge to develop
# After approval, merge via GitHub UI (Squash & Merge or Merge Commit)

# Step 9: Test on staging environment
# Verify feature works on develop branch deployment

# Step 10: Delete feature branch (automated on GitHub)
git branch -d feature/trade-symbol-entry
git push origin --delete feature/trade-symbol-entry
```

### When to Merge develop → main

**Weekly/Biweekly Releases** (recommended):
```bash
# Every Friday or every other Friday
git checkout main
git pull origin main
git merge develop
git push origin main

# Or create PR: develop → main for team review
```

**Continuous Deployment** (for small teams):
- Merge develop → main immediately after feature testing
- Only if feature is critical or high priority

---

## Workflow for Hotfixes

### Scenario: Critical Bug in Production

```bash
# Step 1: Branch from main (current production)
git checkout main
git pull origin main
git checkout -b hotfix/fix-timezone-validation

# Step 2: Fix the bug
git add .
git commit -m "fix: Correct timezone handling in bulk trade entry"

# Step 3: Test locally
npm run build
npm run test  # if tests exist

# Step 4: Push hotfix branch
git push origin hotfix/fix-timezone-validation

# Step 5: Create URGENT Pull Request
# PR: hotfix/fix-timezone-validation → main
# Label: Priority: High, Type: Hotfix
# Fast-track review process

# Step 6: Merge to main (after quick review)
# Deploys to production immediately

# Step 7: Backport to develop
git checkout develop
git pull origin develop
git merge main  # or cherry-pick the hotfix commit
git push origin develop

# Step 8: Delete hotfix branch
git branch -d hotfix/fix-timezone-validation
git push origin --delete hotfix/fix-timezone-validation
```

### Hotfix Decision Tree

**Is it a critical bug?**
- ✅ Production down → Hotfix immediately
- ✅ Data loss risk → Hotfix immediately
- ✅ Security vulnerability → Hotfix immediately
- ❌ Minor UI issue → Regular feature branch
- ❌ Enhancement request → Regular feature branch

---

## Workflow for Major Releases

### Scenario: Release v1.1.0

```bash
# Step 1: Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/v1.1.0

# Step 2: Final preparation (bug fixes only, no new features)
# - Update CHANGELOG.md
# - Update version in package.json
# - Run full test suite
# - Fix any last-minute bugs

git add .
git commit -m "chore: Prepare release v1.1.0"

# Step 3: Push release branch
git push origin release/v1.1.0

# Step 4: Create PR to main
# PR: release/v1.1.0 → main
# Label: Type: Release
# Description: Full changelog, migration notes

# Step 5: Final testing on release branch
# Deploy to staging from release branch
# QA team performs full regression testing

# Step 6: Merge to main
git checkout main
git merge release/v1.1.0
git push origin main

# Step 7: Tag the release
git tag -a v1.1.0 -m "Release v1.1.0 - Trade Symbol Entry & User CSV Import"
git push origin v1.1.0

# Step 8: Backport to develop
git checkout develop
git merge main
git push origin develop

# Step 9: Delete release branch
git branch -d release/v1.1.0
git push origin --delete release/v1.1.0

# Step 10: Create GitHub Release
# GitHub → Releases → Create Release from tag
# Add release notes from CHANGELOG
```

---

## Branch Protection Rules

### Configuration on GitHub

#### For `main` (Production)

**Settings → Branches → Add rule**

```yaml
Branch name pattern: main

Protect matching branches:
  ✅ Require a pull request before merging
    ✅ Require approvals: 1
    ✅ Dismiss stale pull request approvals when new commits are pushed
    ✅ Require review from Code Owners (if CODEOWNERS file exists)
  
  ✅ Require status checks to pass before merging
    ✅ Require branches to be up to date before merging
    Status checks: 
      - Vercel Production Build
      - TypeScript Check
      - Linting
  
  ✅ Require conversation resolution before merging
  
  ✅ Require signed commits (optional, for security)
  
  ✅ Do not allow bypassing the above settings
  
  ✅ Restrict who can push to matching branches
    - Only allow specific users/teams (optional)
  
  ❌ Allow force pushes
  ❌ Allow deletions
```

#### For `develop` (Staging)

```yaml
Branch name pattern: develop

Protect matching branches:
  ⚠️ Require a pull request before merging (optional for solo dev)
    ⚠️ Require approvals: 0 (optional for solo dev)
  
  ✅ Require status checks to pass before merging
    Status checks:
      - Vercel Preview Build
      - TypeScript Check
  
  ✅ Do not allow bypassing the above settings
  
  ❌ Allow force pushes (use with caution)
  ❌ Allow deletions
```

#### For `feature/*` and `hotfix/*`

No special protection needed - these are short-lived branches

---

## Deployment Environments

### Production (main branch)

**URL**: `https://wekangtrading.vercel.app`

**Vercel Configuration**:
- Production Branch: `main`
- Framework Preset: Next.js
- Root Directory: `./`
- Build Command: `npm run build`
- Output Directory: `.next`
- Auto-deploy: ✅ Enabled

**Environment Variables**:
```env
TURSO_DATABASE_URL=libsql://wekangtrading-prod.turso.io
TURSO_AUTH_TOKEN=<production-token>
NEXTAUTH_URL=https://wekangtrading.vercel.app
NEXTAUTH_SECRET=<production-secret>
NODE_ENV=production
```

**Database**: Production Turso database (separate from staging)

---

### Staging (develop branch)

**URL**: `https://wekangtrading-dev.vercel.app` (preview URL)

**Vercel Configuration**:
- Preview Branch: `develop`
- Auto-deploy: ✅ Enabled
- All feature branches also get preview URLs

**Environment Variables**:
```env
TURSO_DATABASE_URL=libsql://wekangtrading-staging.turso.io
TURSO_AUTH_TOKEN=<staging-token>
NEXTAUTH_URL=https://wekangtrading-dev.vercel.app
NEXTAUTH_SECRET=<staging-secret>
NODE_ENV=preview
```

**Database**: Staging Turso database (can have test data)

---

### Feature Branch Previews

**URL**: `https://wekangtrading-<branch-name>-<hash>.vercel.app`

**Vercel Configuration**:
- All feature branches automatically get preview URLs
- Uses staging environment variables
- Ephemeral - deleted when branch deleted

---

## Database Migration Strategy

### Critical Rules

1. **Test migrations on staging first**
2. **Always make backward-compatible changes**
3. **Never drop columns until next major version**
4. **Use feature flags for breaking changes**

### Safe Migration Pattern

**Adding New Column** (Safe ✅):
```sql
-- Step 1: Add column with default value
ALTER TABLE individual_trades 
ADD COLUMN symbol TEXT DEFAULT 'UNKNOWN';

-- Step 2: Backfill data (if needed)
UPDATE individual_trades 
SET symbol = 'EURUSD' 
WHERE symbol = 'UNKNOWN';

-- Step 3: Remove default in next migration (optional)
-- After all data migrated
```

**Removing Column** (Risky ⚠️):
```sql
-- Step 1: Stop using column in code (deploy first)
-- Step 2: Wait 1 week (ensure no rollback needed)
-- Step 3: Drop column in separate migration
ALTER TABLE individual_trades DROP COLUMN old_column;
```

### Migration Workflow

```bash
# On develop branch
git checkout develop
git pull origin develop

# Create migration
npm run drizzle:generate  # generates migration SQL
# Review migration files in drizzle/

# Apply to staging database
npm run drizzle:push  # or drizzle:migrate

# Test thoroughly on staging
# ... manual testing ...

# If good, merge to main
git checkout main
git merge develop

# Apply to production database
# (Can be automated in CI/CD or manual)
npm run drizzle:push
```

---

## Rollback Strategy

### Option 1: Git Revert (Recommended)

```bash
# Find the bad commit
git log --oneline

# Revert creates a new commit that undoes changes
git revert <commit-hash>
git push origin main

# Vercel auto-deploys the revert
# Database: may need manual rollback if schema changed
```

### Option 2: Vercel Instant Rollback

**Steps**:
1. Go to Vercel Dashboard → Deployments
2. Find the last known good deployment
3. Click "..." → "Promote to Production"
4. Rollback completes in ~30 seconds

**Use when**: Code change broke production, need immediate revert

### Option 3: Redeploy Previous Tag

```bash
# Checkout previous version
git checkout v1.0.0

# Create hotfix branch
git checkout -b hotfix/rollback-to-v1.0.0

# Force push to main (if allowed) or create emergency PR
git push origin hotfix/rollback-to-v1.0.0
# Create PR → main (fast-track)
```

### Database Rollback

**If migration broke production**:

```bash
# Option 1: Drizzle rollback (if supported)
npm run drizzle:rollback

# Option 2: Manual rollback
# Apply reverse migration SQL
# (This is why you keep migration history)

# Option 3: Restore from backup
# Turso provides point-in-time backups
# Restore database to before migration
```

---

## Version Numbering

We follow **Semantic Versioning** (SemVer 2.0.0):

```
MAJOR.MINOR.PATCH
  │     │      │
  │     │      └─ Bug fixes, no breaking changes
  │     └──────── New features, backward compatible
  └────────────── Breaking changes, major refactor
```

### Examples

| Version | Type | Description |
|---------|------|-------------|
| v1.0.0 | MAJOR | Initial production release |
| v1.1.0 | MINOR | Added trade symbol, user CSV import |
| v1.1.1 | PATCH | Fixed timezone bug in bulk entry |
| v1.2.0 | MINOR | Added economic news tab |
| v2.0.0 | MAJOR | Redesigned trade entry, removed old API |

### Versioning Files

Update these files for each release:

1. **package.json**:
```json
{
  "version": "1.1.0"
}
```

2. **CHANGELOG.md**:
```markdown
## [1.1.0] - 2026-01-20

### Added
- Trade symbol entry field
- User CSV import functionality
```

3. **README.md**:
```markdown
**Current Version**: 1.1.0
```

4. **Git Tag**:
```bash
git tag -a v1.1.0 -m "Release v1.1.0"
git push origin v1.1.0
```

---

## Setup Instructions

### Initial Setup (One-Time)

```bash
# 1. Clone repository
git clone https://github.com/Thewekang/WekangTrading.git
cd WekangTrading

# 2. Create develop branch from main
git checkout -b develop
git push origin develop

# 3. Set develop as default branch on GitHub
# GitHub → Settings → Branches → Default branch → develop
# This ensures PRs default to develop, not main

# 4. Set up branch protection rules (see above)
# GitHub → Settings → Branches → Add rule

# 5. Configure Vercel deployments
# Vercel → Project Settings → Git
# Production Branch: main
# Enable automatic deployments for branch: develop

# 6. Create staging database (optional but recommended)
# Turso → Create new database → wekangtrading-staging
# Update Vercel preview environment variables
```

### Daily Development Workflow

```bash
# Morning: Start new feature
git checkout develop
git pull origin develop
git checkout -b feature/my-new-feature

# Work: Make changes
git add .
git commit -m "feat: Add new functionality"

# Afternoon: Push and create PR
git push origin feature/my-new-feature
# Create PR on GitHub: feature/my-new-feature → develop

# Evening: After PR approved
# Merge via GitHub UI
# Delete feature branch

# Weekly: Release to production
# Create PR: develop → main
# Tag release after merge
```

---

## Best Practices

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, no logic change)
- `refactor`: Code refactor (no feature/bug change)
- `perf`: Performance improvement
- `test`: Adding/updating tests
- `chore`: Build process, dependencies

**Examples**:
```
feat(trades): Add symbol field to individual trade entry
fix(bulk-entry): Correct timezone validation logic
docs(api): Update API specification for v1.1.0
chore(deps): Upgrade Next.js to 15.5.10
```

### Pull Request Guidelines

**Title**: Use conventional commit format
```
feat: Add trade symbol entry to individual trades
```

**Description Template**:
```markdown
## Summary
Brief description of changes

## Changes Made
- Added `symbol` field to `individual_trades` table
- Updated trade entry forms to include symbol input
- Added validation for symbol format
- Updated trade list to display symbols

## Testing
- [ ] Tested on local development
- [ ] Tested on staging environment
- [ ] Manual testing completed
- [ ] No regressions found

## Screenshots (if UI changes)
[Add screenshots]

## Migration Required
- [ ] Yes (provide migration steps)
- [x] No

## Breaking Changes
- [ ] Yes (list breaking changes)
- [x] No

## Related Issues
Closes #123
```

---

## Pre-Deployment Checklist

Before merging to main:

**Code Quality**:
- [ ] All TypeScript errors resolved
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] No console errors in browser

**Testing**:
- [ ] Manual testing on staging complete
- [ ] All user flows tested
- [ ] Mobile responsive tested
- [ ] Different browsers tested (Chrome, Firefox, Safari)

**Database**:
- [ ] Migrations tested on staging
- [ ] Backup created (if schema changes)
- [ ] Rollback plan documented

**Documentation**:
- [ ] CHANGELOG.md updated
- [ ] API docs updated (if API changes)
- [ ] README updated (if needed)
- [ ] Migration guide written (if needed)

**Environment**:
- [ ] Environment variables updated in Vercel
- [ ] Secrets rotated (if needed)
- [ ] DNS updated (if domain change)

**Communication**:
- [ ] Team notified of deployment
- [ ] Users notified (if breaking changes)
- [ ] Maintenance window scheduled (if downtime expected)

---

## Monitoring Post-Deployment

After deploying to production:

**Immediate (0-15 minutes)**:
- [ ] Check Vercel deployment status
- [ ] Visit production URL
- [ ] Test login flow
- [ ] Test critical user flows
- [ ] Check browser console for errors
- [ ] Monitor error tracking (if set up)

**Short-term (1-24 hours)**:
- [ ] Monitor user reports
- [ ] Check analytics for anomalies
- [ ] Verify database performance
- [ ] Review server logs

**Long-term (1-7 days)**:
- [ ] Gather user feedback
- [ ] Monitor performance metrics
- [ ] Check for regression reports
- [ ] Plan next iteration

---

## Emergency Contacts

**Production Issues**:
1. Check Vercel deployment logs
2. Check Turso database status
3. Rollback using Vercel dashboard (if critical)
4. Contact team lead: [Your Contact Info]

**Escalation Path**:
1. Developer → Team Lead → Project Manager
2. For critical issues: Immediate rollback, investigate later

---

## Appendix: Command Reference

### Git Commands Quick Reference

```bash
# Branch Management
git checkout -b <branch-name>     # Create and switch
git branch -d <branch-name>       # Delete local
git push origin --delete <branch> # Delete remote

# Syncing
git fetch origin                  # Fetch all branches
git pull origin <branch>          # Pull specific branch
git push origin <branch>          # Push specific branch

# Merging
git merge <branch>                # Merge branch into current
git rebase <branch>               # Rebase current onto branch

# Tagging
git tag -a v1.0.0 -m "Message"   # Create annotated tag
git push origin v1.0.0           # Push tag
git push origin --tags           # Push all tags

# Reverting
git revert <commit-hash>         # Revert commit
git reset --hard HEAD~1          # Undo last commit (dangerous)

# Viewing
git log --oneline --graph        # Visual commit history
git status                       # Current status
git diff                         # Uncommitted changes
```

---

**Document Status**: ✅ Ready for Use  
**Last Review**: January 12, 2026  
**Next Review**: March 2026 or after major project changes

**Questions or Suggestions?**  
Contact project maintainer or create issue on GitHub.
