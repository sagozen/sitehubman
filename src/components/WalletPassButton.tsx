import React from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { InteractivePressable } from './InteractivePressable';
import { AppIcon } from './AppIcon';
import { colors, radius, typography } from '../design-system/tokens';

export interface WalletPassButtonProps {
  type: 'apple' | 'google';
  onPress: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  style?: object;
}

/**
 * Native-style Wallet Pass Buttons compliant with Apple & Google Wallet Design Guidelines
 * - Apple Wallet: Pure black container, badge border, official typography proportions
 * - Google Wallet: Dark surface, Google multi-color badge accent, rounded pill
 */
export const WalletPassButton: React.FC<WalletPassButtonProps> = ({
  type,
  onPress,
  loading = false,
  disabled = false,
  style,
}) => {
  if (type === 'apple') {
    return (
      <InteractivePressable
        onPress={onPress}
        disabled={disabled || loading}
        haptic="medium"
        style={[styles.baseButton, styles.appleButton, style]}
        accessibilityRole="button"
        accessibilityLabel="Add to Apple Wallet"
      >
        <View style={styles.contentRow}>
          {/* Apple Wallet Icon glyph */}
          <View style={styles.appleIconWrap}>
            <AppIcon name="CreditCard" size={18} color="#FFFFFF" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.appleSubText}>Add to</Text>
            <Text style={styles.appleMainText}>Apple Wallet</Text>
          </View>
        </View>
      </InteractivePressable>
    );
  }

  return (
    <InteractivePressable
      onPress={onPress}
      disabled={disabled || loading}
      haptic="medium"
      style={[styles.baseButton, styles.googleButton, style]}
      accessibilityRole="button"
      accessibilityLabel="Add to Google Wallet"
    >
      <View style={styles.contentRow}>
        <View style={styles.googleIconWrap}>
          <AppIcon name="Smartphone" size={18} color="#799A85" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.googleSubText}>Save to</Text>
          <Text style={styles.googleMainText}>Google Wallet</Text>
        </View>
      </View>
    </InteractivePressable>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    flexDirection: 'row',
  },
  appleButton: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  googleButton: {
    backgroundColor: '#1E1F22',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  appleIconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'flex-start',
  },
  appleSubText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '400',
    lineHeight: 11,
  },
  appleMainText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    lineHeight: 17,
    letterSpacing: -0.2,
  },
  googleSubText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '400',
    lineHeight: 11,
  },
  googleMainText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    lineHeight: 17,
    letterSpacing: -0.2,
  },
});

export default WalletPassButton;
