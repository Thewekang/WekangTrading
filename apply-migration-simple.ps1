# Apply Migration 0009 - Simple LibSQL HTTP API Version
# Date: February 8, 2026

Write-Host "🚀 Applying Migration 0009 to Production" -ForegroundColor Cyan
Write-Host ""

# Production credentials
$DB_URL = "https://wekangtrading-prod-thewekang.aws-eu-west-1.turso.io"
$AUTH_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjgxMjk4ODksImlkIjoiNGQ3Y2I3OGMtNGE4ZC00ZDljLWEyYTctYWVlNzAzNDgyOTk5IiwicmlkIjoiOTdiNDE2YjMtNWExYi00NjZmLTg0OGMtMGRiZTI5YzNkZmE5In0.C2BH_YKLQJxZuL7F2JBlp9qLeo7_IdlQVbsR7ra3TeC-uXfZ_9tmjSuTrGZEDbV6MMYjucY6STjqvOL0-pR5AQ"

# Confirm
$confirmation = Read-Host "⚠️  Apply to PRODUCTION? Type 'yes' to continue"
if ($confirmation -ne "yes") {
    Write-Host "❌ Cancelled" -ForegroundColor Red
    exit 1
}

# SQL statements to execute
$statements = @(
    # Create trading_quotes table
    "CREATE TABLE IF NOT EXISTS trading_quotes (id text PRIMARY KEY NOT NULL, enabled integer DEFAULT 1 NOT NULL, category text NOT NULL, weight integer DEFAULT 5 NOT NULL, text_en text NOT NULL, text_bm text NOT NULL, author text, source_type text, display_count integer DEFAULT 0 NOT NULL, created_at integer DEFAULT (unixepoch()) NOT NULL, updated_at integer DEFAULT (unixepoch()) NOT NULL)",
    
    # Create indexes
    "CREATE INDEX IF NOT EXISTS trading_quotes_category_idx ON trading_quotes (category)",
    "CREATE INDEX IF NOT EXISTS trading_quotes_enabled_idx ON trading_quotes (enabled)",
    
    # Update discipline_tracker_rows
    "ALTER TABLE discipline_tracker_rows ADD COLUMN is_aplus_day integer DEFAULT 0 NOT NULL",
    "ALTER TABLE discipline_tracker_rows ADD COLUMN is_range_expansion_day integer DEFAULT 0 NOT NULL",
    
    # Update users table
    "ALTER TABLE users ADD COLUMN show_quotes integer DEFAULT 1 NOT NULL",
    "ALTER TABLE users ADD COLUMN quotes_cooldown_minutes integer DEFAULT 15 NOT NULL",
    "ALTER TABLE users ADD COLUMN last_quote_shown_at integer",
    "ALTER TABLE users ADD COLUMN last_quote_id text",
    "ALTER TABLE users ADD COLUMN last_quote_language text DEFAULT 'en'",
    "ALTER TABLE users ADD COLUMN quote_show_count integer DEFAULT 0 NOT NULL"
)

$headers = @{
    "Authorization" = "Bearer $AUTH_TOKEN"
    "Content-Type" = "application/json"
}

$successCount = 0
$skipCount = 0
$errorCount = 0

foreach ($sql in $statements) {
    $shortSql = if ($sql.Length -gt 60) { $sql.Substring(0, 60) + "..." } else { $sql }
    Write-Host "▶ $shortSql" -ForegroundColor Gray
    
    $body = @{
        statements = @($sql)
    } | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-RestMethod -Uri "$DB_URL/v2/pipeline" -Method POST -Headers $headers -Body $body -ErrorAction Stop
        Write-Host "  ✅ Success" -ForegroundColor Green
        $successCount++
    } catch {
        $errorMsg = $_.Exception.Message
        if ($errorMsg -match "duplicate column" -or $errorMsg -match "already exists") {
            Write-Host "  ⏭️  Already exists" -ForegroundColor Cyan
            $skipCount++
        } else {
            Write-Host "  ❌ Error: $errorMsg" -ForegroundColor Red
            $errorCount++
        }
    }
    
    Start-Sleep -Milliseconds 200
}

Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "  ✅ Success: $successCount" -ForegroundColor Green
Write-Host "  ⏭️  Skipped: $skipCount" -ForegroundColor Cyan
Write-Host "  ❌ Errors: $errorCount" -ForegroundColor $(if ($errorCount -gt 0) { "Red" } else { "Gray" })

if ($errorCount -eq 0 -or $skipCount -gt 0) {
    Write-Host ""
    Write-Host "🔍 Verifying tables..." -ForegroundColor Yellow
    
    # Check trading_quotes
    $checkBody = @{ statements = @("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='trading_quotes'") } | ConvertTo-Json
    try {
        $result = Invoke-RestMethod -Uri "$DB_URL/v2/pipeline" -Method POST -Headers $headers -Body $checkBody
        if ($result.results[0].response.results.rows[0][0] -eq 1) {
            Write-Host "  ✅ trading_quotes table exists" -ForegroundColor Green
        }
    } catch {
        Write-Host "  ⚠️  Could not verify: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    # Check users columns
    $checkUsers = @{ statements = @("PRAGMA table_info(users)") } | ConvertTo-Json
    try {
        $result = Invoke-RestMethod -Uri "$DB_URL/v2/pipeline" -Method POST -Headers $headers -Body $checkUsers
        $hasQuoteColumns = $false
        foreach ($row in $result.results[0].response.results.rows) {
            if ($row[1] -eq "show_quotes") {
                $hasQuoteColumns = $true
                break
            }
        }
        if ($hasQuoteColumns) {
            Write-Host "  ✅ Quote columns added to users" -ForegroundColor Green
        }
    } catch {
        Write-Host "  ⚠️  Could not verify: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "✅ Migration completed!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⚠️  Migration completed with errors" -ForegroundColor Yellow
}
