/**
 * Push EXPO_PUBLIC_* from .env to Expo EAS (preview + production).
 * Run: node scripts/push-eas-env.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

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
  'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
  'EXPO_PUBLIC_GOOGLE_WEB_CLIENTID',
  'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID',
  'EXPO_PUBLIC_GOOGLE_IOS_CLIENTID',
  'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID',
  'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENTID',
  'EXPO_PUBLIC_PROFILE_HOST',
  'EXPO_PUBLIC_TELEGRAM_BOT_USERNAME',
  'EXPO_PUBLIC_TELEGRAM_AUTH_ENDPOINT',
  'EXPO_PUBLIC_TELEGRAM_WIDGET_URL',
  'EXPO_PUBLIC_TELEGRAM_AUTH_CALLBACK_URL',
];

if (!existsSync(envPath)) {
  console.error('Missing .env — copy .env.example and fill values first.');
  process.exit(1);
}

const envText = readFileSync(envPath, 'utf8');

function read(name) {
  const m = envText.match(new RegExp(`^${name}=(.*)$`, 'm'));
  return m?.[1]?.trim() ?? '';
}

const environments = ['preview', 'production'];
let failed = 0;

for (const key of keys) {
  const value = read(key);
  if (!value) {
    console.warn(`skip ${key} (empty in .env)`);
    continue;
  }
  for (const environment of environments) {
    const result = spawnSync(
      'npx',
      [
        'eas',
        'env:create',
        '--name',
        key,
        '--value',
        value,
        '--environment',
        environment,
        '--visibility',
        'plaintext',
        '--force',
        '--non-interactive',
      ],
      { cwd: root, stdio: 'inherit', shell: true }
    );
    if (result.status !== 0) {
      failed += 1;
      console.error(`failed ${key} (${environment})`);
    } else {
      console.log(`ok ${key} (${environment})`);
    }
  }
}

if (failed > 0) {
  console.error(`\n${failed} env create command(s) failed.`);
  process.exit(1);
}

console.log('\nDone. Rebuild APK: npm run eas:build:apk');
