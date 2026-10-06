/**
 * Universal fs patch for Windows EMFILE / EBUSY limits.
 * Patches async (callback + promises) and sync (openSync, readFileSync, statSync) methods.
 */
const fs = require('fs');

// 1. Graceful async fs
try {
  const gracefulFs = require('graceful-fs');
  gracefulFs.gracefulify(fs);
} catch (e) {
  // ignore
}

// 2. Synchronous retry patch
function syncSleep(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {}
}

const origOpenSync = fs.openSync;
if (origOpenSync) {
  fs.openSync = function patchedOpenSync(...args) {
    for (let i = 0; i < 25; i++) {
      try {
        return origOpenSync.apply(this, args);
      } catch (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'EBUSY' || err.code === 'EAGAIN')) {
          syncSleep(30 * (i + 1));
          continue;
        }
        throw err;
      }
    }
    return origOpenSync.apply(this, args);
  };
}

const origStatSync = fs.statSync;
if (origStatSync) {
  fs.statSync = function patchedStatSync(...args) {
    for (let i = 0; i < 25; i++) {
      try {
        return origStatSync.apply(this, args);
      } catch (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'EBUSY' || err.code === 'EAGAIN')) {
          syncSleep(30 * (i + 1));
          continue;
        }
        throw err;
      }
    }
    return origStatSync.apply(this, args);
  };
}

// 3. Callback open retry
const origOpen = fs.open;
if (origOpen) {
  fs.open = function patchedOpen(...args) {
    const callback = args[args.length - 1];
    if (typeof callback !== 'function') return origOpen.apply(this, args);
    const retryCall = (attempt) => {
      origOpen.call(this, ...args.slice(0, -1), (err, fd) => {
        if (err && (err.code === 'EMFILE' || err.code === 'EBUSY' || err.code === 'EAGAIN') && attempt < 25) {
          setTimeout(() => retryCall(attempt + 1), 30 * (attempt + 1));
        } else {
          callback(err, fd);
        }
      });
    };
    retryCall(0);
  };
}

// 4. Promises open & readFile retry
if (fs.promises) {
  const origPromisesOpen = fs.promises.open;
  if (origPromisesOpen) {
    fs.promises.open = async function(...args) {
      for (let i = 0; i < 25; i++) {
        try {
          return await origPromisesOpen.apply(this, args);
        } catch (err) {
          if (err && (err.code === 'EMFILE' || err.code === 'EBUSY' || err.code === 'EAGAIN')) {
            await new Promise(r => setTimeout(r, 30 * (i + 1)));
            continue;
          }
          throw err;
        }
      }
      return origPromisesOpen.apply(this, args);
    };
  }

  const origPromisesReadFile = fs.promises.readFile;
  if (origPromisesReadFile) {
    fs.promises.readFile = async function(...args) {
      for (let i = 0; i < 25; i++) {
        try {
          return await origPromisesReadFile.apply(this, args);
        } catch (err) {
          if (err && (err.code === 'EMFILE' || err.code === 'EBUSY' || err.code === 'EAGAIN')) {
            await new Promise(r => setTimeout(r, 30 * (i + 1)));
            continue;
          }
          throw err;
        }
      }
      return origPromisesReadFile.apply(this, args);
    };
  }
}

console.log('[patch-fs] Universal EMFILE/EBUSY retry protection active (sync, callback, promises).');
