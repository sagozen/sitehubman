# SiteHub — keys & commands (copy/paste)

Project folder:

```powershell
cd "c:\Users\DELL\Downloads\sitehub-main\sitehub-main"
```

---

## 1) `.env` keys (local — never commit `.env`)

Copy from `.env.example`. Fill secrets only in `.env` (gitignored).

| Key | Purpose |
|-----|---------|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Firebase web |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | `sitehub-8dd56` |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | FCM sender |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Firebase app id |
| `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID` | Analytics |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Google login (Firebase Web client) |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Optional iOS OAuth |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | Optional Android OAuth |
| `EXPO_PUBLIC_PROFILE_HOST` | NFC/QR profile URLs (`https://sitehubman.vercel.app`) |
| `EXPO_PUBLIC_TELEGRAM_BOT_USERNAME` | `GENNFC_Bot` |
| `EXPO_PUBLIC_TELEGRAM_AUTH_ENDPOINT` | `https://us-central1-sitehub-8dd56.cloudfunctions.net/telegramLogin` |
| `EXPO_PUBLIC_TELEGRAM_WIDGET_URL` | `https://sitehubman.vercel.app/telegram-login.html` |
| `EXPO_PUBLIC_TELEGRAM_AUTH_CALLBACK_URL` | `https://sitehubman.vercel.app/telegram-auth-callback.html` |
| `TELEGRAM_BOT_TOKEN` | **Secret** — BotFather only, not Vercel |
| `TELEGRAM_AUTH_MAX_AGE_SECONDS` | `86400` |
| `TELEGRAM_ALLOWED_ORIGINS` | `*` |

### Google redirect URIs (Web client `145010162726-...`)

Add in [Google Cloud Credentials](https://console.cloud.google.com/apis/credentials?project=sitehub-8dd56):

```text
http://localhost:8081
https://sitehubman.vercel.app
https://auth.expo.io/@theanthean8888/bio-cloud-native
```

### Telegram BotFather `/setdomain`

```text
sitehubman.vercel.app
```

(Optional local dev: `localhost` — one domain per bot at a time.)

---

## 2) EAS / Expo dashboard keys

Set the **same** `EXPO_PUBLIC_*` vars on:

https://expo.dev/accounts/theanthean8888/projects/bio-cloud-native/environment-variables

Environment: **preview** (and **production** when you ship).

```powershell
npm run eas:env:checklist
```

**If APK spins forever on “Restoring session…”** the preview build often has **no Firebase keys on EAS**. Add keys → **rebuild APK**. JS-only fixes: `npm run eas:update:preview`.

**EAS project id:** `cb54673a-8b20-4939-9332-6e9f312521a5`
**Updates URL:** `https://u.expo.dev/cb54673a-8b20-4939-9332-6e9f312521a5`
**Runtime version (bare workflow):** `1.0.0` in `app.json` — bump manually when native code changes, then rebuild APK.

---

## 3) Daily dev (PC)

```powershell
npm run start:web          # browser http://localhost:8081
npm run start:tunnel       # phone dev client + tunnel
npm run start:clear        # clear Metro cache
npm run typecheck
```

### Test URLs (web)

| Page | URL |
|------|-----|
| App | http://localhost:8081 |
| Login | http://localhost:8081/auth/login |
| Sales | http://localhost:8081/sales |
| Printer / NFC | http://localhost:8081/printer/scan |
| Live site | https://sitehubman.vercel.app |
| Telegram widget | https://sitehubman.vercel.app/telegram-login.html |

---

## 4) Android APK (NFC on real phone)

### First install (or after native / app.json changes)

```powershell
npm run eas:build:apk
```

Builds: https://expo.dev/accounts/theanthean8888/projects/bio-cloud-native/builds

(If your team uses **codemantn/sitehub-man**, use that project’s builds page instead.)

Install APK on phone → enable **NFC** → login as **printer** → **Scan** tab.

### Auto-update JS (no new APK)

After the APK was built **with** EAS Update enabled:

```powershell
npm run eas:update:preview
```

Phone: force-close app → reopen.

**Latest update (example):** https://expo.dev/accounts/theanthean8888/projects/bio-cloud-native/updates

Only works if the installed APK was built **after** `updates.url` was added to `app.json` (runtime `1.0.0`).

---

## 5) iOS (NFC on iPhone)

```powershell
npx eas build --platform ios --profile preview
```

Register device UDID in Expo first. Install from build page or TestFlight:

```powershell
npx eas build --platform ios --profile production
npx eas submit --platform ios --profile production --latest
```

---

## 6) Firebase / backend

```powershell
npm run deploy:rules
firebase functions:config:set telegram.bot_token="YOUR_BOT_TOKEN"
npx firebase deploy --only functions:telegramLogin
npm run seed:demo
npm run verify:launch
```

---

## 7) Setup helpers

```powershell
npm run google:setup
npm run telegram:setup
npm run eas:whoami
```

---

## 8) One script (menu)

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run-sitehub.ps1
```

---

## Quick decision

| I changed… | Run |
|------------|-----|
| UI / screens / JS only | `npm run eas:update:preview` |
| NFC plugin, permissions, native deps | `npm run eas:build:apk` → reinstall |
| `.env` only | Rebuild APK **or** set vars on Expo + rebuild |
| Web only | Deploy Vercel / `npm run start:web` |
