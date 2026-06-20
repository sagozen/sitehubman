/**
 * SalesProductionApprovalModal — iOS action sheet style.
 * Large touch targets, clear visual hierarchy, Apple-quality feel.
 */
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { salesUi } from '@/src/features/sales/components/SalesScreenUi';
import type { Order, SalesPaymentConfirmation } from '@/src/types/models';
import { salesPaymentConfirmationLabel } from '@/src/services/salesOrderApprovalService';
import { formatOrderTotal } from '@/src/utils/orderPricing';

const OPTIONS: SalesPaymentConfirmation[] = ['cash_received', 'qr_paid'];

const OPTION_ICONS: Record<SalesPaymentConfirmation, 'Banknote' | 'QrCode'> = {
  cash_received: 'Banknote',
  qr_paid: 'QrCode',
};

function defaultConfirmation(order: Order | null): SalesPaymentConfirmation {
  const method = order?.paymentMethod?.toLowerCase() ?? '';
  if (order?.paymentStatus === 'cash_received' || method.includes('cash')) return 'cash_received';
  if (order?.paymentStatus === 'paid_qr' || method.includes('qr') || method.includes('bank')) return 'qr_paid';
  return 'cash_received';
}

type Props = {
  visible: boolean;
  order: Order | null;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (confirmation: SalesPaymentConfirmation) => void;
};

export function SalesProductionApprovalModal({
  visible,
  order,
  busy = false,
  onClose,
  onConfirm,
}: Props) {
  const [selected, setSelected] = useState<SalesPaymentConfirmation>(
    () => defaultConfirmation(order),
  );

  useEffect(() => {
    if (visible) setSelected(defaultConfirmation(order));
  }, [order, visible]);

  if (!order) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.container}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.sheetIconWrap}>
              <AppIcon name="Printer" size={20} color={salesUi.accent} />
            </View>
            <View style={styles.sheetTitles}>
              <AppText style={styles.sheetTitle}>Approve for Production</AppText>
              <AppText style={styles.sheetSub}>
                Confirm payment · Queue print job
              </AppText>
            </View>
          </View>

          {/* Order summary */}
          <View style={styles.infoCard}>
            <InfoRow label="Customer"  value={order.customerName} />
            <InfoRow label="Quantity"  value={`${order.quantity} card${order.quantity === 1 ? '' : 's'}`} />
            <InfoRow label="Amount"    value={formatOrderTotal(order)} last />
            {order.onHold ? (
              <View style={styles.holdBanner}>
                <AppIcon name="AlertCircle" size={14} color={salesUi.red} />
                <AppText style={styles.holdText}>Order is on hold</AppText>
              </View>
            ) : null}
          </View>

          {/* Payment confirmation */}
          <AppText style={styles.sectionLabel}>Confirm payment method</AppText>
          <View style={styles.optionList}>
            {OPTIONS.map((option) => {
              const active = selected === option;
              return (
                <Pressable
                  key={option}
                  style={[styles.option, active && styles.optionActive]}
                  onPress={() => setSelected(option)}
                  disabled={busy}
                >
                  <View style={[styles.optionIcon, active && styles.optionIconActive]}>
                    <AppIcon
                      name={OPTION_ICONS[option]}
                      size={18}
                      color={active ? salesUi.accent : salesUi.muted}
                    />
                  </View>
                  <AppText style={[styles.optionText, active && styles.optionTextActive]}>
                    {salesPaymentConfirmationLabel(option)}
                  </AppText>
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active ? <View style={styles.radioDot} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Hint */}
          <View style={styles.hint}>
            <AppIcon name="Info" size={13} color={salesUi.muted} />
            <AppText style={styles.hintText}>
              Payment &amp; transaction records are created, then the printer job is queued automatically.
            </AppText>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
              onPress={onClose}
              disabled={busy}
            >
              <AppText style={styles.cancelText}>Cancel</AppText>
            </Pressable>
            <Pressable
              style={[styles.confirmBtn, busy && styles.confirmBtnBusy]}
              onPress={() => onConfirm(selected)}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <AppIcon name="CheckCircle" size={18} color="#fff" />
                  <AppText style={styles.confirmText}>Confirm &amp; Print</AppText>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

// ─── InfoRow ──────────────────────────────────────────────────────────────────

function InfoRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[infoRowS.wrap, last && infoRowS.last]}>
      <AppText style={infoRowS.label}>{label}</AppText>
      <AppText style={infoRowS.value}>{value}</AppText>
    </View>
  );
}

const infoRowS = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: salesUi.border,
    gap: 12,
  },
  last: { borderBottomWidth: 0 },
  label: { fontSize: 14, fontWeight: '500', color: salesUi.muted },
  value: { fontSize: 14, fontWeight: '700', color: salesUi.text, flexShrink: 1, textAlign: 'right' },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: salesUi.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    gap: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: salesUi.border,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: salesUi.border,
    marginBottom: 4,
  },

  // Header
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sheetIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: salesUi.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,149,0,0.2)',
  },
  sheetTitles: { flex: 1 },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: salesUi.text,
  },
  sheetSub: {
    fontSize: 13,
    fontWeight: '500',
    color: salesUi.muted,
    marginTop: 2,
  },

  // Info card
  infoCard: {
    backgroundColor: salesUi.bg,
    borderRadius: salesUi.radiusMd,
    paddingHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: salesUi.border,
  },
  holdBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  holdText: {
    fontSize: 13,
    fontWeight: '600',
    color: salesUi.red,
  },

  // Section label
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: salesUi.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: -4,
  },

  // Options
  optionList: { gap: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: salesUi.radiusMd,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: salesUi.border,
    backgroundColor: salesUi.surface,
  },
  optionActive: {
    borderColor: salesUi.accent,
    backgroundColor: salesUi.orangeSoft,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: salesUi.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconActive: {
    backgroundColor: 'rgba(255,149,0,0.15)',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: salesUi.text,
  },
  optionTextActive: { color: salesUi.accent },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: salesUi.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: salesUi.accent },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: salesUi.accent,
  },

  // Hint
  hint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    backgroundColor: salesUi.bg,
    borderRadius: salesUi.radiusSm,
    padding: 12,
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: salesUi.muted,
    lineHeight: 17,
  },

  // Buttons
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: salesUi.radiusMd,
    alignItems: 'center',
    backgroundColor: salesUi.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: salesUi.border,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: salesUi.text,
  },
  confirmBtn: {
    flex: 2,
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 15,
    borderRadius: salesUi.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: salesUi.accent,
  },
  confirmBtnBusy: { opacity: 0.65 },
  confirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
