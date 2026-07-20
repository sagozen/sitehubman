# Google OAuth — `redirect_uri_mismatch`

## What the error means (Khmer / English)

Google is saying: the app sent `redirect_uri=http://localhost:8081`, but that exact URI is **not** on the **Web** OAuth client matching the **client ID in your `.env`**.

This is usually **not** a wrong password — it is a **missing redirect URI** or **wrong OAuth client** in Google Cloud.

## Use the Firebase Web client (recommended)

Your Firebase project `sitehub-8dd56` uses Google Cloud project number **145010162726**.

1. [Firebase Console](https://console.firebase.google.com/project/sitehub-8dd56/authentication/providers) → **Authentication** → **Google** → copy **Web client ID**.
2. Put it in `.env`:

   ```env
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<paste from Firebase>
   ```

3. [Google Cloud Credentials](https://console.cloud.google.com/apis/credentials?project=sitehub-8dd56) → open **that same** Web client → **Authorized redirect URIs** → add:

   ```text
   http://localhost:8081
   https://sitehubman.vercel.app
   https://auth.expo.io/@theanthean8888/bio-cloud-native
   ```

4. Save, wait 1–2 minutes, then `npx expo start -c`.

## If you use client `208002549858-...`

That ID is from a **different** Google Cloud project (**208002549858**), not Firebase’s **145010162726**.

- You **must** add redirect URIs on the OAuth client `208002549858-lsj7ui8bv3eg83nuasvug5jm8p6f3l5o...` in **that** project’s Credentials page.
- You **must** set the same ID in `.env`.
- Firebase sign-in may still fail unless that client is linked to Firebase — prefer the Web client from Firebase step above.

## Checklist

| Check | |
|-------|---|
| OAuth client type is **Web application** (not iOS/Android only) | |
| `.env` `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` = same client you edited | |
| Redirect list includes **exact** `http://localhost:8081` (no trailing slash) | |
| Restarted Expo after `.env` change | |

Run: `npm run google:setup`
