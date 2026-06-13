/**
 * Production gate for SiteHub.
 *
 * Static gate:
 *   node scripts/production-gate.mjs
 *
 * Full gate with Firebase E2E launch verification:
 *   node scripts/production-gate.mjs --full
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const npxBin = 'npx';
const npmBin = 'npm';
const full = process.argv.includes('--full');

const steps = [
  ['Security regression checks', npmBin, ['run', 'test:security:rules']],
  ['TypeScript', npmBin, ['run', 'typecheck']],
  ['Lint', npmBin, ['run', 'lint']],
  ['Firestore rules dry-run', npxBin, ['firebase', 'deploy', '--only', 'firestore:rules', '--dry-run']],
  ['High-severity production audit', npmBin, ['audit', '--omit=dev', '--audit-level=high']],
];

if (full) {
  steps.push(['Launch verification', npmBin, ['run', 'verify:launch']]);
}

function quoteForWindowsShell(value) {
  return `"${String(value).replace(/"/g, '\\"')}"`;
}

for (const [label, command, args] of steps) {
  console.log(`\n== ${label} ==`);
  const result = process.platform === 'win32'
    ? spawnSync(`${command} ${args.map(quoteForWindowsShell).join(' ')}`, {
      cwd: ROOT,
      stdio: 'inherit',
      shell: true,
    })
    : spawnSync(command, args, {
      cwd: ROOT,
      stdio: 'inherit',
    });
  if (result.error) {
    console.error(result.error.message);
  }
  if (result.status !== 0) {
    console.error(`\nProduction gate failed at: ${label}`);
    process.exit(result.status ?? 1);
  }
}

console.log(`\nProduction gate passed${full ? ' with launch verification' : ''}.`);
