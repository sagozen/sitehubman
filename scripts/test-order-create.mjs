import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { firebaseConfig, demoCredentials } from './firebaseScriptConfig.mjs';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const DEMO_PASSWORD = demoCredentials.password;

async function test() {
  try {
    console.log('Signing in as super@demo.com...');
    const cred = await signInWithEmailAndPassword(auth, 'super@demo.com', DEMO_PASSWORD);
    const uid = cred.user.uid;
    console.log(`Signed in successfully. UID: ${uid}`);

    console.log('Reading user document in Firestore...');
    const userSnap = await getDoc(doc(db, 'users', uid));
    if (userSnap.exists()) {
      console.log('User Document Data:', JSON.stringify(userSnap.data(), null, 2));
    } else {
      console.log('User Document does NOT exist in Firestore!');
    }

    const orderPayload = {
      customerName: 'Test Customer',
      phone: '+85512111222',
      productType: 'metal_card',
      quantity: 2,
      cardDesign: 'classic_black',
      cardCode: 'BC-TEST',
      profileUrl: 'https://biocloud.app/c/BC-TEST',
      nfcEnabled: true,
      qrPrinted: true,
      paymentStatus: 'unpaid',
      paymentMethod: 'later_manual',
      status: 'new',
      cardStatus: 'active',
      assignedSalesman: uid,
      createdBy: uid,
      updatedBy: uid,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    console.log('Attempting to create order in Firestore...');
    const ref = await addDoc(collection(db, 'orders'), orderPayload);
    console.log(`Success! Order created with ID: ${ref.id}`);
  } catch (err) {
    console.error('Test failed with error:', err);
  }
  process.exit(0);
}

test();
