/**
 * SalesKPIStrip — horizontal scrollable KPI cards.
 * Each card shows a metric, trend arrow, and spark context.
 * Apple Stocks / Finance app aesthetic.
 */
import { useRef, useEffect } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
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
  { iconBg: string; iconColor: string; valueTint: string; labelColor: string }
> = {
  orange: { iconBg: salesUi.orangeSoft, iconColor: salesUi.accent,  valueTint: salesUi.accent,  labelColor: '#E68600' },
  blue:   { iconBg: salesUi.blueSoft,   iconColor: salesUi.blue,    valueTint: salesUi.blue,    labelColor: '#0060CC' },
  green:  { iconBg: salesUi.greenSoft,  iconColor: salesUi.green,   valueTint: salesUi.green,   labelColor: '#248A3D' },
  purple: { iconBg: salesUi.purpleSoft, iconColor: salesUi.purple,  valueTint: salesUi.purple,  labelColor: '#3634A3' },
  red:    { iconBg: salesUi.redSoft,    iconColor: salesUi.red,     valueTint: salesUi.red,     labelColor: '#D70015' },
};

function KPICard({ item, index }: { item: KPIItem; index: number }) {
  const c = TONE_MAP[item.tone];
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 320,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay: index * 60,
        tension: 100,
        friction: 14,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const trendIcon: AppIconName =
    item.trend === 'up' ? 'TrendingUp' :
    item.trend === 'down' ? 'TrendingDown' : 'Minus';
  const trendColor =
    item.trend === 'up' ? salesUi.green :
    item.trend === 'down' ? salesUi.red : salesUi.muted;

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <Pressable
        onPress={item.onPress}
        style={({ pressed }) => [kpi.card, pressed && kpi.cardPressed]}
      >
        {/* Header row */}
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

        {/* Value */}
        <AppText style={[kpi.value, { color: c.valueTint }]} numberOfLines={1}>
          {item.value}
        </AppText>

        {/* Label */}
        <AppText style={kpi.label} numberOfLines={1}>
          {item.label}
        </AppText>

        {/* Trend label */}
        {item.trendLabel ? (
          <AppText style={[kpi.trendLabel, { color: trendColor }]} numberOfLines={1}>
            {item.trendLabel}
          </AppText>
        ) : item.sub ? (
          <AppText style={kpi.sub} numberOfLines={1}>
            {item.sub}
          </AppText>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

export function SalesKPIStrip({
  items,
}: {
  items: KPIItem[];
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      bounces={false}
      contentContainerStyle={kpi.scroll}
      style={kpi.root}
    >
      {items.map((item, i) => (
        <KPICard key={item.label} item={item} index={i} />
      ))}
    </ScrollView>
  );
}

const KPI_CARD_W = 118;

const kpi = StyleSheet.create({
  root: { marginHorizontal: -20 },
  scroll: {
    paddingHorizontal: 20,
    gap: 10,
    paddingVertical: 2,
  },
  card: {
    width: KPI_CARD_W,
    backgroundColor: salesUi.surface,
    borderRadius: salesUi.radiusMd,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: salesUi.border,
    padding: 14,
    gap: 4,
    ...salesUi.shadow,
  },
  cardPressed: { opacity: 0.82, transform: [{ scale: 0.97 }] },
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
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: salesUi.muted,
  },
  trendLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  sub: {
    fontSize: 10,
    fontWeight: '500',
    color: salesUi.muted,
  },
});
