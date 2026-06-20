import { useEffect, useState } from 'react';
import { getProductionStats } from '@/src/services/productionService';
import { ProductionStatsSnapshot } from '@/src/types/models';

export function useProductionStats() {
  const [stats, setStats] = useState<ProductionStatsSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    void getProductionStats()
      .then((data) => {
        if (mounted) setStats(data);
      })
      .catch(() => {
        // Permission denied or network error — leave stats null.
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { stats, isLoading };
}
