# Apply Migration 0009 Directly to Production using LibSQL HTTP API
# Date: February 8, 2026
# Version: 1.7.0

Write-Host "🚀 Applying Migration 0009 to Production (Direct Method)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# Production database credentials
$DB_URL = "https://wekangtrading-prod-thewekang.aws-eu-west-1.turso.io"
$AUTH_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjgxMjk4ODksImlkIjoiNGQ3Y2I3OGMtNGE4ZC00ZDljLWEyYTctYWVlNzAzNDgyOTk5IiwicmlkIjoiOTdiNDE2YjMtNWExYi00NjZmLTg0OGMtMGRiZTI5YzNkZmE5In0.C2BH_YKLQJxZuL7F2JBlp9qLeo7_IdlQVbsR7ra3TeC-uXfZ_9tmjSuTrGZEDbV6MMYjucY6STjqvOL0-pR5AQ"

Write-Host "📋 Migration Steps:" -ForegroundColor Yellow
Write-Host "  1. Create trading_quotes table"
Write-Host "  2. Add quote system fields to users table"
Write-Host "  3. Update discipline_tracker_rows table"
Write-Host ""

# Confirm
$confirmation = Read-Host "⚠️  Apply to PRODUCTION? (yes/no)"
if ($confirmation -ne "yes") {
    Write-Host "❌ Migration cancelled" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔧 Reading migration file..." -ForegroundColor Green
$migrationSQL = Get-Content "apply-migration-0009.sql" -Raw

# Split into individual statements
$statements = $migrationSQL -split '-->\s*statement-breakpoint' | Where-Object { $_.Trim() -ne '' -and $_.Trim() -ne '' }

Write-Host "📝 Found $($statements.Count) SQL statements" -ForegroundColor Gray
Write-Host ""

$successCount = 0
$errorCount = 0

foreach ($statement in $statements) {
    $cleanStatement = $statement.Trim()
    if ($cleanStatement -eq '' -or $cleanStatement -match '^\s*--') {
        continue
    }
    
    # Remove comments
    $cleanStatement = ($cleanStatement -split ';')[0].Trim()
    if ($cleanStatement -eq '') {
        continue
    }
    
    Write-Host "▶ Executing: $($cleanStatement.Substring(0, [Math]::Min(60, $cleanStatement.Length)))..." -ForegroundColor Gray
    
    # Create JSON body
    $body = @{
        statements = @($cleanStatement)
    } | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-RestMethod -Uri "$DB_URL/v2/pipeline" -Method POST -Headers @{
            "Authorization" = "Bearer $AUTH_TOKEN"
            "Content-Type" = "application/json"
        } -Body $body -ErrorAction Stop
        
        if ($response.results -and $response.results[0].type -eq "ok") {
            Write-Host "  ✅ Success" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "  ⚠️  Unexpected response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Yellow
        }
    } catch {
        $errorMessage = $_.Exception.Message
        if ($errorMessage -match "duplicate column name" -or $errorMessage -match "already exists") {
            Write-Host "  ⏭️  Already exists (skipping)" -ForegroundColor Cyan
            $successCount++
        } else {
            Write-Host "  ❌ Error: $errorMessage" -ForegroundColor Red
            $errorCount++
        }
    }
}

Write-Host ""
Write-Host "📊 Migration Summary:" -ForegroundColor Cyan
Write-Host "  ✅ Successful: $successCount" -ForegroundColor Green
Write-Host "  ❌ Errors: $errorCount" -ForegroundColor $(if ($errorCount -gt 0) { "Red" } else { "Gray" })

if ($errorCount -eq 0) {
    Write-Host ""
    Write-Host "🔍 Verifying migration..." -ForegroundColor Yellow
    
    # Verify trading_quotes table
    Write-Host "  • Checking trading_quotes table..." -ForegroundColor Gray
    $checkQuery = @{ statements = @("SELECT name FROM sqlite_master WHERE type='table' AND name='trading_quotes'") } | ConvertTo-Json
    try {
        $verifyResponse = Invoke-RestMethod -Uri "$DB_URL/v2/pipeline" -Method POST -Headers @{
            "Authorization" = "Bearer $AUTH_TOKEN"
            "Content-Type" = "application/json"
        } -Body $checkQuery
        
        if ($verifyResponse.results[0].response.results.rows.Count -gt 0) {
            Write-Host "    ✅ trading_quotes table exists" -ForegroundColor Green
        } else {
            Write-Host "    ⚠️  trading_quotes table not found" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "    ❌ Verification failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Verify users table columns
    Write-Host "  • Checking users table columns..." -ForegroundColor Gray
    $checkUsers = @{ statements = @("PRAGMA table_info(users)") } | ConvertTo-Json
    try {
        $usersResponse = Invoke-RestMethod -Uri "$DB_URL/v2/pipeline" -Method POST -Headers @{
            "Authorization" = "Bearer $AUTH_TOKEN"
            "Content-Type" = "application/json"
        } -Body $checkUsers
        
        $columns = $usersResponse.results[0].response.results.columns
        $rows = $usersResponse.results[0].response.results.rows
        $columnNames = $rows | ForEach-Object { $_[1] }
        
        $quoteColumns = @('show_quotes', 'quotes_cooldown_minutes', 'last_quote_shown_at', 'last_quote_id', 'last_quote_language', 'quote_show_count')
        $foundColumns = $quoteColumns | Where-Object { $columnNames -contains $_ }
        
        Write-Host "    ✅ Found $($foundColumns.Count)/$($quoteColumns.Count) quote columns" -ForegroundColor Green
        if ($foundColumns.Count -lt $quoteColumns.Count) {
            Write-Host "    ⚠️  Missing: $($quoteColumns | Where-Object { $foundColumns -notcontains $_ } | Join-String -Separator ', ')" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "    ❌ Verification failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "✅ Migration 0009 completed!" -ForegroundColor Green
    Write-Host "🎯 Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Merge PR #15 to main"
    Write-Host "  2. Verify Vercel deployment"
    Write-Host "  3. Test quote system in production"
} else {
    Write-Host ""
    Write-Host "⚠️  Migration completed with $errorCount error(s)" -ForegroundColor Yellow
    Write-Host "Please review errors above" -ForegroundColor Yellow
}
