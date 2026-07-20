import { ComponentType, lazy, Suspense } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

function TabFallback() {
  return (
    <View style={styles.fallback}>
      <ActivityIndicator />
    </View>
  );
}

/** Defer heavy screen modules until the route is first opened. */
export function lazyNamedScreen<T extends Record<string, ComponentType<object>>>(
  factory: () => Promise<T>,
  exportName: keyof T
) {
  const LazyComponent = lazy(() =>
    factory().then((module) => ({
      default: module[exportName] as ComponentType<object>,
    }))
  );

  return function LazyScreenRoute() {
    return (
      <Suspense fallback={<TabFallback />}>
        <LazyComponent />
      </Suspense>
    );
  };
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
