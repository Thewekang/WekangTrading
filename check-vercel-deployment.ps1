# Advanced Vercel Deployment Check
# This checks if the route is actually deployed with cache-busting

$baseUrl = "https://wekangtrading.vercel.app"
$sopId = "sop-news-trading"
$endpoint = "$baseUrl/api/admin/sop-types/$sopId"

Write-Host "🔍 Comprehensive Vercel Deployment Check" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""

# Test 1: Check with cache-busting header
Write-Host "Test 1: PATCH with Cache-Control no-cache" -ForegroundColor Yellow
try {
    $headers = @{
        "Cache-Control" = "no-cache, no-store, must-revalidate"
        "Pragma" = "no-cache"
        "Content-Type" = "application/json"
    }
    $body = '{"test":"data"}' | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri $endpoint -Method PATCH -Headers $headers -Body $body -ErrorAction Stop
    Write-Host "  ✅ Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $statusDesc = $_.Exception.Response.StatusCode
    Write-Host "  ❌ Status: $statusCode ($statusDesc)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Try OPTIONS to see what methods are allowed
Write-Host "Test 2: OPTIONS request (check allowed methods)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $endpoint -Method OPTIONS -ErrorAction Stop
    $allowHeader = $response.Headers["Allow"]
    Write-Host "  ✅ Allowed methods: $allowHeader" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "  ⚠️  OPTIONS failed: $statusCode" -ForegroundColor Yellow
    Write-Host "  (This might not be supported)" -ForegroundColor Gray
}
Write-Host ""

# Test 3: Check route.ts file exists check (try GET which should give 405 if only PATCH/DELETE exist)
Write-Host "Test 3: GET request (should fail with 405 if route exists)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $endpoint -Method GET -ErrorAction Stop
    Write-Host "  ⚠️  GET succeeded (unexpected): $($response.StatusCode)" -ForegroundColor Yellow
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $statusDesc = $_.Exception.Response.StatusCode
    if ($statusCode -eq 405) {
        Write-Host "  ✅ GET returns 405 (route exists, GET not allowed)" -ForegroundColor Green
        Write-Host "  This confirms the route file is deployed!" -ForegroundColor Green
    } else {
        Write-Host "  Status: $statusCode ($statusDesc)" -ForegroundColor White
    }
}
Write-Host ""

# Test 4: Check DELETE method
Write-Host "Test 4: DELETE request (check if DELETE is allowed)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $endpoint -Method DELETE -ErrorAction Stop
    Write-Host "  Status: $($response.StatusCode)" -ForegroundColor White
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $statusDesc = $_.Exception.Response.StatusCode
    if ($statusCode -eq 401) {
        Write-Host "  ✅ DELETE returns 401 (method exists, auth required)" -ForegroundColor Green
    } elseif ($statusCode -eq 405) {
        Write-Host "  ❌ DELETE returns 405 (method not allowed)" -ForegroundColor Red
    } else {
        Write-Host "  Status: $statusCode ($statusDesc)" -ForegroundColor White
    }
}
Write-Host ""

# Summary
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "📊 Analysis:" -ForegroundColor Cyan
Write-Host ""
Write-Host "If both PATCH and DELETE return 405:" -ForegroundColor Yellow
Write-Host "  → The route file may not have exported these methods properly" -ForegroundColor White
Write-Host "  → Or there's a build configuration issue" -ForegroundColor White
Write-Host ""
Write-Host "If GET returns 405 but PATCH also returns 405:" -ForegroundColor Yellow  
Write-Host "  → Route exists but PATCH export might be broken" -ForegroundColor White
Write-Host "  → Check Next.js 15 route handler compatibility" -ForegroundColor White
Write-Host ""
Write-Host "Recommended action:" -ForegroundColor Cyan
Write-Host "  1. Check Vercel Functions logs for this endpoint" -ForegroundColor White
Write-Host "  2. Try adding a simple GET method to test deployment" -ForegroundColor White
Write-Host "  3. Check if middleware is blocking the request" -ForegroundColor White
