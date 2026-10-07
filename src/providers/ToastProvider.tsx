import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { View, StyleSheet, Platform, Pressable } from 'react-native';
import Animated, {
  FadeOutUp,
  SlideInUp,
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { AppText } from '@/src/components/AppText';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { HapticTap, Haptics } from '@/src/utils/haptics';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
  icon?: AppIconName;
}

interface ToastItem extends ToastOptions {
  id: string;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(({ message, type = 'info', duration = 2800, icon }: ToastOptions) => {
    const id = `toast_${nextId.current++}`;
    const newToast: ToastItem = { id, message, type, duration, icon };

    if (type === 'success') HapticTap.success();
    else if (type === 'error') HapticTap.error();
    else HapticTap.light();

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, duration);
    }
  }, [hideToast]);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <View style={[styles.toastContainer, { pointerEvents: 'box-none' }]}>
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={() => hideToast(t.id)} />
        ))}
      </View>
    </ToastContext.Provider>
  );
};

const ToastCard = ({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) => {
  const scale = useSharedValue(1);

  const getIconAndColor = (): { icon: AppIconName; color: string } => {
    if (toast.icon) return { icon: toast.icon, color: '#FFFFFF' };
    switch (toast.type) {
      case 'success': return { icon: 'CheckCircle', color: '#799A85' };
      case 'error': return { icon: 'AlertCircle', color: '#FF453A' };
      case 'warning': return { icon: 'AlertTriangle', color: '#FFD60A' };
      default: return { icon: 'Info', color: '#FFFFFF' };
    }
  };

  const { icon, color } = getIconAndColor();

  const handlePressIn = () => {
    scale.value = withTiming(0.96, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    Haptics.light();
    onDismiss();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={SlideInUp.springify().mass(0.6).stiffness(220).damping(18)}
      exiting={FadeOutUp.duration(180)}
      layout={Layout.springify().damping(20).stiffness(240)}
      style={[styles.toastWrapper, animatedStyle]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.pressable}
      >
        <BlurView intensity={80} tint="dark" style={styles.toastBlur}>
          <View style={[styles.iconDot, { backgroundColor: `${color}1F` }]}>
            <AppIcon name={icon} size={15} color={color} />
          </View>
          <AppText style={styles.toastMessage} weight="semibold" numberOfLines={2}>
            {toast.message}
          </AppText>
        </BlurView>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 36,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 8,
    zIndex: 99999,
  },
  toastWrapper: {
    alignSelf: 'center',
    maxWidth: 420,
    minWidth: 200,
    marginHorizontal: 16,
  },
  pressable: {
    borderRadius: 9999,
    overflow: 'hidden',
  },
  toastBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9999,
    backgroundColor: 'rgba(26, 26, 30, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  iconDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastMessage: {
    color: '#FFFFFF',
    fontSize: 13,
    letterSpacing: -0.2,
  },
});
