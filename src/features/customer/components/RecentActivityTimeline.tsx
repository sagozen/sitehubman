import React, { memo } from 'react';
import { View, StyleSheet, Pressable, Image, type ViewStyle, type TextStyle, type ImageStyle } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { HapticTap } from '@/src/utils/haptics';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { iosDesign, iosTypography, premiumPalette } from '@/src/design-system/ios';

type TimelineItemProps = {
  id: string;
  avatar: string;
  title: string;
  subtitle: string;
  time: string;
  isLast?: boolean;
};

const FAKE_ACTIVITY: TimelineItemProps[] = [
  { id: 'sm-01', avatar: 'https://i.pravatar.cc/150?img=68', title: 'Sok Dara', subtitle: 'Viewed your profile (NFC)', time: '2 min ago' },
  { id: 'sm-02', avatar: 'https://i.pravatar.cc/150?img=11', title: 'Chan Thea', subtitle: 'Scanned your QR code', time: '15 min ago' },
  { id: 'sm-03', avatar: 'https://i.pravatar.cc/150?img=32', title: 'Bopha Chen', subtitle: 'Connected with you', time: '1 hour ago' },
  { id: 'sm-04', avatar: 'https://i.pravatar.cc/150?img=44', title: 'Rithy Mean', subtitle: 'Opened profile link', time: '2 hours ago' },
];

export const RecentActivityTimeline = memo(function RecentActivityTimeline({
  activities = FAKE_ACTIVITY,
  onActivityPress,
}: {
  activities?: TimelineItemProps[];
  onActivityPress?: (id: string) => void;
}) {
  const displayActivities = activities.slice(0, 5);

  return (
    <View style={styles.container}>
      <AppText style={styles.sectionTitle}>Recent Activity</AppText>
      <View style={styles.timeline}>
        {displayActivities.map((item, index) => {
          const isLast = index === displayActivities.length - 1;
          return (
            <Animated.View 
              key={item.id} 
              entering={FadeInRight.delay(index * 100).springify()}
              style={styles.itemWrapper}
            >
              <Pressable
                style={({ pressed }) => [styles.item, pressed && styles.pressed]}
                onPress={() => {
                  HapticTap.light();
                  onActivityPress?.(item.id);
                }}
              >
                {/* Left side: Avatar + Line */}
                <View style={styles.leftCol}>
                  <Image source={{ uri: item.avatar }} style={styles.avatar} resizeMode="cover" />
                  {!isLast && <View style={styles.line} />}
                </View>

                {/* Right side: Content */}
                <View style={[styles.content, isLast && styles.contentLast]}>
                  <View style={styles.textWrap}>
                    <AppText style={styles.title}>{item.title}</AppText>
                    <AppText style={styles.subtitle}>{item.subtitle}</AppText>
                  </View>
                  <AppText style={styles.time}>{item.time}</AppText>
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: iosDesign.spacing.lg,
  } as ViewStyle,
  sectionTitle: {
    ...iosTypography.h3,
    color: premiumPalette.textPrimary,
    marginBottom: iosDesign.spacing.lg,
    letterSpacing: -0.5,
  } as TextStyle,
  timeline: {
    marginLeft: 4,
  } as ViewStyle,
  itemWrapper: {
    width: '100%',
  } as ViewStyle,
  item: {
    flexDirection: 'row',
  } as ViewStyle,
  pressed: {
    opacity: 0.7,
  } as ViewStyle,
  leftCol: {
    alignItems: 'center',
    width: 40,
  } as ViewStyle,
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: premiumPalette.surfaceSoft,
    borderWidth: 2,
    borderColor: premiumPalette.accent,
    zIndex: 2,
  } as ImageStyle,
  line: {
    width: 2,
    flex: 1,
    backgroundColor: premiumPalette.border,
    marginTop: -4,
    marginBottom: -4,
    zIndex: 1,
  } as ViewStyle,
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: iosDesign.spacing.lg,
    paddingLeft: iosDesign.spacing.md,
  } as ViewStyle,
  contentLast: {
    paddingBottom: 0,
  } as ViewStyle,
  textWrap: {
    flex: 1,
    paddingRight: iosDesign.spacing.lg,
  } as ViewStyle,
  title: {
    ...iosTypography.headline,
    color: premiumPalette.textPrimary,
    marginBottom: 2,
  } as TextStyle,
  subtitle: {
    ...iosTypography.bodySmall,
    color: premiumPalette.textSecondary,
  } as TextStyle,
  time: {
    ...iosTypography.caption,
    color: premiumPalette.textSecondary,
    marginTop: 2,
  } as TextStyle,
});
