# Apply all Prisma migrations to Turso production database
# Run this script after setting DATABASE_URL and DATABASE_AUTH_TOKEN environment variables

Write-Host "🚀 Applying migrations to Turso production database..." -ForegroundColor Cyan

$migrations = @(
    "20260107211217_init",
    "20260108124529_add_overlap_session_trades",
    "20260109043626_add_session_wins_to_daily_summary",
    "20260109062052_add_target_fields",
    "20260110024702_add_invite_codes",
    "20260110042500_add_reset_count_to_users",
    "20260110170615_add_sop_types"
)

foreach ($migration in $migrations) {
    Write-Host "📝 Applying migration: $migration" -ForegroundColor Yellow
    $sqlFile = "prisma/migrations/$migration/migration.sql"
    
    if (Test-Path $sqlFile) {
        $sql = Get-Content $sqlFile -Raw
        $sqlEscaped = $sql -replace '"', '\"' -replace '\r?\n', ' '
        
        wsl bash -c "export PATH=/home/h4mim/.turso:`$PATH && echo '$sqlEscaped' | turso db shell wekangtrading-prod"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Migration applied successfully" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Migration failed" -ForegroundColor Red
        }
    } else {
        Write-Host "   ⚠️  Migration file not found: $sqlFile" -ForegroundColor Red
    }
}

Write-Host "`n🎉 All migrations applied!" -ForegroundColor Green
Write-Host "Next: Run seed script with 'npx tsx prisma/seed/seed.ts'" -ForegroundColor Cyan
