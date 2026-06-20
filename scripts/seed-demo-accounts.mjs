// Run with: node scripts/seed-demo-accounts.mjs
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  assertFirebaseScriptConfig,
  demoCredentials,
  firebaseConfig,
} from './firebaseScriptConfig.mjs';

assertFirebaseScriptConfig();
const DEMO_PASSWORD = demoCredentials.password;
const ADMIN_EMAIL = demoCredentials.adminEmail;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const demoAccounts = [
  { email: 'sales@demo.com',    password: DEMO_PASSWORD, displayName: 'Demo Sales',    role: 'sales' },
  { email: 'printer@demo.com',  password: DEMO_PASSWORD, displayName: 'Demo Printer',  role: 'printer' },
  { email: 'customer@demo.com', password: DEMO_PASSWORD, displayName: 'Demo Customer', role: 'customer' },
  { email: 'finance@demo.com',   password: DEMO_PASSWORD, displayName: 'Demo Finance',  role: 'finance' },
  { email: ADMIN_EMAIL,         password: DEMO_PASSWORD, displayName: 'Demo Admin',    role: 'admin' },
  { email: 'super@demo.com',    password: DEMO_PASSWORD, displayName: 'Super Admin',   role: 'super_admin' },
  { email: 'sales@gmail.com',   password: 'sales1234',   displayName: 'Gmail Sales',    role: 'sales' },
  { email: 'printer@gmail.com', password: 'printer1234', displayName: 'Gmail Printer',  role: 'printer' },
];

async function createAccount({ email, password, displayName, role }) {
  let uid;
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    uid = credential.user.uid;
    console.log(`Created Auth user: ${email}`);
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      try {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        uid = credential.user.uid;
        console.log(`⚠️  Auth user already exists: ${email}`);
      } catch (signInErr) {
        console.error(`❌ Failed Auth sign-in for existing user ${email}:`, signInErr.message);
        return;
      }
    } else {
      console.error(`❌ Failed Auth creation for ${email}:`, err.message);
      return;
    }
  }

  // Sign in as super@demo.com to gain permissions to write Firestore profile roles
  try {
    await signInWithEmailAndPassword(auth, 'super@demo.com', DEMO_PASSWORD);
  } catch (superErr) {
    console.error(`❌ Failed to sign in as super@demo.com to seed ${email}:`, superErr.message);
    return;
  }

  try {
    await setDoc(doc(db, 'users', uid), {
      email,
      displayName,
      role,
      language: 'en',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(`✅ Seeded Firestore Profile: ${email} (${role})`);
  } catch (err) {
    console.error(`❌ Failed to write Firestore profile for ${email}:`, err.message);
  }
}

console.log('Creating demo accounts...\n');
for (const account of demoAccounts) {
  await createAccount(account);
}

console.log('\nDone! Credentials:');
console.log(`  sales@demo.com    / ${DEMO_PASSWORD}  (Sales role)`);
console.log(`  printer@demo.com  / ${DEMO_PASSWORD}  (Printer role)`);
console.log(`  customer@demo.com / ${DEMO_PASSWORD}  (Customer role)`);
console.log(`  ${ADMIN_EMAIL}    / ${DEMO_PASSWORD}  (Admin role)`);
console.log(`  super@demo.com    / ${DEMO_PASSWORD}  (Super Admin role)`);
console.log(`  sales@gmail.com   / sales1234  (Gmail Sales role)`);
console.log(`  printer@gmail.com / printer1234  (Gmail Printer role)`);
process.exit(0);
