import { Tabs, useRouter, useSegments } from 'expo-router';
import { useMemo } from 'react';
import { PanResponder, View, StyleSheet } from 'react-native';
import { AuthGate } from '@/src/components/AuthGate';
import { LiquidTabBar } from '@/src/components/LiquidTabBar';

const CONSUMER_TABS = ['index', 'connections', 'share', 'profile', 'settings'];

export default function TabsLayout() {
  const router = useRouter();
  const segments = useSegments();

  // Determine current active tab
  const currentTab = segments[segments.length - 1] || 'index';

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          const { dx, dy } = gestureState;
          return Math.abs(dx) > 40 && Math.abs(dy) < 20;
        },
        onPanResponderRelease: (_, gestureState) => {
          const { dx } = gestureState;
          const currentIndex = CONSUMER_TABS.indexOf(currentTab);
          const getTabPath = (tabName: string) => (tabName === 'index' ? '/' : `/${tabName}`);

          if (dx < -60) {
            if (currentIndex < CONSUMER_TABS.length - 1) {
              router.navigate(getTabPath(CONSUMER_TABS[currentIndex + 1]) as any);
            }
          } else if (dx > 60 && currentIndex > 0) {
            router.navigate(getTabPath(CONSUMER_TABS[currentIndex - 1]) as any);
          }
        },
      }),
    [currentTab, router],
  );

  return (
    <AuthGate allowedRoles={['guest', 'customer']}>
      <View style={styles.container} {...panResponder.panHandlers}>
        <Tabs
          tabBar={(props) => <LiquidTabBar {...props} />}
          screenOptions={{ headerShown: false }}
        >
          <Tabs.Screen name="index" options={{ title: 'Home' }} />
          <Tabs.Screen name="connections" options={{ title: 'Contacts' }} />
          <Tabs.Screen name="share" options={{ title: 'Share' }} />
          {/* Hidden alias for older attendance route names / cached bundles */}
          <Tabs.Screen name="attendance" options={{ href: null }} />
          <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
          <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
          <Tabs.Screen name="notifications" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        </Tabs>
      </View>
    </AuthGate>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

