# Deployment Guide — Clone & Run on Other Devices

Quick setup guide for running this project on a new device.

---

## Prerequisites

Install these first:

- **Node.js** (v18+): https://nodejs.org/
- **Git**: https://git-scm.com/downloads
- **Expo Go** app on your phone (iOS/Android)
- **Firebase CLI** (optional): `npm install -g firebase-tools`
- **EAS CLI** (optional): `npm install -g eas-cli`

---

## Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd sitehubman-main
```

---

## Step 2: Install Dependencies

```bash
npm install
```

**If you get errors:**
- Clear cache: `npm cache clean --force`
- Delete `node_modules` and `package-lock.json`, then `npm install` again
- Check Node version: `node -v` (should be 18+)

---

## Step 3: Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

**The `.env` is already configured** with Firebase credentials. You only need to fill:

### Optional (if using features):
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` — Google sign-in
- `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` — image uploads
- `TELEGRAM_BOT_TOKEN` — Telegram auth (backend only)

**For basic testing, the existing Firebase config works.**

---

## Step 4: Run Locally

### Web (easiest):
```bash
npm run start:web
```
Open: http://localhost:8081

### Mobile (Expo Go):
```bash
npm start
```
Scan QR code with:
- **iOS**: Camera app
- **Android**: Expo Go app

### LAN access (phone on same network):
```bash
npm run start
```

---

## Step 5: Test the App

1. **Guest mode** — Design a card without login
2. **Create account** — Register with email/password
3. **Customer home** — See your NFC card + activity feed
4. **Bio link** — Tap "Share Card" to see your public profile

---

## Troubleshooting

### "Missing Firebase env vars"
- Check `.env` has all `EXPO_PUBLIC_FIREBASE_*` values
- Restart Expo: `npm run start:clear`

### "Can't connect to Metro"
- Use `npm run start:tunnel` if on different network
- Check firewall settings
- Try `npm run start:localhost` for web only

### "Permission denied" in Firestore
- Firebase rules need deployment (see FIREBASE_SETUP.md Step 6)
- Or use **test mode** temporarily in Firebase Console

### App shows blank/stuck
- Clear Expo cache: `npm run start:clear`
- Delete `node_modules/.cache`
- Hard refresh web: Ctrl+Shift+R

### Node memory error
- Already configured in `package.json`: `--max-old-space-size=8192`
- If still failing: increase to 16384

---

## Building APK (Android)

### First time:
```bash
npx eas login
npx eas build --platform android --profile preview
```

Install from: https://expo.dev/accounts/theanthean8888/projects/bio-cloud-native/builds

### JS updates only (no rebuild):
```bash
npm run eas:update:preview
```

---

## Building for iOS

```bash
npx eas build --platform ios --profile preview
```

For TestFlight:
```bash
npm run eas:build:ios:testflight
npm run eas:submit:ios:testflight
```

---

## Firebase Setup (if using new project)

See `FIREBASE_SETUP.md` for full Firebase configuration.

Quick checklist:
1. Create Firebase project
2. Enable Email/Password auth
3. Create Firestore database
4. Copy config to `.env`
5. Deploy rules: `npm run deploy:rules`
6. Create super admin: `npm run create:super-admin`

---

## Production Deployment

### Web (Vercel):
```bash
npm run build:web
```
Deploy `dist/` folder to Vercel

### Mobile (EAS):
```bash
npm run eas:build:production
```

### Environment variables on EAS:
```bash
npm run eas:env:checklist
```
Set all `EXPO_PUBLIC_*` vars at: https://expo.dev

---

## Project Structure

```
sitehubman-main/
├── app/               # Expo Router screens
│   ├── (tabs)/       # Bottom navigation
│   ├── auth/         # Login/register
│   ├── admin/        # Admin tools
│   └── ...
├── src/
│   ├── components/   # Reusable UI
│   ├── features/     # Feature screens
│   ├── services/     # Firebase/API
│   └── constants/    # Config
├── .env              # Local secrets (gitignored)
├── .env.example      # Template
└── package.json      # Scripts
```

---

## Key Scripts

| Command | Purpose |
|---------|---------|
| `npm start` | Expo dev server (LAN) |
| `npm run start:web` | Web browser only |
| `npm run start:tunnel` | Public URL for phone |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run eas:build:apk` | Build Android APK |
| `npm run eas:update:preview` | OTA update |
| `npm run deploy:rules` | Deploy Firestore rules |
| `npm run seed:demo` | Seed demo data |

---

## Team Collaboration

### Share with team:
1. Push code to Git
2. Team clones repo
3. Team runs `npm install`
4. Team uses **same `.env`** (share securely, not in Git)
5. Everyone can run `npm start`

### Multiple devices (same Firebase):
- All devices share the same Firebase project
- Users see same data in Firestore
- Auth works across all devices
- Orders, cards, profiles sync automatically

---

## Security Notes

- **Never commit `.env`** — it's in `.gitignore`
- Share `.env` securely (1Password, encrypted chat)
- Use different Firebase projects for dev/staging/production
- Keep `TELEGRAM_BOT_TOKEN` server-side only
- Don't expose Firebase admin keys in client code

---

## Getting Help

1. Check `FIREBASE_SETUP.md` for Firebase issues
2. Check `RUN_COMMANDS.md` for command reference
3. Check `PROJECT_FEATURE_STATUS.md` for feature status
4. Open an issue or contact the team

---

## Platform-Specific Notes

### macOS/Linux:
```bash
npm start
```

### Windows:
```powershell
npm start
# or use the menu:
npm run run
```

### Docker (advanced):
Create `Dockerfile`:
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "start:web"]
```

---

## What's Next?

- **Customize**: Edit screens in `app/` and `src/features/`
- **Add features**: Check hooks in `.kiro/hooks/`
- **Deploy**: Use EAS for mobile, Vercel for web
- **Monitor**: Check Firebase Console for users/data

**Your app is ready!** 🚀
