import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { FlowIcon } from '@/src/components/FlowIcon';
import type { CustomerFlowDefinition, CustomerFlowId } from '@/src/constants/customerFlows';
import { CUSTOMER_FLOWS } from '@/src/constants/customerFlows';
import { iosTypography } from '@/src/design-system/ios';
import { getRecentCustomerFlows } from '@/src/services/customerFlowStorage';

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
 * Icon-driven hub — no cards, borders, or grid boxes.
 * Metrics + airy action rows + horizontal recents.
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
  recentLimit = 4,
}: Props) {
  const [recentIds, setRecentIds] = useState<CustomerFlowId[]>([]);

  useEffect(() => {
    void getRecentCustomerFlows(recentLimit).then(setRecentIds);
  }, [recentLimit]);

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

      {metricFlows.length > 0 ? (
        <View style={styles.metricRow}>
          {metricFlows.map((flow) => (
            <Pressable
              key={flow.id}
              onPress={() => onLaunch(flow.id)}
              style={({ pressed }) => [styles.metricItem, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={flow.label}
            >
              <FlowIcon
                realIcon={flow.realIcon}
                fallbackIcon={flow.fallbackIcon}
                tint={flow.tint}
                size={36}
                glow
              />
              <AppText style={[styles.metricValue, { color: textColor }]}>
                {metrics[flow.id] ?? '—'}
              </AppText>
              <AppText style={[styles.metricLabel, { color: mutedColor }]} numberOfLines={1}>
                {flow.label}
              </AppText>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.actionList}>
        {primaryFlows.map((flow) => (
          <Pressable
            key={flow.id}
            onPress={() => onLaunch(flow.id)}
            style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={flow.label}
          >
            <FlowIcon
              realIcon={flow.realIcon}
              fallbackIcon={flow.fallbackIcon}
              tint={flow.tint}
              size={52}
              glow
            />
            <View style={styles.actionCopy}>
              <AppText style={[styles.actionLabel, { color: textColor }]}>{flow.label}</AppText>
              <AppText style={[styles.actionSub, { color: mutedColor }]} numberOfLines={2}>
                {flow.subtitle}
              </AppText>
            </View>
            <AppIcon name="ChevronRight" size={15} color={mutedColor} />
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
                <FlowIcon
                  realIcon={flow.realIcon}
                  fallbackIcon={flow.fallbackIcon}
                  tint={flow.tint}
                  size={40}
                  glow
                />
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
    gap: 22,
  },
  head: {
    gap: 4,
  },
  title: {
    ...iosTypography.h2,
    fontWeight: '600',
  },
  subtitle: {
    ...iosTypography.caption,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  metricValue: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
  },
  metricLabel: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.35,
    textAlign: 'center',
  },
  actionList: {
    gap: 6,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
  },
  actionCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  actionLabel: {
    ...iosTypography.body,
    fontWeight: '600',
  },
  actionSub: {
    fontSize: 13,
    lineHeight: 18,
  },
  recentBlock: {
    gap: 10,
  },
  recentTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recentScroll: {
    gap: 20,
    paddingRight: 8,
  },
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
  pressed: {
    opacity: 0.62,
  },
});
