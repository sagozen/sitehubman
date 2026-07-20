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
          <AppIcon name="ChevronLeft" size={24} color="#FFFFFF" />
        </Pressable>
        <AppText style={styles.headerTitle}>Your Drafts</AppText>
        <View style={{ width: 44 }} />
      </View>

      <IosScrollView contentContainerStyle={styles.content}>
        <AppText style={styles.subtitle}>
          Continue saved work, start a fresh card order, or jump back into tracking.
        </AppText>

        <View style={styles.launchStrip}>
          <View style={styles.launchStripIcon}>
            <AppIcon name="Sparkles" size={18} color="#020617" />
          </View>
          <View style={styles.launchStripCopy}>
            <AppText style={styles.launchStripTitle}>Keep every idea moving</AppText>
            <AppText style={styles.launchStripSub}>
              Bio, card design, and order progress stay one tap away.
            </AppText>
          </View>
        </View>

        <View style={styles.quickRow}>
          <Pressable
            onPress={() => router.push('/cards/templates')}
            style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}
          >
            <AppIcon name="Plus" size={18} color="#020617" />
            <AppText style={styles.quickActionText}>New order</AppText>
          </Pressable>
          <Pressable
            onPress={() => router.push('/orders/track')}
            style={({ pressed }) => [styles.quickActionSecondary, pressed && styles.pressed]}
          >
            <AppIcon name="Truck" size={18} color="#7DD3FC" />
            <AppText style={styles.quickActionSecondaryText}>Track order</AppText>
          </Pressable>
        </View>

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
  safe: { flex: 1, width: '100%', minHeight: '100vh' as any, backgroundColor: '#050507' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Inter_800ExtraBold',
  },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#A1A1AA',
    marginBottom: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  launchStrip: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#111114',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  launchStripIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  launchStripCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  launchStripTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  launchStripSub: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  cards: {
    gap: 16,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  quickAction: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  quickActionText: {
    color: '#020617',
    fontSize: 14,
    fontWeight: '800',
  },
  quickActionSecondary: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(125,211,252,0.28)',
    backgroundColor: 'rgba(14,165,233,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  quickActionSecondaryText: {
    color: '#7DD3FC',
    fontSize: 14,
    fontWeight: '800',
  },
  draftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111114',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
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
    color: '#FFFFFF',
    fontFamily: 'Inter_800ExtraBold',
  },
  cardSub: {
    fontSize: 14,
    fontWeight: '500',
    color: '#A1A1AA',
    lineHeight: 20,
  },
  pressed: {
    transform: [{ scale: MotionScale.pressed }],
    opacity: 0.9,
  },
});
