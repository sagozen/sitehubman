/**
 * LeadDetailScreen — 20 Lead Details & iOS Export (Apple Wallet × Stripe × Linear)
 *
 * Implements:
 * 20 — Lead Details & iOS Contacts Export
 * - Call, Message, Email instant actions
 * - Add to iPhone Contacts (.vcf native share)
 * - Timeline info & meeting notes
 */
import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Linking,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { IosScrollView } from '@/src/components/IosScrollView';
import { HapticTap } from '@/src/utils/haptics';

const C = {
  canvas: '#000000',
  surface: '#111114',
  surfaceRaised: '#18181C',
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.15)',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  textMuted: '#636366',
  accent: '#2596BE',
  accentSubtle: 'rgba(37, 150, 190, 0.15)',
  success: '#34C759',
} as const;

export default function LeadDetailScreen() {
  const params = useLocalSearchParams();
  const leadId = (params.leadId as string) || 'lead-1';

  // Demo contact detail
  const [lead, setLead] = useState({
    id: leadId,
    name: 'Sarah Chen',
    title: 'VP of Technology · Apex Ventures',
    phone: '+1 (555) 234-5678',
    email: 'sarah.chen@apexventures.io',
    intent: 'Services',
    capturedAt: 'Today at 09:42 AM',
    location: 'Metfone Innovation Center, Phnom Penh',
    cardTapped: 'Metal NFC Matte Black #1',
    note: 'Enterprise NFC rollout for 45 partner executives. Follow up next Tuesday with custom branding samples.',
    followedUp: false,
  });

  const handleCall = useCallback(() => {
    HapticTap.light();
    Linking.openURL(`tel:${lead.phone.replace(/[^0-9+]/g, '')}`).catch(() => {
      Alert.alert('Unable to place call');
    });
  }, [lead.phone]);

  const handleMessage = useCallback(() => {
    HapticTap.light();
    Linking.openURL(`sms:${lead.phone.replace(/[^0-9+]/g, '')}`).catch(() => {
      Alert.alert('Unable to open messages');
    });
  }, [lead.phone]);

  const handleEmail = useCallback(() => {
    HapticTap.light();
    Linking.openURL(`mailto:${lead.email}`).catch(() => {
      Alert.alert('Unable to open mail');
    });
  }, [lead.email]);

  const handleExportToIosContacts = useCallback(async () => {
    HapticTap.confidentClick();
    const vCard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${lead.name}`,
      `TITLE:${lead.title}`,
      `TEL;TYPE=CELL:${lead.phone}`,
      `EMAIL:${lead.email}`,
      `NOTE:${lead.note}`,
      'END:VCARD',
    ].join('\r\n');

    try {
      await Share.share({
        title: `${lead.name}.vcf`,
        message: vCard,
      });
    } catch {
      // dismissed
    }
  }, [lead]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            HapticTap.light();
            router.back();
          }}
          hitSlop={12}
          style={styles.backBtn}
        >
          <AppIcon name="ChevronLeft" size={24} color={C.text} />
        </Pressable>
        <AppText style={styles.headerTitle} weight="bold">
          Contact Details
        </AppText>
        <View style={{ width: 24 }} />
      </View>

      <IosScrollView contentContainerStyle={styles.scroll}>
        {/* Profile Card Hero */}
        <View style={styles.profileHero}>
          <View style={styles.avatarLarge}>
            <AppText style={styles.avatarInitial} weight="bold">
              {lead.name.substring(0, 2).toUpperCase()}
            </AppText>
          </View>
          <AppText style={styles.personName} weight="bold">
            {lead.name}
          </AppText>
          <AppText style={styles.personTitle}>{lead.title}</AppText>

          <View style={styles.intentBadge}>
            <AppText style={styles.intentText} weight="bold">
              INTEREST: {lead.intent.toUpperCase()}
            </AppText>
          </View>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <Pressable style={styles.actionCircle} onPress={handleCall}>
              <AppIcon name="phone" size={20} color={C.text} />
              <AppText style={styles.actionLabel}>Call</AppText>
            </Pressable>
            <Pressable style={styles.actionCircle} onPress={handleMessage}>
              <AppIcon name="message-square" size={20} color={C.text} />
              <AppText style={styles.actionLabel}>Message</AppText>
            </Pressable>
            <Pressable style={styles.actionCircle} onPress={handleEmail}>
              <AppIcon name="mail" size={20} color={C.text} />
              <AppText style={styles.actionLabel}>Email</AppText>
            </Pressable>
          </View>
        </View>

        {/* Primary Action Button: Add to iPhone Contacts */}
        <Pressable
          style={({ pressed }) => [
            styles.saveContactBtn,
            pressed && styles.saveContactBtnPressed,
          ]}
          onPress={handleExportToIosContacts}
        >
          <AppIcon name="user-plus" size={18} color="#FFFFFF" />
          <AppText style={styles.saveContactText} weight="bold">
            Add to iPhone Contacts
          </AppText>
        </Pressable>

        {/* Contact Info Section */}
        <View style={styles.sectionCard}>
          <AppText style={styles.sectionTitle} weight="bold">
            Contact Information
          </AppText>

          <View style={styles.infoRow}>
            <AppText style={styles.infoLabel}>Phone</AppText>
            <AppText style={styles.infoValue}>{lead.phone}</AppText>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <AppText style={styles.infoLabel}>Email</AppText>
            <AppText style={styles.infoValue}>{lead.email}</AppText>
          </View>
        </View>

        {/* Exchange Context */}
        <View style={styles.sectionCard}>
          <AppText style={styles.sectionTitle} weight="bold">
            Tap Context
          </AppText>

          <View style={styles.infoRow}>
            <AppText style={styles.infoLabel}>Captured</AppText>
            <AppText style={styles.infoValue}>{lead.capturedAt}</AppText>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <AppText style={styles.infoLabel}>Location</AppText>
            <AppText style={styles.infoValue}>{lead.location}</AppText>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <AppText style={styles.infoLabel}>Device Used</AppText>
            <AppText style={styles.infoValue}>{lead.cardTapped}</AppText>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.sectionCard}>
          <AppText style={styles.sectionTitle} weight="bold">
            Meeting Notes
          </AppText>
          <View style={styles.notesBox}>
            <AppText style={styles.notesText}>{lead.note}</AppText>
          </View>
        </View>
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    color: C.text,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  profileHero: {
    backgroundColor: C.surface,
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  avatarLarge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: C.surfaceRaised,
    borderWidth: 1.5,
    borderColor: C.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarInitial: {
    fontSize: 24,
    color: C.text,
  },
  personName: {
    fontSize: 22,
    color: C.text,
    letterSpacing: -0.4,
  },
  personTitle: {
    fontSize: 13,
    color: C.textSecondary,
    marginTop: 4,
  },
  intentBadge: {
    marginTop: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: C.accentSubtle,
  },
  intentText: {
    fontSize: 11,
    color: C.accent,
    letterSpacing: 0.5,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 22,
  },
  actionCircle: {
    alignItems: 'center',
    gap: 6,
  },
  actionLabel: {
    fontSize: 11,
    color: C.textSecondary,
  },
  saveContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: C.accent,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  saveContactBtnPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  saveContactText: {
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
  },
  sectionTitle: {
    fontSize: 14,
    color: C.text,
    letterSpacing: -0.2,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 13,
    color: C.textSecondary,
  },
  infoValue: {
    fontSize: 13,
    color: C.text,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 10,
  },
  notesBox: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: C.surfaceRaised,
    borderLeftWidth: 3,
    borderLeftColor: C.accent,
  },
  notesText: {
    fontSize: 13,
    color: C.textSecondary,
    lineHeight: 18,
  },
});
