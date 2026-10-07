import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Switch,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AppText from '@/src/components/AppText';
import AppIcon from '@/src/components/AppIcon';
import type { AppIconName } from '@/src/components/AppIcon';
import { HapticTap } from '@/src/utils/haptics';

const C = {
  canvas: '#000000',
  surface: '#111114',
  surfaceRaised: '#18181C',
  border: 'rgba(255,255,255,0.09)',
  text: '#F5F5F7',
  muted: '#9A9AA0',
  accent: '#2596BE',
  danger: '#FF453A',
};

type RowProps = {
  icon: AppIconName;
  label: string;
  sublabel?: string;
  onPress: () => void;
  danger?: boolean;
  rightSlot?: React.ReactNode;
  hideDivider?: boolean;
};

const ActionRow: React.FC<RowProps> = ({
  icon,
  label,
  sublabel,
  onPress,
  danger,
  rightSlot,
  hideDivider,
}) => (
  <Pressable
    onPress={() => {
      HapticTap.light();
      onPress();
    }}
    style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    hitSlop={4}
  >
    <View style={styles.rowLeft}>
      <View style={styles.iconWrap}>
        <AppIcon
          name={icon}
          size={18}
          color={danger ? C.danger : C.accent}
        />
      </View>
      <View style={styles.rowText}>
        <AppText
          style={[styles.rowLabel, danger && { color: C.danger }]}
        >
          {label}
        </AppText>
        {sublabel ? (
          <AppText style={styles.rowSub}>{sublabel}</AppText>
        ) : null}
      </View>
    </View>
    {rightSlot ?? (
      <AppIcon name="chevron-right" size={16} color={C.muted} />
    )}
    {!hideDivider && <View style={styles.divider} />}
  </Pressable>
);

export default function NfcDeviceSettingsScreen() {
  const [active, setActive] = useState(true);
  const [cardName, setCardName] = useState('My NFC Card');
  const assignedProfile = 'Alex Johnson — Software Engineer';

  const handleRename = useCallback(() => {
    HapticTap.light();
    Alert.prompt(
      'Rename Card',
      'Enter a new name for this NFC card',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: (value) => {
            if (value?.trim()) setCardName(value.trim());
          },
        },
      ],
      'plain-text',
      cardName,
    );
  }, [cardName]);

  const handleAssignProfile = useCallback(() => {
    HapticTap.light();
    router.push('/cards/settings' as any);
  }, []);

  const handleReplaceProfile = useCallback(() => {
    HapticTap.light();
    router.push('/nfc/write' as any);
  }, []);

  const handleUnlink = useCallback(() => {
    HapticTap.heavy();
    Alert.alert(
      'Unlink Card',
      'This will permanently unlink the card from your account. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlink',
          style: 'destructive',
          onPress: () => {
            HapticTap.error();
            router.back();
          },
        },
      ],
    );
  }, []);

  const handleReportLost = useCallback(() => {
    HapticTap.heavy();
    Alert.alert(
      'Report Lost Card',
      'Reporting this card as lost will immediately deactivate it and prevent further use.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report Lost',
          style: 'destructive',
          onPress: () => HapticTap.error(),
        },
      ],
    );
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => { HapticTap.light(); router.back(); }}
          style={styles.backBtn}
          hitSlop={8}
        >
          <AppIcon name="chevron-left" size={22} color={C.text} />
        </Pressable>
        <AppText style={styles.headerTitle}>NFC Card Settings</AppText>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Card Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <AppIcon name="credit-card" size={18} color={C.muted} />
            <View style={styles.infoText}>
              <AppText style={styles.infoLabel}>Card Name</AppText>
              <AppText style={styles.infoValue}>{cardName}</AppText>
            </View>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <AppIcon name="user" size={18} color={C.muted} />
            <View style={styles.infoText}>
              <AppText style={styles.infoLabel}>Assigned Profile</AppText>
              <AppText style={styles.infoValue}>{assignedProfile}</AppText>
            </View>
          </View>
        </View>

        {/* Actions */}
        <AppText style={styles.sectionLabel}>CARD ACTIONS</AppText>
        <View style={styles.group}>
          <ActionRow
            icon="edit-2"
            label="Rename Card"
            sublabel={cardName}
            onPress={handleRename}
          />
          <ActionRow
            icon="layers"
            label="Assign Profile"
            sublabel="Select which profile this card launches"
            onPress={handleAssignProfile}
          />
          <ActionRow
            icon={active ? 'zap' : 'zap-off'}
            label={active ? 'Deactivate Card' : 'Activate Card'}
            sublabel={active ? 'Card is currently active' : 'Card is deactivated'}
            onPress={() => {
              HapticTap.softConfirmation();
              setActive((v) => !v);
            }}
            rightSlot={
              <Switch
                value={active}
                onValueChange={(v) => {
                  HapticTap.softConfirmation();
                  setActive(v);
                }}
                trackColor={{ false: C.surfaceRaised, true: C.accent }}
                thumbColor="#fff"
              />
            }
          />
          <ActionRow
            icon="refresh-cw"
            label="Replace Profile"
            sublabel="Re-write NFC chip with a different profile"
            onPress={handleReplaceProfile}
            hideDivider
          />
        </View>

        {/* Danger Zone */}
        <AppText style={styles.sectionLabel}>DANGER ZONE</AppText>
        <View style={styles.group}>
          <ActionRow
            icon="link-2"
            label="Unlink Card"
            sublabel="Remove this card from your account"
            onPress={handleUnlink}
            danger
          />
          <ActionRow
            icon="alert-triangle"
            label="Report Lost Card"
            sublabel="Immediately deactivate and flag as lost"
            onPress={handleReportLost}
            danger
            hideDivider
          />
        </View>
      </ScrollView>
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
    paddingVertical: 14,
  },
  backBtn: {
    width: 36,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: C.text,
    letterSpacing: -0.3,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 130,
  },
  infoCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderColor: C.border,
    paddingHorizontal: 16,
    marginBottom: 28,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: C.muted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: C.text,
    fontWeight: '500',
  },
  infoDivider: {
    height: 1,
    backgroundColor: C.border,
  },
  sectionLabel: {
    fontSize: 11,
    color: C.muted,
    letterSpacing: 0.8,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  group: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderColor: C.border,
    paddingHorizontal: 16,
    marginBottom: 28,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  rowPressed: {
    opacity: 0.6,
  },
  rowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: C.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    color: C.text,
    fontWeight: '500',
  },
  rowSub: {
    fontSize: 12,
    color: C.muted,
    marginTop: 1,
  },
  divider: {
    position: 'absolute',
    bottom: 0,
    left: 44,
    right: 0,
    height: 1,
    backgroundColor: C.border,
  },
});
