import fs from 'fs';
import path from 'path';

const COMPILED_DIST_PATH = path.join(process.cwd(), 'dist');
const SOURCE_ASSETS_PATH = path.join(process.cwd(), 'assets');

const TARGET_ASSETS = [
  'assets/fonts/SF-Pro-Display-Regular.ttf',
  'assets/fonts/SF-Pro-Display-Bold.ttf',
  'assets/sounds/custom_payment_sound.wav',
  'assets/sounds/nfc_read.wav',
  'assets/sounds/success_pop.wav',
  'assets/sounds/nfc_error.wav',
];

function findAssetInDir(baseDir, targetRelPath) {
  // 1. Direct path check in compiled dist
  const directPath = path.join(baseDir, targetRelPath);
  if (fs.existsSync(directPath)) return directPath;

  // 2. Check alternative font extension (.otf vs .ttf)
  if (targetRelPath.endsWith('.ttf')) {
    const otfAlt = path.join(baseDir, targetRelPath.replace('.ttf', '.otf'));
    if (fs.existsSync(otfAlt)) return otfAlt;
  } else if (targetRelPath.endsWith('.otf')) {
    const ttfAlt = path.join(baseDir, targetRelPath.replace('.otf', '.ttf'));
    if (fs.existsSync(ttfAlt)) return ttfAlt;
  }

  // 3. Fallback search inside _expo or hashed assets folder
  const fileName = path.basename(targetRelPath);
  const baseName = fileName.replace(/\.(ttf|otf|wav|png|jpg)$/i, '');
  
  function scan(dir) {
    if (!fs.existsSync(dir)) return null;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const found = scan(full);
        if (found) return found;
      } else if (entry.name.includes(baseName) || entry.name === fileName) {
        return full;
      }
    }
    return null;
  }

  return scan(baseDir);
}

function runAssetValidationGate() {
  console.log('\n================================================================');
  console.log('📦 RUNNING NATIVE EXPO BUILD ASSET CHECKSUMS');
  console.log('================================================================');

  if (!fs.existsSync(COMPILED_DIST_PATH)) {
    console.error('❌ Compilation failure: "dist" folder not initialized. Run expo export first.');
    process.exit(1);
  }

  let failures = 0;

  TARGET_ASSETS.forEach((asset) => {
    // Check in compiled dist folder
    const resolvedPath = findAssetInDir(COMPILED_DIST_PATH, asset) || findAssetInDir(SOURCE_ASSETS_PATH, asset);

    if (!resolvedPath || !fs.existsSync(resolvedPath)) {
      console.error(`❌ Missing Structural Asset: [${asset}] was omitted from final build compilation.`);
      failures++;
      return;
    }

    const fileMeta = fs.statSync(resolvedPath);
    if (fileMeta.size === 0) {
      console.error(`❌ Empty Corrupt Asset Vector: [${asset}] compiled at 0 bytes capacity.`);
      failures++;
    } else {
      console.log(`✅ Asset Verified Safe: ${asset} (${(fileMeta.size / 1024).toFixed(2)} KB) -> ${path.relative(process.cwd(), resolvedPath)}`);
    }
  });

  console.log('================================================================');
  if (failures > 0) {
    console.error(`🔴 BUILD PIPELINE CANCELED: ${failures} bundle anomalies caught. Aborting upload.`);
    process.exit(1);
  } else {
    console.log('🟢 ASSET ENGINE COMPLIANT: All production assets compiled successfully.');
    console.log('================================================================\n');
  }
}

runAssetValidationGate();
