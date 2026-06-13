/**
 * Lists EXPO_PUBLIC_* vars to copy into Expo dashboard (preview + production).
 * Run: node scripts/print-eas-env-checklist.mjs
 */

import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, '.env');
const keys = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
  'EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID',
  'EXPO_PUBLIC_RECAPTCHA_SITE_KEY',
  'EXPO_PUBLIC_APP_CHECK_DEBUG_TOKEN',
  'EXPO_PUBLIC_APP_CHECK_ENFORCED',
  'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
  'EXPO_PUBLIC_PROFILE_HOST',
  'EXPO_PUBLIC_TELEGRAM_BOT_USERNAME',
  'EXPO_PUBLIC_TELEGRAM_AUTH_ENDPOINT',
  'EXPO_PUBLIC_TELEGRAM_WIDGET_URL',
  'EXPO_PUBLIC_TELEGRAM_AUTH_CALLBACK_URL',
];

let env = '';
if (existsSync(envPath)) env = readFileSync(envPath, 'utf8');

function read(name) {
  const m = env.match(new RegExp(`^${name}=(.*)$`, 'm'));
  return m?.[1]?.trim() ?? '';
}

console.log(`
EAS Environment variables checklist
====================================
Open: https://expo.dev/accounts/theanthean8888/projects/bio-cloud-native/environment-variables
Add for environment: preview AND production

`);
for (const key of keys) {
  const val = read(key);
  console.log(`${key}=${val ? '(set in .env)' : 'MISSING in .env'}`);
}
console.log(`
After adding vars, rebuild APK (env is baked at build time):
  npm run eas:build:apk

Then push JS fixes without rebuild:
  npm run eas:update:preview
`);
