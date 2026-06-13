import Constants from 'expo-constants';
import { DEFAULT_TELEGRAM_BOT_USERNAME } from '@/src/constants/telegramLogin';

function getWebOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return '';
}

export function getTelegramBotUsername(): string {
  const fromEnv = process.env.EXPO_PUBLIC_TELEGRAM_BOT_USERNAME?.replace(/^@/, '').trim();
  return fromEnv || DEFAULT_TELEGRAM_BOT_USERNAME;
}

export function getTelegramAuthEndpoint(): string {
  const explicit = process.env.EXPO_PUBLIC_TELEGRAM_AUTH_ENDPOINT?.trim();
  if (explicit) return explicit;

  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  return projectId ? `https://us-central1-${projectId}.cloudfunctions.net/telegramLogin` : '';
}

export function getTelegramAuthCallbackUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_TELEGRAM_AUTH_CALLBACK_URL?.trim();
  if (explicit) return explicit;

  const webOrigin = getWebOrigin();
  if (webOrigin) return `${webOrigin}/telegram-auth-callback.html`;

  const scheme = Constants.expoConfig?.scheme ?? 'biocloud';
  return `${scheme}://telegram-auth`;
}

export function getTelegramWidgetUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_TELEGRAM_WIDGET_URL?.trim();
  if (explicit) return explicit;

  const webOrigin = getWebOrigin();
  return webOrigin ? `${webOrigin}/telegram-login.html` : '';
}

export function isTelegramLoginConfigured(): boolean {
  return Boolean(getTelegramBotUsername() && getTelegramAuthEndpoint() && getTelegramWidgetUrl());
}

/** Hostnames that need their own BotFather /setdomain entry (one domain per bot at a time). */
export const TELEGRAM_LOGIN_PRODUCTION_HOST = 'sitehubman.vercel.app';

export function getTelegramWebHostname(): string {
  if (typeof window === 'undefined' || !window.location?.hostname) return '';
  return window.location.hostname;
}

/** Telegram Login Widget only works on domains linked via @BotFather /setdomain. */
export function getTelegramDomainMismatchHint(): string | null {
  const host = getTelegramWebHostname();
  if (!host) return null;

  const isLocal = host === 'localhost' || host === '127.0.0.1';
  if (!isLocal) return null;

  return [
    'Telegram login on localhost needs BotFather /setdomain → localhost',
    '(one domain per bot — switching removes sitehubman.vercel.app until you set it again).',
    `Or test on https://${TELEGRAM_LOGIN_PRODUCTION_HOST}`,
  ].join(' ');
}

export function getTelegramLoginSetupHint(): string {
  return [
    '1. Create a Telegram bot in @BotFather.',
    '2. Run /setdomain in @BotFather (domain only, e.g. localhost — not localhost:8081).',
    '3. Add EXPO_PUBLIC_TELEGRAM_BOT_USERNAME to .env.',
    '4. Set TELEGRAM_BOT_TOKEN only in Firebase Functions config or backend env.',
    '5. Add EXPO_PUBLIC_TELEGRAM_AUTH_ENDPOINT for the deployed verify endpoint if it is not the default Firebase Functions URL.',
    '6. Add EXPO_PUBLIC_TELEGRAM_WIDGET_URL for native builds if the widget page is hosted outside the current web origin.',
    `7. Host/allow this callback URL: ${getTelegramAuthCallbackUrl()}`,
  ].join('\n');
}
