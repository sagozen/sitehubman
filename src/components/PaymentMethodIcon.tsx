import { useState } from 'react';
import { Image, StyleSheet, View, type ImageStyle, type StyleProp } from 'react-native';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import type { CambodiaPaymentMethodId } from '@/src/constants/cambodiaPayments';
import { getPaymentMethodImage } from '@/src/constants/paymentAssets';

type Props = {
  methodId: CambodiaPaymentMethodId;
  /** Fallback vector icon when no brand image exists (e.g. KHQR, COD). */
  fallbackIcon: AppIconName;
  size?: number;
  color?: string;
  style?: StyleProp<ImageStyle>;
};

export function PaymentMethodIcon({
  methodId,
  fallbackIcon,
  size = 28,
  color = '#0F766E',
  style,
}: Props) {
  const source = getPaymentMethodImage(methodId);
  const [failed, setFailed] = useState(false);

  if (source && !failed) {
    return (
      <Image
        source={source}
        style={[styles.logo, { width: size, height: size }, style]}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <View style={[styles.fallback, { width: size, height: size }]}>
      <AppIcon name={fallbackIcon} size={Math.round(size * 0.65)} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  logo: {
    borderRadius: 4,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
