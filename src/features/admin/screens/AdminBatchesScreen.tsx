import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { IosScrollView } from '@/src/components/IosScrollView';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { SettingsGroup, SettingsSection } from '@/src/components/SettingsGroup';
import { batchMaterialOptions, batchPrinterTypeOptions } from '@/src/constants/options';
import { theme } from '@/src/constants/theme';
import {
  AdminHeaderAction,
  AdminScreenShell,
  AdminStatChip,
  AdminStatChipRow,
  AdminStatusPill,
} from '@/src/features/admin/components/AdminScreenShell';
import { useAuth } from '@/src/hooks/useAuth';
import { useProductionBatches } from '@/src/hooks/useProductionBatches';
import { getAuthErrorMessage } from '@/src/services/authService';
import {
  assignOrderToBatch,
  cancelProductionBatch,
  completeProductionBatch,
  createProductionBatch,
  listPaidOrdersUnbatched,
  setBatchStatus,
} from '@/src/services/productionService';
import type { ProductionBatch, ProductionBatchStatus } from '@/src/types/models';

type PillTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';
type ActionTone = 'primary' | 'neutral' | 'success' | 'danger';

function statusLabel(status: ProductionBatchStatus) {
  return status.replace(/_/g, ' ');
}

function batchTone(status: ProductionBatchStatus): PillTone {
  if (status === 'active') return 'info';
  if (status === 'paused' || status === 'draft') return 'warning';
  if (status === 'completed') return 'success';
  if (status === 'cancelled') return 'danger';
  return 'neutral';
}

function optionLabel(options: readonly { value: string; label: string }[], value: string) {
  return options.find((item) => item.value === value)?.label ?? value;
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

function BatchAction({
  label,
  icon,
  tone = 'neutral',
  disabled,
  onPress,
}: {
  label: string;
  icon: AppIconName;
  tone?: ActionTone;
  disabled?: boolean;
  onPress: () => void;
}) {
  const colors: Record<ActionTone, { bg: string; text: string }> = {
    primary: { bg: theme.colors.primarySoft, text: theme.colors.primary },
    neutral: { bg: theme.colors.surfaceSoft, text: theme.colors.textPrimary },
    success: { bg: 'rgba(48,209,88,0.12)', text: theme.colors.success },
    danger: { bg: 'rgba(255,59,48,0.10)', text: theme.colors.danger },
  };
  const palette = colors[tone];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.actionBtn,
        { backgroundColor: palette.bg },
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <AppIcon name={icon} size={15} color={palette.text} />
      <AppText variant="caption" weight="semibold" numberOfLines={1} style={{ color: palette.text }}>
        {label}
      </AppText>
    </Pressable>
  );
}

function BatchRow({
  batch,
  busyKey,
  onAssign,
  onStatus,
  onComplete,
  onCancel,
}: {
  batch: ProductionBatch;
  busyKey: string | null;
  onAssign: (batchId: string) => void;
  onStatus: (batchId: string, status: ProductionBatchStatus) => void;
  onComplete: (batch: ProductionBatch) => void;
  onCancel: (batch: ProductionBatch) => void;
}) {
  const isClosed = batch.status === 'completed' || batch.status === 'cancelled';
  const disabled = Boolean(busyKey);
  const material = optionLabel(batchMaterialOptions, batch.material);
  const printer = optionLabel(batchPrinterTypeOptions, batch.printerType);

  return (
    <View style={styles.batchItem}>
      <View style={styles.batchTop}>
        <View style={styles.batchCopy}>
          <AppText variant="caption" tone="muted" weight="bold">
            {batch.branch || 'ALL BRANCHES'}
          </AppText>
          <AppText variant="body" weight="bold" numberOfLines={1}>
            {batch.batchNumber}
          </AppText>
          <AppText variant="caption" tone="muted" numberOfLines={2}>
            {material} - {printer} - updated {formatDate(batch.updatedAt)}
          </AppText>
        </View>
        <View style={styles.batchRight}>
          <AdminStatusPill label={statusLabel(batch.status)} tone={batchTone(batch.status)} />
          <AppText variant="caption" tone="muted" weight="medium">
            {batch.orderIds.length} orders
          </AppText>
        </View>
      </View>

      <View style={styles.actionRow}>
        <BatchAction
          label={busyKey === `assign:${batch.id}` ? 'Loading' : 'Assign'}
          icon="PlusSimple"
          tone="primary"
          disabled={disabled || batch.status !== 'active'}
          onPress={() => onAssign(batch.id)}
        />
        {batch.status === 'active' ? (
          <BatchAction
            label="Pause"
            icon="Clock"
            disabled={disabled}
            onPress={() => onStatus(batch.id, 'paused')}
          />
        ) : batch.status === 'paused' || batch.status === 'draft' ? (
          <BatchAction
            label={batch.status === 'draft' ? 'Activate' : 'Resume'}
            icon="RefreshCw"
            tone="primary"
            disabled={disabled}
            onPress={() => onStatus(batch.id, 'active')}
          />
        ) : null}
        <BatchAction
          label="Complete"
          icon="CircleCheck"
          tone="success"
          disabled={disabled || isClosed || batch.orderIds.length === 0}
          onPress={() => onComplete(batch)}
        />
        <BatchAction
          label="Cancel"
          icon="X"
          tone="danger"
          disabled={disabled || isClosed}
          onPress={() => onCancel(batch)}
        />
      </View>
    </View>
  );
}

export default function AdminBatchesScreen() {
  const { user } = useAuth();
  const { batches, isLoading, error } = useProductionBatches();
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const stats = useMemo(() => {
    const active = batches.filter((batch) => batch.status === 'active').length;
    const paused = batches.filter((batch) => batch.status === 'paused' || batch.status === 'draft').length;
    const closed = batches.filter((batch) => batch.status === 'completed' || batch.status === 'cancelled').length;
    const orders = batches.reduce((sum, batch) => sum + batch.orderIds.length, 0);
    return { active, paused, closed, orders };
  }, [batches]);

  async function handleCreateBatch() {
    if (!user?.id) return;
    setBusyKey('create');
    try {
      const suffix = String(Date.now()).slice(-4);
      await createProductionBatch({
        batchNumber: `ADM-${suffix}`,
        material: 'wood',
        printerType: 'uv_flatbed',
        branch: user.branch ?? '',
        createdBy: user.id,
      });
      Alert.alert('Batch created', 'Batch is active. Assign paid, approved orders below.');
    } catch (err) {
      Alert.alert('Create failed', getAuthErrorMessage(err));
    } finally {
      setBusyKey(null);
    }
  }

  async function handleAssign(batchId: string, orderId: string) {
    setBusyKey(`assign:${batchId}`);
    try {
      await assignOrderToBatch(batchId, orderId, user?.id);
      Alert.alert('Assigned', 'Order added to batch and printer job created.');
    } catch (err) {
      Alert.alert('Assign failed', getAuthErrorMessage(err));
    } finally {
      setBusyKey(null);
    }
  }

  async function handleSetBatchStatus(batchId: string, status: ProductionBatchStatus) {
    setBusyKey(`status:${batchId}`);
    try {
      await setBatchStatus(batchId, status, undefined, user?.id);
      Alert.alert('Batch updated', `Status set to ${statusLabel(status)}.`);
    } catch (err) {
      Alert.alert('Update failed', getAuthErrorMessage(err));
    } finally {
      setBusyKey(null);
    }
  }

  async function showUnbatched(batchId: string) {
    setBusyKey(`assign:${batchId}`);
    try {
      const orders = await listPaidOrdersUnbatched(user?.branch);
      if (orders.length === 0) {
        Alert.alert('No orders', 'No paid, approved, unbatched orders are available.');
        return;
      }
      const first = orders[0];
      Alert.alert(
        'Assign next paid order',
        `${first.customerName} (${first.cardCode})`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Assign', onPress: () => void handleAssign(batchId, first.id) },
        ]
      );
    } catch (err) {
      Alert.alert('Lookup failed', getAuthErrorMessage(err));
    } finally {
      setBusyKey(null);
    }
  }

  function handleComplete(batch: ProductionBatch) {
    Alert.alert(
      'Complete batch?',
      'All printer jobs must be ready to ship, completed, or failed before this closes.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            setBusyKey(`complete:${batch.id}`);
            try {
              await completeProductionBatch(batch.id, user?.id);
              Alert.alert('Batch completed', `${batch.batchNumber} is closed for production.`);
            } catch (err) {
              Alert.alert('Complete failed', getAuthErrorMessage(err));
            } finally {
              setBusyKey(null);
            }
          },
        },
      ]
    );
  }

  function handleCancel(batch: ProductionBatch) {
    Alert.alert(
      'Cancel batch?',
      'Only unstarted batches can be cancelled. Assigned orders will return to the unbatched queue.',
      [
        { text: 'Keep batch', style: 'cancel' },
        {
          text: 'Cancel batch',
          style: 'destructive',
          onPress: async () => {
            setBusyKey(`cancel:${batch.id}`);
            try {
              await cancelProductionBatch(batch.id, 'Admin cancelled from batch screen', user?.id);
              Alert.alert('Batch cancelled', `${batch.batchNumber} was cancelled.`);
            } catch (err) {
              Alert.alert('Cancel failed', getAuthErrorMessage(err));
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
      title="Production Batches"
      subtitle="Admin"
      scroll={false}
      rightAction={
        <AdminHeaderAction
          label={busyKey === 'create' ? 'Saving' : 'New'}
          icon="Plus"
          onPress={() => void handleCreateBatch()}
        />
      }
    >
      <AdminStatChipRow>
        <AdminStatChip label="Active" value={String(stats.active)} tone={theme.colors.info} />
        <AdminStatChip label="Paused" value={String(stats.paused)} tone={theme.colors.warning} />
        <AdminStatChip label="Orders" value={String(stats.orders)} />
        <AdminStatChip label="Closed" value={String(stats.closed)} tone={theme.colors.success} />
      </AdminStatChipRow>

      <SettingsSection title="Batch queue" compact footer="Complete batches only after QA handoff is finished." />
      <IosScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {error ? (
          <AppText variant="body" style={styles.errorText}>
            {error}
          </AppText>
        ) : null}
        {isLoading ? (
          <AppText variant="body" tone="muted" style={styles.empty}>
            Loading batches...
          </AppText>
        ) : batches.length === 0 ? (
          <AppText variant="body" tone="muted" style={styles.empty}>
            No production batches yet.
          </AppText>
        ) : (
          <SettingsGroup compact style={styles.groupPad}>
            {batches.map((batch, index) => (
              <View key={batch.id}>
                <BatchRow
                  batch={batch}
                  busyKey={busyKey}
                  onAssign={(batchId) => void showUnbatched(batchId)}
                  onStatus={(batchId, status) => void handleSetBatchStatus(batchId, status)}
                  onComplete={handleComplete}
                  onCancel={handleCancel}
                />
                {index < batches.length - 1 ? <View style={styles.separator} /> : null}
              </View>
            ))}
          </SettingsGroup>
        )}
      </IosScrollView>
    </AdminScreenShell>
  );
}

const styles = StyleSheet.create({
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
  batchItem: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
    gap: theme.spacing.sm,
  },
  batchTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  batchCopy: {
    flex: 1,
    gap: 3,
  },
  batchRight: {
    alignItems: 'flex-end',
    gap: 6,
    maxWidth: '38%',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionBtn: {
    minWidth: 92,
    minHeight: 36,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
