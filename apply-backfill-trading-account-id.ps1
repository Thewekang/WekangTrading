# ============================================================
# Apply trading_account_id backfill migration to a Turso database
# Usage:
#   .\apply-backfill-trading-account-id.ps1 -Target prod
#   .\apply-backfill-trading-account-id.ps1 -Target staging
# ============================================================

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('prod', 'staging')]
    [string]$Target
)

# ---- Credentials -------------------------------------------------------
# Set these env vars before running, or hard-code them here.
# export TURSO_PROD_URL / TURSO_PROD_TOKEN
# export TURSO_STAGING_URL / TURSO_STAGING_TOKEN

if ($Target -eq 'prod') {
    $DB_URL   = $env:TURSO_PROD_URL   ?? "https://wekangtrading-prod-thewekang.aws-eu-west-1.turso.io"
    $DB_TOKEN = $env:TURSO_PROD_TOKEN
} else {
    $DB_URL   = $env:TURSO_STAGING_URL   ?? "https://wekangtrading-staging-thewekang.aws-eu-west-1.turso.io"
    $DB_TOKEN = $env:TURSO_STAGING_TOKEN
}

if (-not $DB_TOKEN) {
    Write-Host "ERROR: Auth token not set." -ForegroundColor Red
    Write-Host "Set TURSO_PROD_TOKEN or TURSO_STAGING_TOKEN env var, or edit this script." -ForegroundColor Yellow
    exit 1
}
# -------------------------------------------------------------------------

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Backfill trading_account_id — Target: $($Target.ToUpper())" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Database: $DB_URL" -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "Type 'yes' to continue"
if ($confirmation -ne "yes") {
    Write-Host "Cancelled." -ForegroundColor Red
    exit 1
}

# ---- SQL statements (one per UPDATE) -----------------------------------
$statements = @(
    # 1. individual_trades
    "UPDATE individual_trades SET trading_account_id = COALESCE((SELECT id FROM trading_accounts WHERE user_id = individual_trades.user_id AND is_default = 1 LIMIT 1),(SELECT id FROM trading_accounts WHERE user_id = individual_trades.user_id ORDER BY created_at ASC LIMIT 1)) WHERE trading_account_id IS NULL",

    # 2. daily_summaries
    "UPDATE daily_summaries SET trading_account_id = COALESCE((SELECT id FROM trading_accounts WHERE user_id = daily_summaries.user_id AND is_default = 1 LIMIT 1),(SELECT id FROM trading_accounts WHERE user_id = daily_summaries.user_id ORDER BY created_at ASC LIMIT 1)) WHERE trading_account_id IS NULL",

    # 3. discipline_tracker_rows
    "UPDATE discipline_tracker_rows SET trading_account_id = COALESCE((SELECT id FROM trading_accounts WHERE user_id = discipline_tracker_rows.user_id AND is_default = 1 LIMIT 1),(SELECT id FROM trading_accounts WHERE user_id = discipline_tracker_rows.user_id ORDER BY created_at ASC LIMIT 1)) WHERE trading_account_id IS NULL",

    # 4. discipline_tracker_settings
    "UPDATE discipline_tracker_settings SET trading_account_id = COALESCE((SELECT id FROM trading_accounts WHERE user_id = discipline_tracker_settings.user_id AND is_default = 1 LIMIT 1),(SELECT id FROM trading_accounts WHERE user_id = discipline_tracker_settings.user_id ORDER BY created_at ASC LIMIT 1)) WHERE trading_account_id IS NULL",

    # 5. user_targets
    "UPDATE user_targets SET trading_account_id = COALESCE((SELECT id FROM trading_accounts WHERE user_id = user_targets.user_id AND is_default = 1 LIMIT 1),(SELECT id FROM trading_accounts WHERE user_id = user_targets.user_id ORDER BY created_at ASC LIMIT 1)) WHERE trading_account_id IS NULL",

    # 6. streaks
    "UPDATE streaks SET trading_account_id = COALESCE((SELECT id FROM trading_accounts WHERE user_id = streaks.user_id AND is_default = 1 LIMIT 1),(SELECT id FROM trading_accounts WHERE user_id = streaks.user_id ORDER BY created_at ASC LIMIT 1)) WHERE trading_account_id IS NULL",

    # 7. user_stats
    "UPDATE user_stats SET trading_account_id = COALESCE((SELECT id FROM trading_accounts WHERE user_id = user_stats.user_id AND is_default = 1 LIMIT 1),(SELECT id FROM trading_accounts WHERE user_id = user_stats.user_id ORDER BY created_at ASC LIMIT 1)) WHERE trading_account_id IS NULL",

    # 8. user_rankings
    "UPDATE user_rankings SET trading_account_id = COALESCE((SELECT id FROM trading_accounts WHERE user_id = user_rankings.user_id AND is_default = 1 LIMIT 1),(SELECT id FROM trading_accounts WHERE user_id = user_rankings.user_id ORDER BY created_at ASC LIMIT 1)) WHERE trading_account_id IS NULL",

    # 9. user_badges
    "UPDATE user_badges SET trading_account_id = COALESCE((SELECT id FROM trading_accounts WHERE user_id = user_badges.user_id AND is_default = 1 LIMIT 1),(SELECT id FROM trading_accounts WHERE user_id = user_badges.user_id ORDER BY created_at ASC LIMIT 1)) WHERE trading_account_id IS NULL"
)

$tableNames = @(
    "individual_trades",
    "daily_summaries",
    "discipline_tracker_rows",
    "discipline_tracker_settings",
    "user_targets",
    "streaks",
    "user_stats",
    "user_rankings",
    "user_badges"
)

$headers = @{
    "Authorization" = "Bearer $DB_TOKEN"
    "Content-Type"  = "application/json"
}

$successCount = 0
$errorCount   = 0

for ($i = 0; $i -lt $statements.Count; $i++) {
    $table = $tableNames[$i]
    $sql   = $statements[$i]

    Write-Host "  Backfilling $table ..." -NoNewline

    $body = @{
        statements = @(@{ q = $sql })
    } | ConvertTo-Json -Depth 5

    try {
        $response = Invoke-RestMethod `
            -Uri     "$DB_URL/v2/pipeline" `
            -Method  Post `
            -Headers $headers `
            -Body    $body `
            -ErrorAction Stop

        Write-Host " OK" -ForegroundColor Green
        $successCount++
    } catch {
        Write-Host " FAILED" -ForegroundColor Red
        Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
        $errorCount++
    }
}

Write-Host ""
Write-Host "------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "  Results: $successCount OK  /  $errorCount FAILED" -ForegroundColor $(if ($errorCount -eq 0) { 'Green' } else { 'Red' })
Write-Host "------------------------------------------------------------" -ForegroundColor Cyan
Write-Host ""

# ---- Verification -------------------------------------------------------
Write-Host "Verifying null counts after backfill..." -ForegroundColor Yellow
Write-Host ""

$verifySql = @(
    "SELECT 'individual_trades' as tbl, COUNT(*) as nulls FROM individual_trades WHERE trading_account_id IS NULL",
    "SELECT 'daily_summaries' as tbl, COUNT(*) as nulls FROM daily_summaries WHERE trading_account_id IS NULL",
    "SELECT 'discipline_tracker_rows' as tbl, COUNT(*) as nulls FROM discipline_tracker_rows WHERE trading_account_id IS NULL",
    "SELECT 'user_targets' as tbl, COUNT(*) as nulls FROM user_targets WHERE trading_account_id IS NULL",
    "SELECT 'streaks' as tbl, COUNT(*) as nulls FROM streaks WHERE trading_account_id IS NULL",
    "SELECT 'user_badges' as tbl, COUNT(*) as nulls FROM user_badges WHERE trading_account_id IS NULL"
)

foreach ($vsql in $verifySql) {
    $body = @{
        statements = @(@{ q = $vsql })
    } | ConvertTo-Json -Depth 5

    try {
        $response = Invoke-RestMethod `
            -Uri     "$DB_URL/v2/pipeline" `
            -Method  Post `
            -Headers $headers `
            -Body    $body `
            -ErrorAction Stop

        $cols = $response.results[0].response.result.cols
        $rows = $response.results[0].response.result.rows
        if ($rows.Count -gt 0) {
            $tbl   = $rows[0][0].value
            $nulls = $rows[0][1].value
            $color = if ($nulls -eq 0) { 'Green' } else { 'Red' }
            Write-Host ("  {0,-35} nulls remaining: {1}" -f $tbl, $nulls) -ForegroundColor $color
        }
    } catch {
        Write-Host "  Verify query failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
if ($errorCount -eq 0) {
    Write-Host "Backfill complete. All rows assigned to their default trading account." -ForegroundColor Green
} else {
    Write-Host "Some statements failed. Check errors above and re-run if needed." -ForegroundColor Red
}
