import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/src/services/firebaseClient';
import { useAuth } from '@/src/hooks/useAuth';
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
      router.replace({ pathname: '/payments/[intentId]', params: { intentId: next.intentId } });
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setRetrying(false);
    }
  }

  const { user } = useAuth();
  const [showProofModal, setShowProofModal] = useState(false);
  const [proofImageUri, setProofImageUri] = useState<string | null>(null);
  const [bankRefCode, setBankRefCode] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofSubmitted, setProofSubmitted] = useState(false);

  const handlePickReceipt = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!res.canceled && res.assets && res.assets[0]?.uri) {
        setProofImageUri(res.assets[0].uri);
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch {
      Alert.alert('Permission required', 'Please enable photo library access to upload your bank slip.');
    }
  };

  const handleUploadProof = async () => {
    if (!proofImageUri) {
      Alert.alert('Attach Slip', 'Please select an image of your bank transfer confirmation.');
      return;
    }
    if (!intent?.orderId) return;

    setUploadingProof(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const resp = await fetch(proofImageUri);
      const blob = await resp.blob();

      const ownerId = user?.id || 'guest-payer';
      const fileId = `${Date.now()}`;
      const storageRef = ref(storage, `payment_proofs/${ownerId}/${intent.orderId}/${fileId}.jpg`);

      await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
      const downloadUrl = await getDownloadURL(storageRef);

      // Update payment intent doc
      const intentRef = doc(db, 'payment_intents', intentId);
      await updateDoc(intentRef, {
        status: 'proof_submitted',
        proofUrl: downloadUrl,
        bankRef: bankRefCode.trim(),
        proofSubmittedAt: serverTimestamp(),
      });

      // Update order doc
      const orderRef = doc(db, 'orders', intent.orderId);
      await updateDoc(orderRef, {
        paymentProofUrl: downloadUrl,
        bankReference: bankRefCode.trim(),
        status: 'payment_proof_submitted',
        updatedAt: serverTimestamp(),
      });

      setProofSubmitted(true);
      setShowProofModal(false);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      console.error('Proof upload error:', err);
      Alert.alert('Upload Failed', 'Could not upload transfer slip. Check your internet connection.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setUploadingProof(false);
    }
  };

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
                  variant="dark"
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
              variant="dark"
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
            <>
              {proofSubmitted || intent.status === ('proof_submitted' as any) ? (
                <View style={styles.proofConfirmedBox}>
                  <View style={styles.proofBadgeRow}>
                    <View style={styles.proofDot} />
                    <AppText style={styles.proofBadgeText}>PROOF OF PAYMENT SUBMITTED</AppText>
                  </View>
                  <AppText style={styles.proofConfirmedTitle}>Priority Verification Queue</AppText>
                  <AppText style={styles.proofConfirmedDesc}>
                    Your transfer slip has been uploaded to our finance desk. Your order will be verified and queued for production within 5 minutes.
                  </AppText>
                </View>
              ) : (
                <View style={styles.proofCard}>
                  <View style={styles.proofHeaderRow}>
                    <AppIcon name="UploadCloud" size={22} color={theme.colors.primary} />
                    <View style={{ flex: 1 }}>
                      <AppText style={styles.proofTitle}>Paid in your Banking App?</AppText>
                      <AppText style={styles.proofSub}>Upload transfer slip to bypass gateway delay</AppText>
                    </View>
                  </View>
                  <AppButton
                    label="Attach Transfer Receipt 📄"
                    variant="outline"
                    size="md"
                    fullWidth
                    onPress={() => setShowProofModal(true)}
                    style={{ marginTop: 12 }}
                  />
                </View>
              )}

              <View style={styles.waitingRow}>
                <ActivityIndicator color={theme.colors.primary} />
                <AppText variant="caption" tone="muted" weight="semibold">
                  Listening for gateway webhook confirmation
                </AppText>
              </View>
            </>
          ) : null}
        </IosScrollView>
      )}

      {/* PROOF OF PAYMENT UPLOAD MODAL */}
      <Modal visible={showProofModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <AppText style={styles.modalTitle}>Upload Proof of Payment</AppText>
              <Pressable
                onPress={() => setShowProofModal(false)}
                hitSlop={12}
                style={styles.modalCloseBtn}
              >
                <AppIcon name="X" size={18} color="#FFFFFF" />
              </Pressable>
            </View>

            <AppText style={styles.modalDesc}>
              Attach a screenshot of your bank transfer receipt (ABA Pay, KHQR, Acleda, Wing, or wire transfer).
            </AppText>

            <Pressable onPress={handlePickReceipt} style={styles.pickerBox}>
              {proofImageUri ? (
                <Image source={{ uri: proofImageUri }} style={styles.slipPreview} resizeMode="contain" />
              ) : (
                <View style={styles.pickerEmpty}>
                  <AppIcon name="Camera" size={32} color={theme.colors.primary} />
                  <AppText style={styles.pickerPrompt}>Tap to select receipt from gallery</AppText>
                  <AppText style={styles.pickerSizeLimit}>PNG, JPG up to 10MB</AppText>
                </View>
              )}
            </Pressable>

            <View style={styles.inputGroup}>
              <AppText style={styles.inputLabel}>BANK REFERENCE / TRANSACTION ID (OPTIONAL)</AppText>
              <TextInput
                value={bankRefCode}
                onChangeText={setBankRefCode}
                placeholder="e.g. ABA-TXN-892301"
                placeholderTextColor="rgba(255,255,255,0.3)"
                style={styles.refInput}
              />
            </View>

            <View style={styles.modalActionRow}>
              <AppButton
                label="Cancel"
                variant="outline"
                size="lg"
                style={{ flex: 1 }}
                onPress={() => setShowProofModal(false)}
              />
              <AppButton
                label={uploadingProof ? 'Submitting...' : 'Confirm Upload ➔'}
                variant="primary"
                size="lg"
                loading={uploadingProof}
                disabled={!proofImageUri || uploadingProof}
                style={{ flex: 1.4 }}
                onPress={() => void handleUploadProof()}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  proofCard: {
    backgroundColor: '#16161A',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    padding: 18,
    gap: 8,
  },
  proofHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  proofTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  proofSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  proofConfirmedBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  proofBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  proofDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  proofBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.8,
  },
  proofConfirmedTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  proofConfirmedDesc: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  modalCard: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#16161B',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDesc: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 18,
  },
  pickerBox: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pickerEmpty: {
    alignItems: 'center',
    gap: 8,
  },
  pickerPrompt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pickerSizeLimit: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  slipPreview: {
    width: '100%',
    height: '100%',
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 0.6,
  },
  refInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
});
