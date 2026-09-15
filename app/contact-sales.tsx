import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';

const SALES_EMAIL = 'support@aviobrand.com';

export default function ContactSalesScreen() {
  const openEmail = () => {
    void Linking.openURL(`mailto:${SALES_EMAIL}?subject=${encodeURIComponent('AVIO business enquiry')}`);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}>
        <AppIcon name="ChevronLeft" size={22} color="#FFFFFF" />
      </Pressable>
      <View style={styles.content}>
        <View style={styles.icon}><AppIcon name="MessageCircle" size={28} color="#000000" /></View>
        <AppText style={styles.eyebrow} weight="bold">BUSINESS & PILOT ENQUIRIES</AppText>
        <AppText style={styles.title} weight="extrabold">Let’s scope the right rollout.</AppText>
        <AppText style={styles.body}>
          Tell us about your team, card volume, or property-access pilot. We’ll confirm availability, implementation scope, and pricing before any commitment.
        </AppText>
        <Pressable accessibilityRole="button" onPress={openEmail} style={({ pressed }) => [styles.cta, pressed && styles.pressed]}>
          <AppIcon name="Mail" size={19} color="#000000" />
          <AppText style={styles.ctaText} weight="bold">Email AVIO team</AppText>
        </Pressable>
        <AppText style={styles.note}>No payment is collected in the app for pilot or enterprise plans.</AppText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000000', paddingHorizontal: 20 },
  back: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111114', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  content: { flex: 1, width: '100%', maxWidth: 640, alignSelf: 'center', justifyContent: 'center', paddingBottom: 48 },
  icon: { width: 58, height: 58, borderRadius: 18, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  eyebrow: { color: 'rgba(255,255,255,0.52)', fontSize: 11, letterSpacing: 1.2, marginBottom: 10 },
  title: { color: '#FFFFFF', fontSize: 34, lineHeight: 41, letterSpacing: -1, marginBottom: 14 },
  body: { color: 'rgba(255,255,255,0.68)', fontSize: 16, lineHeight: 24, marginBottom: 28 },
  cta: { minHeight: 54, borderRadius: 14, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  ctaText: { color: '#000000', fontSize: 16 },
  note: { color: 'rgba(255,255,255,0.42)', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 14 },
  pressed: { opacity: 0.78 },
});
