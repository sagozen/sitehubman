const fs = require('fs');
const util = require('util');
const gracefulFs = require('graceful-fs');
gracefulFs.gracefulify(fs);

if (fs.promises) {
  if (gracefulFs.readFile) fs.promises.readFile = util.promisify(gracefulFs.readFile);
  if (gracefulFs.writeFile) fs.promises.writeFile = util.promisify(gracefulFs.writeFile);
  if (gracefulFs.open) fs.promises.open = util.promisify(gracefulFs.open);
  if (gracefulFs.stat) fs.promises.stat = util.promisify(gracefulFs.stat);
  if (gracefulFs.lstat) fs.promises.lstat = util.promisify(gracefulFs.lstat);
  if (gracefulFs.readdir) fs.promises.readdir = util.promisify(gracefulFs.readdir);
}

try {
  const { FileStore } = require('metro-cache');
  if (FileStore && FileStore.prototype) {
    const origGet = FileStore.prototype.get;
    const origSet = FileStore.prototype.set;
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    FileStore.prototype.get = async function patchedGet(...args) {
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          return await origGet.apply(this, args);
        } catch (err) {
          if (err && (err.code === 'EMFILE' || err.code === 'EBUSY')) {
            await sleep(50 * (attempt + 1));
            continue;
          }
          return null;
        }
      }
      return null;
    };

    FileStore.prototype.set = async function patchedSet(...args) {
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          return await origSet.apply(this, args);
        } catch (err) {
          if (err && (err.code === 'EMFILE' || err.code === 'EBUSY')) {
            await sleep(50 * (attempt + 1));
            continue;
          }
          return;
        }
      }
    };
  }
} catch (e) {
  // Ignore if metro-cache is unavailable
}

const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const projectRoot = escapeRegex(path.resolve(__dirname).replace(/\\/g, '/'));

// Block server-side node dependencies like pngjs that trigger EMFILE on Windows
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  qrcode: path.resolve(__dirname, 'node_modules/qrcode/lib/browser.js'),
};

config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList) ? config.resolver.blockList : []),
  new RegExp(`${projectRoot}/dist/`),
  new RegExp(`${projectRoot}/web-build/`),
  new RegExp(`${projectRoot}/legacy/`),
  new RegExp(`${projectRoot}/functions/node_modules/`),
  new RegExp(`${projectRoot}/print-bridge/node_modules/`),
  new RegExp(/node_modules[/\\]pngjs[/\\].*/),
];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'qrcode') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/qrcode/lib/browser.js'),
      type: 'sourceFile',
    };
  }
  if (moduleName === 'pngjs' || moduleName.endsWith('renderer/png.js') || moduleName.endsWith('renderer/png')) {
    return {
      filePath: path.resolve(__dirname, 'node_modules/qrcode/lib/renderer/svg-tag.js'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

config.maxWorkers = 2;
config.watcher = {
  ...config.watcher,
  healthCheck: { enabled: false },
};

module.exports = config;
