// Run with: node scripts/create-test-batch-job.mjs
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, addDoc, collection, serverTimestamp, updateDoc } from 'firebase/firestore';
import { firebaseConfig, demoCredentials } from './firebaseScriptConfig.mjs';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const DEMO_PASSWORD = demoCredentials.password;

async function run() {
  try {
    console.log('🔑 Signing in as super@demo.com...');
    const cred = await signInWithEmailAndPassword(auth, 'super@demo.com', DEMO_PASSWORD);
    const uid = cred.user.uid;
    console.log(`✅ Signed in successfully. UID: ${uid}`);

    const batchNumber = `BATCH-${Math.floor(1000 + Math.random() * 9000)}`;
    console.log(`📦 Creating active production batch: ${batchNumber}...`);
    const batchRef = await addDoc(collection(db, 'production_batches'), {
      batchNumber,
      material: 'pvc_card',
      printerType: 'nfc_thermal',
      status: 'active',
      orderIds: [],
      branch: 'Head Office',
      createdBy: uid,
      updatedBy: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(`✅ Batch created with ID: ${batchRef.id}`);

    const cardCode = `BC-TEST-${Math.floor(100 + Math.random() * 900)}`;
    console.log(`📇 Creating user profile card: ${cardCode}...`);
    const cardRef = await addDoc(collection(db, 'cards'), {
      cardId: cardCode,
      cardCode,
      ownerId: uid,
      ownerType: 'customer',
      userId: uid,
      publicSlug: cardCode.toLowerCase(),
      publicProfileUrl: `https://sitehubman.vercel.app/p/${cardCode.toLowerCase()}`,
      status: 'locked',
      designLocked: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(`✅ Card created with ID: ${cardRef.id}`);

    const orderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    console.log(`🛒 Creating paid & approved order: ${orderNumber}...`);
    const orderRef = await addDoc(collection(db, 'orders'), {
      orderNumber,
      customerName: 'Test NFC Card User',
      phone: '+85512345678',
      productType: 'plastic_card',
      quantity: 1,
      cardDesign: 'classic_black',
      cardCode,
      cardId: cardCode,
      nfcEnabled: true,
      qrPrinted: true,
      paymentStatus: 'paid_verified',
      paymentMethod: 'aba_pay',
      status: 'printer_assigned',
      fulfillment: 'physical',
      salesApprovedAt: new Date().toISOString(),
      salesApprovedBy: uid,
      paymentVerifiedAt: new Date().toISOString(),
      paymentVerifiedBy: uid,
      batchId: batchRef.id,
      branch: 'Head Office',
      createdBy: uid,
      updatedBy: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(`✅ Order created with ID: ${orderRef.id}`);

    // Update batch to include the order ID
    await updateDoc(batchRef, {
      orderIds: [orderRef.id],
    });

    console.log('🖨️ Creating Printer Job...');
    const jobRef = await addDoc(collection(db, 'printer_jobs'), {
      orderId: orderRef.id,
      cardId: cardCode,
      batchId: batchRef.id,
      branch: 'Head Office',
      printerId: '',
      queueNumber: Date.now(),
      stage: 'received',
      cardsPrinted: 0,
      failedCards: 0,
      reprintedCards: 0,
      failedCardsApproved: false,
      perCardBonus: 0.5,
      perOrderBonus: 0,
      salaryStatus: 'unpaid',
      createdBy: uid,
      updatedBy: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(`✅ Printer Job created with ID: ${jobRef.id}`);

    console.log('\n🎉 Production batch and job successfully initialized!');
    console.log(`   Batch Number: ${batchNumber}`);
    console.log(`   Order Number: ${orderNumber}`);
    console.log(`   Card Code:    ${cardCode}`);
    console.log(`   Job ID:       ${jobRef.id}`);
    console.log('\n👉 Go back to the Printer app, select the new batch, and claim your job!');

  } catch (err) {
    console.error('❌ Failed to create batch and job:', err.message || err);
  }
  process.exit(0);
}

run();
