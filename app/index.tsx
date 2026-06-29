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

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: '#F5F5F7',
    paddingHorizontal: theme.spacing.lg,
  },
  errorHint: {
    textAlign: 'center',
    marginTop: theme.spacing.xs,
    color: theme.colors.danger,
  },
});
