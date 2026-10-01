import React, { useEffect, useState, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import * as Haptics from 'expo-haptics';

export function OfflineStateBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);
  const slideAnim = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleOnline = () => {
        setIsOffline(false);
        setShowReconnected(true);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => setShowReconnected(false), 3000);
      };

      const handleOffline = () => {
        setIsOffline(true);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Check initial state
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setIsOffline(true);
      }

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  useEffect(() => {
    if (isOffline || showReconnected) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -60,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [isOffline, showReconnected, slideAnim]);

  if (!isOffline && !showReconnected) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        isOffline ? styles.bannerOffline : styles.bannerOnline,
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.content}>
        <AppIcon
          name={isOffline ? 'WifiOff' : 'Wifi'}
          size={16}
          color="#FFFFFF"
        />
        <AppText style={styles.bannerText}>
          {isOffline
            ? 'Offline Mode — Profile edits & NFC writes paused to prevent data loss'
            : 'Connection Restored — Cloud sync active'}
        </AppText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
  },
  bannerOffline: {
    backgroundColor: '#D97706', // Amber-600
  },
  bannerOnline: {
    backgroundColor: '#059669', // Emerald-600
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: 600,
    width: '100%',
    justifyContent: 'center',
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
});
