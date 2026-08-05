import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Switch, View } from 'react-native';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { AppButton } from '@/src/components/AppButton';
import { HapticTap } from '@/src/utils/haptics';

export interface PrivacyFieldToggles {
  sharePhone: boolean;
  shareEmail: boolean;
  shareWebsite: boolean;
  shareSocials: boolean;
}

export interface PrivacyFieldSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (toggles: PrivacyFieldToggles) => void;
}

export function PrivacyFieldSheet({ visible, onClose, onConfirm }: PrivacyFieldSheetProps) {
  const [toggles, setToggles] = useState<PrivacyFieldToggles>({
    sharePhone: true,
    shareEmail: true,
    shareWebsite: true,
    shareSocials: true,
  });

  const toggle = (key: keyof PrivacyFieldToggles) => {
    HapticTap.light();
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <AppIcon name="ShieldCheck" size={24} color="#30D158" />
            <AppText style={styles.title} weight="extrabold">Privacy & Field Control</AppText>
          </View>
          <AppText style={styles.subtitle}>Select which contact fields to broadcast during NFC tap and QR scan.</AppText>

          <View style={styles.row}>
            <AppText style={styles.label}>Phone Number</AppText>
            <Switch value={toggles.sharePhone} onValueChange={() => toggle('sharePhone')} trackColor={{ true: '#007AFF' }} />
          </View>
          <View style={styles.row}>
            <AppText style={styles.label}>Email Address</AppText>
            <Switch value={toggles.shareEmail} onValueChange={() => toggle('shareEmail')} trackColor={{ true: '#007AFF' }} />
          </View>
          <View style={styles.row}>
            <AppText style={styles.label}>Website & Profile Links</AppText>
            <Switch value={toggles.shareWebsite} onValueChange={() => toggle('shareWebsite')} trackColor={{ true: '#007AFF' }} />
          </View>
          <View style={styles.row}>
            <AppText style={styles.label}>Social Channels</AppText>
            <Switch value={toggles.shareSocials} onValueChange={() => toggle('shareSocials')} trackColor={{ true: '#007AFF' }} />
          </View>

          <View style={styles.footer}>
            <AppButton label="Confirm Privacy Settings" variant="dark" onPress={() => onConfirm(toggles)} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#111114',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
  },
  subtitle: {
    color: '#8E8E93',
    fontSize: 13,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    marginTop: 12,
  },
});
