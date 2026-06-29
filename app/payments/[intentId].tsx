import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Platform, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '@/src/components/AppButton';
import { AppHeader } from '@/src/components/AppHeader';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { IosScrollView } from '@/src/components/IosScrollView';
import { PaymentMethodIcon } from '@/src/components/PaymentMethodIcon';
import {
  getCambodiaPaymentMethod,
  paymentMethodLabel,
  type CambodiaPaymentMethodId,
} from '@/src/constants/cambodiaPayments';
import { theme } from '@/src/constants/theme';
import { getAuthErrorMessage } from '@/src/services/authService';
import {
  initiatePayment,
  subscribePaymentIntent,
  type PaymentIntentRecord,
} from '@/src/services/paymentService';

function statusCopy(status: PaymentIntentRecord['status']) {
  if (status === 'paid') {
    return {
      title: 'Payment confirmed',
      body: 'Your payment is verified. Production can start after the order is approved.',
      icon: 'CircleCheck' as const,
      color: theme.colors.success,
    };
  }
  if (status === 'failed') {
    return {
      title: 'Payment failed',
      body: 'The gateway rejected this payment. Start a new payment intent to try again.',
      icon: 'CircleAlert' as const,
      color: theme.colors.danger,
    };
  }
  if (status === 'expired') {
    return {
      title: 'Payment expired',
      body: 'This QR code has expired. Create a fresh payment intent before scanning again.',
      icon: 'Clock' as const,
      color: theme.colors.warning,
    };
  }
  if (status === 'refunded') {
    return {
      title: 'Payment refunded',
      body: 'This payment was refunded by finance.',
      icon: 'RefreshCw' as const,
      color: theme.colors.warning,
    };
  }
  return {
    title: 'Waiting for payment',
    body: 'Scan the QR code or open the bank app. This page updates automatically after bank confirmation.',
    icon: 'QrCode' as const,
    color: theme.colors.info,
  };
}

function formatAmount(intent: PaymentIntentRecord) {
  if (intent.currency === 'USD') return `$${intent.amount.toFixed(2)}`;
  return `${Math.round(intent.amount).toLocaleString()} KHR`;
}

export default function PaymentStatusRoute() {
  const params = useLocalSearchParams<{ intentId?: string }>();
  const intentId = typeof params.intentId === 'string' ? params.intentId : '';
  const [intent, setIntent] = useState<PaymentIntentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSnapshot = useCallback((next: PaymentIntentRecord | null) => {
    setIntent(next);
    setLoading(false);
    if (!next) setError('Payment intent not found.');
  }, []);

  useEffect(() => {
    if (!intentId) {
      setLoading(false);
      setError('Missing payment intent.');
      return undefined;
    }
    setLoading(true);
    setError(null);
    return subscribePaymentIntent(
      intentId,
      handleSnapshot,
      (err) => {
        setLoading(false);
        setError(getAuthErrorMessage(err));
      }
    );
  }, [handleSnapshot, intentId]);

  async function handleRetry() {
    if (!intent?.orderId || !intent.methodId) return;
    setRetrying(true);
    setError(null);
    try {
      const next = await initiatePayment(intent.orderId, intent.methodId);
      router.replace({ pathname: '/payment/[intentId]', params: { intentId: next.intentId } });
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setRetrying(false);
    }
  }

  const copy = statusCopy(intent?.status ?? 'pending');
  const expiredByClock = intent?.expiresAt
    ? new Date(intent.expiresAt).getTime() < Date.now()
    : false;
  const canRetry =
    intent?.status === 'failed' ||
    intent?.status === 'expired' ||
    expiredByClock;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppHeader title="Payment" subtitle={intent ? formatAmount(intent) : 'Status'} showBack />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.primary} />
          <AppText variant="body" tone="muted">
            Loading payment...
          </AppText>
        </View>
      ) : !intent ? (
        <View style={styles.center}>
          <AppIcon name="CircleAlert" size={34} color={theme.colors.danger} />
          <AppText variant="body" weight="semibold" style={styles.errorText}>
            {error ?? 'Payment intent not found.'}
          </AppText>
          <AppButton label="Back" variant="outline" onPress={() => router.back()} />
        </View>
      ) : (
        <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.statusCard}>
            <View style={[styles.statusIcon, { backgroundColor: `${copy.color}1A` }]}>
              <AppIcon name={copy.icon} size={30} color={copy.color} />
            </View>
            <AppText variant="h1" weight="bold" style={styles.statusTitle}>
              {copy.title}
            </AppText>
            <AppText variant="body" tone="muted" style={styles.statusBody}>
              {copy.body}
            </AppText>
          </View>

          {intent.status !== 'paid' && intent.status !== 'refunded' ? (
            <View style={styles.qrCard}>
              {intent.qrPayload ? (
                <View style={styles.qrBox}>
                  <QRCode value={intent.qrPayload} size={190} />
                </View>
              ) : null}
              <AppText variant="caption" tone="muted" weight="bold">
                PAYMENT PAYLOAD
              </AppText>
              <AppText style={styles.payload} selectable>
                {intent.qrPayload || 'Gateway payload pending.'}
              </AppText>
              {intent.abaDeeplink ? (
                <AppButton
                  label="Open ABA Pay"
                  iconName="ExternalLink"
                  onPress={() => {
                    void Linking.openURL(intent.abaDeeplink ?? '');
                  }}
                />
              ) : null}
            </View>
          ) : null}

          <View style={styles.detailCard}>
            <Row label="Status" value={intent.status} />
            <MethodRow methodId={intent.methodId as CambodiaPaymentMethodId} />
            <Row label="Amount" value={formatAmount(intent)} />
            <Row label="Reference" value={intent.providerRef || intent.intentId} />
            {intent.expiresAt ? <Row label="Expires" value={new Date(intent.expiresAt).toLocaleString()} /> : null}
          </View>

          {error ? (
            <AppText variant="caption" weight="semibold" style={styles.errorText}>
              {error}
            </AppText>
          ) : null}

          {intent.status === 'paid' ? (
            <AppButton
              label="View receipt"
              iconName="FileText"
              onPress={() => router.replace(`/order-receipt/${intent.orderId}`)}
            />
          ) : null}
          <View style={styles.buttonRow}>
            <AppButton
              label="Track order"
              variant="outline"
              fullWidth={false}
              onPress={() => router.push(`/guest-track-order?orderId=${encodeURIComponent(intent.orderId)}`)}
              style={styles.halfButton}
            />
            <AppButton
              label={retrying ? 'Retrying' : canRetry ? 'New payment' : 'Retry'}
              variant="outline"
              fullWidth={false}
              loading={retrying}
              disabled={!canRetry || retrying}
              onPress={() => void handleRetry()}
              style={styles.halfButton}
            />
          </View>

          {intent.status !== 'paid' && intent.status !== 'failed' && intent.status !== 'expired' ? (
            <View style={styles.waitingRow}>
              <ActivityIndicator color={theme.colors.primary} />
              <AppText variant="caption" tone="muted" weight="semibold">
                Listening for gateway confirmation
              </AppText>
            </View>
          ) : null}
        </IosScrollView>
      )}
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <AppText variant="caption" tone="muted" weight="semibold" style={styles.rowLabel}>
        {label}
      </AppText>
      <AppText variant="body" weight="bold" style={styles.rowValue} numberOfLines={2}>
        {value}
      </AppText>
    </View>
  );
}

function MethodRow({ methodId }: { methodId: CambodiaPaymentMethodId }) {
  const method = getCambodiaPaymentMethod(methodId);
  return (
    <View style={styles.row}>
      <AppText variant="caption" tone="muted" weight="semibold" style={styles.rowLabel}>
        Method
      </AppText>
      <View style={styles.methodValue}>
        <PaymentMethodIcon
          methodId={methodId}
          fallbackIcon={method?.icon ?? 'Wallet'}
          size={24}
          color={theme.colors.primary}
        />
        <AppText variant="body" weight="bold" style={styles.rowValue} numberOfLines={2}>
          {paymentMethodLabel(methodId)}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  scroll: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  statusCard: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    ...theme.shadows.card,
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTitle: {
    textAlign: 'center',
  },
  statusBody: {
    textAlign: 'center',
    lineHeight: 20,
  },
  qrCard: {
    gap: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    ...theme.shadows.card,
  },
  qrBox: {
    alignSelf: 'center',
    borderRadius: theme.radius.md,
    backgroundColor: '#FFFFFF',
    padding: theme.spacing.md,
  },
  payload: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceSoft,
    borderRadius: theme.radius.md,
  },
  detailCard: {
    gap: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    ...theme.shadows.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  rowLabel: {
    width: 88,
  },
  rowValue: {
    flex: 1,
    textAlign: 'right',
    textTransform: 'capitalize',
  },
  methodValue: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: theme.spacing.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  halfButton: {
    flex: 1,
  },
  waitingRow: {
    minHeight: 42,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  errorText: {
    color: theme.colors.danger,
    textAlign: 'center',
  },
});
