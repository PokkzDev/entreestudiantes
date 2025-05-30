# Test webhook endpoint using PowerShell
Write-Host "🚀 Testing webhook endpoint..." -ForegroundColor Green

$webhookUrl = "http://localhost:3000/api/payments/webhook"
$testUrl = "http://localhost:3000/api/payments/webhook-test"

$payload = @{
    action = "payment.updated"
    api_version = "v1"
    data = @{ id = "123456" }
    date_created = "2021-11-01T02:02:02Z"
    id = "123456"
    live_mode = $false
    type = "payment"
    user_id = 320470378
} | ConvertTo-Json

Write-Host "📦 Test payload:" -ForegroundColor Cyan
Write-Host $payload

# Test GET first
Write-Host "`n🔍 Testing GET request..." -ForegroundColor Yellow
try {
    $getResponse = Invoke-RestMethod -Uri $webhookUrl -Method Get
    Write-Host "✅ GET Success:" -ForegroundColor Green
    Write-Host ($getResponse | ConvertTo-Json)
} catch {
    Write-Host "❌ GET Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test POST to main webhook
Write-Host "`n🔍 Testing POST request to main webhook..." -ForegroundColor Yellow
try {
    $postResponse = Invoke-RestMethod -Uri $webhookUrl -Method Post -Body $payload -ContentType "application/json"
    Write-Host "✅ POST Success:" -ForegroundColor Green
    Write-Host ($postResponse | ConvertTo-Json)
} catch {
    Write-Host "❌ POST Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

# Test POST to test webhook
Write-Host "`n🔍 Testing POST request to test webhook..." -ForegroundColor Yellow
try {
    $testResponse = Invoke-RestMethod -Uri $testUrl -Method Post -Body $payload -ContentType "application/json"
    Write-Host "✅ Test webhook Success:" -ForegroundColor Green
    Write-Host ($testResponse | ConvertTo-Json)
} catch {
    Write-Host "❌ Test webhook Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

 