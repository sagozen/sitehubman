/**
 * DesignProofScreen — 47 Design Proof Approval (Apple Wallet × Stripe × Linear)
 *
 * Implements:
 * 47 — Design Proof Approval
 * - Production laser print mockup preview (Front / Back)
 * - Material & engraving specifications
 * - [ Approve Proof & Start Production ] and [ Request Revision ]
 */
import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { IosScrollView } from '@/src/components/IosScrollView';
import { HapticTap } from '@/src/utils/haptics';

const C = {
  canvas: '#000000',
  surface: '#111114',
  surfaceRaised: '#18181C',
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.15)',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  textMuted: '#636366',
  accent: '#2596BE',
  success: '#34C759',
  warning: '#FF9F0A',
} as const;

export default function DesignProofScreen() {
  const [selectedSide, setSelectedSide] = useState<'front' | 'back'>('front');
  const [approved, setApproved] = useState(false);

  const handleApprove = useCallback(() => {
    HapticTap.success();
    setApproved(true);
    Alert.alert(
      'Proof Approved! ✓',
      'Your custom design has been sent to our CNC fiber laser queue. Production begins immediately.',
      [
        {
          text: 'Track Production',
          onPress: () => router.push('/orders/track' as any),
        },
      ]
    );
  }, []);

  const handleRequestRevision = useCallback(() => {
    HapticTap.light();
    if (typeof Alert.prompt === 'function') {
      Alert.prompt(
        'Request Revision',
        'Please describe changes you need our design team to make (e.g. logo alignment, font size):',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Submit Request',
            onPress: () => {
              HapticTap.softConfirmation();
              Alert.alert('Sent', 'Our production designers will update your proof within 4 hours.');
            },
          },
        ]
      );
    } else {
      Alert.alert('Request Revision', 'Our production designers have been notified.');
    }
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            HapticTap.light();
            router.back();
          }}
          hitSlop={12}
          style={styles.backBtn}
        >
          <AppIcon name="ChevronLeft" size={24} color={C.text} />
        </Pressable>
        <AppText style={styles.headerTitle} weight="bold">
          Design Proof Approval
        </AppText>
        <View style={{ width: 24 }} />
      </View>

      <IosScrollView contentContainerStyle={styles.scroll}>
        {/* Order Meta */}
        <View style={styles.metaRow}>
          <View>
            <AppText style={styles.orderNum} weight="bold">
              ORDER #10294
            </AppText>
            <AppText style={styles.orderProduct}>Premium Metal NFC Card</AppText>
          </View>
          <View style={styles.proofBadge}>
            <AppText style={styles.proofBadgeText}>AWAITING APPROVAL</AppText>
          </View>
        </View>

        {/* Side Selector Tabs (Front / Back) */}
        <View style={styles.tabContainer}>
          <Pressable
            style={[styles.sideTab, selectedSide === 'front' && styles.sideTabActive]}
            onPress={() => {
              HapticTap.light();
              setSelectedSide('front');
            }}
          >
            <AppText
              style={[styles.sideTabText, selectedSide === 'front' && styles.sideTabTextActive]}
              weight={selectedSide === 'front' ? 'bold' : 'regular'}
            >
              FRONT VIEW
            </AppText>
          </Pressable>

          <Pressable
            style={[styles.sideTab, selectedSide === 'back' && styles.sideTabActive]}
            onPress={() => {
              HapticTap.light();
              setSelectedSide('back');
            }}
          >
            <AppText
              style={[styles.sideTabText, selectedSide === 'back' && styles.sideTabTextActive]}
              weight={selectedSide === 'back' ? 'bold' : 'regular'}
            >
              BACK VIEW
            </AppText>
          </Pressable>
        </View>

        {/* Visual Proof Card Mockup */}
        <View style={styles.cardWrapper}>
          <LinearGradient
            colors={['#1E1E24', '#121216', '#09090C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.proofCard}
          >
            {selectedSide === 'front' ? (
              <>
                <View style={styles.proofTop}>
                  <View style={styles.chipVector}>
                    <View style={styles.chipCore} />
                    <AppIcon name="wifi" size={14} color={C.accent} style={{ transform: [{ rotate: '90deg' }] }} />
                  </View>
                  <AppText style={styles.brandMark} weight="bold">
                    SITEHUB
                  </AppText>
                </View>

                <View style={styles.proofCenter}>
                  <AppText style={styles.engravedHolder} weight="bold">
                    THEAN COC
                  </AppText>
                  <AppText style={styles.engravedRole}>IT Support · Metfone</AppText>
                </View>

                <View style={styles.proofBottom}>
                  <AppText style={styles.specCode}>CNC LASER ENGRAVED • NTAG216</AppText>
                </View>
              </>
            ) : (
              <>
                <View style={styles.backCenter}>
                  <View style={styles.qrProof}>
                    <AppIcon name="QrCode" size={64} color="#FFFFFF" />
                  </View>
                  <AppText style={styles.backUrl}>sitehub.me/u/thean</AppText>
                </View>

                <View style={styles.proofBottom}>
                  <AppText style={styles.specCode}>SCAN OR TAP • AIRDROP READY</AppText>
                </View>
              </>
            )}
          </LinearGradient>
        </View>

        {/* Specifications Check */}
        <View style={styles.specCard}>
          <AppText style={styles.specTitle} weight="bold">
            Manufacturing Specifications
          </AppText>

          <View style={styles.specRow}>
            <AppText style={styles.specLabel}>Substrate</AppText>
            <AppText style={styles.specVal}>304 Stainless Steel (0.84mm)</AppText>
          </View>
          <View style={styles.divider} />

          <View style={styles.specRow}>
            <AppText style={styles.specLabel}>Finish</AppText>
            <AppText style={styles.specVal}>Matte Black PVD Coating</AppText>
          </View>
          <View style={styles.divider} />

          <View style={styles.specRow}>
            <AppText style={styles.specLabel}>Laser Process</AppText>
            <AppText style={styles.specVal}>Precision Fiber Laser Etching</AppText>
          </View>
          <View style={styles.divider} />

          <View style={styles.specRow}>
            <AppText style={styles.specLabel}>NFC Protocol</AppText>
            <AppText style={styles.specVal}>NTAG216 (888 Bytes Encrypted)</AppText>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionCol}>
          <Pressable
            style={({ pressed }) => [
              styles.approveBtn,
              pressed && styles.btnPressed,
              approved && { backgroundColor: C.success },
            ]}
            onPress={handleApprove}
            disabled={approved}
          >
            <AppIcon name={approved ? 'Check' : 'ShieldCheck'} size={18} color="#FFFFFF" />
            <AppText style={styles.approveBtnText} weight="bold">
              {approved ? 'Proof Approved ✓' : 'Approve Proof & Start Production'}
            </AppText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.revisionBtn, pressed && styles.btnPressed]}
            onPress={handleRequestRevision}
          >
            <AppText style={styles.revisionBtnText} weight="medium">
              Request Design Changes
            </AppText>
          </Pressable>
        </View>
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    color: C.text,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNum: {
    fontSize: 17,
    color: C.text,
    letterSpacing: 0.5,
  },
  orderProduct: {
    fontSize: 13,
    color: C.textSecondary,
    marginTop: 2,
  },
  proofBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 159, 10, 0.15)',
    borderColor: 'rgba(255, 159, 10, 0.3)',
  },
  proofBadgeText: {
    fontSize: 10,
    color: C.warning,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 4,
    borderColor: C.border,
  },
  sideTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  sideTabActive: {
    backgroundColor: C.surfaceRaised,
  },
  sideTabText: {
    fontSize: 12,
    color: C.textSecondary,
    letterSpacing: 0.5,
  },
  sideTabTextActive: {
    color: C.text,
  },
  cardWrapper: {
    alignItems: 'center',
    marginVertical: 8,
  },
  proofCard: {
    width: '100%',
    aspectRatio: 1.586,
    borderRadius: 20,
    padding: 22,
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 12,
  },
  proofTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chipVector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chipCore: {
    width: 28,
    height: 22,
    borderRadius: 4,
    backgroundColor: '#38383E',
    borderColor: 'rgba(255,255,255,0.25)',
  },
  brandMark: {
    fontSize: 12,
    letterSpacing: 1.5,
    color: C.textSecondary,
  },
  proofCenter: {
    marginVertical: 12,
  },
  engravedHolder: {
    fontSize: 22,
    letterSpacing: 1.5,
    color: '#FFFFFF',
  },
  engravedRole: {
    fontSize: 13,
    color: C.textSecondary,
    marginTop: 4,
  },
  proofBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  specCode: {
    fontSize: 9,
    letterSpacing: 1,
    color: C.textMuted,
    fontWeight: '600',
  },
  backCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 12,
  },
  qrProof: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#0D0D0E',
    borderColor: C.borderLight,
  },
  backUrl: {
    fontSize: 12,
    color: C.textSecondary,
    letterSpacing: 0.5,
  },
  specCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 18,
    borderColor: C.border,
  },
  specTitle: {
    fontSize: 14,
    color: C.text,
    marginBottom: 12,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  specLabel: {
    fontSize: 13,
    color: C.textSecondary,
  },
  specVal: {
    fontSize: 13,
    color: C.text,
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 8,
  },
  actionCol: {
    gap: 10,
    marginTop: 6,
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.accent,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  revisionBtn: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  btnPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  approveBtnText: {
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  revisionBtnText: {
    fontSize: 13,
    color: C.textSecondary,
  },
});
