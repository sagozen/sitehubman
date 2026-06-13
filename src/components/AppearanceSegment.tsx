import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { theme } from '@/src/constants/theme';
import { usePreferences } from '@/src/hooks/usePreferences';
import type { UiPreferences } from '@/src/types/models';

const OPTIONS: { label: string; value: UiPreferences['colorMode'] }[] = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'System', value: 'system' },
];

interface AppearanceSegmentProps {
  value: UiPreferences['colorMode'];
  disabled?: boolean;
  onChange: (value: UiPreferences['colorMode']) => void;
}

export function AppearanceSegment({ value, disabled, onChange }: AppearanceSegmentProps) {
  const { colors } = usePreferences();

  return (
    <View
      style={[
        styles.track,
        {
          backgroundColor: colors.surfaceSoft,
          borderColor: colors.border,
        },
      ]}
    >
      {OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected, disabled }}
            disabled={disabled}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.segment,
              selected && { backgroundColor: colors.surface },
              pressed && !disabled && styles.segmentPressed,
            ]}
          >
            <AppText
              variant="caption"
              weight="semibold"
              style={{
                color: selected ? colors.textPrimary : colors.textMuted,
              }}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 3,
    gap: 2,
  },
  segment: {
    flex: 1,
    minHeight: 36,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xs,
  },
  segmentPressed: {
    opacity: 0.82,
  },
});
