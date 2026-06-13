# Build a test APK (Android)

## Account not found / quota full?

Use a **new Expo account** as backup: see **[EXPO_BACKUP_ACCOUNT.md](./EXPO_BACKUP_ACCOUNT.md)** and run:

```powershell
npm run eas:link-backup
```

Then add Firebase env vars on the **new** project and run `npm run eas:build:apk`.

---

## Fastest way — EAS cloud build (recommended)

Default config points at **vct8888**. Run this **in your own terminal** (must be interactive the first time):

```bash
cd sitehub-main
npm run eas:build:apk
```

When asked about Android keystore, choose **Generate new keystore** (or let Expo manage credentials).

When the build finishes (~10–20 min), open the link in the terminal or go to:

https://expo.dev/accounts/vct8888/projects/bio-cloud-native/builds

Download the **`.apk`** file and install on your Android phone (enable “Install unknown apps”).

### Firebase on the APK

EAS does not use your local `.env` automatically. Add variables in Expo:

1. https://expo.dev/accounts/vct8888/projects/bio-cloud-native/environment-variables  
2. Environment: **preview**  
3. Add each `EXPO_PUBLIC_FIREBASE_*` and `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` from your `.env`  
4. Run `npm run eas:build:apk` again

---

## Alternative — build on your PC (needs Java + Android Studio)

1. Install [Android Studio](https://developer.android.com/studio)  
2. Set **JAVA_HOME** to JDK 17 (bundled with Android Studio)  
3. Run:

```bash
cd android
.\gradlew.bat assembleRelease
```

APK path:

`android\app\build\outputs\apk\release\app-release.apk`

---

## Install APK on phone

1. Copy APK to the phone (USB, Drive, Telegram, etc.)  
2. Open the file → Install  
3. If blocked: Settings → Security → allow install from that app
