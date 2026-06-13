import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { salesUi } from '@/src/features/sales/components/SalesScreenUi';
import type { Order, SalesPaymentConfirmation } from '@/src/types/models';
import { salesPaymentConfirmationLabel } from '@/src/services/salesOrderApprovalService';
import { formatOrderTotal } from '@/src/utils/orderPricing';

const OPTIONS: SalesPaymentConfirmation[] = ['qr_paid', 'cash_received', 'unpaid', 'hold'];

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
  const [selected, setSelected] = useState<SalesPaymentConfirmation>('qr_paid');

  if (!order) return null;

  const totalLabel = formatOrderTotal(order);
  const sendsToPrinter = selected === 'qr_paid' || selected === 'cash_received';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <AppText style={styles.title}>Approve production</AppText>
          <AppText style={styles.subtitle}>
            Confirm payment type. The system records money — sales does not manage wallets.
          </AppText>

          <View style={styles.infoBlock}>
            <InfoRow label="Customer" value={order.customerName} />
            <InfoRow label="Quantity" value={String(order.quantity)} />
            <InfoRow label="Amount" value={totalLabel} />
            {order.onHold ? (
              <AppText style={styles.holdNote}>This order is currently on hold.</AppText>
            ) : null}
          </View>

          <AppText style={styles.sectionLabel}>Payment confirmation</AppText>
          <View style={styles.options}>
            {OPTIONS.map((option) => {
              const active = selected === option;
              return (
                <Pressable
                  key={option}
                  style={[styles.option, active && styles.optionActive]}
                  onPress={() => setSelected(option)}
                  disabled={busy}
                >
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active ? <View style={styles.radioDot} /> : null}
                  </View>
                  <AppText style={[styles.optionText, active && styles.optionTextActive]}>
                    {salesPaymentConfirmationLabel(option)}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          <AppText style={styles.hint}>
            {sendsToPrinter
              ? 'After confirm: payment + transaction records are created, then the printer job is queued.'
              : selected === 'hold'
                ? 'Order stays on hold — no printer job until payment is confirmed later.'
                : 'Payment recorded as unpaid — no printer job until paid.'}
          </AppText>

          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onClose} disabled={busy}>
              <AppText style={styles.cancelText}>Cancel</AppText>
            </Pressable>
            <Pressable
              style={[styles.confirmBtn, busy && styles.confirmBtnDisabled]}
              onPress={() => onConfirm(selected)}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <AppIcon name="Printer" size={18} color="#fff" />
                  <AppText style={styles.confirmText}>
                    {sendsToPrinter ? 'Confirm & send to printer' : 'Confirm'}
                  </AppText>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <AppText style={styles.infoLabel}>{label}</AppText>
      <AppText style={styles.infoValue}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  sheet: {
    backgroundColor: salesUi.surface,
    borderRadius: 20,
    padding: 20,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: salesUi.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: salesUi.text,
  },
  subtitle: {
    fontSize: 13,
    color: salesUi.muted,
    lineHeight: 18,
  },
  infoBlock: {
    backgroundColor: salesUi.bg,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: salesUi.muted,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '800',
    color: salesUi.text,
    flexShrink: 1,
    textAlign: 'right',
  },
  holdNote: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EA580C',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: salesUi.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  options: {
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: salesUi.border,
  },
  optionActive: {
    borderColor: salesUi.accent,
    backgroundColor: 'rgba(255,149,0,0.08)',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: salesUi.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: salesUi.accent,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: salesUi.accent,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '700',
    color: salesUi.text,
  },
  optionTextActive: {
    color: salesUi.accent,
  },
  hint: {
    fontSize: 12,
    color: salesUi.muted,
    lineHeight: 17,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: salesUi.bg,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '800',
    color: salesUi.text,
  },
  confirmBtn: {
    flex: 2,
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: salesUi.accent,
  },
  confirmBtnDisabled: {
    opacity: 0.65,
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
});
