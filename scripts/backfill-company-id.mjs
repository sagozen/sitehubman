/**
 * Backfill companyId across existing SiteHub records.
 *
 * Dry run by default:
 *   npm run backfill:company-id -- --company-id sitehub-main
 *
 * Apply writes:
 *   npm run backfill:company-id -- --company-id sitehub-main --apply
 *
 * Requires Firebase Admin credentials:
 *   FIREBASE_SERVICE_ACCOUNT_JSON, GOOGLE_APPLICATION_CREDENTIALS, or ./firebase-service-account.json
 */
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { firebaseConfig } from './firebaseScriptConfig.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const requireFromFunctions = createRequire(join(ROOT, 'functions', 'package.json'));
const args = process.argv.slice(2);

function readArg(name, fallback = '') {
  const index = args.indexOf(name);
  if (index >= 0 && args[index + 1]) return args[index + 1].trim();
  return fallback;
}

function hasFlag(name) {
  return args.includes(name);
}

const APPLY = hasFlag('--apply');
const FORCE = hasFlag('--force');
const DEFAULT_COMPANY_ID = readArg('--company-id', process.env.SITEHUB_DEFAULT_COMPANY_ID || '');
const LIMIT = Number(readArg('--limit', '0'));

if (!DEFAULT_COMPANY_ID || !/^[a-zA-Z0-9_-]{2,64}$/.test(DEFAULT_COMPANY_ID)) {
  console.error('Missing or invalid company ID. Use: --company-id sitehub-main');
  process.exit(1);
}

function loadFirebaseAdmin() {
  try {
    return requireFromFunctions('firebase-admin');
  } catch {
    console.error('firebase-admin is missing. Run: cd functions && npm install');
    process.exit(1);
  }
}

function loadCredential(admin) {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (inline?.trim()) return admin.credential.cert(JSON.parse(inline));

  const explicitPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (explicitPath?.trim() && existsSync(explicitPath)) {
    return admin.credential.cert(JSON.parse(readFileSync(explicitPath, 'utf8')));
  }

  const localPath = join(ROOT, 'firebase-service-account.json');
  if (existsSync(localPath)) return admin.credential.cert(JSON.parse(readFileSync(localPath, 'utf8')));

  console.error(
    'No service account found. Set FIREBASE_SERVICE_ACCOUNT_JSON, GOOGLE_APPLICATION_CREDENTIALS, ' +
      'or save firebase-service-account.json in the project root.'
  );
  process.exit(1);
}

function initializeAdminApp() {
  const admin = loadFirebaseAdmin();
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: loadCredential(admin),
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
    });
  }
  return admin;
}

const admin = initializeAdminApp();
const db = admin.firestore();
const now = admin.firestore.FieldValue.serverTimestamp();
const userCompanyCache = new Map();
const orderCompanyCache = new Map();

function cleanCompanyId(value) {
  const companyId = String(value || '').trim();
  return /^[a-zA-Z0-9_-]{2,64}$/.test(companyId) ? companyId : '';
}

async function companyForUser(userId) {
  const uid = String(userId || '').trim();
  if (!uid) return '';
  if (userCompanyCache.has(uid)) return userCompanyCache.get(uid);

  const snap = await db.collection('users').doc(uid).get();
  const companyId = snap.exists ? cleanCompanyId(snap.data().companyId) : '';
  userCompanyCache.set(uid, companyId);
  return companyId;
}

async function companyForOrder(orderId) {
  const id = String(orderId || '').trim();
  if (!id) return '';
  if (orderCompanyCache.has(id)) return orderCompanyCache.get(id);

  const snap = await db.collection('orders').doc(id).get();
  if (!snap.exists) {
    orderCompanyCache.set(id, '');
    return '';
  }
  const data = snap.data();
  const companyId =
    cleanCompanyId(data.companyId) ||
    (await companyForUser(data.createdBy)) ||
    (await companyForUser(data.assignedSalesman));
  orderCompanyCache.set(id, companyId);
  return companyId;
}

async function deriveCompanyId(collectionName, data) {
  const existing = cleanCompanyId(data.companyId);
  if (existing && !FORCE) return existing;

  if (collectionName === 'orders') {
    return (await companyForUser(data.createdBy)) || (await companyForUser(data.assignedSalesman)) || DEFAULT_COMPANY_ID;
  }

  if (['printer_jobs', 'reprint_records', 'refunds', 'invoices', 'payment_intents', 'payment_events', 'nfc_cards'].includes(collectionName)) {
    return (await companyForOrder(data.orderId)) || (await companyForUser(data.createdBy)) || DEFAULT_COMPANY_ID;
  }

  if (collectionName === 'salary_records') {
    return (await companyForUser(data.printerId)) || DEFAULT_COMPANY_ID;
  }

  if (collectionName === 'payouts') {
    return (await companyForUser(data.userId)) || DEFAULT_COMPANY_ID;
  }

  return (
    (await companyForUser(data.userId)) ||
    (await companyForUser(data.createdBy)) ||
    (await companyForUser(data.updatedBy)) ||
    (await companyForUser(data.actorId)) ||
    DEFAULT_COMPANY_ID
  );
}

const COLLECTIONS = [
  'users',
  'orders',
  'production_batches',
  'printer_jobs',
  'reprint_records',
  'nfc_cards',
  'salary_records',
  'payouts',
  'refunds',
  'invoices',
  'payment_intents',
  'payment_events',
  'audit_logs',
  'cards',
  'guests',
  'profiles',
  'bio_pages',
];

async function commitBatch(batch, count) {
  if (!APPLY || count === 0) return;
  await batch.commit();
}

async function backfillCollection(collectionName) {
  const snap = LIMIT > 0
    ? await db.collection(collectionName).limit(LIMIT).get()
    : await db.collection(collectionName).get();
  let scanned = 0;
  let planned = 0;
  let batch = db.batch();
  let batchCount = 0;

  for (const doc of snap.docs) {
    scanned += 1;
    const data = doc.data() || {};
    const current = cleanCompanyId(data.companyId);
    if (current && !FORCE) continue;

    const companyId = await deriveCompanyId(collectionName, data);
    if (!companyId || (current === companyId && !FORCE)) continue;

    planned += 1;
    if (APPLY) {
      batch.set(
        doc.ref,
        {
          companyId,
          updatedAt: now,
          updatedBy: 'company-id-backfill',
        },
        { merge: true }
      );
      batchCount += 1;
      if (batchCount >= 400) {
        await commitBatch(batch, batchCount);
        batch = db.batch();
        batchCount = 0;
      }
    }
  }

  await commitBatch(batch, batchCount);
  console.log(`${collectionName}: scanned=${scanned} ${APPLY ? 'updated' : 'wouldUpdate'}=${planned}`);
  return { scanned, planned };
}

console.log(`SiteHub companyId backfill (${APPLY ? 'APPLY' : 'DRY RUN'})`);
console.log(`companyId=${DEFAULT_COMPANY_ID}${FORCE ? ' force=true' : ''}${LIMIT > 0 ? ` limit=${LIMIT}` : ''}\n`);

let totalScanned = 0;
let totalPlanned = 0;
for (const collectionName of COLLECTIONS) {
  const result = await backfillCollection(collectionName);
  totalScanned += result.scanned;
  totalPlanned += result.planned;
}

console.log(`\nDone. scanned=${totalScanned} ${APPLY ? 'updated' : 'wouldUpdate'}=${totalPlanned}`);
if (!APPLY) {
  console.log('Dry run only. Re-run with --apply to write companyId values.');
}
