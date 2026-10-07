/**
 * LeadDetailScreen — Screen 8: Lead Detail ("View & manage contact")
 * Luxury Minimalist (Apple Wallet × Stripe × Linear · Black Granite UI)
 */
import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Linking,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { IosScrollView } from '@/src/components/IosScrollView';
import { HapticTap } from '@/src/utils/haptics';

const C = {
  canvas: '#0D0D0E',
  surface: '#242424',
  surfaceRaised: '#2C2C2C',
  border: 'transparent',
  borderLight: 'transparent',
  text: '#FFFFFF',
  textSecondary: '#E4E4E7',
  textMuted: '#8E8E93',
  textDim: '#8E8E93',
  accent: '#2596BE',
  emerald: '#799A85',
} as const;

export default function LeadDetailScreen() {
  const params = useLocalSearchParams();
  const leadId = (params.leadId as string) || 'john-smith';

  const [followedUp, setFollowedUp] = useState(false);

  // Default lead matching design spec
  const contact = {
    name: 'John Smith',
    company: 'ABC Corporation',
    title: 'CEO',
    phone: '+855 12 345 678',
    email: 'john@acme.com',
    source: 'NFC Tap',
    time: 'Today, 09:42',
    notes: 'Interested in partnership. Send proposal.',
  };

  const avatarImage = leadId.includes('sokha') || leadId.includes('srey')
    ? require('@/assets/images/avatars/avatar_founder_woman.jpg')
    : leadId.includes('daniel') || leadId.includes('chhay')
    ? require('@/assets/images/avatars/avatar_founder_man.jpg')
    : require('@/assets/images/avatars/avatar_executive_real.jpg');

  const initials = contact.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const handleCall = useCallback(() => {
    HapticTap.light();
    Linking.openURL(`tel:${contact.phone.replace(/[^0-9+]/g, '')}`).catch(() => {
      Alert.alert('Unable to place call');
    });
  }, [contact.phone]);

  const handleEmail = useCallback(() => {
    HapticTap.light();
    Linking.openURL(`mailto:${contact.email}`).catch(() => {
      Alert.alert('Unable to open mail client');
    });
  }, [contact.email]);

  const handleWhatsApp = useCallback(() => {
    HapticTap.light();
    const cleanPhone = contact.phone.replace(/[^0-9]/g, '');
    Linking.openURL(`https://wa.me/${cleanPhone}`).catch(() => {
      Alert.alert('Unable to open WhatsApp');
    });
  }, [contact.phone]);

  const toggleFollowUp = useCallback(() => {
    HapticTap.softConfirmation();
    setFollowedUp((prev) => !prev);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={12}
        >
          <AppIcon name="chevron-left" size={20} color={C.text} />
        </Pressable>

        <AppText style={styles.topBarTitle} weight="bold">
          Lead Details
        </AppText>

        <Pressable
          style={[
            styles.followUpBtn,
            followedUp && styles.followUpBtnActive,
          ]}
          onPress={toggleFollowUp}
          hitSlop={8}
        >
          <AppText
            style={[
              styles.followUpBtnText,
              followedUp && styles.followUpBtnTextActive,
            ]}
            weight="medium"
          >
            {followedUp ? 'Done' : 'Follow Up'}
          </AppText>
        </Pressable>
      </View>

      <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.contentWrap}>
          {/* Contact Profile Banner Card */}
          <View style={styles.profileCard}>
            <Image
              source={avatarImage}
              style={styles.avatarPhoto}
            />
            <AppText style={styles.profileName} weight="bold">
              {contact.name}
            </AppText>
            <AppText style={styles.profileCompany}>
              {contact.company}
            </AppText>
            <AppText style={styles.profileTitle}>
              {contact.title}
            </AppText>
          </View>

          {/* Contact Details List */}
          <View style={styles.detailsGroup}>
            {/* Phone */}
            <Pressable style={styles.detailRow} onPress={handleCall}>
              <View style={styles.detailIconWrap}>
                <AppIcon name="phone" size={18} color={C.textSecondary} />
              </View>
              <View style={styles.detailTextWrap}>
                <AppText style={styles.detailLabel}>Phone</AppText>
                <AppText style={styles.detailValue}>{contact.phone}</AppText>
              </View>
              <AppIcon name="chevron-right" size={15} color={C.textMuted} />
            </Pressable>

            {/* Email */}
            <Pressable style={styles.detailRow} onPress={handleEmail}>
              <View style={styles.detailIconWrap}>
                <AppIcon name="mail" size={18} color={C.textSecondary} />
              </View>
              <View style={styles.detailTextWrap}>
                <AppText style={styles.detailLabel}>Email</AppText>
                <AppText style={styles.detailValue}>{contact.email}</AppText>
              </View>
              <AppIcon name="chevron-right" size={15} color={C.textMuted} />
            </Pressable>

            {/* Source */}
            <View style={styles.detailRow}>
              <View style={styles.detailIconWrap}>
                <AppIcon name="wifi" size={18} color={C.textSecondary} style={{ transform: [{ rotate: '90deg' }] }} />
              </View>
              <View style={styles.detailTextWrap}>
                <AppText style={styles.detailLabel}>Source</AppText>
                <AppText style={styles.detailValue}>{contact.source}</AppText>
              </View>
            </View>

            {/* Time */}
            <View style={styles.detailRow}>
              <View style={styles.detailIconWrap}>
                <AppIcon name="clock" size={18} color={C.textSecondary} />
              </View>
              <View style={styles.detailTextWrap}>
                <AppText style={styles.detailLabel}>Time</AppText>
                <AppText style={styles.detailValue}>{contact.time}</AppText>
              </View>
            </View>

            {/* Notes */}
            <View style={styles.detailRow}>
              <View style={styles.detailIconWrap}>
                <AppIcon name="file-text" size={18} color={C.textSecondary} />
              </View>
              <View style={styles.detailTextWrap}>
                <AppText style={styles.detailLabel}>Notes</AppText>
                <AppText style={styles.detailNotesValue}>{contact.notes}</AppText>
              </View>
            </View>
          </View>

          <View style={{ height: 120 }} />
        </View>
      </IosScrollView>

      {/* Floating Bottom Quick Action Bar: Call, Email, WhatsApp */}
      <View style={styles.bottomBar}>
        <Pressable
          style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
          onPress={handleCall}
        >
          <View style={styles.actionIconCircle}>
            <AppIcon name="phone" size={20} color="#FFFFFF" />
          </View>
          <AppText style={styles.actionButtonLabel}>Call</AppText>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
          onPress={handleEmail}
        >
          <View style={styles.actionIconCircle}>
            <AppIcon name="mail" size={20} color="#FFFFFF" />
          </View>
          <AppText style={styles.actionButtonLabel}>Email</AppText>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
          onPress={handleWhatsApp}
        >
          <View style={styles.actionIconCircle}>
            <AppIcon name="message-circle" size={20} color="#FFFFFF" />
          </View>
          <AppText style={styles.actionButtonLabel}>WhatsApp</AppText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.canvas,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 16,
    color: C.text,
  },
  followUpBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  followUpBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  followUpBtnText: {
    fontSize: 12,
    color: C.textSecondary,
  },
  followUpBtnTextActive: {
    color: '#FFFFFF',
  },
  scroll: {
    flexGrow: 1,
  },
  contentWrap: {
    paddingHorizontal: 16,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    paddingTop: 16,
  },
  profileCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  avatarPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: '#0D0D0E',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1E1E28',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarInitials: {
    fontSize: 24,
    color: C.text,
  },
  profileName: {
    fontSize: 20,
    color: C.text,
    letterSpacing: -0.3,
  },
  profileCompany: {
    fontSize: 14,
    color: C.textSecondary,
    marginTop: 4,
  },
  profileTitle: {
    fontSize: 13,
    color: C.textMuted,
    marginTop: 2,
  },
  detailsGroup: {
    backgroundColor: C.surface,
    borderRadius: 18,
    marginTop: 18,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 18,
  },
  detailIconWrap: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  detailTextWrap: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  detailValue: {
    fontSize: 14,
    color: C.text,
    marginTop: 3,
  },
  detailNotesValue: {
    fontSize: 13,
    color: C.textSecondary,
    marginTop: 3,
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    maxWidth: 720,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#16161C',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  actionButton: {
    alignItems: 'center',
    gap: 6,
  },
  actionButtonPressed: {
    opacity: 0.75,
  },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonLabel: {
    fontSize: 12,
    color: C.text,
  },
});
