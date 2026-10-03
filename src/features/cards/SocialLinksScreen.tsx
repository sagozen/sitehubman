import React, { useCallback, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { IosScrollView } from '@/src/components/IosScrollView';
import { HapticTap } from '@/src/utils/haptics';

interface Platform {
  key: string;
  label: string;
  icon: string;
  placeholder: string;
}

const PLATFORMS: Platform[] = [
  { key: 'instagram', label: 'Instagram', icon: 'Camera', placeholder: '@username' },
  { key: 'facebook', label: 'Facebook', icon: 'Facebook', placeholder: 'facebook.com/you' },
  { key: 'linkedin', label: 'LinkedIn', icon: 'Linkedin', placeholder: 'linkedin.com/in/you' },
  { key: 'tiktok', label: 'TikTok', icon: 'Smartphone', placeholder: '@username' },
  { key: 'telegram', label: 'Telegram', icon: 'Send', placeholder: '@username' },
  { key: 'whatsapp', label: 'WhatsApp', icon: 'Phone', placeholder: '+1 555 000 0000' },
  { key: 'website', label: 'Website', icon: 'Globe', placeholder: 'https://yoursite.com' },
];

type PlatformValues = Record<string, string>;
type EnabledMap = Record<string, boolean>;

export default function SocialLinksScreen() {
  const [values, setValues] = useState<PlatformValues>(() =>
    Object.fromEntries(PLATFORMS.map((p) => [p.key, '']))
  );
  const [enabled, setEnabled] = useState<EnabledMap>(() =>
    Object.fromEntries(PLATFORMS.map((p) => [p.key, false]))
  );
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const handleChange = useCallback(
    (key: string) => (text: string) => {
      clearTimeout(debounceTimers.current[key]);
      debounceTimers.current[key] = setTimeout(() => {
        setValues((prev) => ({ ...prev, [key]: text }));
      }, 300);
    },
    []
  );

  const handleToggle = useCallback((key: string) => {
    HapticTap.light();
    setEnabled((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleBack = useCallback(() => {
    HapticTap.light();
    router.back();
  }, []);

  const handleSave = useCallback(() => {
    HapticTap.success();
    router.back();
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} hitSlop={12} style={styles.backBtn}>
          <AppIcon name="ChevronLeft" size={24} color="#F5F5F7" />
        </Pressable>
        <AppText style={styles.headerTitle}>Social Links</AppText>
        <View style={styles.headerSpacer} />
      </View>

      <IosScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.list}>
          {PLATFORMS.map((platform) => (
            <View key={platform.key} style={styles.row}>
              {/* Left: icon + name */}
              <View style={styles.rowLeft}>
                <View style={styles.iconWrap}>
                  <AppIcon name={platform.icon} size={20} color="#2596BE" />
                </View>
                <AppText style={styles.platformName}>{platform.label}</AppText>
              </View>

              {/* Input */}
              <TextInput
                style={[styles.input, !enabled[platform.key] && styles.inputDisabled]}
                placeholder={platform.placeholder}
                placeholderTextColor="#9A9AA0"
                onChangeText={handleChange(platform.key)}
                autoCapitalize="none"
                autoCorrect={false}
                editable={enabled[platform.key]}
              />

              {/* Toggle */}
              <Pressable
                onPress={() => handleToggle(platform.key)}
                hitSlop={8}
                style={[
                  styles.toggle,
                  enabled[platform.key] && styles.toggleActive,
                ]}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    enabled[platform.key] && styles.toggleThumbActive,
                  ]}
                />
              </Pressable>
            </View>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [styles.saveBtn, pressed && styles.saveBtnPressed]}
          onPress={handleSave}
        >
          <AppText style={styles.saveBtnText}>Save Links</AppText>
        </Pressable>
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
    paddingTop: 12,
  },
  list: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 110,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(37,150,190,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F5F5F7',
  },
  input: {
    flex: 1,
    height: 36,
    backgroundColor: '#18181C',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 13,
    color: '#F5F5F7',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  inputDisabled: {
    opacity: 0.35,
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#18181C',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#2596BE',
    borderColor: '#2596BE',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#9A9AA0',
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-end',
  },
  saveBtn: {
    marginTop: 28,
    height: 54,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
});
