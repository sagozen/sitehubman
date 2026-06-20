import {
  Image,
  ImageSourcePropType,
  StyleProp,
  ImageStyle,
  type ImageResizeMode,
} from 'react-native';

type Props = {
  source: ImageSourcePropType;
  style?: StyleProp<ImageStyle>;
  contentFit?: 'cover' | 'contain';
  accessibilityLabel?: string;
  /** Kept for API compatibility with prior expo-image usage. */
  recyclingKey?: string;
};

/**
 * Bundled brand / role photos. Uses React Native Image so Expo Go works
 * without a custom dev-client rebuild (expo-image native module optional).
 */
export function BrandImage({
  source,
  style,
  contentFit = 'cover',
  accessibilityLabel,
}: Props) {
  const resizeMode: ImageResizeMode = contentFit === 'contain' ? 'contain' : 'cover';

  return (
    <Image
      source={source}
      style={style}
      resizeMode={resizeMode}
      accessibilityLabel={accessibilityLabel}
      accessibilityIgnoresInvertColors
    />
  );
}
