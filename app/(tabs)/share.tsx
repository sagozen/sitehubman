import { lazy, Suspense } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SeoHead } from '@/src/components/SeoHead';

const CustomerShareScreen = lazy(() =>
  import('@/src/features/customer/CustomerShareScreen').then((m) => ({
    default: m.CustomerShareScreen,
  }))
);

function TabFallback() {
  return (
    <View style={styles.fallback}>
      <ActivityIndicator color="#FFFFFF" />
    </View>
  );
}

export default function ShareTabRoute() {
  return (
    <>
      <SeoHead
        title="Share Your Card"
        description="Share your NFC digital business card via QR code, link, or NFC tap."
        noIndex
      />
      <Suspense fallback={<TabFallback />}>
        <CustomerShareScreen />
      </Suspense>
    </>
  );
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
});
