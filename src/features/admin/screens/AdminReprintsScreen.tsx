import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { IosScrollView } from '@/src/components/IosScrollView';
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
import { useAuth } from '@/src/hooks/useAuth';
import { getAuthErrorMessage } from '@/src/services/authService';
import {
  listReprintSlaItems,
  type ReprintSlaItem,
  type ReprintSlaStatus,
} from '@/src/services/productionService';

type PillTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

function shortId(value?: string) {
  return value ? value.slice(0, 8).toUpperCase() : 'UNKNOWN';
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No date';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatAge(hours: number) {
  if (hours <= 0) return '<1h';
  if (hours < 48) return `${hours}h`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

function slaTone(status: ReprintSlaStatus): PillTone {
  if (status === 'done') return 'success';
  if (status === 'open') return 'info';
  if (status === 'overdue') return 'warning';
  return 'danger';
}

function statusLabel(status: ReprintSlaStatus) {
  if (status === 'done') return 'done';
  if (status === 'open') return 'open';
  if (status === 'overdue') return 'overdue';
  return 'blocked';
}

function ReprintRow({ item }: { item: ReprintSlaItem }) {
  const orderLabel = item.order?.orderNumber ?? shortId(item.record.orderId);
  const customerLabel = item.order?.customerName ?? 'Missing order';
  const jobStage = item.job?.stage ? item.job.stage.replace(/_/g, ' ') : 'missing job';
  const canOpenOrder = Boolean(item.record.orderId);

  return (
    <View style={styles.item}>
      <View style={styles.itemTop}>
        <View style={styles.itemCopy}>
          <AppText variant="caption" tone="muted" weight="bold">
            ORDER {orderLabel}
          </AppText>
          <AppText variant="body" weight="bold" numberOfLines={1}>
            {customerLabel}
          </AppText>
          <AppText variant="caption" tone="muted" numberOfLines={2}>
            {item.record.reason || 'Reprint requested'} - job {shortId(item.record.newJobId)} - {jobStage}
          </AppText>
        </View>
        <AdminStatusPill label={statusLabel(item.status)} tone={slaTone(item.status)} />
      </View>

      <View style={styles.slaLine}>
        <View style={styles.slaMetric}>
          <AppIcon name="Clock" size={14} color={theme.colors.textMuted} />
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            Age {formatAge(item.ageHours)}
          </AppText>
        </View>
        <View style={styles.slaMetric}>
          <AppIcon name="Calendar" size={14} color={theme.colors.textMuted} />
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            Due {formatDate(item.dueAt)}
          </AppText>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={!canOpenOrder}
        style={({ pressed }) => [styles.openBtn, pressed && styles.pressed, !canOpenOrder && styles.disabled]}
        onPress={() => {
          router.push({ pathname: '/order-detail/[orderId]', params: { orderId: item.record.orderId } });
        }}
      >
        <AppIcon name="ExternalLink" size={15} color={theme.colors.primary} />
        <AppText variant="caption" weight="semibold" style={{ color: theme.colors.primary }}>
          Open order
        </AppText>
      </Pressable>
    </View>
  );
}

export default function AdminReprintsScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<ReprintSlaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await listReprintSlaItems(user?.branch, 80));
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
    const blocked = items.filter((item) => item.status === 'blocked').length;
    const overdue = items.filter((item) => item.status === 'overdue').length;
    const open = items.filter((item) => item.status === 'open').length;
    const done = items.filter((item) => item.status === 'done').length;
    return { blocked, overdue, open, done, atRisk: blocked + overdue };
  }, [items]);

  return (
    <AdminScreenShell
      title="Reprint SLA"
      subtitle="Admin"
      rightAction={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refresh reprints"
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

      <AdminStatChipRow>
        <AdminStatChip label="At risk" value={String(stats.atRisk)} tone={theme.colors.danger} />
        <AdminStatChip label="Open" value={String(stats.open)} tone={theme.colors.info} />
        <AdminStatChip label="Blocked" value={String(stats.blocked)} tone={theme.colors.warning} />
        <AdminStatChip label="Done" value={String(stats.done)} tone={theme.colors.success} />
      </AdminStatChipRow>

      <SettingsSection title="24 hour reprint clock" compact footer="Blocked means the replacement job is missing or failed." />
      <IosScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {loading ? (
          <AppText variant="body" tone="muted" style={styles.empty}>
            Loading reprints...
          </AppText>
        ) : items.length === 0 ? (
          <AppText variant="body" tone="muted" style={styles.empty}>
            No reprints recorded.
          </AppText>
        ) : (
          <SettingsGroup compact style={styles.groupPad}>
            {items.map((item, index) => (
              <View key={item.record.id}>
                <ReprintRow item={item} />
                {index < items.length - 1 ? <View style={styles.separator} /> : null}
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
  slaLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slaMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    maxWidth: '100%',
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
