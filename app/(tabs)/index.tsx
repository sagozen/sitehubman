import { lazy, Suspense } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

const HomeScreen = lazy(() =>
  import('@/src/features/home/HomeScreen').then((m) => ({ default: m.HomeScreen }))
);

function TabFallback() {
  return (
    <View style={styles.fallback}>
      <ActivityIndicator />
    </View>
  );
}

export default function HomeTabRoute() {
  return (
    <Suspense fallback={<TabFallback />}>
      <HomeScreen />
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
