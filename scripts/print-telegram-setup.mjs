/**
 * Prints Telegram Login setup steps for this Expo/Firebase project.
 * Run: node scripts/print-telegram-setup.mjs
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const appJson = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8'));
const scheme = appJson.expo.scheme ?? 'biocloud';

let env = '';
const envPath = join(root, '.env');
if (existsSync(envPath)) env = readFileSync(envPath, 'utf8');

function readEnv(name) {
  const match = env.match(new RegExp(`^${name}=(.*)$`, 'm'));
  return match?.[1]?.trim() ?? '';
}

const projectId = readEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID') || 'sitehub-8dd56';
const botUsername = readEnv('EXPO_PUBLIC_TELEGRAM_BOT_USERNAME');
const authEndpoint =
  readEnv('EXPO_PUBLIC_TELEGRAM_AUTH_ENDPOINT') ||
  `https://us-central1-${projectId}.cloudfunctions.net/telegramLogin`;
const prodOrigin =
  readEnv('EXPO_PUBLIC_TELEGRAM_WIDGET_URL').replace(/\/telegram-login\.html$/, '') ||
  'https://sitehubman.vercel.app';
const localOrigin = 'http://localhost:8081';
const webWidgetUrl =
  readEnv('EXPO_PUBLIC_TELEGRAM_WIDGET_URL') || `${prodOrigin}/telegram-login.html`;
const webCallbackUrl =
  readEnv('EXPO_PUBLIC_TELEGRAM_AUTH_CALLBACK_URL') || `${prodOrigin}/telegram-auth-callback.html`;
const nativeCallbackUrl = `${scheme}://telegram-auth`;

console.log(`
SiteHub - Telegram Login setup
==============================

Start here:
1. In Telegram, open @BotFather and create a bot with /newbot.
2. In @BotFather, run /setdomain for that bot and send ONE domain (no port):
   Development: localhost
   Production: sitehubman.vercel.app (linked in BotFather)
3. Add this to .env:
   EXPO_PUBLIC_TELEGRAM_BOT_USERNAME=<your_bot_username_without_@>

4. Set the backend-only bot token as a Firebase Secret:
   PowerShell:
     npx firebase functions:secrets:set TELEGRAM_BOT_TOKEN

   For local function testing only, set environment variable:
     TELEGRAM_BOT_TOKEN=<bot token>

5. Deploy the verifier:
   npx firebase deploy --only functions:telegramLogin

6. If you host the widget somewhere else for native builds, add:
   EXPO_PUBLIC_TELEGRAM_AUTH_ENDPOINT=${authEndpoint}
   EXPO_PUBLIC_TELEGRAM_WIDGET_URL=${webWidgetUrl}
   EXPO_PUBLIC_TELEGRAM_AUTH_CALLBACK_URL=${webCallbackUrl}

URLs used by this app:
Web widget:    ${webWidgetUrl}
Web callback:  ${webCallbackUrl}
Native return: ${nativeCallbackUrl}
Verify API:    ${authEndpoint}

.env has TELEGRAM_BOT_USERNAME: ${botUsername ? 'yes' : 'NO - add it first'}
Do not add the Telegram bot token to any EXPO_PUBLIC_* variable.
`);
