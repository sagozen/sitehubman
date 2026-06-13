import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore,
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';

import { firebaseConfig, demoCredentials } from './firebaseScriptConfig.mjs';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  console.log('--- STARTING VALIDATION VERIFICATION ---');

  let adminUid;

  try {
    const cred = await signInWithEmailAndPassword(auth, demoCredentials.adminEmail, demoCredentials.password);
    adminUid = cred.user.uid;
    console.log('✅ Admin Auth successful');

    // 3. Firestore Payload Validation
    try {
      await addDoc(collection(db, 'orders'), {
        customerName: `Test Negative Amount`,
        amount: -50, // Should be blocked
        status: 'new',
        paymentStatus: 'unpaid',
        assignedSalesman: adminUid,
        createdBy: adminUid,
        createdAt: serverTimestamp(),
      });
      console.error('❌ Firestore Payload Validation: FAILED (Allowed negative amount)');
    } catch (e) {
      if (e.message.includes('Missing or insufficient permissions') || e.message.includes('false for \'create\'')) {
        console.log('✅ Firestore Payload Validation: SUCCESS (Blocked negative amount)');
      } else {
        console.error('❌ Firestore Payload Validation: FAILED (Unexpected error)', e.message);
      }
    }

  } catch (e) {
    console.error('Execution Error:', e);
  }

  process.exit(0);
}

run();
