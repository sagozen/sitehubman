/**
 * SalesOrderDetailScreen — Cambodia-simple. 3 taps max.
 *
 *  ORD-9101
 *  Wood NFC Card  $6.99
 *  🟢 Cash Received   🟣 Approved
 *  Customer: Chanthean
 *  Printer: Auto Assigned
 *  ██████░░░░ 60%
 *  [Approve Production]
 *
 * Approve → Printer Picker Sheet → QR Code. Done.
 */
import { IosScrollView } from '@/src/components/IosScrollView';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  AltArrowLeftBoldDuotone,
  RefreshBoldDuotone,
  ShieldCheckBoldDuotone,
  BoltCircleBoldDuotone,
  CheckCircleBoldDuotone,
  CloseCircleBoldDuotone,
  PrinterBoldDuotone,
  Card2BoldDuotone,
  WalletMoneyBoldDuotone,
  UserBoldDuotone,
  CheckCircleBoldDuotone as CheckIcon,
} from '@solar-icons/react-native';
import { AppText } from '@/src/components/AppText';
import { AuthGate } from '@/src/components/AuthGate';
import { productTypeOptions, orderStatusOptions } from '@/src/constants/options';
import { useAuth } from '@/src/hooks/useAuth';
import {
  getOrder,
  updateOrderDetails,
  updateOrderStatus,
  getPrinterJobByOrderId,
} from '@/src/services/firestoreService';
import { confirmSalesProductionApproval } from '@/src/services/salesOrderApprovalService';
import { SalesProductionApprovalModal } from '@/src/features/sales/components/SalesProductionApprovalModal';
import { getAuthErrorMessage } from '@/src/services/authService';
import { getPaymentStatusLabel, isPaymentVerified } from '@/src/services/paymentVerificationService';
import type { Order, OrderStatus, PrinterJob, SalesPaymentConfirmation } from '@/src/types/models';
import {
  buildProductionQrPayload,
  needsSalesApproval,
} from '@/src/utils/orderProduction';
import { formatOrderTotal, getOrderTotalUsd } from '@/src/utils/orderPricing';
import QRCode from 'react-native-qrcode-svg';

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
const AMBER   = '#D97706';
const AMBERD  = 'rgba(217,119,6,0.10)';
const RED     = '#DC2626';

const W = Dimensions.get('window').width;

// ─── Printer options ──────────────────────────────────────────────────────────
interface PrinterOption {
  id: string;
  name: string;
  location: string;
  available: boolean;
}

const PRINTERS: PrinterOption[] = [
  { id: 'auto',      name: 'Auto Assign',  location: 'System picks the best printer', available: true },
  { id: 'printer_a', name: 'Printer A',    location: 'Main Shop — Phnom Penh',        available: true },
  { id: 'printer_b', name: 'Printer B',    location: 'Branch Shop — Siem Reap',       available: true },
  { id: 'printer_c', name: 'Printer C',    location: 'Branch Shop — Battambang',      available: false },
];

// ─── Progress map ─────────────────────────────────────────────────────────────
const STATUS_PROGRESS: Record<string, number> = {
  draft: 0,
  pending_payment: 10,
  payment_verified: 25,
  production_approved: 40,
  printer_assigned: 50,
  printing: 65,
  nfc_writing: 75,
  nfc_verification: 80,
  qa_pending: 88,
  ready_to_ship: 95,
  shipped: 98,
  delivered: 100,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getProgress(status: string) { return STATUS_PROGRESS[status] ?? 0; }
function fmtUsd(v: number) { return `$${v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`; }

// ─── Printer Picker Sheet ─────────────────────────────────────────────────────
function PrinterPickerSheet({
  visible,
  selectedId,
  onSelect,
  onConfirm,
  onClose,
  busy,
}: {
  visible: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  busy: boolean;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={ps.overlay} onPress={onClose}>
        <Pressable style={ps.sheet} onPress={e => e.stopPropagation()}>
          {/* Handle bar */}
          <View style={ps.handle} />

          <AppText style={ps.title}>🖨️  Assign Printer</AppText>
          <AppText style={ps.sub}>Choose a printer for this order. Auto Assign is recommended.</AppText>

          <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
            {PRINTERS.map(p => {
              const selected = selectedId === p.id;
              return (
                <Pressable
                  key={p.id}
                  style={[
                    ps.printerRow,
                    selected && ps.printerRowSelected,
                    !p.available && { opacity: 0.45 },
                  ]}
                  onPress={() => p.available && onSelect(p.id)}
                  disabled={!p.available}
                >
                  <View style={[ps.printerIcon, { backgroundColor: selected ? PURPLED : SURF2 }]}>
                    <PrinterBoldDuotone size={20} color={selected ? PURPLE : MUTED} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <AppText style={[ps.printerName, selected && { color: PURPLE }]}>
                        {p.name}
                      </AppText>
                      {p.id === 'auto' && (
                        <View style={ps.recommendedBadge}>
                          <AppText style={ps.recommendedTxt}>Recommended</AppText>
                        </View>
                      )}
                      {!p.available && (
                        <View style={[ps.recommendedBadge, { backgroundColor: '#FEE2E2' }]}>
                          <AppText style={[ps.recommendedTxt, { color: RED }]}>Offline</AppText>
                        </View>
                      )}
                    </View>
                    <AppText style={ps.printerLoc}>{p.location}</AppText>
                  </View>
                  {selected && <CheckIcon size={20} color={PURPLE} />}
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={ps.btnRow}>
            <Pressable style={ps.cancelBtn} onPress={onClose}>
              <AppText style={ps.cancelTxt}>Cancel</AppText>
            </Pressable>
            <Pressable
              style={[ps.confirmBtn, busy && { opacity: 0.55 }]}
              onPress={onConfirm}
              disabled={busy}
            >
              {busy
                ? <ActivityIndicator color="#FFF" size="small" />
                : <BoltCircleBoldDuotone size={18} color="#FFF" />}
              <AppText style={ps.confirmTxt}>
                {busy ? 'Approving…' : 'Confirm & Approve'}
              </AppText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const ps = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: SURFACE, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40,
    shadowColor: '#000', shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12, shadowRadius: 24, elevation: 16,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: BORDER,
    alignSelf: 'center', marginBottom: 20,
  },
  title: { fontSize: 20, fontWeight: '900', color: INK, marginBottom: 4 },
  sub: { fontSize: 13, fontWeight: '600', color: MUTED, marginBottom: 20, lineHeight: 18 },

  printerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 14, borderRadius: 16, marginBottom: 8,
    borderWidth: 1.5, borderColor: BORDER, backgroundColor: SURFACE,
  },
  printerRowSelected: {
    borderColor: PURPLEL, backgroundColor: PURPLED,
  },
  printerIcon: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  printerName: { fontSize: 15, fontWeight: '800', color: INK },
  printerLoc: { fontSize: 11, fontWeight: '600', color: MUTED, marginTop: 2 },
  recommendedBadge: {
    backgroundColor: PURPLED, borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  recommendedTxt: { fontSize: 9, fontWeight: '900', color: PURPLE },

  btnRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: {
    flex: 1, borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', backgroundColor: SURF2,
    borderWidth: 1, borderColor: BORDER,
  },
  cancelTxt: { fontSize: 15, fontWeight: '800', color: MUTED },
  confirmBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 16, paddingVertical: 16,
    backgroundColor: PURPLE,
    shadowColor: PURPLE, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  confirmTxt: { fontSize: 15, fontWeight: '900', color: '#FFF' },
});

// ─── Full-screen QR Modal ─────────────────────────────────────────────────────
function QrFullScreen({
  visible, qrValue, orderRef, passcode, printerName, onClose,
}: {
  visible: boolean; qrValue: string | null; orderRef: string;
  passcode: string; printerName: string; onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={qr.overlay} onPress={onClose}>
        <Pressable style={qr.card} onPress={e => e.stopPropagation()}>
          <Pressable style={qr.x} onPress={onClose} hitSlop={16}>
            <CloseCircleBoldDuotone size={26} color={DIM} />
          </Pressable>

          <AppText style={qr.eyebrow}>PRINTER STATION</AppText>
          <AppText style={qr.ref}>{orderRef}</AppText>

          {/* Printer name badge */}
          <View style={qr.printerBadge}>
            <PrinterBoldDuotone size={14} color={PURPLE} />
            <AppText style={qr.printerTxt}>{printerName}</AppText>
          </View>

          <AppText style={qr.sub}>Show this QR to the printer operator to start production</AppText>

          <View style={qr.box}>
            {qrValue ? (
              <QRCode value={qrValue} size={210} backgroundColor="transparent" color={INK} />
            ) : (
              <View style={qr.noQr}>
                <AppText style={{ fontSize: 36 }}>⏳</AppText>
                <AppText style={qr.noQrText}>Approve order first to unlock QR</AppText>
              </View>
            )}
          </View>

          {passcode ? (
            <View style={qr.passRow}>
              <AppText style={qr.passLabel}>Passcode</AppText>
              <AppText style={qr.passVal}>{passcode}</AppText>
            </View>
          ) : null}

          <Pressable style={qr.closeBtn} onPress={onClose}>
            <AppText style={qr.closeTxt}>Close</AppText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const qr = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center' },
  card: {
    width: W - 40, backgroundColor: SURFACE, borderRadius: 28,
    padding: 28, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3, shadowRadius: 32, elevation: 18,
    borderWidth: 1, borderColor: PURPLEL,
  },
  x: { position: 'absolute', top: 14, right: 14 },
  eyebrow: { fontSize: 10, fontWeight: '900', color: PURPLE, letterSpacing: 2.5, marginTop: 8 },
  ref: { fontSize: 20, fontWeight: '900', color: INK, marginTop: 6, letterSpacing: -0.3 },
  printerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: PURPLED, borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: PURPLEL, marginTop: 8,
  },
  printerTxt: { fontSize: 12, fontWeight: '800', color: PURPLE },
  sub: { fontSize: 12, color: MUTED, fontWeight: '600', marginTop: 10, marginBottom: 16, textAlign: 'center' },
  box: {
    width: 246, height: 246, borderRadius: 20,
    backgroundColor: SURF2, borderWidth: 1, borderColor: PURPLEL,
    alignItems: 'center', justifyContent: 'center',
  },
  noQr: { alignItems: 'center', gap: 10, padding: 20 },
  noQrText: { fontSize: 14, fontWeight: '800', color: MUTED, textAlign: 'center' },
  passRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginTop: 16, backgroundColor: SURF2, borderRadius: 14,
    paddingHorizontal: 20, paddingVertical: 10,
    borderWidth: 1, borderColor: BORDER,
  },
  passLabel: { fontSize: 11, fontWeight: '700', color: MUTED },
  passVal: { fontSize: 18, fontWeight: '900', color: INK, letterSpacing: 5 },
  closeBtn: {
    marginTop: 18, backgroundColor: PURPLE, borderRadius: 16,
    width: '100%', alignItems: 'center', paddingVertical: 14,
  },
  closeTxt: { color: '#FFF', fontSize: 15, fontWeight: '900' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
function DetailContent() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{ orderId?: string }>();
  const orderId = typeof params.orderId === 'string' ? params.orderId : '';

  const [order, setOrder]               = useState<Order | null>(null);
  const [job, setJob]                   = useState<PrinterJob | null>(null);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState<string | null>(null);

  // Modals
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [printerOpen, setPrinterOpen]   = useState(false);
  const [qrOpen, setQrOpen]             = useState(false);

  // Printer selection
  const [selectedPrinterId, setSelectedPrinterId] = useState('auto');

  // Button animation
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 60 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 60 }).start();

  const load = useCallback(async () => {
    if (!orderId) { setLoading(false); setError('No order ID.'); return; }
    setLoading(true); setError(null);
    try {
      const o = await getOrder(orderId);
      setOrder(o);
      const j = await getPrinterJobByOrderId(orderId).catch(() => null);
      setJob(j);
    } catch (e) {
      setError(getAuthErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { load(); }, [load]);

  const product = useMemo(
    () => productTypeOptions.find(p => p.value === order?.productType) ?? productTypeOptions[0],
    [order?.productType],
  );

  // ── Handlers ─────────────────────────────────────────────────────────────
  async function handleMarkPaid() {
    if (!order) return;
    Alert.alert('Confirm Payment?', 'Mark this order as paid?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: '✓ Mark Paid',
        onPress: async () => {
          setSaving(true);
          try {
            await updateOrderDetails(order.id, { paymentStatus: 'paid' }, user?.id);
            await load();
          } catch (e) {
            Alert.alert('Error', getAuthErrorMessage(e));
          } finally { setSaving(false); }
        },
      },
    ]);
  }

  async function handleNextProgress() {
    if (!order) return;
    
    // Each status maps to the NEXT status + what to tell the user
    const FLOW: Partial<Record<OrderStatus, { next: OrderStatus; prompt: string; btn: string }>> = {
      production_approved: { next: 'printer_assigned', prompt: 'Assign this order to printer?',                btn: 'Assign Printer' },
      printer_assigned:    { next: 'printing',         prompt: 'Start printing the card now?',                 btn: 'Start Printing' },
      printing:            { next: 'nfc_writing',      prompt: 'Card printed! Ready to write NFC data?',       btn: 'Start NFC Write' },
      nfc_writing:         { next: 'qa_pending',       prompt: 'NFC data written! Ready for quality check?',   btn: 'Start QA Check' },
      qa_pending:          { next: 'ready_to_ship',    prompt: 'QA passed! Mark card as ready to ship?',       btn: 'Pass QA' },
      ready_to_ship:       { next: 'shipped',          prompt: 'Hand card to customer / delivery?',            btn: 'Mark Shipped' },
      shipped:             { next: 'delivered',        prompt: 'Customer received the card? Close this order?',btn: '✓ Complete' },
    };

    const step = FLOW[order.status];
    if (!step) {
      // fallback — mark delivered
      Alert.alert('Complete Order?', 'Mark this order as delivered?', [
        { text: 'Cancel', style: 'cancel' },
        { text: '✓ Complete', onPress: async () => {
          setSaving(true);
          try { await updateOrderStatus(order.id, 'delivered', user?.id); await load(); }
          catch (e) { Alert.alert('Error', getAuthErrorMessage(e)); }
          finally { setSaving(false); }
        }},
      ]);
      return;
    }

    Alert.alert('Next Step', step.prompt, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: step.btn,
        onPress: async () => {
          setSaving(true);
          try {
            await updateOrderStatus(order.id, step.next, user?.id);
            await load();
          } catch (e) {
            Alert.alert('Error', getAuthErrorMessage(e));
          } finally { setSaving(false); }
        },
      },
    ]);
  }

  // Opens the printer picker sheet
  function handleApprovePress() {
    setSelectedPrinterId('auto'); // reset to auto each time
    setPrinterOpen(true);
  }

  // Called when user confirms in the printer picker
  async function handleConfirmWithPrinter() {
    if (!order) return;
    setSaving(true);
    try {
      // Record the selected printer on the order
      const printerData: Record<string, any> = {};
      if (selectedPrinterId !== 'auto') {
        printerData.assignedPrinterId = selectedPrinterId;
        printerData.assignedPrinterName =
          PRINTERS.find(p => p.id === selectedPrinterId)?.name ?? selectedPrinterId;
      }
      if (Object.keys(printerData).length > 0) {
        await updateOrderDetails(order.id, printerData, user?.id);
      }
      // Approve production — uses the existing approval modal flow
      setPrinterOpen(false);
      setApprovalOpen(true);
    } catch (e) {
      Alert.alert('Error', getAuthErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmApproval(confirmation: SalesPaymentConfirmation) {
    if (!order) return;
    setSaving(true);
    try {
      await confirmSalesProductionApproval(order.id, confirmation, user?.id);
      setApprovalOpen(false);
      await load();
    } catch (e) {
      Alert.alert('Approval failed', getAuthErrorMessage(e));
    } finally { setSaving(false); }
  }

  // ── Loading / error ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={PURPLE} size="large" />
        <AppText style={s.muted}>Loading…</AppText>
      </View>
    );
  }

  if (!order || error) {
    return (
      <View style={s.center}>
        <AppText style={{ fontSize: 48, marginBottom: 8 }}>😕</AppText>
        <AppText style={s.errTxt}>{error ?? 'Order not found.'}</AppText>
        <Pressable style={s.retryBtn} onPress={load}>
          <AppText style={s.retryTxt}>Try Again</AppText>
        </Pressable>
        <Pressable style={[s.retryBtn, { backgroundColor: SURF2, marginTop: 8 }]} onPress={() => router.back()}>
          <AppText style={[s.retryTxt, { color: INK }]}>Go Back</AppText>
        </Pressable>
      </View>
    );
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const orderRef    = `#${order.orderNumber ?? order.id.slice(0, 8).toUpperCase()}`;
  const productName = product?.label ?? 'NFC Card';
  const qty         = order.quantity ?? 1;
  const totalUsd    = fmtUsd(getOrderTotalUsd(order));
  const totalFmt    = formatOrderTotal(order);
  const verified    = isPaymentVerified(order);
  const payLabel    = getPaymentStatusLabel(order.paymentStatus ?? 'unpaid');
  const statusOpt   = orderStatusOptions.find(o => o.value === order.status);
  const statusLabel = statusOpt?.label ?? order.status;
  const progress    = getProgress(order.status);
  const passcode    = order.productionPasscode ?? '';
  const qrPayload   = (order.orderNumber && order.productionPasscode)
    ? buildProductionQrPayload(order.orderNumber, order.productionPasscode)
    : null;

  // Resolved printer name (from job or order field or selection)
  const assignedPrinterName: string =
    job?.printerId ??
    (order as any).assignedPrinterName ??
    'Auto Assigned';

  const isApproved = ['production_approved', 'printer_assigned', 'printing',
    'nfc_writing', 'nfc_verification', 'qa_pending',
    'ready_to_ship', 'shipped', 'delivered'].includes(order.status);

  // ── Single action ─────────────────────────────────────────────────────────
  type Action = { label: string; color: string; icon: React.ReactNode; onPress: () => void } | null;
  let action: Action = null;

  if (!verified) {
    action = {
      label: 'Confirm Payment Received',
      color: GREEN,
      icon: <CheckCircleBoldDuotone size={20} color="#FFF" />,
      onPress: handleMarkPaid,
    };
  } else if (needsSalesApproval(order) && !isApproved) {
    action = {
      label: 'Approve Production →',
      color: PURPLE,
      icon: <BoltCircleBoldDuotone size={20} color="#FFF" />,
      onPress: handleApprovePress,   // ← opens printer picker first
    };
  } else if (order.status === 'production_approved') {
    action = {
      label: 'Assign Printer →',
      color: PURPLE,
      icon: <PrinterBoldDuotone size={20} color="#FFF" />,
      onPress: handleNextProgress,
    };
  } else if (order.status === 'printer_assigned') {
    action = {
      label: 'Start Printing →',
      color: PURPLE,
      icon: <PrinterBoldDuotone size={20} color="#FFF" />,
      onPress: handleNextProgress,
    };
  } else if (order.status === 'printing') {
    action = {
      label: 'Write NFC Data →',
      color: '#0891B2',
      icon: <Card2BoldDuotone size={20} color="#FFF" />,
      onPress: handleNextProgress,
    };
  } else if (order.status === 'nfc_writing') {
    action = {
      label: 'QA Check →',
      color: '#D97706',
      icon: <ShieldCheckBoldDuotone size={20} color="#FFF" />,
      onPress: handleNextProgress,
    };
  } else if (order.status === 'qa_pending') {
    action = {
      label: 'Pass QA — Ready to Ship →',
      color: '#2563EB',
      icon: <CheckCircleBoldDuotone size={20} color="#FFF" />,
      onPress: handleNextProgress,
    };
  } else if (order.status === 'ready_to_ship') {
    action = {
      label: 'Mark Shipped →',
      color: '#7C3AED',
      icon: <BoltCircleBoldDuotone size={20} color="#FFF" />,
      onPress: handleNextProgress,
    };
  } else if (order.status === 'shipped') {
    action = {
      label: 'Complete — Customer Received ✓',
      color: GREEN,
      icon: <CheckCircleBoldDuotone size={20} color="#FFF" />,
      onPress: handleNextProgress,
    };
  }

  return (
    <View style={s.root}>
      {/* ── Header ── */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.iconBtn} hitSlop={12}>
          <AltArrowLeftBoldDuotone size={20} color={INK} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <AppText style={s.headerEye}>ORDER</AppText>
          <AppText style={s.headerTitle}>{orderRef}</AppText>
        </View>
        <Pressable style={s.iconBtn} onPress={load} hitSlop={8}>
          <RefreshBoldDuotone size={18} color={INK} />
        </Pressable>
      </View>

      <IosScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Ticket card ── */}
        <View style={s.ticket}>
          {/* Product row */}
          <View style={s.productRow}>
            <View style={s.productIcon}>
              <Card2BoldDuotone size={22} color={PURPLE} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText style={s.productName}>{productName}</AppText>
              <AppText style={s.productSub}>Qty: {qty}  ·  {orderRef}</AppText>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <AppText style={s.price}>{totalUsd}</AppText>
              <AppText style={s.priceAlt}>{totalFmt}</AppText>
            </View>
          </View>

          {/* Perforation */}
          <View style={s.notchRow}>
            <View style={s.notchL} />
            <View style={s.dash} />
            <View style={s.notchR} />
          </View>

          {/* Status badges */}
          <View style={s.badgeRow}>
            <View style={[s.badge, { backgroundColor: verified ? GREEND : AMBERD, borderColor: verified ? GREEN : AMBER }]}>
              <View style={[s.badgeDot, { backgroundColor: verified ? GREEN : AMBER }]} />
              <AppText style={[s.badgeTxt, { color: verified ? GREEN : AMBER }]}>
                {verified ? 'Cash Received' : payLabel}
              </AppText>
            </View>
            <View style={[s.badge, { backgroundColor: PURPLED, borderColor: PURPLE }]}>
              <View style={[s.badgeDot, { backgroundColor: PURPLE }]} />
              <AppText style={[s.badgeTxt, { color: PURPLE }]}>{statusLabel}</AppText>
            </View>
          </View>

          {/* Info rows */}
          <View style={s.infoBlock}>
            <View style={s.infoRow}>
              <UserBoldDuotone size={14} color={DIM} />
              <AppText style={s.infoLabel}>Customer</AppText>
              <AppText style={s.infoVal}>{order.customerName || '—'}</AppText>
            </View>
            <View style={s.infoRowDivider} />
            <View style={s.infoRow}>
              <PrinterBoldDuotone size={14} color={DIM} />
              <AppText style={s.infoLabel}>Printer</AppText>
              <AppText style={[s.infoVal, { color: isApproved ? INK : MUTED }]}>
                {assignedPrinterName}
              </AppText>
              {/* Change printer — only before production starts */}
              {isApproved && !['printing','nfc_writing','nfc_verification','qa_pending','ready_to_ship','shipped','delivered'].includes(order.status) ? (
                <Pressable
                  style={s.changeBtn}
                  onPress={() => { setSelectedPrinterId('auto'); setPrinterOpen(true); }}
                >
                  <AppText style={s.changeTxt}>Change</AppText>
                </Pressable>
              ) : null}
            </View>
            <View style={s.infoRowDivider} />
            <View style={s.infoRow}>
              <WalletMoneyBoldDuotone size={14} color={DIM} />
              <AppText style={s.infoLabel}>Payment</AppText>
              <AppText style={[s.infoVal, { color: verified ? GREEN : AMBER }]}>{payLabel}</AppText>
            </View>
          </View>

          {/* Perforation */}
          <View style={s.notchRow}>
            <View style={s.notchL} />
            <View style={s.dash} />
            <View style={s.notchR} />
          </View>

          {/* ── Step-by-step Process Tracker ── */}
          <View style={s.progressSection}>
            <View style={s.progressHead}>
              <AppText style={s.progressLabel}>ORDER PROGRESS</AppText>
              <AppText style={s.progressPct}>{progress}%</AppText>
            </View>
            <View style={s.progressBg}>
              <View style={[s.progressFill, { width: `${progress}%` as any }]} />
            </View>

            {/* Visual stepper */}
            <View style={s.stepperWrap}>
              {(() => {
                const STEPS = [
                  { key: 'pending_payment',      label: 'Payment',           pct: 10  },
                  { key: 'payment_verified',      label: 'Payment Verified',   pct: 25  },
                  { key: 'production_approved',   label: 'Sales Approved',     pct: 40  },
                  { key: 'printer_assigned',      label: 'Printer Assigned',   pct: 50  },
                  { key: 'printing',              label: 'Printing Card',      pct: 65  },
                  { key: 'nfc_writing',           label: 'Writing NFC',        pct: 75  },
                  { key: 'qa_pending',            label: 'QA Check',           pct: 88  },
                  { key: 'ready_to_ship',         label: 'Ready to Ship',      pct: 95  },
                  { key: 'shipped',               label: 'Shipped',            pct: 98  },
                  { key: 'delivered',             label: 'Complete!',          pct: 100 },
                ];
                const currentPct = progress;
                return STEPS.map((step, i) => {
                  const isDone = currentPct >= step.pct;
                  const isActive = !isDone && (i === 0 || currentPct >= STEPS[i - 1].pct);
                  const isLast = i === STEPS.length - 1;
                  return (
                    <View key={step.key} style={s.stepRow}>
                      <View style={s.stepTrack}>
                        <View style={[
                          s.stepDot,
                          isDone && s.stepDotDone,
                          isActive && s.stepDotActive,
                        ]}>
                          {isDone ? (
                            <AppText style={{ fontSize: 10, color: '#FFF' }}>✓</AppText>
                          ) : (
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isActive ? PURPLE : DIM }} />
                          )}
                        </View>
                        {!isLast && (
                          <View style={[s.stepLine, isDone && s.stepLineDone]} />
                        )}
                      </View>
                      <View style={[s.stepContent, isLast && { paddingBottom: 0 }]}>  
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <AppText style={[
                            s.stepLabel,
                            isDone && s.stepLabelDone,
                            isActive && s.stepLabelActive,
                          ]}>
                            {step.label}
                          </AppText>
                          {isActive && (
                            <View style={s.stepNowBadge}>
                              <AppText style={s.stepNowText}>NOW</AppText>
                            </View>
                          )}
                          {isDone && (
                            <View style={s.stepDoneBadge}>
                              <AppText style={s.stepDoneText}>DONE</AppText>
                            </View>
                          )}
                        </View>
                        <AppText style={[s.stepPct, isDone && { color: GREEN }, isActive && { color: PURPLE }]}>
                          {step.pct}%
                        </AppText>
                      </View>
                    </View>
                  );
                });
              })()}
            </View>
          </View>
        </View>

        {/* ── QR card (visible after approval) ── */}
        {isApproved && qrPayload ? (
          <Pressable style={s.qrCard} onPress={() => setQrOpen(true)}>
            <View style={s.qrLeft}>
              <AppText style={s.qrTitle}>Printer QR Code</AppText>
              <AppText style={s.qrSub}>Tap to open full screen → show to printer</AppText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                <PrinterBoldDuotone size={12} color={PURPLE} />
                <AppText style={s.qrPrinter}>{assignedPrinterName}</AppText>
              </View>
              {passcode ? <AppText style={s.qrPass}>🔑 {passcode}</AppText> : null}
            </View>
            <View style={s.qrThumb}>
              <QRCode value={qrPayload} size={72} backgroundColor="transparent" color={INK} />
            </View>
          </Pressable>
        ) : null}

        {/* ── Completed ── */}
        {['shipped', 'delivered'].includes(order.status) ? (
          <View style={s.doneCard}>
            <AppText style={{ fontSize: 32 }}>🎉</AppText>
            <AppText style={s.doneTxt}>Order Complete!</AppText>
            <AppText style={s.doneSub}>The card is ready for the customer.</AppText>
          </View>
        ) : null}

        <View style={{ height: 24 }} />
      </IosScrollView>

      {/* ── Action button ── */}
      {action ? (
        <View style={s.footer}>
          <Animated.View style={{ transform: [{ scale }], width: '100%' }}>
            <Pressable
              style={[s.actionBtn, { backgroundColor: action.color }, saving && { opacity: 0.55 }]}
              onPress={action.onPress}
              onPressIn={pressIn}
              onPressOut={pressOut}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#FFF" size="small" /> : action.icon}
              <AppText style={s.actionTxt}>{saving ? 'Please wait…' : action.label}</AppText>
            </Pressable>
          </Animated.View>
        </View>
      ) : null}

      {/* ── Printer picker sheet ── */}
      <PrinterPickerSheet
        visible={printerOpen}
        selectedId={selectedPrinterId}
        onSelect={setSelectedPrinterId}
        onConfirm={handleConfirmWithPrinter}
        onClose={() => setPrinterOpen(false)}
        busy={saving}
      />

      {/* ── Approval modal (after printer picked) ── */}
      <SalesProductionApprovalModal
        visible={approvalOpen}
        order={order}
        busy={saving}
        onClose={() => setApprovalOpen(false)}
        onConfirm={handleConfirmApproval}
      />

      {/* ── Full-screen QR ── */}
      <QrFullScreen
        visible={qrOpen}
        qrValue={qrPayload}
        orderRef={orderRef}
        passcode={passcode}
        printerName={assignedPrinterName}
        onClose={() => setQrOpen(false)}
      />
    </View>
  );
}

export function SalesOrderDetailScreen() {
  return (
    <AuthGate allowedRoles={['sales', 'agent', 'admin', 'super_admin']}>
      <DetailContent />
    </AuthGate>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8, gap: 12,
    backgroundColor: BG,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: BORDER,
  },
  headerEye: { fontSize: 9, fontWeight: '800', color: DIM, letterSpacing: 2 },
  headerTitle: { fontSize: 15, fontWeight: '900', color: INK, marginTop: 2, letterSpacing: -0.2 },

  scroll: { paddingHorizontal: 20, paddingBottom: 120 },

  // Ticket
  ticket: {
    marginTop: 12, backgroundColor: SURFACE, borderRadius: 24,
    borderWidth: 1, borderColor: BORDER, overflow: 'hidden',
    shadowColor: INK, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06, shadowRadius: 24, elevation: 4,
  },

  productRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, paddingBottom: 16 },
  productIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: PURPLED, alignItems: 'center', justifyContent: 'center' },
  productName: { fontSize: 17, fontWeight: '900', color: INK, letterSpacing: -0.3 },
  productSub: { fontSize: 12, fontWeight: '600', color: DIM, marginTop: 3 },
  price: { fontSize: 20, fontWeight: '900', color: INK, letterSpacing: -0.5 },
  priceAlt: { fontSize: 11, fontWeight: '600', color: MUTED, marginTop: 2, textAlign: 'right' },

  notchRow: { flexDirection: 'row', alignItems: 'center' },
  notchL: { width: 20, height: 20, borderRadius: 10, backgroundColor: BG, marginLeft: -10 },
  notchR: { width: 20, height: 20, borderRadius: 10, backgroundColor: BG, marginRight: -10 },
  dash: { flex: 1, height: 1, marginHorizontal: 4, borderWidth: StyleSheet.hairlineWidth, borderColor: BORDER, borderStyle: 'dashed' },

  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', paddingHorizontal: 20, paddingVertical: 14 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeTxt: { fontSize: 12, fontWeight: '800' },

  infoBlock: { paddingHorizontal: 20, paddingBottom: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  infoRowDivider: { height: StyleSheet.hairlineWidth, backgroundColor: BORDER, marginLeft: 22 },
  infoLabel: { fontSize: 12, fontWeight: '700', color: MUTED, flex: 1 },
  infoVal: { fontSize: 14, fontWeight: '800', color: INK },
  changeBtn: { marginLeft: 8, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: PURPLED, borderRadius: 999, borderWidth: 1, borderColor: PURPLEL },
  changeTxt: { fontSize: 11, fontWeight: '800', color: PURPLE },

  progressSection: { padding: 20, paddingTop: 16 },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressLabel: { fontSize: 10, fontWeight: '900', color: DIM, letterSpacing: 1.6 },
  progressPct: { fontSize: 14, fontWeight: '900', color: PURPLE },
  progressBg: { height: 8, backgroundColor: SURF2, borderRadius: 999, overflow: 'hidden', marginBottom: 16 },
  progressFill: { height: 8, backgroundColor: PURPLE, borderRadius: 999 },
  progressStatus: { fontSize: 11, fontWeight: '700', color: MUTED, marginTop: 6 },

  // Stepper
  stepperWrap: { gap: 0 },
  stepRow: { flexDirection: 'row', alignItems: 'stretch' },
  stepTrack: { width: 28, alignItems: 'center' },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: SURF2, borderWidth: 2, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotDone: { backgroundColor: GREEN, borderColor: GREEN },
  stepDotActive: { backgroundColor: PURPLED, borderColor: PURPLE, borderWidth: 2.5 },
  stepLine: { width: 2, flex: 1, backgroundColor: BORDER, minHeight: 12 },
  stepLineDone: { backgroundColor: GREEN },
  stepContent: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingLeft: 12, paddingBottom: 20,
  },
  stepLabel: { fontSize: 14, fontWeight: '700', color: DIM },
  stepLabelDone: { color: INK, fontWeight: '800' },
  stepLabelActive: { color: PURPLE, fontWeight: '900' },
  stepPct: { fontSize: 12, fontWeight: '800', color: DIM },
  stepNowBadge: {
    backgroundColor: PURPLED, borderRadius: 6, borderWidth: 1, borderColor: PURPLEL,
    paddingHorizontal: 6, paddingVertical: 1,
  },
  stepNowText: { fontSize: 8, fontWeight: '900', color: PURPLE, letterSpacing: 0.5 },
  stepDoneBadge: {
    backgroundColor: GREEND, borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 1,
  },
  stepDoneText: { fontSize: 8, fontWeight: '900', color: GREEN, letterSpacing: 0.5 },

  qrCard: {
    marginTop: 16, backgroundColor: SURFACE, borderRadius: 20,
    borderWidth: 1, borderColor: PURPLEL, padding: 18,
    flexDirection: 'row', alignItems: 'center', gap: 16,
    shadowColor: PURPLE, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 2,
  },
  qrLeft: { flex: 1 },
  qrTitle: { fontSize: 15, fontWeight: '900', color: INK },
  qrSub: { fontSize: 11, fontWeight: '600', color: MUTED, marginTop: 4, lineHeight: 16 },
  qrPrinter: { fontSize: 11, fontWeight: '700', color: PURPLE },
  qrPass: { fontSize: 13, fontWeight: '900', color: PURPLE, marginTop: 6, letterSpacing: 2 },
  qrThumb: { width: 90, height: 90, borderRadius: 14, backgroundColor: SURF2, borderWidth: 1, borderColor: PURPLEL, alignItems: 'center', justifyContent: 'center' },

  doneCard: { marginTop: 16, backgroundColor: '#F0FDF4', borderRadius: 20, borderWidth: 1, borderColor: '#BBF7D0', padding: 24, alignItems: 'center', gap: 6 },
  doneTxt: { fontSize: 18, fontWeight: '900', color: GREEN },
  doneSub: { fontSize: 13, fontWeight: '600', color: MUTED },

  footer: { paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12, backgroundColor: BG, borderTopWidth: 1, borderColor: BORDER },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, borderRadius: 18, paddingVertical: 18,
    shadowColor: PURPLE, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22, shadowRadius: 16, elevation: 6,
  },
  actionTxt: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 0.1 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: BG },
  muted: { color: MUTED, fontSize: 13, marginTop: 8 },
  errTxt: { fontSize: 14, fontWeight: '700', color: RED, textAlign: 'center', lineHeight: 22 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: PURPLE, borderRadius: 999, marginTop: 4 },
  retryTxt: { color: '#FFF', fontSize: 14, fontWeight: '900' },
});
