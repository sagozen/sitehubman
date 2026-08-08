/**
 * OrderCardV2 — Premium SaaS Quality Order Card
 * Displays an order summary in a bento-style card using V2 design tokens.
 */

import React, { memo, useCallback } from 'react';
import { View, StyleSheet, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
} from 'react-native-reanimated';

import { AppIcon } from '@/src/components/AppIcon';
import { MonoText } from '@/src/components/MonoText';
import { StatusBadgeV2, type StatusVariant } from '@/src/components/StatusBadgeV2';
import { tokens } from '@/src/design-system/tokens';
import { getColor, getTypography, getDuration, getSpring, type ColorMode } from '@/src/design-system/utilities';
import { usePreferences } from '@/src/hooks/usePreferences';
import { HapticTap } from '@/src/utils/haptics';

export interface OrderCardV2Props {
  orderId: string;
  date: string;
  amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  itemCount: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

function getStatusBadgeConfig(status: OrderCardV2Props['status']): { label: string; variant: StatusVariant } {
  switch (status) {
    case 'pending': return { label: 'Pending', variant: 'warning' };
    case 'processing': return { label: 'Processing', variant: 'info' };
    case 'shipped': return { label: 'Shipped', variant: 'info' };
    case 'delivered': return { label: 'Delivered', variant: 'success' };
    case 'cancelled': return { label: 'Cancelled', variant: 'error' };
    default: return { label: status, variant: 'neutral' };
  }
}

function OrderCardV2Raw({
  orderId,
  date,
  amount,
  status,
  itemCount,
  onPress,
  style,
}: OrderCardV2Props) {
  const { isDark } = usePreferences();
  const mode: ColorMode = isDark ? 'dark' : 'light';

  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    if (onPress) {
      scale.value = withTiming(0.96, { duration: getDuration('fast') });
    }
  }, [onPress, scale]);

  const handlePressOut = useCallback(() => {
    if (onPress) {
      scale.value = withSpring(1, getSpring('snappy'));
    }
  }, [onPress, scale]);

  const handlePress = useCallback(() => {
    if (onPress) {
      HapticTap.light();
      onPress();
    }
  }, [onPress]);

  const badgeConfig = getStatusBadgeConfig(status);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!onPress}
        style={[
          styles.card,
          { 
            backgroundColor: getColor('surface', mode),
            borderColor: getColor('border', mode),
          },
        ]}
      >
      <View style={styles.header}>
        <View>
          <MonoText style={[getTypography('bodyEmphasis', 'bold'), { color: getColor('ink', mode) }]}>
            Order #{orderId}
          </MonoText>
          <MonoText style={[getTypography('caption', 'regular'), { color: getColor('inkTertiary', mode), marginTop: tokens.spacing[1] }]}>
            {date} • {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </MonoText>
        </View>
        <StatusBadgeV2 label={badgeConfig.label} variant={badgeConfig.variant} />
      </View>

      <View style={styles.divider} />

      <View style={styles.footer}>
        <MonoText style={[getTypography('body', 'regular'), { color: getColor('inkSecondary', mode) }]}>
          Total Amount
        </MonoText>
        <View style={styles.amountContainer}>
          <MonoText style={[getTypography('h3', 'bold'), { color: getColor('ink', mode) }]}>
            ${amount.toFixed(2)}
          </MonoText>
          {onPress && (
            <AppIcon 
              name="ChevronRight" 
              size={20} 
              color={getColor('inkTertiary', mode)} 
              style={styles.chevron} 
            />
          )}
        </View>
      </View>
    </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: tokens.radius.xl,
    borderWidth: 1,
    padding: tokens.spacing[4],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
    marginVertical: tokens.spacing[4],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevron: {
    marginLeft: tokens.spacing[2],
  },
});

export const OrderCardV2 = memo(OrderCardV2Raw);
