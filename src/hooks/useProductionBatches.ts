import { useEffect, useState } from 'react';
import { subscribeProductionBatches } from '@/src/services/productionService';
import { ProductionBatch } from '@/src/types/models';
import { useAuth } from '@/src/hooks/useAuth';
import { getAuthErrorMessage } from '@/src/services/authService';

export function useProductionBatches() {
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const userId = user?.id;
  const userBranch = user?.branch;
  const isGuest = user?.isGuest;
  const userRole = user?.role;

  useEffect(() => {
    if (!userId || isGuest || userRole === 'guest' || userRole === 'customer') {
      setBatches([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = subscribeProductionBatches(
      userBranch,
      (next) => {
        setBatches(next);
        setIsLoading(false);
      },
      (err) => {
        setError(getAuthErrorMessage(err));
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [userId, userBranch, isGuest, userRole]);

  return { batches, isLoading, error };
}
