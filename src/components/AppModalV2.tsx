/**
 * AppModalV2 — Premium SaaS Quality Modal & Sheet Component
 * Supports both bottom sheet and centered dialog presentations.
 */
import React, { memo, type PropsWithChildren, type ReactNode } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  Platform,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/src/components/AppIcon';
import { tokens } from '@/src/design-system/tokens';
import { getColor, type ColorMode } from '@/src/design-system/utilities';
import { usePreferences } from '@/src/hooks/usePreferences';
import { HapticTap } from '@/src/utils/haptics';

export interface AppModalV2Props {
  visible: boolean;
  onClose: () => void;
  type?: 'sheet' | 'dialog';
  title?: string;
  headerRight?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

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

  const handleClose = () => {
    HapticTap.light();
    onClose();
  };

  const isSheet = type === 'sheet';

  return (
    <Modal
      transparent
      animationType={isSheet ? 'slide' : 'fade'}
      visible={visible}
      onRequestClose={handleClose}
    >
      <Pressable
        style={[
          styles.backdrop,
          isSheet ? styles.sheetBackdrop : styles.dialogBackdrop,
        ]}
        onPress={handleClose}
      >
        <Pressable
          style={[
            isSheet ? styles.sheetPanel : styles.dialogPanel,
            {
              backgroundColor: getColor('surface', mode),
              borderColor: getColor('border', mode),
              paddingBottom: isSheet ? Math.max(insets.bottom, tokens.spacing[4]) : tokens.spacing[4],
            },
            style,
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {isSheet && (
            <View style={styles.handleContainer}>
              <View
                style={[
                  styles.handle,
                  { backgroundColor: getColor('border', mode) },
                ]}
              />
            </View>
          )}

          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  sheetBackdrop: {
    justifyContent: 'flex-end',
  },
  dialogBackdrop: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing[4],
  },
  sheetPanel: {
    width: '100%',
    maxHeight: '85%',
    borderTopLeftRadius: tokens.radius['2xl'],
    borderTopRightRadius: tokens.radius['2xl'],
    borderTopWidth: 1,
    paddingHorizontal: tokens.spacing[4],
    paddingTop: tokens.spacing[2],
  },
  dialogPanel: {
    width: '100%',
    maxWidth: 480,
    borderRadius: tokens.radius.xl,
    borderWidth: 1,
    padding: tokens.spacing[5],
  },
  handleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: tokens.spacing[2],
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
});

export const AppModalV2 = memo(AppModalV2Raw);
