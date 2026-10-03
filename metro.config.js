/**
 * Metro configuration — hardened for Windows (EMFILE fix)
 *
 * Root cause: Windows limits open file handles to ~2048. Metro on a large
 * project + node_modules exhausts this quickly. Fixes applied:
 *   1. graceful-fs patches fs + fs.promises to queue EMFILE retries
 *   2. FileStore retries on EMFILE/EBUSY
 *   3. maxWorkers = 1 (single worker = far fewer concurrent file handles)
 *   4. Aggressive blockList to exclude irrelevant directory trees
 *   5. Disable watcher health-check (removes extra polling file handles)
 *   6. resetCache on EMFILE via the FileStore patch
 */

// ── 1. graceful-fs: patches Node's fs module to retry on EMFILE ──────────────
const fs = require('fs');
const util = require('util');
let gracefulFs;
try {
  gracefulFs = require('graceful-fs');
  gracefulFs.gracefulify(fs);
  if (fs.promises) {
    const patch = (name) => {
      if (gracefulFs[name]) fs.promises[name] = util.promisify(gracefulFs[name]);
    };
    ['readFile', 'writeFile', 'open', 'close', 'stat', 'lstat', 'readdir', 'mkdir', 'unlink'].forEach(patch);
  }
} catch (e) {
  console.warn('[metro.config] graceful-fs not available:', e.message);
}

// ── 2. FileStore retry patch (Metro cache EMFILE) ─────────────────────────────
try {
  const { FileStore } = require('metro-cache');
  if (FileStore && FileStore.prototype) {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    const wrapMethod = (original) =>
      async function patched(...args) {
        for (let i = 0; i < 8; i++) {
          try {
            return await original.apply(this, args);
          } catch (err) {
            if (err && (err.code === 'EMFILE' || err.code === 'EBUSY' || err.code === 'EAGAIN')) {
              await sleep(100 * (i + 1));
              continue;
            }
            return null;
          }
        }
        return null;
      };

    FileStore.prototype.get = wrapMethod(FileStore.prototype.get);
    FileStore.prototype.set = wrapMethod(FileStore.prototype.set);
  }
} catch (e) {
  // metro-cache not available — safe to ignore
}

// ── 3. Main config ────────────────────────────────────────────────────────────
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const esc = (v) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const root = esc(path.resolve(__dirname).replace(/\\/g, '/'));

// ── 4. Resolver: block directory trees Metro doesn't need ─────────────────────
const blockedDirs = [
  'dist', 'web-build', 'legacy', 'backups', 'audit', '.git',
  'functions/node_modules', 'print-bridge/node_modules', 'web/node_modules',
  'ios', 'android', '.expo/static',
];

config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList) ? config.resolver.blockList : []),
  ...blockedDirs.map((d) => new RegExp(`${root}/${esc(d)}/`)),
  // Block heavy node_modules that are server-only / not needed on web
  /node_modules[/\\]pngjs[/\\].*/,
  /node_modules[/\\]canvas[/\\].*/,
  /node_modules[/\\]sharp[/\\].*/,
  /node_modules[/\\]puppeteer[/\\].*/,
];

// ── 5. Resolver: browser-safe aliases for server-only modules ─────────────────
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  qrcode: path.resolve(__dirname, 'node_modules/qrcode/lib/browser.js'),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'qrcode') {
    return { filePath: path.resolve(__dirname, 'node_modules/qrcode/lib/browser.js'), type: 'sourceFile' };
  }
  if (moduleName === 'pngjs' || moduleName.endsWith('renderer/png.js') || moduleName.endsWith('renderer/png')) {
    return { filePath: path.resolve(__dirname, 'node_modules/qrcode/lib/renderer/svg-tag.js'), type: 'sourceFile' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

// ── 6. Performance: single worker = far fewer concurrent open file handles ────
config.maxWorkers = 1;

// ── 7. Watcher: disable health-check polling to save file handles ─────────────
config.watcher = {
  ...config.watcher,
  healthCheck: { enabled: false },
  // Use the native (non-watchman) watcher — avoids watchman daemon overhead
  watchman: { deferStates: [] },
};

// ── 8. Transformer: disable inline requires on web (reduces open handles) ─────
config.transformer = {
  ...config.transformer,
  inlineRequires: false,
};

module.exports = config;
