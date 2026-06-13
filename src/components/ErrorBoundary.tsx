import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { theme } from '@/src/constants/theme';

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) {
      console.error('[ErrorBoundary]', error, info.componentStack);
    }
  }

  private handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      const message = __DEV__
        ? this.state.error.message || 'An unexpected error occurred.'
        : 'The app hit a temporary problem. Retry or sign in again if this keeps happening.';
      return (
        <View style={styles.container}>
          <AppText style={styles.title}>Something went wrong</AppText>
          <AppText style={styles.message}>{message}</AppText>
          <Pressable style={styles.button} onPress={this.handleRetry}>
            <AppText style={styles.buttonText}>Try again</AppText>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: theme.colors.background,
    gap: 12,
  },
  title: { fontSize: 20, fontWeight: '800', color: theme.colors.textPrimary },
  message: { fontSize: 14, color: theme.colors.textMuted, textAlign: 'center' },
  button: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
  },
  buttonText: { color: '#fff', fontWeight: '700' },
});
