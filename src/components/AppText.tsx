/**
 * AppText — backward-compatible wrapper over MonoText.
 * All existing call sites continue to work; the typography has been
 * retuned to monochrome tokens.
 */
import { memo, type PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, type TextProps, type TextStyle } from 'react-native';

import { MonoText, type MonoTone, type MonoVariant, type MonoWeight } from '@/src/components/MonoText';
import { usePreferences } from '@/src/hooks/usePreferences';

interface AppTextProps extends Omit<TextProps, 'style'> {
  variant?: MonoVariant;
  tone?: MonoTone;
  muted?: boolean;
  weight?: MonoWeight;
  /** Direct color override */
  color?: string;
  style?: StyleProp<TextStyle>;
}

const AppTextRaw = ({
  children,
  variant,
  tone,
  muted = false,
  weight,
  color,
  style,
  ...rest
}: PropsWithChildren<AppTextProps>) => {
  // Read prefs so colors re-bind on theme switch.
  const { colors } = usePreferences();

  const resolvedTone: MonoTone = muted ? 'muted' : tone ?? 'primary';
  const resolvedColor =
    color ??
    (resolvedTone === 'primary'
      ? colors.textPrimary
      : resolvedTone === 'muted'
        ? colors.textMuted
        : resolvedTone === 'tertiary'
          ? (colors as any).textTertiary ?? colors.textMuted
          : colors.textInverse);

  return (
    <MonoText
      variant={variant}
      weight={weight}
      tone={resolvedTone}
      color={resolvedColor}
      style={style as TextStyle | TextStyle[]}
      {...rest}
    >
      {children}
    </MonoText>
  );
};

export const AppText = memo(AppTextRaw);

// Export specialized components (memoized through MonoText)
export const Display = (p: Omit<AppTextProps, 'variant'>) => <AppText {...p} variant="display" />;
export const H1 = (p: Omit<AppTextProps, 'variant'>) => <AppText {...p} variant="title1" />;
export const H2 = (p: Omit<AppTextProps, 'variant'>) => <AppText {...p} variant="title2" />;
export const H3 = (p: Omit<AppTextProps, 'variant'>) => <AppText {...p} variant="title3" />;
export const H4 = (p: Omit<AppTextProps, 'variant'>) => <AppText {...p} variant="headline" />;
export const Body = (p: Omit<AppTextProps, 'variant'>) => <AppText {...p} variant="body" />;
export const BodySmall = (p: Omit<AppTextProps, 'variant'>) => <AppText {...p} variant="bodySmall" />;
export const Callout = (p: Omit<AppTextProps, 'variant'>) => <AppText {...p} variant="callout" />;
export const Caption = (p: Omit<AppTextProps, 'variant'>) => <AppText {...p} variant="caption" />;
export const Caption2 = (p: Omit<AppTextProps, 'variant'>) => <AppText {...p} variant="footnote" />;
export const Footnote = (p: Omit<AppTextProps, 'variant'>) => <AppText {...p} variant="footnote" />;
export const Subhead = (p: Omit<AppTextProps, 'variant'>) => <AppText {...p} variant="subhead" />;
export const Headline = (p: Omit<AppTextProps, 'variant'>) => <AppText {...p} variant="headline" />;
export const Title1 = (p: Omit<AppTextProps, 'variant'>) => <AppText {...p} variant="title1" />;
export const Title2 = (p: Omit<AppTextProps, 'variant'>) => <AppText {...p} variant="title2" />;
export const Title3 = (p: Omit<AppTextProps, 'variant'>) => <AppText {...p} variant="title3" />;
