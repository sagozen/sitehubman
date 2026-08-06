/**
 * Profile Screen - Redesigned
 * Using principles from Apple Wallet, Tesla, Linear, Arc Browser, Nothing OS
 * 
 * Arc's sidebar pattern with Linear's list styling
 */

import React from 'react';
import { ScrollView, View, Text, StyleSheet, Image } from 'react-native';

import { tokens } from '@/design-system/extracted-tokens';
import { Button } from './HomeScreenRedesigned';

// ═══════════════════════════════════════════════════════════════════════════
// PROFILE SCREEN
// ═══════════════════════════════════════════════════════════════════════════

export function ProfileScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header - Apple's centered profile */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={[tokens.typography.display, { color: tokens.color.white }]}>
            JS
          </Text>
        </View>
        <Text style={[tokens.typography.title, { marginTop: tokens.spacing[4] }]}>
          John Smith
        </Text>
        <Text style={[tokens.typography.detail, { color: tokens.color.textMedium }]}>
          @johnsmith
        </Text>
      </View>

      {/* Stats - Tesla's information density */}
      <View style={styles.statsSection}>
        <StatItem label="Taps" value="1,234" />
        <StatItem label="Connections" value="42" />
        <StatItem label="Cards" value="1" />
      </View>

      {/* Settings Sections - Linear's list pattern */}
      <View style={styles.section}>
        <Text style={[tokens.typography.caption, styles.sectionTitle]}>
          ACCOUNT
        </Text>
        
        <View style={styles.list}>
          <SettingsRow title="Edit Profile" subtitle="Name, username, photo" />
          <SettingsRow title="Change Password" subtitle="Update your password" />
          <SettingsRow title="Email" subtitle="john@example.com" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[tokens.typography.caption, styles.sectionTitle]}>
          PREFERENCES
        </Text>
        
        <View style={styles.list}>
          <SettingsRow title="Notifications" subtitle="Manage alerts" />
          <SettingsRow title="Privacy" subtitle="Visibility settings" />
          <SettingsRow title="Language" subtitle="English (US)" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[tokens.typography.caption, styles.sectionTitle]}>
          SUPPORT
        </Text>
        
        <View style={styles.list}>
          <SettingsRow title="Help Center" subtitle="FAQs and guides" />
          <SettingsRow title="Contact Us" subtitle="Get in touch" />
        </View>
      </View>

      {/* Sign Out - Linear's secondary action */}
      <View style={styles.actionSection}>
        <Button label="Sign Out" variant="secondary" />
      </View>
    </ScrollView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STAT ITEM - Tesla's data display
// ═══════════════════════════════════════════════════════════════════════════

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={[tokens.typography.display, { fontWeight: '600' }]}>
        {value}
      </Text>
      <Text style={[tokens.typography.caption, { color: tokens.color.textMedium }]}>
        {label}
      </Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SETTINGS ROW - Linear's list item
// ═══════════════════════════════════════════════════════════════════════════

function SettingsRow({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.settingsRow}>
      <View style={{ flex: 1 }}>
        <Text style={[tokens.typography.body, { fontWeight: '500' }]}>
          {title}
        </Text>
        <Text style={[tokens.typography.detail, { color: tokens.color.textMedium }]}>
          {subtitle}
        </Text>
      </View>
      <Text style={[tokens.typography.body, { color: tokens.color.textLight }]}>
        →
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
  
  // Profile Header (Apple's centered profile)
  profileHeader: {
    alignItems: 'center',
    marginBottom: tokens.spacing[10],
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: tokens.color.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Stats Section (Tesla's information density)
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: tokens.spacing[10],
    paddingVertical: tokens.spacing[6],
    borderBottomWidth: 0.5,
    borderBottomColor: tokens.color.border,
  },
  statItem: {
    alignItems: 'center',
    gap: tokens.spacing[1],
  },
  
  // Section (Linear's pattern)
  section: {
    marginBottom: tokens.spacing[10],
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
  settingsRow: {
    height: 64,
    paddingHorizontal: tokens.spacing[6],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 0.5,
    borderBottomColor: tokens.color.borderLight,
  },
  
  // Action
  actionSection: {
    marginTop: tokens.spacing[8],
    marginBottom: tokens.spacing[10],
  },
});
