import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/src/hooks/useAuth';
import { getDashboardRoute } from '@/src/utils/authFlow';
import { HomeSkeleton } from '@/src/components/HomeSkeleton';

import { Platform } from 'react-native';

export default function IndexRoute() {
  const { user, isLoading } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('@avio_onboarding_done').then((val) => {
      setOnboardingDone(val === '1');
    }).catch(() => setOnboardingDone(true));
  }, []);

  if (isLoading || onboardingDone === null) {
    return <HomeSkeleton />;
  }

  // First-time mobile users → onboarding. Web previews load home page directly.
  if (!onboardingDone && !user && Platform.OS !== 'web') {
    return <Redirect href={'/onboarding' as any} />;
  }

  return <Redirect href={user ? getDashboardRoute(user) : ('/(tabs)' as any)} />;
}
