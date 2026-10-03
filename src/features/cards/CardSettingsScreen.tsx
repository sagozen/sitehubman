import React, { useCallback, useState } from 'react';
import {
  Alert,
  Clipboard,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { IosScrollView } from '@/src/components/IosScrollView';
import { HapticTap } from '@/src/utils/haptics';

type Visibility = 'public' | 'private' | 'search';

const VISIBILITY_OPTIONS: Array<{ key: Visibility; label: string; desc: string }> = [
  { key: 'public', label: 'Public', desc: 'Anyone with your link can view your profile' },
  { key: 'private', label: 'Private', desc: 'Only people you share with can view' },
  { key: 'search', label: 'Search Visible', desc: 'Appear in search results' },
];

const PROFILE_URL = 'nfcglobal.com/u/username';

export default function CardSettingsScreen() {
  const [visibility, setVisibility] = useState<Visibility>('public');

  const handleBack = useCallback(() => {
    HapticTap.light();
    router.back();
  }, []);

  const handleCopy = useCallback(() => {
    HapticTap.medium();
    Clipboard.setString(`https://${PROFILE_URL}`);
  }, []);

  const handleVisibility = useCallback((v: Visibility) => {
    HapticTap.light();
    setVisibility(v);
  }, []);

  const handleDelete = useCallback(() => {
    HapticTap.medium();
    Alert.alert(
      'Delete Card',
      'This action is permanent and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            HapticTap.medium();
            router.replace('/(tabs)' as never);
          },
        },
      ]
    );
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} hitSlop={12} style={styles.backBtn}>
          <AppIcon name="ChevronLeft" size={24} color="#F5F5F7" />
        </Pressable>
        <AppText style={styles.headerTitle}>Card Settings</AppText>
        <View style={styles.headerSpacer} />
      </View>

      <IosScrollView contentContainerStyle={styles.scroll}>
        {/* Profile URL */}
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Profile URL</AppText>
          <View style={styles.urlCard}>
            <AppText style={styles.urlText}>{PROFILE_URL}</AppText>
            <Pressable
              onPress={handleCopy}
              style={({ pressed }) => [styles.copyBtn, pressed && styles.copyBtnPressed]}
              hitSlop={8}
            >
              <AppIcon name="Copy" size={16} color="#2596BE" />
              <AppText style={styles.copyBtnText}>Copy</AppText>
            </Pressable>
          </View>
        </View>

        {/* Visibility */}
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Visibility</AppText>
          <View style={styles.groupedList}>
            {VISIBILITY_OPTIONS.map((option, index) => (
              <Pressable
                key={option.key}
                onPress={() => handleVisibility(option.key)}
                style={[
                  styles.visibilityRow,
                  index < VISIBILITY_OPTIONS.length - 1 && styles.visibilityRowBorder,
                ]}
              >
                <View style={styles.visibilityInfo}>
                  <AppText style={styles.visibilityLabel}>{option.label}</AppText>
                  <AppText style={styles.visibilityDesc}>{option.desc}</AppText>
                </View>
                <View
                  style={[
                    styles.radio,
                    visibility === option.key && styles.radioSelected,
                  ]}
                >
                  {visibility === option.key && <View style={styles.radioDot} />}
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Danger</AppText>
          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [styles.dangerRow, pressed && styles.dangerRowPressed]}
          >
            <AppIcon name="Trash2" size={20} color="#FF453A" />
            <AppText style={styles.dangerLabel}>Delete Card</AppText>
            <AppIcon name="ChevronRight" size={18} color="#FF453A" />
          </Pressable>
        </View>
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: '#F5F5F7',
    letterSpacing: -0.2,
  },
  headerSpacer: {
    width: 36,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 130,
    paddingTop: 8,
  },
  section: {
    marginTop: 28,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13,
    color: '#9A9AA0',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  urlCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  urlText: {
    fontSize: 14,
    color: '#9A9AA0',
    flex: 1,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(37,150,190,0.1)',
    borderRadius: 8,
  },
  copyBtnPressed: {
    opacity: 0.7,
  },
  copyBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2596BE',
  },
  groupedList: {
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 14,
    overflow: 'hidden',
  },
  visibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  visibilityRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  visibilityInfo: {
    flex: 1,
    gap: 2,
  },
  visibilityLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#F5F5F7',
  },
  visibilityDesc: {
    fontSize: 12,
    color: '#9A9AA0',
    lineHeight: 16,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#2596BE',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2596BE',
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255,68,58,0.25)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  dangerRowPressed: {
    opacity: 0.7,
  },
  dangerLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#FF453A',
  },
});
