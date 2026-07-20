/**
 * OrderTimeline — renders the simplified 8-step order progress.
 * Supports compact (order card) and full (order detail) modes.
 */
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
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
      {timeline.map((step, index) => {
        const isLast = index === timeline.length - 1;
        return (
          <View key={`${step.step}-${index}`} style={styles.row}>
            {/* Timeline column */}
            <View style={styles.lineCol}>
              <View
                style={[
                  styles.dot,
                  step.done && !step.failed && styles.dotDone,
                  step.active && !step.failed && styles.dotActive,
                  step.failed && styles.dotFailed,
                ]}
              >
                {step.done && !step.active ? (
                  <AppIcon name="Check" size={6} color="#fff" />
                ) : step.active && step.failed ? (
                  <AppIcon name="AlertCircle" size={8} color="#fff" />
                ) : step.active ? (
                  <View style={styles.dotPulse} />
                ) : null}
              </View>
              {!isLast ? (
                <View style={[styles.line, step.done && styles.lineDone]} />
              ) : null}
            </View>

            {/* Content */}
            <View style={[styles.copy, isLast && styles.copyLast]}>
              <AppText
                variant={compact ? 'caption' : 'body'}
                weight={step.active ? 'bold' : step.done ? 'semibold' : 'regular'}
                style={[
                  step.active && !step.failed && styles.activeText,
                  step.failed && styles.failedText,
                  !step.done && !step.active && styles.pendingText,
                ]}
              >
                {step.step}
              </AppText>
              <AppText
                variant="caption"
                tone="muted"
                style={step.active ? styles.activeAt : undefined}
              >
                {step.at}
              </AppText>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 0, paddingVertical: 4 },
  wrapCompact: { paddingVertical: 2 },

  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },

  // Timeline track
  lineCol: {
    alignItems: 'center',
    width: 14,
    paddingTop: 3,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  dotDone: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  dotActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  dotFailed: {
    backgroundColor: theme.colors.danger,
    borderColor: theme.colors.danger,
  },
  dotPulse: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#fff',
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 16,
    backgroundColor: theme.colors.border,
    marginVertical: 2,
  },
  lineDone: {
    backgroundColor: theme.colors.success,
  },

  // Content
  copy: {
    flex: 1,
    paddingVertical: 4,
    paddingBottom: 12,
    gap: 2,
  },
  copyLast: {
    paddingBottom: 4,
  },
  activeText: {
    color: theme.colors.primary,
  },
  failedText: {
    color: theme.colors.danger,
  },
  pendingText: {
    color: theme.colors.textMuted,
  },
  activeAt: {
    color: theme.colors.primary,
  },
});
