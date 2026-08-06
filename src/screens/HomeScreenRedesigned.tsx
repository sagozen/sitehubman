/**
 * Home Screen - Redesigned
 * Using only principles extracted from Apple Wallet, Tesla, Linear, Arc Browser, Nothing OS
 * 
 * No invention. No Dribbble. Real product design.
 */

import React from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, withSpring } from 'react-native-reanimated';

import { tokens, elevation } from '@/design-system/extracted-tokens';

// ═══════════════════════════════════════════════════════════════════════════
// HOME SCREEN
// ═══════════════════════════════════════════════════════════════════════════

export function HomeScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header - Linear's left-aligned pattern */}
      <View style={styles.header}>
        <Text style={[tokens.typography.display, styles.title]}>
          Cards
        </Text>
        <Pressable style={styles.headerAction}>
          <Text style={[tokens.typography.body, { fontWeight: '500' }]}>
            + New Card
          </Text>
        </Pressable>
      </View>

      {/* Card Gallery - Apple Wallet horizontal scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.gallery}
      >
        <NfcCard name="John Smith" handle="johnsmith" />
        <View style={styles.cardPlaceholder}>
          <Text style={[tokens.typography.body, { color: tokens.color.textMedium }]}>
            Add Card
          </Text>
        </View>
      </ScrollView>

      {/* Recent Activity - Linear's section pattern */}
      <View style={styles.section}>
        <Text style={[tokens.typography.caption, styles.sectionTitle]}>
          RECENT ACTIVITY
        </Text>
        
        <View style={styles.list}>
          <ListItem
            title="Order #1234"
            subtitle="2 days ago"
            status="Shipped"
            color={tokens.color.info}
          />
          <ListItem
            title="Order #1233"
            subtitle="5 days ago"
            status="Pending"
            color={tokens.color.warning}
          />
          <ListItem
            title="Order #1232"
            subtitle="1 week ago"
            status="Delivered"
            color={tokens.color.success}
          />
        </View>
      </View>

      {/* Quick Actions - Tesla's button hierarchy */}
      <View style={styles.section}>
        <Text style={[tokens.typography.caption, styles.sectionTitle]}>
          QUICK ACTIONS
        </Text>
        
        <View style={styles.actions}>
          <Button label="Order New Card" variant="primary" />
          <Button label="Activate Card" variant="secondary" />
        </View>
      </View>

      {/* Stats - Apple Wallet card style */}
      <View style={styles.card}>
        <View style={styles.statsGrid}>
          <Stat label="Total Taps" value="1,234" />
          <Stat label="Connections" value="42" />
          <Stat label="Active Cards" value="1" />
          <Stat label="This Month" value="89" />
        </View>
      </View>
    </ScrollView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// NFC CARD - Apple Wallet + Tesla minimalist
// ═══════════════════════════════════════════════════════════════════════════

function NfcCard({ name, handle }: { name: string; handle: string }) {
  const scale = useSharedValue(1);
  
  const handlePressIn = () => {
    scale.value = withTiming(0.99, { duration: tokens.duration.fast });
  };
  
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.nfcCard, elevation.medium, animatedStyle]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{ flex: 1, justifyContent: 'space-between', padding: tokens.card.padding }}
      >
        {/* NFC indicator - Tesla's minimal icon */}
        <View style={styles.nfcIcon}>
          <View style={styles.nfcDot} />
        </View>
        
        {/* Card info - Apple's bottom-left placement */}
        <View style={styles.nfcInfo}>
          <Text style={[tokens.typography.body, { color: '#FFF', fontWeight: '500' }]}>
            {name}
          </Text>
          <Text style={[tokens.typography.detail, { color: 'rgba(255,255,255,0.6)' }]}>
            @{handle}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LIST ITEM - Linear's 64px height
// ═══════════════════════════════════════════════════════════════════════════

function ListItem({ 
  title, 
  subtitle, 
  status, 
  color 
}: { 
  title: string; 
  subtitle: string; 
  status: string; 
  color: string;
}) {
  return (
    <Pressable style={styles.listItem}>
      <View style={styles.listContent}>
        {/* Left: Title + Subtitle */}
        <View style={{ flex: 1 }}>
          <Text style={[tokens.typography.body, { fontWeight: '500' }]}>
            {title}
          </Text>
          <Text style={[tokens.typography.detail, { color: tokens.color.textMedium }]}>
            {subtitle}
          </Text>
        </View>
        
        {/* Right: Status with dot */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: color }]} />
          <Text style={[tokens.typography.detail, { color }]}>
            {status}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BUTTON - Linear's clear hierarchy
// ═══════════════════════════════════════════════════════════════════════════

export function Button({ label, variant = 'primary' }: { label: string; variant?: 'primary' | 'secondary' }) {
  const scale = useSharedValue(1);
  
  const handlePressIn = () => {
    scale.value = withTiming(0.98, { duration: tokens.duration.fast });
  };
  
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const buttonStyle = variant === 'primary' 
    ? { backgroundColor: tokens.color.black }
    : { backgroundColor: tokens.color.surfaceSecondary };
  
  const textColor = variant === 'primary' 
    ? tokens.color.white 
    : tokens.color.black;

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.button, buttonStyle]}
      >
        <Text style={[tokens.typography.body, { color: textColor, fontWeight: '500' }]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STAT - Tesla's information density
// ═══════════════════════════════════════════════════════════════════════════

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={[tokens.typography.display, { fontWeight: '600' }]}>
        {value}
      </Text>
      <Text style={[tokens.typography.detail, { color: tokens.color.textMedium }]}>
        {label}
      </Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES (Using only extracted tokens)
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.color.white,
  },
  content: {
    paddingHorizontal: tokens.spacing.screenX,
    paddingVertical: tokens.spacing.screenY,
  },
  
  // Header (Linear's left-aligned pattern)
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing[8], // 32px (Linear's gap)
  },
  title: {
    color: tokens.color.text,
  },
  headerAction: {
    paddingVertical: tokens.spacing[2],
    paddingHorizontal: tokens.spacing[4],
  },
  
  // Card Gallery (Apple Wallet horizontal)
  gallery: {
    paddingRight: tokens.spacing.screenX,
    gap: tokens.spacing[4],
    marginBottom: tokens.spacing[10], // 40px (Linear's section gap)
  },
  
  // NFC Card (Apple Wallet dimensions)
  nfcCard: {
    width: tokens.card.nfc.width,
    height: tokens.card.nfc.height,
    borderRadius: tokens.card.radius,
    backgroundColor: tokens.color.black,
  },
  nfcIcon: {
    alignSelf: 'flex-end',
  },
  nfcDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  nfcInfo: {
    gap: tokens.spacing[1],
  },
  
  // Card placeholder (Nothing's minimal style)
  cardPlaceholder: {
    width: tokens.card.nfc.width,
    height: tokens.card.nfc.height,
    borderRadius: tokens.card.radius,
    borderWidth: 1.5,
    borderColor: tokens.color.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Section (Linear's pattern)
  section: {
    marginBottom: tokens.spacing[10], // 40px gaps
  },
  sectionTitle: {
    color: tokens.color.textMedium,
    marginBottom: tokens.spacing[4],
  },
  
  // List (Linear's 64px height)
  list: {
    borderRadius: tokens.radius.card,
    borderWidth: 0.5,
    borderColor: tokens.color.border,
    overflow: 'hidden',
  },
  listItem: {
    height: tokens.list.itemHeight, // 64px (Linear standard)
    paddingHorizontal: tokens.list.paddingX,
    borderBottomWidth: 0.5,
    borderBottomColor: tokens.color.borderLight,
    justifyContent: 'center',
  },
  listContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  
  // Actions (Tesla's hierarchy)
  actions: {
    gap: tokens.spacing[3],
  },
  
  // Button (Linear's clear hierarchy)
  button: {
    height: tokens.button.height,
    borderRadius: tokens.button.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Card (Apple Wallet style)
  card: {
    borderRadius: tokens.card.radius,
    padding: tokens.card.padding,
    backgroundColor: tokens.color.surface,
    borderWidth: 0.5,
    borderColor: tokens.color.border,
  },
  
  // Stats (Tesla's information density)
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing[6],
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    gap: tokens.spacing[1],
  },
});
