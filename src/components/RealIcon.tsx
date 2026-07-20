import { Ionicons } from '@expo/vector-icons';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  View,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { getFlowBrandImage, type FlowRealIconId } from '@/src/constants/flowRealIcons';

type NativeSymbol = {
  ios: Parameters<typeof SymbolView>[0]['name'];
  ionicon: keyof typeof Ionicons.glyphMap;
  fallback: AppIconName;
};

const NATIVE_SYMBOLS: Partial<Record<FlowRealIconId, NativeSymbol>> = {
  phone: { ios: 'phone.fill', ionicon: 'call', fallback: 'Phone' },
  mail: { ios: 'envelope.fill', ionicon: 'mail', fallback: 'Mail' },
  link: { ios: 'link', ionicon: 'link', fallback: 'Link' },
  share: { ios: 'square.and.arrow.up', ionicon: 'share-outline', fallback: 'Share' },
  message: { ios: 'message.fill', ionicon: 'chatbubble', fallback: 'Mail' },
  whatsapp: { ios: 'message.fill', ionicon: 'logo-whatsapp', fallback: 'Phone' },
  ecard: { ios: 'creditcard.fill', ionicon: 'card', fallback: 'CreditCard' },
  profile: { ios: 'person.crop.circle.fill', ionicon: 'person-circle', fallback: 'UserRound' },
  preview: { ios: 'eye.fill', ionicon: 'eye', fallback: 'Eye' },
  order: { ios: 'shippingbox.fill', ionicon: 'cube', fallback: 'Package' },
  track: { ios: 'location.fill', ionicon: 'navigate', fallback: 'Truck' },
  nfc: { ios: 'wave.3.right', ionicon: 'radio', fallback: 'Nfc' },
  connections: { ios: 'link.circle.fill', ionicon: 'people', fallback: 'Users' },
  orders: { ios: 'list.bullet.rectangle.fill', ionicon: 'list', fallback: 'ClipboardList' },
};

type Props = {
  id: FlowRealIconId;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle | ImageStyle>;
  fallbackIcon?: AppIconName;
};

/**
 * Real icon layer — brand PNG, iOS SF Symbol, Ionicons, then Solar line fallback.
 */
export function RealIcon({ id, size = 24, color = '#007AFF', style, fallbackIcon }: Props) {
  const brand = getFlowBrandImage(id);
  const [brandFailed, setBrandFailed] = useState(false);

  if (brand && !brandFailed) {
    return (
      <View style={[styles.fallback, { width: size, height: size }, style]}>
        <Image
          source={brand}
          style={[styles.brand, { width: size, height: size }]}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
          onError={() => setBrandFailed(true)}
        />
      </View>
    );
  }

  const native = NATIVE_SYMBOLS[id];
  const lineFallback = fallbackIcon ?? native?.fallback ?? 'Link';

  if (!native) {
    return (
      <View style={[styles.fallback, { width: size, height: size }, style]}>
        <AppIcon name={lineFallback} size={Math.round(size * 0.72)} color={color} />
      </View>
    );
  }

  if (Platform.OS === 'ios') {
    return (
      <View style={[styles.fallback, { width: size, height: size }, style]}>
        <SymbolView
          name={native.ios}
          size={size}
          tintColor={color}
          weight="medium"
          resizeMode="scaleAspectFit"
          fallback={
            <Ionicons name={native.ionicon} size={Math.round(size * 0.88)} color={color} />
          }
        />
      </View>
    );
  }

  return (
    <View style={[styles.fallback, { width: size, height: size }, style]}>
      <Ionicons name={native.ionicon} size={Math.round(size * 0.88)} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  brand: {
    borderRadius: 6,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
