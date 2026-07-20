/**
 * Shared Firebase/script config for local operational scripts.
 * Defaults are dev-friendly but can be overridden via env vars.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DOTENV_PATH = join(ROOT, '.env');

function loadDotEnv() {
  if (!existsSync(DOTENV_PATH)) return;
  const content = readFileSync(DOTENV_PATH, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadDotEnv();

function read(name, fallback = '') {
  const value = process.env[name];
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

export const firebaseConfig = {
  apiKey: read('EXPO_PUBLIC_FIREBASE_API_KEY'),
  authDomain: read('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: read('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: read('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: read('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: read('EXPO_PUBLIC_FIREBASE_APP_ID'),
};

export const demoCredentials = {
  password: read('SITEHUB_DEMO_PASSWORD', 'demo1234'),
  adminEmail: read('SITEHUB_ADMIN_EMAIL', 'admin@demo.com'),
  salesEmail: read('SITEHUB_SALES_EMAIL', 'sales@demo.com'),
  printerEmail: read('SITEHUB_PRINTER_EMAIL', 'printer@demo.com'),
  qaEmail: read('SITEHUB_QA_EMAIL', 'qa@demo.com'),
  shippingEmail: read('SITEHUB_SHIPPING_EMAIL', 'shipping@demo.com'),
  customerEmail: read('SITEHUB_CUSTOMER_EMAIL', 'customer@demo.com'),
  superAdminEmail: read('SITEHUB_SUPER_ADMIN_EMAIL', 'theancoc69@gmail.com'),
  superAdminPassword: read('SITEHUB_SUPER_ADMIN_PASSWORD', read('SITEHUB_DEMO_PASSWORD', '')),
};

/** Script-only env (loaded from .env). */
export const scriptEnv = {
  paymentSandboxSecret: read('PAYMENT_SANDBOX_SECRET'),
  paymentWebhookUrl: read('PAYMENT_WEBHOOK_URL'),
  functionsRegion: read('FIREBASE_FUNCTIONS_REGION', 'us-central1'),
};

export function assertFirebaseScriptConfig() {
  const missing = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase env vars for scripts: ${missing.join(', ')}. ` +
      'Set EXPO_PUBLIC_FIREBASE_* values in your .env before running scripts.'
    );
  }
}
