/**
 * Payment intents + webhooks — only path to orders.paymentStatus === 'paid'.
 */
const admin = require('firebase-admin');
const crypto = require('crypto');
const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');

const paymentSandboxSecret = defineSecret('PAYMENT_SANDBOX_SECRET');
const abaWebhookSecret = defineSecret('ABA_WEBHOOK_SECRET');

const INTENTS = 'payment_intents';
const EVENTS = 'payment_events';
const ORDERS = 'orders';
const CARDS = 'cards';
const NOTIFICATIONS = 'notifications';
const REFUNDS = 'refunds';
const INVOICES = 'invoices';
const PAYMENT_SECRETS_DOC = 'app_config/payment_secrets';
const TRUSTED_ROLES = new Set([
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

function db() {
  return admin.firestore();
}

function shouldEnforceAppCheck() {
  return process.env.APP_CHECK_ENFORCED === 'true';
}

function intentExpired(intent) {
  const expiresAt = intent?.expiresAt;
  if (!expiresAt) return false;
  const ms = typeof expiresAt.toDate === 'function' ? expiresAt.toDate().getTime() : new Date(expiresAt).getTime();
  return Number.isFinite(ms) && Date.now() > ms;
}

function normalizeRole(role) {
  const value = String(role || '').trim();
  return TRUSTED_ROLES.has(value) ? value : 'guest';
}

function timingSafeStringEqual(actual, expected) {
  const actualBuffer = Buffer.from(String(actual || ''), 'utf8');
  const expectedBuffer = Buffer.from(String(expected || ''), 'utf8');
  return actualBuffer.length === expectedBuffer.length
    && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

function webhookRateKey(req) {
  return String(req.ip || req.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
}

async function assertWebhookRateLimit(req, provider, limit = 120) {
  const key = webhookRateKey(req);
  const bucketId = `${provider}_${key}_${new Date().toISOString().slice(0, 16)}`;
  const ref = db().collection('payment_events').doc(`rate_${bucketId.replace(/[^a-zA-Z0-9_-]/g, '_')}`);
  await db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const count = snap.exists ? Number(snap.data().count ?? 0) : 0;
    if (count >= limit) {
      throw new Error('rate_limited');
    }
    tx.set(
      ref,
      {
        provider,
        key,
        count: count + 1,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });
}

function idempotencyKey(orderId, methodId) {
  return `${orderId}_${methodId}_${Date.now()}`;
}

async function publishGuestCard(orderId) {
  const orderSnap = await db().doc(`${ORDERS}/${orderId}`).get();
  if (!orderSnap.exists) return;
  const order = orderSnap.data();
  const cardId = order.cardId;
  if (!cardId || order.fulfillment !== 'physical') return;
  await db().doc(`${CARDS}/${cardId}`).set(
    {
      status: 'ordered',
      paymentVerifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

async function notifyUser(userId, title, message, actionUrl) {
  if (!userId) return;
  await db().collection(NOTIFICATIONS).add({
    userId,
    title,
    message,
    isRead: false,
    priority: 'high',
    actionUrl: actionUrl || null,
    createdBy: 'system',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function getActor(auth) {
  const uid = auth?.uid;
  if (!uid) {
    return { uid: '', role: 'guest', isActive: false };
  }
  const snap = await db().doc(`users/${uid}`).get();
  const data = snap.exists ? snap.data() : {};
  const claimRole = normalizeRole(auth?.token?.role);
  const profileRole = normalizeRole(data.role);
  return {
    uid,
    role: claimRole !== 'guest' ? claimRole : profileRole,
    isActive: snap.exists && data.isActive !== false && auth?.token?.isActive !== false,
  };
}

function isAdminRole(role) {
  return role === 'admin' || role === 'super_admin';
}

function isSalesRole(role) {
  return role === 'sales' || role === 'agent';
}

function assertFinanceAccess(actor, order, options = {}) {
  if (!actor.isActive) {
    throw new HttpsError('permission-denied', 'Your account is inactive.');
  }
  if (isAdminRole(actor.role)) return;
  if (isSalesRole(actor.role) && order.assignedSalesman === actor.uid) return;
  if (options.allowCustomer && order.createdBy === actor.uid) return;
  throw new HttpsError('permission-denied', 'You cannot manage finance for this order.');
}

function assertActiveActor(actor) {
  if (!actor.isActive) {
    throw new HttpsError('permission-denied', 'Your account is inactive.');
  }
}

function getOrderAmount(order) {
  const amount = Number(order.amount ?? 0);
  if (Number.isFinite(amount) && amount > 0) return amount;
  const quantity = Math.max(1, Number(order.quantity ?? 1));
  return quantity * 49;
}

function normalizeRefundAmount(rawAmount, remainingAmount) {
  const amount = rawAmount === undefined || rawAmount === null || rawAmount === ''
    ? remainingAmount
    : Number(rawAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new HttpsError('invalid-argument', 'Refund amount must be greater than zero.');
  }
  if (amount > remainingAmount + 0.0001) {
    throw new HttpsError('failed-precondition', 'Refund amount exceeds the remaining paid balance.');
  }
  return Math.round(amount * 100) / 100;
}

function invoiceNumberFor(orderId) {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `INV-${datePart}-${orderId.slice(0, 6).toUpperCase()}`;
}

function pdfEscape(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7E]/g, '?');
}

function buildSimpleInvoicePdfBuffer({ invoiceNumber, order, lineItems, amount, currency }) {
  const lines = [
    `Invoice ${invoiceNumber}`,
    `Order: ${order.orderNumber || order.id || ''}`,
    `Customer: ${order.customerName || 'Customer'}`,
    `Issued: ${new Date().toISOString().slice(0, 10)}`,
    '',
    'Items',
    ...lineItems.map((item) => (
      `${item.description} x${item.quantity} - ${currency} ${item.amount}`
    )),
    '',
    `Total: ${currency} ${amount}`,
    `Payment status: ${order.paymentStatus || 'paid'}`,
  ];
  const textOps = lines.flatMap((line, index) => {
    if (index === 0) return [`(${pdfEscape(line)}) Tj`];
    return ['T*', `(${pdfEscape(line)}) Tj`];
  });
  const stream = [
    'BT',
    '/F1 16 Tf',
    '50 750 Td',
    '18 TL',
    ...textOps,
    'ET',
  ].join('\n');

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    `5 0 obj\n<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream\nendobj\n`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += object;
  }
  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, 'utf8');
}

async function saveInvoicePdf(invoiceId, pdfBuffer) {
  const pdfPath = `invoices/${invoiceId}/invoice.pdf`;
  try {
    const bucket = admin.storage().bucket();
    const token = crypto.randomUUID();
    await bucket.file(pdfPath).save(pdfBuffer, {
      resumable: false,
      metadata: {
        contentType: 'application/pdf',
        cacheControl: 'private, max-age=0',
        metadata: {
          firebaseStorageDownloadTokens: token,
        },
      },
    });
    const encodedPath = encodeURIComponent(pdfPath);
    const pdfUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${token}`;
    return { pdfPath, pdfUrl, pdfError: null };
  } catch (error) {
    console.error('Invoice PDF save failed', error);
    return { pdfPath, pdfUrl: null, pdfError: 'storage_unavailable' };
  }
}

/**
 * Transaction: mark order paid + intent paid + publish card + notification.
 */
async function markOrderPaidInternal(orderId, intentId, providerRef) {
  const orderRef = db().doc(`${ORDERS}/${orderId}`);
  const intentRef = db().doc(`${INTENTS}/${intentId}`);

  await db().runTransaction(async (tx) => {
    const [orderSnap, intentSnap] = await Promise.all([tx.get(orderRef), tx.get(intentRef)]);
    if (!orderSnap.exists) throw new Error('Order not found.');
    if (!intentSnap.exists) throw new Error('Payment intent not found.');

    const order = orderSnap.data();
    if (order.paymentStatus === 'paid') return;

    const intent = intentSnap.data();
    if (intent.status === 'paid') return;
    if (intentExpired(intent)) {
      tx.update(intentRef, {
        status: 'expired',
        failureReason: 'Payment QR expired',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      throw new Error('Payment intent expired.');
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    tx.update(orderRef, {
      paymentStatus: 'paid',
      paymentIntentId: intentId,
      paymentReference: providerRef || order.paymentReference || '',
      paidAt: new Date().toISOString(),
      updatedAt: now,
    });
    tx.update(intentRef, {
      status: 'paid',
      providerRef: providerRef || '',
      paidAt: now,
      updatedAt: now,
    });
  });

  await publishGuestCard(orderId);
  const orderSnap = await db().doc(`${ORDERS}/${orderId}`).get();
  const order = orderSnap.data();
  const customerId = order.createdBy;
  await notifyUser(
    customerId,
    'Payment confirmed',
    `Order ${order.orderNumber || orderId} is paid. Production will begin after sales approval.`,
    `/guest-track-order?orderId=${encodeURIComponent(orderId)}`
  );
  if (order.assignedSalesman) {
    await notifyUser(
      order.assignedSalesman,
      'Payment received',
      `${order.customerName || 'Customer'} paid ${order.currency || 'KHR'} ${order.amount || ''}.`,
      `/order-detail/${orderId}`
    );
  }
}

exports.createPaymentIntent = onCall(
  { secrets: [paymentSandboxSecret], enforceAppCheck: shouldEnforceAppCheck() },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Sign in required.');
    }

    const actor = await getActor(request.auth);
    assertActiveActor(actor);

    const orderId = String(request.data?.orderId || '').trim();
    const methodId = String(request.data?.methodId || '').trim();
    if (!orderId || !methodId) {
      throw new HttpsError('invalid-argument', 'orderId and methodId are required.');
    }

    const orderRef = db().doc(`${ORDERS}/${orderId}`);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      throw new HttpsError('not-found', 'Order not found.');
    }
    const order = orderSnap.data();
    if (order.createdBy !== request.auth.uid) {
      throw new HttpsError('permission-denied', 'Not your order.');
    }
    if (order.paymentStatus === 'paid') {
      throw new HttpsError('failed-precondition', 'Order already paid.');
    }

    const amount = Number(order.amount ?? 0);
    const currency = order.currency === 'USD' ? 'USD' : 'KHR';
    const expiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 30 * 60 * 1000));

    const provider = process.env.PAYMENT_PROVIDER || 'sandbox';
    if (provider !== 'sandbox') {
      throw new HttpsError(
        'failed-precondition',
        'Production payment provider is not configured. Use sandbox mode or complete the merchant API integration.'
      );
    }

    const intentRef = db().collection(INTENTS).doc();
    const idem = idempotencyKey(orderId, methodId);
    const qrPayload = `SITEHUB|${intentRef.id}|${amount}|${currency}|${methodId}`;
    const abaDeeplink =
      methodId === 'aba' || methodId === 'aba_pay' ? `ababank://pay?ref=${intentRef.id}` : null;

    await intentRef.set({
      orderId,
      userId: request.auth.uid,
      methodId,
      amount,
      currency,
      status: 'pending',
      provider,
      providerRef: '',
      qrPayload,
      abaDeeplink,
      idempotencyKey: idem,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt,
    });

    await orderRef.update({
      paymentIntentId: intentRef.id,
      paymentMethod: methodId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      intentId: intentRef.id,
      qrPayload,
      abaDeeplink,
      expiresAt: expiresAt.toDate().toISOString(),
      status: 'pending',
    };
  }
);

async function resolveSandboxSecret() {
  let fromSecretManager = '';
  try {
    fromSecretManager = paymentSandboxSecret.value();
  } catch {
    fromSecretManager = '';
  }
  if (fromSecretManager) return fromSecretManager;

  const snap = await db().doc(PAYMENT_SECRETS_DOC).get();
  if (snap.exists) {
    const stored = String(snap.data().sandboxSecret ?? '').trim();
    if (stored) return stored;
  }

  return process.env.PAYMENT_SANDBOX_SECRET || '';
}

/** Super admin: create/rotate sandbox webhook secret stored in Firestore. */
exports.generatePaymentSandboxSecret = onCall(
  { enforceAppCheck: shouldEnforceAppCheck() },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Sign in required.');
    }
    const actor = await getActor(request.auth);
    assertActiveActor(actor);
    if (actor.role !== 'super_admin') {
      throw new HttpsError('permission-denied', 'Super admin only.');
    }

    const secret = crypto.randomBytes(32).toString('hex');
    const now = admin.firestore.FieldValue.serverTimestamp();
    await db().doc(PAYMENT_SECRETS_DOC).set(
      {
        sandboxSecret: secret,
        sandboxSecretRotatedAt: now,
        rotatedBy: request.auth.uid,
        updatedAt: now,
      },
      { merge: true }
    );

    return {
      sandboxSecret: secret,
      rotatedAt: new Date().toISOString(),
    };
  }
);

/** Dev/sandbox: POST { intentId, secret } to simulate bank confirmation. */
exports.paymentWebhookSandbox = onRequest(
  { secrets: [paymentSandboxSecret], cors: true },
  async (req, res) => {
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    if (req.method !== 'POST') {
      res.status(405).send('Method not allowed');
      return;
    }

    const secret = await resolveSandboxSecret();
    const bodySecret = String(req.body?.secret || req.get('x-payment-secret') || '');
    if (!secret || !timingSafeStringEqual(bodySecret, secret)) {
      res.status(403).json({ error: 'Invalid sandbox secret' });
      return;
    }

    try {
      await assertWebhookRateLimit(req, 'sandbox');
    } catch {
      res.status(429).json({ error: 'Too many requests' });
      return;
    }

    const intentId = String(req.body?.intentId || '').trim();
    if (!intentId) {
      res.status(400).json({ error: 'intentId required' });
      return;
    }

    const intentSnap = await db().doc(`${INTENTS}/${intentId}`).get();
    if (!intentSnap.exists) {
      res.status(404).json({ error: 'Intent not found' });
      return;
    }

    const intent = intentSnap.data();
    const providerRef = `SANDBOX-${crypto.randomBytes(6).toString('hex')}`;

    await db().collection(EVENTS).add({
      provider: 'sandbox',
      intentId,
      orderId: intent.orderId,
      providerRef,
      raw: req.body || {},
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    try {
      await markOrderPaidInternal(intent.orderId, intentId, providerRef);
      res.json({ ok: true, status: 'paid' });
    } catch (err) {
      const message = err.message || 'Failed';
      const status = message.includes('expired') ? 410 : 500;
      res.status(status).json({ error: message });
    }
  }
);

/** Production ABA webhook — verify HMAC then mark paid. */
exports.paymentWebhookAba = onRequest(
  { secrets: [abaWebhookSecret], cors: false },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method not allowed');
      return;
    }

    let secret = '';
    try {
      secret = abaWebhookSecret.value();
    } catch {
      secret = process.env.ABA_WEBHOOK_SECRET || '';
    }

    const signature = String(req.get('x-aba-signature') || '');
    const rawBody = JSON.stringify(req.body || {});
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    if (!secret || !timingSafeStringEqual(signature, expected)) {
      res.status(403).json({ error: 'Invalid signature' });
      return;
    }

    try {
      await assertWebhookRateLimit(req, 'aba');
    } catch {
      res.status(429).json({ error: 'Too many requests' });
      return;
    }

    const intentId = String(req.body?.intentId || req.body?.reference || '').trim();
    const providerRef = String(req.body?.transactionId || '').trim();
    if (!intentId) {
      res.status(400).json({ error: 'Missing reference' });
      return;
    }

    const intentSnap = await db().doc(`${INTENTS}/${intentId}`).get();
    if (!intentSnap.exists) {
      res.status(404).json({ error: 'Unknown intent' });
      return;
    }
    const intent = intentSnap.data();

    const eventId = providerRef || intentId;
    const dup = await db()
      .collection(EVENTS)
      .where('providerRef', '==', eventId)
      .limit(1)
      .get();
    if (!dup.empty) {
      res.json({ ok: true, duplicate: true });
      return;
    }

    await db().collection(EVENTS).add({
      provider: 'aba',
      intentId,
      orderId: intent.orderId,
      providerRef: eventId,
      raw: req.body,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await markOrderPaidInternal(intent.orderId, intentId, providerRef);
    res.json({ ok: true });
  }
);

exports.initiateRefund = onCall(
  { enforceAppCheck: shouldEnforceAppCheck() },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Sign in required.');
    }

    const orderId = String(request.data?.orderId || '').trim();
    const reason = String(request.data?.reason || '').trim();
    if (!orderId) {
      throw new HttpsError('invalid-argument', 'orderId is required.');
    }
    if (!reason) {
      throw new HttpsError('invalid-argument', 'Refund reason is required.');
    }

    const orderRef = db().doc(`${ORDERS}/${orderId}`);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      throw new HttpsError('not-found', 'Order not found.');
    }
    const order = { id: orderSnap.id, ...orderSnap.data() };
    const actor = await getActor(request.auth);
    assertFinanceAccess(actor, order);

    if (order.paymentStatus !== 'paid') {
      throw new HttpsError('failed-precondition', 'Only paid orders can be refunded.');
    }

    const orderAmount = getOrderAmount(order);
    const currency = order.currency === 'USD' ? 'USD' : 'KHR';
    const priorRefunds = await db().collection(REFUNDS).where('orderId', '==', orderId).get();
    const reservedAmount = priorRefunds.docs.reduce((sum, doc) => {
      const data = doc.data();
      if (data.status === 'failed' || data.status === 'cancelled') return sum;
      return sum + Number(data.amount ?? 0);
    }, 0);
    const remainingAmount = Math.max(0, Math.round((orderAmount - reservedAmount) * 100) / 100);
    if (remainingAmount <= 0) {
      throw new HttpsError('failed-precondition', 'This order has already been fully refunded.');
    }

    const amount = normalizeRefundAmount(request.data?.amount, remainingAmount);
    const provider = process.env.PAYMENT_PROVIDER || 'sandbox';
    const isSandbox = provider === 'sandbox';
    const status = isSandbox ? 'refunded' : 'processing';
    const providerRef = `${isSandbox ? 'SANDBOX-REFUND' : 'REFUND'}-${crypto.randomBytes(6).toString('hex')}`;
    const refundRef = db().collection(REFUNDS).doc();
    const eventRef = db().collection(EVENTS).doc();
    const now = admin.firestore.FieldValue.serverTimestamp();
    const nextReservedAmount = Math.round((reservedAmount + amount) * 100) / 100;
    const fullyRefunded = nextReservedAmount >= orderAmount - 0.0001;

    const batch = db().batch();
    batch.set(refundRef, {
      orderId,
      userId: order.createdBy || '',
      assignedSalesman: order.assignedSalesman || '',
      paymentIntentId: order.paymentIntentId || '',
      amount,
      currency,
      reason,
      status,
      provider,
      providerRef,
      createdBy: actor.uid,
      createdAt: now,
      updatedAt: now,
      refundedAt: isSandbox ? now : null,
    });
    batch.set(eventRef, {
      provider,
      type: 'refund',
      intentId: order.paymentIntentId || '',
      orderId,
      refundId: refundRef.id,
      providerRef,
      raw: { amount, currency, reason },
      createdAt: now,
    });
    batch.update(orderRef, {
      refundStatus: fullyRefunded ? status : 'partial',
      refundedAmount: nextReservedAmount,
      refundedAt: fullyRefunded && isSandbox ? now : order.refundedAt || null,
      updatedAt: now,
    });
    if (fullyRefunded && isSandbox && order.paymentIntentId) {
      batch.set(db().doc(`${INTENTS}/${order.paymentIntentId}`), {
        status: 'refunded',
        updatedAt: now,
      }, { merge: true });
    }
    await batch.commit();

    await notifyUser(
      order.createdBy,
      fullyRefunded ? 'Order refunded' : 'Partial refund processed',
      `Refund ${currency} ${amount} has been ${status} for order ${order.orderNumber || orderId}.`,
      `/order-receipt/${encodeURIComponent(orderId)}`
    );

    return {
      refundId: refundRef.id,
      amount,
      currency,
      status,
      fullyRefunded,
    };
  }
);

exports.generateInvoice = onCall(
  { enforceAppCheck: shouldEnforceAppCheck() },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Sign in required.');
    }

    const orderId = String(request.data?.orderId || '').trim();
    if (!orderId) {
      throw new HttpsError('invalid-argument', 'orderId is required.');
    }

    const orderRef = db().doc(`${ORDERS}/${orderId}`);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      throw new HttpsError('not-found', 'Order not found.');
    }
    const order = { id: orderSnap.id, ...orderSnap.data() };
    const actor = await getActor(request.auth);
    assertFinanceAccess(actor, order, { allowCustomer: true });

    if (order.paymentStatus !== 'paid') {
      throw new HttpsError('failed-precondition', 'Invoice can only be generated after payment is confirmed.');
    }

    const existing = await db().collection(INVOICES).where('orderId', '==', orderId).limit(1).get();
    if (!existing.empty) {
      const invoiceDoc = existing.docs[0];
      const invoice = invoiceDoc.data();
      return {
        invoiceId: invoiceDoc.id,
        invoiceNumber: invoice.invoiceNumber || '',
        pdfUrl: invoice.pdfUrl || null,
        status: invoice.status || 'issued',
      };
    }

    const invoiceRef = db().collection(INVOICES).doc();
    const amount = getOrderAmount(order);
    const currency = order.currency === 'USD' ? 'USD' : 'KHR';
    const quantity = Math.max(1, Number(order.quantity ?? 1));
    const lineItems = [
      {
        description: String(order.productType || 'NFC card').replace(/_/g, ' '),
        quantity,
        unitAmount: Math.round((amount / quantity) * 100) / 100,
        amount,
        currency,
      },
    ];
    const invoiceNumber = invoiceNumberFor(orderId);
    const pdfBuffer = buildSimpleInvoicePdfBuffer({ invoiceNumber, order, lineItems, amount, currency });
    const { pdfPath, pdfUrl, pdfError } = await saveInvoicePdf(invoiceRef.id, pdfBuffer);
    const now = admin.firestore.FieldValue.serverTimestamp();

    await db().runTransaction(async (tx) => {
      tx.set(invoiceRef, {
        orderId,
        userId: order.createdBy || '',
        assignedSalesman: order.assignedSalesman || '',
        invoiceNumber,
        lineItems,
        amount,
        currency,
        status: 'issued',
        pdfPath,
        pdfUrl,
        pdfError,
        issuedAt: now,
        createdAt: now,
        updatedAt: now,
        createdBy: actor.uid,
      });
      tx.update(orderRef, {
        invoiceId: invoiceRef.id,
        updatedAt: now,
      });
    });

    await notifyUser(
      order.createdBy,
      'Invoice ready',
      `Invoice ${invoiceNumber} is ready for order ${order.orderNumber || orderId}.`,
      `/order-receipt/${encodeURIComponent(orderId)}`
    );

    return {
      invoiceId: invoiceRef.id,
      invoiceNumber,
      pdfUrl,
      status: 'issued',
    };
  }
);
