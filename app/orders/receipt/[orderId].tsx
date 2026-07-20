import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Share, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '@/src/components/AppButton';
import { AppHeader } from '@/src/components/AppHeader';
import { AppText } from '@/src/components/AppText';
import { IosScrollView } from '@/src/components/IosScrollView';
import { theme } from '@/src/constants/theme';
import { getAuthErrorMessage } from '@/src/services/authService';
import {
  fetchInvoiceForOrder,
  formatFinanceAmount,
  generateOrderInvoice,
} from '@/src/services/financeService';
import { getOrder } from '@/src/services/firestoreService';
import type { InvoiceRecord, Order } from '@/src/types/models';

function line(label: string, value: string) {
  return (
    <View style={styles.line}>
      <AppText style={styles.label}>{label}</AppText>
      <AppText style={styles.value}>{value}</AppText>
    </View>
  );
}

function formatDate(value?: string) {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatRefund(order: Order) {
  if (!order.refundStatus) return '';
  const amount =
    order.refundedAmount != null && order.currency
      ? ` - ${formatFinanceAmount(order.refundedAmount, order.currency)}`
      : '';
  return `${order.refundStatus}${amount}`;
}

export default function OrderReceiptRoute() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const id = typeof orderId === 'string' ? orderId : orderId?.[0] ?? '';
  const [order, setOrder] = useState<Order | null>(null);
  const [invoice, setInvoice] = useState<InvoiceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [invoiceBusy, setInvoiceBusy] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setInvoiceError(null);
    try {
      const nextOrder = await getOrder(id);
      setOrder(nextOrder);
      if (nextOrder?.paymentStatus === 'paid') {
        try {
          setInvoice(await fetchInvoiceForOrder(id));
        } catch (err) {
          setInvoiceError(getAuthErrorMessage(err));
        }
      }
    } catch (err) {
      setInvoiceError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const amountLabel =
    order?.amount != null && order.currency
      ? formatFinanceAmount(order.amount, order.currency)
      : `${order?.currency ?? 'USD'} ${order?.amount?.toLocaleString() ?? 'Not set'}`;

  async function handleShare() {
    if (!order) return;
    const text = [
      'SiteHub Receipt',
      `Order: ${order.orderNumber ?? order.id}`,
      `Customer: ${order.customerName}`,
      `Amount: ${amountLabel}`,
      `Payment: ${order.paymentStatus}`,
      order.paymentReference ? `Payment reference: ${order.paymentReference}` : '',
      invoice?.invoiceNumber ? `Invoice: ${invoice.invoiceNumber}` : '',
      `Status: ${order.status}`,
      order.trackingNumber ? `Tracking: ${order.carrier ?? ''} ${order.trackingNumber}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    await Share.share({ message: text });
  }

  async function handleInvoice() {
    if (!order) return;
    if (invoice?.pdfUrl) {
      await Linking.openURL(invoice.pdfUrl);
      return;
    }
    setInvoiceBusy(true);
    setInvoiceError(null);
    try {
      await generateOrderInvoice(order.id);
      const next = await fetchInvoiceForOrder(order.id);
      setInvoice(next);
      if (next?.pdfUrl) {
        await Linking.openURL(next.pdfUrl);
      }
    } catch (err) {
      setInvoiceError(getAuthErrorMessage(err));
    } finally {
      setInvoiceBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppHeader title="Receipt" subtitle="Order summary" showBack />
      {loading ? (
        <ActivityIndicator style={styles.loader} />
      ) : !order ? (
        <View style={styles.center}>
          <AppText>Order not found.</AppText>
          {invoiceError ? <AppText style={styles.error}>{invoiceError}</AppText> : null}
          <AppButton label="Back" onPress={() => router.back()} />
        </View>
      ) : (
        <IosScrollView contentContainerStyle={styles.scroll}>
          {line('Order', order.orderNumber ?? order.id)}
          {line('Date', formatDate(order.createdAt))}
          {line('Customer', order.customerName)}
          {line('Phone', order.phone)}
          {line('Product', `${order.productType.replace(/_/g, ' ')} x ${order.quantity}`)}
          {line('Amount', amountLabel)}
          {line('Payment', order.paymentStatus)}
          {order.paymentReference ? line('Payment reference', order.paymentReference) : null}
          {order.paidAt ? line('Paid at', formatDate(order.paidAt)) : null}
          {order.invoiceId || invoice ? line('Invoice', invoice?.invoiceNumber ?? order.invoiceId ?? 'Issued') : null}
          {order.refundStatus ? line('Refund', formatRefund(order)) : null}
          {line('Status', order.status.replace(/_/g, ' '))}
          {order.trackingNumber
            ? line('Tracking', `${order.carrier ?? ''} ${order.trackingNumber}`.trim())
            : null}
          {invoiceError ? <AppText style={styles.error}>{invoiceError}</AppText> : null}
          {order.paymentStatus === 'paid' ? (
            <AppButton
              label={invoice?.pdfUrl ? 'Open invoice PDF' : invoiceBusy ? 'Preparing invoice...' : 'Generate invoice'}
              loading={invoiceBusy}
              iconName="FileText"
              onPress={() => void handleInvoice()}
            />
          ) : null}
          <AppButton label="Share receipt" onPress={() => void handleShare()} />
        </IosScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { padding: 16, gap: 10, paddingBottom: 40 },
  loader: { marginTop: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 18 },
  line: { gap: 2 },
  label: { fontSize: 12, color: theme.colors.textMuted, fontWeight: '600' },
  value: { fontSize: 15, fontWeight: '700' },
  error: { fontSize: 12, color: theme.colors.danger, fontWeight: '700', textAlign: 'center' },
});
