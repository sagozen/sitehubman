import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';

interface SocialProofStatsProps {
  /** Number of profile views today */
  viewsToday: number;
  /** Total number of users */
  totalUsers: number;
  /** Optional: custom text */
  children?: React.ReactNode;
}

/**
 * Social proof component to build trust and encourage engagement
 * Displays metrics like profile views and community size
 */
export function SocialProofStats({ viewsToday, totalUsers }: SocialProofStatsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.stat}>
        <AppIcon name="Eye" size={20} color="#007AFF" />
        <View style={styles.statText}>
          <AppText variant="caption" color="#6E6E73">
            Profile Views Today
          </AppText>
          <AppText variant="body" weight="bold" color="#0A0A0F">
            {viewsToday.toLocaleString()}
          </AppText>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.stat}>
        <AppIcon name="Users" size={20} color="#007AFF" />
        <View style={styles.statText}>
          <AppText variant="caption" color="#6E6E73">
            Professionals Network
          </AppText>
          <AppText variant="body" weight="bold" color="#0A0A0F">
            {totalUsers.toLocaleString()}+
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 24,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  statText: {
    alignItems: 'center',
    marginTop: 4,
  },
});