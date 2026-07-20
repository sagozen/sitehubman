# Starts an EAS cloud build that outputs a downloadable .apk (Android internal distribution).
# First run is INTERACTIVE — Expo will ask to create an Android keystore (choose Generate new).
Write-Host ""
Write-Host "Snap Tap — Android test APK (EAS Build)"
Write-Host "======================================"
Write-Host "Account: vct8888"
Write-Host "Project: bio-cloud-native"
Write-Host ""
Write-Host "This opens an interactive build. When prompted for keystore, choose Generate new."
Write-Host "Build takes about 10-20 minutes. Download the .apk from:"
Write-Host "  https://expo.dev/accounts/vct8888/projects/bio-cloud-native/builds"
Write-Host ""
Set-Location (Join-Path $PSScriptRoot "..")
npx eas build --platform android --profile preview-apk
