import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import type { CustomerFlowDefinition, CustomerFlowId } from '@/src/constants/customerFlows';

export type IconFlowMetrics = Partial<Record<CustomerFlowId, string>>;

type Props = {
  title: string;
  subtitle?: string;
  primaryFlows: CustomerFlowDefinition[];
  metricFlows?: CustomerFlowDefinition[];
  metrics?: IconFlowMetrics;
  onLaunch: (flowId: CustomerFlowId) => void;
  textColor?: string;
  mutedColor?: string;
  recentLimit?: number;
};

/**
 * IconFlowHub - clean text-only flow list.
 *
 * No icons, no tinted tiles, no glow. Just an Apple Settings-style
 * grouped list of action labels so the eye reads straight down the page
 * without competing visual noise.
 */

export function IconFlowHub({
  title,
  subtitle,
  primaryFlows,
  metricFlows = [],
  metrics = {},
  onLaunch,
  textColor = '#FFFFFF',
  mutedColor = 'rgba(255, 255, 255, 0.6)',
}: Props) {
  const visibleMetrics = metricFlows.filter((flow) => flow.id in metrics);

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <AppText style={[styles.title, { color: textColor }]}>{title}</AppText>
        {subtitle ? (
          <AppText style={[styles.subtitle, { color: mutedColor }]}>{subtitle}</AppText>
        ) : null}
      </View>

      {visibleMetrics.length > 0 ? (
        <View style={styles.metricList}>
          {visibleMetrics.map((flow, i) => (
            <Pressable
              key={flow.id}
              onPress={() => onLaunch(flow.id)}
              style={({ pressed }) => [
                styles.row,
                i === visibleMetrics.length - 1 && styles.rowLast,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={flow.label}
            >
              <View style={styles.actionCopy}>
                <AppText style={[styles.actionLabel, { color: textColor }]}>{flow.label}</AppText>
              </View>
              <AppText style={[styles.metricValue, { color: mutedColor }]}>
                {metrics[flow.id] ?? '—'}
              </AppText>
              <AppIcon name="ChevronRight" size={14} color={mutedColor} />
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.actionList}>
        {primaryFlows.map((flow, i) => (
          <Pressable
            key={flow.id}
            onPress={() => onLaunch(flow.id)}
            style={({ pressed }) => [
              styles.row,
              i === primaryFlows.length - 1 && styles.rowLast,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={flow.label}
          >
            <View style={styles.actionCopy}>
              <AppText style={[styles.actionLabel, { color: textColor }]}>{flow.label}</AppText>
              <AppText style={[styles.actionSub, { color: mutedColor }]} numberOfLines={1}>
                {flow.subtitle}
              </AppText>
            </View>
            <AppIcon name="ChevronRight" size={14} color={mutedColor} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  head: {
    gap: 2,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionList: {
    backgroundColor: '#111114',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  metricList: {
    backgroundColor: '#111114',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  actionCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  actionSub: {
    fontSize: 12,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
});
