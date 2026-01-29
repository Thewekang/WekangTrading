# Check if SOP image columns exist in production database
# This script verifies if migration 0006 has been applied

Write-Host "🔍 Checking SOP Types table structure in production database..." -ForegroundColor Cyan
Write-Host ""

# Create a temporary SQL file
$sqlFile = "check-sop-columns.sql"
"PRAGMA table_info(sop_types);" | Out-File -FilePath $sqlFile -Encoding ASCII

Write-Host "Connecting to production database..." -ForegroundColor Yellow
Write-Host ""

# Use file input to avoid escaping issues
wsl bash -c "export PATH=/home/h4mim/.turso:`$PATH && cat $sqlFile | turso db shell wekangtrading-prod"

# Clean up
Remove-Item $sqlFile -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Looking for these columns (added in migration 0006):" -ForegroundColor Cyan
Write-Host "  - detail_images_short" -ForegroundColor White
Write-Host "  - detail_images_long" -ForegroundColor White
Write-Host "  - detail_image_notes_short" -ForegroundColor White
Write-Host "  - detail_image_notes_long" -ForegroundColor White
Write-Host ""
Write-Host "If these columns are missing, migration 0006 needs to be applied." -ForegroundColor Yellow
