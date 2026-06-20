import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function read(path) {
  return readFileSync(join(root, path), 'utf8');
}

const checks = [];

function check(name, ok, detail = '') {
  checks.push({ name, ok, detail });
}

const firestoreRules = read('firestore.rules');
const paymentFunctions = read('functions/payments.js');
const functionsIndex = read('functions/index.js');
const cloudinaryService = read('src/services/cloudinaryService.ts');
const qrSecurity = read('src/features/admin/qr/qrSecurity.ts');
const androidManifest = [
  read('android/app/src/main/AndroidManifest.xml'),
  read('android/app/src/debug/AndroidManifest.xml'),
  read('android/app/src/debugOptimized/AndroidManifest.xml'),
].join('\n');

const selfProfileUpdate = firestoreRules.match(/function validSelfProfileUpdate[\s\S]*?\n    }/);

check(
  'payment_secrets is not client-readable',
  /match \/app_config\/payment_secrets[\s\S]*?allow read, write: if false;/.test(firestoreRules)
);
check(
  'app_config wildcard excludes payment_secrets',
  /match \/app_config\/\{docId\}[\s\S]*?docId != 'payment_secrets'/.test(firestoreRules)
);
check(
  'self profile update cannot change role',
  Boolean(selfProfileUpdate) && !selfProfileUpdate[0].includes("'role'")
);
check(
  'self profile update cannot change active status',
  Boolean(selfProfileUpdate) && !selfProfileUpdate[0].includes("'isActive'")
);
check(
  'self user create allows optional createdBy',
  /validSelfUserCreate[\s\S]*!\('createdBy' in request\.resource\.data\)/.test(firestoreRules)
);
check(
  'guest card migration allows previousGuestId',
  /validGuestCardAccessMigration[\s\S]*'previousGuestId'/.test(firestoreRules)
);
check(
  'payment functions validate active actors',
  paymentFunctions.includes('assertActiveActor(actor)') && paymentFunctions.includes('assertFinanceAccess(actor, order')
);
check(
  'production payment mode fails closed without merchant integration',
  paymentFunctions.includes('Production payment provider is not configured')
);
check(
  'custom claims sync is deployed from functions',
  functionsIndex.includes('exports.syncUserAccessClaims')
);
check(
  'Cloudinary uploads validate folder and size',
  cloudinaryService.includes('MAX_UPLOAD_BYTES') && cloudinaryService.includes('normalizeCloudinaryFolder')
);
check(
  'QR signing has no hardcoded attendance secret',
  !qrSecurity.includes('ATTENDANCE_APP_SECRET') && !qrSecurity.includes('com.mahaka.attendance')
);
check(
  'Android manifest disables backup',
  androidManifest.includes('android:allowBackup="false"')
);
check(
  'Android manifest has no microphone or overlay permission',
  !androidManifest.includes('RECORD_AUDIO') && !androidManifest.includes('SYSTEM_ALERT_WINDOW')
);

let failures = 0;
for (const result of checks) {
  if (result.ok) {
    console.log(`PASS ${result.name}`);
  } else {
    failures += 1;
    console.error(`FAIL ${result.name}${result.detail ? ` - ${result.detail}` : ''}`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} security check(s) failed.`);
  process.exit(1);
}

console.log(`\n${checks.length} security checks passed.`);
