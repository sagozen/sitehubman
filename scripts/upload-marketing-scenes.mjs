#!/usr/bin/env node
/**
 * Lists marketing scene assets for Cloudinary upload.
 * Drop AI-generated PNGs into assets/images/marketing/{filename}, then upload:
 *
 *   node scripts/upload-marketing-scenes.mjs
 *
 * Requires CLOUDINARY_URL or EXPO_PUBLIC_CLOUDINARY_* in .env (same as app).
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const marketingDir = join(root, 'assets', 'images', 'marketing');

const SCENES = [
  { id: 'splash', filename: 'splash.png', placement: 'App launch' },
  { id: 'welcome', filename: 'welcome.png', placement: 'First app open' },
  { id: 'create-profile', filename: 'create-profile.png', placement: 'Create My Card' },
  { id: 'design-card', filename: 'design-card.png', placement: 'Card designer' },
  { id: 'nfc-tap-demo', filename: 'nfc-tap-demo.png', placement: 'NFC feature page' },
  { id: 'qr-nfc-benefits', filename: 'qr-nfc-benefits.png', placement: 'Benefits section' },
  { id: 'business-use-case', filename: 'business-use-case.png', placement: 'Landing page' },
  { id: 'team-enterprise', filename: 'team-enterprise.png', placement: 'Enterprise' },
  { id: 'production-tracking', filename: 'production-tracking.png', placement: 'Order status' },
  { id: 'shipping-success', filename: 'shipping-success.png', placement: 'Order complete' },
  { id: 'profile-preview', filename: 'profile-preview.png', placement: 'Preview screen' },
  { id: 'analytics-dashboard', filename: 'analytics-dashboard.png', placement: 'Analytics' },
  { id: 'verification', filename: 'verification.png', placement: 'Verify NFC' },
  { id: 'premium-membership', filename: 'premium-membership.png', placement: 'Upgrade' },
  { id: 'hero-home', filename: 'hero-home.png', placement: 'Homepage hero' },
];

const catalogPath = join(root, 'src', 'constants', 'marketingScenes.ts');
const catalogSource = readFileSync(catalogPath, 'utf8');

console.log('Snap Tap marketing scenes — upload checklist\n');
for (const scene of SCENES) {
  const localPath = join(marketingDir, scene.filename);
  const exists = existsSync(localPath);
  const promptMatch = catalogSource.match(
    new RegExp(`id: '${scene.id}'[\\s\\S]*?prompt:\\s*\\n\\s*'([^']+)'`)
  );
  const prompt = promptMatch?.[1] ?? '(see marketingScenes.ts)';
  const publicId = `sitehub/marketing/${scene.id}`;

  console.log(`── ${scene.id}`);
  console.log(`   Placement: ${scene.placement}`);
  console.log(`   Local:     ${exists ? '✓' : '✗'} assets/images/marketing/${scene.filename}`);
  console.log(`   Cloudinary public_id: ${publicId}`);
  console.log(`   Prompt: ${prompt.slice(0, 120)}${prompt.length > 120 ? '…' : ''}`);
  console.log('');
}

console.log('Replace placeholder PNGs with final AI art, then upload each file to Cloudinary.');
console.log('The app prefers bundled assets — Cloudinary is optional CDN fallback.');
