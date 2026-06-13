# Link Snap Tap to a NEW Expo account (backup when vct8888 missing or quota full).
Write-Host ""
Write-Host "Snap Tap — link NEW Expo account (backup)"
Write-Host "========================================="
Write-Host ""
Write-Host "Before you start:"
Write-Host "  1. Create account at https://expo.dev/signup"
Write-Host "  2. Have email/password ready for: npx eas login"
Write-Host ""

Set-Location (Join-Path $PSScriptRoot "..")

Write-Host "Step 1/4 — Log out of old Expo session..."
npx eas logout 2>$null

Write-Host ""
Write-Host "Step 2/4 — Log in with your NEW Expo account..."
npx eas login
if ($LASTEXITCODE -ne 0) {
  Write-Error "eas login failed. Try again."
  exit 1
}

$who = (npx eas whoami 2>&1 | Select-Object -Last 1)
Write-Host "Logged in as: $who"

Write-Host ""
Write-Host "Step 3/4 — Create/link EAS project (updates app.json projectId)..."
Write-Host "When prompted: choose CREATE A NEW PROJECT."
npx eas init
if ($LASTEXITCODE -ne 0) {
  Write-Error "eas init failed."
  exit 1
}

Write-Host ""
Write-Host "Step 4/4 — Sync app.json owner to logged-in account..."
node scripts/sync-expo-owner.mjs

Write-Host ""
Write-Host "Done. Next steps:"
Write-Host "  1. Copy eas.accounts.example.json → eas.accounts.local.json and fill backup projectId"
Write-Host "  2. Add EXPO_PUBLIC_FIREBASE_* env vars in Expo dashboard (preview environment)"
Write-Host "  3. Run: npm run eas:build:apk"
Write-Host "  4. Commit app.json if you want this account on GitHub"
Write-Host ""
