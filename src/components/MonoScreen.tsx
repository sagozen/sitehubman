/**
 * MonoScreen — the new screen primitive.
 * Plain canvas, generous gutter, comfortable type rhythm.
 * Replaces legacy ScreenContainer/GlassSafeScreen with a sharp surface.
 */
import { memo, type PropsWithChildren, type ReactNode } from 'react';
import { ScrollView, StatusBar, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MonoText } from '@/src/components/MonoText';
import { monoSpace } from '@/src/design-system/monochrome';
import { usePreferences } from '@/src/hooks/usePreferences';

interface MonoScreenProps {
  /** Optional title rendered above the content */
  title?: string;
  /** Optional eyebrow / micro-overline (e.g. "Settings") */
  eyebrow?: string;
  /** Optional supporting copy under the title */
  intro?: string;
  /** Right-aligned header action */
  headerAction?: ReactNode;
  /** Use ScrollView (default true) */
  scroll?: boolean;
  /** Children */
  children: ReactNode;
  /** Outer style */
  style?: StyleProp<ViewStyle>;
  /** Bottom safe-area + tab-bar clearance */
  bottomGutter?: number;
}

function MonoScreenRaw({
  title,
  eyebrow,
  intro,
  headerAction,
  scroll = true,
  children,
  style,
  bottomGutter = monoSpace[24],
}: PropsWithChildren<MonoScreenProps>) {
  const insets = useSafeAreaInsets();
  const { isDark } = usePreferences();

  const Header = (title || eyebrow) ? (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        {eyebrow ? (
          <MonoText variant="micro" tone="muted">
            {eyebrow}
          </MonoText>
        ) : <View />}
        {headerAction}
      </View>
      {title ? (
        <MonoText variant="display" weight="heavy" style={styles.title}>
          {title}
        </MonoText>
      ) : null}
      {intro ? (
        <MonoText variant="body" tone="muted" style={styles.intro}>
          {intro}
        </MonoText>
      ) : null}
    </View>
  ) : null;

  const Body = (
    <View style={[styles.body, style]}>
      {children}
    </View>
  );

  return (
    <View style={[styles.canvas, { backgroundColor: isDark ? '#0B0B0D' : '#FAFAFA' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      {scroll ? (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: insets.top + monoSpace[2],
            paddingBottom: bottomGutter + insets.bottom,
          }}
          style={styles.flex}
        >
          {Header}
          {Body}
        </ScrollView>
      ) : (
        <View style={[styles.flex, { paddingTop: insets.top + monoSpace[2] }]}>
          {Header}
          {Body}
        </View>
      )}
    </View>
  );
}

export const MonoScreen = memo(MonoScreenRaw);

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: monoSpace[5],
    paddingTop: monoSpace[4],
    paddingBottom: monoSpace[6],
    gap: monoSpace[3],
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    letterSpacing: -1.2,
  },
  intro: {
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  body: {
    paddingHorizontal: monoSpace[5],
    gap: monoSpace[6],
  },
});