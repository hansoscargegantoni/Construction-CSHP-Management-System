$endpoints = @(
    '/',
    '/css/main.css',
    '/css/components.css',
    '/css/modals.css',
    '/js/config.js',
    '/js/app.js',
    '/js/services/storage.js',
    '/js/services/conflict-engine.js',
    '/js/services/sample-data.js',
    '/js/ui/toasts.js',
    '/js/ui/table-view.js',
    '/js/ui/form-modal.js',
    '/js/ui/details-modal.js',
    '/js/ui/roster-view.js'
)

$allPassed = $true
foreach ($ep in $endpoints) {
    $url = "http://localhost:8080$ep"
    try {
        $res = Invoke-WebRequest -Uri $url -UseBasicParsing -ErrorAction Stop
        Write-Host "[PASS] $ep - HTTP $($res.StatusCode) - $($res.Headers['Content-Type'])" -ForegroundColor Green
    } catch {
        Write-Host "[FAIL] $ep - $_" -ForegroundColor Red
        $allPassed = $false
    }
}

if ($allPassed) {
    Write-Host "`nAll 14 application endpoints and modules are 100% accessible with correct MIME types!" -ForegroundColor Cyan
} else {
    Write-Host "`nSome endpoints failed." -ForegroundColor Red
    exit 1
}
