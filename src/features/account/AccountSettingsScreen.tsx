import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { IosScrollView } from '@/src/components/IosScrollView';
import { useAuth } from '@/src/hooks/useAuth';
import { HapticTap } from '@/src/utils/haptics';

const C = {
  canvas: '#0D0D0E',
  surface: '#242424',
  border: 'rgba(255,255,255,0.09)',
  text: '#F5F5F7',
  muted: '#9A9AA0',
  accent: '#799A85',
} as const;

export default function AccountSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const email = user?.email ?? '';
  const initial = (displayName || email).charAt(0).toUpperCase();

  const handleSave = useCallback(() => {
    HapticTap.confidentClick();
    Alert.alert('Saved', 'Account settings updated.');
  }, []);

  const handleChangePhoto = useCallback(() => {
    HapticTap.light();
    Alert.alert('Change Photo', 'Photo picker coming soon.');
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <AppIcon name="ChevronLeft" size={22} color={C.text} />
        </Pressable>
        <AppText variant="title3" style={styles.headerTitle}>Account Settings</AppText>
        <View style={styles.backBtn} />
      </View>

      <IosScrollView contentContainerStyle={styles.content}>
        {/* Profile Photo */}
        <View style={styles.section}>
          <AppText variant="caption" muted style={styles.sectionLabel}>PROFILE PHOTO</AppText>
          <View style={styles.card}>
            <Pressable
              style={({ pressed }) => [styles.photoRow, pressed && styles.rowPressed]}
              onPress={handleChangePhoto}
              hitSlop={4}
            >
              <Image
                source={require('@/assets/images/avatars/avatar_founder_man.jpg')}
                style={styles.avatar}
              />
              <View style={styles.photoInfo}>
                <AppText variant="body" style={styles.rowLabel}>Profile Photo</AppText>
                <AppText variant="caption" muted>Change Photo</AppText>
              </View>
              <AppIcon name="ChevronRight" size={16} color={C.muted} />
            </Pressable>
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.section}>
          <AppText variant="caption" muted style={styles.sectionLabel}>PERSONAL INFO</AppText>
          <View style={styles.card}>
            {/* Display Name */}
            <View style={styles.fieldRow}>
              <AppText variant="caption" muted style={styles.fieldLabel}>Display Name</AppText>
              <TextInput
                style={styles.fieldInput}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Your name"
                placeholderTextColor={C.muted}
                returnKeyType="next"
              />
            </View>
            <View style={styles.divider} />
            {/* Email */}
            <View style={styles.fieldRow}>
              <AppText variant="caption" muted style={styles.fieldLabel}>Email</AppText>
              <TextInput
                style={[styles.fieldInput, styles.fieldInputDisabled]}
                value={email}
                editable={false}
                selectTextOnFocus={false}
                placeholder="your@email.com"
                placeholderTextColor={C.muted}
              />
            </View>
            <View style={styles.divider} />
            {/* Phone */}
            <View style={styles.fieldRow}>
              <AppText variant="caption" muted style={styles.fieldLabel}>Phone</AppText>
              <TextInput
                style={styles.fieldInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="+1 (555) 000-0000"
                placeholderTextColor={C.muted}
                keyboardType="phone-pad"
                returnKeyType="next"
              />
            </View>
            <View style={styles.divider} />
            {/* Username */}
            <View style={styles.fieldRow}>
              <AppText variant="caption" muted style={styles.fieldLabel}>Username</AppText>
              <TextInput
                style={styles.fieldInput}
                value={username}
                onChangeText={setUsername}
                placeholder="@yourslug"
                placeholderTextColor={C.muted}
                autoCapitalize="none"
                returnKeyType="done"
              />
            </View>
          </View>
        </View>

        {/* Save */}
        <Pressable
          style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}
          onPress={handleSave}
          hitSlop={4}
        >
          <AppText style={styles.saveBtnText}>Save Changes</AppText>
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
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  headerTitle: { color: C.text, fontWeight: '600' },
  content: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 130 },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 11, letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 },
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowPressed: { backgroundColor: 'rgba(255,255,255,0.04)' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: '#0D0D0E',
  },
  photoInfo: { flex: 1, gap: 2 },
  rowLabel: { color: C.text, fontSize: 15 },
  fieldRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
  },
  fieldLabel: { fontSize: 11, letterSpacing: 0.4 },
  fieldInput: {
    fontSize: 16,
    color: C.text,
    paddingVertical: 2,
  },
  fieldInputDisabled: { color: C.muted },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginHorizontal: 16 },
  saveBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: '#000', fontWeight: '700', fontSize: 16 },
});
