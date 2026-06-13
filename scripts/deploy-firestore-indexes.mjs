/**
 * Deploy firestore.indexes.json to Firebase.
 *
 * Auth (first match wins):
 *   1. FIREBASE_TOKEN — CI token from `firebase login:ci`
 *   2. GOOGLE_APPLICATION_CREDENTIALS — path to service account JSON
 *   3. ./firebase-service-account.json in project root
 *   4. Firebase CLI login (`firebase login:list` shows an account)
 *
 * Manual fallback:
 *   https://console.firebase.google.com/project/sitehub-8dd56/firestore/indexes
 */

import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const projectId = 'sitehub-8dd56';
const npxBin = process.platform === 'win32' ? 'npx.cmd' : 'npx';

function serviceAccountPath() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS && existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    return process.env.GOOGLE_APPLICATION_CREDENTIALS;
  }
  const local = join(root, 'firebase-service-account.json');
  if (existsSync(local)) return local;
  return null;
}

function deployViaFirebaseCli(extraArgs = []) {
  const result = spawnSync(
    npxBin,
    ['firebase', 'deploy', '--only', 'firestore:indexes', '--project', projectId, ...extraArgs],
    { cwd: root, stdio: 'inherit' }
  );
  if (result.status !== 0) {
    throw new Error('firebase deploy --only firestore:indexes failed');
  }
  console.log('✅ Firestore indexes deployed');
}

function main() {
  console.log(`Deploying firestore.indexes.json → ${projectId}`);

  if (process.env.FIREBASE_TOKEN) {
    deployViaFirebaseCli(['--token', process.env.FIREBASE_TOKEN]);
    return;
  }

  if (serviceAccountPath()) {
    deployViaFirebaseCli();
    return;
  }

  const cliLogin = spawnSync(npxBin, ['firebase', 'login:list'], { cwd: root, encoding: 'utf8' });
  if (cliLogin.stdout?.includes('@')) {
    deployViaFirebaseCli();
    return;
  }

  console.error(`
Could not deploy indexes — no Firebase credentials found.

Option A — Firebase CLI (one-time):
  npx firebase login
  npm run deploy:indexes

Option B — CI token:
  npx firebase login:ci
  set FIREBASE_TOKEN=<token>   (PowerShell: $env:FIREBASE_TOKEN="<token>")
  npm run deploy:indexes

Option C — Service account:
  Save firebase-service-account.json in project root (gitignored)
  npm run deploy:indexes

Option D — Manual:
  https://console.firebase.google.com/project/${projectId}/firestore/indexes
  Import firestore.indexes.json from this repo
`);
  process.exit(1);
}

try {
  main();
} catch (err) {
  console.error('Deploy failed:', err.message ?? err);
  process.exit(1);
}
