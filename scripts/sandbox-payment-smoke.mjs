/**
 * SiteHub sandbox payment smoke test.
 *
 * Modes (auto-selected unless flag is passed):
 *   --webhook       Client order + createPaymentIntent + HTTP paymentWebhookSandbox (recommended)
 *   --client-only   Rules only: unpaid create + block client "paid" write
 *   --admin         Local Admin SDK simulates webhook (needs service account JSON)
 *
 * Webhook mode (recommended — no service account):
 *   Super admin auto-generates secret in app_config/payment_secrets, or smoke test creates it.
 *   Deployed functions: npm run deploy:payments
 *
 * Admin mode:
 *   firebase-service-account.json in project root, or GOOGLE_APPLICATION_CREDENTIALS
 */

import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp as initializeClientApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  assertFirebaseScriptConfig,
  demoCredentials,
  firebaseConfig,
  scriptEnv,
} from './firebaseScriptConfig.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const requireFromFunctions = createRequire(join(ROOT, 'functions', 'package.json'));
const KEEP_DOCS = process.argv.includes('--keep');
const RUN_ID = Date.now().toString(36).toUpperCase();
const PAYMENT_METHOD = process.argv.includes('--aba') ? 'aba_pay' : 'khqr';

assertFirebaseScriptConfig();

const clientApp = initializeClientApp(firebaseConfig);
const auth = getAuth(clientApp);
const db = getFirestore(clientApp);

function logPass(name, detail = '') {
  console.log(`  OK  ${name}${detail ? ` - ${detail}` : ''}`);
}

function logInfo(message) {
  console.log(`  ->  ${message}`);
}

function logStep(message) {
  console.log(`\n${message}`);
}

function failAndExit(message) {
  console.error(`\nFAILED: ${message}\n`);
  process.exit(1);
}

function hasAdminCredentials() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()) return true;
  const explicit = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (explicit && existsSync(explicit)) return true;
  return existsSync(join(ROOT, 'firebase-service-account.json'));
}

function resolveMode() {
  if (process.argv.includes('--client-only')) return 'client';
  if (process.argv.includes('--admin')) return 'admin';
  if (process.argv.includes('--webhook')) return 'webhook';
  if (scriptEnv.paymentSandboxSecret) return 'webhook';
  if (hasAdminCredentials() && process.argv.includes('--admin-local')) return 'admin';
  return 'webhook';
}

function loadFirebaseAdmin() {
  try {
    return requireFromFunctions('firebase-admin');
  } catch {
    failAndExit('firebase-admin is missing. Run: cd functions && npm install');
  }
}

function loadAdminCredential(admin) {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (inline?.trim()) {
    return admin.credential.cert(JSON.parse(inline));
  }

  const explicitPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (explicitPath?.trim() && existsSync(explicitPath)) {
    return admin.credential.cert(JSON.parse(readFileSync(explicitPath, 'utf8')));
  }

  const localPath = join(ROOT, 'firebase-service-account.json');
  if (existsSync(localPath)) {
    return admin.credential.cert(JSON.parse(readFileSync(localPath, 'utf8')));
  }

  failAndExit(
    'No service account found.\n' +
      'Download a key from Firebase Console → Project settings → Service accounts → Generate new private key,\n' +
      'then save it as firebase-service-account.json in the project root (gitignored).\n' +
      'Or run webhook mode: set PAYMENT_SANDBOX_SECRET in .env and npm run deploy:payments'
  );
}

function initializeAdminApp() {
  const admin = loadFirebaseAdmin();
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: loadAdminCredential(admin),
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
    });
  }
  return admin;
}

function sandboxWebhookUrl() {
  if (scriptEnv.paymentWebhookUrl) return scriptEnv.paymentWebhookUrl;
  return `https://${scriptEnv.functionsRegion}-${firebaseConfig.projectId}.cloudfunctions.net/paymentWebhookSandbox`;
}

async function preflightAdminCredential() {
  const admin = initializeAdminApp();
  await admin.firestore().collection('app_config').doc('ops').get();
  logPass('Admin SDK credential ready');
}

async function resolveDefaultSalesUid() {
  const ops = await getDoc(doc(db, 'app_config', 'ops')).catch(() => null);
  const fromConfig = ops?.data()?.defaultSalesUid;
  if (typeof fromConfig === 'string' && fromConfig.trim()) return fromConfig.trim();

  const cred = await signInWithEmailAndPassword(
    auth,
    demoCredentials.salesEmail,
    demoCredentials.password
  );
  await signOut(auth);
  return cred.user.uid;
}

function cardCode() {
  return `PAY-${RUN_ID}`;
}

async function createCustomerOrder(salesUid) {
  let customer;
  try {
    customer = await signInWithEmailAndPassword(
      auth,
      demoCredentials.customerEmail,
      demoCredentials.password
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failAndExit(
      `Customer sign-in failed (${demoCredentials.customerEmail}). ${message}\n` +
        'Run: npm run seed:demo — or set SITEHUB_CUSTOMER_EMAIL / SITEHUB_DEMO_PASSWORD in .env'
    );
  }

  const uid = customer.user.uid;
  const code = cardCode();

  let orderRef;
  try {
    orderRef = await addDoc(collection(db, 'orders'), {
      orderNumber: `SANDBOX-${RUN_ID}`,
      orderSource: 'customer',
      customerName: `Sandbox Payment ${RUN_ID}`,
      phone: '+855900555000',
      email: demoCredentials.customerEmail,
      productType: 'pvc_card',
      quantity: 1,
      cardDesign: 'classic_black',
      cardCode: code,
      profileUrl: `https://biocloud.app/c/${code}`,
      status: 'new',
      cardStatus: 'active',
      paymentStatus: 'unpaid',
      paymentMethod: PAYMENT_METHOD,
      amount: 119000,
      currency: 'KHR',
      fulfillment: 'physical',
      nfcEnabled: true,
      qrPrinted: true,
      assignedSalesman: salesUid,
      createdBy: uid,
      updatedBy: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failAndExit(`Customer could not create order. ${message}\nCheck Firestore rules and assignedSalesman (${salesUid}).`);
  }

  logPass('Customer created unpaid order', orderRef.id);

  try {
    await updateDoc(orderRef, {
      paymentStatus: 'paid',
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    });
    failAndExit('Client was able to set paymentStatus=paid. Rules are unsafe.');
  } catch {
    logPass('Client paid update blocked by rules');
  }

  return { orderId: orderRef.id, customerUid: uid };
}

async function createPaymentIntentViaCallable(orderId) {
  const functions = getFunctions(clientApp, scriptEnv.functionsRegion);
  const callable = httpsCallable(functions, 'createPaymentIntent');
  try {
    const result = await callable({ orderId, methodId: PAYMENT_METHOD });
    const data = result.data ?? {};
    const intentId = String(data.intentId ?? '').trim();
    if (!intentId) throw new Error('Callable returned no intentId.');
    logPass('createPaymentIntent callable', intentId);
    return intentId;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failAndExit(
      `createPaymentIntent failed. ${message}\n` +
        'Deploy payment functions first:\n' +
        '  npm run deploy:payments\n' +
        'Then set PAYMENT_SANDBOX_SECRET in .env (same as Firebase secret).'
    );
  }
}

async function resolveSandboxSecretForTest() {
  if (scriptEnv.paymentSandboxSecret) {
    logPass('Using PAYMENT_SANDBOX_SECRET from .env');
    return scriptEnv.paymentSandboxSecret;
  }

  try {
    await signInWithEmailAndPassword(
      auth,
      demoCredentials.superAdminEmail,
      demoCredentials.superAdminPassword || demoCredentials.password
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failAndExit(
      `Super admin sign-in failed (${demoCredentials.superAdminEmail}). ${message}\n` +
        'Run: node scripts/create-super-admin.mjs <your-password>\n' +
        'Or set SITEHUB_SUPER_ADMIN_EMAIL / SITEHUB_SUPER_ADMIN_PASSWORD in .env'
    );
  }

  const secretsRef = doc(db, 'app_config', 'payment_secrets');
  let secret = '';
  try {
    const snap = await getDoc(secretsRef);
    secret = typeof snap.data()?.sandboxSecret === 'string' ? snap.data().sandboxSecret.trim() : '';
  } catch {
    logInfo('Sandbox secret is not client-readable; using super-admin callable.');
  }

  if (!secret) {
    logInfo('No sandbox secret in Firestore — auto-generating as super admin…');
    try {
      const functions = getFunctions(clientApp, scriptEnv.functionsRegion);
      const callable = httpsCallable(functions, 'generatePaymentSandboxSecret');
      const result = await callable();
      secret = String(result.data?.sandboxSecret ?? '').trim();
      if (secret) {
        logPass('Auto-generated sandbox secret via Cloud Function');
        return secret;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failAndExit(
        `Could not generate sandbox secret via Cloud Function. ${message}\n` +
          'Set PAYMENT_SANDBOX_SECRET in .env or deploy payment functions first:\n' +
          '  npm run deploy:payments'
      );
    }
  } else {
    logPass('Loaded sandbox secret from Firestore (super admin)');
  }

  return secret;
}

async function markPaidViaWebhook(intentId) {
  const secret = await resolveSandboxSecretForTest();
  const url = sandboxWebhookUrl();
  logInfo(`POST ${url}`);

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intentId, secret }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failAndExit(`Webhook request failed. ${message}\nURL: ${url}`);
  }

  const bodyText = await response.text();
  let body;
  try {
    body = bodyText ? JSON.parse(bodyText) : {};
  } catch {
    body = { raw: bodyText };
  }

  if (!response.ok) {
    failAndExit(
      `Webhook returned ${response.status}. ${JSON.stringify(body)}\n` +
        `URL: ${url}\n` +
        'Confirm functions are deployed and PAYMENT_SANDBOX_SECRET matches the Functions secret.'
    );
  }

  logPass('paymentWebhookSandbox confirmed payment', JSON.stringify(body));
  return { intentId, eventId: null };
}

async function markPaidWithAdmin({ orderId, customerUid }) {
  const admin = initializeAdminApp();
  const adminDb = admin.firestore();
  const now = admin.firestore.FieldValue.serverTimestamp();
  const providerRef = `LOCAL-SANDBOX-${randomBytes(5).toString('hex').toUpperCase()}`;
  const intentRef = adminDb.collection('payment_intents').doc();
  const eventRef = adminDb.collection('payment_events').doc();
  const orderRef = adminDb.collection('orders').doc(orderId);

  await adminDb.runTransaction(async (tx) => {
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists) throw new Error('Order missing before payment.');
    const order = orderSnap.data();

    tx.set(intentRef, {
      orderId,
      userId: customerUid,
      methodId: PAYMENT_METHOD,
      amount: Number(order.amount ?? 0),
      currency: order.currency === 'USD' ? 'USD' : 'KHR',
      status: 'paid',
      provider: 'sandbox-local',
      providerRef,
      qrPayload: `SITEHUB|${intentRef.id}|${order.amount ?? 0}|${order.currency ?? 'KHR'}|${PAYMENT_METHOD}`,
      abaDeeplink: PAYMENT_METHOD === 'aba_pay' ? `ababank://pay?ref=${intentRef.id}` : null,
      idempotencyKey: `${orderId}_${PAYMENT_METHOD}_${RUN_ID}`,
      createdAt: now,
      updatedAt: now,
      paidAt: now,
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 30 * 60 * 1000)),
    });

    tx.set(eventRef, {
      provider: 'sandbox-local',
      type: 'payment',
      intentId: intentRef.id,
      orderId,
      providerRef,
      raw: { runId: RUN_ID, local: true },
      createdAt: now,
    });

    tx.update(orderRef, {
      paymentStatus: 'paid',
      paymentIntentId: intentRef.id,
      paymentReference: providerRef,
      paidAt: new Date().toISOString(),
      updatedAt: now,
      updatedBy: 'sandbox-payment-smoke',
    });
  });

  logPass('Admin SDK marked order paid (local simulation)', providerRef);
  return { intentId: intentRef.id, eventId: eventRef.id };
}

async function verifyCustomerReads({ orderId, intentId }) {
  await signInWithEmailAndPassword(
    auth,
    demoCredentials.customerEmail,
    demoCredentials.password
  );

  const orderSnap = await getDoc(doc(db, 'orders', orderId));
  if (!orderSnap.exists()) throw new Error('Customer cannot read paid order.');
  if (orderSnap.data().paymentStatus !== 'paid') {
    throw new Error(`Expected paid order, got ${orderSnap.data().paymentStatus}`);
  }

  const intentSnap = await getDoc(doc(db, 'payment_intents', intentId));
  if (!intentSnap.exists()) throw new Error('Customer cannot read payment intent.');
  if (intentSnap.data().status !== 'paid') {
    throw new Error(`Expected paid intent, got ${intentSnap.data().status}`);
  }

  logPass('Customer reads paid order + paid intent', orderId);
}

async function cleanup(ids, mode) {
  if (KEEP_DOCS) {
    logInfo(`Kept order ${ids.orderId} and intent ${ids.intentId} for admin finance review.`);
    return;
  }

  if (mode !== 'admin' || !hasAdminCredentials()) {
    logInfo('Skipping cleanup (no service account). Re-run with --keep or add firebase-service-account.json.');
    return;
  }

  const admin = initializeAdminApp();
  const adminDb = admin.firestore();
  const deletes = [
    adminDb.collection('payment_intents').doc(ids.intentId).delete(),
    adminDb.collection('orders').doc(ids.orderId).delete(),
  ];
  if (ids.eventId) {
    deletes.push(adminDb.collection('payment_events').doc(ids.eventId).delete());
  }
  await Promise.allSettled(deletes);
  logPass('Cleaned sandbox payment docs');
}

function printSetupHelp(mode) {
  console.log('\nSetup help');
  console.log('==========');
  if (mode === 'client') {
    console.log('Client-only mode verified Firestore rules. For full payment E2E:');
    console.log('  1. npm run deploy:rules');
    console.log('  2. npm run deploy:payments');
    console.log('  3. Sign in as super admin → Admin Settings → Auto-generate sandbox secret');
    console.log('  4. npm run test:payment:sandbox');
  } else if (mode === 'webhook') {
    console.log('Webhook mode uses Cloud Functions + Firestore-managed sandbox secret.');
  } else {
    console.log('Admin mode uses firebase-service-account.json for local simulation.');
  }
}

async function main() {
  const mode = resolveMode();

  console.log('\nSiteHub sandbox payment smoke');
  console.log(`Run ID: ${RUN_ID}`);
  console.log(`Project: ${firebaseConfig.projectId}`);
  console.log(`Mode: ${mode}\n`);

  logStep('1. Resolve sales rep');
  const salesUid = await resolveDefaultSalesUid();
  logPass('Default sales rep', salesUid);

  logStep('2. Customer order + rules');
  const created = await createCustomerOrder(salesUid);

  if (mode === 'client') {
    printSetupHelp('client');
    console.log('\nClient-only sandbox payment smoke passed.\n');
    return;
  }

  if (mode === 'webhook' && !scriptEnv.paymentSandboxSecret) {
    logStep('3. Resolve sandbox secret (super admin / auto)');
    await resolveSandboxSecretForTest();
  }

  let paid;
  if (mode === 'webhook') {
    logStep('4. Payment intent (Cloud Function)');
    const intentId = await createPaymentIntentViaCallable(created.orderId);
    logStep('5. Sandbox webhook');
    paid = await markPaidViaWebhook(intentId);
  } else {
    logStep('3. Admin SDK payment simulation');
    await preflightAdminCredential();
    paid = await markPaidWithAdmin(created);
  }

  logStep('5. Customer verification');
  await verifyCustomerReads({ ...created, ...paid });
  await cleanup({ ...created, ...paid }, mode);

  printSetupHelp(mode);
  console.log('\nSandbox payment smoke passed.\n');
}

main().catch((error) => {
  failAndExit(error instanceof Error ? error.message : String(error));
});
