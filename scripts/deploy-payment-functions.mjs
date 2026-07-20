/**
 * Deploy payment Cloud Functions + print webhook URLs.
 * Usage: node scripts/deploy-payment-functions.mjs
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { firebaseConfig } from './firebaseScriptConfig.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const projectId = firebaseConfig.projectId;
const region = process.env.FIREBASE_FUNCTIONS_REGION || 'us-central1';

const functions = [
  'syncUserAccessClaims',
  'createPaymentIntent',
  'paymentWebhookSandbox',
  'paymentWebhookAba',
  'initiateRefund',
  'generateInvoice',
  'generatePaymentSandboxSecret',
];

console.log('\nDeploying SiteHub payment functions...\n');

const deploy = spawnSync(
  'npx',
  ['firebase', 'deploy', '--only', functions.map((name) => `functions:${name}`).join(',')],
  { cwd: root, stdio: 'inherit', shell: true }
);

if (deploy.status !== 0) {
  process.exit(deploy.status ?? 1);
}

console.log('\nPayment endpoints (after deploy):');
console.log(`  Sandbox webhook: https://${region}-${projectId}.cloudfunctions.net/paymentWebhookSandbox`);
console.log(`  ABA webhook:     https://${region}-${projectId}.cloudfunctions.net/paymentWebhookAba`);
console.log('\nSecrets to set once:');
console.log('  firebase functions:secrets:set PAYMENT_SANDBOX_SECRET');
console.log('  firebase functions:secrets:set ABA_WEBHOOK_SECRET');
console.log('\nOptional enforcement after App Check is configured on clients:');
console.log('  firebase functions:config:set app.check_enforced=true');
console.log('  (or set APP_CHECK_ENFORCED=true in Functions environment)\n');
