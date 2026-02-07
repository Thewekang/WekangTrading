# Apply Migration 0009 to Production Database
# Quote System + Discipline Tracker Enhancements
# Date: February 8, 2026
# Version: 1.7.0

Write-Host "🚀 Applying Migration 0009 to Production Database" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Database name
$DB_NAME = "wekangtrading-prod"

Write-Host "📋 Migration Details:" -ForegroundColor Yellow
Write-Host "  • Create trading_quotes table"
Write-Host "  • Add quote system fields to users table"
Write-Host "  • Update discipline_tracker_rows (is_aplus_day, is_range_expansion_day)"
Write-Host ""

# Confirm before proceeding
$confirmation = Read-Host "⚠️  Apply to PRODUCTION ($DB_NAME)? (yes/no)"
if ($confirmation -ne "yes") {
    Write-Host "❌ Migration cancelled" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔧 Applying migration via WSL + Turso CLI..." -ForegroundColor Green

# Apply migration using WSL
$migrationFile = "apply-migration-0009.sql"

Write-Host "📂 Reading migration file: $migrationFile" -ForegroundColor Gray

# Execute via WSL with proper PATH
wsl -e bash -c "export PATH=/home/h4mim/.turso:`$PATH && cd /mnt/g/'Hasil Kerja'/Website/WekangTrading && turso db shell $DB_NAME < $migrationFile"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Migration applied successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔍 Verifying migration..." -ForegroundColor Yellow
    
    # Verify tables exist
    Write-Host "  • Checking trading_quotes table..."
    wsl -e bash -c "export PATH=/home/h4mim/.turso:`$PATH && turso db shell $DB_NAME '.schema trading_quotes'"
    
    Write-Host ""
    Write-Host "  • Checking users table columns..."
    wsl -e bash -c "export PATH=/home/h4mim/.turso:`$PATH && turso db shell $DB_NAME 'PRAGMA table_info(users)' | grep -E 'show_quotes|quotes_cooldown|last_quote'"
    
    Write-Host ""
    Write-Host "✅ Migration 0009 completed!" -ForegroundColor Green
    Write-Host "🎯 Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Test quote system in production"
    Write-Host "  2. Monitor error logs"
    Write-Host "  3. Update deployment docs"
} else {
    Write-Host ""
    Write-Host "❌ Migration failed! Exit code: $LASTEXITCODE" -ForegroundColor Red
    Write-Host "⚠️  Check error messages above" -ForegroundColor Yellow
    exit 1
}
