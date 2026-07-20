import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, Text, TextProps, TextStyle } from 'react-native';
import { usePreferences } from '@/src/hooks/usePreferences';
import { iosTypography } from '@/src/design-system/ios';
import { memo } from 'react';

type TextVariant = keyof typeof iosTypography;
type TextTone = 'primary' | 'muted' | 'inverse';
type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black';

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  tone?: TextTone;
  muted?: boolean;
  weight?: TextWeight;
  style?: StyleProp<TextStyle>;
  /** Optional text color override */
  color?: string;
}

const weightStyles: Record<TextWeight, TextStyle> = {
  regular: {
    fontWeight: '400',
  },
  medium: {
    fontWeight: '500',
  },
  semibold: {
    fontWeight: '600',
  },
  bold: {
    fontWeight: '700',
  },
  extrabold: {
    fontWeight: '800',
  },
  black: {
    fontWeight: '900',
  },
};

function inferVariantFromStyle(style: TextStyle | undefined): TextVariant {
  const size = typeof style?.fontSize === 'number' ? style.fontSize : undefined;
  if (!size) return 'body';
  if (size >= 34) return 'display';
  if (size >= 28) return 'h1';
  if (size >= 22) return 'h2';
  if (size >= 18) return 'h3';
  if (size >= 16) return 'h4';
  if (size <= 12) return 'caption';
  if (size <= 15) return 'caption2';
  if (size <= 17) return 'footnote';
  if (size <= 18) return 'subhead';
  if (size <= 22) return 'body';
  return 'body';
}

function sanitizeTextStyle(style: TextStyle | undefined) {
  return style;
}

function getFontFamily(fontWeight: TextStyle['fontWeight']): string {
  switch (fontWeight) {
    case '500':
    case 'medium':
      return 'SF-Pro-Display-Medium';
    case '600':
    case 'semibold':
      return 'SF-Pro-Display-Semibold';
    case '700':
    case 'bold':
    case '800':
    case '900':
      return 'SF-Pro-Display-Bold';
    case '400':
    case 'normal':
    default:
      return 'SF-Pro-Display-Regular';
  }
}

const AppTextRaw = ({
  children,
  variant,
  tone = 'primary',
  muted = false,
  weight,
  style,
  color,
  ...rest
}: PropsWithChildren<AppTextProps>) => {
  const { colors } = usePreferences();
  const rawStyle = StyleSheet.flatten(style);
  const resolvedVariant = variant ?? inferVariantFromStyle(rawStyle);
  const resolvedTone = muted ? 'muted' : tone;

  const toneStyles: Record<TextTone, TextStyle> = {
    primary: { color: colors.textPrimary },
    muted: { color: colors.textMuted },
    inverse: { color: colors.textInverse },
  };

  const baseTypography = iosTypography[resolvedVariant];
  const activeWeight = weight ?? baseTypography?.fontWeight ?? rawStyle?.fontWeight ?? '400';
  const resolvedFontFamily = getFontFamily(activeWeight);

  // Strip fontWeight from style objects to prevent custom font fallback
  const cleanBaseTypo: TextStyle = baseTypography ? { ...baseTypography } : {};
  delete cleanBaseTypo.fontWeight;

  const cleanStyle: TextStyle = rawStyle ? { ...rawStyle } : {};
  delete cleanStyle.fontWeight;

  return (
    <Text
      style={[
        styles.base,
        cleanBaseTypo,
        toneStyles[resolvedTone],
        { fontFamily: resolvedFontFamily },
        color && { color },
        cleanStyle,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

// MEMOIZE: Prevent unnecessary re-renders when props are unchanged
export const AppText = memo(AppTextRaw);

// Export specialized components (these will be memoized through AppText)
export function Display(props: Omit<AppTextProps, 'variant'>) {
  return <AppText {...props} variant="display" />;
}

export function H1(props: Omit<AppTextProps, 'variant'>) {
  return <AppText {...props} variant="h1" />;
}

export function H2(props: Omit<AppTextProps, 'variant'>) {
  return <AppText {...props} variant="h2" />;
}

export function H3(props: Omit<AppTextProps, 'variant'>) {
  return <AppText {...props} variant="h3" />;
}

export function H4(props: Omit<AppTextProps, 'variant'>) {
  return <AppText {...props} variant="h4" />;
}

export function Body(props: Omit<AppTextProps, 'variant'>) {
  return <AppText {...props} variant="body" />;
}

export function BodySmall(props: Omit<AppTextProps, 'variant'>) {
  return <AppText {...props} variant="bodySmall" />;
}

export function Callout(props: Omit<AppTextProps, 'variant'>) {
  return <AppText {...props} variant="callout" />;
}

export function Caption(props: Omit<AppTextProps, 'variant'>) {
  return <AppText {...props} variant="caption" />;
}

export function Caption2(props: Omit<AppTextProps, 'variant'>) {
  return <AppText {...props} variant="caption2" />;
}

export function Footnote(props: Omit<AppTextProps, 'variant'>) {
  return <AppText {...props} variant="footnote" />;
}

export function Subhead(props: Omit<AppTextProps, 'variant'>) {
  return <AppText {...props} variant="subhead" />;
}

export function Headline(props: Omit<AppTextProps, 'variant'>) {
  return <AppText {...props} variant="headline" />;
}

export function Title1(props: Omit<AppTextProps, 'variant'>) {
  return <AppText {...props} variant="title1" />;
}

export function Title2(props: Omit<AppTextProps, 'variant'>) {
  return <AppText {...props} variant="title2" />;
}

export function Title3(props: Omit<AppTextProps, 'variant'>) {
  return <AppText {...props} variant="title3" />;
}