import { IosScrollView } from '@/src/components/IosScrollView';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, doc, getDocs, limit, orderBy, query, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/services/firebaseClient';
import { AppAvatar } from '@/src/components/AppAvatar';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { SettingsGroup, SettingsSection } from '@/src/components/SettingsGroup';
import { appRoutes } from '@/src/constants/navigation';
import { theme } from '@/src/constants/theme';
import { useAuth } from '@/src/hooks/useAuth';
import { usePreferences } from '@/src/hooks/usePreferences';
import { useRoleFlags } from '@/src/hooks/useRoleFlags';
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
import {
  AdminScreenShell,
  AdminStatChip,
  AdminStatChipRow,
  AdminStatusPill,
} from '@/src/features/admin/components/AdminScreenShell';
import type { CompanyWalletBalances, InvoiceRecord, LedgerTransaction, RefundRecord, SalaryRecord, Payout } from '@/src/types/models';

type CurrencyTotals = { USD: number; KHR: number };
type PillTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const EMPTY_SNAPSHOT: FinanceSnapshot = {
  intents: [],
  refunds: [],
  invoices: [],
};

interface UserMap {
  [uid: string]: string;
}

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
    [currency]: totals[currency] + (amount || 0),
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

function payoutTone(status: string): 'success' | 'warning' {
  return status === 'paid' ? 'success' : 'warning';
}

function shortId(value: string) {
  return value ? value.slice(0, 8).toUpperCase() : 'UNKNOWN';
}

export default function FinanceDashboardScreen() {
  const { user, signOutUser } = useAuth();
  const { colors } = usePreferences();
  const [tab, setTab] = useState<'overview' | 'settlements' | 'payments' | 'payroll'>('overview');
  const [payrollSubTab, setPayrollSubTab] = useState<'printers' | 'salesmen'>('printers');
  
  const [snapshot, setSnapshot] = useState<FinanceSnapshot>(EMPTY_SNAPSHOT);
  const [wallet, setWallet] = useState<CompanyWalletBalances | null>(null);
  const [cashPending, setCashPending] = useState<LedgerTransaction[]>([]);
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [userMap, setUserMap] = useState<UserMap>({});
  
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextSnapshot, nextWallet, pending, usersSnap, salarySnap, payoutsSnap] = await Promise.all([
        fetchFinanceSnapshot(),
        fetchCompanyWallet(),
        fetchPendingCashSettlements(),
        getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(200))),
        getDocs(query(collection(db, 'salary_records'), orderBy('period', 'desc'), limit(300))),
        getDocs(query(collection(db, 'payouts'), orderBy('periodLabel', 'desc'), limit(300))),
      ]);
      
      setSnapshot(nextSnapshot);
      setWallet(nextWallet);
      setCashPending(pending);
      
      const map: UserMap = {};
      usersSnap.docs.forEach((d) => {
        const data = d.data();
        map[d.id] = data.displayName || data.email || d.id;
      });
      setUserMap(map);
      
      setSalaryRecords(salarySnap.docs.map((d) => ({ id: d.id, ...d.data() } as SalaryRecord)));
      setPayouts(payoutsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Payout)));
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
    };
  }, [snapshot]);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOutUser();
      router.replace(appRoutes.login);
    } catch (err) {
      Alert.alert('Error', getAuthErrorMessage(err));
      setSigningOut(false);
    }
  }

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

  async function approveSalary(record: SalaryRecord) {
    setBusyKey(`salary:${record.id}`);
    try {
      await updateDoc(doc(db, 'salary_records', record.id), {
        status: 'paid',
        approvedAt: serverTimestamp(),
      });
      setSalaryRecords((prev) =>
        prev.map((r) => (r.id === record.id ? { ...r, status: 'paid' } : r))
      );
      Alert.alert('Success', 'Salary record approved.');
    } catch (err) {
      Alert.alert('Error', 'Could not approve salary record.');
    } finally {
      setBusyKey(null);
    }
  }

  async function approvePayout(payout: Payout) {
    setBusyKey(`payout:${payout.id}`);
    try {
      await updateDoc(doc(db, 'payouts', payout.id), {
        status: 'paid',
        approvedAt: serverTimestamp(),
      });
      setPayouts((prev) =>
        prev.map((p) => (p.id === payout.id ? { ...p, status: 'paid' } : p))
      );
      Alert.alert('Success', 'Payout approved.');
    } catch (err) {
      Alert.alert('Error', 'Could not approve payout.');
    } finally {
      setBusyKey(null);
    }
  }

  const totalPrinterUnpaid = useMemo(() => {
    return salaryRecords
      .filter((r) => r.status !== 'paid')
      .reduce((s, r) => s + (r.total ?? 0), 0);
  }, [salaryRecords]);

  const totalSalesUnpaid = useMemo(() => {
    return payouts
      .filter((p) => p.status !== 'paid')
      .reduce((s, p) => s + (p.amount ?? 0), 0);
  }, [payouts]);

  const isFinance = user?.role === 'finance' || user?.role === 'admin' || user?.role === 'super_admin';
  if (!isFinance) return <Redirect href="/auth/login" />;

  const displayName = user?.displayName?.trim() || 'Finance Officer';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.topCopy}>
          <AppText variant="caption" tone="muted" weight="medium">
            Finance Dashboard
          </AppText>
          <AppText variant="h2" weight="bold" numberOfLines={1} style={{ color: colors.typographyColor }}>
            {displayName}
          </AppText>
          {user?.email ? (
            <AppText variant="caption" tone="muted" numberOfLines={1}>
              {user.email}
            </AppText>
          ) : null}
        </View>
        <AppAvatar name={displayName} role="admin" size={40} />
        <Pressable
          accessibilityLabel="Sign out"
          accessibilityRole="button"
          onPress={handleSignOut}
          disabled={signingOut}
          hitSlop={8}
          style={({ pressed }) => [
            styles.signOutBtn,
            { backgroundColor: colors.surface },
            pressed && { opacity: 0.75 },
          ]}
        >
          <AppIcon name="LogOut" size={18} color={colors.textMuted} />
        </Pressable>
      </View>

      {/* Main Tab Bar */}
      <View style={[styles.tabRow, { backgroundColor: colors.surface }]}>
        {(['overview', 'settlements', 'payments', 'payroll'] as const).map((t) => (
          <Pressable
            key={t}
            style={[styles.tab, tab === t && { backgroundColor: colors.primary }]}
            onPress={() => setTab(t)}
          >
            <AppText
              variant="caption"
              weight="semibold"
              style={[styles.tabText, { color: tab === t ? '#FFFFFF' : colors.textMuted }]}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </AppText>
          </Pressable>
        ))}
      </View>

      {error ? (
        <AppText variant="body" style={styles.errorText}>
          {error}
        </AppText>
      ) : null}

      <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {tab === 'overview' && (
          <View style={styles.tabContent}>
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

            <SettingsSection title="Unpaid Payroll Summary" compact />
            <AdminStatChipRow>
              <AdminStatChip label="Printer unpaid" value={`$${totalPrinterUnpaid.toFixed(2)}`} tone="#FF9500" />
              <AdminStatChip label="Sales unpaid" value={`$${totalSalesUnpaid.toFixed(2)}`} tone="#5856D6" />
            </AdminStatChipRow>
          </View>
        )}

        {tab === 'settlements' && (
          <View style={styles.tabContent}>
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
                  <View key={tx.id}>
                    <View style={styles.auditRow}>
                      <View style={styles.itemCopy}>
                        <AppText variant="body" weight="semibold" numberOfLines={1}>
                          {formatFinanceAmount(tx.amount, tx.currency)}
                        </AppText>
                        <AppText variant="caption" tone="muted" numberOfLines={2}>
                          ORDER {shortId(tx.orderId)} - cash on hand - {formatDate(tx.createdAt)}
                        </AppText>
                      </View>
                      <Pressable
                        style={[styles.actionBtn, { backgroundColor: colors.surfaceSoft }]}
                        disabled={busyKey === `settle:${tx.id}`}
                        onPress={() => handleSettleCash(tx.id)}
                      >
                        <AppIcon name="RefreshCw" size={14} color={colors.primary} />
                        <AppText variant="caption" weight="semibold" style={{ color: colors.primary }}>
                          {busyKey === `settle:${tx.id}` ? 'Settling' : 'Deposit cleared'}
                        </AppText>
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </SettingsGroup>
          </View>
        )}

        {tab === 'payments' && (
          <View style={styles.tabContent}>
            <SettingsSection title="Recent payments" compact footer={`${snapshot.intents.length} latest intents`} />
            <SettingsGroup compact style={styles.groupPad}>
              {loading ? (
                <AppText variant="body" tone="muted" style={styles.empty}>
                  Loading payments...
                </AppText>
              ) : snapshot.intents.length === 0 ? (
                <AppText variant="body" tone="muted" style={styles.empty}>
                  No payment intents yet.
                </AppText>
              ) : (
                snapshot.intents.map((intent) => {
                  const invoiceBusy = busyKey === `invoice:${intent.orderId}`;
                  const refundBusy = busyKey === `refund:${intent.orderId}`;
                  const canRefund = intent.status === 'paid';
                  return (
                    <View key={intent.id} style={styles.paymentCard}>
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
                        <Pressable
                          style={[styles.smallBtn, { backgroundColor: colors.surfaceSoft }]}
                          disabled={invoiceBusy || refundBusy}
                          onPress={() => handleInvoice(intent)}
                        >
                          <AppIcon name="FileText" size={14} color={colors.primary} />
                          <AppText variant="caption" weight="semibold" style={{ color: colors.primary }}>
                            {invoiceBusy ? 'Issuing' : 'Invoice'}
                          </AppText>
                        </Pressable>
                        <Pressable
                          style={[styles.smallBtn, { backgroundColor: colors.surfaceSoft }]}
                          disabled={!canRefund || invoiceBusy || refundBusy}
                          onPress={() => handleRefund(intent)}
                        >
                          <AppIcon name="RefreshCw" size={14} color={canRefund ? colors.primary : colors.textMuted} />
                          <AppText variant="caption" weight="semibold" style={{ color: canRefund ? colors.primary : colors.textMuted }}>
                            {refundBusy ? 'Refunding' : 'Refund'}
                          </AppText>
                        </Pressable>
                      </View>
                    </View>
                  );
                })
              )}
            </SettingsGroup>

            <SettingsSection title="Refunds" compact />
            <SettingsGroup compact style={styles.groupPad}>
              {snapshot.refunds.length === 0 ? (
                <AppText variant="caption" tone="muted" style={styles.empty}>
                  No refunds recorded.
                </AppText>
              ) : (
                snapshot.refunds.slice(0, 8).map((refund) => (
                  <View key={refund.id} style={styles.auditRow}>
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
                ))
              )}
            </SettingsGroup>

            <SettingsSection title="Invoices" compact />
            <SettingsGroup compact style={styles.groupPad}>
              {snapshot.invoices.length === 0 ? (
                <AppText variant="caption" tone="muted" style={styles.empty}>
                  No invoices issued.
                </AppText>
              ) : (
                snapshot.invoices.slice(0, 8).map((invoice) => (
                  <View key={invoice.id} style={styles.auditRow}>
                    <View style={styles.itemCopy}>
                      <AppText variant="body" weight="semibold" numberOfLines={1}>
                        {invoice.invoiceNumber || `Invoice ${shortId(invoice.id)}`}
                      </AppText>
                      <AppText variant="caption" tone="muted" numberOfLines={1}>
                        ORDER {shortId(invoice.orderId)} - {formatFinanceAmount(invoice.amount, invoice.currency)}
                      </AppText>
                    </View>
                    {invoice.pdfUrl ? (
                      <Pressable
                        style={[styles.smallBtn, { backgroundColor: colors.surfaceSoft }]}
                        onPress={() => {
                          void Linking.openURL(invoice.pdfUrl ?? '');
                        }}
                      >
                        <AppIcon name="ExternalLink" size={14} color={colors.primary} />
                        <AppText variant="caption" weight="semibold" style={{ color: colors.primary }}>
                          PDF
                        </AppText>
                      </Pressable>
                    ) : (
                      <AdminStatusPill label={invoice.pdfError ? 'pdf pending' : invoice.status} tone="neutral" />
                    )}
                  </View>
                ))
              )}
            </SettingsGroup>
          </View>
        )}

        {tab === 'payroll' && (
          <View style={styles.tabContent}>
            {/* Payroll Switcher */}
            <View style={[styles.subTabRow, { backgroundColor: colors.surface }]}>
              {(['printers', 'salesmen'] as const).map((t) => (
                <Pressable
                  key={t}
                  style={[styles.subTab, payrollSubTab === t && { backgroundColor: colors.primary }]}
                  onPress={() => setPayrollSubTab(t)}
                >
                  <AppText
                    variant="caption"
                    weight="semibold"
                    style={{ color: payrollSubTab === t ? '#FFFFFF' : colors.textMuted }}
                  >
                    {t === 'printers' ? 'Printer payroll' : 'Sales payouts'}
                  </AppText>
                </Pressable>
              ))}
            </View>

            {payrollSubTab === 'printers' ? (
              salaryRecords.length === 0 ? (
                <AppText variant="body" tone="muted" style={styles.empty}>
                  No printer salary records found.
                </AppText>
              ) : (
                <SettingsGroup compact>
                  {salaryRecords.map((record, index) => (
                    <View key={record.id} style={styles.payrollCard}>
                      <View style={styles.cardRow}>
                        <View style={styles.cardLeft}>
                          <AppText variant="body" weight="semibold">{record.printerName || userMap[record.printerId] || '—'}</AppText>
                          <AppText variant="caption" tone="muted">Period: {record.period}</AppText>
                          <AppText variant="caption" tone="muted">
                            Cards: {record.totalCards ?? 0} total · {record.failedCards ?? 0} failed
                          </AppText>
                        </View>
                        <View style={styles.cardRight}>
                          <AppText variant="body" weight="bold" style={{ color: colors.primary }}>
                            ${(record.total ?? 0).toFixed(2)}
                          </AppText>
                          <AdminStatusPill label={record.status ?? 'unpaid'} tone={payoutTone(record.status ?? 'unpaid')} />
                        </View>
                      </View>
                      {record.status !== 'paid' && (
                        <Pressable
                          style={[styles.approveBtn, { backgroundColor: colors.surfaceSoft }]}
                          disabled={busyKey === `salary:${record.id}`}
                          onPress={() => approveSalary(record)}
                        >
                          <AppText variant="caption" weight="semibold" style={{ color: colors.primary }}>
                            {busyKey === `salary:${record.id}` ? 'Approving…' : 'Approve & Mark Paid'}
                          </AppText>
                        </Pressable>
                      )}
                    </View>
                  ))}
                </SettingsGroup>
              )
            ) : (
              payouts.length === 0 ? (
                <AppText variant="body" tone="muted" style={styles.empty}>
                  No salesman payout records found.
                </AppText>
              ) : (
                <SettingsGroup compact>
                  {payouts.map((payout, index) => (
                    <View key={payout.id} style={styles.payrollCard}>
                      <View style={styles.cardRow}>
                        <View style={styles.cardLeft}>
                          <AppText variant="body" weight="semibold">{userMap[payout.userId] || payout.userId}</AppText>
                          <AppText variant="caption" tone="muted">Period: {payout.periodLabel}</AppText>
                        </View>
                        <View style={styles.cardRight}>
                          <AppText variant="body" weight="bold" style={{ color: colors.primary }}>
                            ${(payout.amount ?? 0).toFixed(2)}
                          </AppText>
                          <AdminStatusPill label={payout.status ?? 'unpaid'} tone={payoutTone(payout.status ?? 'unpaid')} />
                        </View>
                      </View>
                      {payout.status !== 'paid' && (
                        <Pressable
                          style={[styles.approveBtn, { backgroundColor: colors.surfaceSoft }]}
                          disabled={busyKey === `payout:${payout.id}`}
                          onPress={() => approvePayout(payout)}
                        >
                          <AppText variant="caption" weight="semibold" style={{ color: colors.primary }}>
                            {busyKey === `payout:${payout.id}` ? 'Approving…' : 'Approve & Mark Paid'}
                          </AppText>
                        </Pressable>
                      )}
                    </View>
                  ))}
                </SettingsGroup>
              )
            )}
          </View>
        )}
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  topCopy: { flex: 1, gap: 2 },
  signOutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.control,
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    padding: 4,
    gap: 3,
    ...theme.shadows.control,
  },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: theme.radius.md },
  tabText: { fontSize: 13 },
  scroll: {
    paddingBottom: theme.spacing.xxl,
  },
  tabContent: {
    gap: theme.spacing.md,
  },
  groupPad: {
    paddingVertical: theme.spacing.xs,
    gap: 2,
  },
  auditRow: {
    minHeight: 58,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  itemCopy: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  paymentCard: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 4,
    gap: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  smallBtn: {
    minHeight: 32,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.sm,
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
    marginBottom: theme.spacing.sm,
  },
  pressed: {
    opacity: 0.72,
  },
  subTabRow: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    padding: 4,
    gap: 3,
    ...theme.shadows.control,
  },
  subTab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: theme.radius.md },
  payrollCard: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  cardLeft: { flex: 1, gap: 3 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  approveBtn: {
    marginTop: 4,
    borderRadius: theme.radius.sm,
    paddingVertical: 8,
    alignItems: 'center',
  },
});
