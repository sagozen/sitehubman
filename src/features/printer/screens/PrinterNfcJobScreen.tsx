import { IosScrollView } from '@/src/components/IosScrollView';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { theme } from '@/src/constants/theme';
import { useAuth } from '@/src/hooks/useAuth';
import { usePrinterJobs } from '@/src/hooks/usePrinterJobs';
import { getOrder, saveNfcWrite, updateNfcStatus, updatePrinterJob } from '@/src/services/firestoreService';
import { type CardIdentity, getCardIdentity } from '@/src/services/cardIdentityService';
import { readNfcUrl, writeNfcUrl } from '@/src/services/nfcManagerService';
import { Order } from '@/src/types/models';

// Step bar: icons instead of numbered dots.
const STEP_DEFS = [
  { label: 'Preview',  icon: 'Eye'        as const },
  { label: 'Print',    icon: 'Printer'    as const },
  { label: 'Write',    icon: 'Nfc'        as const },
  { label: 'Verify',   icon: 'BadgeCheck' as const },
] as const;

const workflowTone = {
  done: theme.status.success,
  doneLabel: theme.statusText.success,
  current: theme.status.active,
  currentLabel: theme.statusText.active,
  future: theme.colors.iconInactive,
  rail: 'rgba(60,60,67,0.12)',
  doneConnector: 'rgba(48,209,88,0.32)',
  currentConnector: 'rgba(0,122,255,0.24)',
} as const;

function StepBar({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <View style={sb.row}>
      {STEP_DEFS.map((step, i) => {
        const done   = i + 1 < current;
        const active = i + 1 === current;
        const iconColor = done
          ? workflowTone.done
          : active
            ? workflowTone.current
            : workflowTone.future;
        const bgColor = done
          ? 'rgba(48,209,88,0.12)'
          : active
            ? 'rgba(0,122,255,0.10)'
            : theme.colors.surfaceSoft;
        const textColor = done
          ? workflowTone.doneLabel
          : active
            ? workflowTone.currentLabel
            : workflowTone.future;

        return (
          <View key={step.label} style={sb.item}>
            {/* Connector line before this step */}
            {i > 0 && (
              <View style={[sb.line, done && sb.lineDone, active && sb.lineActive]} />
            )}
            <View style={[sb.iconWrap, { backgroundColor: bgColor }]}>
              <AppIcon name={step.icon} size={14} color={iconColor} />
            </View>
            <AppText style={[sb.label, { color: textColor }, active && sb.labelActive]}>
              {step.label}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const sb = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 0,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.iconInactive,
  },
  labelActive: {
    fontWeight: '600',
  },
  line: {
    width: 18,
    height: 1,
    backgroundColor: workflowTone.rail,
    marginHorizontal: 2,
    borderRadius: 1,
  },
  lineDone: {
    backgroundColor: workflowTone.doneConnector,
  },
  lineActive: {
    backgroundColor: workflowTone.currentConnector,
  },
});

// Main screen.
function normalizeUrlForCompare(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

export default function NfcProgrammingScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const { user } = useAuth();
  const { jobs } = usePrinterJobs();
  const job = jobs.find(j => j.id === jobId) ?? null;
  const [order, setOrder] = useState<Order | null>(null);
  const [card, setCard] = useState<CardIdentity | null>(null);
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [printStarted, setPrintStarted] = useState(false);
  const [printed, setPrinted] = useState(false);
  const [written, setWritten] = useState(false);
  const [verified, setVerified] = useState(false);
  const [lastReadUrl, setLastReadUrl] = useState('');
  const wave = useRef(new Animated.Value(0)).current;
  const sheen = useRef(new Animated.Value(0)).current;
  const success = useRef(new Animated.Value(0)).current;
  const payloadUrl = card
    ? card.lockedPublicProfileUrl || card.printProfileUrl || card.publicProfileUrl
    : '';

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      if (!job?.orderId) return;
      const loadedOrder = await getOrder(job.orderId);
      if (cancelled) return;
      setOrder(loadedOrder);
      const resolvedCardId = job.cardId || loadedOrder?.cardId || loadedOrder?.cardCode || '';
      const loadedCard = resolvedCardId ? await getCardIdentity(resolvedCardId) : null;
      if (!cancelled) setCard(loadedCard);
    }
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [job?.cardId, job?.orderId]);

  useEffect(() => {
    setPrinted(Boolean(job && !['received', 'reprint', 'failed'].includes(job.stage)));
    setWritten(Boolean(job && (
      job.stage === 'nfc_encoding' ||
      job.stage === 'quality_check' ||
      job.stage === 'ready_to_ship' ||
      job.stage === 'completed'
    )));
    setVerified(Boolean(job && (
      job.stage === 'quality_check' ||
      job.stage === 'ready_to_ship' ||
      job.stage === 'completed'
    )));
  }, [job]);

  useEffect(() => {
    if (printed) {
      setPrintStarted(false);
      setPrinting(false);
    }
  }, [printed]);

  useEffect(() => {
    const waveLoop = Animated.loop(
      Animated.timing(wave, {
        toValue: 1,
        duration: loading ? 950 : 1800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    );
    const sheenLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(900),
        Animated.timing(sheen, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
        Animated.timing(sheen, { toValue: 0, duration: 1, useNativeDriver: true }),
      ])
    );
    waveLoop.start();
    sheenLoop.start();
    return () => { waveLoop.stop(); sheenLoop.stop(); };
  }, [loading, sheen, wave]);

  useEffect(() => {
    if (!verified) return;
    success.setValue(0);
    Animated.timing(success, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [success, verified]);

  // No jobId guard
  if (!jobId) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.replace('/printer/queue')} style={styles.backBtn} hitSlop={12}>
            <AppIcon name="ChevronLeft" size={20} color={theme.colors.textPrimary} />
          </Pressable>
          <View style={styles.headerInfo}>
            <AppText style={styles.headerTitle}>NFC Encode</AppText>
          </View>
        </View>
        <View style={styles.emptyState}>
          <AppIcon name="Nfc" size={40} color={theme.colors.iconInactive} />
          <AppText weight="semibold" style={styles.emptyTitle}>No job selected</AppText>
          <AppText variant="caption" tone="muted" style={styles.emptyBody}>
            Go to the queue and tap a job to start NFC programming.
          </AppText>
          <Pressable
            style={({ pressed }) => [styles.softBtn, pressed && styles.softBtnPressed]}
            onPress={() => router.replace('/printer/queue')}
          >
            <AppText style={styles.softBtnText}>Back to Queue</AppText>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  async function handleWrite() {
    if (!user || !job || !order || !card || !printed) return;
    if (!payloadUrl.trim()) {
      Alert.alert('Missing public URL', 'Card publicProfileUrl is missing. Cannot write NFC.');
      return;
    }
    setLoading(true);
    try {
      await updateNfcStatus(card.cardId, 'writing', user.id);
      await writeNfcUrl(payloadUrl);
      await saveNfcWrite({
        chipUID: card.cardId,
        profileUrl: payloadUrl,
        orderId: order.id,
        cardId: card.cardId,
        cardCode: card.cardId,
        jobId: job.id,
        writtenBy: user.id,
        ownerUserId: order.createdBy,
        profileId: order.createdBy,
      });
      await updateNfcStatus(card.cardId, 'written', user.id);
      if (job.stage === 'printing') {
        await updatePrinterJob(job.id, 'nfc_encoding', undefined, user.id);
      }
      setWritten(true);
    } catch (err) {
      if (card?.cardId) await updateNfcStatus(card.cardId, 'failed', user.id);
      Alert.alert('Write failed', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function handleStartPrint() {
    if (!job || !order || printing) return;
    setPrintStarted(true);
    setPrinting(true);
  }

  async function handlePrintFailed() {
    if (!user || !job || !order) return;
    setLoading(true);
    try {
      await updatePrinterJob(
        job.id,
        'reprint',
        {
          failedCards: job.failedCards + Math.max(1, order.quantity),
          notes: `Print failed for ${order.customerName}. Retry required.`,
        },
        user.id
      );
      setPrintStarted(false);
      setPrinting(false);
      Alert.alert('Print marked failed', 'Retry the print after checking material and printer settings.');
    } catch (err) {
      Alert.alert('Print failure update failed', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkPrinted() {
    if (!user || !job || !order) return;
    setLoading(true);
    try {
      await updatePrinterJob(
        job.id,
        'printing',
        {
          cardsPrinted: Math.max(order.quantity, job.cardsPrinted),
          notes: `Printed confirmed for ${order.customerName}.`,
        },
        user.id
      );
      setPrinted(true);
      setPrintStarted(false);
    } catch (err) {
      Alert.alert('Print confirmation failed', (err as Error).message);
    } finally {
      setLoading(false);
      setPrinting(false);
    }
  }

  async function handleVerifyTap() {
    if (!user || !job || !order || !card || !written) return;
    setLoading(true);
    try {
      const readUrl = await readNfcUrl();
      setLastReadUrl(readUrl);
      if (normalizeUrlForCompare(readUrl) !== normalizeUrlForCompare(payloadUrl)) {
        throw new Error(`NFC URL mismatch. Expected ${payloadUrl}, read ${readUrl}.`);
      }
      await updateNfcStatus(card.cardId, 'verified', user.id);
      if (job.stage === 'nfc_encoding') {
        await updatePrinterJob(job.id, 'quality_check', undefined, user.id);
      }
      setVerified(true);
    } catch (err) {
      Alert.alert('Verification failed', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function handleSimulateTap() {
    if (!card?.publicSlug) {
      Alert.alert('Missing public slug', 'This card does not have a publicSlug yet.');
      return;
    }
    router.push(`/c/${encodeURIComponent(card.publicSlug)}`);
  }

  const currentStep: 1 | 2 | 3 | 4 = verified
    ? 4
    : written
      ? 4
      : printed
        ? 3
        : printStarted
          ? 2
          : 1;
  const tapTitleText = verified
    ? 'NFC tap verified'
    : written
      ? 'Read the NFC card to verify'
      : loading
        ? 'Working on card...'
        : printed
          ? 'Write NFC URL to card'
          : printStarted || printing
            ? 'Confirm print result'
            : 'Preview label before print';
  const tapSubtitleText = verified
    ? 'URL matched. Record QA video or move the job to shipping.'
    : written
      ? 'Tap the card and compare the URL before sending to QA.'
      : printed
        ? 'The printed card is confirmed. Next write the NFC chip.'
        : 'Check customer, quantity, card code, and profile URL before printing.';

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <AppIcon name="ChevronLeft" size={20} color={theme.colors.textPrimary} />
          </Pressable>
          <View style={styles.headerInfo}>
            <AppText variant="caption" tone="muted" style={styles.headerSub}>
              Job #{String(job?.queueNumber ?? '').slice(-4)}
            </AppText>
            <AppText weight="semibold" style={styles.headerTitle}>NFC Encode</AppText>
          </View>
        </View>
        <StepBar current={currentStep} />
      </View>

      <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Live Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <AppIcon name="Clock" size={13} color={theme.status.info} />
            <View>
              <AppText style={styles.statValue}>
                {currentStep === 2 && printing ? '⏱️' : currentStep === 3 && loading ? '⚡' : '✓'}
              </AppText>
              <AppText style={styles.statLabel}>Status</AppText>
            </View>
          </View>
          <View style={styles.statPill}>
            <AppIcon name="CircleCheck" size={13} color={theme.status.success} />
            <View>
              <AppText style={styles.statValue}>{verified ? '4/4' : written ? '3/4' : printed ? '2/4' : printStarted ? '1/4' : '0/4'}</AppText>
              <AppText style={styles.statLabel}>Steps</AppText>
            </View>
          </View>
          <View style={styles.statPill}>
            <AppIcon name="Package" size={13} color={theme.colors.textMuted} />
            <View>
              <AppText style={styles.statValue}>{order?.quantity ?? 1}x</AppText>
              <AppText style={styles.statLabel}>Qty</AppText>
            </View>
          </View>
        </View>

        {/* Label preview */}
        {order && (
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <AppIcon name="Eye" size={14} color={theme.colors.textMuted} />
              <AppText variant="caption" weight="medium" style={styles.infoLabel}>
                PREVIEW LABEL BEFORE PRINT
              </AppText>
            </View>
            <View style={styles.labelPreview}>
              <View style={styles.labelHeader}>
                <View style={styles.labelBrand}>
                  <AppIcon name="Nfc" size={16} color={theme.colors.textPrimary} />
                  <AppText style={styles.labelBrandText}>Snap Tap NFC</AppText>
                </View>
                <AppText style={styles.labelQty}>{order.quantity}x</AppText>
              </View>
              <AppText weight="semibold" style={styles.infoValue}>
                {order.customerName}
              </AppText>
              <AppText variant="caption" tone="muted" style={styles.labelLine}>
                {[order.jobTitle, order.company].filter(Boolean).join(' - ') || order.productType.replace(/_/g, ' ')}
              </AppText>
              <View style={styles.labelGrid}>
                <View style={styles.labelGridItem}>
                  <AppText style={styles.labelGridKey}>Order</AppText>
                  <AppText style={styles.labelGridValue}>{order.orderNumber ?? order.id.slice(0, 8)}</AppText>
                </View>
                <View style={styles.labelGridItem}>
                  <AppText style={styles.labelGridKey}>Card</AppText>
                  <AppText style={styles.labelGridValue}>{card?.cardId ?? order.cardId ?? order.cardCode}</AppText>
                </View>
              </View>
              <AppText variant="caption" tone="muted" style={styles.payloadLine} numberOfLines={2}>
                {payloadUrl}
              </AppText>
            </View>
            {job?.stage === 'reprint' ? (
              <View style={styles.reprintNotice}>
                <AppIcon name="RefreshCw" size={14} color="#C93400" />
                <AppText style={styles.reprintText}>Previous print failed. Retry after checking printer and material.</AppText>
              </View>
            ) : null}
          </View>
        )}

        {/* NFC tap zone */}
        <View style={[styles.tapZone, verified && styles.tapZoneDone]}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.tapWave,
              {
                opacity: wave.interpolate({ inputRange: [0, 0.68, 1], outputRange: [0.18, 0.06, 0] }),
                transform: [{ scale: wave.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1.34] }) }],
              },
            ]}
          />
          {verified ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.successRipple,
                {
                  opacity: success.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.22, 0.08, 0] }),
                  transform: [{ scale: success.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.7] }) }],
                },
              ]}
            />
          ) : null}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.cardSheen,
              {
                transform: [
                  { translateX: sheen.interpolate({ inputRange: [0, 1], outputRange: [-180, 260] }) },
                  { rotate: '-18deg' },
                ],
              },
            ]}
          />
          <View style={[styles.nfcOrb, verified && styles.nfcOrbDone]}>
            <AppIcon
              name={verified ? 'ShieldCheck' : printed ? 'Nfc' : 'Printer'}
              size={48}
              color={verified ? theme.status.success : theme.colors.textMuted}
            />
          </View>
          <AppText weight="semibold" style={[styles.tapTitle, verified && styles.tapTitleDone]}>
            {tapTitleText}
          </AppText>
          <AppText variant="caption" tone="muted" style={styles.tapSub}>
            {tapSubtitleText}
          </AppText>
          <AppText weight="semibold" style={styles.hidden}>
            {verified
              ? 'NFC tap verified'
              : written
                ? 'Securing chip...'
                : loading
                  ? 'Writing URL payload...'
                  : printed
                    ? 'Write NFC URL to card'
                    : printing
                      ? 'Printing NFC card...'
                      : 'Preview label before print'}
          </AppText>
          <AppText variant="caption" tone="muted" style={styles.hidden}>
            {!printed && 'Check customer, quantity, card code, and profile URL before printing.'}
            {printed && !written && 'The printed card is confirmed. Next write the NFC chip.'}
            {written && !verified && 'Tap the card and compare the URL before sending to QA.'}
            {verified && 'Chip locked - record QA video to send for inspection'}
          </AppText>
        </View>

        {/* Workflow steps */}
        <View style={styles.stepsCard}>
          {STEP_DEFS.map((step, i) => {
            const done =
              verified ||
              (written && i < 3) ||
              (printed && i < 2) ||
              (printStarted && i === 0);
            const iconColor = done ? theme.status.success : theme.colors.iconInactive;
            const bgColor   = done ? 'rgba(48,209,88,0.10)' : theme.colors.surfaceSoft;
            return (
              <View key={step.label} style={styles.stepsItem}>
                <View style={[styles.stepsIconWrap, { backgroundColor: bgColor }]}>
                  <AppIcon name={step.icon} size={14} color={iconColor} />
                </View>
                <AppText
                  variant="caption"
                  style={[styles.stepsLabel, done && styles.stepsLabelDone]}
                >
                  {step.label}
                </AppText>
              </View>
            );
          })}
        </View>

        {/* Warning */}
        <View style={styles.warningCard}>
          <AppIcon name="ShieldCheck" size={14} color="#C93400" />
          <AppText variant="caption" style={styles.warningText}>
            Once locked, chip cannot be rewritten.
          </AppText>
        </View>

        {/* Primary action */}
        {!printed ? (
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              (loading || printStarted) && styles.actionBtnDisabled,
              pressed && !loading && !printStarted && styles.actionBtnPressed,
            ]}
            disabled={loading || printStarted}
            onPress={handleStartPrint}
          >
            <AppIcon name="Printer" size={17} color={theme.colors.textPrimary} />
            <AppText style={styles.actionBtnText}>
              {printStarted ? 'Waiting for print result' : job?.stage === 'reprint' ? 'Retry Print' : 'Start Print'}
            </AppText>
            <AppText style={styles.hidden}>
              {printing ? 'Printing...' : 'Print NFC Card'}
            </AppText>
          </Pressable>
        ) : !written ? (
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              (loading || written) && styles.actionBtnDisabled,
              pressed && !loading && !written && styles.actionBtnPressed,
            ]}
            disabled={loading || written}
            onPress={handleWrite}
          >
            <AppIcon name="Nfc" size={17} color={verified ? theme.status.success : theme.colors.textPrimary} />
            <AppText style={[styles.actionBtnText, verified && { color: theme.status.success }]}>
              {verified ? 'Chip Locked' : loading ? 'Writing...' : 'Write NFC'}
            </AppText>
          </Pressable>
        ) : null}

        {/* QA continue */}
        {!printed && printStarted ? (
          <View style={styles.decisionRow}>
            <Pressable
              style={({ pressed }) => [styles.failBtn, pressed && styles.actionBtnPressed]}
              disabled={loading}
              onPress={() => void handlePrintFailed()}
            >
              <AppIcon name="RefreshCw" size={16} color="#C93400" />
              <AppText style={styles.failBtnText}>Print Failed</AppText>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.successBtn, pressed && styles.actionBtnPressed]}
              disabled={loading}
              onPress={() => void handleMarkPrinted()}
            >
              <AppIcon name="CircleCheck" size={16} color={theme.statusText.success} />
              <AppText style={styles.successBtnText}>Mark Printed</AppText>
            </Pressable>
          </View>
        ) : null}

        {written && !verified ? (
          <>
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                loading && styles.actionBtnDisabled,
                pressed && !loading && styles.actionBtnPressed,
              ]}
              disabled={loading}
              onPress={() => void handleVerifyTap()}
            >
              <AppIcon name="BadgeCheck" size={17} color={theme.colors.textPrimary} />
              <AppText style={styles.actionBtnText}>{loading ? 'Reading NFC...' : 'Verify Tap'}</AppText>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.simulateBtn, pressed && styles.actionBtnPressed]}
              disabled={loading}
              onPress={handleSimulateTap}
            >
              <AppIcon name="ExternalLink" size={16} color={theme.colors.textPrimary} />
              <AppText style={styles.simulateBtnText}>Simulate NFC Tap</AppText>
            </Pressable>
          </>
        ) : null}

        {lastReadUrl ? (
          <View style={styles.readBackCard}>
            <AppIcon name="Link" size={14} color={theme.status.success} />
            <AppText style={styles.readBackText} numberOfLines={2}>Read: {lastReadUrl}</AppText>
          </View>
        ) : null}

        {verified && (
          <>
            <Pressable
              style={({ pressed }) => [styles.qaBtn, pressed && styles.qaBtnPressed]}
              onPress={() => router.push({ pathname: '/printer/qa/[jobId]', params: { jobId: job!.id } })}
            >
              <AppIcon name="ShieldCheck" size={16} color={theme.statusText.success} />
              <AppText style={styles.qaBtnText}>Continue to QA Video</AppText>
            </Pressable>
            
            <Pressable
              style={({ pressed }) => [styles.nextJobBtn, pressed && styles.actionBtnPressed]}
              onPress={() => {
                const nextJob = jobs.find(j => j.stage === 'received' && j.id !== jobId);
                if (nextJob) {
                  router.replace(`/printer/nfc/${nextJob.id}`);
                } else {
                  router.replace('/printer/queue');
                }
              }}
            >
              <AppText style={styles.nextJobBtnText}>
                {jobs.find(j => j.stage === 'received' && j.id !== jobId) ? 'Next Job →' : '← Back to Queue'}
              </AppText>
            </Pressable>
          </>
        )}

      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  hidden: {
    display: 'none',
  },

  // Header
  header: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xs,
    paddingBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60,60,67,0.06)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: 2,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: { gap: 1 },
  headerSub: { fontSize: 11 },
  headerTitle: {
    fontSize: 18,
    color: theme.colors.textPrimary,
  },

  scroll: {
    padding: theme.spacing.md,
    paddingBottom: 120,
    gap: theme.spacing.sm,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 11,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(60,60,67,0.06)',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.colors.textPrimary,
    lineHeight: 18,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginTop: 1,
  },

  // Info card
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(60,60,67,0.06)',
    ...theme.shadows.card,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  infoLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  labelPreview: {
    gap: 8,
    backgroundColor: theme.colors.surfaceSoft,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(60,60,67,0.08)',
  },
  labelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  labelBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  labelBrandText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  labelQty: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.statusText.success,
  },
  labelLine: {
    lineHeight: 18,
  },
  labelGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  labelGridItem: {
    flex: 1,
    gap: 2,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    padding: 8,
  },
  labelGridKey: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textMuted,
  },
  labelGridValue: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  payloadLine: {
    lineHeight: 17,
  },
  reprintNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,149,0,0.08)',
    borderRadius: theme.radius.md,
    padding: 10,
  },
  reprintText: {
    flex: 1,
    color: '#C93400',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },

  // Tap zone
  tapZone: {
    height: 230,
    borderRadius: theme.radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(60,60,67,0.06)',
    ...theme.shadows.floating,
  },
  tapZoneDone: {
    borderColor: 'rgba(48,209,88,0.18)',
  },
  tapWave: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: theme.colors.surfaceSoft,
  },
  successRipple: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(48,209,88,0.10)',
  },
  cardSheen: {
    position: 'absolute',
    top: -70,
    bottom: -70,
    width: 56,
    backgroundColor: 'rgba(255,255,255,0.48)',
  },
  nfcOrb: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.card,
  },
  nfcOrbDone: {
    backgroundColor: 'rgba(48,209,88,0.10)',
  },
  tapTitle: {
    fontSize: 15,
    color: theme.colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  tapTitleDone: {
    color: theme.colors.textPrimary,
  },
  tapSub: {
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
  },

  // Steps card: horizontal icon row.
  stepsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(60,60,67,0.06)',
    ...theme.shadows.card,
  },
  stepsItem: {
    alignItems: 'center',
    gap: 5,
  },
  stepsIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepsLabel: {
    fontSize: 10,
    color: theme.colors.iconInactive,
    fontWeight: '500',
  },
  stepsLabelDone: {
    color: theme.statusText.success,
    fontWeight: '600',
  },

  // Warning
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,149,0,0.08)',
    borderRadius: theme.radius.md,
    padding: 10,
  },
  warningText: {
    color: '#C93400',
    flex: 1,
  },

  // Action button.
  actionBtn: {
    height: 50,
    borderRadius: theme.radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(60,60,67,0.10)',
  },
  actionBtnDisabled: { opacity: 0.45 },
  actionBtnPressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
  actionBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  simulateBtn: {
    marginTop: 10,
    minHeight: 48,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  simulateBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  decisionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  failBtn: {
    flex: 1,
    height: 50,
    borderRadius: theme.radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,149,0,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,149,0,0.24)',
  },
  successBtn: {
    flex: 1,
    height: 50,
    borderRadius: theme.radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(48,209,88,0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(48,209,88,0.22)',
  },
  failBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C93400',
  },
  successBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.statusText.success,
  },
  readBackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: theme.radius.md,
    padding: 10,
    backgroundColor: 'rgba(48,209,88,0.08)',
  },
  readBackText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: theme.statusText.success,
    lineHeight: 17,
  },

  // QA button.
  qaBtn: {
    height: 50,
    borderRadius: theme.radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(48,209,88,0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(48,209,88,0.20)',
  },
  qaBtnPressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
  qaBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.statusText.success,
  },
  nextJobBtn: {
    height: 50,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(60,60,67,0.10)',
  },
  nextJobBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: 17,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  emptyBody: {
    textAlign: 'center',
    lineHeight: 18,
  },
  softBtn: {
    height: 44,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(60,60,67,0.10)',
    marginTop: 4,
  },
  softBtnPressed: { opacity: 0.72 },
  softBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
});
