/**
 * Sets app.json expo.owner to the current `eas whoami` username.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const appJsonPath = join(root, 'app.json');

const whoami = execSync('npx eas whoami', { encoding: 'utf8', cwd: root })
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean)
  .pop();

if (!whoami || whoami.includes('Not logged in')) {
  console.error('Not logged in to Expo. Run: npx eas login');
  process.exit(1);
}

const appJson = JSON.parse(readFileSync(appJsonPath, 'utf8'));
appJson.expo.owner = whoami;
writeFileSync(appJsonPath, `${JSON.stringify(appJson, null, 2)}\n`, 'utf8');
console.log(`Updated app.json expo.owner → ${whoami}`);
