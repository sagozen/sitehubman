import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { IosScrollView } from '@/src/components/IosScrollView';
import { appRoutes } from '@/src/constants/navigation';
import { useAuth } from '@/src/hooks/useAuth';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { HapticTap } from '@/src/utils/haptics';

const FB_BG = '#F0F2F5';
const FB_CARD = '#FFFFFF';
const FB_TEXT = '#050505';
const FB_MUTED = '#65676B';
const FB_BORDER = '#CED0D4';
const FB_BLUE = '#1877F2';

export function SettingsScreen() {
  const { signOutUser, user } = useAuth();
  const isGuest = useIsGuest();

  const initial = (user?.displayName?.trim() || 'S')[0].toUpperCase();

  const handleSignOut = async () => {
    HapticTap.selection();
    try {
      await signOutUser();
      router.replace(appRoutes.login);
    } catch {
      Alert.alert('Error', 'Unable to sign out.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <AppText style={styles.headerTitle}>Menu</AppText>
      </View>

      <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <AppText style={styles.avatarText}>{initial}</AppText>
            </View>
            <View style={styles.profileInfo}>
              <AppText style={styles.profileName}>{user?.displayName ?? 'Guest User'}</AppText>
              <AppText style={styles.profileSub}>See your profile</AppText>
            </View>
          </View>
        </View>

        {/* Accounts Center Replica */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <AppText style={styles.cardTitle}>Accounts Center</AppText>
            <AppText style={styles.cardSub}>Manage your connected experiences and account settings.</AppText>
          </View>
          <FbRow title="Personal details" onPress={() => router.push('/edit-bio')} />
          <FbRow title="Password and security" />
          <FbRow title="Ad preferences" last />
          <Pressable style={styles.seeMoreBtn}>
            <AppText style={styles.seeMoreText}>See more in Accounts Center</AppText>
          </Pressable>
        </View>

        {/* Studio & Creation */}
        <AppText style={styles.sectionHeading}>Studio & Design</AppText>
        <View style={styles.card}>
          <FbRow title="Card Studio" subtitle="Design your NFC card" onPress={() => router.push(appRoutes.studio as any)} />
          <FbRow title="My Drafts" subtitle="Continue working" onPress={() => router.push('/drafts' as any)} />
          <FbRow title="Marketing Showcase" subtitle="Premium previews" onPress={() => router.push('/promotional-preview')} last />
        </View>

        {/* Network & Activity */}
        <AppText style={styles.sectionHeading}>Network & Activity</AppText>
        <View style={styles.card}>
          <FbRow title="People & Connections" onPress={() => router.push(appRoutes.customerConnections)} />
          <FbRow title="Orders & Tracking" onPress={() => router.push(isGuest ? appRoutes.guestTrackOrder : appRoutes.customer.orders)} />
          <FbRow title="Analytics & Signals" onPress={() => router.push(isGuest ? appRoutes.guestAnalytics : appRoutes.customerAnalysis)} last />
        </View>

        {/* Preferences */}
        <AppText style={styles.sectionHeading}>Preferences</AppText>
        <View style={styles.card}>
          <FbRow title="Language and region" onPress={() => router.push('/language-picker')} />
          <FbRow title="Dark mode" />
          <FbRow title="Profile theme" onPress={() => router.push('/theme-picker')} last />
        </View>

        {/* Legal & Account */}
        <AppText style={styles.sectionHeading}>Legal & Policies</AppText>
        <View style={styles.card}>
          <FbRow title="Terms of Service" onPress={() => router.push('/terms-of-service')} />
          <FbRow title="Privacy Policy" onPress={() => router.push('/privacy-policy')} last />
        </View>

        <Pressable onPress={handleSignOut} style={styles.logoutBtn}>
          <AppText style={styles.logoutText}>Log Out</AppText>
        </Pressable>

      </IosScrollView>
    </SafeAreaView>
  );
}

function FbRow({ title, subtitle, onPress, last }: { title: string; subtitle?: string; onPress?: () => void; last?: boolean }) {
  return (
    <Pressable
      onPress={() => {
        if (onPress) HapticTap.light();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.row,
        !last && styles.rowBorder,
        pressed && styles.rowPressed
      ]}
    >
      <View style={styles.rowCopy}>
        <AppText style={styles.rowTitle}>{title}</AppText>
        {subtitle && <AppText style={styles.rowSub}>{subtitle}</AppText>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: FB_BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: FB_BG,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: FB_TEXT },
  scroll: { paddingHorizontal: 16, paddingBottom: 60, gap: 16, paddingTop: 8 },

  profileCard: {
    backgroundColor: FB_CARD,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: FB_BLUE, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 17, fontWeight: '600', color: FB_TEXT },
  profileSub: { fontSize: 14, color: FB_MUTED, marginTop: 2 },

  card: {
    backgroundColor: FB_CARD,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1
  },
  cardHeader: { padding: 16, paddingBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: FB_TEXT, marginBottom: 4 },
  cardSub: { fontSize: 14, color: FB_MUTED, lineHeight: 20 },
  
  sectionHeading: {
    fontSize: 15,
    fontWeight: '600',
    color: FB_TEXT,
    marginLeft: 4,
    marginTop: 8,
    marginBottom: -8
  },

  row: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingVertical: 14, backgroundColor: FB_CARD },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: FB_BORDER },
  rowPressed: { backgroundColor: '#F2F2F2' },
  rowCopy: { flex: 1, justifyContent: 'center' },
  rowTitle: { fontSize: 16, fontWeight: '500', color: FB_TEXT },
  rowSub: { fontSize: 13, color: FB_MUTED, marginTop: 2 },

  seeMoreBtn: { padding: 16, alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: FB_BORDER },
  seeMoreText: { color: FB_BLUE, fontSize: 15, fontWeight: '600' },

  logoutBtn: {
    backgroundColor: '#E4E6EB',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  logoutText: { color: FB_TEXT, fontSize: 15, fontWeight: '600' }
});
