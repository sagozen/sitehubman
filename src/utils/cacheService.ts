import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Cache service for reducing redundant network calls and improving performance
 * Especially beneficial for users on slower networks worldwide
 */
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // time to live in milliseconds
}

class CacheService {
  private static instance: CacheService;

  private constructor() {}

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const itemJson = await AsyncStorage.getItem(`cache_${key}`);
      if (!itemJson) return null;

      const item: CacheItem<T> = JSON.parse(itemJson);
      const now = Date.now();

      if (now - item.timestamp > item.ttl) {
        await this.remove(key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.warn('Cache get error:', error);
      return null;
    }
  }

  async set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): Promise<void> {
    try {
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl
      };
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(item));
    } catch (error) {
      console.warn('Cache set error:', error);
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`cache_${key}`);
    } catch (error) {
      console.warn('Cache remove error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }
}

export const cacheService = CacheService.getInstance();