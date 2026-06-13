import { StyleSheet, View } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { theme } from '@/src/constants/theme';
import type { Order } from '@/src/types/models';
import { buildOrderTimeline } from '@/src/utils/orderTrackTimeline';

type OrderTimelineProps = {
  order: Order;
  compact?: boolean;
};

export function OrderTimeline({ order, compact }: OrderTimelineProps) {
  const timeline = buildOrderTimeline(order);

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      {timeline.map((step) => (
        <View key={step.step} style={styles.row}>
          <View
            style={[
              styles.dot,
              step.done && styles.dotDone,
              step.active && styles.dotActive,
            ]}
          />
          <View style={styles.copy}>
            <AppText variant={compact ? 'caption' : 'body'} weight="semibold">
              {step.step}
            </AppText>
            <AppText variant="caption" tone="muted">
              {step.at}
            </AppText>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 2 },
  wrapCompact: { paddingVertical: 4 },
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    backgroundColor: theme.colors.border,
  },
  dotDone: { backgroundColor: theme.colors.success },
  dotActive: { backgroundColor: theme.colors.primary },
  copy: { flex: 1, gap: 2 },
});
