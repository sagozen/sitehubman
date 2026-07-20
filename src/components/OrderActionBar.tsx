/**
 * OrderActionBar — role-aware CTA bar for an order.
 *
 * Shows the actions the current role is allowed to perform on this
 * specific order, based on the order's current status. Buttons are
 * derived from the centralised workflow module so adding a new step
 * or permission is a one-file change.
 *
 * Primary action is rendered as a filled pill on the right; secondary
 * actions live as a row of smaller pills. Destructive actions are red.
 */
import { memo, useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import {
  availableActions,
  getActionMeta,
  type ActionId,
} from '@/src/constants/orderWorkflow';
import type { Order, UserRole } from '@/src/types/models';

type Props = {
  order: Order;
  role: UserRole;
  /** Called when the user wants to perform an action. The screen wires this to the actual service call. */
  onAction: (action: ActionId) => void | Promise<void>;
  /** Hide the secondary actions row (only show primary). */
  primaryOnly?: boolean;
};

const MUTED = '#8E8E93';
const INK = '#1C1C1E';
const SURFACE = '#FFFFFF';
const HAIRLINE = 'rgba(60,60,67,0.12)';

export const OrderActionBar = memo(function OrderActionBar({
  order,
  role,
  onAction,
  primaryOnly,
}: Props) {
  const actions = useMemo(() => availableActions(role, order), [role, order]);
  const [busy, setBusy] = useState<ActionId | null>(null);

  const primary = actions[0];
  const secondary = primaryOnly ? [] : actions.slice(1);
  const primaryMeta = primary ? getActionMeta(primary) : null;

  const dispatch = useCallback(
    async (action: ActionId) => {
      const meta = getActionMeta(action);
      if (busy) return;
      if (meta.confirm) {
        Alert.alert(meta.label, 'This action cannot be undone.', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            style: meta.variant === 'destructive' ? 'destructive' : 'default',
            onPress: async () => {
              setBusy(action);
              try { await onAction(action); } finally { setBusy(null); }
            },
          },
        ]);
        return;
      }
      setBusy(action);
      try { await onAction(action); } finally { setBusy(null); }
    },
    [onAction, busy],
  );

  if (!primaryMeta) {
    return (
      <View style={ab.empty}>
        <AppText style={ab.emptyText}>No actions available for {roleLabel(role)}</AppText>
      </View>
    );
  }

  return (
    <View style={ab.wrap}>
      {secondary.length > 0 ? (
        <View style={ab.secondaryRow}>
          {secondary.map((action) => {
            const meta = getActionMeta(action);
            const tint = variantColor(meta.variant, 'soft');
            const fg = variantColor(meta.variant, 'fg');
            return (
              <Pressable
                key={action}
                disabled={busy !== null}
                onPress={() => dispatch(action)}
                style={({ pressed }) => [
                  ab.secondary,
                  { backgroundColor: tint },
                  pressed && ab.pressed,
                  busy !== null && ab.disabled,
                ]}
                accessibilityRole="button"
                accessibilityLabel={meta.label}
              >
                <AppIcon name={meta.icon} size={13} color={fg} />
                <AppText style={[ab.secondaryText, { color: fg }]} numberOfLines={1}>
                  {meta.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      <Pressable
        disabled={busy !== null}
        onPress={() => dispatch(primary!)}
        style={({ pressed }) => [
          ab.primary,
          { backgroundColor: primaryMeta.variant === 'destructive' ? '#FF3B30' : INK },
          pressed && ab.pressed,
          busy !== null && ab.disabled,
        ]}
        accessibilityRole="button"
        accessibilityLabel={primaryMeta.label}
      >
        <AppIcon name={primaryMeta.icon} size={16} color="#fff" />
        <AppText style={ab.primaryText} numberOfLines={1}>
          {busy === primary ? 'Working…' : primaryMeta.label}
        </AppText>
      </Pressable>
    </View>
  );
});

function roleLabel(role: UserRole): string {
  switch (role) {
    case 'customer':         return 'customer';
    case 'sales':            return 'sales';
    case 'agent':            return 'sales';
    case 'printer':          return 'printer';
    case 'printer_operator': return 'printer';
    case 'qa_inspector':     return 'QA';
    case 'shipping':         return 'shipping';
    case 'finance':          return 'finance';
    case 'admin':            return 'admin';
    case 'super_admin':      return 'admin';
    default:                 return 'guest';
  }
}

function variantColor(variant: 'primary' | 'secondary' | 'destructive', kind: 'soft' | 'fg'): string {
  if (variant === 'destructive') return kind === 'soft' ? 'rgba(255,59,48,0.10)' : '#FF3B30';
  if (variant === 'secondary')   return kind === 'soft' ? 'rgba(0,0,0,0.05)' : INK;
  return kind === 'soft' ? 'rgba(0,0,0,0.05)' : INK;
}

const ab = StyleSheet.create({
  wrap: { gap: 8 },
  primary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 13, borderRadius: 12,
  },
  primaryText: { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: 0.1 },
  secondaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  secondary: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999,
  },
  secondaryText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.1 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.5 },
  empty: {
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12,
    backgroundColor: SURFACE, borderWidth: 1, borderColor: HAIRLINE, alignItems: 'center',
  },
  emptyText: { fontSize: 12, fontWeight: '600', color: MUTED },
});
