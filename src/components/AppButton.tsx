import { ActivityIndicator, Pressable, PressableProps, StyleProp, StyleSheet, View, ViewStyle, type TextStyle } from 'react-native';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { getRoleTheme, RoleThemeKey, theme } from '@/src/constants/theme';
import { iosDesign } from '@/src/design-system/ios';
import { usePreferences } from '@/src/hooks/usePreferences';
import { HapticTap } from '@/src/utils/haptics';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'disabled';

interface AppButtonProps extends Omit<PressableProps, 'style' | 'role'> {
  label: string;
  loading?: boolean;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  iconName?: AppIconName;
  iconPosition?: 'left' | 'right';
  role?: RoleThemeKey;
  style?: StyleProp<ViewStyle>;
}

export function AppButton({
  label,
  loading = false,
  variant = 'primary',
  fullWidth = true,
  iconName,
  iconPosition = 'left',
  role: _role = 'default',
  disabled,
  style,
  onPress,
  ...rest
}: AppButtonProps) {
  void getRoleTheme(_role);
  const { colors } = usePreferences();
  const isDisabled = disabled || loading || variant === 'disabled';
  const resolvedVariant = isDisabled && !loading ? 'disabled' : variant;

  const variantStyle: Record<ButtonVariant, ViewStyle> = {
    primary: {
      backgroundColor: '#111827', // Obsidian deep black
      borderWidth: 0,
    },
    secondary: {
      backgroundColor: 'rgba(0,0,0,0.04)',
    },
    outline: {
      backgroundColor: '#FFFFFF',
      borderWidth: 1.5,
      borderColor: '#E5E7EB',
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    disabled: {
      backgroundColor: '#E5E7EB',
    },
  };

  const labelColor =
    resolvedVariant === 'primary'
      ? '#FFFFFF'
      : resolvedVariant === 'disabled'
        ? '#9CA3AF'
        : '#111827';

  const iconColor = resolvedVariant === 'primary' ? '#FFFFFF' : '#111827';

  return (
    <Pressable
      disabled={isDisabled}
      accessibilityRole="button"
      onPress={(event) => {
        if (!isDisabled) {
          HapticTap.light();
        }
        onPress?.(event);
      }}
      android_ripple={null} // Ripple-free premium feel
      style={({ pressed }) => [
        styles.button,
        variantStyle[resolvedVariant],
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ] as ViewStyle[]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={labelColor} size="small" />
      ) : (
        <View style={[styles.content, iconPosition === 'right' && styles.contentReverse]}>
          {iconName ? <AppIcon name={iconName} size={18} color={iconColor} /> : null}
          <AppText variant="body" weight="bold" style={{ color: labelColor } as TextStyle}>
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: 999, // Pill buttons by default
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  } as ViewStyle,
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  } as ViewStyle,
  contentReverse: {
    flexDirection: 'row-reverse',
  } as ViewStyle,
  fullWidth: {
    width: '100%',
  } as ViewStyle,
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.96 }], // Elegant spring scale press animation
  } as ViewStyle,
  disabled: {
    opacity: 0.35, // Premium disabled state transparency
  } as ViewStyle,
});
