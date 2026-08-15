# 🏛️ AVIO Ecosystem & Deployment Master Guide

An all-in-one directory of all live URLs, deployment endpoints, mobile builds, and active features across the AVIO platform.

---

## 🌐 1. Live Web & Cloudflare Endpoints

| Platform | Live Edge Deployment | Production Custom Domain | Status |
|---|---|---|---|
| **Avio Cloud (Landing & Edge Bio)** | [https://avio-cloud.avio-cloud.workers.dev](https://avio-cloud.avio-cloud.workers.dev) | `https://aviobrand.com` | 🟢 **100% Live** (Cloudflare Worker) |
| **Instant 5s Card Activation** | [https://avio-cloud.avio-cloud.workers.dev/activate/AVIO-8888](https://avio-cloud.avio-cloud.workers.dev/activate/AVIO-8888) | `https://aviobrand.com/activate/AVIO-8888` | 🟢 **100% Live** |
| **VIP Helpdesk & Support** | [https://avio-cloud.avio-cloud.workers.dev/help](https://avio-cloud.avio-cloud.workers.dev/help) | `https://aviobrand.com/help` | 🟢 **100% Live** |
| **Avio Shop (Physical Cards)** | [https://avio-shop.avio-cloud.workers.dev](https://avio-shop.avio-cloud.workers.dev) | `https://shop.aviobrand.com` | 🟢 **100% Live** (Cloudflare Worker) |
| **Avio API (Strapi Backend CMS)** | [https://api.aviobrand.com/admin](https://api.aviobrand.com/admin) | `https://api.aviobrand.com` | 🟢 **Active Backend** |

---

## 📱 2. Mobile App & Apple TestFlight

| Attribute | Configuration |
|---|---|
| **App Name** | **AVIO** |
| **Bundle ID** | `com.sagozen.oneapp` |
| **App Store Connect App ID** | `6798464802` |
| **Apple Developer Team ID** | `RYGM3T4HUL` (SAGOZEN LLC) |
| **Latest iOS Build** | **Build #18** (Auto-submitting to TestFlight) |
| **Live Build Tracker** | [Track Expo Cloud Builds](https://expo.dev/accounts/theanthean8888s-organization/projects/bio-cloud-native) |

---

## 💎 3. Brand & 4K Vector Specs

* **Letter A**: Chevron apex with metallic specular fill and sharp vertex.
* **Letter V**: Symmetrical vertex matching the A apex.
* **Letter I**: Monolithic vertical silver pillar.
* **Letter O**: Open circular aperture with **3 Electric Blue NFC Signal Waves** (`#0066FF`).
* **Tagline**: `CONNECT • IDENTIFY • EMPOWER`
* **Dual Theme Engine**:
  - `theme="dark"`: Specular Silver/White on `#000000` AMOLED canvas.
  - `theme="light"`: Platinum Chrome bevel on `#FFFFFF` canvas.

---

## 🗂️ 4. GitHub Repositories

* **Mobile App**: [`sagozen/sitehubman`](https://github.com/sagozen/sitehubman) (`main` branch)
* **Avio Cloud**: [`sagozen/avio-cloud`](https://github.com/sagozen/avio-cloud) (`master` branch)
* **Avio API**: [`sagozen/avio-api`](https://github.com/sagozen/avio-api) (`dev` branch)

---

## 🛠️ 5. Instant Deployment Commands

### Deploy Avio Cloud
```powershell
cd "c:\Users\DELL\Downloads\sitehubman-main (2)\sitehubman-main\avio-cloud"
npm run build
npx wrangler deploy
```

### Deploy Avio Shop
```powershell
cd "c:\Users\DELL\Downloads\sitehubman-main (2)\sitehubman-main\shop"
npm run build
npx wrangler deploy
```

### Pull on Backend Server (`api.aviobrand.com`)
```bash
ssh to server
cd avio-api
git pull origin dev
docker compose up -d --build
```
