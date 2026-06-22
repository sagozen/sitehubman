import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassScreenBackdrop } from '@/src/components/GlassScreenBackdrop';
import { IosScrollView } from '@/src/components/IosScrollView';
import { RoleThemeKey, theme } from '@/src/constants/theme';

interface ScreenContainerProps {
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  role?: RoleThemeKey;
  padding?: 'default' | 'compact';
}

export function ScreenContainer({
  children,
  scroll = true,
  contentStyle,
  role: _role = 'default',
  padding = 'default',
}: PropsWithChildren<ScreenContainerProps>) {
  void _role;

  const content = (
    <View style={[styles.content, contentStyle]}>
      {children}
    </View>
  );

  const horizontalPadding = padding === 'compact' ? theme.spacing.md : theme.spacing.lg;

  return (
    <GlassScreenBackdrop>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {scroll ? (
          <IosScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding }]}
            keyboardShouldPersistTaps="handled"
          >
            {content}
          </IosScrollView>
        ) : (
          <View style={[styles.scrollContent, { paddingHorizontal: horizontalPadding }]}>{content}</View>
        )}
      </SafeAreaView>
    </GlassScreenBackdrop>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  content: {
    gap: theme.spacing.xl,
  },
});
