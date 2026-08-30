/**
 * AppSelectV2 — Premium SaaS Quality Dropdown Select
 * Replaces old picker components with a custom modal-based selector.
 * 
 * Features:
 * - Read-only input lookalike that opens a selector sheet
 * - Single item selection
 * - Custom styling based on V2 tokens
 */

import React, { memo, useState } from 'react';
import { View, StyleSheet, Pressable, type StyleProp, type ViewStyle, ScrollView } from 'react-native';

import { AppIcon } from '@/src/components/AppIcon';
import { MonoText } from '@/src/components/MonoText';
import { AppModalV2 } from '@/src/components/AppModalV2';
import { tokens } from '@/src/design-system/tokens';
import { getColor, getTypography, type ColorMode } from '@/src/design-system/utilities';
import { usePreferences } from '@/src/hooks/usePreferences';
import { HapticTap } from '@/src/utils/haptics';

export interface SelectOption {
  label: string;
  value: string;
}

export interface AppSelectV2Props {
  /** Currently selected value */
  value?: string;
  /** Options to display */
  options: SelectOption[];
  /** Callback when an option is selected */
  onSelect: (value: string) => void;
  /** Placeholder text when nothing is selected */
  placeholder?: string;
  /** Title for the modal sheet */
  title?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Custom container style */
  style?: StyleProp<ViewStyle>;
}

function AppSelectV2Raw({
  value,
  options,
  onSelect,
  placeholder = 'Select an option',
  title = 'Select Option',
  disabled = false,
  style,
}: AppSelectV2Props) {
  const { isDark } = usePreferences();
  const mode: ColorMode = isDark ? 'dark' : 'light';
  
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleOpen = () => {
    if (disabled) return;
    HapticTap.light();
    setModalVisible(true);
  };

  const handleClose = () => {
    setModalVisible(false);
  };

  const handleSelect = (val: string) => {
    HapticTap.selection();
    onSelect(val);
    setModalVisible(false);
  };

  return (
    <>
      <Pressable
        onPress={handleOpen}
        disabled={disabled}
        style={[
          styles.triggerContainer,
          { 
            backgroundColor: getColor('surface', mode),
            borderColor: getColor('border', mode),
            opacity: disabled ? 0.5 : 1,
          },
          style,
        ]}
      >
        <MonoText
          style={[
            getTypography('body', 'regular'),
            { color: selectedOption ? getColor('ink', mode) : getColor('inkTertiary', mode) },
            styles.triggerText,
          ]}
          numberOfLines={1}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </MonoText>
        <AppIcon 
          name="ChevronDown" 
          size={20} 
          color={getColor('inkSecondary', mode)} 
        />
      </Pressable>

      <AppModalV2
        visible={modalVisible}
        onClose={handleClose}
        type="sheet"
      >
        <View style={styles.sheetHeader}>
          <MonoText style={[getTypography('h3', 'bold'), { color: getColor('ink', mode) }]}>
            {title}
          </MonoText>
        </View>

        <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <Pressable
                key={opt.value}
                style={({ pressed }) => [
                  styles.optionRow,
                  { backgroundColor: pressed ? getColor('surfaceSubdued', mode) : 'transparent' },
                ]}
                onPress={() => handleSelect(opt.value)}
              >
                <MonoText
                  style={[
                    getTypography('body', isSelected ? 'bold' : 'regular'),
                    { color: getColor('ink', mode) },
                  ]}
                >
                  {opt.label}
                </MonoText>
                {isSelected && (
                  <AppIcon name="Check" size={20} color={getColor('primary', mode)} />
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </AppModalV2>
    </>
  );
}

const styles = StyleSheet.create({
  triggerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: tokens.controlHeight.md,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    paddingHorizontal: tokens.spacing[3],
  },
  triggerText: {
    flex: 1,
    marginRight: tokens.spacing[2],
  },
  sheetHeader: {
    marginBottom: tokens.spacing[4],
    alignItems: 'center',
  },
  optionsList: {
    maxHeight: 300,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: tokens.spacing[3],
    paddingHorizontal: tokens.spacing[2],
    borderRadius: tokens.radius.md,
  },
});

export const AppSelectV2 = memo(AppSelectV2Raw);
