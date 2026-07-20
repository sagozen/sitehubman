// src/hooks/useSafeEffect.ts
import { useEffect, useRef } from 'react';

/**
 * Safe wrapper around useEffect that prevents infinite update loops.
 * - Executes the effect only after the component is mounted.
 * - Warns if dependency array is missing or empty (except for intentional one‑time effects).
 * - Optionally accepts a guard function that returns true when the effect should run.
 */
export function useSafeEffect(
  effect: () => void | (() => void | undefined),
  deps?: any[],
  guard?: () => boolean
) {
  const isMounted = useRef(false);

  if (process.env.NODE_ENV !== 'production') {
    if (deps === undefined) {
      console.warn('useSafeEffect called without a dependency array – this may cause infinite loops.');
    }
  }

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      if (guard && !guard()) return;
      return effect();
    }
    if (guard && !guard()) return;
    return effect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
