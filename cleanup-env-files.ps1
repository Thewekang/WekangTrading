# Environment Files Cleanup Script
# Purpose: Remove outdated Vercel-generated .env files
# Date: January 28, 2026

Write-Host "`n🧹 Environment Files Cleanup Script" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Check current directory
$currentPath = Get-Location
Write-Host "📁 Current directory: $currentPath`n" -ForegroundColor Gray

# List all current .env files
Write-Host "📋 Current .env files:" -ForegroundColor Yellow
Get-ChildItem -Filter ".env*" | Select-Object Name, Length, LastWriteTime | Format-Table -AutoSize

# Confirm before proceeding
Write-Host "`n⚠️  This will DELETE the following files:" -ForegroundColor Yellow
Write-Host "   - .env.preview" -ForegroundColor Red
Write-Host "   - .env.production" -ForegroundColor Red
Write-Host "   - .env.production.local" -ForegroundColor Red
Write-Host "   - .env.vercel`n" -ForegroundColor Red

Write-Host "✅ These files will be KEPT:" -ForegroundColor Green
Write-Host "   - .env.example (template)" -ForegroundColor Green
Write-Host "   - .env.local (your active config)`n" -ForegroundColor Green

$confirmation = Read-Host "Do you want to proceed? (yes/no)"

if ($confirmation -ne "yes") {
    Write-Host "`n❌ Cleanup cancelled." -ForegroundColor Red
    exit
}

# Backup .env.local
Write-Host "`n📦 Creating backup of .env.local..." -ForegroundColor Cyan
if (Test-Path ".env.local") {
    $backupName = ".env.local.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Copy-Item ".env.local" $backupName
    Write-Host "✅ Backup created: $backupName" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env.local not found (nothing to backup)" -ForegroundColor Yellow
}

# Delete Vercel-generated files
Write-Host "`n🗑️  Deleting Vercel-generated files..." -ForegroundColor Cyan

$filesToDelete = @(
    ".env.preview",
    ".env.production",
    ".env.production.local",
    ".env.vercel"
)

$deletedCount = 0
foreach ($file in $filesToDelete) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "   ✅ Deleted: $file" -ForegroundColor Green
        $deletedCount++
    } else {
        Write-Host "   ⚠️  Not found: $file (already clean)" -ForegroundColor Gray
    }
}

# Show results
Write-Host "`n📊 Cleanup Results:" -ForegroundColor Cyan
Write-Host "   Files deleted: $deletedCount" -ForegroundColor Yellow
Write-Host "   Backup created: $(if (Test-Path ".env.local") { 'Yes' } else { 'N/A' })" -ForegroundColor Yellow

# List remaining .env files
Write-Host "`n✨ Remaining .env files:" -ForegroundColor Green
Get-ChildItem -Filter ".env*" | Select-Object Name, Length, LastWriteTime | Format-Table -AutoSize

# Check for missing variables in .env.local
Write-Host "🔍 Checking .env.local for required variables..." -ForegroundColor Cyan
if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local" -Raw
    
    $requiredVars = @{
        "TURSO_DATABASE_URL" = "Database URL"
        "TURSO_AUTH_TOKEN" = "Database auth token"
        "NEXTAUTH_SECRET" = "NextAuth secret"
        "NEXTAUTH_URL" = "NextAuth URL"
        "RAPIDAPI_KEY" = "RapidAPI key"
        "CRON_SECRET" = "Cron job secret (optional for local)"
    }
    
    Write-Host ""
    $missingVars = @()
    foreach ($var in $requiredVars.Keys) {
        if ($envContent -match $var) {
            Write-Host "   ✅ $var - Found" -ForegroundColor Green
        } else {
            Write-Host "   ❌ $var - Missing" -ForegroundColor Red
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -gt 0) {
        Write-Host "`n⚠️  Missing variables found!" -ForegroundColor Yellow
        Write-Host "   Add these to .env.local:" -ForegroundColor Yellow
        foreach ($var in $missingVars) {
            Write-Host "   $var=`"your-value-here`"" -ForegroundColor Gray
        }
    } else {
        Write-Host "`n✅ All required variables present!" -ForegroundColor Green
    }
} else {
    Write-Host "   ⚠️  .env.local not found" -ForegroundColor Red
    Write-Host "   Create one by copying .env.example:" -ForegroundColor Yellow
    Write-Host "   Copy-Item .env.example .env.local" -ForegroundColor Gray
}

# Final instructions
Write-Host "`n📝 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Verify .env.local has all required variables" -ForegroundColor White
Write-Host "   2. Add CRON_SECRET to Vercel Dashboard (Production)" -ForegroundColor White
Write-Host "   3. Test local development: npm run dev" -ForegroundColor White
Write-Host "   4. Deploy to production" -ForegroundColor White

Write-Host "`n📚 Documentation:" -ForegroundColor Cyan
Write-Host "   See docs/deployment/ENV-FILES-CLEANUP.md for details`n" -ForegroundColor Gray

Write-Host "✨ Cleanup complete!" -ForegroundColor Green
