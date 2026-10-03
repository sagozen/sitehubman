import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { View, StyleSheet, Platform, Pressable } from 'react-native';
import Animated, { FadeInUp, FadeOutUp, SlideInUp, SlideOutUp, Layout } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { AppText } from '@/src/components/AppText';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { HapticTap } from '@/src/utils/haptics';

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

  const showToast = useCallback(({ message, type = 'info', duration = 3000, icon }: ToastOptions) => {
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
  const getIconAndColor = (): { icon: AppIconName; color: string } => {
    if (toast.icon) return { icon: toast.icon, color: '#FFFFFF' };
    switch (toast.type) {
      case 'success': return { icon: 'CheckCircle', color: '#30D158' };
      case 'error': return { icon: 'AlertCircle', color: '#FF453A' };
      case 'warning': return { icon: 'AlertTriangle', color: '#FFD60A' };
      default: return { icon: 'Info', color: '#0A84FF' };
    }
  };

  const { icon, color } = getIconAndColor();

  return (
    <Animated.View
      entering={SlideInUp.springify().mass(0.6).stiffness(150).damping(14)}
      exiting={FadeOutUp.duration(200)}
      layout={Layout.springify()}
      style={styles.toastWrapper}
    >
      <Pressable onPress={onDismiss}>
        <BlurView intensity={85} tint="dark" style={[styles.toastBlur, { borderLeftColor: color }]}>
          <AppIcon name={icon} size={20} color={color} />
          <AppText style={styles.toastMessage} weight="bold">{toast.message}</AppText>
        </BlurView>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 55 : 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 8,
    zIndex: 9999,
  },
  toastWrapper: {
    width: '90%',
    maxWidth: 400,
  },
  toastBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  toastMessage: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
});
