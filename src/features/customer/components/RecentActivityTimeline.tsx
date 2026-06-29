import { View, StyleSheet, Image, Pressable, type ViewStyle, type TextStyle, type ImageStyle } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { HapticTap } from '@/src/utils/haptics';

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

export function RecentActivityTimeline({
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
            <Pressable
              key={item.id}
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
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  } as ViewStyle,
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 20,
    letterSpacing: -0.5,
  } as TextStyle,
  timeline: {
    marginLeft: 4,
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
    backgroundColor: '#F1F5F9',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 2,
  } as ImageStyle,
  line: {
    width: 2,
    flex: 1,
    backgroundColor: '#F1F5F9',
    marginTop: -4,
    marginBottom: -4,
    zIndex: 1,
  } as ViewStyle,
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 24,
    paddingLeft: 12,
  } as ViewStyle,
  contentLast: {
    paddingBottom: 0,
  } as ViewStyle,
  textWrap: {
    flex: 1,
    paddingRight: 16,
  } as ViewStyle,
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  } as TextStyle,
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  } as TextStyle,
  time: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  } as TextStyle,
});
