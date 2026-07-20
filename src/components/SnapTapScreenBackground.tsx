import type { ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { GlassScreenBackdrop } from '@/src/components/GlassScreenBackdrop';

type SnapTapScreenBackgroundProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Guest / auth shells — cool glass gradient canvas (replaces flat brand fill). */
export function SnapTapScreenBackground({ children, style }: SnapTapScreenBackgroundProps) {
  return <GlassScreenBackdrop style={style}>{children}</GlassScreenBackdrop>;
}
