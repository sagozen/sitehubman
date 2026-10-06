/**
 * Skeleton Loader Components
 * 
 * Content-aware loading skeletons for better perceived performance
 * Replace generic ActivityIndicator with these
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { theme } from '@/src/constants/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Base Skeleton component with shimmer animation
 */
export function Skeleton({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

/**
 * Order Card Skeleton
 */
export function OrderCardSkeleton() {
  return (
    <View style={styles.orderCard}>
      <View style={styles.orderCardHeader}>
        <Skeleton width={120} height={16} />
        <Skeleton width={60} height={24} borderRadius={12} />
      </View>
      <Skeleton width="100%" height={14} style={{ marginTop: 12 }} />
      <Skeleton width="70%" height={14} style={{ marginTop: 8 }} />
      <View style={styles.orderCardFooter}>
        <Skeleton width={80} height={12} />
        <Skeleton width={100} height={12} />
      </View>
    </View>
  );
}

/**
 * Card List Skeleton (for design library, saved cards)
 */
export function CardListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.cardList}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.cardListItem}>
          <Skeleton width={80} height={120} borderRadius={12} />
          <View style={styles.cardListInfo}>
            <Skeleton width={150} height={18} />
            <Skeleton width={100} height={14} style={{ marginTop: 8 }} />
            <Skeleton width={80} height={12} style={{ marginTop: 8 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * Profile Header Skeleton
 */
export function ProfileHeaderSkeleton() {
  return (
    <View style={styles.profileHeader}>
      <Skeleton width={100} height={100} borderRadius={50} />
      <Skeleton width={180} height={24} style={{ marginTop: 16 }} />
      <Skeleton width={140} height={14} style={{ marginTop: 8 }} />
      <View style={styles.profileStats}>
        <Skeleton width={60} height={40} borderRadius={8} />
        <Skeleton width={60} height={40} borderRadius={8} />
        <Skeleton width={60} height={40} borderRadius={8} />
      </View>
    </View>
  );
}

/**
 * NFC Tag List Skeleton
 */
export function NfcTagListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View style={styles.tagList}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.tagItem}>
          <View style={styles.tagItemHeader}>
            <Skeleton width={120} height={16} />
            <Skeleton width={70} height={20} borderRadius={10} />
          </View>
          <Skeleton width="100%" height={12} style={{ marginTop: 10 }} />
          <Skeleton width="60%" height={12} style={{ marginTop: 6 }} />
        </View>
      ))}
    </View>
  );
}

/**
 * Analytics Dashboard Skeleton
 */
export function AnalyticsSkeleton() {
  return (
    <View style={styles.analytics}>
      <View style={styles.analyticsStats}>
        <View style={styles.statCard}>
          <Skeleton width={40} height={40} borderRadius={20} />
          <Skeleton width={60} height={24} style={{ marginTop: 12 }} />
          <Skeleton width={80} height={12} style={{ marginTop: 4 }} />
        </View>
        <View style={styles.statCard}>
          <Skeleton width={40} height={40} borderRadius={20} />
          <Skeleton width={60} height={24} style={{ marginTop: 12 }} />
          <Skeleton width={80} height={12} style={{ marginTop: 4 }} />
        </View>
        <View style={styles.statCard}>
          <Skeleton width={40} height={40} borderRadius={20} />
          <Skeleton width={60} height={24} style={{ marginTop: 12 }} />
          <Skeleton width={80} height={12} style={{ marginTop: 4 }} />
        </View>
      </View>
      <Skeleton width="100%" height={200} borderRadius={16} style={{ marginTop: 20 }} />
    </View>
  );
}

/**
 * List Skeleton (generic)
 */
export function ListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.listItem}>
          <Skeleton width={48} height={48} borderRadius={24} />
          <View style={styles.listItemContent}>
            <Skeleton width="70%" height={16} />
            <Skeleton width="50%" height={12} style={{ marginTop: 8 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: theme.colors.surface,
  },
  orderCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cardList: {
    gap: 16,
  },
  cardListItem: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  cardListInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  profileStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
  },
  tagList: {
    gap: 12,
  },
  tagItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  tagItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  analytics: {
    paddingVertical: 20,
  },
  analyticsStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  list: {
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  listItemContent: {
    flex: 1,
  },
});
