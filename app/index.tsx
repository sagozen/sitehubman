import { Redirect } from 'expo-router';
import { useAuth } from '@/src/hooks/useAuth';
import { getDashboardRoute } from '@/src/utils/authFlow';
import { HomeSkeleton } from '@/src/components/HomeSkeleton';

export default function IndexRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <HomeSkeleton />;
  }

  return <Redirect href={user ? getDashboardRoute(user) : '/(auth)/login'} />;
}


