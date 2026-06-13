# Stop stuck Metro/Expo on common ports, then start fresh (LAN — avoids tunnel timeout).
$ports = 8081, 8082, 8083, 8084, 19000, 19001
foreach ($port in $ports) {
  Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
    ForEach-Object {
      Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}
Write-Host "Ports cleared. Starting Expo (LAN + clear cache)..."
Set-Location $PSScriptRoot + "\.."
npx expo start --lan -c
