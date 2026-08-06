/**
 * Production Home Screen
 * Manufacturing-grade, ship-ready screen
 * Arc Browser-inspired layout. Linear-style lists. Apple Wallet cards.
 * 
 * Rules applied:
 * - Asymmetric layout (left-aligned)
 * - Generous spacing (40-48px gaps)
 * - Typography first (70% less icons)
 * - Real proportions
 * - Clear hierarchy
 * - Functional, not decorative
 */

import React from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';

import { ProductionButton } from '@/src/components/ProductionButton';
import { ProductionCard, NfcCard } from '@/src/components/ProductionCard';
import { production } from '@/src/design-system/production';

// ═══════════════════════════════════════════════════════════════════════════
// HOME SCREEN
// ═══════════════════════════════════════════════════════════════════════════

export function ProductionHomeScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header - Left-aligned */}
      <View style={styles.header}>
        <Text style={[production.typography.display, styles.headerTitle]}>
          Cards
        </Text>
        <Pressable style={styles.headerAction}>
          <Text style={[production.typography.body, styles.actionText]}>
            + New Card
          </Text>
        </Pressable>
      </View>

      {/* Card Gallery - Horizontal scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardGallery}
      >
        <NfcCard
          name="John Smith"
          handle="johnsmith"
          cardColor="#0A0A0A"
          onPress={() => console.log('Card tapped')}
        />
        <View style={styles.cardPlaceholder}>
          <Text style={[production.typography.body, styles.placeholderText]}>
            + Add Card
          </Text>
        </View>
      </ScrollView>

      {/* Recent Activity Section */}
      <View style={styles.section}>
        <Text style={[production.typography.caption, styles.sectionTitle]}>
          RECENT ACTIVITY
        </Text>
        
        <View style={styles.list}>
          <ListItem
            title="Order #1234"
            subtitle="2 days ago"
            status="Shipped"
            statusColor={production.colors.info}
            onPress={() => console.log('Order tapped')}
          />
          <ListItem
            title="Order #1233"
            subtitle="5 days ago"
            status="Pending"
            statusColor={production.colors.warning}
            onPress={() => console.log('Order tapped')}
          />
          <ListItem
            title="Order #1232"
            subtitle="1 week ago"
            status="Delivered"
            statusColor={production.colors.success}
            onPress={() => console.log('Order tapped')}
          />
        </View>
      </View>

      {/* Quick Actions Section */}
      <View style={styles.section}>
        <Text style={[production.typography.caption, styles.sectionTitle]}>
          QUICK ACTIONS
        </Text>
        
        <View style={styles.actions}>
          <ProductionButton
            label="Order New Card"
            variant="primary"
            fullWidth
            onPress={() => console.log('Order pressed')}
          />
          <ProductionButton
            label="Activate Card"
            variant="secondary"
            fullWidth
            onPress={() => console.log('Activate pressed')}
          />
        </View>
      </View>

      {/* Stats Card */}
      <ProductionCard elevation="border">
        <View style={styles.statsGrid}>
          <StatItem label="Total Taps" value="1,234" />
          <StatItem label="Connections" value="42" />
          <StatItem label="Active Cards" value="1" />
          <StatItem label="This Month" value="89" />
        </View>
      </ProductionCard>

      {/* Bottom spacing */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LIST ITEM (Linear-inspired)
// ═══════════════════════════════════════════════════════════════════════════

interface ListItemProps {
  title: string;
  subtitle: string;
  status: string;
  statusColor: string;
  onPress: () => void;
}

function ListItem({ title, subtitle, status, statusColor, onPress }: ListItemProps) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={null}
      style={({ pressed }) => [
        styles.listItem,
        pressed && { backgroundColor: production.list.pressBackground },
      ]}
    >
      <View style={styles.listContent}>
        <View style={styles.listText}>
          <Text style={[production.typography.body, styles.listTitle]}>
            {title}
          </Text>
          <Text style={[production.typography.detail, styles.listSubtitle]}>
            {subtitle}
          </Text>
        </View>
        
        <View style={styles.listMeta}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[production.typography.detail, { color: statusColor }]}>
            {status}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STAT ITEM
// ═══════════════════════════════════════════════════════════════════════════

interface StatItemProps {
  label: string;
  value: string;
}

function StatItem({ label, value }: StatItemProps) {
  return (
    <View style={styles.statItem}>
      <Text style={[production.typography.display, styles.statValue]}>
        {value}
      </Text>
      <Text style={[production.typography.detail, styles.statLabel]}>
        {label}
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
    backgroundColor: production.colors.white,
  },
  content: {
    paddingHorizontal: production.spacing.screenX,
    paddingVertical: production.spacing.screenY,
  },
  
  // Header (Asymmetric)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: production.spacing[8],
  },
  headerTitle: {
    color: production.colors.text,
  },
  headerAction: {
    paddingVertical: production.spacing[2],
    paddingHorizontal: production.spacing[4],
  },
  actionText: {
    color: production.colors.text,
    fontWeight: '500',
  },
  
  // Card Gallery
  cardGallery: {
    paddingRight: production.spacing.screenX,
    gap: production.spacing[4],
    marginBottom: production.spacing[10], // Generous gap
  },
  cardPlaceholder: {
    width: production.card.nfcWidth,
    height: production.card.nfcHeight,
    borderRadius: production.card.radius,
    borderWidth: 2,
    borderColor: production.colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: production.colors.textMedium,
    fontWeight: '500',
  },
  
  // Section
  section: {
    marginBottom: production.spacing[10], // Generous gap
  },
  sectionTitle: {
    color: production.colors.textMedium,
    marginBottom: production.spacing[4],
  },
  
  // List (Linear-style)
  list: {
    backgroundColor: production.colors.white,
    borderRadius: production.radius.card,
    borderWidth: 0.5,
    borderColor: production.colors.border,
    overflow: 'hidden',
  },
  listItem: {
    height: production.list.itemHeight,
    paddingHorizontal: production.list.paddingX,
    justifyContent: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: production.colors.borderSubtle,
  },
  listContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listText: {
    flex: 1,
    gap: production.spacing[1],
  },
  listTitle: {
    color: production.colors.text,
    fontWeight: '500',
  },
  listSubtitle: {
    color: production.colors.textMedium,
  },
  listMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: production.spacing[2],
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  
  // Actions
  actions: {
    gap: production.spacing[3],
  },
  
  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: production.spacing[6],
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    gap: production.spacing[1],
  },
  statValue: {
    color: production.colors.text,
    fontWeight: '600',
  },
  statLabel: {
    color: production.colors.textMedium,
  },
  
  // Bottom
  bottomSpacer: {
    height: production.spacing[10],
  },
});
