/**
 * SalesKPIStrip — horizontal scrollable KPI cards.
 * No per-card JS animations — single container fade-in via native driver.
 */
import { memo, useEffect, useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { salesUi } from './SalesScreenUi';
import type { AppIconName } from '@/src/components/AppIcon';

export type KPIItem = {
  label: string;
  value: string;
  sub?: string;
  trend?: 'up' | 'down' | 'flat';
  trendLabel?: string;
  icon: AppIconName;
  tone: 'orange' | 'blue' | 'green' | 'purple' | 'red';
  onPress?: () => void;
};

const TONE_MAP: Record<
  KPIItem['tone'],
  { iconBg: string; iconColor: string; valueTint: string }
> = {
  orange: { iconBg: salesUi.orangeSoft, iconColor: salesUi.accent,  valueTint: salesUi.accent  },
  blue:   { iconBg: salesUi.blueSoft,   iconColor: salesUi.blue,    valueTint: salesUi.blue    },
  green:  { iconBg: salesUi.greenSoft,  iconColor: salesUi.green,   valueTint: salesUi.green   },
  purple: { iconBg: salesUi.purpleSoft, iconColor: salesUi.purple,  valueTint: salesUi.purple  },
  red:    { iconBg: salesUi.redSoft,    iconColor: salesUi.red,     valueTint: salesUi.red     },
};

// Static card — no JS animations
const KPICard = memo(function KPICard({ item }: { item: KPIItem }) {
  const c = TONE_MAP[item.tone];
  const trendIcon: AppIconName =
    item.trend === 'up' ? 'TrendingUp' :
    item.trend === 'down' ? 'TrendingDown' : 'Minus';
  const trendColor =
    item.trend === 'up' ? salesUi.green :
    item.trend === 'down' ? salesUi.red : salesUi.muted;

  return (
    <Pressable
      onPress={item.onPress}
      style={({ pressed }) => [kpi.card, pressed && kpi.cardPressed]}
    >
      <View style={kpi.topRow}>
        <View style={[kpi.iconWrap, { backgroundColor: c.iconBg }]}>
          <AppIcon name={item.icon} size={16} color={c.iconColor} />
        </View>
        {item.trend ? (
          <View style={kpi.trendWrap}>
            <AppIcon name={trendIcon} size={12} color={trendColor} />
          </View>
        ) : null}
      </View>
      <AppText style={[kpi.value, { color: c.valueTint }]} numberOfLines={1}>
        {item.value}
      </AppText>
      <AppText style={kpi.label} numberOfLines={1}>{item.label}</AppText>
      {item.trendLabel ? (
        <AppText style={[kpi.trendLabel, { color: trendColor }]} numberOfLines={1}>
          {item.trendLabel}
        </AppText>
      ) : item.sub ? (
        <AppText style={kpi.sub} numberOfLines={1}>{item.sub}</AppText>
      ) : null}
    </Pressable>
  );
});

export const SalesKPIStrip = memo(function SalesKPIStrip({ items }: { items: KPIItem[] }) {
  // Single strip fade-in on mount — native driver
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true,
    }).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={{ opacity }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={kpi.scroll}
        style={kpi.root}
        removeClippedSubviews
      >
        {items.map((item) => (
          <KPICard key={item.label} item={item} />
        ))}
      </ScrollView>
    </Animated.View>
  );
});

const kpi = StyleSheet.create({
  root: { marginHorizontal: -20 },
  scroll: {
    paddingHorizontal: 20,
    gap: 10,
    paddingVertical: 2,
  },
  card: {
    width: 118,
    backgroundColor: salesUi.surface,
    borderRadius: salesUi.radiusMd,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: salesUi.border,
    padding: 14,
    gap: 4,
    ...salesUi.shadow,
  },
  cardPressed: { opacity: 0.78 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: salesUi.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  label: { fontSize: 11, fontWeight: '600', color: salesUi.muted },
  trendLabel: { fontSize: 10, fontWeight: '700' },
  sub: { fontSize: 10, fontWeight: '500', color: salesUi.muted },
});
