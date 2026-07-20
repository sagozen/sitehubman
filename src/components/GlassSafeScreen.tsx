import type { ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { GlassScreenBackdrop } from '@/src/components/GlassScreenBackdrop';

type Props = {
  children: ReactNode;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
  isDark?: boolean;
};

/** Standard screen shell — cool gradient canvas + transparent safe area. */
export function GlassSafeScreen({ children, edges = ['top', 'left', 'right'], style, isDark }: Props) {
  return (
    <GlassScreenBackdrop isDark={isDark}>
      <SafeAreaView style={[styles.safe, style]} edges={edges}>
        {children}
      </SafeAreaView>
    </GlassScreenBackdrop>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
