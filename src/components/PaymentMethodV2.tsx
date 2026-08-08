/**
 * PaymentMethodV2 — Premium SaaS Quality Payment Method Selector
 * Selectable payment method rows for checkout flows.
 */

import React, { memo } from 'react';
import { View, StyleSheet, Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { MonoText } from '@/src/components/MonoText';
import { tokens } from '@/src/design-system/tokens';
import { getColor, getTypography, type ColorMode } from '@/src/design-system/utilities';
import { usePreferences } from '@/src/hooks/usePreferences';
import { HapticTap } from '@/src/utils/haptics';

export interface PaymentMethodV2Props {
  id: string;
  title: string;
  subtitle?: string;
  icon: AppIconName;
  isSelected: boolean;
  onSelect: (id: string) => void;
  style?: StyleProp<ViewStyle>;
}

function PaymentMethodV2Raw({
  id,
  title,
  subtitle,
  icon,
  isSelected,
  onSelect,
  style,
}: PaymentMethodV2Props) {
  const { isDark } = usePreferences();
  const mode: ColorMode = isDark ? 'dark' : 'light';

  const handlePress = () => {
    if (!isSelected) {
      HapticTap.selection();
      onSelect(id);
    }
  };

  const borderColor = isSelected ? getColor('primary', mode) : getColor('border', mode);
  const bgColor = isSelected ? getColor('primarySoft', mode) : getColor('surface', mode);

  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.container,
        { backgroundColor: bgColor, borderColor },
        style,
      ]}
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected }}
    >
      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <AppIcon 
            name={icon} 
            size={24} 
            color={isSelected ? getColor('primary', mode) : getColor('inkSecondary', mode)} 
          />
        </View>
        <View style={styles.textWrapper}>
          <MonoText 
            style={[
              getTypography('bodyEmphasis', 'bold'), 
              { color: getColor('ink', mode) }
            ]}
          >
            {title}
          </MonoText>
          {subtitle && (
            <MonoText 
              style={[
                getTypography('caption', 'regular'), 
                { color: getColor('inkTertiary', mode), marginTop: 2 }
              ]}
            >
              {subtitle}
            </MonoText>
          )}
        </View>
      </View>

      <View 
        style={[
          styles.radio, 
          { borderColor: isSelected ? getColor('primary', mode) : getColor('borderStrong', mode) }
        ]}
      >
        {isSelected && (
          <View style={[styles.radioInner, { backgroundColor: getColor('primary', mode) }]} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: tokens.spacing[4],
    borderRadius: tokens.radius.lg,
    borderWidth: 1.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start', // Align icon left
  },
  textWrapper: {
    flex: 1,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: tokens.spacing[3],
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

export const PaymentMethodV2 = memo(PaymentMethodV2Raw);
