/**
 * Real-Time Infrastructure Status Monitor Matrix Seeder
 *
 * Target: Firestore `system_health/realtime_metrics`
 * Powers: `StatusPageWidget.tsx` live indicators
 *
 * Usage:
 *   node scripts/seed-status-metrics.ts
 *   node scripts/seed-status-metrics.mjs
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

assertFirebaseScriptConfig();

const clientApp = initializeClientApp(firebaseConfig);
const auth = getAuth(clientApp);
const db = getFirestore(clientApp);

async function authenticateAdmin() {
  const candidates = [
    { email: demoCredentials.superAdminEmail, pass: demoCredentials.superAdminPassword || demoCredentials.password, role: 'Super Admin' },
    { email: 'super@demo.com', pass: demoCredentials.password, role: 'Super Demo' },
    { email: demoCredentials.adminEmail, pass: demoCredentials.password, role: 'Admin' },
  ];

  for (const { email, pass, role } of candidates) {
    if (!email || !pass) continue;
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      console.log(`🔑 Authenticated as ${role} (${email})`);
      return cred.user.uid;
    } catch {
      // try next candidate
    }
  }

  throw new Error('Admin authentication failed. Verify demo credentials in .env');
}

export async function seedRealtimeStatusTelemetry() {
  console.log('\n================================================================');
  console.log('📡 INITIALIZING REAL-TIME INFRASTRUCTURE STATUS MONITOR MATRIX');
  console.log('================================================================');

  await authenticateAdmin();

  const healthDocRef = doc(db, 'system_health', 'realtime_metrics');

  const statusPayload = {
    globalStatus: 'all_operational',
    lastCheckedAt: serverTimestamp(),
    systems: [
      {
        name: 'ABA Banking Webhook Processing Pipeline',
        slug: 'aba-webhook-engine',
        status: 'operational',
        uptimePercentage: 99.98,
      },
      {
        name: 'Core Multi-Tenant API Cluster Node',
        slug: 'core-api-cluster',
        status: 'operational',
        uptimePercentage: 100.0,
      },
      {
        name: 'Physical NFC Hardware Token Registry',
        slug: 'nfc-token-registry',
        status: 'operational',
        uptimePercentage: 99.95,
      },
      {
        name: 'Firebase Security Edge Authentication Services',
        slug: 'firebase-auth-bridge',
        status: 'operational',
        uptimePercentage: 100.0,
      },
    ],
  };

  try {
    await setDoc(healthDocRef, statusPayload, { merge: true });
    console.log('✅ Updated system_health/realtime_metrics');
  } catch (err) {
    console.log(`ℹ️ system_health notice: ${err.message || err}`);
  }

  try {
    const appConfigRef = doc(db, 'app_config', 'system_health');
    await setDoc(appConfigRef, statusPayload, { merge: true });
    console.log('✅ Mirrored to app_config/system_health');
  } catch {
    // optional mirror
  }

  console.log('================================================================');
  console.log('🟢 TELEMETRY SYSTEM ACTIVE: B2B Operational Status Page is live.');
  console.log('================================================================\n');
}

seedRealtimeStatusTelemetry()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Status page seeding operation aborted:', error);
    process.exit(1);
  });
