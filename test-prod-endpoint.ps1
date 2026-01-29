# Test if the PATCH endpoint exists on production
# This will show you the actual HTTP response

$url = "https://wekangtrading.vercel.app/api/admin/sop-types/sop-news-trading"

Write-Host "🔍 Testing PATCH endpoint on production..." -ForegroundColor Cyan
Write-Host "URL: $url" -ForegroundColor Yellow
Write-Host ""

try {
    # Make a PATCH request (will likely fail with 401 Unauthorized, but NOT 405)
    $response = Invoke-WebRequest -Uri $url -Method PATCH -ContentType "application/json" -Body '{"test":"data"}' -ErrorAction Stop
    Write-Host "✅ Response: $($response.StatusCode)" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $statusDesc = $_.Exception.Response.StatusCode
    
    Write-Host "Status Code: $statusCode ($statusDesc)" -ForegroundColor $(if ($statusCode -eq 405) { "Red" } elseif ($statusCode -eq 401) { "Yellow" } else { "White" })
    Write-Host ""
    
    if ($statusCode -eq 405) {
        Write-Host "❌ 405 Method Not Allowed - The PATCH endpoint is NOT deployed!" -ForegroundColor Red
        Write-Host ""
        Write-Host "This means either:" -ForegroundColor Yellow
        Write-Host "  1. The route file is missing from production build" -ForegroundColor White
        Write-Host "  2. Vercel didn't redeploy after the merge" -ForegroundColor White
        Write-Host "  3. Next.js build cache issue" -ForegroundColor White
        Write-Host ""
        Write-Host "Solutions:" -ForegroundColor Cyan
        Write-Host "  1. Trigger a manual redeploy on Vercel dashboard" -ForegroundColor White
        Write-Host "  2. Push a new commit to main to trigger auto-deploy" -ForegroundColor White
        Write-Host "  3. Clear Vercel build cache and redeploy" -ForegroundColor White
    } elseif ($statusCode -eq 401) {
        Write-Host "✅ 401 Unauthorized - The PATCH endpoint EXISTS but requires authentication!" -ForegroundColor Green
        Write-Host ""
        Write-Host "This is GOOD - it means the endpoint is deployed and working." -ForegroundColor Green
        Write-Host "The 405 error you're seeing must be caused by something else." -ForegroundColor Yellow
    } else {
        Write-Host "Unexpected status code: $statusCode" -ForegroundColor Yellow
    }
}
