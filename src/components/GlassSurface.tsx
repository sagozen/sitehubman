import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import {
  glassBorderColor,
  glassCardShadow,
  glassFill,
  glassHairline,
  glassTheme,
  resolveBlurIntensity,
} from '@/src/design-system/glass';
import { usePreferences } from '@/src/hooks/usePreferences';

type BlurTint = 'light' | 'dark' | 'default' | 'extraLight' | 'regular' | 'prominent';
type IntensityKey = keyof typeof glassTheme.blur;

export type GlassSurfaceProps = {
  children: ReactNode;
  /** Blur preset or custom intensity. */
  intensity?: IntensityKey | number;
  borderRadius?: number;
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  isDark?: boolean;
};

export function GlassSurface({
  children,
  intensity = 'medium',
  borderRadius = glassTheme.radius.card,
  elevated = false,
  style,
  contentStyle,
  isDark: isDarkProp,
}: GlassSurfaceProps) {
  const { isDark: prefDark } = usePreferences();
  const isDark = isDarkProp ?? prefDark;
  const [reduceTransparency, setReduceTransparency] = useState(false);

  useEffect(() => {
    let mounted = true;
    const accessibility = AccessibilityInfo as typeof AccessibilityInfo & {
      isReduceTransparencyEnabled?: () => Promise<boolean>;
    };

    void (accessibility.isReduceTransparencyEnabled?.() ?? Promise.resolve(false)).then((value) => {
      if (mounted) setReduceTransparency(value);
    });

    const subscription = accessibility.addEventListener?.('reduceTransparencyChanged', (value: boolean) => {
      setReduceTransparency(value);
    });

    return () => {
      mounted = false;
      subscription?.remove?.();
    };
  }, []);

  const borderColor = glassBorderColor(isDark);
  const fill = glassFill(isDark, elevated);
  const blur = resolveBlurIntensity(intensity);
  const sheen = isDark ? glassTheme.overlay.darkSheen : glassTheme.overlay.lightSheen;
  const specular = isDark ? glassTheme.overlay.specularDark : glassTheme.overlay.specularLight;

  return (
    <View
      style={[
        elevated && glassCardShadow(isDark),
        { borderRadius, borderWidth: StyleSheet.hairlineWidth, borderColor: glassHairline(isDark) },
        style,
      ]}
    >
      <BlurView
        intensity={reduceTransparency ? 0 : blur}
        tint={(isDark ? 'dark' : 'light') as BlurTint}
        style={[
          styles.blur,
          {
            borderRadius,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor,
            backgroundColor: reduceTransparency ? fill : fill,
          },
        ]}
      >
        {!reduceTransparency ? (
          <View pointerEvents="none" style={[styles.overlay, { borderRadius }]}>
            <LinearGradient colors={[...sheen]} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
            <LinearGradient
              colors={[...specular]}
              locations={[0, 0.35, 1]}
              style={[styles.specular, { borderTopLeftRadius: borderRadius, borderTopRightRadius: borderRadius }]}
            />
            <View style={[styles.innerStroke, { borderRadius: borderRadius - 1, borderColor }]} />
          </View>
        ) : null}
        <View style={[styles.content, contentStyle]}>{children}</View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  blur: {
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  specular: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
  },
  innerStroke: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: StyleSheet.hairlineWidth,
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});
