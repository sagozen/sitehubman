# 🏛️ AVIO Platform — Master Release & Operations Manual
**Official Production Release Documentation**  
*Version 1.0.0 (Build 26) — Certified Stable Release*

---

## Executive Summary

**AVIO** is an ultra-luxury, enterprise-grade contactless networking platform connecting physical NFC hardware, Cloudflare edge computing, and native mobile client applications.

* **Core Mission**: `CONNECT • IDENTIFY • EMPOWER`
* **Target Audience**: Executives, Creators, Real Estate Firms, Enterprise Sales Forces, and Global Conferences.
* **Stack**: TanStack Start + Cloudflare Workers (Edge), Strapi TypeScript (CMS & API), React Native & Expo (Mobile App), Vite + React (Card Shop).

---

## 🌐 1. Live Deployment Directory

| Platform / Service | Live Edge URL | Custom Domain | Status | Infrastructure |
|---|---|---|---|---|
| **Avio Cloud (Landing & Bio Profiles)** | [https://avio-cloud.avio-cloud.workers.dev](https://avio-cloud.avio-cloud.workers.dev) | `https://aviobrand.com` | 🟢 **100% LIVE** | Cloudflare Workers (SSR + Static) |
| **Instant 5s Card Claim Flow** | [https://avio-cloud.avio-cloud.workers.dev/activate/AVIO-8888](https://avio-cloud.avio-cloud.workers.dev/activate/AVIO-8888) | `https://aviobrand.com/activate/AVIO-8888` | 🟢 **100% LIVE** | Cloudflare Workers Route |
| **VIP Helpdesk & Support Center** | [https://avio-cloud.avio-cloud.workers.dev/help](https://avio-cloud.avio-cloud.workers.dev/help) | `https://aviobrand.com/help` | 🟢 **100% LIVE** | Cloudflare Workers Route |
| **Avio Shop (Physical Cards)** | [https://avio-shop.avio-cloud.workers.dev](https://avio-shop.avio-cloud.workers.dev) | `https://shop.aviobrand.com` | 🟢 **100% LIVE** | Cloudflare Static Assets Worker |
| **Avio API (Central Backend)** | [https://api.aviobrand.com/admin](https://api.aviobrand.com/admin) | `https://api.aviobrand.com` | 🟢 **ACTIVE** | Strapi v5 on Docker / PostgreSQL |

---

## 🍏 2. Mobile App & Apple TestFlight Directory

| Item | Production Value |
|---|---|
| **Application Name** | **AVIO** |
| **Bundle Identifier** | `com.sagozen.oneapp` |
| **App Store Connect App ID** | `6798464802` |
| **Apple Developer Team ID** | `RYGM3T4HUL` (SAGOZEN LLC) |
| **Latest Production Build** | **Build #26 (Version 1.0.0)** |
| **Build Status** | 🟢 **Successfully Delivered to Apple TestFlight** |
| **TestFlight Dashboard** | [Open in Apple App Store Connect](https://appstoreconnect.apple.com/apps/6798464802/testflight/ios) |
| **Binary Download (.ipa)** | [Download Production IPA](https://expo.dev/artifacts/eas/kw7P8Q1mZafdOVBU32DJ15k3b6Vey6G26dGx8xVjhs8.ipa) |
| **Expo Cloud Build Logs** | [View EAS Build History](https://expo.dev/accounts/theanthean8888s-organization/projects/bio-cloud-native) |

---

## 🎨 3. 4K Vector Brand & Visual Identity Spec

The AVIO emblem is mathematically constructed in SVG vector format to ensure razor-sharp rendering at 4K/8K resolutions:

### Geometric Construction:
* **Letter A**: Chevron apex with specular chrome fill (`M 50 160 L 140 25 L 230 160`).
* **Letter V**: Symmetrical vertex matching A apex (`M 275 25 L 365 160 L 455 25`).
* **Letter I**: Monolithic vertical silver pillar (`line x1="520" y1="25" x2="520" y2="160"`).
* **Letter O**: Open circular ring (`M 725 45 A 68 68 0 1 0 725 140`) with **3 radiating Electric Blue NFC Signal Waves** (`#0066FF`).
* **Tagline**: `CONNECT • IDENTIFY • EMPOWER` centered below with Azure signal dots.

### Dual-Theme Rendering Modes:
1. **Dark Theme (`theme="dark"`)**: Specular metallic silver/white gradient (`#FFFFFF` → `#E2E2E8` → `#A8A8B2`) against solid `#000000` AMOLED canvas.
2. **Light Theme (`theme="light"`)**: Platinum chrome bevel gradient (`#FFFFFF` → `#E4E4EB` → `#9C9CA8`) with high-contrast text on white surfaces.

---

## ⚡ 4. Feature Matrix & System Capabilities

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ACTIVE SYSTEM MODULES                            │
├─────────────────────────┬───────────────────────────────────────────────────┤
│ 1. 5s Unboxing Claim    │ Scan/tap unactivated card ➔ Enter name ➔ Live in  │
│                         │ under 5 seconds with zero upfront password lag.   │
├─────────────────────────┼───────────────────────────────────────────────────┤
│ 2. 2-Way Contact CRM    │ Recipients tap "Exchange Contact" on public bio to│
│                         │ send info back into cardholder's mobile timeline. │
├─────────────────────────┼───────────────────────────────────────────────────┤
│ 3. Universal Deep Links │ Instant one-tap opening into native WhatsApp,     │
│                         │ Telegram, LinkedIn, and Instagram applications.   │
├─────────────────────────┼───────────────────────────────────────────────────┤
│ 4. Global SEO Engine    │ Injected JSON-LD schemas (Organization, Product,  │
│                         │ ProfilePage, Person), sitemaps, and robots.txt.   │
├─────────────────────────┼───────────────────────────────────────────────────┤
│ 5. VIP Helpdesk Hub     │ Instant search, FAQ accordion, and 24/7 direct    │
│                         │ Telegram/WhatsApp live concierge bridges.         │
├─────────────────────────┼───────────────────────────────────────────────────┤
│ 6. Physical Card Shop   │ Interactive 3D metal card visualizer, cart, and   │
│                         │ direct Strapi order submission pipeline.          │
└─────────────────────────┴───────────────────────────────────────────────────┘
```

---

## 💰 5. Revenue & Monetization Flow

1. **Hardware Card Sales**:
   - Classic Black: $49.99
   - Brushed Steel / Platinum: $89.99
   - 24K Gold Plated: $149.99
   - Team Pack (5x): $299.99
2. **In-App Pro Subscriptions**:
   - $4.99 / month or $49.99 / year
   - Unlocks Unlimited Multi-Profiles, Direct Mode routing, Custom CSS Themes, and CSV CRM Export.
3. **Automated Staff Compensation**:
   - **Sales Reps**: 15% - 20% commission on attributed orders.
   - **Shippers**: $1.50 - $2.50 per verified proof-of-delivery (POD).
   - **Printers**: Production unit fee tracking per batch.

---

## 🗄️ 6. GitHub Repositories

* **Mobile Application**: [`sagozen/sitehubman`](https://github.com/sagozen/sitehubman) (Branch: `main`)
* **Avio Cloud (Edge)**: [`sagozen/avio-cloud`](https://github.com/sagozen/avio-cloud) (Branch: `master`)
* **Avio API (Strapi)**: [`sagozen/avio-api`](https://github.com/sagozen/avio-api) (Branch: `dev`)

---

## 🚀 7. Operations & Deployment Cheat Sheet

### Deploy Updates to Avio Cloud (`aviobrand.com`)
```powershell
cd "c:\Users\DELL\Downloads\sitehubman-main (2)\sitehubman-main\avio-cloud"
npm run build
$env:CLOUDFLARE_API_TOKEN="<your-token>"
npx wrangler deploy
```

### Deploy Updates to Avio Shop (`shop.aviobrand.com`)
```powershell
cd "c:\Users\DELL\Downloads\sitehubman-main (2)\sitehubman-main\shop"
npm run build
$env:CLOUDFLARE_API_TOKEN="<your-token>"
npx wrangler deploy
```

### Deploy Backend Updates to Server (`api.aviobrand.com`)
```bash
ssh to server
cd avio-api
git pull origin dev
docker compose up -d --build
```

### Submit New iOS Binary to Apple TestFlight
```powershell
cd "c:\Users\DELL\Downloads\sitehubman-main (2)\sitehubman-main"
npx eas-cli build --platform ios --profile production --auto-submit
```
