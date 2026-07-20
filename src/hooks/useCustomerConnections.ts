import { useCallback, useEffect, useState } from 'react';
import type { CustomerConnectionsData , SocialChannelId } from '@/src/features/customer/types/connections';
import {
  getCustomerConnectionsData,
  removeDeviceSession,
  saveChannelToggle,
  subscribeToCustomerConnections,
} from '@/src/services/customerConnectionsService';
import type { AppUser } from '@/src/types/models';

export function useCustomerConnections(user: AppUser | null | undefined) {
  const [data, setData] = useState<CustomerConnectionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setData(null);
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const next = await getCustomerConnectionsData(user);
      setData(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load connections.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { subscribe } = subscribeToCustomerConnections(user);
    
    const unsubscribe = subscribe((newData) => {
      setData(newData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const pullRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
  }, [refresh]);

  const toggleChannel = useCallback(
    async (channelId: SocialChannelId, enabled: boolean) => {
      if (!user?.id || !data) return;
      const nextHidden = await saveChannelToggle(user.id, channelId, enabled, data.hiddenChannels);
      setData((current) =>
        current
          ? {
              ...current,
              hiddenChannels: nextHidden,
              socialChannels: current.socialChannels.map((ch) =>
                ch.id === channelId ? { ...ch, enabled } : ch,
              ),
            }
          : current,
      );
    },
    [user?.id, data],
  );

  const revokeDevice = useCallback(async (sessionId: string) => {
    if (!user?.id) return;
    const nextDevices = await removeDeviceSession(sessionId);
    setData((current) => (current ? { ...current, devices: nextDevices } : current));
  }, [user?.id]);

  return {
    data,
    loading,
    error,
    refreshing,
    refresh: pullRefresh,
    toggleChannel,
    revokeDevice,
  };
}
