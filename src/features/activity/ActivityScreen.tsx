import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';
import { AppIcon } from '@/src/components/AppIcon';
import type { AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { IosScrollView } from '@/src/components/IosScrollView';

type EventType = 'NFC tap' | 'Profile view' | 'QR scan';

interface ActivityItem {
  id: string;
  time: string;
  type: EventType;
  location: string;
}

interface DayGroup {
  label: string;
  items: ActivityItem[];
}

const MOCK_DATA: DayGroup[] = [
  {
    label: 'Today',
    items: [
      { id: 't1', time: '2:41 PM', type: 'NFC tap',      location: 'Singapore, SG' },
      { id: 't2', time: '11:08 AM', type: 'Profile view', location: 'Kuala Lumpur, MY' },
      { id: 't3', time: '9:53 AM',  type: 'QR scan',      location: 'Bangkok, TH' },
      { id: 't4', time: '8:17 AM',  type: 'NFC tap',      location: 'Singapore, SG' },
    ],
  },
  {
    label: 'Yesterday',
    items: [
      { id: 'y1', time: '7:30 PM', type: 'Profile view', location: 'Jakarta, ID' },
      { id: 'y2', time: '4:55 PM', type: 'NFC tap',      location: 'Ho Chi Minh, VN' },
      { id: 'y3', time: '1:22 PM', type: 'QR scan',      location: 'Phnom Penh, KH' },
      { id: 'y4', time: '10:09 AM', type: 'Profile view', location: 'Manila, PH' },
      { id: 'y5', time: '8:44 AM',  type: 'NFC tap',      location: 'Singapore, SG' },
    ],
  },
];

const EVENT_ICON: Record<EventType, AppIconName> = {
  'NFC tap':     'Nfc',
  'Profile view': 'Eye',
  'QR scan':     'QrCode',
};

function today() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function TimelineItem({ item, isLast }: { item: ActivityItem; isLast: boolean }) {
  const icon = EVENT_ICON[item.type];
  return (
    <View style={itemStyles.row}>
      {/* Timeline track */}
      <View style={itemStyles.track}>
        <View style={itemStyles.dot} />
        {!isLast && <View style={itemStyles.line} />}
      </View>

      {/* Content */}
      <View style={itemStyles.body}>
        <View style={itemStyles.meta}>
          <View style={itemStyles.iconWrap}>
            <AppIcon name={icon} size={14} color="#2596BE" />
          </View>
          <AppText variant="footnote" weight="semibold" style={itemStyles.typeLabel}>
            {item.type}
          </AppText>
        </View>
        <View style={itemStyles.details}>
          <AppText variant="footnote" muted style={itemStyles.time}>
            {item.time}
          </AppText>
          <View style={itemStyles.separator} />
          <AppIcon name="MapPin" size={11} color="#9A9AA0" />
          <AppText variant="footnote" muted style={itemStyles.location}>
            {item.location}
          </AppText>
        </View>
      </View>
    </View>
  );
}

function DaySection({ group }: { group: DayGroup }) {
  return (
    <View style={sectionStyles.root}>
      <AppText variant="footnote" weight="semibold" style={sectionStyles.label}>
        {group.label}
      </AppText>
      <View style={sectionStyles.list}>
        {group.items.map((item, index) => (
          <TimelineItem
            key={item.id}
            item={item}
            isLast={index === group.items.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

export function ActivityScreen() {
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <IosScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Page header */}
          <View style={styles.pageHeader}>
            <AppText variant="display" weight="semibold" style={styles.pageTitle}>
              Activity
            </AppText>
            <AppText variant="footnote" muted style={styles.dateSubtitle}>
              {today()}
            </AppText>
          </View>

          {/* Day groups */}
          {MOCK_DATA.map((group) => (
            <DaySection key={group.label} group={group} />
          ))}
        </View>
      </IosScrollView>
    </SafeAreaView>
  );
}

export default ActivityScreen;

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D0D0E',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  content: {
    paddingHorizontal: 16,
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
    paddingTop: 28,
  },
  pageHeader: {
    marginBottom: 36,
    gap: 4,
  },
  pageTitle: {
    fontSize: 34,
    lineHeight: 40,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  dateSubtitle: {
    fontSize: 13,
    color: '#9A9AA0',
  },
});

const sectionStyles = StyleSheet.create({
  root: {
    marginBottom: 32,
  },
  label: {
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#9A9AA0',
    marginBottom: 16,
  },
  list: {
    gap: 0,
  },
});

const itemStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 16,
    minHeight: 64,
  },
  track: {
    width: 16,
    alignItems: 'center',
    paddingTop: 3,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2596BE',
    marginTop: 2,
  },
  line: {
    flex: 1,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginTop: 6,
  },
  body: {
    flex: 1,
    paddingBottom: 20,
    gap: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: 'rgba(37,150,190,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeLabel: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  time: {
    fontSize: 12,
    color: '#9A9AA0',
  },
  separator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#9A9AA0',
    opacity: 0.4,
  },
  location: {
    fontSize: 12,
    color: '#9A9AA0',
  },
});
