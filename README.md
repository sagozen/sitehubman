# AVIO Brand — Monorepo

> **CONNECT · IDENTIFY · EMPOWER** — 2025–2125

The official monorepo for all AVIO Brand products. The repo uses a simple **tree workspace** structure — one root, two apps, one shared types package.

---

## 📂 Project Tree

```
avio-brand-monorepo/
│
├── 📱 Mobile App (Expo / React Native)
│   ├── app/                   ← Expo Router screens
│   │   ├── (tabs)/            ← Tab navigation
│   │   ├── card/              ← Card import deep link handler
│   │   └── u/[slug].tsx       ← Public bio page (web + mobile)
│   ├── src/
│   │   ├── features/
│   │   │   ├── auth/          ← Sign in / Sign up screens
│   │   │   ├── bio/           ← Profile editor + Public NFC card
│   │   │   ├── guest/         ← Landing page / Guest home
│   │   │   ├── settings/      ← Settings screen
│   │   │   └── home/          ← Dashboard / Home screen
│   │   ├── components/        ← Shared React Native components
│   │   ├── services/          ← API services (cardApiService, etc.)
│   │   └── constants/         ← Brand assets, colors, icon maps
│   ├── assets/                ← Images, fonts, icons
│   ├── app.json               ← Expo config (name: AVIO)
│   ├── eas.json               ← EAS Build config (TestFlight)
│   └── package.json           ← Root workspace manifest ← YOU ARE HERE
│
├── 🌐 Web App (Vite + React + Tailwind)    web/
│   ├── src/
│   │   ├── App.tsx            ← Main app (router, pages)
│   │   ├── components/
│   │   │   ├── LandingPage.tsx     ← AVIO Brand landing page
│   │   │   ├── AuthScreen.tsx      ← Sign in / Sign up
│   │   │   ├── PublicCard.tsx      ← Public NFC card (web view)
│   │   │   ├── PremiumModal.tsx    ← Upgrade modal
│   │   │   └── SocialIcons.tsx     ← Social platform icon grid
│   │   └── lib/
│   │       ├── supabase.ts         ← Supabase client
│   │       ├── auth.tsx            ← Auth context
│   │       ├── hooks.ts            ← Custom React hooks
│   │       ├── vcard.ts            ← vCard contact export
│   │       └── i18n.ts             ← Internationalization
│   ├── package.json           ← name: avio-web
│   └── vite.config.ts
│
├── 📦 Shared Types             packages/shared/
│   └── types.ts               ← CardProfile, SocialLink, Vibe, NfcTag...
│
└── 🛠 Developer Tooling
    ├── metro.config.js         ← Metro bundler (Expo)
    ├── scripts/                ← Deploy, seed, verify scripts
    └── html_mockups/           ← Static HTML UI preview suite
```

---

## 🚀 Commands

### Mobile App (Expo)
```bash
npm run start          # Start Expo dev server (LAN)
npm run start:web      # Start Expo web on port 8081
npm run ios            # Run on iOS simulator
npm run android        # Run on Android emulator
```

### Web App (Vite)
```bash
npm run web:dev        # Start Vite dev server on port 5173
npm run web:build      # Build web app for production
npm run web:preview    # Preview production build
```

### Both Apps at Once
```bash
npm run dev:all        # Runs Expo web (8081) + Vite web (5173) simultaneously
```

### Build & Deploy
```bash
npm run eas:build:ios:testflight    # Build and submit to TestFlight
npm run eas:update:production       # Push OTA update to production
npm run web:build                   # Build Vite web for Vercel/Netlify deploy
```

---

## 🎨 Brand Identity

| Token | Value |
|-------|-------|
| **Name** | AVIO Brand |
| **Tagline** | CONNECT · IDENTIFY · EMPOWER |
| **Primary** | Amber `#F59E0B` |
| **Surface** | Dark Charcoal `#131316` |
| **Canvas** | Near-Black `#0B0B0E` |
| **Accent Blue** | Electric `#0A84FF` |
| **Accent Coral** | `#FF5252` |
| **Accent Lime** | `#C8F526` |
| **Accent Teal** | `#25F4EE` |

---

## 📦 Shared Types

Both the mobile app and web app share common TypeScript types from `packages/shared/types.ts`:

- `CardProfile` — Full 14-field profile definition
- `SocialLink` — Social platform links with display order
- `Vibe` — Interest/personality tags
- `CardAnalytics` — View, tap, click, save counters
- `NfcTag` — NFC hardware tag data
- `ApiResponse<T>` — Unified API response wrapper

---

## 📱 App Store

| Platform | ID |
|----------|----|
| **iOS (TestFlight)** | `com.sagozen.oneapp` — Team `RYGM3T4HUL` |
| **Android** | `com.biocloud.nativeapp` |
| **Expo Project** | `@theanthean8888s-organization/bio-cloud-native` |