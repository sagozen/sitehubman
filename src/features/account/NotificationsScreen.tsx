import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { IosScrollView } from '@/src/components/IosScrollView';
import { HapticTap } from '@/src/utils/haptics';

const C = {
  canvas: '#0D0D0E',
  surface: '#242424',
  border: 'rgba(255,255,255,0.09)',
  text: '#F5F5F7',
  muted: '#9A9AA0',
  accent: '#799A85',
} as const;

interface ToggleRow {
  key: string;
  label: string;
  subtitle: string;
}

interface Section {
  title: string;
  rows: ToggleRow[];
}

const SECTIONS: Section[] = [
  {
    title: 'Orders',
    rows: [
      { key: 'order_updates', label: 'Order updates', subtitle: 'Status changes for your orders' },
      { key: 'shipping_alerts', label: 'Shipping alerts', subtitle: 'When your package ships' },
      { key: 'delivery_confirmation', label: 'Delivery confirmation', subtitle: 'When your order arrives' },
    ],
  },
  {
    title: 'Activity',
    rows: [
      { key: 'nfc_tap', label: 'NFC tap alerts', subtitle: 'When someone taps your card' },
      { key: 'profile_views', label: 'Profile view summary', subtitle: 'Daily digest of profile views' },
      { key: 'weekly_analytics', label: 'Weekly analytics', subtitle: 'Performance summary every Sunday' },
    ],
  },
  {
    title: 'Marketing',
    rows: [
      { key: 'product_announcements', label: 'Product announcements', subtitle: 'New features and releases' },
      { key: 'tips_features', label: 'Tips & features', subtitle: 'How to get more from SiteHubMan' },
    ],
  },
];

const DEFAULT_STATE: Record<string, boolean> = {
  order_updates: true,
  shipping_alerts: true,
  delivery_confirmation: true,
  nfc_tap: true,
  profile_views: false,
  weekly_analytics: false,
  product_announcements: false,
  tips_features: false,
};

export default function NotificationsScreen() {
  const router = useRouter();
  const [toggles, setToggles] = useState<Record<string, boolean>>(DEFAULT_STATE);

  const handleToggle = useCallback((key: string) => {
    HapticTap.softConfirmation();
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleSave = useCallback(() => {
    HapticTap.confidentClick();
    Alert.alert('Saved', 'Notification preferences updated.');
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <AppIcon name="ChevronLeft" size={22} color={C.text} />
        </Pressable>
        <AppText variant="title3" style={styles.headerTitle}>Notifications</AppText>
        <View style={styles.backBtn} />
      </View>

      <IosScrollView contentContainerStyle={styles.content}>
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <AppText variant="caption" muted style={styles.sectionLabel}>
              {section.title.toUpperCase()}
            </AppText>
            <View style={styles.card}>
              {section.rows.map((row, idx) => (
                <React.Fragment key={row.key}>
                  <Pressable
                    style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                    onPress={() => handleToggle(row.key)}
                    hitSlop={4}
                  >
                    <View style={styles.rowText}>
                      <AppText variant="body" style={styles.rowLabel}>{row.label}</AppText>
                      <AppText variant="caption" muted style={styles.rowSub}>{row.subtitle}</AppText>
                    </View>
                    <View style={[styles.toggle, toggles[row.key] && styles.toggleOn]}>
                      <View style={[styles.toggleThumb, toggles[row.key] && styles.toggleThumbOn]} />
                    </View>
                  </Pressable>
                  {idx < section.rows.length - 1 && <View style={styles.divider} />}
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}

        {/* Save button */}
        <Pressable
          style={({ pressed }) => [styles.saveBtn, pressed && styles.saveBtnPressed]}
          onPress={handleSave}
          hitSlop={8}
        >
          <AppText style={styles.saveBtnText}>Save</AppText>
        </Pressable>
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.canvas },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  headerTitle: { color: C.text, fontWeight: '600' },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 130 },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 11, letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 },
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowPressed: { backgroundColor: 'rgba(255,255,255,0.04)' },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { color: C.text, fontSize: 15 },
  rowSub: { color: C.muted, fontSize: 13 },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleOn: { backgroundColor: C.accent },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  toggleThumbOn: { alignSelf: 'flex-end' },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.border,
    marginLeft: 16,
  },
  saveBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveBtnPressed: { opacity: 0.85 },
  saveBtnText: { color: '#000', fontWeight: '700', fontSize: 16 },
});
