import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';

/**
 * Custom hook to measure component performance metrics
 * Returns an object with measurement functions and current metrics
 */
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const [isMeasuring, setIsMeasuring] = useState(false);

  /**
   * Measure time taken for a callback to execute
   * @param label - Identifier for this measurement
   * @param callback - Function to measure
   */
  const measure = useCallback(async <T>(
    label: string,
    callback: () => Promise<T> | T
  ): Promise<T> => {
    if (isMeasuring) return callback(); // Prevent nested measurements

    setIsMeasuring(true);
    const start = performance.now();

    try {
      const result = await callback();
      const end = performance.now();
      const duration = end - start;

      setMetrics(prev => ({
        ...prev,
        [label]: duration,
        [`${label}_timestamp]`]: Date.now()
      }));

      // Log to console for immediate feedback
      if (__DEV__) {
        console.log(`[PERF] ${label}: ${duration.toFixed(2)}ms`);
      }

      return result;
    } finally {
      setIsMeasuring(false);
    }
  }, [isMeasuring]);

  /**
   * Measure render time of a component (use in useEffect)
   * @param label - Identifier for this component
   */
  const measureRender = useCallback((label: string) => {
    useEffect(() => {
      const start = performance.now();

      return () => {
        const end = performance.now();
        const duration = end - start;

        setMetrics(prev => ({
          ...prev,
          [`${label}_render`]: duration,
          [`${label}_render_timestamp]`]: Date.now()
        }));

        if (__DEV__) {
          console.log(`[PERF] ${label} render: ${duration.toFixed(2)}ms`);
        }
      };
    }, [label]);
  }, []);

  /**
   * Get all current metrics
   */
  const getMetrics = useCallback(() => ({ ...metrics }), [metrics]);

  /**
   * Clear all metrics
   */
  const clearMetrics = useCallback(() => {
    setMetrics({});
  }, []);

  return {
    measure,
    measureRender,
    getMetrics,
    clearMetrics,
    isMeasuring
  };
};

/**
 * Higher-order component wrapper for automatic performance measurement
 * Usage: wrapComponentWithPerf(MyComponent, 'ScreenName')
 */
export const wrapComponentWithPerf = <P extends object>(
  Component: React.ComponentType<P>,
  label: string
) => {
  return (props: P) => {
    const { measureRender } = usePerformanceMonitor();
    measureRender(label);
    return require('react').createElement(Component, props);
  };
};

export default usePerformanceMonitor;