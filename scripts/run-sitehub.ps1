# SiteHub — interactive command menu
# Usage: powershell -ExecutionPolicy Bypass -File scripts/run-sitehub.ps1

$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Show-Menu {
  Write-Host ""
  Write-Host "=== SiteHub run menu ===" -ForegroundColor Cyan
  Write-Host "1  Start web (localhost:8081)"
  Write-Host "2  Start Expo tunnel (phone dev)"
  Write-Host "3  Typecheck"
  Write-Host "4  EAS whoami"
  Write-Host "5  Build Android APK (preview-apk) ~15 min"
  Write-Host "6  Push OTA update (preview branch)"
  Write-Host "7  Google setup hints"
  Write-Host "8  Telegram setup hints"
  Write-Host "9  Deploy Firestore rules"
  Write-Host "0  Open RUN_COMMANDS.md"
  Write-Host "Q  Quit"
  Write-Host ""
}

function Open-Runbook {
  $path = Join-Path $Root "RUN_COMMANDS.md"
  if (Test-Path $path) { Start-Process $path } else { Write-Host "Missing RUN_COMMANDS.md" -ForegroundColor Red }
}

do {
  Show-Menu
  $choice = Read-Host "Choose"
  switch ($choice) {
    "1" { npx expo start --web --port 8081 }
    "2" { npx expo start --tunnel }
    "3" { npx tsc --noEmit }
    "4" { npx eas whoami }
    "5" {
      Write-Host "Starting EAS Android build (preview-apk)..." -ForegroundColor Yellow
      npx eas build --platform android --profile preview-apk --non-interactive
    }
    "6" {
      Write-Host "Publishing EAS Update to branch preview..." -ForegroundColor Yellow
      npx eas update --branch preview --non-interactive
    }
    "7" { node scripts/print-google-setup.mjs }
    "8" { node scripts/print-telegram-setup.mjs }
    "9" { node scripts/deploy-firestore-rules.mjs }
    "0" { Open-Runbook }
    "Q" { break }
    "q" { break }
    default { Write-Host "Unknown option" -ForegroundColor Red }
  }
} while ($choice -notin @("Q", "q"))
