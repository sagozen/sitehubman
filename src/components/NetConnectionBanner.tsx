import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { SlideInUp, SlideOutUp, Layout } from 'react-native-reanimated';
import { useNetInfo } from '@react-native-community/netinfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { tokens } from '@/src/design-system/tokens';

export function NetConnectionBanner() {
  const netInfo = useNetInfo();
  const insets = useSafeAreaInsets();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show if we explicitly know it's not connected and we've initialized
    if (netInfo.isConnected === false && netInfo.type !== 'unknown') {
      setShow(true);
    } else {
      setShow(false);
    }
  }, [netInfo.isConnected, netInfo.type]);

  if (!show) return null;

  return (
    <Animated.View
      entering={SlideInUp.springify().mass(0.5)}
      exiting={SlideOutUp.springify().mass(0.5)}
      layout={Layout.springify()}
      style={[
        styles.bannerContainer,
        { paddingTop: Math.max(insets.top, 40) },
      ]}
      pointerEvents="none"
    >
      <View style={styles.bannerContent}>
        <AppIcon name="WifiOff" size={16} color="#FFFFFF" />
        <AppText style={styles.bannerText} weight="medium">
          No Internet Connection
        </AppText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
    alignItems: 'center',
    paddingBottom: 12,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[2],
    borderRadius: 20,
    gap: tokens.spacing[2],
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
});
