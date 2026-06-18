import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { IosScrollView } from '@/src/components/IosScrollView';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { SettingsGroup, SettingsSection } from '@/src/components/SettingsGroup';
import { orderStatusOptions, productTypeOptions } from '@/src/constants/options';
import { theme } from '@/src/constants/theme';
import {
  AdminScreenShell,
  AdminStatChip,
  AdminStatChipRow,
  AdminStatusPill,
} from '@/src/features/admin/components/AdminScreenShell';
import { useAuth } from '@/src/hooks/useAuth';
import { getAuthErrorMessage } from '@/src/services/authService';
import { listProductionLabelOrders } from '@/src/services/productionService';
import { productionOrderCode } from '@/src/services/labelService';
import type { Order, OrderStatus } from '@/src/types/models';

type PillTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

function statusTone(status: OrderStatus): PillTone {
  if (status === 'ready_to_ship') return 'success';
  if (status === 'qa_failed') return 'danger';
  if (status === 'production_approved' || status === 'printer_assigned') return 'warning';
  return 'info';
}

function shortId(value?: string) {
  return value ? value.slice(0, 8).toUpperCase() : 'UNKNOWN';
}

function optionLabel(options: readonly { value: string; label: string }[], value: string) {
  return options.find((item) => item.value === value)?.label ?? value.replace(/_/g, ' ');
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

function LabelOrderRow({ order }: { order: Order }) {
  const orderCode = productionOrderCode(order);
  const statusLabel = optionLabel(orderStatusOptions, order.status);
  const productLabel = optionLabel(productTypeOptions, order.productType);

  return (
    <View style={styles.item}>
      <View style={styles.itemTop}>
        <View style={styles.itemCopy}>
          <AppText variant="caption" tone="muted" weight="bold">
            {orderCode}
          </AppText>
          <AppText variant="body" weight="bold" numberOfLines={1}>
            {order.customerName || 'Missing customer'}
          </AppText>
          <AppText variant="caption" tone="muted" numberOfLines={2}>
            {productLabel} - {order.quantity} card{order.quantity === 1 ? '' : 's'} - {order.cardCode || shortId(order.id)}
          </AppText>
        </View>
        <View style={styles.pillStack}>
          <AdminStatusPill label={statusLabel} tone={statusTone(order.status)} />
          {order.priority === 'urgent' ? <AdminStatusPill label="urgent" tone="danger" /> : null}
        </View>
      </View>

      <View style={styles.metaLine}>
        <AppIcon name="Calendar" size={14} color={theme.colors.textMuted} />
        <AppText variant="caption" tone="muted" numberOfLines={1}>
          Approved {formatDate(order.salesApprovedAt)} - {order.batchId ? `batch ${shortId(order.batchId)}` : 'unbatched'}
        </AppText>
      </View>

      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [styles.openBtn, pressed && styles.pressed]}
        onPress={() => {
          router.push({ pathname: '/production-label/[orderId]', params: { orderId: order.id } });
        }}
      >
        <AppIcon name="Printer" size={15} color={theme.colors.primary} />
        <AppText variant="caption" weight="semibold" style={{ color: theme.colors.primary }}>
          Preview label
        </AppText>
      </Pressable>
    </View>
  );
}

export default function AdminLabelsScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOrders(await listProductionLabelOrders(user?.branch));
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [user?.branch]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const urgent = orders.filter((order) => order.priority === 'urgent').length;
    const unbatched = orders.filter((order) => !order.batchId).length;
    const qa = orders.filter((order) => order.status === 'qa_pending' || order.status === 'qa_failed').length;
    return { urgent, unbatched, qa, total: orders.length };
  }, [orders]);

  return (
    <AdminScreenShell
      title="Labels"
      subtitle="Admin"
      rightAction={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refresh labels"
          onPress={() => void load()}
          disabled={loading}
          hitSlop={8}
          style={({ pressed }) => [styles.refreshBtn, pressed && styles.pressed, loading && styles.disabled]}
        >
          <AppIcon name="RefreshCw" size={20} color={theme.colors.textPrimary} />
        </Pressable>
      }
      scroll={false}
    >
      {error ? (
        <AppText variant="body" style={styles.errorText}>
          {error}
        </AppText>
      ) : null}

      <AdminStatChipRow>
        <AdminStatChip label="Ready labels" value={String(stats.total)} tone={theme.colors.info} />
        <AdminStatChip label="Unbatched" value={String(stats.unbatched)} tone={theme.colors.warning} />
        <AdminStatChip label="QA related" value={String(stats.qa)} />
        <AdminStatChip label="Urgent" value={String(stats.urgent)} tone={theme.colors.danger} />
      </AdminStatChipRow>

      <SettingsSection title="Production handoff" compact footer="Labels include Code128 order barcode, QR receive payload, checklist, and shipping details." />
      <IosScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {loading ? (
          <AppText variant="body" tone="muted" style={styles.empty}>
            Loading labels...
          </AppText>
        ) : orders.length === 0 ? (
          <AppText variant="body" tone="muted" style={styles.empty}>
            No paid, approved production labels are ready.
          </AppText>
        ) : (
          <SettingsGroup compact style={styles.groupPad}>
            {orders.map((order, index) => (
              <View key={order.id}>
                <LabelOrderRow order={order} />
                {index < orders.length - 1 ? <View style={styles.separator} /> : null}
              </View>
            ))}
          </SettingsGroup>
        )}
      </IosScrollView>
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
  list: {
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.sm,
  },
  groupPad: {
    paddingVertical: theme.spacing.xs,
  },
  empty: {
    textAlign: 'center',
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.danger,
    paddingHorizontal: theme.spacing.md,
  },
  item: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
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
  },
  pillStack: {
    alignItems: 'flex-end',
    gap: 5,
    maxWidth: '38%',
  },
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  openBtn: {
    alignSelf: 'flex-start',
    minHeight: 34,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: theme.colors.primarySoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.7,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border,
    marginLeft: theme.spacing.md,
  },
});
