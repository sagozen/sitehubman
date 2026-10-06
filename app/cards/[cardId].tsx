import React from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import AppText from '@/src/components/AppText';
import AppIcon from '@/src/components/AppIcon';

const C = {
  canvas: '#000000',
  surface: '#0E0E11',
  surfaceRaised: '#141418',
  text: '#FFFFFF',
  muted: '#A1A1AA',
  textDim: '#52525B',
  accent: '#2596BE',
  border: 'rgba(255,255,255,0.06)',
};

export default function CardDetailRoute() {
  const { cardId } = useLocalSearchParams<{ cardId: string }>();

  const rows = [
    { label: 'Edit Info', icon: 'person-outline', route: '/edit-bio' },
    { label: 'Appearance', icon: 'color-palette-outline', route: '/cards/appearance' },
    { label: 'Social Links', icon: 'link-outline', route: '/cards/social-links' },
    { label: 'Design', icon: 'brush-outline', route: '/cards/design' },
    { label: 'NFC Settings', icon: 'wifi-outline', route: '/nfc/settings' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.canvas }}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <AppIcon name="chevron-back" size={22} color={C.text} />
        </Pressable>
        <AppText style={styles.title}>My Card</AppText>
        <Pressable style={styles.backBtn}>
          <AppIcon name="share-outline" size={20} color={C.muted} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Card Preview */}
        <View style={styles.cardPreview}>
          <AppText style={styles.cardName}>John Doe</AppText>
          <AppText style={styles.cardTitle}>Product Designer</AppText>
          <View style={styles.cardDivider} />
          <AppText style={styles.cardCompany}>Acme Inc.</AppText>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <AppText style={styles.statNum}>326</AppText>
            <AppText style={styles.statLabel}>NFC Taps</AppText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <AppText style={styles.statNum}>1.2k</AppText>
            <AppText style={styles.statLabel}>Profile Views</AppText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <AppText style={styles.statNum}>48</AppText>
            <AppText style={styles.statLabel}>Contacts</AppText>
          </View>
        </View>

        {/* Action rows */}
        <View style={styles.section}>
          {rows.map((row, i) => (
            <Pressable
              key={row.label}
              style={[styles.row, i < rows.length - 1 && styles.rowBorder]}
              onPress={() => router.push(row.route as any)}
            >
              <AppIcon name={row.icon as any} size={18} color={C.muted} />
              <AppText style={styles.rowLabel}>{row.label}</AppText>
              <AppIcon name="chevron-forward" size={16} color={C.textDim} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '600', color: '#FFFFFF' },
  cardPreview: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 28,
    marginTop: 12,
    marginBottom: 16,
  },
  cardName: { fontSize: 24, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.5 },
  cardTitle: { fontSize: 14, color: C.muted, marginTop: 4 },
  cardDivider: { height: 1, backgroundColor: C.border, marginVertical: 16 },
  cardCompany: { fontSize: 13, color: C.textDim },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: C.surfaceRaised,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  statBox: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, height: 32, backgroundColor: C.border },
  statNum: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  statLabel: { fontSize: 11, color: C.muted, letterSpacing: 0.3 },
  section: { backgroundColor: C.surfaceRaised, borderRadius: 16, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  rowLabel: { flex: 1, fontSize: 15, color: '#FFFFFF' },
});
