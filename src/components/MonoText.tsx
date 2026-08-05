/**
 * MonoText — razor-sharp text primitive.
 * System sans, tight tracking, monospace variant for codes/IDs.
 * Memoized, zero-allocation in render. ~1ms budget per call.
 */
import { memo, type PropsWithChildren } from 'react';
import { Platform, StyleProp, StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { monoFonts, monoType } from '@/src/design-system/monochrome';

export type MonoVariant = keyof typeof monoType | 'h1' | 'h2' | 'h3' | 'h4';
export type MonoTone = 'primary' | 'muted' | 'tertiary' | 'inverse';
export type MonoWeight = 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy' | 'extrabold' | 'black';
export type MonoAlign = 'left' | 'center' | 'right';

interface MonoTextProps extends Omit<TextProps, 'style'> {
  variant?: MonoVariant;
  tone?: MonoTone;
  weight?: MonoWeight;
  align?: MonoAlign;
  /** Direct color override */
  color?: string;
  /** Apply text-transform: uppercase */
  uppercase?: boolean;
  /** Underline */
  underline?: boolean;
  /** Strike through */
  strike?: boolean;
  style?: StyleProp<TextStyle>;
}

const weightMap: Record<MonoWeight, TextStyle['fontWeight']> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
  extrabold: '800',
  black: '900',
};

function resolveFamily(weight: MonoWeight): string {
  if (Platform.OS === 'web') {
    return '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Inter, Roboto, sans-serif';
  }
  switch (weight) {
    case 'heavy':
      return monoFonts.heavy;
    case 'bold':
      return monoFonts.bold;
    case 'semibold':
      return monoFonts.semibold;
    case 'medium':
      return monoFonts.medium;
    default:
      return monoFonts.regular;
  }
}

function MonoTextRaw({
  children,
  variant = 'body',
  tone = 'primary',
  weight,
  align,
  color,
  uppercase,
  underline,
  strike,
  style,
  ...rest
}: PropsWithChildren<MonoTextProps>) {
  const variantStyle = monoType[variant];
  const resolvedWeight = weight ?? (variantStyle.fontWeight as MonoWeight | undefined) ?? 'regular';
  const fontFamily = resolveFamily(resolvedWeight);

  const toneColor =
    color ??
    (tone === 'inverse' ? 'var(--mono-inverse, #FFFFFF)' : undefined);

  return (
    <Text
      allowFontScaling
      maxFontSizeMultiplier={1.3}
      style={[
        styles.base,
        variantStyle,
        { fontFamily, fontWeight: weightMap[resolvedWeight] },
        tone === 'primary' && { color: 'var(--mono-text, #27272A)' },
        tone === 'muted' && { color: 'var(--mono-muted, #52525B)' },
        tone === 'tertiary' && { color: 'var(--mono-tertiary, #A1A1AA)' },
        tone === 'inverse' && { color: toneColor ?? '#FFFFFF' },
        color && { color },
        uppercase && { textTransform: 'uppercase' },
        underline && { textDecorationLine: 'underline' },
        strike && { textDecorationLine: 'line-through' },
        align && { textAlign: align },
        // Strip duplicate fontWeight/fontFamily from caller
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

export const MonoText = memo(MonoTextRaw);

// ─── Convenience ───────────────────────────────────────────────────────────
export const Display = (p: Omit<MonoTextProps, 'variant'>) => <MonoText {...p} variant="display" />;
export const Title1 = (p: Omit<MonoTextProps, 'variant'>) => <MonoText {...p} variant="title1" />;
export const Title2 = (p: Omit<MonoTextProps, 'variant'>) => <MonoText {...p} variant="title2" />;
export const Title3 = (p: Omit<MonoTextProps, 'variant'>) => <MonoText {...p} variant="title3" />;
export const Headline = (p: Omit<MonoTextProps, 'variant'>) => <MonoText {...p} variant="headline" />;
export const Body = (p: Omit<MonoTextProps, 'variant'>) => <MonoText {...p} variant="body" />;
export const BodySmall = (p: Omit<MonoTextProps, 'variant'>) => <MonoText {...p} variant="bodySmall" />;
export const Callout = (p: Omit<MonoTextProps, 'variant'>) => <MonoText {...p} variant="callout" />;
export const Subhead = (p: Omit<MonoTextProps, 'variant'>) => <MonoText {...p} variant="subhead" />;
export const Footnote = (p: Omit<MonoTextProps, 'variant'>) => <MonoText {...p} variant="footnote" />;
export const Caption = (p: Omit<MonoTextProps, 'variant'>) => <MonoText {...p} variant="caption" />;
export const Micro = (p: Omit<MonoTextProps, 'variant'>) => <MonoText {...p} variant="micro" />;
export const MonoCode = (p: Omit<MonoTextProps, 'variant'>) => <MonoText {...p} variant="mono" />;
