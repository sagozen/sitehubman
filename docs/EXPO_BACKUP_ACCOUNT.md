# Expo backup account (when primary account missing / quota full)

Use this when **vct8888** is not found, quota is used up, or you want a second Expo account for test APK builds.

## One-time setup (new Expo account)

### 1. Create account
- https://expo.dev/signup  
- Verify email

### 2. Link this repo to the new account

```powershell
cd C:\Users\DELL\Downloads\sitehub-main\sitehub-main
npm run eas:link-backup
```

The script will:
1. Log out of the old Expo session  
2. Ask you to log in with the **new** account  
3. Run `eas init` → creates a **new EAS project** and updates `app.json` → `extra.eas.projectId`  
4. Set `expo.owner` in `app.json` to your new username  

When `eas init` asks:
- **Create a new project** → Yes  
- **Project name** → e.g. `snaptap` or `sitehubman`  

First keystore: when building, choose **Generate new keystore**.

### 3. Add Firebase env vars (required for login in APK)

Expo → your new project → **Environment variables** → environment **preview**

Copy from local `.env`:
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (optional, for Google sign-in)

### 4. Build test APK

```powershell
npm run eas:build:apk
```

Open builds: https://expo.dev → Projects → your new project → Builds → download **.apk**

---

## Primary vs backup (reference)

| | Primary (old) | Backup (new) |
|---|---------------|--------------|
| Account | `vct8888` | *your new username* |
| Project ID | `792fa251-8479-4cf7-909a-0e2800c6303d` | *set by `eas init`* |
| Slug | `bio-cloud-native` | same slug is OK |

Keep a copy in `eas.accounts.local.json` (gitignored) — see `eas.accounts.example.json`.

---

## Switch back to primary later

```powershell
npx eas logout
npx eas login
# log in as vct8888
```

Restore `app.json`:
- `extra.eas.projectId` → primary project ID  
- `owner` → `vct8888`  

Then commit if you want the team on the same project.
