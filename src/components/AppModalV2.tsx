/**
 * AppModalV2 — iOS-Native Bottom Sheet & Modal Component
 * Matches Apple Wallet / Stripe sheet presentation standards:
 * - Fluid spring entrance / exit
 * - Dimmed backdrop with tap-to-dismiss
 * - Rounded top corners (28px), solid dark canvas (#18181A / #242424)
 * - Grab bar with responsive swipe-down gesture or close
 * - Haptic feedback
 */
import React, { memo, useEffect, useCallback, type PropsWithChildren, type ReactNode } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  PanResponder,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

import { tokens } from '@/src/design-system/tokens';
import { getColor, type ColorMode } from '@/src/design-system/utilities';
import { usePreferences } from '@/src/hooks/usePreferences';
import { Haptics } from '@/src/utils/haptics';

export interface AppModalV2Props {
  visible: boolean;
  onClose: () => void;
  type?: 'sheet' | 'dialog';
  title?: string;
  headerRight?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

// Apple HIG sheet spring physics
const SPRING_IN = { damping: 24, stiffness: 200, mass: 0.85 };
const SPRING_OUT = { damping: 20, stiffness: 240, mass: 0.8 };

function AppModalV2Raw({
  visible,
  onClose,
  type = 'sheet',
  title,
  headerRight,
  style,
  children,
}: PropsWithChildren<AppModalV2Props>) {
  const insets = useSafeAreaInsets();
  const { isDark } = usePreferences();
  const mode: ColorMode = isDark ? 'dark' : 'light';
  const isSheet = type === 'sheet';

  const translateY = useSharedValue(600);
  const opacity = useSharedValue(0);

  const finishClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleClose = useCallback(() => {
    Haptics.light();
    opacity.value = withTiming(0, { duration: 180 });
    translateY.value = withTiming(isSheet ? 600 : 80, { duration: 200 }, (finished) => {
      if (finished) {
        runOnJS(finishClose)();
      }
    });
  }, [isSheet, opacity, translateY, finishClose]);

  useEffect(() => {
    if (visible) {
      Haptics.selection();
      translateY.value = isSheet ? 600 : 40;
      opacity.value = 0;
      translateY.value = withSpring(0, SPRING_IN);
      opacity.value = withTiming(1, { duration: 220 });
    }
  }, [visible, isSheet, translateY, opacity]);

  // Swipe-down pan responder for sheet grab bar
  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 5,
        onPanResponderMove: (_, gesture) => {
          if (gesture.dy > 0) {
            translateY.value = gesture.dy;
          }
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > 120 || gesture.vy > 0.8) {
            handleClose();
          } else {
            translateY.value = withSpring(0, SPRING_IN);
          }
        },
      }),
    [handleClose, translateY]
  );

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: isSheet ? 1 : opacity.value,
  }));

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        {/* Dimmed backdrop */}
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        {/* Modal / Sheet Panel */}
        <Animated.View
          style={[
            isSheet ? styles.sheetPanel : styles.dialogPanel,
            {
              backgroundColor: isDark ? '#1C1C1E' : getColor('surface', mode),
              paddingBottom: isSheet ? Math.max(insets.bottom, 16) : 16,
            },
            sheetStyle,
            style,
          ]}
        >
          {isSheet && (
            <View {...panResponder.panHandlers} style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>
          )}

          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  sheetPanel: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    maxHeight: '90%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomWidth: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 20,
  },
  dialogPanel: {
    width: '90%',
    maxWidth: 440,
    alignSelf: 'center',
    marginVertical: 'auto',
    borderRadius: 24,
    padding: tokens.spacing[5],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 20,
  },
  handleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    width: 38,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
});

export const AppModalV2 = memo(AppModalV2Raw);
