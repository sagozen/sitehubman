import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { SettingsGroup, SettingsSection } from '@/src/components/SettingsGroup';
import { theme } from '@/src/constants/theme';
import {
  AdminScreenShell,
  AdminStatChip,
  AdminStatChipRow,
  AdminStatusPill,
} from '@/src/features/admin/components/AdminScreenShell';
import { getAuthErrorMessage } from '@/src/services/authService';
import {
  FinancePaymentIntent,
  FinanceSnapshot,
  fetchFinanceSnapshot,
  formatFinanceAmount,
  generateOrderInvoice,
  requestOrderRefund,
} from '@/src/services/financeService';
import {
  fetchCompanyWallet,
  fetchPendingCashSettlements,
  settleCashDeposit,
} from '@/src/services/financeSettlementService';
import type { CompanyWalletBalances, InvoiceRecord, LedgerTransaction, RefundRecord } from '@/src/types/models';

type CurrencyTotals = { USD: number; KHR: number };
type PillTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const EMPTY_SNAPSHOT: FinanceSnapshot = {
  intents: [],
  refunds: [],
  invoices: [],
};

function formatDate(value?: string) {
  if (!value) return 'No date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function addAmount(totals: CurrencyTotals, amount: number, currency: 'USD' | 'KHR') {
  return {
    ...totals,
    [currency]: totals[currency] + amount,
  };
}

function formatTotals(totals: CurrencyTotals) {
  const parts: string[] = [];
  if (totals.USD > 0) parts.push(formatFinanceAmount(totals.USD, 'USD'));
  if (totals.KHR > 0) parts.push(formatFinanceAmount(totals.KHR, 'KHR'));
  return parts.length ? parts.join(' / ') : '0 KHR';
}

function paymentTone(status: FinancePaymentIntent['status']): PillTone {
  if (status === 'paid') return 'success';
  if (status === 'pending' || status === 'processing') return 'warning';
  if (status === 'failed' || status === 'expired') return 'danger';
  return 'neutral';
}

function refundTone(status: RefundRecord['status']): PillTone {
  if (status === 'refunded') return 'success';
  if (status === 'processing' || status === 'pending') return 'warning';
  if (status === 'failed' || status === 'cancelled') return 'danger';
  return 'neutral';
}

function shortId(value: string) {
  return value ? value.slice(0, 8).toUpperCase() : 'UNKNOWN';
}

function FinanceAction({
  label,
  icon,
  onPress,
  disabled,
}: {
  label: string;
  icon: 'FileText' | 'RefreshCw' | 'ExternalLink';
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.action,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <AppIcon name={icon} size={16} color={theme.colors.textPrimary} />
      <AppText variant="caption" weight="semibold" numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}

function PaymentIntentRow({
  intent,
  busyKey,
  onInvoice,
  onRefund,
}: {
  intent: FinancePaymentIntent;
  busyKey: string | null;
  onInvoice: (intent: FinancePaymentIntent) => void;
  onRefund: (intent: FinancePaymentIntent) => void;
}) {
  const invoiceBusy = busyKey === `invoice:${intent.orderId}`;
  const refundBusy = busyKey === `refund:${intent.orderId}`;
  const canRefund = intent.status === 'paid';

  return (
    <View style={styles.item}>
      <Pressable
        style={({ pressed }) => [styles.itemTop, pressed && styles.pressed]}
        onPress={() => router.push({ pathname: '/order-detail/[orderId]', params: { orderId: intent.orderId } })}
      >
        <View style={styles.itemCopy}>
          <AppText variant="caption" tone="muted" weight="bold">
            ORDER {shortId(intent.orderId)}
          </AppText>
          <AppText variant="body" weight="bold" numberOfLines={1}>
            {formatFinanceAmount(intent.amount, intent.currency)}
          </AppText>
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {intent.methodId.replace(/_/g, ' ')} - {intent.provider ?? 'gateway'} - {formatDate(intent.createdAt)}
          </AppText>
        </View>
        <AdminStatusPill label={intent.status} tone={paymentTone(intent.status)} />
      </Pressable>
      <View style={styles.actionRow}>
        <FinanceAction
          label={invoiceBusy ? 'Issuing' : 'Invoice'}
          icon="FileText"
          disabled={invoiceBusy || refundBusy}
          onPress={() => onInvoice(intent)}
        />
        <FinanceAction
          label={refundBusy ? 'Refunding' : 'Refund'}
          icon="RefreshCw"
          disabled={!canRefund || invoiceBusy || refundBusy}
          onPress={() => onRefund(intent)}
        />
      </View>
    </View>
  );
}

function RefundRow({ refund }: { refund: RefundRecord }) {
  return (
    <View style={styles.auditRow}>
      <View style={styles.itemCopy}>
        <AppText variant="body" weight="semibold" numberOfLines={1}>
          {formatFinanceAmount(refund.amount, refund.currency)}
        </AppText>
        <AppText variant="caption" tone="muted" numberOfLines={2}>
          ORDER {shortId(refund.orderId)} - {refund.reason || 'No reason'} - {formatDate(refund.createdAt)}
        </AppText>
      </View>
      <AdminStatusPill label={refund.status} tone={refundTone(refund.status)} />
    </View>
  );
}

function InvoiceRow({ invoice }: { invoice: InvoiceRecord }) {
  return (
    <View style={styles.auditRow}>
      <View style={styles.itemCopy}>
        <AppText variant="body" weight="semibold" numberOfLines={1}>
          {invoice.invoiceNumber || `Invoice ${shortId(invoice.id)}`}
        </AppText>
        <AppText variant="caption" tone="muted" numberOfLines={1}>
          ORDER {shortId(invoice.orderId)} - {formatFinanceAmount(invoice.amount, invoice.currency)}
        </AppText>
      </View>
      {invoice.pdfUrl ? (
        <FinanceAction
          label="PDF"
          icon="ExternalLink"
          onPress={() => {
            void Linking.openURL(invoice.pdfUrl ?? '');
          }}
        />
      ) : (
        <AdminStatusPill label={invoice.pdfError ? 'pdf pending' : invoice.status} tone="neutral" />
      )}
    </View>
  );
}

function CashSettlementRow({
  tx,
  busy,
  onSettle,
}: {
  tx: LedgerTransaction;
  busy: boolean;
  onSettle: (id: string) => void;
}) {
  return (
    <View style={styles.auditRow}>
      <View style={styles.itemCopy}>
        <AppText variant="body" weight="semibold" numberOfLines={1}>
          {formatFinanceAmount(tx.amount, tx.currency)}
        </AppText>
        <AppText variant="caption" tone="muted" numberOfLines={2}>
          ORDER {shortId(tx.orderId)} - cash on hand - {formatDate(tx.createdAt)}
        </AppText>
      </View>
      <FinanceAction
        label={busy ? 'Settling' : 'Deposit cleared'}
        icon="RefreshCw"
        disabled={busy}
        onPress={() => onSettle(tx.id)}
      />
    </View>
  );
}

export default function AdminFinanceScreen() {
  const [snapshot, setSnapshot] = useState<FinanceSnapshot>(EMPTY_SNAPSHOT);
  const [wallet, setWallet] = useState<CompanyWalletBalances | null>(null);
  const [cashPending, setCashPending] = useState<LedgerTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextSnapshot, nextWallet, pending] = await Promise.all([
        fetchFinanceSnapshot(),
        fetchCompanyWallet(),
        fetchPendingCashSettlements(),
      ]);
      setSnapshot(nextSnapshot);
      setWallet(nextWallet);
      setCashPending(pending);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const zero = { USD: 0, KHR: 0 };
    const grossPaid = snapshot.intents
      .filter((intent) => intent.status === 'paid' || intent.status === 'refunded')
      .reduce((totals, intent) => addAmount(totals, intent.amount, intent.currency), zero);
    const refunded = snapshot.refunds
      .filter((refund) => refund.status === 'refunded')
      .reduce((totals, refund) => addAmount(totals, refund.amount, refund.currency), zero);
    const pending = snapshot.intents
      .filter((intent) => intent.status === 'pending' || intent.status === 'processing')
      .reduce((totals, intent) => addAmount(totals, intent.amount, intent.currency), zero);
    const net = {
      USD: Math.max(0, grossPaid.USD - refunded.USD),
      KHR: Math.max(0, grossPaid.KHR - refunded.KHR),
    };

    return {
      grossPaid,
      refunded,
      pending,
      net,
      failedCount: snapshot.intents.filter((intent) => intent.status === 'failed' || intent.status === 'expired').length,
    };
  }, [snapshot]);

  async function handleInvoice(intent: FinancePaymentIntent) {
    setBusyKey(`invoice:${intent.orderId}`);
    try {
      const invoice = await generateOrderInvoice(intent.orderId);
      Alert.alert('Invoice ready', `${invoice.invoiceNumber || invoice.invoiceId} has been issued.`);
      await load();
    } catch (err) {
      Alert.alert('Invoice failed', getAuthErrorMessage(err));
    } finally {
      setBusyKey(null);
    }
  }

  async function handleSettleCash(transactionId: string) {
    setBusyKey(`settle:${transactionId}`);
    try {
      await settleCashDeposit(transactionId);
      Alert.alert('Cash deposited', 'Cash on hand moved to bank wallet.');
      await load();
    } catch (err) {
      Alert.alert('Settlement failed', getAuthErrorMessage(err));
    } finally {
      setBusyKey(null);
    }
  }

  function handleRefund(intent: FinancePaymentIntent) {
    Alert.alert(
      'Refund payment?',
      `Refund ${formatFinanceAmount(intent.amount, intent.currency)} for order ${shortId(intent.orderId)}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Refund',
          style: 'destructive',
          onPress: async () => {
            setBusyKey(`refund:${intent.orderId}`);
            try {
              const refund = await requestOrderRefund({
                orderId: intent.orderId,
                amount: intent.amount,
                reason: 'Finance admin refund',
              });
              Alert.alert('Refund processed', `${formatFinanceAmount(refund.amount, refund.currency)} is ${refund.status}.`);
              await load();
            } catch (err) {
              Alert.alert('Refund failed', getAuthErrorMessage(err));
            } finally {
              setBusyKey(null);
            }
          },
        },
      ]
    );
  }

  return (
    <AdminScreenShell
      title="Finance"
      subtitle="Admin"
      rightAction={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refresh finance"
          onPress={() => void load()}
          disabled={loading}
          hitSlop={8}
          style={({ pressed }) => [styles.refreshBtn, pressed && styles.pressed, loading && styles.disabled]}
        >
          <AppIcon name="RefreshCw" size={20} color={theme.colors.textPrimary} />
        </Pressable>
      }
    >
      {error ? (
        <AppText variant="body" style={styles.errorText}>
          {error}
        </AppText>
      ) : null}

      <SettingsSection title="Payment health" compact />
      <AdminStatChipRow>
        <AdminStatChip label="Net revenue" value={formatTotals(stats.net)} tone={theme.colors.success} />
        <AdminStatChip label="Gross paid" value={formatTotals(stats.grossPaid)} />
        <AdminStatChip label="Refunded" value={formatTotals(stats.refunded)} tone={theme.colors.warning} />
        <AdminStatChip label="Pending" value={formatTotals(stats.pending)} tone={theme.colors.info} />
      </AdminStatChipRow>

      <SettingsSection title="Company wallets" compact footer="Sales records money here — finance settles cash" />
      <AdminStatChipRow>
        <AdminStatChip
          label="Revenue"
          value={wallet ? `${wallet.revenueUsd.toFixed(2)} USD` : '—'}
        />
        <AdminStatChip
          label="Cash on hand"
          value={wallet ? `${wallet.cashOnHandUsd.toFixed(2)} USD` : '—'}
          tone={theme.colors.warning}
        />
        <AdminStatChip
          label="Bank"
          value={wallet ? `${wallet.bankUsd.toFixed(2)} USD` : '—'}
          tone={theme.colors.info}
        />
      </AdminStatChipRow>

      <SettingsSection
        title="Cash deposits due"
        compact
        footer={`${cashPending.length} sales cash collections awaiting bank deposit`}
      />
      <SettingsGroup compact style={styles.groupPad}>
        {loading ? (
          <AppText variant="body" tone="muted" style={styles.empty}>
            Loading settlements...
          </AppText>
        ) : cashPending.length === 0 ? (
          <AppText variant="caption" tone="muted" style={styles.empty}>
            No cash on hand pending deposit.
          </AppText>
        ) : (
          cashPending.map((tx) => (
            <CashSettlementRow
              key={tx.id}
              tx={tx}
              busy={busyKey === `settle:${tx.id}`}
              onSettle={handleSettleCash}
            />
          ))
        )}
      </SettingsGroup>

      <SettingsSection title="Recent payments" compact footer={`${snapshot.intents.length} latest intents`} />
      <SettingsGroup compact style={styles.groupPad}>
        {loading ? (
          <AppText variant="body" tone="muted" style={styles.empty}>
            Loading finance data...
          </AppText>
        ) : snapshot.intents.length === 0 ? (
          <AppText variant="body" tone="muted" style={styles.empty}>
            No payment intents yet.
          </AppText>
        ) : (
          snapshot.intents.map((intent) => (
            <PaymentIntentRow
              key={intent.id}
              intent={intent}
              busyKey={busyKey}
              onInvoice={handleInvoice}
              onRefund={handleRefund}
            />
          ))
        )}
      </SettingsGroup>

      <SettingsSection title="Refunds" compact />
      <SettingsGroup compact style={styles.groupPad}>
        {snapshot.refunds.length === 0 ? (
          <AppText variant="caption" tone="muted" style={styles.empty}>
            No refunds recorded.
          </AppText>
        ) : (
          snapshot.refunds.slice(0, 8).map((refund) => <RefundRow key={refund.id} refund={refund} />)
        )}
      </SettingsGroup>

      <SettingsSection title="Invoices" compact />
      <SettingsGroup compact style={styles.groupPad}>
        {snapshot.invoices.length === 0 ? (
          <AppText variant="caption" tone="muted" style={styles.empty}>
            No invoices issued.
          </AppText>
        ) : (
          snapshot.invoices.slice(0, 8).map((invoice) => <InvoiceRow key={invoice.id} invoice={invoice} />)
        )}
      </SettingsGroup>
    </AdminScreenShell>
  );
}

const styles = StyleSheet.create({
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupPad: {
    paddingVertical: theme.spacing.xs,
    gap: 2,
  },
  item: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  itemCopy: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  action: {
    minHeight: 34,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: theme.colors.surfaceSoft,
  },
  auditRow: {
    minHeight: 58,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  errorText: {
    marginHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    color: theme.colors.danger,
    backgroundColor: 'rgba(255,59,48,0.10)',
  },
  pressed: {
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.5,
  },
});
