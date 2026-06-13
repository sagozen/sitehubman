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
  { email: ADMIN_EMAIL,         password: DEMO_PASSWORD, displayName: 'Demo Admin',    role: 'admin' },
  { email: 'super@demo.com',    password: DEMO_PASSWORD, displayName: 'Super Admin',   role: 'super_admin' },
];

async function createAccount({ email, password, displayName, role }) {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', credential.user.uid), {
      email,
      displayName,
      role,
      language: 'en',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(`✅ Created: ${email} (${role})`);
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      console.log(`⚠️  Already exists: ${email} — skipping`);
    } else {
      console.error(`❌ Failed ${email}:`, err.message);
    }
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
process.exit(0);
