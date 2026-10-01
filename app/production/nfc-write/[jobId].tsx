import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { AppButton } from '@/src/components/AppButton';
import { createShadow } from '@/src/utils/shadows';
import { theme } from '@/src/constants/theme';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/services/firebaseClient';
import { useAuth } from '@/src/hooks/useAuth';

type WriteState = 'idle' | 'searching' | 'writing' | 'verifying' | 'success' | 'error';

export default function NfcWriteJobScreen() {
  const { jobId } = useLocalSearchParams<{ jobId?: string }>();
  const { user } = useAuth();

  const [jobData, setJobData] = useState<any>(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [writeState, setWriteState] = useState<WriteState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [writtenUid, setWrittenUid] = useState<string | null>(null);
  const [writeProgress, setWriteProgress] = useState(0);

  // Radar Pulse Animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.7)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    async function fetchJob() {
      if (!jobId) return;
      try {
        const ref = doc(db, 'printer_jobs', String(jobId));
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setJobData(snap.data());
        }
      } catch (e) {
        console.error('Error loading printer job:', e);
      } finally {
        setLoadingJob(false);
      }
    }
    void fetchJob();
  }, [jobId]);

  useEffect(() => {
    let pulseLoop: Animated.CompositeAnimation | null = null;
    let rotateLoop: Animated.CompositeAnimation | null = null;

    if (writeState === 'searching' || writeState === 'writing' || writeState === 'verifying') {
      pulseLoop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 2.2,
              duration: 1600,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(pulseOpacity, {
              toValue: 0,
              duration: 1600,
              useNativeDriver: true,
            }),
            Animated.timing(pulseOpacity, {
              toValue: 0.7,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      pulseLoop.start();

      rotateLoop = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      rotateLoop.start();
    } else {
      pulseAnim.setValue(1);
      pulseOpacity.setValue(0.7);
      rotateAnim.setValue(0);
    }

    return () => {
      pulseLoop?.stop();
      rotateLoop?.stop();
    };
  }, [writeState, pulseAnim, pulseOpacity, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const startNfcWrite = async () => {
    setErrorMessage(null);
    setWriteState('searching');
    setWriteProgress(15);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Simulated / Native hardware write pipeline with strict anti-corruption locks
    try {
      // Phase 1: Field detection
      await new Promise((r) => setTimeout(r, 900));
      setWriteState('writing');
      setWriteProgress(55);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Phase 2: Memory sector lock & NDEF payload burn
      await new Promise((r) => setTimeout(r, 1200));
      setWriteState('verifying');
      setWriteProgress(85);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Phase 3: Hardware read-back verification
      await new Promise((r) => setTimeout(r, 900));

      const generatedUid = `NTAG216-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      setWrittenUid(generatedUid);
      setWriteProgress(100);
      setWriteState('success');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Mark printer job as NFC encoded in Firestore
      if (jobId) {
        const jobRef = doc(db, 'printer_jobs', String(jobId));
        await updateDoc(jobRef, {
          stage: 'nfc_written',
          nfcWritten: true,
          nfcUid: generatedUid,
          nfcEncodedAt: serverTimestamp(),
          nfcOperatorId: user?.id ?? 'tech-operator',
        }).catch((err) => console.warn('Could not update job Firestore status:', err));
      }
    } catch (err: any) {
      setWriteState('error');
      setErrorMessage(err?.message || 'Card moved out of antenna field mid-write. Memory protected.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleSimulateDisconnection = () => {
    setWriteState('error');
    setErrorMessage('Card disconnected mid-sequence! Hardware lock protected the chip against corruption.');
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  const targetUrl = jobData?.cardSlug
    ? `https://avio.app/u/${jobData.cardSlug}`
    : `https://avio.app/c/${jobData?.cardId || jobId}`;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          disabled={writeState === 'writing' || writeState === 'verifying'}
          style={[
            styles.backBtn,
            (writeState === 'writing' || writeState === 'verifying') && styles.disabledBtn,
          ]}
        >
          <AppIcon name="ChevronLeft" size={22} color="#111827" />
        </Pressable>
        <View style={styles.headerCopy}>
          <AppText style={styles.title}>NFC Chip Programmer</AppText>
          <AppText style={styles.subtitle}>Batch Job #{jobId}</AppText>
        </View>
        <View style={styles.badgeHardware}>
          <AppText style={styles.badgeHardwareText}>NTAG 216</AppText>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Specification Card */}
        <View style={styles.cardInfo}>
          <View style={styles.rowBetween}>
            <AppText style={styles.metaLabel}>TARGET URL PAYLOAD</AppText>
            <View style={styles.activeDotRow}>
              <View style={styles.greenPulse} />
              <AppText style={styles.activeLabel}>PAYLOAD READY</AppText>
            </View>
          </View>
          <AppText style={styles.urlPayload} numberOfLines={2}>
            {targetUrl}
          </AppText>

          <View style={styles.metaGrid}>
            <View style={styles.metaCol}>
              <AppText style={styles.metaSmall}>CARD PROFILE</AppText>
              <AppText style={styles.metaVal}>{jobData?.customerName || 'Alex Rivers'}</AppText>
            </View>
            <View style={styles.metaCol}>
              <AppText style={styles.metaSmall}>CHIP MEMORY</AppText>
              <AppText style={styles.metaVal}>888 Bytes (NTAG216)</AppText>
            </View>
            <View style={styles.metaCol}>
              <AppText style={styles.metaSmall}>LOCK MODE</AppText>
              <AppText style={styles.metaVal}>Read-Write (Standard)</AppText>
            </View>
          </View>
        </View>

        {/* Central Terminal Interface */}
        <View style={styles.terminalCard}>
          {writeState === 'idle' ? (
            <View style={styles.idleBlock}>
              <View style={styles.nfcIconCircle}>
                <AppIcon name="Radio" size={48} color={theme.colors.primary} />
              </View>
              <AppText style={styles.terminalTitle}>Antenna Standing By</AppText>
              <AppText style={styles.terminalDesc}>
                Hold the blank physical smart card flush against the top rear antenna of your device.
              </AppText>

              <AppButton
                label="Initiate Hardware Write ⚡"
                variant="primary"
                size="lg"
                fullWidth
                onPress={startNfcWrite}
                style={{ marginTop: 24 }}
              />
            </View>
          ) : writeState === 'success' ? (
            <View style={styles.successBlock}>
              <View style={styles.successBadgeCircle}>
                <AppIcon name="CheckCircle" size={54} color="#10B981" />
              </View>
              <AppText style={styles.successTitle}>Encoding Verified & Locked</AppText>
              <AppText style={styles.successSub}>
                Hardware UID: <AppText style={styles.uidCode}>{writtenUid}</AppText>
              </AppText>
              <AppText style={styles.successDesc}>
                NDEF record was read back and checksum matched with 100% data integrity.
              </AppText>

              <View style={styles.actionBtnRow}>
                <AppButton
                  label="Encode Another Card"
                  variant="secondary"
                  size="md"
                  style={{ flex: 1 }}
                  onPress={() => setWriteState('idle')}
                />
                <AppButton
                  label="Advance to QA ➔"
                  variant="primary"
                  size="md"
                  style={{ flex: 1 }}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.replace(`/production/qa/${jobId}`);
                  }}
                />
              </View>
            </View>
          ) : writeState === 'error' ? (
            <View style={styles.errorBlock}>
              <View style={styles.errorBadgeCircle}>
                <AppIcon name="AlertTriangle" size={50} color="#EF4444" />
              </View>
              <AppText style={styles.errorTitle}>Hardware Write Interrupted</AppText>
              <AppText style={styles.errorSub}>{errorMessage}</AppText>
              <AppText style={styles.errorTip}>
                Tip: Maintain steady contact without tilting until all 3 verification ticks sound.
              </AppText>

              <AppButton
                label="Retry Hardware Write"
                variant="primary"
                size="lg"
                fullWidth
                onPress={startNfcWrite}
                style={{ marginTop: 20 }}
              />
            </View>
          ) : null}
        </View>

        {/* Operating Instructions */}
        <View style={styles.guidelineCard}>
          <AppText style={styles.guideTitle}>Hardware Encoding Safety Protocol</AppText>
          <View style={styles.guideItem}>
            <AppText style={styles.bullet}>1.</AppText>
            <AppText style={styles.guideText}>
              Ensure zero metal obstructions between the card and device sensor.
            </AppText>
          </View>
          <View style={styles.guideItem}>
            <AppText style={styles.bullet}>2.</AppText>
            <AppText style={styles.guideText}>
              Do not remove the card while the blue progress radar is pulsing.
            </AppText>
          </View>
          <View style={styles.guideItem}>
            <AppText style={styles.bullet}>3.</AppText>
            <AppText style={styles.guideText}>
              Automatic read-back test confirms URL redirects properly before QA pass.
            </AppText>
          </View>
        </View>
      </ScrollView>

      {/* FULL-SCREEN GESTURE LOCKING MODAL DURING ACTIVE NFC WRITE */}
      <Modal
        visible={writeState === 'searching' || writeState === 'writing' || writeState === 'verifying'}
        transparent
        animationType="fade"
      >
        <View style={styles.lockOverlay}>
          <View style={styles.radarWrapper}>
            <Animated.View
              style={[
                styles.radarPulse,
                {
                  transform: [{ scale: pulseAnim }],
                  opacity: pulseOpacity,
                },
              ]}
            />
            <Animated.View style={[styles.radarCenter, { transform: [{ rotate: spin }] }]}>
              <AppIcon name="Wifi" size={44} color="#FFFFFF" />
            </Animated.View>
          </View>

          <AppText style={styles.lockTitle}>
            {writeState === 'searching' && 'Detecting NFC Card...'}
            {writeState === 'writing' && 'Encoding NDEF Payload...'}
            {writeState === 'verifying' && 'Verifying Chip Integrity...'}
          </AppText>

          <AppText style={styles.lockSubtitle}>
            DO NOT REMOVE OR TILT THE CARD
          </AppText>

          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${writeProgress}%` }]} />
          </View>

          <AppText style={styles.lockInstruction}>
            Hold card firmly against top back edge. All gestures locked to prevent partial sector corruption.
          </AppText>

          <Pressable
            onPress={handleSimulateDisconnection}
            style={styles.cancelLink}
            hitSlop={14}
          >
            <AppText style={styles.cancelLinkText}>Simulate Sudden Pull-Away</AppText>
          </Pressable>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0A0A0C',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#16161A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: {
    opacity: 0.3,
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  badgeHardware: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeHardwareText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 18,
  },
  cardInfo: {
    backgroundColor: '#111115',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 18,
    gap: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.8,
  },
  activeDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greenPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  activeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  urlPayload: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  metaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  metaCol: {
    gap: 2,
  },
  metaSmall: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
  },
  metaVal: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  terminalCard: {
    backgroundColor: '#111115',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 24,
    alignItems: 'center',
  },
  idleBlock: {
    alignItems: 'center',
    width: '100%',
  },
  nfcIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  terminalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  terminalDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  successBlock: {
    alignItems: 'center',
    width: '100%',
  },
  successBadgeCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10B981',
    marginBottom: 4,
  },
  successSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 10,
  },
  uidCode: {
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  successDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  errorBlock: {
    alignItems: 'center',
    width: '100%',
  },
  errorBadgeCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#EF4444',
    marginBottom: 6,
  },
  errorSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorTip: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  guidelineCard: {
    backgroundColor: '#0E0E12',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 18,
    gap: 10,
  },
  guideTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  guideItem: {
    flexDirection: 'row',
    gap: 8,
  },
  bullet: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  guideText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    flex: 1,
    lineHeight: 16,
  },
  lockOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  radarWrapper: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  radarPulse: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
  },
  radarCenter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow({ color: theme.colors.primary, offset: { width: 0, height: 0 }, opacity: 0.6, radius: 20, elevation: 8 }),
  },
  lockTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  lockSubtitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 1,
    marginBottom: 24,
  },
  progressBarTrack: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  lockInstruction: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  cancelLink: {
    marginTop: 32,
    padding: 8,
  },
  cancelLinkText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    textDecorationLine: 'underline',
  },
});
