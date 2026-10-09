import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { AppIcon } from '@/src/components/AppIcon';
import type { AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { HapticTap } from '@/src/utils/haptics';

type PurposeId = 'personal' | 'business' | 'sales' | 'freelancer' | 'creator' | 'company';

interface PurposeOption {
  id: PurposeId;
  label: string;
  icon: AppIconName;
}

const PURPOSE_OPTIONS: PurposeOption[] = [
  { id: 'personal',   label: 'Personal',   icon: 'User' },
  { id: 'business',   label: 'Business',   icon: 'Briefcase' },
  { id: 'sales',      label: 'Sales',      icon: 'BarChart2' },
  { id: 'freelancer', label: 'Freelancer', icon: 'PenLine' },
  { id: 'creator',    label: 'Creator',    icon: 'Sparkles' },
  { id: 'company',    label: 'Company',    icon: 'Users' },
];

const STORAGE_KEY = '@sitehubman/onboarding_purpose';

export function PurposeScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<PurposeId | null>(null);

  function handleSelect(id: PurposeId) {
    HapticTap.selection();
    setSelected(id);
  }

  async function handleContinue() {
    if (!selected) return;
    HapticTap.medium();
    await AsyncStorage.setItem(STORAGE_KEY, selected);
    router.push('/onboarding/card-style');
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <AppText variant="display" weight="semibold" style={styles.title}>
              What describes{'\n'}you best?
            </AppText>
            <AppText variant="body" muted style={styles.subtitle}>
              We&apos;ll personalise your card and profile for your use case.
            </AppText>
          </View>

          {/* 2-column grid */}
          <View style={styles.grid}>
            {PURPOSE_OPTIONS.map((option) => {
              const isActive = selected === option.id;
              return (
                <Pressable
                  key={option.id}
                  style={({ pressed }) => [
                    styles.card,
                    isActive && styles.cardActive,
                    pressed && styles.cardPressed,
                  ]}
                  onPress={() => handleSelect(option.id)}
                  hitSlop={4}
                >
                  <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
                    <AppIcon
                      name={option.icon}
                      size={22}
                      color={isActive ? '#2596BE' : '#9A9AA0'}
                    />
                  </View>
                  <AppText
                    variant="body"
                    weight="semibold"
                    style={[styles.cardLabel, isActive && styles.cardLabelActive]}
                  >
                    {option.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Footer CTA */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <Pressable
            style={({ pressed }) => [
              styles.continueBtn,
              !selected && styles.continueBtnDisabled,
              pressed && selected && styles.continueBtnPressed,
            ]}
            onPress={handleContinue}
            disabled={!selected}
            hitSlop={8}
          >
            <AppText variant="body" weight="semibold" style={styles.continueBtnText}>
              Continue
            </AppText>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default PurposeScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D0D0E',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  content: {
    paddingHorizontal: 16,
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
    paddingTop: 32,
  },
  header: {
    marginBottom: 32,
    gap: 10,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#9A9AA0',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '47.5%',
    backgroundColor: '#242424',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    alignItems: 'flex-start',
    minHeight: 110,
    justifyContent: 'space-between',
  },
  cardActive: {
    borderColor: '#2596BE',
  },
  cardPressed: {
    opacity: 0.75,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(37,150,190,0.12)',
  },
  cardLabel: {
    fontSize: 15,
    color: '#FFFFFF',
  },
  cardLabelActive: {
    color: '#2596BE',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    backgroundColor: '#0D0D0E',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  footerContent: {
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },
  continueBtn: {
    height: 56,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnDisabled: {
    opacity: 0.3,
  },
  continueBtnPressed: {
    opacity: 0.85,
  },
  continueBtnText: {
    color: '#000000',
    fontSize: 16,
  },
});
