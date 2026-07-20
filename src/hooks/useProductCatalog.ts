import { useCallback, useEffect, useState } from 'react';
import type { ProductCatalog } from '@/src/constants/productCatalogDefaults';
import {
  getProductCatalogSync,
  refreshProductCatalog,
  subscribeProductCatalog,
} from '@/src/services/productCatalogService';

export function useProductCatalog() {
  const [catalog, setCatalog] = useState<ProductCatalog>(() => getProductCatalogSync());
  const [loading, setLoading] = useState(!catalog.updatedAt);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setCatalog(await refreshProductCatalog());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    return subscribeProductCatalog(() => {
      setCatalog(getProductCatalogSync());
    });
  }, [reload]);

  return { catalog, loading, reload };
}
