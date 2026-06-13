import { Image, type ImageSourcePropType, Pressable, StyleSheet, View } from 'react-native';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { FlowIcon } from '@/src/components/FlowIcon';
import type { FlowRealIconId } from '@/src/constants/flowRealIcons';
import { SNAP_TAP_BRAND } from '@/src/constants/snapTapBrand';
import { iosTypography } from '@/src/design-system/ios';

export type HomeFourButtonItem = {
  id: string;
  icon: AppIconName;
  realIcon?: FlowRealIconId;
  tint?: string;
  imageSource?: ImageSourcePropType;
  label: string;
  subtitle?: string;
  onPress: () => void;
};

type Props = {
  items: HomeFourButtonItem[];
  textColor?: string;
  mutedColor?: string;
  compact?: boolean;
};

/** Open 2×2 icon grid — no card shell or divider lines. */
export function HomeFourButtonGrid({
  items,
  textColor = '#0F172A',
  mutedColor = '#64748B',
  compact = false,
}: Props) {
  const four = items.slice(0, 4);

  return (
    <View style={[styles.grid, compact && styles.gridCompact]}>
      {four.map((item) => (
        <Pressable
          key={item.id}
          onPress={item.onPress}
          style={({ pressed }) => [styles.cell, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={item.label}
        >
          {item.imageSource ? (
            <Image source={item.imageSource} style={styles.photo} resizeMode="cover" />
          ) : item.realIcon ? (
            <FlowIcon
              realIcon={item.realIcon}
              fallbackIcon={item.icon}
              tint={item.tint ?? SNAP_TAP_BRAND}
              size={compact ? 44 : 48}
              glow
            />
          ) : (
            <FlowIcon
              realIcon="ecard"
              fallbackIcon={item.icon}
              tint={item.tint ?? SNAP_TAP_BRAND}
              size={compact ? 44 : 48}
              glow
            />
          )}
          <AppText style={[styles.label, { color: textColor }]} numberOfLines={2}>
            {item.label}
          </AppText>
          {item.subtitle ? (
            <AppText style={[styles.subtitle, { color: mutedColor }]} numberOfLines={2}>
              {item.subtitle}
            </AppText>
          ) : null}
          <AppIcon name="ChevronRight" size={13} color={mutedColor} style={styles.chevron} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 20,
    columnGap: 12,
  },
  gridCompact: {
    rowGap: 14,
  },
  cell: {
    width: '47%',
    gap: 6,
    paddingVertical: 4,
    position: 'relative',
  },
  photo: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  label: {
    ...iosTypography.body,
    fontWeight: '700',
    paddingRight: 16,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
    paddingRight: 16,
  },
  chevron: {
    position: 'absolute',
    right: 0,
    bottom: 4,
  },
  pressed: {
    opacity: 0.65,
  },
});
