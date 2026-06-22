import { memo, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { HapticTap } from '@/src/utils/haptics';
import {
  Easings,
  MotionDuration,
  MotionScale,
  staggerDelay,
} from '@/src/utils/motion';

/**
 * TapMomentCard - the killer feature visual.
 *
 * Renders a single connection event ("moment") as a beautiful, animated card.
 * Replaces the dull "list of people" view with a timeline of high-fidelity
 * memories that show WHO tapped you, HOW (NFC/QR/view/share), and WHEN.
 *
 * This is the visual differentiator vs. HiHello / Popl / Linq / Mobilo -
 * none of them turn tap events into memorable, animated "moments".
 */

export type TapMomentSource = 'nfc' | 'qr' | 'view' | 'share' | 'link';

export interface TapMoment {
  id: string;
  /** Display name of the person who connected. */
  name: string;
  /** Optional subtitle (e.g. company or "From your team"). */
  subtitle?: string;
  /** Single-letter initial to render in the avatar bubble. */
  initial?: string;
  /** How the connection happened. */
  source: TapMomentSource;
  /** Timestamp the moment happened. */
  occurredAt: Date | number;
  /** Whether follow-up is still pending. */
  needsFollowUp?: boolean;
  /** Optional note from the recipient. */
  note?: string;
}

export interface TapMomentCardProps {
  moment: TapMoment;
  /** Used to stagger entry animation across a list. */
  index?: number;
  /** Delay before entry animation starts. */
  entryDelayMs?: number;
  /** Pre-formatted relative-time label — skips per-render Date math. */
  relativeLabel?: string;
  onPress?: (moment: TapMoment) => void;
  onFollowUp?: (moment: TapMoment) => void;
  style?: StyleProp<ViewStyle>;
}

const SOURCE_LABELS: Record<TapMomentSource, string> = {
  nfc: 'via NFC tap',
  qr: 'via QR scan',
  view: 'viewed your card',
  share: 'shared link',
  link: 'opened your link',
};

const SOURCE_ICONS: Record<TapMomentSource, AppIconName> = {
  nfc: 'Nfc',
  qr: 'QrCode',
  view: 'Eye',
  share: 'Share',
  link: 'Link',
};

/**
 * Single brand-accent gradient — one card look across every source.
 * Source is still surfaced via the small icon pill in the avatar bubble
 * so the timeline stays scannable without visual chaos.
 */
const MOMENT_GRADIENT = ['#0A1A3A', '#1E3FB6', '#5B8BFF'] as const;

function formatRelative(input: Date | number): string {
  const date = typeof input === 'number' ? new Date(input) : input;
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return date.toLocaleDateString();
}

/**
 * Cap entry animation to the first few cards on screen so off-screen
 * items don't pile up shared-value work that the GPU has to drive.
 */
const ANIMATED_ENTRY_MAX_INDEX = 6;

export function TapMomentCard({
  moment,
  index = 0,
  entryDelayMs,
  relativeLabel,
  onPress,
  onFollowUp,
  style,
}: TapMomentCardProps) {
  const source = moment.source;
  const gradient = MOMENT_GRADIENT;
  const entry = useSharedValue(index <= ANIMATED_ENTRY_MAX_INDEX ? 0 : 1);
  const press = useSharedValue(0);
  const glow = useSharedValue(index <= ANIMATED_ENTRY_MAX_INDEX ? 0 : 1);
  // Track first mount so entry animation only plays once per card.
  const hasPlayedEntry = useRef(false);

  const delay = entryDelayMs ?? staggerDelay(index, 55);

  useEffect(() => {
    if (hasPlayedEntry.current) return;
    hasPlayedEntry.current = true;
    if (index > ANIMATED_ENTRY_MAX_INDEX) return; // skip entry anim past first screen
    entry.value = 0;
    glow.value = 0;
    entry.value = withDelay(
      delay,
      withTiming(1, { duration: MotionDuration.slow, easing: Easings.emphasized }),
    );
    glow.value = withDelay(
      delay + 120,
      withTiming(1, { duration: MotionDuration.hero, easing: Easings.standard }),
    );
  }, [delay, entry, glow, index]);

  const cardAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(entry.value, [0, 1], [28, 0]);
    const opacity = interpolate(entry.value, [0, 1], [0, 1]);
    const scale = interpolate(press.value, [0, 1], [1, MotionScale.softPressed]);
    return {
      opacity,
      transform: [{ translateY }, { scale }],
    };
  });

  const sheenAnimatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(glow.value, [0, 1], [-180, 380]);
    return { transform: [{ translateX }] };
  });

  const initial = (moment.initial ?? moment.name?.[0] ?? '?').toUpperCase();
  const displayedRelative = relativeLabel ?? formatRelative(moment.occurredAt);

  function handlePressIn() {
    press.value = withTiming(1, { duration: MotionDuration.fast, easing: Easings.sharp });
  }

  function handlePressOut() {
    press.value = withSpring(0, { damping: 14, stiffness: 220 });
  }

  function handlePress() {
    HapticTap.light();
    onPress?.(moment);
  }

  function handleFollowUp() {
    HapticTap.success();
    onFollowUp?.(moment);
  }

  return (
    <Animated.View style={[cardAnimatedStyle, style]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={`${moment.name} ${SOURCE_LABELS[source]} ${displayedRelative}`}
        style={styles.pressable}
      >
        <View style={styles.gradientWrap}>
          <LinearGradient
            colors={gradient as unknown as readonly [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Moving sheen overlay - the holographic highlight that sells the moment. */}
          <Animated.View style={[styles.sheen, sheenAnimatedStyle]} pointerEvents="none">
            <LinearGradient
              colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.42)', 'rgba(255,255,255,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          <View style={styles.row}>
            <View style={styles.avatar}>
              <AppText style={styles.avatarText}>{initial}</AppText>
              <View style={styles.sourceBadge}>
                <AppIcon name={SOURCE_ICONS[source]} size={11} color="#0A0C12" />
              </View>
            </View>

            <View style={styles.copy}>
              <AppText style={styles.name} numberOfLines={1}>
                {moment.name || 'Anonymous'}
              </AppText>
              <View style={styles.metaRow}>
                <AppText style={styles.source} numberOfLines={1}>
                  {SOURCE_LABELS[source]}
                </AppText>
                <View style={styles.dot} />
                <AppText style={styles.time}>{displayedRelative}</AppText>
              </View>
              {moment.subtitle ? (
                <AppText style={styles.subtitle} numberOfLines={1}>
                  {moment.subtitle}
                </AppText>
              ) : null}
            </View>
          </View>

          {moment.note ? (
            <View style={styles.noteWrap}>
              <AppText style={styles.note} numberOfLines={2}>
                {`\u201C${moment.note}\u201D`}
              </AppText>
            </View>
          ) : null}

          <View style={styles.footer}>
            <View style={styles.pill}>
              <View style={styles.pillDot} />
              <AppText style={styles.pillText}>
                {source === 'nfc' ? 'In person' : source === 'qr' ? 'Camera scan' : source === 'view' ? 'Card opened' : source === 'share' ? 'Link sent' : 'Web tap'}
              </AppText>
            </View>
            {moment.needsFollowUp ? (
              <Pressable
                onPress={handleFollowUp}
                accessibilityRole="button"
                accessibilityLabel={`Follow up with ${moment.name}`}
                style={({ pressed }) => [styles.followUp, pressed && styles.followUpPressed]}
              >
                <AppText style={styles.followUpText}>Follow up</AppText>
                <AppIcon name="ChevronRight" size={13} color="#0A0C12" />
              </Pressable>
            ) : (
              <View style={styles.followUpDone}>
                <AppIcon name="CircleCheck" size={14} color="rgba(255,255,255,0.92)" />
                <AppText style={styles.followUpDoneText}>Connected</AppText>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: 22,
  },
  gradientWrap: {
    borderRadius: 22,
    padding: 18,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
    minHeight: 152,
  },
  sheen: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 180,
    opacity: 0.7,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0,
  },
  sourceBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.12)',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  source: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 13,
    fontWeight: '700',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  time: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '700',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  noteWrap: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.18)',
  },
  note: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  footer: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  pillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  followUp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  followUpPressed: {
    opacity: 0.78,
    transform: [{ scale: MotionScale.pressed }],
  },
  followUpText: {
    color: '#0A0C12',
    fontSize: 12,
    fontWeight: '900',
  },
  followUpDone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  followUpDoneText: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 12,
    fontWeight: '800',
  },
});

// Memoized export so list re-renders don't repaint every card.
export const TapMomentCardMemo = memo(TapMomentCard);
export { TapMomentCard as TapMomentCardUnmemoized };
