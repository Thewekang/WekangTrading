# Apply Migration 0010 - Commission Entry Type
# Applies ONLY the commission-feature schema changes via Turso HTTP API
# Date: April 18, 2026

param(
  [string]$Target = "staging"
)

Write-Host "🚀 Applying Commission Migration (0010) to $Target" -ForegroundColor Cyan
Write-Host ""

# Load credentials from .env.local
$envPath = ".env.local"
if (-not (Test-Path $envPath)) {
  Write-Host "❌ .env.local not found" -ForegroundColor Red
  exit 1
}

$dbUrl = ""
$authToken = ""

if ($Target -eq "prod") {
  # Read commented-out production credentials (lines starting with "# TURSO_DATABASE_URL=" or "# TURSO_AUTH_TOKEN=")
  foreach ($line in Get-Content $envPath) {
    if ($line -match '^#\s*TURSO_DATABASE_URL=(.+)') {
      $dbUrl = $matches[1].Trim('"').Trim("'") -replace '^libsql://', 'https://'
    }
    if ($line -match '^#\s*TURSO_AUTH_TOKEN=(.+)') {
      $authToken = $matches[1].Trim('"').Trim("'")
    }
  }
} else {
  # Read active staging credentials
  foreach ($line in Get-Content $envPath) {
    if ($line -match '^TURSO_DATABASE_URL=(.+)') {
      $dbUrl = $matches[1].Trim('"').Trim("'") -replace '^libsql://', 'https://'
    }
    if ($line -match '^TURSO_AUTH_TOKEN=(.+)') {
      $authToken = $matches[1].Trim('"').Trim("'")
    }
  }
}

if (-not $dbUrl -or -not $authToken) {
  Write-Host "❌ TURSO_DATABASE_URL or TURSO_AUTH_TOKEN not found in .env.local" -ForegroundColor Red
  exit 1
}

Write-Host "📡 Target: $dbUrl" -ForegroundColor Yellow
Write-Host ""

# Helper to execute SQL via Turso HTTP API
function Invoke-TursoSQL {
  param([string[]]$Statements, [string]$Description)
  
  Write-Host "  ⏳ $Description..." -ForegroundColor Yellow
  
  $requests = @()
  foreach ($stmt in $Statements) {
    $requests += @{ type = "execute"; stmt = @{ sql = $stmt } }
  }
  $requests += @{ type = "close" }
  
  $body = @{ requests = $requests } | ConvertTo-Json -Depth 10
  
  try {
    $response = Invoke-RestMethod `
      -Uri "$dbUrl/v2/pipeline" `
      -Method POST `
      -Headers @{ Authorization = "Bearer $authToken"; "Content-Type" = "application/json" } `
      -Body $body
    
    $hasError = $false
    foreach ($result in $response.results) {
      if ($result.type -eq "error") {
        Write-Host "  ❌ SQL error: $($result.error.message)" -ForegroundColor Red
        $hasError = $true
      }
    }
    
    if (-not $hasError) {
      Write-Host "  ✅ $Description — done" -ForegroundColor Green
    }
    return -not $hasError
  } catch {
    Write-Host "  ❌ HTTP error: $_" -ForegroundColor Red
    return $false
  }
}

# Confirm
$confirmation = Read-Host "⚠️  Apply to $Target? Type 'yes' to continue"
if ($confirmation -ne "yes") {
  Write-Host "❌ Cancelled" -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "📋 Step 1: Check if entry_type already exists..." -ForegroundColor Cyan

# Check current schema
$checkBody = @{
  requests = @(
    @{ type = "execute"; stmt = @{ sql = "SELECT name FROM pragma_table_info('individual_trades') WHERE name = 'entry_type'" } },
    @{ type = "close" }
  )
} | ConvertTo-Json -Depth 10

$checkResponse = Invoke-RestMethod `
  -Uri "$dbUrl/v2/pipeline" `
  -Method POST `
  -Headers @{ Authorization = "Bearer $authToken"; "Content-Type" = "application/json" } `
  -Body $checkBody

$entryTypeExists = $false
foreach ($result in $checkResponse.results) {
  if ($result.type -eq "ok" -and $result.response.result.rows.Count -gt 0) {
    $entryTypeExists = $true
  }
}

if ($entryTypeExists) {
  Write-Host "  ℹ️  entry_type column already exists, skipping individual_trades recreation" -ForegroundColor Blue
} else {
  Write-Host "  📋 Step 2: Recreate individual_trades (add entry_type, make result/sop_followed nullable)..." -ForegroundColor Cyan

  $success = Invoke-TursoSQL -Description "Recreate individual_trades with entry_type + nullable result/sop_followed" -Statements @(
    "PRAGMA foreign_keys=OFF",
    "CREATE TABLE __new_individual_trades (
      id text PRIMARY KEY NOT NULL,
      user_id text NOT NULL,
      daily_summary_id text,
      sop_type_id text,
      entry_type text NOT NULL DEFAULT 'TRANSACTION',
      trade_timestamp integer NOT NULL,
      result text CHECK(result IN ('WIN','LOSS')),
      sop_followed integer,
      profit_loss_usd real NOT NULL,
      market_session text NOT NULL,
      symbol text,
      notes text,
      created_at integer NOT NULL,
      updated_at integer NOT NULL
    )",
    "INSERT INTO __new_individual_trades (id, user_id, daily_summary_id, sop_type_id, entry_type, trade_timestamp, result, sop_followed, profit_loss_usd, market_session, symbol, notes, created_at, updated_at)
      SELECT id, user_id, daily_summary_id, sop_type_id, 'TRANSACTION', trade_timestamp, result, sop_followed, profit_loss_usd, market_session, symbol, notes, created_at, updated_at FROM individual_trades",
    "DROP TABLE individual_trades",
    "ALTER TABLE __new_individual_trades RENAME TO individual_trades",
    "PRAGMA foreign_keys=ON"
  )
  
  if (-not $success) {
    Write-Host "❌ Table recreation failed. Aborting." -ForegroundColor Red
    exit 1
  }
  
  # Recreate indexes
  Invoke-TursoSQL -Description "Recreate indexes on individual_trades" -Statements @(
    "CREATE INDEX IF NOT EXISTS individual_trades_user_timestamp_idx ON individual_trades (user_id, trade_timestamp)",
    "CREATE INDEX IF NOT EXISTS individual_trades_daily_summary_idx ON individual_trades (daily_summary_id)",
    "CREATE INDEX IF NOT EXISTS individual_trades_sop_type_idx ON individual_trades (sop_type_id)",
    "CREATE INDEX IF NOT EXISTS individual_trades_market_session_idx ON individual_trades (market_session)",
    "CREATE INDEX IF NOT EXISTS individual_trades_result_idx ON individual_trades (result)",
    "CREATE INDEX IF NOT EXISTS idx_trades_user_timestamp_result ON individual_trades (user_id, trade_timestamp, result)",
    "CREATE INDEX IF NOT EXISTS idx_trades_user_date_result ON individual_trades (user_id, trade_timestamp, result)",
    "CREATE INDEX IF NOT EXISTS idx_trades_user_session ON individual_trades (user_id, market_session)"
  ) | Out-Null
}

# Check if total_commission_usd already exists
Write-Host ""
Write-Host "📋 Step 3: Add total_commission_usd to daily_summaries..." -ForegroundColor Cyan

$checkBody2 = @{
  requests = @(
    @{ type = "execute"; stmt = @{ sql = "SELECT name FROM pragma_table_info('daily_summaries') WHERE name = 'total_commission_usd'" } },
    @{ type = "close" }
  )
} | ConvertTo-Json -Depth 10

$checkResponse2 = Invoke-RestMethod `
  -Uri "$dbUrl/v2/pipeline" `
  -Method POST `
  -Headers @{ Authorization = "Bearer $authToken"; "Content-Type" = "application/json" } `
  -Body $checkBody2

$commissionColExists = $false
foreach ($result in $checkResponse2.results) {
  if ($result.type -eq "ok" -and $result.response.result.rows.Count -gt 0) {
    $commissionColExists = $true
  }
}

if ($commissionColExists) {
  Write-Host "  ℹ️  total_commission_usd already exists, skipping" -ForegroundColor Blue
} else {
  Invoke-TursoSQL -Description "Add total_commission_usd to daily_summaries" -Statements @(
    "ALTER TABLE daily_summaries ADD COLUMN total_commission_usd real NOT NULL DEFAULT 0"
  ) | Out-Null
}

Write-Host ""
Write-Host "🎉 Migration 0010 applied successfully!" -ForegroundColor Green
Write-Host "   - individual_trades: entry_type column added, result/sop_followed now nullable" -ForegroundColor Gray
Write-Host "   - daily_summaries: total_commission_usd column added" -ForegroundColor Gray
