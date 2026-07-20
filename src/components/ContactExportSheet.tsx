/**
 * ContactExportSheet — Phase 2 "One-Tap Contact Export"
 *
 * Bottom sheet with three export actions:
 *   1. Save to Contacts  (vCard via OS share sheet)
 *   2. WhatsApp          (deep-link with pre-filled message)
 *   3. Share via…        (generic RN Share)
 *
 * Phone number is optional — if missing WhatsApp is disabled with a tooltip.
 */

import { useState } from 'react';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import {
  exportToContacts,
  openWhatsApp,
  shareContactText,
  type ExportContact,
} from '@/src/services/connectionsIntelligenceService';
import { HapticTap, HapticPattern } from '@/src/utils/haptics';
import { Easings } from '@/src/utils/motion';

interface ContactExportSheetProps {
  visible: boolean;
  contact: ExportContact;
  profileUrl?: string;
  onClose: () => void;
}

type ExportResult = 'idle' | 'loading' | 'ok' | 'error';

interface ExportAction {
  id: string;
  icon: AppIconName;
  label: string;
  desc: string;
  color: string;
  bg: string;
  disabled?: boolean;
  disabledReason?: string;
}

export function ContactExportSheet({
  visible,
  contact,
  profileUrl,
  onClose,
}: ContactExportSheetProps) {
  const enter = useSharedValue(0);
  const [states, setStates] = useState<Record<string, ExportResult>>({});

  useEffect(() => {
    if (visible) {
      enter.value = 0;
      enter.value = withSpring(1, { damping: 22, stiffness: 240 });
      setStates({});
    } else {
      enter.value = withTiming(0, { duration: 200, easing: Easings.accelerate });
    }
  }, [enter, visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(enter.value, [0, 1], [500, 0]) }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: enter.value * 0.5,
  }));

  const hasPhone = Boolean(contact.phone?.trim());

  const actions: ExportAction[] = [
    {
      id: 'contacts',
      icon: 'Users',
      label: 'Save to Contacts',
      desc: 'Export as vCard to your phone contacts',
      color: '#FFFFFF',
      bg: '#007AFF',
    },
    {
      id: 'whatsapp',
      icon: 'Share2',
      label: 'WhatsApp',
      desc: hasPhone
        ? `Send a message to ${contact.phone}`
        : 'No phone number — add it first',
      color: hasPhone ? '#FFFFFF' : 'rgba(255,255,255,0.42)',
      bg: hasPhone ? '#25D366' : '#3D3D3F',
      disabled: !hasPhone,
      disabledReason: 'No phone number saved for this contact',
    },
    {
      id: 'share',
      icon: 'Share2',
      label: 'Share via…',
      desc: 'Send name, role & profile link anywhere',
      color: '#007AFF',
      bg: 'rgba(0,122,255,0.1)',
    },
  ];

  async function handleAction(actionId: string) {
    if (states[actionId] === 'loading') return;
    HapticTap.medium();
    setStates((s) => ({ ...s, [actionId]: 'loading' }));

    try {
      if (actionId === 'contacts') {
        await exportToContacts(contact);
        HapticPattern.followUpDone();
        setStates((s) => ({ ...s, [actionId]: 'ok' }));
      } else if (actionId === 'whatsapp') {
        const result = await openWhatsApp(
          contact.phone!,
          `Hi ${contact.name}! It was great connecting with you. Looking forward to staying in touch! 🙌`,
        );
        setStates((s) => ({ ...s, [actionId]: result === 'opened' ? 'ok' : 'error' }));
      } else if (actionId === 'share') {
        await shareContactText(contact, profileUrl);
        setStates((s) => ({ ...s, [actionId]: 'ok' }));
      }
    } catch {
      setStates((s) => ({ ...s, [actionId]: 'error' }));
    }
  }

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[styles.sheet, sheetStyle]}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.avatarCircle}>
              <AppText style={styles.avatarInitial}>
                {(contact.name[0] ?? '?').toUpperCase()}
              </AppText>
            </View>
            <View style={styles.headerCopy}>
              <AppText style={styles.headerName} numberOfLines={1}>{contact.name}</AppText>
              {(contact.title || contact.company) && (
                <AppText style={styles.headerSub} numberOfLines={1}>
                  {[contact.title, contact.company].filter(Boolean).join(' · ')}
                </AppText>
              )}
            </View>
          </View>

          {/* Action rows */}
          {actions.map((action) => {
            const state = states[action.id] ?? 'idle';
            const isLoading = state === 'loading';
            const isDone = state === 'ok';
            const isErr = state === 'error';

            return (
              <Pressable
                key={action.id}
                disabled={action.disabled || isLoading}
                onPress={() => void handleAction(action.id)}
                accessibilityRole="button"
                accessibilityLabel={action.label}
                style={({ pressed }) => [
                  styles.actionRow,
                  { backgroundColor: action.bg },
                  (action.disabled) && styles.actionRowDisabled,
                  pressed && !action.disabled && styles.actionRowPressed,
                ]}
              >
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                  {isLoading ? (
                    <ActivityIndicator color={action.color} size="small" />
                  ) : isDone ? (
                    <AppIcon name="BadgeCheck" size={20} color={action.color} />
                  ) : isErr ? (
                    <AppIcon name="AlertCircle" size={20} color={action.color} />
                  ) : (
                    <AppIcon name={action.icon} size={20} color={action.color} />
                  )}
                </View>
                <View style={styles.actionCopy}>
                  <AppText style={[styles.actionLabel, { color: action.color }]}>
                    {isDone ? `${action.label} ✓` : isErr ? 'Try again' : action.label}
                  </AppText>
                  <AppText style={[styles.actionDesc, { color: action.color, opacity: 0.72 }]} numberOfLines={1}>
                    {isErr ? 'Something went wrong. Tap to retry.' : action.desc}
                  </AppText>
                </View>
                {!action.disabled && !isLoading && (
                  <AppIcon name="ChevronRight" size={18} color={action.color} />
                )}
              </Pressable>
            );
          })}

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <AppText style={styles.closeBtnText}>Close</AppText>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: '#000000' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
    gap: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.14)',
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingBottom: 6,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0A0C12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  headerCopy: { flex: 1, gap: 2 },
  headerName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0A0C12',
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.42)',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 18,
  },
  actionRowPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  actionRowDisabled: {
    opacity: 0.52,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCopy: { flex: 1, gap: 2 },
  actionLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  actionDesc: {
    fontSize: 12,
    fontWeight: '500',
  },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  closeBtnPressed: { opacity: 0.6 },
  closeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.42)',
  },
});
