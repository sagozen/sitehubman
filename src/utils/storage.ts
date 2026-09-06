/**
 * storage.ts — MMKV-backed drop-in replacement for AsyncStorage.
 *
 * MMKV is ~30× faster than AsyncStorage (synchronous, C++ core).
 * This module exposes the same async API shape so all callers need
 * zero changes. Internally uses synchronous MMKV reads.
 */
import { MMKV } from 'react-native-mmkv';

export const mmkv = new MMKV({ id: 'avio-main-store' });

/** AsyncStorage-compatible wrapper — drop-in replacement. */
export const FastStorage = {
  getItem: (key: string): Promise<string | null> => {
    try {
      return Promise.resolve(mmkv.getString(key) ?? null);
    } catch {
      return Promise.resolve(null);
    }
  },

  setItem: (key: string, value: string): Promise<void> => {
    try {
      mmkv.set(key, value);
    } catch {}
    return Promise.resolve();
  },

  removeItem: (key: string): Promise<void> => {
    try {
      mmkv.delete(key);
    } catch {}
    return Promise.resolve();
  },

  /** Synchronous read — use where await is impractical. */
  getSync: (key: string): string | null => {
    try {
      return mmkv.getString(key) ?? null;
    } catch {
      return null;
    }
  },

  /** Synchronous write. */
  setSync: (key: string, value: string): void => {
    try {
      mmkv.set(key, value);
    } catch {}
  },

  clear: (): Promise<void> => {
    try {
      mmkv.clearAll();
    } catch {}
    return Promise.resolve();
  },
};
