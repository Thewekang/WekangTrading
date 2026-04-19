# Apply Migration 0011 - Multi Trading Accounts (v2.0.0)
# Target: Staging database
# Date: Use `$env:DATE` or run date manually before executing

Write-Host "🚀 Applying Migration 0011 (Multi Trading Accounts) to Staging" -ForegroundColor Cyan
Write-Host ""

# Staging credentials — update if rotated
$DB_URL = $env:STAGING_DATABASE_URL
$AUTH_TOKEN = $env:STAGING_DATABASE_AUTH_TOKEN

if (-not $DB_URL -or -not $AUTH_TOKEN) {
    Write-Host "❌ Missing environment variables:" -ForegroundColor Red
    Write-Host "   Set STAGING_DATABASE_URL and STAGING_DATABASE_AUTH_TOKEN before running." -ForegroundColor Yellow
    exit 1
}

# Safety confirmation
$confirmation = Read-Host "⚠️  Apply migration 0011 to STAGING? Type 'yes' to continue"
if ($confirmation -ne "yes") {
    Write-Host "❌ Cancelled" -ForegroundColor Red
    exit 1
}

# All SQL statements from 0011_watery_night_thrasher.sql
$statements = @(
    # ── New tables ───────────────────────────────────────────────────────────────

    "CREATE TABLE IF NOT EXISTS ``admin_settings`` (``key`` text PRIMARY KEY NOT NULL, ``value`` text NOT NULL, ``description`` text, ``updated_at`` integer NOT NULL, ``updated_by`` text, FOREIGN KEY (``updated_by``) REFERENCES ``users``(``id``) ON UPDATE no action ON DELETE set null)",

    "CREATE TABLE IF NOT EXISTS ``drawdown_templates`` (``id`` text PRIMARY KEY NOT NULL, ``name`` text NOT NULL, ``account_type`` text, ``daily_drawdown_pct`` real, ``total_drawdown_pct`` real, ``consistency_target_pct`` real, ``target_gain_pct`` real, ``is_default`` integer DEFAULT 0 NOT NULL, ``created_at`` integer NOT NULL)",

    "CREATE INDEX IF NOT EXISTS ``drawdown_templates_account_type_idx`` ON ``drawdown_templates`` (``account_type``)",

    "CREATE INDEX IF NOT EXISTS ``drawdown_templates_is_default_idx`` ON ``drawdown_templates`` (``is_default``)",

    "CREATE TABLE IF NOT EXISTS ``trading_accounts`` (``id`` text PRIMARY KEY NOT NULL, ``user_id`` text NOT NULL, ``name`` text NOT NULL, ``account_type`` text DEFAULT 'FUTURES' NOT NULL, ``currency`` text DEFAULT 'USD' NOT NULL, ``starting_balance`` real DEFAULT 0 NOT NULL, ``is_default`` integer DEFAULT 0 NOT NULL, ``active`` integer DEFAULT 1 NOT NULL, ``created_at`` integer NOT NULL, ``updated_at`` integer NOT NULL, FOREIGN KEY (``user_id``) REFERENCES ``users``(``id``) ON UPDATE no action ON DELETE cascade)",

    "CREATE INDEX IF NOT EXISTS ``trading_accounts_user_id_idx`` ON ``trading_accounts`` (``user_id``)",

    "CREATE INDEX IF NOT EXISTS ``trading_accounts_user_default_idx`` ON ``trading_accounts`` (``user_id``, ``is_default``)",

    "CREATE TABLE IF NOT EXISTS ``account_rules`` (``id`` text PRIMARY KEY NOT NULL, ``trading_account_id`` text NOT NULL, ``daily_drawdown_pct`` real, ``total_drawdown_pct`` real, ``consistency_target_pct`` real, ``cycle_target_profit_usd`` real, ``created_at`` integer NOT NULL, ``updated_at`` integer NOT NULL, FOREIGN KEY (``trading_account_id``) REFERENCES ``trading_accounts``(``id``) ON UPDATE no action ON DELETE cascade)",

    "CREATE UNIQUE INDEX IF NOT EXISTS ``account_rules_trading_account_id_unique`` ON ``account_rules`` (``trading_account_id``)",

    "CREATE TABLE IF NOT EXISTS ``withdrawal_events`` (``id`` text PRIMARY KEY NOT NULL, ``trading_account_id`` text NOT NULL, ``withdrawal_date`` text NOT NULL, ``withdrawal_amount`` real NOT NULL, ``balance_at_withdrawal`` real NOT NULL, ``cycle_pnl_at_withdrawal`` real NOT NULL, ``notes`` text, ``created_at`` integer NOT NULL, FOREIGN KEY (``trading_account_id``) REFERENCES ``trading_accounts``(``id``) ON UPDATE no action ON DELETE cascade)",

    "CREATE INDEX IF NOT EXISTS ``withdrawal_events_account_id_idx`` ON ``withdrawal_events`` (``trading_account_id``)",

    "CREATE INDEX IF NOT EXISTS ``withdrawal_events_account_date_idx`` ON ``withdrawal_events`` (``trading_account_id``, ``withdrawal_date``)",

    # ── ALTER TABLE — add trading_account_id to existing tables ─────────────────
    "ALTER TABLE ``user_badges`` ADD COLUMN ``trading_account_id`` text REFERENCES trading_accounts(id)",
    "ALTER TABLE ``discipline_tracker_rows`` ADD COLUMN ``trading_account_id`` text REFERENCES trading_accounts(id)",
    "ALTER TABLE ``discipline_tracker_settings`` ADD COLUMN ``trading_account_id`` text REFERENCES trading_accounts(id)",
    "ALTER TABLE ``individual_trades`` ADD COLUMN ``trading_account_id`` text REFERENCES trading_accounts(id)",
    "CREATE INDEX IF NOT EXISTS ``individual_trades_account_id_idx`` ON ``individual_trades`` (``trading_account_id``)",
    "ALTER TABLE ``daily_summaries`` ADD COLUMN ``trading_account_id`` text REFERENCES trading_accounts(id)",
    "CREATE INDEX IF NOT EXISTS ``daily_summaries_account_id_idx`` ON ``daily_summaries`` (``trading_account_id``)",
    "ALTER TABLE ``user_targets`` ADD COLUMN ``trading_account_id`` text REFERENCES trading_accounts(id)",
    "ALTER TABLE ``streaks`` ADD COLUMN ``trading_account_id`` text REFERENCES trading_accounts(id)",
    "ALTER TABLE ``user_stats`` ADD COLUMN ``trading_account_id`` text REFERENCES trading_accounts(id)",
    "ALTER TABLE ``user_rankings`` ADD COLUMN ``trading_account_id`` text REFERENCES trading_accounts(id)",
    "ALTER TABLE ``user_rankings`` ADD COLUMN ``display_name`` text DEFAULT '' NOT NULL"
)

$headers = @{
    "Authorization" = "Bearer $AUTH_TOKEN"
    "Content-Type"  = "application/json"
}

$successCount = 0
$skipCount = 0
$errorCount = 0

foreach ($sql in $statements) {
    $shortSql = if ($sql.Length -gt 80) { $sql.Substring(0, 80) + "..." } else { $sql }
    Write-Host "▶ $shortSql" -ForegroundColor Gray

    $body = @{
        statements = @($sql)
    } | ConvertTo-Json -Depth 10

    try {
        $response = Invoke-RestMethod -Uri "$DB_URL/v2/pipeline" -Method POST -Headers $headers -Body $body -ErrorAction Stop

        # Check for Turso error in response body
        if ($response.results -and $response.results[0].type -eq "error") {
            $errMsg = $response.results[0].error.message
            if ($errMsg -like "*duplicate column*" -or $errMsg -like "*already exists*") {
                Write-Host "  ⏭️  Skipped (already applied)" -ForegroundColor Yellow
                $skipCount++
            } else {
                Write-Host "  ❌ Error: $errMsg" -ForegroundColor Red
                $errorCount++
            }
        } else {
            Write-Host "  ✅ Success" -ForegroundColor Green
            $successCount++
        }
    } catch {
        $errBody = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
        $errMsg  = if ($errBody) { $errBody.message } else { $_.Exception.Message }

        if ($errMsg -like "*duplicate column*" -or $errMsg -like "*already exists*") {
            Write-Host "  ⏭️  Skipped (already applied)" -ForegroundColor Yellow
            $skipCount++
        } else {
            Write-Host "  ❌ Error: $errMsg" -ForegroundColor Red
            $errorCount++
        }
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "  ✅ Success : $successCount" -ForegroundColor Green
Write-Host "  ⏭️  Skipped : $skipCount" -ForegroundColor Yellow
Write-Host "  ❌ Errors  : $errorCount" -ForegroundColor $(if ($errorCount -gt 0) { "Red" } else { "DarkGray" })
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

if ($errorCount -gt 0) {
    Write-Host ""
    Write-Host "⚠️  Some statements failed. Review errors above before running the data migration script." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🎉 Schema migration complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run the data migration to create default accounts for all users:" -ForegroundColor White
Write-Host "       npx ts-node --project tsconfig.json scripts/migrate-to-multi-accounts.ts" -ForegroundColor Yellow
Write-Host "  2. Deploy to Vercel (staging):" -ForegroundColor White
Write-Host "       git push origin feature/multi-trading-accounts" -ForegroundColor Yellow
Write-Host "  3. When ready for prod, re-run this script pointing at PRODUCTION credentials." -ForegroundColor White
