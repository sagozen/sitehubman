import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassScreenBackdrop } from '@/src/components/GlassScreenBackdrop';
import { IosScrollView } from '@/src/components/IosScrollView';
import { glassTheme } from '@/src/design-system/glass';
import { RoleThemeKey } from '@/src/constants/theme';

interface ScreenContainerProps {
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  role?: RoleThemeKey;
}

export function ScreenContainer({
  children,
  scroll = true,
  contentStyle,
  role: _role = 'default',
}: PropsWithChildren<ScreenContainerProps>) {
  void _role;

  const content = (
    <View style={[styles.content, contentStyle]}>
      {children}
    </View>
  );

  return (
    <GlassScreenBackdrop>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {scroll ? (
          <IosScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {content}
          </IosScrollView>
        ) : (
          <View style={styles.scrollContent}>{content}</View>
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
    paddingHorizontal: glassTheme.spacing.screenX,
    paddingTop: glassTheme.spacing.screenY,
  },
  content: {
    gap: glassTheme.spacing.section,
  },
});
