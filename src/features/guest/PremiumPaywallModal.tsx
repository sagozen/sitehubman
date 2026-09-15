import React from 'react';
import { Modal, View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { HapticTap } from '@/src/utils/haptics';

interface PremiumPaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export function PremiumPaywallModal({ visible, onClose, onUpgrade }: PremiumPaywallModalProps) {
  const features = [
    'Save to Your Phone Wallet',
    'Remove Fluer branding',
    'Create Multiple Cards',
    'Use Custom Colors',
    'Access Fluer\'s Full Creative Suite',
    '1,000 AI Credits / Month',
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.container}>
        <Animated.View entering={FadeIn.delay(100)} style={styles.heroSection}>
          <LinearGradient colors={['#e0e7ff', '#c7d2fe']} style={StyleSheet.absoluteFillObject} />
          <Pressable onPress={() => { HapticTap.light(); onClose(); }} style={styles.closeBtn}>
            <AppIcon name="X" size={24} color="#000" />
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).springify()} style={styles.sheet}>
          <AppText style={styles.title} weight="extrabold">
            Upgrade to Premium & Make Your Digital Card Unforgettable
          </AppText>
          <AppText style={styles.subtitle}>
            Get the ultimate tools to design, personalize, and share your digital business card effortlessly.
          </AppText>

          <ScrollView style={styles.featureList} showsVerticalScrollIndicator={false}>
            {features.map((feat, idx) => (
              <Animated.View entering={FadeInDown.delay(200 + idx * 50)} key={idx} style={styles.featureRow}>
                <View style={styles.checkIcon}>
                  <AppIcon name="Check" size={14} color="#3b82f6" />
                </View>
                <AppText style={styles.featureText} weight="bold">{feat}</AppText>
              </Animated.View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable onPress={() => { HapticTap.success(); onUpgrade(); }} style={({ pressed }) => [styles.upgradeBtn, pressed && { opacity: 0.8 }]}>
              <AppText style={styles.upgradeBtnText} weight="bold">Continue</AppText>
            </Pressable>
            <AppText style={styles.pricingText}>Billed Annually at $49.95</AppText>
            <AppText style={styles.subPricingText}>Use on any device. Cancel any time.</AppText>
            <AppText style={styles.termsText}>
              <AppText style={styles.linkText}>Terms of Service</AppText> and <AppText style={styles.linkText}>Privacy Policy</AppText>
            </AppText>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  heroSection: { flex: 0.4, position: 'relative' },
  closeBtn: { position: 'absolute', top: 50, right: 20, backgroundColor: '#fff', borderRadius: 20, padding: 8 },
  sheet: { flex: 0.6, backgroundColor: '#000', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, marginTop: -20 },
  title: { color: '#fff', fontSize: 24, lineHeight: 32, marginBottom: 12 },
  subtitle: { color: '#a1a1aa', fontSize: 16, marginBottom: 24, lineHeight: 22 },
  featureList: { flex: 1 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  checkIcon: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: '#3b82f6', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  featureText: { color: '#fff', fontSize: 16 },
  footer: { paddingTop: 16, alignItems: 'center' },
  upgradeBtn: { backgroundColor: '#2563eb', width: '100%', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  upgradeBtnText: { color: '#fff', fontSize: 16 },
  pricingText: { color: '#fff', fontSize: 14, marginBottom: 4 },
  subPricingText: { color: '#a1a1aa', fontSize: 12, marginBottom: 12 },
  termsText: { color: '#a1a1aa', fontSize: 12 },
  linkText: { color: '#3b82f6', textDecorationLine: 'underline' }
});
