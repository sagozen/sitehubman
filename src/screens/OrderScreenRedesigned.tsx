/**
 * Order Detail Screen - Redesigned
 * Using principles from Apple Wallet, Tesla, Linear, Arc Browser, Nothing OS
 * 
 * Monzo-style transaction detail with Apple's timeline
 */

import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';

import { tokens, elevation } from '@/design-system/extracted-tokens';
import { Button } from './HomeScreenRedesigned';

// ═══════════════════════════════════════════════════════════════════════════
// ORDER DETAIL SCREEN
// ═══════════════════════════════════════════════════════════════════════════

export function OrderDetailScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header - Apple's back button pattern */}
      <View style={styles.header}>
        <Text style={[tokens.typography.title, { flex: 1 }]}>
          Order #1234
        </Text>
      </View>

      {/* Status Section - Monzo's clear hierarchy */}
      <View style={styles.section}>
        <Text style={[tokens.typography.caption, styles.sectionTitle]}>
          STATUS
        </Text>
        <Text style={[tokens.typography.title, { marginBottom: tokens.spacing[4] }]}>
          In Production
        </Text>
        
        {/* Timeline - Apple's progress indicator */}
        <View style={styles.timeline}>
          <TimelineStep label="Paid" isComplete />
          <TimelineStep label="Making" isActive />
          <TimelineStep label="Shipped" />
        </View>
      </View>

      {/* Details Section - Tesla's information density */}
      <View style={styles.section}>
        <Text style={[tokens.typography.caption, styles.sectionTitle]}>
          DETAILS
        </Text>
        
        <View style={styles.card}>
          <DetailRow label="Card Type" value="Metal Black" />
          <DetailRow label="Quantity" value="1 card" />
          <DetailRow label="Total" value="$49.99" isBold />
        </View>
      </View>

      {/* Shipping Section */}
      <View style={styles.section}>
        <Text style={[tokens.typography.caption, styles.sectionTitle]}>
          SHIPPING
        </Text>
        
        <View style={styles.card}>
          <DetailRow label="Address" value="123 Main St, City" />
          <DetailRow label="Method" value="Standard Shipping" />
          <DetailRow label="Estimated" value="Jan 15-18" />
        </View>
      </View>

      {/* Action - Linear's single primary */}
      <View style={styles.actionSection}>
        <Button label="Track Shipment" variant="primary" />
      </View>
    </ScrollView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TIMELINE STEP - Apple's progress indicator
// ═══════════════════════════════════════════════════════════════════════════

function TimelineStep({ label, isComplete, isActive }: { label: string; isComplete?: boolean; isActive?: boolean }) {
  return (
    <View style={styles.timelineStep}>
      <View style={[
        styles.timelineDot,
        isComplete && { backgroundColor: tokens.color.black },
        isActive && { borderWidth: 2, borderColor: tokens.color.black, backgroundColor: tokens.color.white },
      ]} />
      <Text style={[
        tokens.typography.detail,
        { color: isComplete || isActive ? tokens.color.text : tokens.color.textLight }
      ]}>
        {label}
      </Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DETAIL ROW - Apple's left-right pattern
// ═══════════════════════════════════════════════════════════════════════════

function DetailRow({ label, value, isBold }: { label: string; value: string; isBold?: boolean }) {
  return (
    <View style={styles.detailRow}>
      <Text style={[tokens.typography.body, { color: tokens.color.textMedium }]}>
        {label}
      </Text>
      <Text style={[
        tokens.typography.body,
        isBold && { fontWeight: '600' }
      ]}>
        {value}
      </Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
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
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing[10],
  },
  
  // Section (Linear's pattern)
  section: {
    marginBottom: tokens.spacing[10],
  },
  sectionTitle: {
    color: tokens.color.textMedium,
    marginBottom: tokens.spacing[4],
  },
  
  // Timeline (Apple's progress)
  timeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelineStep: {
    alignItems: 'center',
    flex: 1,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: tokens.color.border,
    marginBottom: tokens.spacing[2],
  },
  
  // Card (Apple Wallet style)
  card: {
    borderRadius: tokens.card.radius,
    padding: tokens.card.padding,
    backgroundColor: tokens.color.surface,
    borderWidth: 0.5,
    borderColor: tokens.color.border,
    gap: tokens.spacing[4],
  },
  
  // Detail Row (Apple's left-right pattern)
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  // Action Section
  actionSection: {
    marginTop: tokens.spacing[8],
  },
});
