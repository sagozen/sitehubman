import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { SvgXml } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthGate } from '@/src/components/AuthGate';
import { IosScrollView } from '@/src/components/IosScrollView';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { theme } from '@/src/constants/theme';
import { getAuthErrorMessage } from '@/src/services/authService';
import { getOrder, getPrinterJobByOrderId } from '@/src/services/firestoreService';
import { printHtmlDocument, printHtmlToPdfFile } from '@/src/services/printService';
import {
  PRODUCTION_LABEL_SIZE,
  buildProductionLabelData,
  buildProductionLabelHtml,
  type ProductionLabelData,
} from '@/src/services/labelService';
import type { Order, PrinterJob } from '@/src/types/models';

const OPS_ROLES = ['sales', 'agent', 'printer', 'printer_operator', 'qa_inspector', 'shipping', 'admin', 'super_admin'] as const;

function isMissingNativeSharingModule(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /ExpoSharing|expo-sharing|native module/i.test(message);
}

async function sharePdfFile(uri: string, dialogTitle: string) {
  try {
    const Sharing = await import('expo-sharing');
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        dialogTitle,
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
      });
      return;
    }
  } catch (error) {
    if (!isMissingNativeSharingModule(error)) {
      throw error;
    }
  }

  Alert.alert(
    'PDF ready',
    Platform.OS === 'web'
      ? 'Sharing is not available in this browser session.'
      : 'PDF was created. Install a development build to share from the app, or use Print instead.',
  );
}

function formatDate(value?: string) {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function pretty(value?: string) {
  return value?.replace(/_/g, ' ') || 'Not set';
}

function LabelAction({
  label,
  icon,
  onPress,
  disabled,
}: {
  label: string;
  icon: 'Printer' | 'FileText';
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.actionBtn, pressed && !disabled && styles.pressed, disabled && styles.disabled]}
    >
      <AppIcon name={icon} size={17} color="#FFFFFF" />
      <AppText variant="caption" weight="bold" style={styles.actionText}>
        {label}
      </AppText>
    </Pressable>
  );
}

function LabelPreview({ label }: { label: ProductionLabelData }) {
  const { order, job } = label;

  return (
    <View style={styles.previewWrap}>
      <View style={styles.labelCard}>
        <View style={styles.labelTop}>
          <View>
            <AppText style={styles.brand}>SITEHUB</AppText>
            <AppText style={styles.overline}>Production handoff label</AppText>
          </View>
          <View style={styles.priorityBox}>
            <AppText style={styles.priorityText}>{(order.priority ?? 'standard').toUpperCase()}</AppText>
          </View>
        </View>

        <AppText style={styles.orderCode}>{label.orderCode}</AppText>
        <View style={styles.barcodeBox}>
          <SvgXml xml={label.barcodeSvg} width="100%" height={78} />
        </View>

        <View style={styles.infoGrid}>
          <View style={[styles.infoCell, styles.infoWide]}>
            <AppText style={styles.infoLabel}>Customer</AppText>
            <AppText style={styles.infoValue} numberOfLines={2}>
              {order.customerName || 'Missing customer'} - {order.phone || 'No phone'}
            </AppText>
          </View>
          <View style={styles.infoCell}>
            <AppText style={styles.infoLabel}>Product</AppText>
            <AppText style={styles.infoValue}>{pretty(order.productType).toUpperCase()}</AppText>
          </View>
          <View style={styles.infoCell}>
            <AppText style={styles.infoLabel}>Qty / design</AppText>
            <AppText style={styles.infoValue}>
              {order.quantity} - {pretty(order.cardDesign).toUpperCase()}
            </AppText>
          </View>
          <View style={styles.infoCell}>
            <AppText style={styles.infoLabel}>Batch</AppText>
            <AppText style={styles.infoValue} numberOfLines={1}>
              {order.batchId?.slice(0, 12) || 'UNBATCHED'}
            </AppText>
          </View>
          <View style={styles.infoCell}>
            <AppText style={styles.infoLabel}>Stage</AppText>
            <AppText style={styles.infoValue}>{pretty(job?.stage ?? order.status).toUpperCase()}</AppText>
          </View>
          <View style={[styles.infoCell, styles.infoWide]}>
            <AppText style={styles.infoLabel}>NFC target</AppText>
            <AppText style={styles.infoValue} numberOfLines={2}>
              {order.nfcTargetUrl || order.profileUrl || 'No URL'}
            </AppText>
          </View>
          <View style={[styles.infoCell, styles.infoWide]}>
            <AppText style={styles.infoLabel}>Ship to</AppText>
            <AppText style={styles.infoValue} numberOfLines={2}>
              {order.deliveryAddress || 'No delivery address'}
            </AppText>
          </View>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.checklistBox}>
            <AppText style={styles.checkText}>[ ] Print card front/back</AppText>
            <AppText style={styles.checkText}>[ ] Encode NFC URL</AppText>
            <AppText style={styles.checkText}>[ ] Tap verify</AppText>
            <AppText style={styles.checkText}>[ ] QA video recorded</AppText>
            <AppText style={styles.passcode}>Passcode: {order.productionPasscode || 'N/A'}</AppText>
          </View>
          <View style={styles.qrBox}>
            <QRCode value={label.qrPayload} size={86} />
          </View>
        </View>
      </View>
    </View>
  );
}

function ProductionLabelContent() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [job, setJob] = useState<PrinterJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<'print' | 'pdf' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [label, setLabel] = useState<ProductionLabelData | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!orderId) {
        setError('Order ID is required.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const nextOrder = await getOrder(orderId);
        if (!nextOrder) throw new Error('Order not found.');
        const nextJob = await getPrinterJobByOrderId(nextOrder.id).catch(() => null);
        if (!mounted) return;
        setOrder(nextOrder);
        setJob(nextJob);
      } catch (err) {
        if (mounted) setError(getAuthErrorMessage(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [orderId]);

  useEffect(() => {
    if (!order) {
      setLabel(null);
      return;
    }

    let mounted = true;
    void buildProductionLabelData(order, job)
      .then((next) => {
        if (mounted) setLabel(next);
      })
      .catch((err) => {
        if (mounted) setError(getAuthErrorMessage(err));
      });

    return () => {
      mounted = false;
    };
  }, [order, job]);

  async function handlePrint() {
    if (!label) return;
    setBusy('print');
    try {
      await printHtmlDocument(buildProductionLabelHtml(label), PRODUCTION_LABEL_SIZE);
    } catch (err) {
      Alert.alert('Print failed', getAuthErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function handlePdf() {
    if (!label) return;
    if (Platform.OS === 'web') {
      await handlePrint();
      return;
    }
    setBusy('pdf');
    try {
      const file = await printHtmlToPdfFile(buildProductionLabelHtml(label), PRODUCTION_LABEL_SIZE);
      await sharePdfFile(file.uri, `Production label ${label.orderCode}`);
    } catch (err) {
      Alert.alert('PDF failed', getAuthErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <AppIcon name="ChevronLeft" size={22} color={theme.colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <AppText variant="caption" tone="muted" weight="medium">
            Production
          </AppText>
          <AppText variant="h2" weight="bold" numberOfLines={1}>
            Label Preview
          </AppText>
        </View>
        <View style={styles.backSpacer} />
      </View>

      <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <AppText variant="body" tone="muted" style={styles.centerText}>
            Loading label...
          </AppText>
        ) : error ? (
          <AppText variant="body" style={styles.errorText}>
            {error}
          </AppText>
        ) : label ? (
          <>
            <View style={styles.metaCard}>
              <View style={styles.metaRow}>
                <AppIcon name="ClipboardList" size={18} color={theme.colors.primary} />
                <View style={styles.metaCopy}>
                  <AppText variant="body" weight="bold">
                    {label.orderCode}
                  </AppText>
                  <AppText variant="caption" tone="muted">
                    Approved {formatDate(order?.salesApprovedAt)} - updated {formatDate(order?.updatedAt)}
                  </AppText>
                </View>
              </View>
              <View style={styles.actionRow}>
                <LabelAction
                  label={busy === 'print' ? 'Printing' : 'Print'}
                  icon="Printer"
                  disabled={busy !== null}
                  onPress={() => void handlePrint()}
                />
                <LabelAction
                  label={Platform.OS === 'web' ? 'Print PDF' : busy === 'pdf' ? 'Creating' : 'PDF'}
                  icon="FileText"
                  disabled={busy !== null}
                  onPress={() => void handlePdf()}
                />
              </View>
            </View>

            <LabelPreview label={label} />
          </>
        ) : null}
      </IosScrollView>
    </SafeAreaView>
  );
}

export default function ProductionLabelScreen() {
  return (
    <AuthGate allowedRoles={[...OPS_ROLES]}>
      <ProductionLabelContent />
    </AuthGate>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    ...theme.shadows.control,
  },
  backSpacer: {
    width: 36,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  scroll: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  centerText: {
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
  errorText: {
    color: theme.colors.danger,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
  metaCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    ...theme.shadows.card,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  metaCopy: {
    flex: 1,
    gap: 3,
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  actionText: {
    color: '#FFFFFF',
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.75,
  },
  previewWrap: {
    alignItems: 'center',
  },
  labelCard: {
    width: '100%',
    maxWidth: 390,
    aspectRatio: 2 / 3,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    padding: 16,
    gap: 9,
  },
  labelTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 2,
    borderBottomColor: '#111827',
    paddingBottom: 8,
    gap: 10,
  },
  brand: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
  },
  overline: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: '800',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  priorityBox: {
    borderWidth: 2,
    borderColor: '#111827',
    paddingHorizontal: 7,
    paddingVertical: 5,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#111827',
  },
  orderCode: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
  },
  barcodeBox: {
    minHeight: 78,
    justifyContent: 'center',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  infoCell: {
    width: '48.8%',
    minHeight: 43,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 6,
    paddingVertical: 5,
    gap: 3,
  },
  infoWide: {
    width: '100%',
  },
  infoLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 14,
  },
  bottomRow: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  checklistBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#111827',
    padding: 7,
    gap: 2,
  },
  checkText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#111827',
  },
  passcode: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: '900',
    color: '#111827',
  },
  qrBox: {
    width: 98,
    height: 98,
    borderWidth: 1,
    borderColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
