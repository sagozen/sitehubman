/**
 * AiFollowUpModal.tsx
 *
 * AI 1-Tap Follow-Up Writer Modal.
 * Displays tailored AI drafts with 1-tap dispatch to WhatsApp, Telegram, or Email.
 */
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { IosScrollView } from '@/src/components/IosScrollView';
import {
  generateAiFollowUps,
  openEmailFollowUp,
  openTelegramFollowUp,
  openWhatsAppFollowUp,
  type FollowUpTone,
} from '@/src/services/aiFollowUpService';
import { HapticTap } from '@/src/utils/haptics';

interface AiFollowUpModalProps {
  visible: boolean;
  onClose: () => void;
  recipientName: string;
  senderName?: string;
  email?: string;
  phone?: string;
  telegram?: string;
  company?: string;
  note?: string;
}

export function AiFollowUpModal({
  visible,
  onClose,
  recipientName,
  senderName = 'Alexander Wright',
  email,
  phone,
  telegram,
  company,
  note,
}: AiFollowUpModalProps) {
  const [selectedTone, setSelectedTone] = useState<FollowUpTone>('coffee');
  const [customText, setCustomText] = useState<string>('');

  const followUpOptions = useMemo(() => {
    return generateAiFollowUps({
      recipientName,
      senderName,
      company,
      note,
    });
  }, [recipientName, senderName, company, note]);

  const activeOption = useMemo(() => {
    return followUpOptions.find((o) => o.tone === selectedTone) || followUpOptions[0];
  }, [followUpOptions, selectedTone]);

  const currentMessage = customText || activeOption.message;

  const handleSendWhatsApp = () => {
    HapticTap.medium();
    if (phone) {
      void openWhatsAppFollowUp(phone, currentMessage);
    } else {
      void Share.share({ message: currentMessage });
    }
  };

  const handleSendEmail = () => {
    HapticTap.medium();
    if (email) {
      void openEmailFollowUp(email, activeOption.subject, currentMessage);
    } else {
      void Share.share({ message: currentMessage, title: activeOption.subject });
    }
  };

  const handleSendTelegram = () => {
    HapticTap.medium();
    if (telegram) {
      void openTelegramFollowUp(telegram, currentMessage);
    } else {
      void Share.share({ message: currentMessage });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconBox}>
              <AppIcon name="Sparkles" size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <AppText style={styles.title} weight="extrabold">
                AI 1-Tap Follow-Up
              </AppText>
              <AppText style={styles.subtitle}>
                Personalized icebreaker for {recipientName}
              </AppText>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
              <AppIcon name="X" size={18} color="rgba(255,255,255,0.6)" />
            </Pressable>
          </View>

          {/* Tone Selector Pills */}
          <View style={styles.toneSelector}>
            {followUpOptions.map((opt) => (
              <Pressable
                key={opt.tone}
                onPress={() => {
                  HapticTap.light();
                  setSelectedTone(opt.tone);
                  setCustomText('');
                }}
                style={[
                  styles.tonePill,
                  selectedTone === opt.tone && styles.tonePillActive,
                ]}
              >
                <AppText style={styles.toneEmoji}>{opt.emoji}</AppText>
                <AppText
                  style={[
                    styles.toneText,
                    selectedTone === opt.tone && styles.toneTextActive,
                  ]}
                  weight="bold"
                >
                  {opt.title}
                </AppText>
              </Pressable>
            ))}
          </View>

          {/* Editable Draft Message Box */}
          <View style={styles.messageContainer}>
            <TextInput
              style={styles.messageInput}
              value={currentMessage}
              onChangeText={setCustomText}
              multiline
              textAlignVertical="top"
              placeholderTextColor="rgba(255,255,255,0.3)"
            />
          </View>

          {/* 1-Tap Action Dispatch Buttons */}
          <View style={styles.actionGrid}>
            <Pressable
              onPress={handleSendWhatsApp}
              style={({ pressed }) => [styles.channelBtn, styles.channelBtnWhatsApp, pressed && styles.pressed]}
            >
              <AppIcon name="Phone" size={17} color="#FFFFFF" />
              <AppText style={styles.channelBtnText} weight="extrabold">
                WhatsApp
              </AppText>
            </Pressable>

            <Pressable
              onPress={handleSendEmail}
              style={({ pressed }) => [styles.channelBtn, styles.channelBtnMail, pressed && styles.pressed]}
            >
              <AppIcon name="Mail" size={17} color="#000000" />
              <AppText style={[styles.channelBtnText, { color: '#000000' }]} weight="extrabold">
                Email
              </AppText>
            </Pressable>

            <Pressable
              onPress={handleSendTelegram}
              style={({ pressed }) => [styles.channelBtn, styles.channelBtnTelegram, pressed && styles.pressed]}
            >
              <AppIcon name="Send" size={17} color="#FFFFFF" />
              <AppText style={styles.channelBtnText} weight="extrabold">
                Telegram
              </AppText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#111114',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
    paddingBottom: 40,
    gap: 16,
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#18181C',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 17,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#18181C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toneSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  tonePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#16161A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tonePillActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  toneEmoji: {
    fontSize: 14,
  },
  toneText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
  },
  toneTextActive: {
    color: '#000000',
  },
  messageContainer: {
    borderRadius: 16,
    backgroundColor: '#16161A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 14,
    minHeight: 120,
  },
  messageInput: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  channelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#18181C',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  channelBtnWhatsApp: {
    backgroundColor: '#1E3A2F',
    borderColor: '#30D158',
  },
  channelBtnMail: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  channelBtnTelegram: {
    backgroundColor: '#1B2E4B',
    borderColor: '#0A84FF',
  },
  channelBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  pressed: {
    opacity: 0.8,
  },
});
