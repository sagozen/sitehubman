import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  writeBatch,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import {
  assertFirebaseScriptConfig,
  demoCredentials,
  firebaseConfig,
} from './firebaseScriptConfig.mjs';

assertFirebaseScriptConfig();

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const NUM_ORDERS = 100;
const RUN_ID = `PERF-${Date.now().toString(36).toUpperCase()}`;

async function runPerformanceTest() {
  console.log(`🚀 Starting Performance Test for ${NUM_ORDERS} orders (Run ID: ${RUN_ID})`);

  // Sign in as admin to bypass rules
  await signInWithEmailAndPassword(auth, demoCredentials.adminEmail, demoCredentials.password);
  const adminUid = auth.currentUser.uid;
  console.log(`✅ Signed in as admin (${adminUid})`);

  // 1. Insert fake orders
  console.log(`\n⏳ Inserting ${NUM_ORDERS} fake orders...`);
  const ordersRef = collection(db, 'orders');
  const insertStart = Date.now();
  
  let batch = writeBatch(db);
  let opCount = 0;
  const insertedIds = [];

  for (let i = 0; i < NUM_ORDERS; i++) {
    const docRef = doc(ordersRef);
    insertedIds.push(docRef.id);
    batch.set(docRef, {
      customerName: `Perf Test ${i}`,
      cardCode: `${RUN_ID}-${i}`,
      status: i % 2 === 0 ? 'ready_to_print' : 'shipped',
      paymentStatus: 'paid',
      assignedSalesman: adminUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    opCount++;
    if (opCount === 500 || i === NUM_ORDERS - 1) {
      await batch.commit();
      batch = writeBatch(db);
      opCount = 0;
    }
  }
  const insertTime = Date.now() - insertStart;
  console.log(`✅ Inserted ${NUM_ORDERS} orders in ${insertTime}ms`);

  // 2. Query Test: Sales Assigned Orders
  console.log(`\n⏳ Querying orders by assignedSalesman...`);
  const qSalesStart = Date.now();
  try {
    const qSales = query(ordersRef, where('assignedSalesman', '==', adminUid), limit(50));
    const snap = await getDocs(qSales);
    const qSalesTime = Date.now() - qSalesStart;
    console.log(`✅ Found ${snap.size} orders in ${qSalesTime}ms`);
  } catch (err) {
    console.error('❌ Query failed (Missing Index?):', err.message);
  }

  // 3. Query Test: Filter by status + sort by createdAt
  console.log(`\n⏳ Querying ready_to_print orders sorted by createdAt...`);
  const qStatusStart = Date.now();
  try {
    const qStatus = query(
      ordersRef,
      where('status', '==', 'ready_to_print'),
      orderBy('createdAt', 'asc'),
      limit(50)
    );
    const snap = await getDocs(qStatus);
    const qStatusTime = Date.now() - qStatusStart;
    console.log(`✅ Found ${snap.size} orders in ${qStatusTime}ms`);
  } catch (err) {
    console.error('❌ Query failed (Missing Index?):', err.message);
  }

  // 4. Cleanup
  console.log(`\n⏳ Cleaning up ${insertedIds.length} orders...`);
  let cleanBatch = writeBatch(db);
  let cleanOpCount = 0;
  
  for (let i = 0; i < insertedIds.length; i++) {
    cleanBatch.delete(doc(db, 'orders', insertedIds[i]));
    cleanOpCount++;
    if (cleanOpCount === 500 || i === insertedIds.length - 1) {
      await cleanBatch.commit();
      cleanBatch = writeBatch(db);
      cleanOpCount = 0;
    }
  }
  console.log(`✅ Cleanup complete`);

  process.exit(0);
}

runPerformanceTest().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
