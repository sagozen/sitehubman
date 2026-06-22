import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import type { CustomerFlowDefinition, CustomerFlowId } from '@/src/constants/customerFlows';
import { CUSTOMER_FLOWS } from '@/src/constants/customerFlows';

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
  textColor = '#1C1C1E',
  mutedColor = '#8E8E93',
}: Props) {
  const visibleMetrics = metricFlows.filter((flow) => flow.id in metrics);
  const recentIds: CustomerFlowId[] = []; // recent strip removed for clarity
  const recentFlows = useMemo(
    () => recentIds.map((id) => CUSTOMER_FLOWS[id]).filter(Boolean),
    [recentIds],
  );

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

      {recentFlows.length > 0 ? (
        <View style={styles.recentBlock}>
          <AppText style={[styles.recentTitle, { color: mutedColor }]}>Recent</AppText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentScroll}
          >
            {recentFlows.map((flow) => (
              <Pressable
                key={flow.id}
                onPress={() => onLaunch(flow.id)}
                style={({ pressed }) => [styles.recentItem, pressed && styles.pressed]}
              >
                <AppText style={[styles.recentLabel, { color: textColor }]} numberOfLines={1}>
                  {flow.label}
                </AppText>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
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
  // Apple Settings-style grouped list: one white surface, hairline rows.
  actionList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
  },
  metricList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60,60,67,0.18)',
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
    letterSpacing: -0.1,
  },
  actionSub: {
    fontSize: 12,
    fontWeight: '400',
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  pressed: { opacity: 0.65 },
  recentBlock: { gap: 10 },
  recentTitle: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  recentScroll: { gap: 20, paddingRight: 8 },
  recentItem: {
    alignItems: 'center',
    gap: 6,
    width: 72,
  },
  recentLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});
