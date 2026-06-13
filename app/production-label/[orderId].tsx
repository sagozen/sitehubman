import { lazy, Suspense } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

const ProductionLabelScreen = lazy(() => import('@/src/features/production/ProductionLabelScreen'));

export default function ProductionLabelRoute() {
  return (
    <Suspense
      fallback={
        <View style={styles.fallback}>
          <ActivityIndicator />
        </View>
      }
    >
      <ProductionLabelScreen />
    </Suspense>
  );
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
