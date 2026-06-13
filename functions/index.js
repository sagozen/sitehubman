const crypto = require('crypto');
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { onRequest } = require('firebase-functions/v2/https');
const { onDocumentWritten, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { defineSecret } = require('firebase-functions/params');

admin.initializeApp();

const DEFAULT_MAX_AGE_SECONDS = 24 * 60 * 60;
const FUTURE_SKEW_SECONDS = 300;
const telegramBotTokenSecret = defineSecret('TELEGRAM_BOT_TOKEN');
const CLAIM_ROLES = new Set([
  'guest',
  'customer',
  'sales',
  'agent',
  'printer',
  'printer_operator',
  'qa_inspector',
  'shipping',
  'admin',
  'super_admin',
]);

function normalizeClaimRole(role) {
  const value = String(role || '').trim();
  return CLAIM_ROLES.has(value) ? value : 'guest';
}

function compactStringClaim(value) {
  const trimmed = String(value || '').trim();
  return trimmed || undefined;
}

function getTelegramBotToken() {
  const runtimeConfig = typeof functions.config === 'function' ? functions.config() : {};
  let secretValue = '';
  try {
    secretValue = telegramBotTokenSecret.value();
  } catch {
    secretValue = '';
  }

  return (
    secretValue ||
    process.env.TELEGRAM_BOT_TOKEN ||
    runtimeConfig.telegram?.bot_token ||
    ''
  ).trim();
}

function getMaxAgeSeconds() {
  const raw = Number(process.env.TELEGRAM_AUTH_MAX_AGE_SECONDS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_MAX_AGE_SECONDS;
}

function setCors(req, res) {
  const origin = req.get('origin') || '';
  const allowed = (process.env.TELEGRAM_ALLOWED_ORIGINS || '*')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const allowOrigin = allowed.includes('*') || allowed.includes(origin) ? origin || '*' : allowed[0] || '';

  if (allowOrigin) {
    res.set('Access-Control-Allow-Origin', allowOrigin);
  }
  res.set('Vary', 'Origin');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
}

function normalizeTelegramPayload(body) {
  const payload = {
    id: String(body?.id ?? '').trim(),
    first_name: typeof body?.first_name === 'string' ? body.first_name.trim() : undefined,
    last_name: typeof body?.last_name === 'string' ? body.last_name.trim() : undefined,
    username: typeof body?.username === 'string' ? body.username.trim() : undefined,
    photo_url: typeof body?.photo_url === 'string' ? body.photo_url.trim() : undefined,
    auth_date: String(body?.auth_date ?? '').trim(),
    hash: String(body?.hash ?? '').trim(),
  };

  if (!payload.id || !payload.auth_date || !payload.hash) {
    throw new Error('Missing Telegram login fields.');
  }
  if (!/^\d+$/.test(payload.id)) {
    throw new Error('Invalid Telegram user ID.');
  }
  if (!/^\d+$/.test(payload.auth_date)) {
    throw new Error('Invalid Telegram auth_date.');
  }
  if (!/^[a-f0-9]{64}$/i.test(payload.hash)) {
    throw new Error('Invalid Telegram hash.');
  }

  return payload;
}

function buildDataCheckString(payload) {
  return Object.entries(payload)
    .filter(([key, value]) => key !== 'hash' && value !== undefined && value !== null && String(value) !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
}

function verifyTelegramLogin(payload, botToken, maxAgeSeconds = getMaxAgeSeconds()) {
  const authDate = Number(payload.auth_date);
  const now = Math.floor(Date.now() / 1000);

  if (authDate > now + FUTURE_SKEW_SECONDS) {
    throw new Error('Telegram auth_date is in the future.');
  }
  if (now - authDate > maxAgeSeconds) {
    throw new Error('Telegram login expired. Try again.');
  }

  const secret = crypto.createHash('sha256').update(botToken).digest();
  const expected = crypto
    .createHmac('sha256', secret)
    .update(buildDataCheckString(payload))
    .digest('hex');

  const expectedBuffer = Buffer.from(expected, 'hex');
  const actualBuffer = Buffer.from(payload.hash, 'hex');
  if (expectedBuffer.length !== actualBuffer.length || !crypto.timingSafeEqual(expectedBuffer, actualBuffer)) {
    throw new Error('Invalid Telegram login hash.');
  }
}

function displayNameFromTelegram(payload) {
  return [payload.first_name, payload.last_name].filter(Boolean).join(' ').trim()
    || (payload.username ? `@${payload.username}` : `Telegram ${payload.id}`);
}

async function getOrCreateTelegramUser(payload) {
  const db = admin.firestore();
  const users = db.collection('users');
  const telegramId = payload.id;
  const now = admin.firestore.FieldValue.serverTimestamp();

  const existing = await users.where('telegramId', '==', telegramId).limit(1).get();
  const existingDoc = existing.docs[0];
  const uid = existingDoc?.id || `telegram_${telegramId}`;
  const existingData = existingDoc?.data() || {};
  const displayName = displayNameFromTelegram(payload);

  try {
    await admin.auth().getUser(uid);
    await admin.auth().updateUser(uid, {
      displayName,
      photoURL: payload.photo_url || undefined,
    });
  } catch (error) {
    if (error?.code === 'auth/user-not-found') {
      await admin.auth().createUser({
        uid,
        displayName,
        photoURL: payload.photo_url || undefined,
      });
    } else {
      throw error;
    }
  }

  const isNew = !existingDoc;
  await users.doc(uid).set(
    {
      email: existingData.email || '',
      displayName: existingData.displayName || displayName,
      role: existingData.role || 'customer',
      authType: 'telegram',
      authProvider: 'telegram',
      plan: existingData.plan || 'free',
      language: existingData.language || 'en',
      isActive: existingData.isActive !== false,
      telegramId,
      telegramUsername: payload.username || '',
      telegramPhotoUrl: payload.photo_url || '',
      lastLoginAt: now,
      updatedAt: now,
      updatedBy: uid,
      ...(isNew ? { createdAt: now, createdBy: uid } : {}),
    },
    { merge: true }
  );

  return uid;
}

exports.syncUserAccessClaims = onDocumentWritten(
  { region: 'us-central1', document: 'users/{uid}' },
  async (event) => {
    const uid = event.params.uid;
    if (!uid) return;

    let nextAccessClaims = {
      role: 'guest',
      isActive: false,
      companyId: undefined,
      branch: undefined,
    };

    const after = event.data?.after;
    if (after?.exists) {
      const data = after.data() || {};
      nextAccessClaims = {
        role: normalizeClaimRole(data.role),
        isActive: data.isActive !== false,
        companyId: compactStringClaim(data.companyId),
        branch: compactStringClaim(data.branch),
      };
    }

    try {
      const user = await admin.auth().getUser(uid);
      await admin.auth().setCustomUserClaims(uid, {
        ...(user.customClaims || {}),
        ...nextAccessClaims,
      });
    } catch (error) {
      if (error?.code !== 'auth/user-not-found') {
        console.error('[syncUserAccessClaims] failed', { uid, error });
        throw error;
      }
    }
  }
);

exports.telegramLogin = onRequest({ region: 'us-central1', secrets: [telegramBotTokenSecret] }, async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  try {
    const botToken = getTelegramBotToken();
    if (!botToken) {
      res.status(500).json({ error: 'Telegram bot token is not configured.' });
      return;
    }

    const payload = normalizeTelegramPayload(req.body);
    verifyTelegramLogin(payload, botToken);
    const uid = await getOrCreateTelegramUser(payload);
    const customToken = await admin.auth().createCustomToken(uid, { authProvider: 'telegram' });

    res.status(200).json({ customToken });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Telegram login failed.';
    res.status(401).json({ error: message });
  }
});

const payments = require('./payments');
exports.createPaymentIntent = payments.createPaymentIntent;
exports.paymentWebhookSandbox = payments.paymentWebhookSandbox;
exports.paymentWebhookAba = payments.paymentWebhookAba;
exports.initiateRefund = payments.initiateRefund;
exports.generateInvoice = payments.generateInvoice;
exports.generatePaymentSandboxSecret = payments.generatePaymentSandboxSecret;

exports._test = {
  buildDataCheckString,
  normalizeTelegramPayload,
  verifyTelegramLogin,
};

exports.orderNotificationsMock = onDocumentUpdated(
  { region: 'us-central1', document: 'orders/{orderId}' },
  async (event) => {
    const before = event.data?.before?.data() || {};
    const after = event.data?.after?.data() || {};
    const orderId = event.params.orderId;
    
    const db = admin.firestore();
    const notifications = db.collection('notification_logs');
    const now = admin.firestore.FieldValue.serverTimestamp();
    
    const logs = [];

    // 1. Shipped Notification
    if (before.status !== 'shipped' && after.status === 'shipped') {
      logs.push({
        orderId,
        type: 'shipped',
        recipient: after.phone || after.whatsapp || after.telegram || after.email || 'unknown',
        message: `Your NFC Global order ${after.orderNumber || orderId} has been shipped! Tracking: ${after.trackingNumber || 'N/A'}`,
        status: 'mock_delivered',
        createdAt: now
      });
    }
    
    // 2. Payment Verified Notification
    if (before.paymentStatus !== 'paid_verified' && after.paymentStatus === 'paid_verified') {
      logs.push({
        orderId,
        type: 'payment_verified',
        recipient: after.phone || after.whatsapp || after.telegram || after.email || 'unknown',
        message: `We have verified your payment for order ${after.orderNumber || orderId}. It is now in production.`,
        status: 'mock_delivered',
        createdAt: now
      });
    }

    // 3. Order Ready to Print
    if (before.status !== 'ready_to_print' && after.status === 'ready_to_print') {
      logs.push({
        orderId,
        type: 'order_approved',
        recipient: after.phone || after.whatsapp || after.telegram || after.email || 'unknown',
        message: `Your order ${after.orderNumber || orderId} has been approved and sent to our printing workshop.`,
        status: 'mock_delivered',
        createdAt: now
      });
    }

    if (logs.length > 0) {
      const batch = db.batch();
      logs.forEach(log => {
        batch.set(notifications.doc(), log);
      });
      await batch.commit();
      console.log(`[orderNotificationsMock] Created ${logs.length} notification logs for order ${orderId}`);
    }
  }
);
