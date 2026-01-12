# Branch Setup & Initial Configuration Commands

**Document Version**: 1.0  
**Last Updated**: January 12, 2026  
**Project**: WekangTradingJournal  
**Purpose**: Step-by-step commands to set up branching strategy

---

## Prerequisites

- [x] Git installed and configured
- [x] GitHub repository access (Thewekang/WekangTrading)
- [x] Local clone of repository
- [x] Admin access to GitHub repository settings

---

## Step 1: Create and Push Develop Branch

```powershell
# Ensure you're on main and up to date
git checkout main
git pull origin main

# Create develop branch from main
git checkout -b develop

# Push develop branch to remote
git push origin develop

# Verify branches
git branch -a
# Should show:
# * develop
#   main
#   remotes/origin/develop
#   remotes/origin/main
```

**Expected Result**: `develop` branch created and pushed to GitHub

---

## Step 2: Set Develop as Default Branch on GitHub

**Via GitHub Web Interface**:

1. Go to https://github.com/Thewekang/WekangTrading
2. Click **Settings** (top menu)
3. Click **Branches** (left sidebar)
4. Under "Default branch", click the switch icon
5. Select **develop** from dropdown
6. Click **Update**
7. Confirm the change

**Why?**: Pull requests will default to `develop` instead of `main`, protecting production

**Verification**: Create a new branch and check PR target - should be `develop`

---

## Step 3: Configure Branch Protection Rules

### Protect `main` Branch

**Via GitHub Web Interface**:

1. Go to **Settings** → **Branches**
2. Click **Add branch protection rule**
3. Branch name pattern: `main`
4. Configure settings:

```yaml
✅ Require a pull request before merging
   ✅ Require approvals: 1
   ✅ Dismiss stale pull request approvals when new commits are pushed
   ⚠️ Require review from Code Owners (optional - if CODEOWNERS file exists)

✅ Require status checks to pass before merging
   ✅ Require branches to be up to date before merging
   Status checks to require:
   - Vercel (Production build)
   ⚠️ Add more as CI/CD grows (linting, tests, etc.)

✅ Require conversation resolution before merging

⚠️ Require signed commits (optional - enhanced security)

✅ Require linear history (optional - cleaner history)

✅ Do not allow bypassing the above settings

❌ Allow force pushes
❌ Allow deletions
```

5. Click **Create** (bottom of page)

### Protect `develop` Branch

**Via GitHub Web Interface**:

1. Click **Add branch protection rule** again
2. Branch name pattern: `develop`
3. Configure settings:

```yaml
⚠️ Require a pull request before merging (optional for solo dev)
   ⚠️ Require approvals: 0 (or 1 if team review desired)

✅ Require status checks to pass before merging
   Status checks to require:
   - Vercel (Preview build)

❌ Require conversation resolution (optional)

❌ Do not allow bypassing (optional - allows emergency fixes)

❌ Allow force pushes (use with extreme caution!)
❌ Allow deletions
```

4. Click **Create**

**Verification**: Try to push directly to `main` - should be blocked

---

## Step 4: Configure Vercel Deployment Settings

### Via Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select **WekangTrading** project
3. Go to **Settings** → **Git**
4. Configure Production Branch:

```yaml
Production Branch: main
✅ Automatic Deployments: Enabled
```

5. Configure Preview Deployments:

```yaml
✅ Automatic Preview Deployments for:
   - develop branch
   - All feature branches

Preview Prefix: wekangtrading
```

**Result**:
- `main` branch → Deploys to `wekangtrading.vercel.app` (production)
- `develop` branch → Deploys to preview URL (e.g., `wekangtrading-git-develop.vercel.app`)
- Feature branches → Each gets unique preview URL

---

## Step 5: Configure Environment Variables

### Staging Environment Variables (Optional but Recommended)

**Via Vercel Dashboard**:

1. Go to **Settings** → **Environment Variables**
2. For each production variable, create a **Preview** version:

```env
# Preview Environment (develop + feature branches)
TURSO_DATABASE_URL=libsql://wekangtrading-staging.turso.io
TURSO_AUTH_TOKEN=<staging-token>
NEXTAUTH_URL=https://wekangtrading-git-develop.vercel.app
NEXTAUTH_SECRET=<staging-secret>
NODE_ENV=preview
```

3. Select **Preview** for environment
4. Click **Save**

**Why?**: Keeps staging data separate from production data

**Alternative**: If you don't want separate DB, use same credentials for Preview

---

## Step 6: Create Staging Database in Turso (Optional)

### Via Turso CLI

```powershell
# Install Turso CLI (if not installed)
curl -sSfL https://get.tur.so/install.sh | bash

# Login to Turso
turso auth login

# Create staging database
turso db create wekangtrading-staging --location sin

# Get database URL
turso db show wekangtrading-staging --url

# Create auth token
turso db tokens create wekangtrading-staging

# Copy URL and token to Vercel environment variables (Preview)
```

**Why?**: Allows testing database changes without affecting production

**Alternative**: Skip this step and use production database for staging (not recommended)

---

## Step 7: Configure Vercel Cron Jobs (for v1.1.0)

**Note**: Only needed after v1.1.0 (Economic News feature)

### Via vercel.json

Create `vercel.json` in project root (will be done in v1.1.0):

```json
{
  "crons": [{
    "path": "/api/cron/sync-economic-news",
    "schedule": "0 */4 * * *"
  }]
}
```

**Why?**: Syncs economic news data every 4 hours

---

## Step 8: Verify Setup

### Test Workflow

```powershell
# Create a test feature branch
git checkout develop
git checkout -b feature/test-setup

# Make a small change (e.g., add comment to README)
echo "# Test comment" >> README.md
git add README.md
git commit -m "test: Verify branching workflow"

# Push feature branch
git push origin feature/test-setup
```

**On GitHub**:

1. Go to repository
2. Click **Pull requests** → **New pull request**
3. Base should be **develop** (not main!)
4. Compare should be **feature/test-setup**
5. Click **Create pull request**
6. Check that Vercel deployment starts automatically
7. Merge PR
8. Delete feature branch

**Expected Results**:
✅ PR defaults to `develop` branch  
✅ Vercel creates preview deployment  
✅ Status checks run  
✅ Can merge after checks pass  
✅ Can delete branch after merge  

**Cleanup**:
```powershell
git checkout develop
git pull origin develop
git branch -d feature/test-setup
```

---

## Step 9: Tag v1.0.0 Release

```powershell
# Ensure you're on main with latest changes
git checkout main
git pull origin main

# Create annotated tag
git tag -a v1.0.0 -m "Release v1.0.0 - Initial Production Release

Core features:
- Individual trade tracking
- Bulk trade entry  
- Dashboard with analytics
- Target management
- Admin panel
- SOP types system

See CHANGELOG.md for full details"

# Push tag to remote
git push origin v1.0.0

# Verify tag
git tag -l
git show v1.0.0
```

**On GitHub**:

1. Go to **Releases**
2. Click **Create a new release**
3. Choose tag: **v1.0.0**
4. Release title: `v1.0.0 - Initial Production Release`
5. Description: Copy from CHANGELOG.md
6. Click **Publish release**

**Verification**: https://github.com/Thewekang/WekangTrading/releases/tag/v1.0.0

---

## Step 10: Update Local Git Config (Optional)

### Set up aliases for common commands

```powershell
# Checkout develop quickly
git config alias.dev 'checkout develop'

# Checkout main quickly
git config alias.prod 'checkout main'

# Pull and rebase
git config alias.up 'pull --rebase'

# Pretty log
git config alias.lg "log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit"

# Show status short
git config alias.st 'status -sb'

# Show branches with last commit
git config alias.br 'branch -vv'
```

**Usage**:
```powershell
git dev          # checkout develop
git prod         # checkout main
git st           # short status
git lg           # pretty log
```

---

## Common Workflows (Quick Reference)

### Start New Feature

```powershell
git dev && git pull origin develop
git checkout -b feature/my-feature
# ... make changes ...
git add .
git commit -m "feat: Add new feature"
git push origin feature/my-feature
# Create PR on GitHub: feature/my-feature → develop
```

### Fix Production Bug (Hotfix)

```powershell
git prod && git pull origin main
git checkout -b hotfix/fix-critical-bug
# ... make changes ...
git add .
git commit -m "fix: Correct critical bug"
git push origin hotfix/fix-critical-bug
# Create PR on GitHub: hotfix/fix-critical-bug → main (URGENT)
# After merge to main:
git dev && git merge main  # Backport to develop
```

### Release to Production

```powershell
# Create release branch
git dev && git pull origin develop
git checkout -b release/v1.1.0

# Update version and changelog
# ... edit package.json, CHANGELOG.md ...
git add .
git commit -m "chore: Prepare release v1.1.0"
git push origin release/v1.1.0

# Create PR: release/v1.1.0 → main
# After merge:
git prod && git pull origin main
git tag -a v1.1.0 -m "Release v1.1.0"
git push origin v1.1.0

# Backport to develop
git dev && git merge main
```

---

## Troubleshooting

### Problem: Can't Push to Main

**Error**: `remote: error: GH006: Protected branch update failed`

**Solution**: This is expected! You must create a Pull Request.

```powershell
# Push to feature branch instead
git checkout -b feature/my-changes
git push origin feature/my-changes
# Then create PR on GitHub
```

### Problem: Pull Request Defaults to Main

**Error**: PR target is `main` instead of `develop`

**Solution**: Change default branch on GitHub (Step 2)

**Workaround**: Manually select `develop` as base when creating PR

### Problem: Vercel Deployment Doesn't Start

**Error**: No automatic deployment after PR creation

**Solution**: Check Vercel integration settings

```
Vercel Dashboard → WekangTrading → Settings → Git
Ensure "Automatic Deployments" is enabled
```

### Problem: Branch Protection Blocks Emergency Fix

**Error**: Need to push directly to `main` for critical fix

**Solution**: Temporarily disable branch protection (use with caution!)

```
GitHub → Settings → Branches → Edit rule for main
Uncheck "Require a pull request"
Make emergency fix
Re-enable protection immediately
```

**Better Approach**: Use hotfix workflow with fast-tracked PR review

---

## Verification Checklist

After completing all steps:

- [ ] `develop` branch exists on GitHub
- [ ] `develop` is default branch
- [ ] `main` branch is protected (requires PR + 1 approval)
- [ ] `develop` branch is protected (requires passing builds)
- [ ] Cannot push directly to `main`
- [ ] PR defaults to `develop` base
- [ ] Vercel deploys `main` to production
- [ ] Vercel deploys `develop` and feature branches to preview
- [ ] v1.0.0 tag created and published
- [ ] GitHub release created for v1.0.0
- [ ] Staging database created (optional)
- [ ] Preview environment variables configured (optional)

---

## Next Steps

1. **Read workflow documentation**: [GIT-WORKFLOW-STRATEGY.md](./GIT-WORKFLOW-STRATEGY.md)
2. **Start v1.1.0 development**: [11-VERSION-1.1.0-ROADMAP.md](../11-VERSION-1.1.0-ROADMAP.md)
3. **Create first feature branch**: 
   ```powershell
   git checkout develop
   git checkout -b feature/trade-symbol-entry
   ```

---

## Additional Resources

- **Git Flow Cheat Sheet**: https://danielkummer.github.io/git-flow-cheatsheet/
- **Conventional Commits**: https://www.conventionalcommits.org/
- **Semantic Versioning**: https://semver.org/
- **GitHub Branch Protection**: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches
- **Vercel Git Integration**: https://vercel.com/docs/deployments/git

---

**Document Status**: ✅ Ready for Execution  
**Estimated Time**: 30-45 minutes to complete all steps  
**Required Role**: Repository Admin

**Questions?** Contact project maintainer or create issue on GitHub.
