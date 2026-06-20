/**
 * Creates or upgrades the super admin account (default: theancoc69@gmail.com).
 *
 * Usage:
 *   node scripts/create-super-admin.mjs <password>
 *   SITEHUB_SUPER_ADMIN_PASSWORD=xxx node scripts/create-super-admin.mjs
 *
 * Sets Firestore users/{uid}.role = super_admin (required for payment sandbox secret UI).
 */
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  assertFirebaseScriptConfig,
  demoCredentials,
  firebaseConfig,
} from './firebaseScriptConfig.mjs';

assertFirebaseScriptConfig();

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const SUPER_ADMIN_EMAIL = demoCredentials.superAdminEmail;
const SUPER_ADMIN_PASSWORD = process.argv[2] || demoCredentials.superAdminPassword;

if (!SUPER_ADMIN_PASSWORD) {
  console.error('Usage: node scripts/create-super-admin.mjs <password>');
  console.error('Or set SITEHUB_SUPER_ADMIN_PASSWORD in .env');
  process.exit(1);
}

try {
  let uid;
  try {
    const cred = await createUserWithEmailAndPassword(auth, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD);
    uid = cred.user.uid;
    console.log('Created Firebase Auth account');
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      const cred = await signInWithEmailAndPassword(auth, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD);
      uid = cred.user.uid;
      console.log('Auth account already exists — upgrading Firestore profile…');
    } else throw err;
  }

  await setDoc(
    doc(db, 'users', uid),
    {
      email: SUPER_ADMIN_EMAIL,
      displayName: 'Thean (Super Admin)',
      role: 'super_admin',
      language: 'en',
      isActive: true,
      isGuest: false,
      branch: 'Head Office',
      phone: '',
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    },
    { merge: true }
  );

  console.log('\nSuper admin ready');
  console.log(`   Email: ${SUPER_ADMIN_EMAIL}`);
  console.log(`   UID:   ${uid}`);
  console.log('   Role:  super_admin');
  console.log('\nSign in to the app → Admin → Settings → Payment sandbox → Auto-generate secret');
} catch (err) {
  console.error('Failed:', err.message ?? err);
  process.exit(1);
}

process.exit(0);
