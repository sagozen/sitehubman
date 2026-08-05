/**
 * MonoCard — the workhorse surface.
 * Sharp 14-radius, hairline border, near-invisible shadow.
 * Two variants: flat (paper-thin) and elevated (with shadow).
 */
import { memo, type PropsWithChildren } from 'react';
import { Platform, Pressable, type PressableProps, StyleSheet, View, type ViewStyle, type StyleProp } from 'react-native';

import { MonoText } from '@/src/components/MonoText';
import { monoMotion, monoRadius, monoShadow, monoSpace } from '@/src/design-system/monochrome';

interface MonoCardProps extends Omit<PressableProps, 'style'> {
  /** Card content */
  children?: React.ReactNode;
  /** Visual elevation */
  variant?: 'flat' | 'elevated' | 'floating';
  /** Pressable (entire card becomes a button) */
  onPress?: () => void;
  /** Show 1px hairline border */
  bordered?: boolean;
  /** Inner padding scale */
  pad?: 'none' | 'sm' | 'md' | 'lg';
  /** Border radius */
  radius?: keyof typeof monoRadius;
  /** Custom style override */
  style?: StyleProp<ViewStyle>;
  /** Inner style */
  contentStyle?: StyleProp<ViewStyle>;
  /** Accessibility */
  accessibilityLabel?: string;
}

const padMap = {
  none: 0,
  sm: monoSpace[3],
  md: monoSpace[4],
  lg: monoSpace[5],
};

function MonoCardRaw({
  children,
  variant = 'flat',
  onPress,
  bordered = false,
  pad = 'md',
  radius = 'xl',
  style,
  contentStyle,
  accessibilityLabel,
  ...rest
}: PropsWithChildren<MonoCardProps>) {
  const radiusValue = monoRadius[radius];
  const padding = padMap[pad];

  const containerStyle: ViewStyle = {
    borderRadius: radiusValue,
    padding,
    backgroundColor: 'var(--mono-surface, #FFFFFF)',
    borderWidth: bordered ? 0.5 : 0,
    borderColor: 'var(--mono-hairline, rgba(10,10,11,0.06))',
  };

  if (variant === 'flat') {
    // No shadow, hairline optional
  } else if (variant === 'elevated') {
    Object.assign(containerStyle, monoShadow.subtle);
  } else if (variant === 'floating') {
    Object.assign(containerStyle, monoShadow.low);
  }

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        android_ripple={null}
        style={({ pressed }) => [
          containerStyle,
          pressed && { opacity: monoMotion.pressOpacity },
          Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
          style,
        ]}
        {...rest}
      >
        <View style={contentStyle}>{children}</View>
      </Pressable>
    );
  }

  return (
    <View style={[containerStyle, style]}>
      <View style={contentStyle}>{children}</View>
    </View>
  );
}

export const MonoCard = memo(MonoCardRaw);

// ─── ListRow ────────────────────────────────────────────────────────────────
// Linear-style row inside a card or list. Used everywhere.
interface MonoRowProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  divider?: boolean;
}

export function MonoRow({ icon, title, subtitle, trailing, onPress, showChevron, divider }: MonoRowProps) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper
      onPress={onPress as any}
      style={({ pressed }: any) => [
        rowStyles.row,
        pressed && { backgroundColor: 'var(--mono-sunken, #F4F4F5)' },
      ]}
    >
      {icon ? <View style={rowStyles.icon}>{icon}</View> : null}
      <View style={rowStyles.body}>
        <MonoText variant="headline" tone="primary">{title}</MonoText>
        {subtitle ? <MonoText variant="footnote" tone="muted">{subtitle}</MonoText> : null}
      </View>
      {trailing}
      {showChevron ? <MonoText variant="body" tone="tertiary">›</MonoText> : null}
      {divider ? <View style={rowStyles.divider} /> : null}
    </Wrapper>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: monoSpace[3],
    paddingHorizontal: monoSpace[1],
    gap: monoSpace[3],
    minHeight: 52,
  },
  icon: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  divider: {
    position: 'absolute',
    bottom: 0,
    left: monoSpace[5],
    right: 0,
    height: 0.5,
    backgroundColor: 'var(--mono-hairline, rgba(10,10,11,0.06))',
  },
});
