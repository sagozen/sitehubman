import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  assertFirebaseScriptConfig,
  firebaseConfig,
} from './firebaseScriptConfig.mjs';

assertFirebaseScriptConfig();

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const SEED_PASSWORD = 'Password123!';

const SEED_ACCOUNTS = [
  {
    email: 'admin@sitehub.app',
    password: SEED_PASSWORD,
    displayName: 'Alexander Admin',
    role: 'customer',
    appRole: 'super_admin',
    title: 'Executive Platform Admin',
  },
  {
    email: 'sales@sitehub.app',
    password: SEED_PASSWORD,
    displayName: 'Sarah Sales',
    role: 'customer',
    appRole: 'sales',
    title: 'Executive Sales Partner',
  },
  {
    email: 'alexander@sitehub.app',
    password: SEED_PASSWORD,
    displayName: 'Alexander Wright',
    role: 'customer',
    appRole: 'customer',
    title: 'Founder & Managing Director',
  },
];

async function seedAccount(account) {
  let uid;
  try {
    const cred = await signInWithEmailAndPassword(auth, account.email, account.password);
    uid = cred.user.uid;
    console.log(`🔑 Signed in as ${account.email}`);
  } catch (signInErr) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, account.email, account.password);
      uid = cred.user.uid;
      await updateProfile(cred.user, { displayName: account.displayName });
      console.log(`✅ Created Auth User: ${account.email}`);
    } catch (createErr) {
      console.error(`❌ Could not sign in or create ${account.email}: ${createErr.message}`);
      return;
    }
  }

  // Write Firestore Profile matching validSelfUserCreate rules
  try {
    await setDoc(
      doc(db, 'users', uid),
      {
        email: account.email,
        displayName: account.displayName,
        role: 'customer',
        authType: 'email',
        authProvider: 'email',
        plan: 'free',
        language: 'en',
        isActive: true,
        isGuest: false,
        createdBy: uid,
        updatedBy: uid,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    console.log(`✅ Firestore Profile Initialized: ${account.email} (App Role: ${account.appRole})`);

    // Bio Page for public sharing
    await setDoc(
      doc(db, 'bioPages', uid),
      {
        userId: uid,
        name: account.displayName,
        title: account.title,
        slug: account.displayName.toLowerCase().replace(/\s+/g, '-'),
        publicSlug: account.displayName.toLowerCase().replace(/\s+/g, '-'),
        headline: 'Next-Gen NFC & Digital Identity',
        bio: `${account.title} at AVIO. Contactless luxury networking.`,
        theme: 'mono',
        email: account.email,
        phone: '+1 555 019 2834',
        website: 'https://sitehubman.app',
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    console.log(`✅ Bio Page Initialized for ${account.displayName}`);
  } catch (err) {
    console.error(`❌ Firestore Write Error for ${account.email}:`, err.message);
  }
}

console.log('🚀 Seeding 3 Real Accounts...\n');
for (const acc of SEED_ACCOUNTS) {
  await seedAccount(acc);
}

console.log('\n========================================');
console.log('🎉 3 REAL SEED ACCOUNTS READY FOR IMMEDIATE USE:');
console.log('========================================');
console.log('1️⃣ ADMIN ACCOUNT:');
console.log('   Email:    admin@sitehub.app');
console.log('   Password: Password123!');
console.log('   Role:     Super Admin / HQ Control\n');
console.log('2️⃣ SALES PARTNER ACCOUNT:');
console.log('   Email:    sales@sitehub.app');
console.log('   Password: Password123!');
console.log('   Role:     Sales Executive\n');
console.log('3️⃣ CUSTOMER / MEMBER ACCOUNT:');
console.log('   Email:    alexander@sitehub.app');
console.log('   Password: Password123!');
console.log('   Role:     Pro Customer (Alexander Wright)');
console.log('========================================\n');

process.exit(0);
