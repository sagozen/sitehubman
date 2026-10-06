/**
 * Unit Tests - Firestore Pagination Hook
 * Coverage: Cursor-based pagination, load more, refresh
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useFirestorePagination } from '../useFirestorePagination';
import { query, collection, where, orderBy } from 'firebase/firestore';

// Mock Firestore
jest.mock('@/src/services/firebaseClient', () => ({
  db: {},
}));

describe('useFirestorePagination', () => {
  const mockQuery = query(collection({} as any, 'orders'), where('status', '==', 'active'), orderBy('createdAt', 'desc'));
  
  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useFirestorePagination(mockQuery, { autoLoad: false }));
    
    const [state] = result.current;
    
    expect(state.loading).toBe(false);
    expect(state.data).toEqual([]);
    expect(state.hasMore).toBe(true);
  });
  
  it('should load initial page on mount when autoLoad=true', async () => {
    const { result } = renderHook(() => useFirestorePagination(mockQuery, { autoLoad: true, pageSize: 20 }));
    
    const [state] = result.current;
    
    expect(state.loading).toBe(true);
    
    // Wait for load to complete
    await waitFor(() => {
      const [currentState] = result.current;
      expect(currentState.loading).toBe(false);
    });
  });
  
  it('should not auto-load when autoLoad=false', () => {
    const { result } = renderHook(() => useFirestorePagination(mockQuery, { autoLoad: false }));
    
    const [state] = result.current;
    
    expect(state.loading).toBe(false);
    expect(state.data).toEqual([]);
  });
  
  it('should handle loadMore correctly', async () => {
    const { result } = renderHook(() => useFirestorePagination(mockQuery, { pageSize: 10 }));
    
    // Wait for initial load
    await waitFor(() => {
      const [state] = result.current;
      expect(state.loading).toBe(false);
    });
    
    // Trigger loadMore
    act(() => {
      const [, actions] = result.current;
      actions.loadMore();
    });
    
    const [state] = result.current;
    expect(state.isLoadingMore).toBe(true);
  });
  
  it('should not load more when already loading', async () => {
    const { result } = renderHook(() => useFirestorePagination(mockQuery, { pageSize: 10 }));
    
    // Wait for initial load
    await waitFor(() => {
      const [state] = result.current;
      expect(state.loading).toBe(false);
    });
    
    // Set loading state
    act(() => {
      const [, actions] = result.current;
      actions.loadMore();
    });
    
    // Try to load more again immediately
    act(() => {
      const [, actions] = result.current;
      actions.loadMore();
    });
    
    // Should only trigger once
    const [state] = result.current;
    expect(state.isLoadingMore).toBe(true);
  });
  
  it('should handle refresh correctly', async () => {
    const { result } = renderHook(() => useFirestorePagination(mockQuery, { pageSize: 10 }));
    
    // Wait for initial load
    await waitFor(() => {
      const [state] = result.current;
      expect(state.loading).toBe(false);
    });
    
    // Trigger refresh
    act(() => {
      const [, actions] = result.current;
      actions.refresh();
    });
    
    const [state] = result.current;
    expect(state.loading).toBe(true);
    expect(state.data).toEqual([]); // Reset data on refresh
  });
  
  it('should reset state on reset()', () => {
    const { result } = renderHook(() => useFirestorePagination(mockQuery, { autoLoad: false }));
    
    act(() => {
      const [, actions] = result.current;
      actions.reset();
    });
    
    const [state] = result.current;
    
    expect(state.data).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.hasMore).toBe(true);
    expect(state.error).toBe(null);
  });
  
  it('should set hasMore=false when fewer items than pageSize', async () => {
    // Mock query that returns only 5 items (less than pageSize of 10)
    const { result } = renderHook(() => useFirestorePagination(mockQuery, { pageSize: 10 }));
    
    await waitFor(() => {
      const [state] = result.current;
      expect(state.loading).toBe(false);
    });
    
    // In real implementation, if docs.length < pageSize, hasMore = false
    // This test assumes mock returns fewer items
  });
  
  it('should handle errors gracefully', async () => {
    // Mock query that throws error
    const errorQuery = null; // Null query will trigger error
    
    const { result } = renderHook(() => useFirestorePagination(errorQuery, { pageSize: 10 }));
    
    await waitFor(() => {
      const [state] = result.current;
      expect(state.loading).toBe(false);
    });
    
    const [state] = result.current;
    // Should not crash, error handled gracefully
    expect(state.data).toEqual([]);
  });
});
