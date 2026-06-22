import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { HapticTap } from '@/src/utils/haptics';
import type { TapMoment, TapMomentSource } from '@/src/components/TapMomentCard';

/**
 * ChatBubble - Messenger-style row inside the Network chat card.
 *
 * Inbound moments (someone tapped your card) render as left-aligned
 * neutral bubbles with the sender's initial avatar on the outer edge.
 * Outbound moments (you shared your card) render as right-aligned
 * brand-tinted bubbles with your initial on the right.
 *
 * Lightweight by design - no gradients, no per-row animations, no
 * heavy card chrome. The card container handles the elevated surface
 * and the bubbles stay calm so the timeline scrolls smoothly.
 */

const BRAND = '#007AFF';
const INK = '#0A0A0F';
const INK2 = '#1C1C1E';
const MUTED = '#6E6E73';

const SOURCE_PHRASE: Record<TapMomentSource, string> = {
  nfc: 'tapped your card',
  qr: 'scanned your QR',
  view: 'viewed your profile',
  share: 'shared your link',
  link: 'opened your link',
};

const SOURCE_LABEL: Record<TapMomentSource, string> = {
  nfc: 'NFC',
  qr: 'QR',
  view: 'View',
  share: 'Share',
  link: 'Link',
};

function formatTime(input: Date | number | string): string {
  const ms = input instanceof Date
    ? input.getTime()
    : typeof input === 'number'
      ? input
      : new Date(input).getTime();
  const d = new Date(ms);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export interface ChatBubbleProps {
  moment: TapMoment;
  outbound: boolean;
  relativeLabel?: string;
  onPress?: (moment: TapMoment) => void;
  onFollowUp?: (moment: TapMoment) => void;
  /** True for the last bubble in a day group - tightens the bottom padding. */
  isLastInGroup?: boolean;
}

function ChatBubbleImpl({
  moment,
  outbound,
  relativeLabel,
  onPress,
  onFollowUp,
  isLastInGroup,
}: ChatBubbleProps) {
  const initial = useMemo(
    () => (moment.initial ?? moment.name?.[0] ?? '?').toUpperCase(),
    [moment.initial, moment.name],
  );

  function handlePress() {
    HapticTap.selection();
    onPress?.(moment);
  }

  function handleFollowUp() {
    HapticTap.success();
    onFollowUp?.(moment);
  }

  const timeLabel = relativeLabel ?? formatTime(moment.occurredAt);

  return (
    <View style={[cb.row, isLastInGroup && cb.rowLast, outbound ? cb.rowOutbound : cb.rowInbound]}>
      {!outbound ? (
        <View style={cb.avatar}>
          <AppText style={cb.avatarText}>{initial}</AppText>
        </View>
      ) : null}

      <View style={[cb.copy, outbound && cb.copyOutbound]}>
        <Pressable
          onPress={handlePress}
          style={({ pressed }) => [
            cb.bubble,
            outbound
              ? [cb.bubbleOutbound, { backgroundColor: BRAND }, pressed && cb.pressed]
              : [cb.bubbleInbound, { backgroundColor: 'rgba(0,0,0,0.05)' }, pressed && cb.pressed],
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${moment.name} - ${SOURCE_PHRASE[moment.source]}`}
        >
          <AppText
            style={[
              cb.name,
              outbound ? { color: '#FFFFFF' } : { color: INK },
            ]}
            numberOfLines={1}
          >
            {moment.name}
          </AppText>
          {moment.subtitle ? (
            <AppText
              style={[
                cb.role,
                outbound ? { color: 'rgba(255,255,255,0.78)' } : { color: MUTED },
              ]}
              numberOfLines={1}
            >
              {moment.subtitle}
            </AppText>
          ) : null}
          <View style={cb.eventRow}>
            <View style={[cb.sourcePill, outbound ? cb.sourcePillOutbound : cb.sourcePillInbound]}>
              <AppText
                style={[
                  cb.sourcePillText,
                  outbound ? cb.sourcePillTextOutbound : cb.sourcePillTextInbound,
                ]}
              >
                {SOURCE_LABEL[moment.source]}
              </AppText>
            </View>
            <AppText
              style={[
                cb.phrase,
                outbound ? { color: 'rgba(255,255,255,0.92)' } : { color: INK2 },
              ]}
              numberOfLines={2}
            >
              {SOURCE_PHRASE[moment.source]}
            </AppText>
          </View>
          {moment.note ? (
            <View style={[cb.note, outbound ? cb.noteOutbound : cb.noteInbound]}>
              <AppText
                style={[
                  cb.noteText,
                  outbound ? { color: 'rgba(255,255,255,0.92)' } : { color: INK2 },
                ]}
                numberOfLines={3}
              >
                {moment.note}
              </AppText>
            </View>
          ) : null}
        </Pressable>

        <View style={[cb.metaRow, outbound && cb.metaRowOutbound]}>
          <AppText style={[cb.time, { color: MUTED }]}>{timeLabel}</AppText>
          {moment.needsFollowUp ? (
            <Pressable onPress={handleFollowUp} hitSlop={6}>
              <AppText style={[cb.followUp, { color: BRAND }]}>Follow up</AppText>
            </Pressable>
          ) : null}
        </View>
      </View>

      {outbound ? (
        <View style={[cb.avatar, cb.avatarOutbound]}>
          <AppText style={cb.avatarText}>You</AppText>
        </View>
      ) : null}
    </View>
  );
}

export const ChatBubbleMemo = memo(ChatBubbleImpl);

/** Default export so JSX <ChatBubble /> keeps working without .Memo suffix. */
export const ChatBubble = ChatBubbleMemo;

const cb = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  rowLast: { paddingBottom: 8 },
  rowInbound: { justifyContent: 'flex-start' },
  rowOutbound: { justifyContent: 'flex-end' },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,122,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginBottom: 22,
  },
  avatarOutbound: {
    backgroundColor: INK,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '800',
    color: BRAND,
    letterSpacing: -0.1,
  },
  copy: {
    maxWidth: '78%',
    gap: 4,
    flexShrink: 1,
  },
  copyOutbound: { alignItems: 'flex-end' },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 4,
    minWidth: 64,
  },
  bubbleInbound: {
    borderTopLeftRadius: 6,
  },
  bubbleOutbound: {
    borderTopRightRadius: 6,
  },
  pressed: { opacity: 0.85 },
  name: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  role: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: -0.05,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  sourcePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  sourcePillInbound: {
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  sourcePillOutbound: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  sourcePillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  sourcePillTextInbound: { color: INK2 },
  sourcePillTextOutbound: { color: '#FFFFFF' },
  phrase: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    flexShrink: 1,
  },
  note: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  noteInbound: { borderTopColor: 'rgba(0,0,0,0.08)' },
  noteOutbound: { borderTopColor: 'rgba(255,255,255,0.22)' },
  noteText: {
    fontSize: 11,
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 15,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  metaRowOutbound: { justifyContent: 'flex-end' },
  time: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  followUp: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
