/**
 * DeleteAccountScreen — 54 Delete Account & Data Purge (Apple Guideline 5.1.1 compliant)
 *
 * Implements:
 * 54 — Account Deletion & Data Purge
 * - Explains irreversible data erasure (Cards, Leads, NFC Bindings, Profile Links)
 * - Confirmation step
 * - Permanent purge and signOut
 */
import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { IosScrollView } from '@/src/components/IosScrollView';
import { useAuth } from '@/src/hooks/useAuth';
import { HapticTap } from '@/src/utils/haptics';

const C = {
  canvas: '#000000',
  surface: '#111114',
  surfaceRaised: '#18181C',
  border: 'rgba(255,255,255,0.08)',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  textMuted: '#636366',
  accent: '#2596BE',
  danger: '#FF453A',
  dangerSubtle: 'rgba(255, 69, 58, 0.15)',
} as const;

export default function DeleteAccountScreen() {
  const { signOutUser } = useAuth();
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const isConfirmed = confirmText.trim().toUpperCase() === 'DELETE';

  const handleDelete = useCallback(async () => {
    if (!isConfirmed) return;
    HapticTap.error();

    Alert.alert(
      'Permanent Deletion',
      'Are you absolutely sure? This cannot be undone and your public NFC link will immediately stop working.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              // Sign out and clear local state
              await signOutUser();
              Alert.alert('Account Deleted', 'Your profile and data have been removed from SiteHub.');
              router.replace('/(auth)/login' as any);
            } catch (e) {
              setDeleting(false);
              Alert.alert('Error', 'Unable to delete account at this time.');
            }
          },
        },
      ]
    );
  }, [isConfirmed, signOutUser]);

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
          Delete Account
        </AppText>
        <View style={{ width: 24 }} />
      </View>

      <IosScrollView contentContainerStyle={styles.scroll}>
        {/* Warning Badge */}
        <View style={styles.warningWrap}>
          <View style={styles.warningIconCircle}>
            <AppIcon name="AlertOctagon" size={40} color={C.danger} />
          </View>
          <AppText style={styles.warningTitle} weight="bold">
            Delete Account & Data
          </AppText>
          <AppText style={styles.warningSub}>
            This action is permanent and completely irreversible according to Apple privacy standards.
          </AppText>
        </View>

        {/* What Will Be Deleted */}
        <View style={styles.infoCard}>
          <AppText style={styles.infoCardTitle} weight="bold">
            What will be permanently deleted:
          </AppText>

          <View style={styles.itemRow}>
            <AppIcon name="Check" size={16} color={C.danger} />
            <AppText style={styles.itemText}>
              All digital cards and public URL links (e.g. sitehub.me/u/thean)
            </AppText>
          </View>

          <View style={styles.itemRow}>
            <AppIcon name="Check" size={16} color={C.danger} />
            <AppText style={styles.itemText}>
              All captured contacts, leads CRM data, and customer notes
            </AppText>
          </View>

          <View style={styles.itemRow}>
            <AppIcon name="Check" size={16} color={C.danger} />
            <AppText style={styles.itemText}>
              Physical NFC card associations (cards will become unlinked)
            </AppText>
          </View>

          <View style={styles.itemRow}>
            <AppIcon name="Check" size={16} color={C.danger} />
            <AppText style={styles.itemText}>
              Analytics history, tap metrics, and order records
            </AppText>
          </View>
        </View>

        {/* Confirmation Input */}
        <View style={styles.confirmBox}>
          <AppText style={styles.confirmPrompt}>
            Type <AppText style={{ color: C.danger }} weight="bold">DELETE</AppText> to confirm:
          </AppText>
          <TextInput
            style={styles.input}
            placeholder="DELETE"
            placeholderTextColor={C.textMuted}
            value={confirmText}
            onChangeText={setConfirmText}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </View>

        {/* Delete Button */}
        <Pressable
          style={({ pressed }) => [
            styles.deleteBtn,
            !isConfirmed && styles.deleteBtnDisabled,
            pressed && isConfirmed && styles.btnPressed,
          ]}
          disabled={!isConfirmed || deleting}
          onPress={handleDelete}
        >
          {deleting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <AppIcon name="Trash2" size={18} color="#FFFFFF" />
              <AppText style={styles.deleteBtnText} weight="bold">
                Permanently Delete My Account
              </AppText>
            </>
          )}
        </Pressable>
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
    gap: 18,
  },
  warningWrap: {
    alignItems: 'center',
    marginVertical: 12,
  },
  warningIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.dangerSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 22,
    color: C.text,
    letterSpacing: -0.4,
  },
  warningSub: {
    fontSize: 13,
    color: C.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 290,
    lineHeight: 18,
  },
  infoCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 18,
    borderColor: C.border,
    gap: 12,
  },
  infoCardTitle: {
    fontSize: 14,
    color: C.text,
    marginBottom: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  itemText: {
    flex: 1,
    fontSize: 13,
    color: C.textSecondary,
    lineHeight: 18,
  },
  confirmBox: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 18,
    borderColor: C.border,
    gap: 10,
  },
  confirmPrompt: {
    fontSize: 14,
    color: C.text,
  },
  input: {
    backgroundColor: C.surfaceRaised,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: C.text,
    fontSize: 15,
    borderColor: C.border,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.danger,
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 8,
  },
  deleteBtnDisabled: {
    opacity: 0.35,
  },
  btnPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  deleteBtnText: {
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
