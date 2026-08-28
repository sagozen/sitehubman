/**
 * NfcBeamModal.tsx
 *
 * Fullscreen "NameDrop Style" NFC Tap Beam Mode.
 *
 * Design Language:
 *  - Solid pure black canvas (#000000)
 *  - Ambient radial pulsating gold/platinum aura
 *  - High-contrast crisp QR code for instant zero-lag optical scanning
 *  - Animated NFC transmission waves
 *  - Clear Sweet-Spot Antenna Guide: "Hold top of iPhone or center of Android near back of phone"
 *  - 60fps hardware accelerated animations with haptic feedback
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { HapticTap } from '@/src/utils/haptics';

interface NfcBeamModalProps {
  visible: boolean;
  onClose: () => void;
  fullName?: string;
  title?: string;
  cardId?: string;
  url?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function NfcBeamModal({
  visible,
  onClose,
  fullName = 'Alexander Wright',
  title = 'Founder & CEO · AVIO',
  cardId = 'BC-NFC_JEWDVONG',
  url = 'https://aviobrand.com/u/demo',
}: NfcBeamModalProps) {
  const [copied, setCopied] = useState(false);
  const pulseAnim1 = useRef(new Animated.Value(1)).current;
  const pulseAnim2 = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      HapticTap.heavy();

      // Ambient radial pulse loop
      const pulseLoop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim1, {
              toValue: 1.25,
              duration: 1800,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim1, {
              toValue: 1,
              duration: 1800,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(pulseAnim2, {
              toValue: 1.45,
              duration: 2400,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim2, {
              toValue: 1,
              duration: 2400,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      pulseLoop.start();

      return () => pulseLoop.stop();
    }
  }, [visible, pulseAnim1, pulseAnim2]);

  const handleCopyLink = async () => {
    HapticTap.medium();
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      } else {
        await Share.share({ message: url, url });
      }
    } catch {
      await Share.share({ message: url, url });
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    HapticTap.light();
    await Share.share({
      message: `${fullName} — ${title}\n${url}`,
      url,
    });
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.root}>
        {/* Ambient Radial Pulsing Waves */}
        <Animated.View
          style={[
            styles.pulseCircle,
            styles.pulseCircleOuter,
            { transform: [{ scale: pulseAnim2 }] },
          ]}
          pointerEvents="none"
        />
        <Animated.View
          style={[
            styles.pulseCircle,
            styles.pulseCircleInner,
            { transform: [{ scale: pulseAnim1 }] },
          ]}
          pointerEvents="none"
        />

        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.beamBadge}>
            <View style={styles.liveDot} />
            <AppText style={styles.beamBadgeText} weight="extrabold">
              NFC BEAM ACTIVE
            </AppText>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
            <AppIcon name="X" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Main Center Beacon Card */}
        <View style={styles.centerContainer}>
          <View style={styles.beaconCard}>
            {/* Monogram Seal */}
            <View style={styles.avatarSeal}>
              <AppText style={styles.avatarLetter} weight="extrabold">
                {(fullName[0] || 'A').toUpperCase()}
              </AppText>
            </View>

            {/* Profile Info */}
            <View style={styles.nameBlock}>
              <AppText style={styles.nameText} weight="extrabold" numberOfLines={1}>
                {fullName}
              </AppText>
              <AppText style={styles.titleText} numberOfLines={1}>
                {title}
              </AppText>
            </View>

            {/* High Contrast QR Code */}
            <View style={styles.qrBox}>
              <QRCode
                value={url}
                size={Math.min(SCREEN_WIDTH * 0.48, 190)}
                backgroundColor="#FFFFFF"
                color="#000000"
              />
            </View>

            {/* NFC Pass ID */}
            <View style={styles.passIdRow}>
              <AppIcon name="Nfc" size={13} color="rgba(255,255,255,0.4)" />
              <AppText style={styles.passIdText}>
                {cardId} · NTAG216 ENCRYPTED
              </AppText>
            </View>
          </View>

          {/* Sweet Spot Antenna Instruction */}
          <View style={styles.antennaGuideBox}>
            <View style={styles.antennaIconBox}>
              <AppIcon name="Smartphone" size={16} color="#FFFFFF" />
            </View>
            <View style={styles.antennaMeta}>
              <AppText style={styles.antennaTitle} weight="bold">
                Tap Phone or Scan QR Code
              </AppText>
              <AppText style={styles.antennaSub}>
                Hold top edge of iPhone or center back of Android near phone.
              </AppText>
            </View>
          </View>
        </View>

        {/* Bottom Quick Action Bar */}
        <View style={styles.footerActions}>
          <Pressable
            onPress={() => void handleCopyLink()}
            style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
          >
            <AppIcon name={copied ? 'Check' : 'Copy'} size={16} color="#FFFFFF" />
            <AppText style={styles.actionBtnText} weight="bold">
              {copied ? 'Link Copied!' : 'Copy Link'}
            </AppText>
          </Pressable>

          <Pressable
            onPress={() => void handleShare()}
            style={({ pressed }) => [styles.actionBtn, styles.actionBtnShare, pressed && styles.pressed]}
          >
            <AppIcon name="Share2" size={16} color="#000000" />
            <AppText style={styles.actionBtnShareText} weight="extrabold">
              Share Pass
            </AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
  },
  pulseCircle: {
    position: 'absolute',
    alignSelf: 'center',
    top: '28%',
    borderRadius: 999,
  },
  pulseCircleOuter: {
    width: 380,
    height: 380,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  pulseCircleInner: {
    width: 300,
    height: 300,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  beamBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#16161A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#30D158', // Apple Live Green
  },
  beamBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    letterSpacing: 1.2,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#16161A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    alignItems: 'center',
    gap: 20,
    zIndex: 10,
  },
  beaconCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  avatarSeal: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 26,
    color: '#000000',
  },
  nameBlock: {
    alignItems: 'center',
    gap: 4,
  },
  nameText: {
    color: '#FFFFFF',
    fontSize: 20,
    textAlign: 'center',
  },
  titleText: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 13,
    textAlign: 'center',
  },
  qrBox: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  passIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  passIdText: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 10,
    letterSpacing: 1,
  },
  antennaGuideBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    maxWidth: 340,
    width: '100%',
  },
  antennaIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#18181C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  antennaMeta: {
    flex: 1,
    gap: 2,
  },
  antennaTitle: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  antennaSub: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    lineHeight: 15,
  },
  footerActions: {
    flexDirection: 'row',
    gap: 10,
    maxWidth: 340,
    width: '100%',
    alignSelf: 'center',
    zIndex: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#16161A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  actionBtnShare: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  actionBtnShareText: {
    color: '#000000',
    fontSize: 14,
  },
  pressed: {
    opacity: 0.75,
  },
});
