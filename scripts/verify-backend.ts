import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore,
  doc,
  addDoc,
  collection,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

// Need to mock react-native modules before importing app services
import 'module';
import Module from 'module';
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id) {
  if (id === 'react-native' || id === '@react-native-async-storage/async-storage') {
    return { Platform: { OS: 'web' } };
  }
  return originalRequire.apply(this, arguments as any);
};

import { cancelOrder } from '../src/services/salesOrderApprovalService';
import { verifyPayment } from '../src/services/paymentVerificationService';
import { reassignStaffOrders } from '../src/services/firestoreService';
import { firebaseConfig, demoCredentials } from './firebaseScriptConfig.mjs';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  console.log('--- STARTING VERIFICATION ---');

  let adminUid;
  let salesUid;

  try {
    // Sign in as admin
    const cred = await signInWithEmailAndPassword(auth, demoCredentials.adminEmail, demoCredentials.password);
    adminUid = cred.user.uid;
    console.log('✅ Admin Auth successful');

    // Create a dummy order
    const orderRef = await addDoc(collection(db, 'orders'), {
      customerName: `Test Cancel`,
      phone: '+855900111222',
      productType: 'pvc_card',
      quantity: 1,
      cardDesign: 'classic_black',
      status: 'new',
      cardStatus: 'active',
      paymentStatus: 'unpaid',
      assignedSalesman: adminUid,
      createdBy: adminUid,
      createdAt: serverTimestamp(),
    });
    console.log('✅ Dummy Order Created:', orderRef.id);

    // 1. Cancel Order Flow
    try {
      await cancelOrder(orderRef.id, adminUid);
      console.log('✅ Cancel Order Flow: SUCCESS');
    } catch (e: any) {
      console.error('❌ Cancel Order Flow: FAILED', e.message);
    }

    // 2. Payment Idempotency
    const payOrderRef = await addDoc(collection(db, 'orders'), {
      customerName: `Test Payment`,
      amount: 100,
      status: 'new',
      cardStatus: 'active',
      paymentStatus: 'unpaid',
      assignedSalesman: adminUid,
      createdBy: adminUid,
      createdAt: serverTimestamp(),
    });
    try {
      await verifyPayment(payOrderRef.id, 100, 'Test Note', adminUid);
      // second time should fail or return safely
      let secondFail = false;
      try {
        await verifyPayment(payOrderRef.id, 100, 'Test Note 2', adminUid);
      } catch (e) {
        secondFail = true;
      }
      if (secondFail) {
        console.log('✅ Payment Idempotency: SUCCESS (Double verify blocked)');
      } else {
        console.error('❌ Payment Idempotency: FAILED (Allowed double verify)');
      }
    } catch (e: any) {
      console.error('❌ Payment Idempotency: FAILED', e.message);
    }

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
    } catch (e: any) {
      if (e.message.includes('Missing or insufficient permissions') || e.message.includes('false for \'create\'')) {
        console.log('✅ Firestore Payload Validation: SUCCESS (Blocked negative amount)');
      } else {
        console.error('❌ Firestore Payload Validation: FAILED (Unexpected error)', e.message);
      }
    }

    // 4. Staff Reassignment
    try {
      await reassignStaffOrders(adminUid, 'test-sales-uid', adminUid);
      console.log('✅ Staff Reassignment: SUCCESS');
    } catch (e: any) {
      console.error('❌ Staff Reassignment: FAILED', e.message);
    }

  } catch (e: any) {
    console.error('Execution Error:', e);
  }

  process.exit(0);
}

run();
