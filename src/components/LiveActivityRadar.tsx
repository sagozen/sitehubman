/**
 * LiveActivityRadar.tsx — Barclays Financial Ledger Edition for AVIO Executive Workspace.
 *
 * Replaces ambient decorative pulses with a crisp, institutional activity ledger:
 *  - Timeline Grouping (TODAY / THIS WEEK)
 *  - Financial-style green status pills (+1 Lead, Saved, Verified)
 *  - Flat charcoal card container with 1px translucent borders
 *  - 120fps hardware accelerated interactions
 */
import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { HapticTap } from '@/src/utils/haptics';

interface LedgerItem {
  id: string;
  group: 'TODAY' | 'THIS WEEK';
  type: 'nfc_tap' | 'lead_saved' | 'wallet_scan' | 'vcard_download';
  title: string;
  subtitle: string;
  statusBadge: string;
  statusColor: string;
  timeAgo: string;
  icon: 'Nfc' | 'Users' | 'CreditCard' | 'UserPlus';
}

const LEDGER_ACTIVITIES: LedgerItem[] = [
  {
    id: '1',
    group: 'TODAY',
    type: 'nfc_tap',
    title: 'Verified Smart Pass Tap',
    subtitle: 'NFC Beam · Executive Titanium',
    statusBadge: '+ 1 Lead',
    statusColor: '#30D158',
    timeAgo: '12m ago',
    icon: 'Nfc',
  },
  {
    id: '2',
    group: 'TODAY',
    type: 'lead_saved',
    title: 'Sarah Jenkins',
    subtitle: 'Partner @ Apex Capital · Exchanged',
    statusBadge: 'Saved',
    statusColor: '#0A84FF',
    timeAgo: '1h ago',
    icon: 'Users',
  },
  {
    id: '3',
    group: 'THIS WEEK',
    type: 'wallet_scan',
    title: 'Apple Wallet Pass',
    subtitle: 'PassKit Scan · Singapore Summit',
    statusBadge: 'Verified',
    statusColor: '#FFD60A',
    timeAgo: '1d ago',
    icon: 'CreditCard',
  },
  {
    id: '4',
    group: 'THIS WEEK',
    type: 'vcard_download',
    title: 'vCard 3.0 Exported',
    subtitle: 'Direct Contact Import',
    statusBadge: 'Completed',
    statusColor: 'rgba(255, 255, 255, 0.7)',
    timeAgo: '3d ago',
    icon: 'UserPlus',
  },
];

interface LiveActivityRadarProps {
  onPressItem?: (item: LedgerItem) => void;
  totalTaps?: number;
  totalViews?: number;
}

export function LiveActivityRadar({
  onPressItem,
  totalTaps = 0,
  totalViews = 0,
}: LiveActivityRadarProps) {
  const todayItems = LEDGER_ACTIVITIES.filter((a) => a.group === 'TODAY');
  const thisWeekItems = LEDGER_ACTIVITIES.filter((a) => a.group === 'THIS WEEK');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <AppText style={styles.headerTitle} weight="extrabold">ACTIVITY LEDGER</AppText>
        </View>
        <View style={styles.liveAuditPill}>
          <View style={styles.liveDot} />
          <AppText style={styles.liveAuditText} weight="bold">LIVE AUDIT</AppText>
        </View>
      </View>

      {/* Main Ledger Card */}
      <View style={styles.ledgerCard}>
        {/* TODAY Section */}
        <View style={styles.groupHeader}>
          <AppText style={styles.groupTitle} weight="bold">TODAY</AppText>
        </View>
        {todayItems.map((item, idx) => (
          <Pressable
            key={item.id}
            onPress={() => {
              HapticTap.light();
              onPressItem?.(item);
            }}
            style={({ pressed }) => [
              styles.row,
              idx === todayItems.length - 1 && styles.rowLastInGroup,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.iconCircle}>
              <AppIcon name={item.icon} size={15} color="#FFFFFF" />
            </View>
            <View style={styles.metaCol}>
              <AppText style={styles.rowTitle} weight="bold">{item.title}</AppText>
              <AppText style={styles.rowSub}>{item.subtitle}</AppText>
            </View>
            <View style={styles.rightCol}>
              <View style={[styles.statusBadge, { borderColor: item.statusColor }]}>
                <AppText style={[styles.statusText, { color: item.statusColor }]} weight="bold">
                  {item.statusBadge}
                </AppText>
              </View>
              <AppText style={styles.timeText}>{item.timeAgo}</AppText>
            </View>
          </Pressable>
        ))}

        {/* THIS WEEK Section */}
        <View style={[styles.groupHeader, styles.groupHeaderSubsequent]}>
          <AppText style={styles.groupTitle} weight="bold">THIS WEEK</AppText>
        </View>
        {thisWeekItems.map((item, idx) => (
          <Pressable
            key={item.id}
            onPress={() => {
              HapticTap.light();
              onPressItem?.(item);
            }}
            style={({ pressed }) => [
              styles.row,
              idx === thisWeekItems.length - 1 && styles.rowLast,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.iconCircle}>
              <AppIcon name={item.icon} size={15} color="#FFFFFF" />
            </View>
            <View style={styles.metaCol}>
              <AppText style={styles.rowTitle} weight="bold">{item.title}</AppText>
              <AppText style={styles.rowSub}>{item.subtitle}</AppText>
            </View>
            <View style={styles.rightCol}>
              <View style={[styles.statusBadge, { borderColor: item.statusColor }]}>
                <AppText style={[styles.statusText, { color: item.statusColor }]} weight="bold">
                  {item.statusBadge}
                </AppText>
              </View>
              <AppText style={styles.timeText}>{item.timeAgo}</AppText>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  headerLeft: {},
  headerTitle: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 11,
    letterSpacing: 0.8,
  },
  liveAuditPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(48, 209, 88, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.25)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#30D158',
  },
  liveAuditText: {
    color: '#30D158',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  ledgerCard: {
    backgroundColor: '#111114',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  groupHeader: {
    backgroundColor: '#0A0A0C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  groupHeaderSubsequent: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  groupTitle: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 10,
    letterSpacing: 0.8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  rowLastInGroup: {
    borderBottomWidth: 0,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  pressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#18181C',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaCol: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  rowSub: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 11,
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 3,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  statusText: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
  timeText: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 10,
  },
});
