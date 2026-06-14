import { Tabs } from 'expo-router';
import { AuthGate } from '@/src/components/AuthGate';
import { LiquidTabBar } from '@/src/components/LiquidTabBar';

export default function TabsLayout() {
  return (
    <AuthGate allowedRoles={['guest', 'customer']}>
      <Tabs
        tabBar={(props) => <LiquidTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="connections" options={{ title: 'Network' }} />
        <Tabs.Screen name="share" options={{ title: 'Share' }} />
        {/* Hidden alias for older attendance route names / cached bundles */}
        <Tabs.Screen name="attendance" options={{ href: null }} />
        <Tabs.Screen name="profile" options={{ title: 'Analysis' }} />
        <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
        <Tabs.Screen name="notifications" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      </Tabs>
    </AuthGate>
  );
}
