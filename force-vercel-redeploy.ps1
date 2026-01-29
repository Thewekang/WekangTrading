# Force Vercel Redeploy Script
# This creates an empty commit to trigger Vercel deployment

Write-Host "🚀 Force Vercel Redeploy by creating empty commit..." -ForegroundColor Cyan
Write-Host ""

# Make sure we're on main branch
$currentBranch = git branch --show-current
if ($currentBranch -ne "main") {
    Write-Host "⚠️  You're on branch '$currentBranch'. Switching to main..." -ForegroundColor Yellow
    git checkout main
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to checkout main branch" -ForegroundColor Red
        exit 1
    }
}

# Pull latest changes
Write-Host "📥 Pulling latest changes from origin/main..." -ForegroundColor Yellow
git pull origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to pull from origin" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📝 Creating empty commit to trigger Vercel redeploy..." -ForegroundColor Yellow

# Create an empty commit
git commit --allow-empty -m "chore: trigger Vercel redeploy for SOP PATCH endpoint [force-deploy]"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create commit" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📤 Pushing to origin/main..." -ForegroundColor Yellow
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to push to origin" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Successfully triggered Vercel redeploy!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Wait 2-3 minutes for Vercel to build and deploy" -ForegroundColor White
Write-Host "  2. Check https://vercel.com/dashboard for deployment status" -ForegroundColor White
Write-Host "  3. Test the endpoint again: .\test-prod-endpoint.ps1" -ForegroundColor White
Write-Host ""
Write-Host "After successful deployment, the PATCH endpoint should return 401 (not 405)" -ForegroundColor Yellow
