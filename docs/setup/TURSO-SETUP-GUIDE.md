# 🗄️ Turso Production Database Setup (Without CLI)

**For Windows Users Having Installation Issues**

---

## ✨ **METHOD 1: Use Turso Web Dashboard (Easiest!)**

### Step 1: Create Account & Database

1. **Go to Turso Dashboard**:
   - Visit: https://turso.tech/app
   - Sign up with GitHub or Email

2. **Create Production Database**:
   - Click "Create Database"
   - Name: `wekangtrading-prod`
   - Region: Choose closest to your location (e.g., `aws-us-east-1`)
   - Click "Create"

3. **Get Connection Credentials**:
   - Click on your new database `wekangtrading-prod`  - outdated need verification
   - You'll see:
     - **Database URL**: `libsql://wekangtrading-prod-[your-name].turso.io` outdated need verification
     - Click "Create Token" button
     - Copy the **Auth Token** (starts with `eyJ...`) outdated need verification

**📝 Save these 2 values** - you need them for Vercel!

---

## 🔧 **METHOD 2: Install Turso CLI Manually**

### For Windows 10/11:

**Step 1: Download Turso CLI**
1. Go to: https://github.com/tursodatabase/turso-cli/releases/latest
2. Find **Assets** section
3. Download: `turso-windows-amd64.exe`
4. Rename to: `turso.exe`

**Step 2: Install to PATH**
```powershell
# Move turso.exe to a location in your PATH
Move-Item -Path "$env:USERPROFILE\Downloads\turso.exe" -Destination "C:\Windows\System32\turso.exe"
```

**OR** add to your user directory:
```powershell
# Create a bin directory
New-Item -Path "$env:USERPROFILE\bin" -ItemType Directory -Force

# Move turso.exe there
Move-Item -Path "$env:USERPROFILE\Downloads\turso.exe" -Destination "$env:USERPROFILE\bin\turso.exe"

# Add to PATH permanently
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$env:USERPROFILE\bin", [EnvironmentVariableTarget]::User)
```

**Step 3: Verify Installation**
```powershell
# Close and reopen PowerShell, then:
turso --version
```

**Step 4: Use CLI**
```powershell
# Login
turso auth login

# Create database
turso db create wekangtrading-prod

# Get URL
turso db show wekangtrading-prod --url

# Get token
turso db tokens create wekangtrading-prod
```

---

## 🚀 **Quick Start: Skip CLI Entirely**

**You can deploy to Vercel WITHOUT installing Turso CLI!**

### Steps:

1. **Create Database via Web** (see Method 1 above)
   - Get URL and Token from dashboard

2. **Deploy to Vercel**:
   - Go to https://vercel.com
   - Import your GitHub repo: `Thewekang/WekangTrading`
   - Add environment variables:
     ```
     DATABASE_URL=libsql://wekangtrading-prod-xxx.turso.io
     DATABASE_AUTH_TOKEN=eyJ...
     NEXTAUTH_URL=https://your-app.vercel.app
     NEXTAUTH_SECRET=[generate with OpenSSL or online tool]
     NODE_ENV=production
     ```

3. **Run Migrations AFTER Vercel Deploy**:
   ```powershell
   # Set environment variables temporarily
   $env:DATABASE_URL = "libsql://wekangtrading-prod-xxx.turso.io"
   $env:DATABASE_AUTH_TOKEN = "eyJ..."
   
   # Run migrations
   npx prisma migrate deploy
   
   # Seed data
   npx tsx scripts/seed-production.ts
   
   # Clear variables
   Remove-Item Env:\DATABASE_URL
   Remove-Item Env:\DATABASE_AUTH_TOKEN
   ```

---

## 🎯 **RECOMMENDED: Web Dashboard Method**

**Pros**:
- ✅ No CLI installation needed
- ✅ Visual interface (easier)
- ✅ Works on any OS
- ✅ Database browser included
- ✅ Easy token management

**Cons**:
- ❌ Need to use Prisma for migrations (but you're doing that anyway!)

---

## 📊 **After Database is Created**

### View Your Data:
1. Go to Turso Dashboard
2. Click your database
3. Click "Open Shell" or "Data Browser"
4. Run SQL queries directly in browser!

### Example Queries:
```sql
-- Check users
SELECT * FROM users;

-- Check trades count
SELECT COUNT(*) FROM individual_trades;

-- Check SOP types
SELECT * FROM sop_types;
```

---

## 🆘 **Troubleshooting**

### "Cannot download turso.exe"
**Solution**: Download manually from GitHub releases

### "turso command not found"
**Solution**: Either:
1. Use web dashboard instead (recommended)
2. Ensure turso.exe is in your PATH

### "Database connection failed"
**Solution**: 
- Check your `DATABASE_URL` is correct
- Check your `DATABASE_AUTH_TOKEN` is valid
- Regenerate token in Turso dashboard if needed

---

## 🎉 **What You Need for Vercel**

To deploy on Vercel, you only need these 2 values from Turso:

1. **DATABASE_URL**: 
   - Format: `libsql://[database-name]-[org-name].turso.io`
   - Example: `libsql://wekangtrading-prod-john.turso.io`

2. **DATABASE_AUTH_TOKEN**: 
   - Format: Long JWT token starting with `eyJ...`
   - Example: `eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...` (very long)

**Get both from Turso Web Dashboard!**

---

## ✅ **Next Steps**

After getting your Turso credentials:

1. ✅ Generate NEXTAUTH_SECRET:
   ```powershell
   # Generate random secret
   -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
   ```

2. ✅ Go to Vercel:
   - https://vercel.com
   - Import `Thewekang/WekangTrading`
   - Add all 5 environment variables

3. ✅ Deploy and test!

---

**Need help?** Check the main [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) or ask for assistance!

**Last Updated**: January 11, 2026
