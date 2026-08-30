/**
 * QuickSetupSheet — 30-Second NFC Card Setup for Businessmen.
 * 3 fields: Name, Title, WhatsApp/LinkedIn. Bottom sheet. No account needed.
 */
import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { HapticTap } from '@/src/utils/haptics';
import { saveGuestCardDraft } from '@/src/services/guestDraftService';

interface QuickSetupSheetProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (name: string, title: string, contact: string) => void;
  initialName?: string;
}

export function QuickSetupSheet({
  visible,
  onClose,
  onComplete,
  initialName = '',
}: QuickSetupSheetProps) {
  const [name, setName] = useState(initialName);
  const [title, setTitle] = useState('');
  const [contact, setContact] = useState('');
  const [busy, setBusy] = useState(false);
  const titleRef = useRef<TextInput>(null);
  const contactRef = useRef<TextInput>(null);
  const nameValid = name.trim().length > 1;

  async function handleDone() {
    if (!nameValid || busy) return;
    HapticTap.heavy();
    setBusy(true);
    try {
      await saveGuestCardDraft({
        displayName: name.trim(),
        jobTitle: title.trim(),
        company: '',
        phone: contact.trim().startsWith('+') ? contact.trim() : '',
        email: contact.includes('@') ? contact.trim() : '',
        telegram: contact.includes('t.me') || contact.startsWith('@') ? contact.trim() : undefined,
        product: 'pvc_card',
        cardDesign: 'classic_black',
        cardChoice: 'ecard',
        gradientIndex: 0,
      });
      onComplete(name.trim(), title.trim(), contact.trim());
    } catch {
      // silent fail
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View>
              <AppText style={styles.headerTitle} weight="extrabold">30-Second Setup</AppText>
              <AppText style={styles.headerSub}>Your NFC card is ready to beam after this.</AppText>
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <AppIcon name="X" size={18} color="rgba(255,255,255,0.6)" />
            </Pressable>
          </View>
          <View style={styles.fields}>
            <View style={styles.fieldGroup}>
              <AppText style={styles.fieldLabel}>Full Name *</AppText>
              <View style={[styles.fieldRow, !nameValid && name.length > 0 && styles.fieldRowError]}>
                <AppIcon name="User" size={18} color={nameValid ? '#30D158' : '#8E8E93'} />
                <TextInput
                  style={styles.fieldInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="Alexander Wright"
                  placeholderTextColor="rgba(235,235,245,0.3)"
                  autoFocus
                  returnKeyType="next"
                  onSubmitEditing={() => titleRef.current?.focus()}
                  autoCapitalize="words"
                  selectionColor="#0A84FF"
                />
                {nameValid && <AppIcon name="Check" size={16} color="#30D158" />}
              </View>
            </View>
            <View style={styles.fieldGroup}>
              <AppText style={styles.fieldLabel}>Your Title / Role</AppText>
              <View style={styles.fieldRow}>
                <AppIcon name="Briefcase" size={18} color="#8E8E93" />
                <TextInput
                  ref={titleRef}
                  style={styles.fieldInput}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Founder & CEO"
                  placeholderTextColor="rgba(235,235,245,0.3)"
                  returnKeyType="next"
                  onSubmitEditing={() => contactRef.current?.focus()}
                  selectionColor="#0A84FF"
                />
              </View>
            </View>
            <View style={styles.fieldGroup}>
              <AppText style={styles.fieldLabel}>WhatsApp or LinkedIn</AppText>
              <View style={styles.fieldRow}>
                <AppIcon name="Link" size={18} color="#8E8E93" />
                <TextInput
                  ref={contactRef}
                  style={styles.fieldInput}
                  value={contact}
                  onChangeText={setContact}
                  placeholder="+1 555 000 0000 or linkedin.com/in/you"
                  placeholderTextColor="rgba(235,235,245,0.3)"
                  keyboardType="url"
                  returnKeyType="done"
                  onSubmitEditing={handleDone}
                  autoCapitalize="none"
                  selectionColor="#0A84FF"
                />
              </View>
            </View>
          </View>
          <Pressable
            onPress={handleDone}
            disabled={!nameValid || busy}
            style={[styles.cta, (!nameValid || busy) && styles.ctaDisabled]}
          >
            <AppIcon name="Nfc" size={20} color={nameValid ? '#000000' : '#636366'} />
            <AppText style={[styles.ctaText, !nameValid && { color: '#636366' }]} weight="extrabold">
              {busy ? 'Saving...' : 'Save & Beam My Card'}
            </AppText>
          </Pressable>
          <AppText style={styles.ctaNote}>No account needed · 30 seconds</AppText>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)' },
  sheet: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    gap: 16,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)', alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headerTitle: { fontSize: 22, color: '#FFFFFF', letterSpacing: -0.3 },
  headerSub: { fontSize: 13, color: 'rgba(235,235,245,0.55)', marginTop: 2 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  fields: { gap: 12 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 12, color: 'rgba(235,235,245,0.55)', letterSpacing: 0.2 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#2C2C2E', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 14, paddingVertical: 12, minHeight: 48 },
  fieldRowError: { borderColor: '#FF453A' },
  fieldInput: { flex: 1, fontSize: 16, color: '#FFFFFF', letterSpacing: -0.3, padding: 0 },
  cta: { height: 56, borderRadius: 16, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 4 },
  ctaDisabled: { backgroundColor: '#2C2C2E' },
  ctaText: { fontSize: 17, color: '#000000', letterSpacing: -0.2 },
  ctaNote: { fontSize: 12, color: 'rgba(235,235,245,0.35)', textAlign: 'center' },
});
