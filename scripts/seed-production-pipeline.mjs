/**
 * Production Telemetry Data Seeding Matrix
 * 
 * Target: Real-time orders and production queue telemetry streams
 * Compatible with: Local Firebase emulator, JS Client SDK & Admin SDK
 *
 * Usage:
 *   node scripts/seed-production-pipeline.mjs
 */

import { initializeApp as initializeClientApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  assertFirebaseScriptConfig,
  demoCredentials,
  firebaseConfig,
} from './firebaseScriptConfig.mjs';

// ==========================================
// ⚙️ INITIALIZATION CONTEXT
// ==========================================
if (process.env.FIRESTORE_EMULATOR_HOST) {
  console.log(`📡 Binding seeding script to local emulator host: ${process.env.FIRESTORE_EMULATOR_HOST}`);
}

assertFirebaseScriptConfig();

const clientApp = initializeClientApp(firebaseConfig);
const auth = getAuth(clientApp);
const db = getFirestore(clientApp);

const SEED_DATA = [
  {
    id: 'job_exec_001',
    orderNumber: 'ORD-EXEC-001',
    customerName: 'Alexander Vance',
    productType: 'matte_black_metal',
    quantity: 25,
    status: 'printing',
  },
  {
    id: 'job_luxe_002',
    orderNumber: 'ORD-LUXE-002',
    customerName: 'Elena Rostova',
    productType: 'card_luxury',
    quantity: 10,
    status: 'pending_print',
  },
  {
    id: 'job_gold_003',
    orderNumber: 'ORD-GOLD-003',
    customerName: 'Marcus Sterling',
    productType: 'gold_premium',
    quantity: 5,
    status: 'printed',
  },
  {
    id: 'job_eco_004',
    orderNumber: 'ORD-ECO-004',
    customerName: 'Sophia Lin',
    productType: 'bamboo_pvc',
    quantity: 100,
    status: 'printing',
  },
];

async function authenticateActor() {
  const attempts = [
    { email: demoCredentials.superAdminEmail, pass: demoCredentials.superAdminPassword || demoCredentials.password, role: 'Super Admin' },
    { email: 'super@demo.com', pass: demoCredentials.password, role: 'Super Demo' },
    { email: demoCredentials.adminEmail, pass: demoCredentials.password, role: 'Admin' },
    { email: demoCredentials.salesEmail, pass: demoCredentials.password, role: 'Sales' },
  ];

  for (const { email, pass, role } of attempts) {
    if (!email || !pass) continue;
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      console.log(`🔑 Authenticated as ${role} (${email}) - UID: ${cred.user.uid}`);
      return cred.user.uid;
    } catch {
      // try next credential
    }
  }

  throw new Error('Could not authenticate with any demo or admin credentials.');
}

async function seedProductionPipeline() {
  console.log('\n================================================================');
  console.log('⚡ INITIALIZING PRODUCTION TELEMETRY DATA SEEDING MATRIX');
  console.log('================================================================');

  const actorUid = await authenticateActor();
  const now = serverTimestamp();

  // 1. Seed the primary orders collection for the Factory Dashboard
  console.log('📦 Provisioning real-time orders records queue...');
  for (const job of SEED_DATA) {
    const docRef = doc(db, 'orders', job.id);
    await setDoc(
      docRef,
      {
        id: job.id,
        orderNumber: job.orderNumber,
        customerName: job.customerName,
        phone: '+855900112233',
        productType: job.productType,
        quantity: job.quantity,
        status: job.status,
        paymentStatus: 'paid',
        paymentMethod: 'online',
        cardDesign: 'classic_black',
        cardStatus: 'active',
        priority: 'urgent',
        assignedSalesman: actorUid,
        createdBy: actorUid,
        updatedBy: actorUid,
        updatedAt: now,
        createdAt: now,
      },
      { merge: true }
    );
    console.log(`  ✅ Seeded order: ${job.id} (${job.orderNumber}) [${job.status}]`);
  }

  // 2. Seed the production queue / printer jobs collection for QA Inspection Panel
  console.log('\n🔬 Provisioning automated hardware QA testing matrix documents...');
  for (let i = 0; i < SEED_DATA.length; i++) {
    const job = SEED_DATA[i];
    try {
      const printerJobRef = doc(db, 'printer_jobs', `job_gate_${job.id}`);
      await setDoc(
        printerJobRef,
        {
          id: `job_gate_${job.id}`,
          orderId: job.id,
          productType: job.productType,
          serialNumber: `SN-2026-${1000 + i}`,
          stage: job.status === 'printed' ? 'quality_check' : 'printing',
          status: 'ready_for_qa',
          surfaceCheck: i === 2 ? 'passed' : 'pending',
          nfcParity: i === 2 ? 'passed' : 'pending',
          updatedBy: actorUid,
          updatedAt: now,
          createdAt: now,
        },
        { merge: true }
      );
      console.log(`  ✅ Seeded printer_job: job_gate_${job.id}`);
    } catch (e) {
      console.log(`  ℹ️ printer_jobs notice: ${e.message || e}`);
    }

    try {
      const qaRef = doc(db, 'production_queue', `qa_gate_${job.id}`);
      await setDoc(
        qaRef,
        {
          id: `qa_gate_${job.id}`,
          productType: job.productType,
          serialNumber: `SN-2026-${1000 + i}`,
          surfaceCheck: i === 2 ? 'passed' : 'pending',
          nfcParity: i === 2 ? 'passed' : 'pending',
          status: 'ready_for_qa',
          updatedAt: now,
        },
        { merge: true }
      );
    } catch {
      // Optional collection for local emulator
    }
  }

  console.log('\n================================================================');
  console.log('🟢 SEEDING ENGINE LOGIC SUCCESSFULLY COMMITTED TO CLOUD STACK');
  console.log('================================================================\n');
}

seedProductionPipeline()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seeding transaction aborted due to execution anomaly:', err);
    process.exit(1);
  });
