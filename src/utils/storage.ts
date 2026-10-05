/**
 * storage.ts — MMKV-backed drop-in replacement for AsyncStorage.
 *
 * MMKV is ~30× faster than AsyncStorage (synchronous, C++ core).
 * This module exposes the same async API shape so all callers need
 * zero changes. Internally uses synchronous MMKV reads.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

let mmkvInstance: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { MMKV } = require('react-native-mmkv');
  mmkvInstance = new MMKV({ id: 'avio-main-store' });
} catch (e) {
  // Graceful fallback if native JSI MMKV is unavailable
  mmkvInstance = null;
}

export const mmkv = mmkvInstance;

const memoryStore = new Map<string, string>();

/** AsyncStorage-compatible wrapper — drop-in replacement. */
export const FastStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (mmkvInstance) {
        return mmkvInstance.getString(key) ?? null;
      }
      const memVal = memoryStore.get(key);
      if (memVal !== undefined) return memVal;
      const stored = await AsyncStorage.getItem(key);
      if (stored !== null) memoryStore.set(key, stored);
      return stored;
    } catch {
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      memoryStore.set(key, value);
      if (mmkvInstance) {
        mmkvInstance.set(key, value);
      }
      await AsyncStorage.setItem(key, value);
    } catch {}
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      memoryStore.delete(key);
      if (mmkvInstance) {
        mmkvInstance.delete(key);
      }
      await AsyncStorage.removeItem(key);
    } catch {}
  },

  /** Synchronous read — use where await is impractical. */
  getSync: (key: string): string | null => {
    try {
      if (mmkvInstance) {
        return mmkvInstance.getString(key) ?? null;
      }
      return memoryStore.get(key) ?? null;
    } catch {
      return null;
    }
  },

  /** Synchronous write. */
  setSync: (key: string, value: string): void => {
    try {
      memoryStore.set(key, value);
      if (mmkvInstance) {
        mmkvInstance.set(key, value);
      }
      AsyncStorage.setItem(key, value).catch(() => {});
    } catch {}
  },

  clear: async (): Promise<void> => {
    try {
      memoryStore.clear();
      if (mmkvInstance) {
        mmkvInstance.clearAll();
      }
      await AsyncStorage.clear();
    } catch {}
  },
};
