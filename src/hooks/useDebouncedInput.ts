/**
 * Debounced Input Hook
 * 
 * Eliminates input lag by debouncing onChange handlers
 * Critical for 1M user performance
 */

import { useState, useCallback, useEffect, useRef } from 'react';

export function useDebouncedInput(
  initialValue: string,
  onDebouncedChange: (value: string) => void,
  delay = 300
): [string, (value: string) => void, string] {
  const [displayValue, setDisplayValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update display value immediately for responsive UI
  const handleChange = useCallback((value: string) => {
    setDisplayValue(value);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for debounced update
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
      onDebouncedChange(value);
    }, delay);
  }, [onDebouncedChange, delay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Sync with external changes
  useEffect(() => {
    if (initialValue !== debouncedValue) {
      setDisplayValue(initialValue);
      setDebouncedValue(initialValue);
    }
  }, [initialValue]);

  return [displayValue, handleChange, debouncedValue];
}

/**
 * Simpler debounce for callback functions
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay = 300
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]);
}
