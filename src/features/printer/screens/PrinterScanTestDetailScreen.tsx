import { IosScrollView } from '@/src/components/IosScrollView';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import {
  PrinterInfoRow,
  PrinterScreenHeader,
  PrinterSurfaceCard,
  printerUi,
} from '@/src/features/printer/components/PrinterScreenUi';
import { useAuth } from '@/src/hooks/useAuth';
import { theme } from '@/src/constants/theme';
import {
  displayTestJobStage,
  displayTestOrderStatus,
  loadPrinterScanTestDetail,
  markPrinterScanTestPrinted,
  PRINTER_SCAN_TEST_BATCH_NUMBER,
  resetPrinterScanTestJob,
} from '@/src/services/printerScanTestService';
import type { Order, PrinterJob } from '@/src/types/models';

export default function PrinterScanTestDetailScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [job, setJob] = useState<PrinterJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const hydrate = useCallback(async () => {
    if (!jobId?.trim()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await loadPrinterScanTestDetail(jobId);
      setOrder(data?.order ?? null);
      setJob(data?.job ?? null);
    } catch (error) {
      Alert.alert('Load failed', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  async function handleMarkPrinted() {
    if (!job || !user) return;
    setBusy(true);
    try {
      await markPrinterScanTestPrinted(job.id, user.id);
      await hydrate();
      Alert.alert('Updated', 'Job marked as Printed.');
    } catch (error) {
      Alert.alert('Update failed', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    if (!job || !user) return;
    setBusy(true);
    try {
      await resetPrinterScanTestJob(job.id, user.id);
      await hydrate();
      Alert.alert('Reset', 'Test job is Pending / ReadyToPrint again.');
    } catch (error) {
      Alert.alert('Reset failed', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <AppText style={styles.loading}>Loading test job…</AppText>
      </SafeAreaView>
    );
  }

  if (!order || !job) {
    return (
      <SafeAreaView style={styles.safe}>
        <PrinterScreenHeader title="Test Job" sub="Not found" />
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <AppText style={styles.backBtnText}>Back to Scan</AppText>
        </Pressable>
      </SafeAreaView>
    );
  }

  const batchLabel =
    order.batchId === 'scan_test_batch_001' ? PRINTER_SCAN_TEST_BATCH_NUMBER : order.batchId ?? '—';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.backLink} hitSlop={8}>
          <AppIcon name="ChevronLeft" size={20} color={printerUi.text} />
          <AppText style={styles.backLinkText}>Scan</AppText>
        </Pressable>

        <PrinterScreenHeader title="Test Job Detail" sub="No hardware — Firebase only" />

        <View style={styles.testBadge}>
          <AppIcon name="Info" size={14} color="#B45309" />
          <AppText style={styles.testBadgeText}>Scan test mode</AppText>
        </View>

        <PrinterSurfaceCard>
          <PrinterInfoRow icon="User" title="Customer" value={order.customerName} />
          <PrinterInfoRow icon="QrCode" title="UID" value={order.cardCode} />
          <PrinterInfoRow icon="ClipboardList" title="Batch ID" value={batchLabel} />
          <PrinterInfoRow icon="CreditCard" title="Status" value={displayTestOrderStatus(order.status)} />
          <PrinterInfoRow icon="Printer" title="Stage" value={displayTestJobStage(job.stage)} last />
        </PrinterSurfaceCard>

        <View style={styles.actions}>
          <Pressable
            style={[styles.primaryBtn, busy && styles.btnDisabled]}
            onPress={() => void handleMarkPrinted()}
            disabled={busy || job.stage !== 'received'}
          >
            <AppIcon name="Printer" size={16} color="#FFFFFF" />
            <AppText style={styles.primaryBtnText}>Mark as Printed</AppText>
          </Pressable>

          <Pressable
            style={[styles.secondaryBtn, busy && styles.btnDisabled]}
            onPress={() => void handleReset()}
            disabled={busy}
          >
            <AppIcon name="RefreshCw" size={16} color={printerUi.text} />
            <AppText style={styles.secondaryBtnText}>Reset Test Job</AppText>
          </Pressable>
        </View>
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: printerUi.bg },
  scroll: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
  loading: { textAlign: 'center', marginTop: 40, color: printerUi.muted, fontWeight: '600' },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  backLinkText: { fontSize: 14, fontWeight: '700', color: printerUi.text, fontFamily: theme.typography.fontFamilyBold },
  testBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 10,
    marginBottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFFBEB',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#FDE68A',
  },
  testBadgeText: { fontSize: 12, fontWeight: '800', color: '#B45309', fontFamily: theme.typography.fontFamilyBold },
  actions: { marginTop: 16, gap: 10 },
  primaryBtn: {
    height: 48,
    borderRadius: printerUi.radiusMd,
    backgroundColor: printerUi.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', fontFamily: theme.typography.fontFamilyBold },
  secondaryBtn: {
    height: 48,
    borderRadius: printerUi.radiusMd,
    backgroundColor: printerUi.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: printerUi.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...printerUi.shadow,
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '800', color: printerUi.text, fontFamily: theme.typography.fontFamilyBold },
  btnDisabled: { opacity: 0.55 },
  backBtn: {
    margin: 18,
    height: 48,
    borderRadius: printerUi.radiusMd,
    backgroundColor: printerUi.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: { color: '#FFFFFF', fontWeight: '800', fontFamily: theme.typography.fontFamilyBold },
});
