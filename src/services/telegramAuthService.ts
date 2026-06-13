import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { AppUser } from '@/src/types/models';
import { signInWithFirebaseCustomToken } from '@/src/services/authService';
import {
  getTelegramAuthCallbackUrl,
  getTelegramAuthEndpoint,
  getTelegramBotUsername,
  getTelegramLoginSetupHint,
  getTelegramWidgetUrl,
  isTelegramLoginConfigured,
} from '@/src/utils/telegramAuthConfig';

export type TelegramLoginPayload = {
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: string;
  hash: string;
};

type TelegramVerifyResponse = {
  customToken: string;
};

function buildTelegramWidgetUrl(): string {
  const widgetUrl = getTelegramWidgetUrl();
  const bot = getTelegramBotUsername();
  const authUrl = getTelegramCallbackWithReturnOrigin();
  const url = new URL(widgetUrl);
  url.searchParams.set('bot', bot);
  url.searchParams.set('auth_url', authUrl);
  return url.toString();
}

function getTelegramCallbackWithReturnOrigin(): string {
  const callbackUrl = getTelegramAuthCallbackUrl();
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.location?.origin) {
    return callbackUrl;
  }

  const url = new URL(callbackUrl);
  url.searchParams.set('return_origin', window.location.origin);
  return url.toString();
}

function getAllowedCallbackOrigin(): string {
  try {
    return new URL(getTelegramAuthCallbackUrl()).origin;
  } catch {
    return typeof window !== 'undefined' ? window.location.origin : '';
  }
}

function parseTelegramPayloadFromUrl(url: string): TelegramLoginPayload {
  const parsed = new URL(url);
  const payload = Object.fromEntries(parsed.searchParams.entries());
  return assertTelegramPayload(payload);
}

function assertTelegramPayload(payload: Record<string, unknown>): TelegramLoginPayload {
  const id = String(payload.id ?? '').trim();
  const authDate = String(payload.auth_date ?? '').trim();
  const hash = String(payload.hash ?? '').trim();

  if (!id || !authDate || !hash) {
    throw new Error('Telegram login did not return the required signed data.');
  }

  return {
    id,
    first_name: typeof payload.first_name === 'string' ? payload.first_name : undefined,
    last_name: typeof payload.last_name === 'string' ? payload.last_name : undefined,
    username: typeof payload.username === 'string' ? payload.username : undefined,
    photo_url: typeof payload.photo_url === 'string' ? payload.photo_url : undefined,
    auth_date: authDate,
    hash,
  };
}

function waitForTelegramWebMessage(loginUrl: string): Promise<TelegramLoginPayload> {
  if (typeof window === 'undefined') {
    throw new Error('Telegram web login requires a browser window.');
  }

  const allowedOrigin = getAllowedCallbackOrigin();

  return new Promise((resolve, reject) => {
    const popup = window.open(loginUrl, 'telegram-login', 'width=560,height=720');
    if (!popup) {
      reject(new Error('Popup blocked. Allow popups and try Telegram login again.'));
      return;
    }
    const telegramPopup = popup;

    const timeout = window.setTimeout(() => {
      window.removeEventListener('message', onMessage);
      telegramPopup.close();
      reject(new Error('Telegram login timed out.'));
    }, 90_000);

    function onMessage(event: MessageEvent) {
      if (event.origin !== allowedOrigin) return;
      const data = event.data as { type?: string; payload?: Record<string, unknown> };
      if (data?.type !== 'telegram-login') return;

      window.clearTimeout(timeout);
      window.removeEventListener('message', onMessage);
      telegramPopup.close();
      try {
        resolve(assertTelegramPayload(data.payload ?? {}));
      } catch (error) {
        reject(error);
      }
    }

    window.addEventListener('message', onMessage);
  });
}

async function openTelegramLogin(): Promise<TelegramLoginPayload> {
  if (!isTelegramLoginConfigured()) {
    throw new Error(getTelegramLoginSetupHint());
  }

  const loginUrl = buildTelegramWidgetUrl();
  const callbackUrl = getTelegramAuthCallbackUrl();

  if (Platform.OS === 'web') {
    return waitForTelegramWebMessage(loginUrl);
  }

  const result = await WebBrowser.openAuthSessionAsync(loginUrl, callbackUrl);
  if (result.type !== 'success') {
    throw new Error('Telegram login was cancelled.');
  }

  return parseTelegramPayloadFromUrl(result.url);
}

async function verifyTelegramPayload(payload: TelegramLoginPayload): Promise<TelegramVerifyResponse> {
  const endpoint = getTelegramAuthEndpoint();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof body.error === 'string' ? body.error : 'Telegram login verification failed.');
  }

  if (!body.customToken || typeof body.customToken !== 'string') {
    throw new Error('Telegram verification did not return a Firebase session token.');
  }

  return { customToken: body.customToken };
}

export async function signInWithTelegram(): Promise<AppUser> {
  const payload = await openTelegramLogin();
  const verified = await verifyTelegramPayload(payload);
  return signInWithFirebaseCustomToken(verified.customToken);
}
