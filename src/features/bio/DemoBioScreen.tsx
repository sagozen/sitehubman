/**
 * DemoBioScreen — Static demo profile for aviobrand.com/u/demo
 *
 * This is a fully baked executive profile used on the landing page.
 * No Firestore dependency — completely static so it always loads instantly.
 * It showcases what a real AVIO Smart Pass looks like for a visitor.
 */
import React, { useState } from 'react';
import {
  Linking,
  Modal,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Head from 'expo-router/head';
import QRCode from 'react-native-qrcode-svg';

import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { IosScrollView } from '@/src/components/IosScrollView';
import { HapticTap } from '@/src/utils/haptics';

const DEMO_PROFILE_URL = 'https://aviobrand.com/u/demo';

const DEMO_SOCIALS = [
  { key: 'email', name: 'Email', icon: 'Mail' as const, value: 'alex@aviobrand.com', url: 'mailto:alex@aviobrand.com' },
  { key: 'linkedin', name: 'LinkedIn', icon: 'Linkedin' as const, value: 'linkedin.com/in/alexwright', url: 'https://linkedin.com/in/alexwright' },
  { key: 'website', name: 'Website', icon: 'Globe' as const, value: 'aviobrand.com', url: 'https://aviobrand.com' },
  { key: 'telegram', name: 'Telegram', icon: 'Send' as const, value: '@alexwright', url: 'https://t.me/alexwright' },
];

export function DemoBioScreen() {
  const [showQrModal, setShowQrModal] = useState(false);

  async function handleSaveContact() {
    HapticTap.medium();
    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'FN:Alex Wright',
      'TITLE:Founder & CEO',
      'ORG:AVIO',
      'EMAIL:alex@aviobrand.com',
      `URL:${DEMO_PROFILE_URL}`,
      'END:VCARD',
    ].join('\n');
    await Share.share({ message: vcard, title: 'Alex Wright Contact' });
  }

  return (
    <View style={styles.root}>
      <Head>
        <title>Alex Wright — Founder & CEO | AVIO Smart Pass</title>
        <meta name="description" content="Alex Wright's digital NFC business profile. Tap or scan to save contact, connect on LinkedIn, Telegram, and more." />
        <meta property="og:title" content="Alex Wright — AVIO Smart Pass" />
        <meta property="og:description" content="One tap to connect. Save contact, view social channels, and see Alex's full executive profile." />
        <meta property="og:url" content={DEMO_PROFILE_URL} />
      </Head>

      <SafeAreaView style={styles.safe}>
        {/* Nav */}
        <View style={styles.navHeader}>
          <View style={styles.navBrand}>
            <AppText style={styles.navBrandText} weight="extrabold">AVIO</AppText>
          </View>
          <View style={styles.navRight}>
            <Pressable
              onPress={() => { HapticTap.light(); setShowQrModal(true); }}
              style={styles.navIconBtn}
              hitSlop={10}
            >
              <AppIcon name="QrCode" size={18} color="#FFFFFF" />
            </Pressable>
            <Pressable
              onPress={() => { HapticTap.light(); Share.share({ message: DEMO_PROFILE_URL, url: DEMO_PROFILE_URL }); }}
              style={styles.navIconBtn}
              hitSlop={10}
            >
              <AppIcon name="Share2" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Executive Identity Card */}
          <View style={styles.executiveCard}>
            {/* Avatar */}
            <View style={styles.avatarWrap}>
              <View style={styles.avatarSeal}>
                <AppText style={styles.avatarLetter} weight="extrabold">A</AppText>
              </View>
              <View style={styles.verifiedBadge}>
                <AppIcon name="Check" size={11} color="#000000" />
              </View>
            </View>

            {/* Name & Title */}
            <View style={styles.nameBlock}>
              <AppText style={styles.nameText} weight="extrabold">Alex Wright</AppText>
              <AppText style={styles.taglineText}>Founder & CEO · AVIO</AppText>
              <AppText style={styles.slugBadge}>aviobrand.com/u/demo</AppText>
            </View>

            {/* Save Contact CTA */}
            <Pressable
              onPress={() => void handleSaveContact()}
              style={({ pressed }) => [styles.saveContactBtn, pressed && styles.pressed]}
            >
              <AppIcon name="UserPlus" size={17} color="#000000" />
              <AppText style={styles.saveContactBtnText} weight="extrabold">
                Save to Contacts
              </AppText>
            </Pressable>

            {/* Quick Connect Row */}
            <View style={styles.quickRow}>
              {DEMO_SOCIALS.slice(0, 4).map((s) => (
                <Pressable
                  key={s.key}
                  style={({ pressed }) => [styles.quickTile, pressed && styles.pressed]}
                  onPress={() => { HapticTap.light(); Linking.openURL(s.url).catch(() => undefined); }}
                >
                  <AppIcon name={s.icon} size={18} color="#FFFFFF" />
                  <AppText style={styles.quickLabel} weight="bold">{s.name}</AppText>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Channels */}
          <View style={styles.channelsSection}>
            <AppText style={styles.sectionHeading} weight="extrabold">CHANNELS & PORTFOLIO</AppText>
            <View style={styles.channelsList}>
              {DEMO_SOCIALS.map((s) => (
                <Pressable
                  key={s.key}
                  style={({ pressed }) => [styles.channelRow, pressed && styles.pressed]}
                  onPress={() => { HapticTap.light(); Linking.openURL(s.url).catch(() => undefined); }}
                >
                  <View style={styles.channelIconBox}>
                    <AppIcon name={s.icon} size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.channelMeta}>
                    <AppText style={styles.channelTitle} weight="bold">{s.name}</AppText>
                    <AppText style={styles.channelSub} numberOfLines={1}>{s.value}</AppText>
                  </View>
                  <AppIcon name="ArrowUpRight" size={16} color="rgba(255,255,255,0.4)" />
                </Pressable>
              ))}
            </View>
          </View>

          {/* Bio Section */}
          <View style={styles.bioSection}>
            <AppText style={styles.sectionHeading} weight="extrabold">ABOUT</AppText>
            <View style={styles.bioCard}>
              <AppText style={styles.bioText}>
                Building the future of professional identity with NFC-first smart business cards. AVIO replaces paper cards with a single elegant tap.
              </AppText>
            </View>
          </View>

          {/* Viral CTA */}
          <Pressable
            style={({ pressed }) => [styles.viralCard, pressed && styles.pressed]}
            onPress={() => { HapticTap.medium(); Linking.openURL('https://aviobrand.com').catch(() => undefined); }}
          >
            <View style={styles.viralInner}>
              <View style={styles.viralSeal}>
                <AppText style={styles.viralSealText} weight="extrabold">A</AppText>
              </View>
              <View style={{ flex: 1 }}>
                <AppText style={styles.viralTitle} weight="extrabold">Want your own card like this?</AppText>
                <AppText style={styles.viralSub}>Create a free AVIO Smart Pass in 60 seconds.</AppText>
              </View>
              <AppIcon name="ArrowUpRight" size={18} color="#FFFFFF" />
            </View>
          </Pressable>

          {/* NFC Footer */}
          <View style={styles.nfcFooter}>
            <View style={styles.nfcDot} />
            <AppText style={styles.nfcFooterText}>AVIO Smart Pass · DEMO · Verified</AppText>
          </View>
        </IosScrollView>
      </SafeAreaView>

      {/* QR Modal */}
      <Modal visible={showQrModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.qrCard}>
            <View style={styles.qrHeader}>
              <AppText style={styles.qrTitle} weight="bold">Scan Profile QR</AppText>
              <Pressable onPress={() => setShowQrModal(false)} hitSlop={10}>
                <AppIcon name="X" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
            <View style={styles.qrContainer}>
              <QRCode value={DEMO_PROFILE_URL} size={200} backgroundColor="#FFFFFF" color="#000000" />
            </View>
            <AppText style={styles.qrName} weight="extrabold">Alex Wright</AppText>
            <AppText style={styles.qrSub}>Scan to connect</AppText>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  safe: { flex: 1 },
  pressed: { opacity: 0.75 },
  navHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 8, maxWidth: 540, width: '100%', alignSelf: 'center',
  },
  navBrand: {},
  navBrandText: { color: '#FFFFFF', fontSize: 16, letterSpacing: 2 },
  navRight: { flexDirection: 'row', gap: 8 },
  navIconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#121214', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 60,
    maxWidth: 540, width: '100%', alignSelf: 'center', gap: 14,
  },
  executiveCard: {
    borderRadius: 20, backgroundColor: '#111114',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    padding: 24, alignItems: 'center', gap: 16,
  },
  avatarWrap: { position: 'relative' },
  avatarSeal: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { fontSize: 36, color: '#000000' },
  verifiedBadge: {
    position: 'absolute', bottom: 0, right: 0, width: 24, height: 24,
    borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
  },
  nameBlock: { alignItems: 'center', gap: 4 },
  nameText: { color: '#FFFFFF', fontSize: 24 },
  taglineText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  slugBadge: { color: 'rgba(255,255,255,0.3)', fontSize: 11, letterSpacing: 0.5, marginTop: 4 },
  saveContactBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFFFFF', borderRadius: 14, paddingVertical: 14,
    paddingHorizontal: 24, width: '100%', justifyContent: 'center',
  },
  saveContactBtnText: { color: '#000000', fontSize: 15 },
  quickRow: { flexDirection: 'row', gap: 8, width: '100%' },
  quickTile: {
    flex: 1, alignItems: 'center', gap: 6, paddingVertical: 12,
    borderRadius: 12, backgroundColor: '#18181C',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  quickLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  channelsSection: { gap: 10 },
  sectionHeading: { color: 'rgba(255,255,255,0.4)', fontSize: 11, letterSpacing: 1.5 },
  channelsList: { gap: 6 },
  channelRow: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderRadius: 14, backgroundColor: '#111114',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', gap: 12,
  },
  channelIconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#18181C', alignItems: 'center', justifyContent: 'center',
  },
  channelMeta: { flex: 1, gap: 2 },
  channelTitle: { color: '#FFFFFF', fontSize: 14 },
  channelSub: { color: 'rgba(255,255,255,0.45)', fontSize: 12 },
  bioSection: { gap: 10 },
  bioCard: {
    borderRadius: 16, backgroundColor: '#111114',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 16,
  },
  bioText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 22 },
  viralCard: {
    borderRadius: 16, backgroundColor: '#111114',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 16,
  },
  viralInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  viralSeal: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
  },
  viralSealText: { fontSize: 18, color: '#000000' },
  viralTitle: { color: '#FFFFFF', fontSize: 14 },
  viralSub: { color: 'rgba(255,255,255,0.55)', fontSize: 12 },
  nfcFooter: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6, paddingVertical: 14,
  },
  nfcDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF' },
  nfcFooterText: { color: 'rgba(255,255,255,0.4)', fontSize: 11, letterSpacing: 0.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  qrCard: {
    backgroundColor: '#111114', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 24, gap: 12, alignItems: 'center',
  },
  qrHeader: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  qrTitle: { color: '#FFFFFF', fontSize: 16 },
  qrContainer: {
    borderRadius: 16, overflow: 'hidden', padding: 16,
    backgroundColor: '#FFFFFF', marginVertical: 8,
  },
  qrName: { color: '#FFFFFF', fontSize: 18 },
  qrSub: { color: 'rgba(255,255,255,0.5)', fontSize: 13, paddingBottom: 16 },
});
