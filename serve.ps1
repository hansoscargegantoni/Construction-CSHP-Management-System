# Simple Local HTTP Server for PowerShell using System.Net.HttpListener
# Usage: powershell -ExecutionPolicy Bypass -File serve.ps1 [port]

param (
    [int]$Port = 8080
)

$prefix = "http://localhost:$Port/"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)

$mimeMap = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
}

try {
    $listener.Start()
    Write-Host "CSHP SafetyHub is live at: $prefix" -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop the server." -ForegroundColor Yellow

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $req = $context.Request
        $res = $context.Response

        try {
            $localPath = $req.Url.LocalPath
            if ($localPath -eq "/" -or $localPath -eq "") {
                $localPath = "/index.html"
            }

            $cleanPath = $localPath.TrimStart("/").Replace("/", [System.IO.Path]::DirectorySeparatorChar)
            $filePath = Join-Path $PSScriptRoot $cleanPath

            if (Test-Path $filePath -PathType Leaf) {
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                $contentType = "application/octet-stream"
                if ($mimeMap.ContainsKey($ext)) {
                    $contentType = $mimeMap[$ext]
                }

                $res.ContentType = $contentType
                $res.AddHeader("Access-Control-Allow-Origin", "*")
                $res.AddHeader("Cache-Control", "no-cache")

                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $res.StatusCode = 404
                $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $localPath")
                $res.OutputStream.Write($errBytes, 0, $errBytes.Length)
            }
        } catch {
            Write-Host "Request error: $_"
        } finally {
            try { $res.Close() } catch {}
        }
    }
} finally {
    $listener.Stop()
    $listener.Close()
}
