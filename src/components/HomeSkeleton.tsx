import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function HomeSkeleton() {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        
        {/* Profile Header Skeleton */}
        <View style={styles.profileHeader}>
          <Animated.View style={[styles.avatar, { opacity: pulseAnim }]} />
          <View style={styles.profileCopy}>
            <Animated.View style={[styles.lineMuted, { width: 80, opacity: pulseAnim }]} />
            <Animated.View style={[styles.lineBold, { width: 140, opacity: pulseAnim }]} />
            <Animated.View style={[styles.lineMuted, { width: 110, opacity: pulseAnim }]} />
          </View>
          <View style={styles.headerActions}>
            <Animated.View style={[styles.headerActionCircle, { opacity: pulseAnim }]} />
            <Animated.View style={[styles.headerActionCircle, { opacity: pulseAnim }]} />
          </View>
        </View>

        {/* NFC Card Stage Skeleton */}
        <Animated.View style={[styles.cardStage, { opacity: pulseAnim }]} />

        {/* Share Button Skeleton */}
        <Animated.View style={[styles.shareButton, { opacity: pulseAnim }]} />

        {/* Quick Action Strip Skeleton */}
        <Animated.View style={[styles.actionStrip, { opacity: pulseAnim }]} />

        {/* Recent Activity Section Skeleton */}
        <View style={styles.section}>
          <Animated.View style={[styles.sectionTitle, { opacity: pulseAnim }]} />
          <Animated.View style={[styles.activityList, { opacity: pulseAnim }]} />
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  } as ViewStyle,
  content: {
    paddingHorizontal: 24,
    paddingTop: 10,
    gap: 24,
  } as ViewStyle,
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 4,
  } as ViewStyle,
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E5E7EB',
  } as ViewStyle,
  profileCopy: {
    flex: 1,
    gap: 6,
  } as ViewStyle,
  lineBold: {
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  } as ViewStyle,
  lineMuted: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F3F4F6',
  } as ViewStyle,
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  } as ViewStyle,
  headerActionCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
  } as ViewStyle,
  cardStage: {
    width: '100%',
    aspectRatio: 1.586,
    borderRadius: 28,
    backgroundColor: '#E5E7EB',
  } as ViewStyle,
  shareButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E5E7EB',
  } as ViewStyle,
  actionStrip: {
    width: '100%',
    height: 76,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
  } as ViewStyle,
  section: {
    gap: 14,
    marginTop: 4,
  } as ViewStyle,
  sectionTitle: {
    width: 140,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E5E7EB',
  } as ViewStyle,
  activityList: {
    width: '100%',
    height: 160,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
  } as ViewStyle,
});
