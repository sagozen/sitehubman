import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBioPage, upsertBioPage } from '@/src/services/firestoreService';
import { BioPage } from '@/src/types/models';
import { isGuestUser } from '@/src/utils/authFlow';
import { useAuth } from '@/src/hooks/useAuth';

const bioPageMemoryCache = new Map<string, { data: BioPage | null; timestamp: number }>();
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

export function useBioPage(userId: string) {
  const { user } = useAuth();
  const [bioPage, setBioPage] = useState<BioPage | null>(() => {
    if (!userId || userId === 'guest') return null;
    const cached = bioPageMemoryCache.get(userId);
    return cached ? cached.data : null;
  });
  const [isLoading, setIsLoading] = useState(!bioPage);

  const refresh = useCallback(async (forceNetwork = false) => {
    if (!userId || userId === 'guest') {
      setBioPage(null);
      setIsLoading(false);
      return;
    }

    const storageKey = `@sitehub_biopage_${userId}`;
    const now = Date.now();
    const memory = bioPageMemoryCache.get(userId);

    // 1. Check in-memory TTL cache first if not forced
    if (!forceNetwork && memory && (now - memory.timestamp < CACHE_TTL_MS)) {
      setBioPage(memory.data);
      setIsLoading(false);
      return;
    }

    // 2. Try loading from AsyncStorage instantly (Stale-While-Revalidate)
    if (!memory) {
      try {
        const localJson = await AsyncStorage.getItem(storageKey);
        if (localJson) {
          const parsed = JSON.parse(localJson) as BioPage;
          setBioPage(parsed);
          setIsLoading(false);
          bioPageMemoryCache.set(userId, { data: parsed, timestamp: now });
        }
      } catch {
        // Ignore local storage read errors
      }
    }

    // 3. Fetch fresh data from network
    try {
      const result = await getBioPage(userId);
      setBioPage(result);
      bioPageMemoryCache.set(userId, { data: result, timestamp: Date.now() });
      if (result) {
        AsyncStorage.setItem(storageKey, JSON.stringify(result)).catch(() => null);
      } else {
        AsyncStorage.removeItem(storageKey).catch(() => null);
      }
    } catch {
      // Retain stale data if network fetch fails
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveBioPage = useCallback(
    async (payload: Omit<BioPage, 'id' | 'userId' | 'updatedAt'>) => {
      if (isGuestUser(user)) {
        throw new Error('Guest accounts cannot save profiles. Create an account to continue.');
      }
      await upsertBioPage(userId, payload);
      // Force refresh on update
      await refresh(true);
    },
    [refresh, user, userId]
  );

  return { bioPage, isLoading, refresh, saveBioPage };
}
