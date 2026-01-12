# Local Development Setup Guide

Quick reference for switching between dev and production databases during local development.

---

## 🔄 Switching Between Databases

### Using Production Database Locally (Recommended for Testing)

**When to use:** 
- Testing fixes before deploying to Vercel
- Debugging production issues
- Verifying features with real data

**Setup:**
Edit `.env.local`:
```env
# Turso Database Connection - USING PRODUCTION DATABASE
TURSO_DATABASE_URL="libsql://wekangtrading-prod-thewekang.aws-eu-west-1.turso.io"
TURSO_AUTH_TOKEN="eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjgxMjk4ODksImlkIjoiNGQ3Y2I3OGMtNGE4ZC00ZDljLWEyYTctYWVlNzAzNDgyOTk5IiwicmlkIjoiOTdiNDE2YjMtNWExYi00NjZmLTg0OGMtMGRiZTI5YzNkZmE5In0.C2BH_YKLQJxZuL7F2JBlp9qLeo7_IdlQVbsR7ra3TeC-uXfZ_9tmjSuTrGZEDbV6MMYjucY6STjqvOL0-pR5AQ"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="kJ8v2mP9nQ7wX3yZ5bC8dE1fG4hI6jK0lM2nO5pR7sT9uV1wX4yZ6aB8cD0eF2g"
```

---

### Using Dev Database Locally (For Experimentation)

**When to use:**
- Experimenting with new features
- Testing database migrations
- Don't want to affect production data

**Setup:**
Edit `.env.local`:
```env
# Turso Database Connection - USING DEV DATABASE
TURSO_DATABASE_URL="libsql://wekangtrading-dev-thewekang.aws-eu-west-1.turso.io"
TURSO_AUTH_TOKEN="eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjgxMTA2MjQsImlkIjoiZWVjOTNiNmYtYmViMi00OWEwLTkzOGItZjRkYWU3MDRkODk2IiwicmlkIjoiMjdiNjc2NWEtZjhkMS00ODJkLThjMjItYTU4MTRjZjJlNTRhIn0.JoxK_9fkX-ZzdGWEKBZHNx3BWR37174TxNl6PhMhi9QM-EHRtYhaIhPk6UIRLFjS8BVCpP9AQ0GRsElVJMw3AQ"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="kJ8v2mP9nQ7wX3yZ5bC8dE1fG4hI6jK0lM2nO5pR7sT9uV1wX4yZ6aB8cD0eF2g"
```

---

## 🚀 Starting Local Development

After changing database in `.env.local`:

```powershell
npm run dev
```

Access at: http://localhost:3000

**Admin Login:**
- Email: `admin@wekangtrading.com`
- Password: `WekangAdmin2026!`

---

## 🛑 Pausing/Resuming Vercel Auto-Deploy

### Pause Auto-Deploy (Test Locally First)

**Option 1: Using vercel.json** (Current Method)
Create `vercel.json`:
```json
{
  "git": {
    "deploymentEnabled": {
      "main": false
    }
  }
}
```

Commit and push:
```powershell
git add vercel.json
git commit -m "chore: pause auto-deployment"
git push
```

**Option 2: Via Vercel Dashboard**
1. Go to https://vercel.com/wekangs-projects/wekangtrading/settings/git
2. Toggle OFF "Automatic Deployments from Git"

---

### Resume Auto-Deploy

**Option 1: Delete vercel.json**
```powershell
Remove-Item vercel.json
git add vercel.json
git commit -m "chore: resume auto-deployment"
git push
```

**Option 2: Via Vercel Dashboard**
1. Go to https://vercel.com/wekangs-projects/wekangtrading/settings/git
2. Toggle ON "Automatic Deployments from Git"

---

## 📊 Database Credentials Reference

### Production Database
```
Name: wekangtrading-prod
URL: libsql://wekangtrading-prod-thewekang.aws-eu-west-1.turso.io
Token: eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjgxMjk4ODksImlkIjoiNGQ3Y2I3OGMtNGE4ZC00ZDljLWEyYTctYWVlNzAzNDgyOTk5IiwicmlkIjoiOTdiNDE2YjMtNWExYi00NjZmLTg0OGMtMGRiZTI5YzNkZmE5In0.C2BH_YKLQJxZuL7F2JBlp9qLeo7_IdlQVbsR7ra3TeC-uXfZ_9tmjSuTrGZEDbV6MMYjucY6STjqvOL0-pR5AQ
Region: aws-eu-west-1
```

### Dev Database
```
Name: wekangtrading-dev
URL: libsql://wekangtrading-dev-thewekang.aws-eu-west-1.turso.io
Token: eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjgxMTA2MjQsImlkIjoiZWVjOTNiNmYtYmViMi00OWEwLTkzOGItZjRkYWU3MDRkODk2IiwicmlkIjoiMjdiNjc2NWEtZjhkMS00ODJkLThjMjItYTU4MTRjZjJlNTRhIn0.JoxK_9fkX-ZzdGWEKBZHNx3BWR37174TxNl6PhMhi9QM-EHRtYhaIhPk6UIRLFjS8BVCpP9AQ0GRsElVJMw3AQ
Region: aws-eu-west-1
```

---

## 🔧 Turso CLI (Optional - For Advanced Operations)

### Install Turso CLI (Windows)

Turso CLI requires WSL on Windows:

1. **Install WSL** (if not already installed):
   ```powershell
   wsl --install
   ```

2. **Open WSL terminal**:
   ```powershell
   wsl
   ```

3. **Install Turso CLI in WSL**:
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
   ```

4. **Verify installation** (open new WSL terminal):
   ```bash
   turso --version
   ```

### Common Turso CLI Commands

**Authenticate:**
```bash
turso auth login
```

**List databases:**
```bash
turso db list
```

**Show database info:**
```bash
turso db show wekangtrading-prod
```

**Create new token:**
```bash
turso db tokens create wekangtrading-prod
```

**Connect to database shell:**
```bash
turso db shell wekangtrading-prod
```

**View database URL:**
```bash
turso db show wekangtrading-prod --url
```

---

## 📝 Development Workflow

### Recommended Flow for Bug Fixes

1. **Pause auto-deploy** (create vercel.json or use dashboard)
2. **Switch to production database** (edit `.env.local`)
3. **Start dev server** (`npm run dev`)
4. **Test fixes locally** with production data
5. **Verify everything works** at http://localhost:3000
6. **Commit fixes** (`git add . && git commit && git push`)
7. **Resume auto-deploy** (delete vercel.json or use dashboard)
8. **Verify in production** at https://wekangtrading.vercel.app

### Quick Testing Flow

```powershell
# 1. Use production DB locally
# Edit .env.local to use prod credentials

# 2. Start dev server
npm run dev

# 3. Test at http://localhost:3000

# 4. When ready, commit
git add .
git commit -m "fix: description of fix"
git push

# Vercel will auto-deploy (if enabled)
```

---

## ⚠️ Important Notes

- **Production DB Token**: Never commit `.env.local` to git (already in .gitignore)
- **Testing Locally**: Always test with production database before deploying
- **Auto-Deploy**: Keep paused while actively debugging/testing
- **Data Safety**: Production database is used by live app - be careful with destructive operations
- **Token Expiry**: Turso tokens don't expire unless revoked manually
- **WSL Required**: Turso CLI only works in WSL on Windows (not PowerShell directly)

---

## 🔗 Quick Links

- **Vercel Dashboard**: https://vercel.com/wekangs-projects/wekangtrading
- **Vercel Git Settings**: https://vercel.com/wekangs-projects/wekangtrading/settings/git
- **Turso Dashboard**: https://turso.tech/dashboard
- **Turso CLI Docs**: https://docs.turso.tech/cli/introduction
- **Production App**: https://wekangtrading.vercel.app
- **Local Dev**: http://localhost:3000

---

**Last Updated**: January 12, 2026
**Maintained by**: Development Team
