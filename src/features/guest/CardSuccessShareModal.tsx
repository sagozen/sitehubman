import React from 'react';
import { Modal, View, StyleSheet, Pressable, ScrollView, Image } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import QRCode from 'react-native-qrcode-svg';
import { LinearGradient } from 'expo-linear-gradient';

interface CardSuccessShareModalProps {
  visible: boolean;
  onClose: () => void;
  url: string;
  name: string;
}

export function CardSuccessShareModal({ visible, onClose, url, name }: CardSuccessShareModalProps) {
  const SOCIALS = [
    { id: 'copy', name: 'Copy link', color: '#18181b', icon: 'Link' as const },
    { id: 'linkedin', name: 'LinkedIn', color: '#0a66c2', icon: 'Linkedin' as const },
    { id: 'facebook', name: 'Facebook', color: '#1877f2', icon: 'Facebook' as const },
    { id: 'messenger', name: 'Messenger', color: '#8b5cf6', icon: 'MessageCircle' as const },
    { id: 'whatsapp', name: 'WhatsApp', color: '#25d366', icon: 'Phone' as const },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.iconBtn}>
            <AppIcon name="Menu" size={24} color="#000" />
          </Pressable>
          <AppText style={styles.headerTitle} weight="bold">Card Share</AppText>
          <View style={styles.rightActions}>
            <Pressable style={styles.iconBtn}><AppIcon name="Edit2" size={20} color="#000" /></Pressable>
            <Pressable style={styles.iconBtn}><AppIcon name="Plus" size={24} color="#000" /></Pressable>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.qrSection}>
            <QRCode value={url} size={180} />
          </View>

          <View style={styles.cardPreview}>
            <LinearGradient colors={['#312e81', '#1e1b4b']} style={styles.cardTop} />
            <View style={styles.cardBottom}>
              <AppText style={styles.cardName} weight="bold">{name}</AppText>
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomSheet}>
          <View style={styles.sheetHeaderRow}>
            <AppText style={styles.sheetTitle} weight="bold">Show off your card</AppText>
            <Pressable onPress={onClose}><AppText style={styles.skipText}>Skip</AppText></Pressable>
          </View>
          <AppText style={styles.sheetSub}>
            Let's start off by sharing your new card with people you already know.
          </AppText>
          
          <Pressable style={styles.searchBtn}>
            <AppIcon name="Users" size={18} color="#fff" />
            <AppText style={styles.searchBtnText} weight="bold">Search my contacts</AppText>
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.line} />
            <AppText style={styles.orText}>Or</AppText>
            <View style={styles.line} />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.socialRow}>
            {SOCIALS.map(s => (
              <View key={s.id} style={styles.socialItem}>
                <View style={[styles.socialCircle, { backgroundColor: s.color }]}>
                  <AppIcon name={s.icon} size={24} color="#fff" />
                </View>
                <AppText style={styles.socialText}>{s.name}</AppText>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  iconBtn: { padding: 8 },
  headerTitle: { fontSize: 18, color: '#000' },
  rightActions: { flexDirection: 'row', alignItems: 'center' },
  scrollContent: { alignItems: 'center', paddingBottom: 300, paddingTop: 20 },
  qrSection: { marginBottom: 30 },
  cardPreview: {
    width: '85%',
    height: 220,
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
  },
  cardTop: { flex: 1 },
  cardBottom: { height: 80, backgroundColor: '#d4d4d8', justifyContent: 'center', paddingHorizontal: 20 },
  cardName: { fontSize: 20, color: '#000' },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  sheetHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sheetTitle: { fontSize: 18, color: '#000' },
  skipText: { fontSize: 14, color: '#6b7280' },
  sheetSub: { fontSize: 14, color: '#6b7280', marginBottom: 20, lineHeight: 20 },
  searchBtn: { backgroundColor: '#000', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, marginBottom: 20 },
  searchBtnText: { color: '#fff', fontSize: 16, marginLeft: 8 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  line: { flex: 1, height: 1, backgroundColor: '#e5e7eb' },
  orText: { marginHorizontal: 12, color: '#6b7280', fontSize: 14 },
  socialRow: { gap: 16, paddingHorizontal: 4 },
  socialItem: { alignItems: 'center', width: 70 },
  socialCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  socialText: { fontSize: 12, color: '#000', textAlign: 'center' },
});
