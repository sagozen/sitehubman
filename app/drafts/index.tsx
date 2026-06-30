import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { IosScrollView } from '@/src/components/IosScrollView';
import { MotionScale } from '@/src/utils/motion';
import { HapticTap } from '@/src/utils/haptics';

export default function DraftsHubScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            HapticTap.light();
            router.back();
          }}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <AppIcon name="ChevronLeft" size={24} color="#111827" />
        </Pressable>
        <AppText style={styles.headerTitle}>Your Drafts</AppText>
        <View style={{ width: 44 }} />
      </View>

      <IosScrollView contentContainerStyle={styles.content}>
        <AppText style={styles.subtitle}>
          Continue where you left off. Choose a draft to edit.
        </AppText>

        <View style={styles.cards}>
          <Pressable
            onPress={() => {
              HapticTap.selection();
              router.push('/edit-bio');
            }}
            style={({ pressed }) => [styles.draftCard, pressed && styles.pressed]}
          >
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(88,86,214,0.1)' }]}>
              <AppIcon name="User" size={28} color="#5856D6" />
            </View>
            <View style={styles.cardCopy}>
              <AppText style={styles.cardTitle}>Bio Draft</AppText>
              <AppText style={styles.cardSub}>Continue editing your public profile page.</AppText>
            </View>
            <AppIcon name="ChevronRight" size={20} color="#9CA3AF" />
          </Pressable>

          <Pressable
            onPress={() => {
              HapticTap.selection();
              router.push('/guest-design');
            }}
            style={({ pressed }) => [styles.draftCard, pressed && styles.pressed]}
          >
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(37,150,190,0.1)' }]}>
              <AppIcon name="CreditCard" size={28} color="#2596BE" />
            </View>
            <View style={styles.cardCopy}>
              <AppText style={styles.cardTitle}>Card Draft</AppText>
              <AppText style={styles.cardSub}>Continue customizing your NFC card design.</AppText>
            </View>
            <AppIcon name="ChevronRight" size={20} color="#9CA3AF" />
          </Pressable>
        </View>
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    fontFamily: 'Inter_800ExtraBold',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 24,
    fontFamily: 'Inter_600SemiBold',
  },
  cards: {
    gap: 16,
  },
  draftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 4,
    gap: 16,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCopy: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    fontFamily: 'Inter_800ExtraBold',
  },
  cardSub: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    lineHeight: 20,
  },
  pressed: {
    transform: [{ scale: MotionScale.pressed }],
    opacity: 0.9,
  },
});
