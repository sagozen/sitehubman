/**
 * Prints Google OAuth redirect URI and setup steps for this Expo project.
 * Run: node scripts/print-google-setup.mjs
 */

import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const appJson = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8'));
const owner = appJson.expo.owner ?? 'vct8888';
const slug = appJson.expo.slug ?? 'bio-cloud-native';
const scheme = appJson.expo.scheme ?? 'biocloud';
const iosBundle = appJson.expo.ios?.bundleIdentifier ?? 'com.sagozen.sitehubman';
const androidPackage = appJson.expo.android?.package ?? 'com.biocloud.nativeapp';

const expoGoRedirect = `https://auth.expo.io/@${owner}/${slug}`;
const localWebRedirect = 'http://localhost:8081';
const productionWebRedirect = 'https://sitehubman.vercel.app';
const nativeRedirect = `${scheme}://oauthredirect`;

let hasWebId = false;
let hasIosId = false;
let hasAndroidId = false;
const envPath = join(root, '.env');
if (existsSync(envPath)) {
  const env = readFileSync(envPath, 'utf8');
  hasWebId = /^EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=\S+/m.test(env);
  hasIosId = /^EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=\S+/m.test(env);
  hasAndroidId = /^EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=\S+/m.test(env);
}

console.log(`
SiteHub - Google Sign-In setup
==============================

Firebase: https://console.firebase.google.com/project/sitehub-8dd56/authentication/providers

1. Enable Google provider and copy the Web client ID (*.apps.googleusercontent.com).

2. Add to .env:
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<paste web client id here>

3. Google Cloud Console -> Credentials -> Web OAuth client -> Authorized redirect URIs:
   ${localWebRedirect}
   ${productionWebRedirect}
   ${expoGoRedirect}

   If Expo Web opens a different local port or you use another deployed domain, add that exact browser origin instead.
   Google requires Web OAuth redirects to be HTTPS, with localhost allowed for development.

4. Native dev/EAS builds need platform OAuth clients. Do not reuse the Web client ID as a native client ID.
   iOS OAuth client bundle ID: ${iosBundle}
   Android OAuth client package: ${androidPackage}
   Android OAuth client SHA-1: use your debug/EAS/Play signing certificate fingerprint.
   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=...
   EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=...

5. Restart Expo after editing .env:
   npx expo start -c

Web redirect: ${localWebRedirect}
Production web redirect: ${productionWebRedirect}
Expo Go redirect: ${expoGoRedirect}
Native redirect used by the current AuthSession flow: ${nativeRedirect}
.env has GOOGLE_WEB_CLIENT_ID: ${hasWebId ? 'yes' : 'NO - add it'}
.env has GOOGLE_IOS_CLIENT_ID: ${hasIosId ? 'yes' : 'no'}
.env has GOOGLE_ANDROID_CLIENT_ID: ${hasAndroidId ? 'yes' : 'no'}
`);
