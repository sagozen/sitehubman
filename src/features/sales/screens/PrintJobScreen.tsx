/**
 * PrintJobScreen — Print execution page for an order.
 *
 * Opens when sales clicks "Start Printing" on the order detail.
 * Shows order summary, selected printer, and a "Print Now" button.
 * For now this is manual (no real printer connection) — it just
 * advances the order status. When real printer SDK is added,
 * this is where the print command will fire.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AltArrowLeftBoldDuotone,
  PrinterBoldDuotone,
  CheckCircleBoldDuotone,
  Card2BoldDuotone,
  BoltCircleBoldDuotone,
} from '@solar-icons/react-native';
import { AppText } from '@/src/components/AppText';
import { getOrder, updateOrderDetails } from '@/src/services/firestoreService';
import { getDefaultPrinter, type PrinterConfig } from '@/src/services/printerStorageService';
import { getAuthErrorMessage } from '@/src/services/authService';
import { productTypeOptions } from '@/src/constants/options';
import { formatOrderTotal } from '@/src/utils/orderPricing';
import { useAuth } from '@/src/hooks/useAuth';
import type { Order } from '@/src/types/models';

// ─── Tokens ──────────────────────────────────────────────────────────────────
const BG      = '#F7F8FC';
const SURFACE = '#FFFFFF';
const SURF2   = '#F1F5F9';
const BORDER  = 'rgba(15,23,42,0.07)';
const INK     = '#0F172A';
const MUTED   = '#64748B';
const DIM     = '#94A3B8';
const PURPLE  = '#7C3AED';
const PURPLED = 'rgba(124,58,237,0.10)';
const PURPLEL = 'rgba(124,58,237,0.22)';
const GREEN   = '#059669';
const GREEND  = 'rgba(5,150,105,0.10)';
const TEAL    = '#0891B2';
const TEALD   = 'rgba(8,145,178,0.10)';
const AMBER   = '#D97706';

// ─── Step config ─────────────────────────────────────────────────────────────
const PRINT_STEPS = [
  { status: 'printing',    label: 'Printing Card',  sub: 'Laser engrave / UV print the physical card',        color: PURPLE,  bg: PURPLED,  nextLabel: 'Done Printing → Write NFC' },
  { status: 'nfc_writing', label: 'Writing NFC',     sub: 'Tap card to phone to write profile data to NFC chip', color: TEAL,    bg: TEALD,    nextLabel: 'NFC Written → QA Check' },
  { status: 'qa_pending',  label: 'Quality Check',   sub: 'Verify card looks good, NFC reads correctly',         color: AMBER,   bg: 'rgba(217,119,6,0.10)', nextLabel: 'QA Pass → Ready to Ship' },
];

export default function PrintJobScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{ orderId?: string }>();
  const orderId = typeof params.orderId === 'string' ? params.orderId : '';

  const [order, setOrder] = useState<Order | null>(null);
  const [printer, setPrinter] = useState<PrinterConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const load = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const o = await getOrder(orderId);
      setOrder(o);
      const p = await getDefaultPrinter();
      setPrinter(p);
      // Determine which step we're on
      const idx = PRINT_STEPS.findIndex(s => s.status === o.status);
      setCurrentStep(idx >= 0 ? idx : 0);
    } catch (e) {
      Alert.alert('Error', getAuthErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { void load(); }, [load]);

  const step = PRINT_STEPS[currentStep] ?? PRINT_STEPS[0];
  const product = productTypeOptions.find(p => p.value === order?.productType) ?? productTypeOptions[0];
  const orderRef = order ? `#${order.orderNumber ?? order.id.slice(0, 8).toUpperCase()}` : '';

  async function handleNextStep() {
    if (!order) return;

    // Determine what status to move to
    let nextStatus = '';
    if (currentStep === 0) nextStatus = 'nfc_writing';
    else if (currentStep === 1) nextStatus = 'qa_pending';
    else if (currentStep === 2) nextStatus = 'ready_to_ship';
    else nextStatus = 'ready_to_ship';

    setSaving(true);
    try {
      await updateOrderDetails(order.id, { status: nextStatus }, user?.id);
      if (currentStep < PRINT_STEPS.length - 1) {
        setCurrentStep(prev => prev + 1);
        setOrder(prev => prev ? { ...prev, status: nextStatus } : prev);
      } else {
        // All print steps done — go back to order detail
        Alert.alert('✅ All Done!', 'Card printed, NFC written, and QA passed. Ready to ship!', [
          { text: 'Back to Order', onPress: () => router.back() },
        ]);
      }
    } catch (e) {
      Alert.alert('Error', getAuthErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={PURPLE} size="large" />
        <AppText style={s.centerTxt}>Loading print job…</AppText>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={s.center}>
        <AppText style={{ fontSize: 40 }}>😕</AppText>
        <AppText style={s.centerTxt}>Order not found</AppText>
        <Pressable style={s.backButton} onPress={() => router.back()}>
          <AppText style={s.backButtonTxt}>Go Back</AppText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.headerBtn} hitSlop={12}>
            <AltArrowLeftBoldDuotone size={20} color={INK} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <AppText style={s.headerEye}>PRINT JOB</AppText>
            <AppText style={s.headerTitle}>{orderRef}</AppText>
          </View>
          <View style={s.headerBtn}>
            <PrinterBoldDuotone size={18} color={PURPLE} />
          </View>
        </View>

        <View style={s.scroll}>
          {/* Order Summary */}
          <View style={s.summaryCard}>
            <View style={s.summaryRow}>
              <View style={s.summaryIcon}>
                <Card2BoldDuotone size={22} color={PURPLE} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText style={s.summaryTitle}>{product?.label ?? 'NFC Card'}</AppText>
                <AppText style={s.summarySub}>
                  {order.customerName} · Qty: {order.quantity ?? 1}
                </AppText>
              </View>
              <AppText style={s.summaryPrice}>{formatOrderTotal(order)}</AppText>
            </View>
          </View>

          {/* Printer Info */}
          <View style={s.printerCard}>
            <View style={s.printerRow}>
              <View style={[s.printerIcon, { backgroundColor: printer ? PURPLED : SURF2 }]}>
                <PrinterBoldDuotone size={20} color={printer ? PURPLE : DIM} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText style={s.printerName}>
                  {printer?.name ?? 'No printer configured'}
                </AppText>
                <AppText style={s.printerSub}>
                  {printer ? `${printer.ipAddress}:${printer.port}` : 'Go to Settings → My Printers to add one'}
                </AppText>
              </View>
              {printer && (
                <View style={[s.statusDot, { backgroundColor: printer.lastTestResult === 'ok' ? GREEN : DIM }]} />
              )}
            </View>
            {!printer && (
              <Pressable
                style={s.setupBtn}
                onPress={() => router.push('/printer-settings' as any)}
              >
                <AppText style={s.setupBtnTxt}>Setup Printer</AppText>
              </Pressable>
            )}
          </View>

          {/* Step Progress */}
          <View style={s.stepsCard}>
            <AppText style={s.stepsTitle}>PRINT PROGRESS</AppText>
            {PRINT_STEPS.map((ps, i) => {
              const isDone = i < currentStep;
              const isActive = i === currentStep;
              const isFuture = i > currentStep;
              return (
                <View key={ps.status} style={s.stepRow}>
                  <View style={s.stepTrack}>
                    <View style={[
                      s.stepDot,
                      isDone && { backgroundColor: GREEN, borderColor: GREEN },
                      isActive && { backgroundColor: PURPLED, borderColor: ps.color, borderWidth: 2.5 },
                      isFuture && { backgroundColor: SURF2, borderColor: BORDER },
                    ]}>
                      {isDone && (
                        <AppText style={{ fontSize: 10, color: '#FFF' }}>✓</AppText>
                      )}
                    </View>
                    {i < PRINT_STEPS.length - 1 && (
                      <View style={[s.stepLine, isDone && { backgroundColor: GREEN }]} />
                    )}
                  </View>
                  <View style={[s.stepContent, i === PRINT_STEPS.length - 1 && { paddingBottom: 0 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <AppText style={[
                        s.stepLabel,
                        isDone && { color: INK },
                        isActive && { color: ps.color, fontWeight: '900' },
                        isFuture && { color: DIM },
                      ]}>
                        {ps.label}
                      </AppText>
                      {isActive && (
                        <View style={[s.nowBadge, { backgroundColor: ps.bg, borderColor: ps.color }]}>
                          <AppText style={[s.nowTxt, { color: ps.color }]}>NOW</AppText>
                        </View>
                      )}
                      {isDone && (
                        <View style={[s.nowBadge, { backgroundColor: GREEND }]}>
                          <AppText style={[s.nowTxt, { color: GREEN }]}>DONE</AppText>
                        </View>
                      )}
                    </View>
                    <AppText style={[
                      s.stepSub,
                      isFuture && { color: DIM },
                    ]}>{ps.sub}</AppText>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Action Button */}
        <View style={s.footer}>
          <Pressable
            style={[s.actionBtn, { backgroundColor: step.color }, saving && { opacity: 0.5 }]}
            onPress={handleNextStep}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <BoltCircleBoldDuotone size={20} color="#FFF" />
            )}
            <AppText style={s.actionTxt}>
              {saving ? 'Processing…' : step.nextLabel}
            </AppText>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: BG },
  centerTxt: { fontSize: 14, fontWeight: '700', color: MUTED },
  backButton: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: PURPLE, borderRadius: 999, marginTop: 8 },
  backButtonTxt: { color: '#FFF', fontSize: 14, fontWeight: '900' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8, gap: 12,
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: BORDER,
  },
  headerEye: { fontSize: 9, fontWeight: '800', color: DIM, letterSpacing: 2 },
  headerTitle: { fontSize: 15, fontWeight: '900', color: INK, marginTop: 2 },

  scroll: { flex: 1, paddingHorizontal: 20, gap: 14, paddingTop: 12 },

  summaryCard: {
    backgroundColor: SURFACE, borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: BORDER,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  summaryIcon: {
    width: 48, height: 48, borderRadius: 16, backgroundColor: PURPLED,
    alignItems: 'center', justifyContent: 'center',
  },
  summaryTitle: { fontSize: 16, fontWeight: '900', color: INK },
  summarySub: { fontSize: 12, fontWeight: '600', color: MUTED, marginTop: 3 },
  summaryPrice: { fontSize: 18, fontWeight: '900', color: INK },

  printerCard: {
    backgroundColor: SURFACE, borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: BORDER, gap: 12,
  },
  printerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  printerIcon: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  printerName: { fontSize: 14, fontWeight: '800', color: INK },
  printerSub: { fontSize: 11, fontWeight: '600', color: MUTED, marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  setupBtn: {
    backgroundColor: PURPLED, borderRadius: 12, paddingVertical: 12,
    alignItems: 'center', borderWidth: 1, borderColor: PURPLEL,
  },
  setupBtnTxt: { fontSize: 13, fontWeight: '800', color: PURPLE },

  stepsCard: {
    backgroundColor: SURFACE, borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: BORDER, gap: 4,
  },
  stepsTitle: { fontSize: 10, fontWeight: '900', color: DIM, letterSpacing: 1.6, marginBottom: 12 },

  stepRow: { flexDirection: 'row', alignItems: 'stretch' },
  stepTrack: { width: 28, alignItems: 'center' },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: SURF2, borderWidth: 2, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  stepLine: { width: 2, flex: 1, backgroundColor: BORDER, minHeight: 12 },
  stepContent: {
    flex: 1, paddingLeft: 12, paddingBottom: 20, gap: 4,
  },
  stepLabel: { fontSize: 15, fontWeight: '700', color: DIM },
  stepSub: { fontSize: 11, fontWeight: '600', color: MUTED, lineHeight: 16 },
  nowBadge: {
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1,
    borderWidth: 1, borderColor: 'transparent',
  },
  nowTxt: { fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },

  footer: {
    paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12,
    backgroundColor: BG, borderTopWidth: 1, borderColor: BORDER,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, borderRadius: 18, paddingVertical: 18,
    shadowColor: PURPLE, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22, shadowRadius: 16, elevation: 6,
  },
  actionTxt: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 0.1 },
});
