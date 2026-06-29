import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import { createShadow } from '@/src/utils/shadows';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import type { TapMoment, TapMomentSource } from '@/src/components/TapMomentCard';
import { HapticTap, HapticPattern } from '@/src/utils/haptics';
import { Easings } from '@/src/utils/motion';

export interface MomentDetailSheetProps {
  visible: boolean;
  moment: TapMoment | null;
  /** Pre-resolved slug URL (e.g. https://sitehub.app/sok-dara). Null = no URL yet. */
  slugUrl: string | null;
  onClose: () => void;
  onFollowUp?: (moment: TapMoment) => void;
}

const SOURCE_GRADIENTS: Record<TapMomentSource, readonly [string, string, string]> = {
  nfc: ['#0B1F4E', '#1E3FB6', '#5B8BFF'] as const,
  qr: ['#0B3B2D', '#10B981', '#34D399'] as const,
  view: ['#3F1D0B', '#F97316', '#FBBF24'] as const,
  share: ['#2D1B4E', '#7C3AED', '#A78BFA'] as const,
  link: ['#1B2A4E', '#0EA5E9', '#38BDF8'] as const,
};

const SOURCE_LABELS: Record<TapMomentSource, string> = {
  nfc: 'NFC tap',
  qr: 'QR scan',
  view: 'Profile view',
  share: 'Shared link',
  link: 'Link open',
};

const SOURCE_ICONS: Record<TapMomentSource, AppIconName> = {
  nfc: 'Nfc',
  qr: 'QrCode',
  view: 'Eye',
  share: 'Share',
  link: 'Link',
};

/**
 * MomentDetailSheet - the "what happens when you tap a moment" view.
 *
 * Shows the person, their public slug URL (so the customer can verify
 * who they connected with), and the actions that follow:
 *   - Open profile in mobile browser (Linking.openURL)
 *   - Share the URL to another app (RN Share)
 *   - Copy URL to clipboard (best-effort)
 *   - Mark as followed up
 *
 * Slides up from the bottom with a spring for a native sheet feel.
 */
export function MomentDetailSheet({
  visible,
  moment,
  slugUrl,
  onClose,
  onFollowUp,
}: MomentDetailSheetProps) {
  const enter = useSharedValue(0);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    if (visible) {
      enter.value = 0;
      enter.value = withSpring(1, { damping: 22, stiffness: 240 });
    } else {
      enter.value = withTiming(0, { duration: 180, easing: Easings.accelerate });
    }
  }, [enter, visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(enter.value, [0, 1], [600, 0]) }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: enter.value * 0.55,
  }));

  const source = moment?.source ?? 'nfc';
  const gradient = SOURCE_GRADIENTS[source];
  const occurredLabel = useMemo(() => {
    if (!moment) return '';
    const d = moment.occurredAt instanceof Date ? moment.occurredAt : new Date(moment.occurredAt);
    return d.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }, [moment]);

  async function handleOpenUrl() {
    if (!slugUrl) return;
    setOpening(true);
    HapticTap.medium();
    try {
      const supported = await Linking.canOpenURL(slugUrl);
      if (supported) {
        await Linking.openURL(slugUrl);
      } else {
        await Share.share({ message: slugUrl, url: slugUrl });
      }
    } catch {
      // Fall back to share - better than nothing.
      await Share.share({ message: slugUrl, url: slugUrl }).catch(() => undefined);
    } finally {
      setOpening(false);
    }
  }

  async function handleShareUrl() {
    if (!slugUrl) return;
    HapticTap.light();
    await Share.share({ message: slugUrl, url: slugUrl });
  }

  function handleFollowUp() {
    if (!moment) return;
    HapticPattern.followUpDone();
    onFollowUp?.(moment);
    onClose();
  }

  if (!moment) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close moment details" />
        </Animated.View>

        <Animated.View style={[styles.sheet, sheetStyle]}>
          <View style={styles.handle} />

          {/* Hero strip with gradient that matches the source color */}
          <View style={styles.heroWrap}>
            <LinearGradient
              colors={gradient as unknown as readonly [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroRow}>
              <View style={styles.heroAvatar}>
                <AppText style={styles.heroAvatarText}>{(moment.initial ?? moment.name[0] ?? '?').toUpperCase()}</AppText>
                <View style={styles.heroSourceBadge}>
                  <AppIcon name={SOURCE_ICONS[source]} size={12} color="#0A0C12" />
                </View>
              </View>
              <View style={styles.heroCopy}>
                <AppText style={styles.heroName} numberOfLines={1}>{moment.name}</AppText>
                {moment.subtitle ? (
                  <AppText style={styles.heroSubtitle} numberOfLines={1}>{moment.subtitle}</AppText>
                ) : null}
                <View style={styles.heroMetaRow}>
                  <View style={styles.heroPill}>
                    <View style={styles.heroPillDot} />
                    <AppText style={styles.heroPillText}>{SOURCE_LABELS[source]}</AppText>
                  </View>
                  <AppText style={styles.heroWhen}>{occurredLabel}</AppText>
                </View>
              </View>
            </View>
            {moment.note ? (
              <View style={styles.heroNote}>
                <AppText style={styles.heroNoteText} numberOfLines={3}>{`\u201C${moment.note}\u201D`}</AppText>
              </View>
            ) : null}
          </View>

          {/* Slug URL block */}
          <View style={styles.slugBlock}>
            <View style={styles.slugLabelRow}>
              <AppIcon name="Link" size={14} color="#007AFF" />
              <AppText style={styles.slugLabel}>Public profile URL</AppText>
            </View>
            {slugUrl ? (
              <Pressable
                onPress={handleOpenUrl}
                accessibilityRole="link"
                accessibilityLabel={`Open ${slugUrl} in browser`}
                style={({ pressed }) => [styles.slugRow, pressed && styles.slugRowPressed]}
              >
                <AppText style={styles.slugText} numberOfLines={1} ellipsizeMode="middle">
                  {slugUrl}
                </AppText>
                {opening ? (
                  <ActivityIndicator color="#007AFF" />
                ) : (
                  <View style={styles.slugOpenChip}>
                    <AppIcon name="ExternalLink" size={12} color="#FFFFFF" />
                    <AppText style={styles.slugOpenText}>Open</AppText>
                  </View>
                )}
              </Pressable>
            ) : (
              <View style={styles.slugEmpty}>
                <AppIcon name="Link" size={14} color="rgba(0,0,0,0.32)" />
                <AppText style={styles.slugEmptyText}>
                  No public slug yet for this contact.
                </AppText>
              </View>
            )}
          </View>

          {/* Action grid */}
          <View style={styles.actionsGrid}>
            <ActionButton
              icon="ExternalLink"
              label={opening ? 'Opening…' : 'Open profile'}
              disabled={!slugUrl || opening}
              primary
              onPress={handleOpenUrl}
            />
            <ActionButton
              icon="Share"
              label="Share URL"
              disabled={!slugUrl}
              onPress={handleShareUrl}
            />
          </View>

          {moment.needsFollowUp ? (
            <Pressable
              onPress={handleFollowUp}
              accessibilityRole="button"
              accessibilityLabel="Mark as followed up"
              style={({ pressed }) => [styles.followUpButton, pressed && styles.followUpPressed]}
            >
              <AppIcon name="CircleCheck" size={18} color="#FFFFFF" />
              <AppText style={styles.followUpText}>Mark as followed up</AppText>
            </Pressable>
          ) : null}

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
          >
            <AppText style={styles.closeText}>Close</AppText>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

interface ActionButtonProps {
  icon: AppIconName;
  label: string;
  primary?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

function ActionButton({ icon, label, primary = false, disabled = false, onPress }: ActionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.actionButton,
        primary ? styles.actionPrimary : styles.actionSecondary,
        pressed && !disabled && styles.actionPressed,
        disabled && styles.actionDisabled,
      ]}
    >
      <AppIcon name={icon} size={16} color={primary ? '#FFFFFF' : '#007AFF'} />
      <AppText style={[styles.actionLabel, primary ? styles.actionLabelPrimary : styles.actionLabelSecondary]}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: '#000000',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 36,
    gap: 18,
    ...createShadow({ color: '#000000', offset: { width: 0, height: -8 }, opacity: 0.18, radius: 28, elevation: 18 }),
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.18)',
    marginBottom: 4,
  },
  heroWrap: {
    borderRadius: 22,
    overflow: 'hidden',
    padding: 18,
    minHeight: 130,
    justifyContent: 'space-between',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },
  heroSourceBadge: {
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
  heroCopy: { flex: 1, minWidth: 0, gap: 4 },
  heroName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: 13,
    fontWeight: '700',
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  heroPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  heroPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  heroWhen: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    fontWeight: '700',
  },
  heroNote: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  heroNoteText: {
    color: 'rgba(255,255,255,0.94)',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
    fontStyle: 'italic',
  },
  slugBlock: {
    gap: 8,
  },
  slugLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  slugLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#007AFF',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  slugRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(0,122,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,122,255,0.18)',
  },
  slugRowPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  slugText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0A0C12',
    letterSpacing: -0.1,
  },
  slugOpenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#007AFF',
  },
  slugOpenText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  slugEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  slugEmptyText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.42)',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 46,
    borderRadius: 14,
  },
  actionPrimary: {
    backgroundColor: '#0A0C12',
  },
  actionSecondary: {
    backgroundColor: 'rgba(0,122,255,0.12)',
  },
  actionPressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
  actionDisabled: { opacity: 0.4 },
  actionLabel: { fontSize: 14, fontWeight: '900' },
  actionLabelPrimary: { color: '#FFFFFF' },
  actionLabelSecondary: { color: '#007AFF' },
  followUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: '#34C759',
  },
  followUpPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  followUpText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  closeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  closeText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.42)',
  },
  pressed: { opacity: 0.7 },
});
