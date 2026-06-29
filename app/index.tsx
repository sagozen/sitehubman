import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { CommentLoader } from '@/src/components/CommentLoader';
import { theme } from '@/src/constants/theme';
import { useAuth } from '@/src/hooks/useAuth';
import { getDashboardRoute } from '@/src/utils/authFlow';

export default function IndexRoute() {
  const { user, isLoading, error } = useAuth();


  if (isLoading) {
    return (
      <View style={styles.center}>
        <CommentLoader size={56} color={theme.colors.primary} bubbleColor="#FFFFFF" />
        <AppText variant="caption" tone="muted">
          Restoring session...
        </AppText>
        {error ? (
          <AppText variant="caption" style={styles.errorHint}>
            {error}
          </AppText>
        ) : null}
      </View>
    );
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
