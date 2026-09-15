import React from 'react';
import { Modal, View, StyleSheet, Pressable, Image } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';

interface AiScannerModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AiScannerModal({ visible, onClose }: AiScannerModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.iconBtn}>
            <AppIcon name="X" size={24} color="#000" />
          </Pressable>
          <Pressable style={styles.manualBtn}>
            <AppIcon name="Edit2" size={14} color="#000" />
            <AppText style={styles.manualBtnText} weight="bold">Enter manually</AppText>
          </Pressable>
        </View>

        <AppText style={styles.mainTitle} weight="bold">Scan contact information</AppText>

        <View style={styles.cameraBox}>
          {/* Simulated camera feed layout */}
          <View style={styles.scannerFrame} />
          
          {/* AI Detection Tags */}
          <View style={[styles.aiTag, { top: 60, left: -20 }]}>
            <AppText style={styles.aiTagText}>Linkedin.com/steve</AppText>
            <AppIcon name="Sparkles" size={16} color="#ef4444" />
          </View>
          
          <View style={[styles.aiTag, { bottom: 80, right: -10 }]}>
            <AppText style={styles.aiTagText}>Adding phone number</AppText>
            <AppIcon name="Sparkles" size={16} color="#ef4444" />
          </View>
          
          <View style={[styles.aiTag, { bottom: 20, left: -10 }]}>
            <AppText style={styles.aiTagText}>Adding email</AppText>
            <AppIcon name="Sparkles" size={16} color="#ef4444" />
          </View>
        </View>

        <View style={styles.bottomSheet}>
          <AppText style={styles.sheetTitle} weight="extrabold">Building richer contacts</AppText>
          <AppText style={styles.sheetSub}>
            Capture what you have and we'll enrich the rest, including LinkedIn, email, phone number and more.
          </AppText>
          <Pressable style={styles.actionBtn} onPress={onClose}>
            <AppText style={styles.actionBtnText} weight="bold">Got it</AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#18181b' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop: 50 },
  iconBtn: { padding: 8 },
  manualBtn: { backgroundColor: '#e4e4e7', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, gap: 6 },
  manualBtnText: { color: '#000', fontSize: 14 },
  mainTitle: { color: '#fff', fontSize: 18, textAlign: 'center', marginBottom: 20 },
  cameraBox: { flex: 1, backgroundColor: '#d4d4d8', marginHorizontal: 40, borderRadius: 24, position: 'relative', overflow: 'visible' },
  scannerFrame: { position: 'absolute', top: 40, bottom: 40, left: 20, right: 20, borderWidth: 2, borderColor: '#000', borderStyle: 'dashed', borderRadius: 16 },
  aiTag: { position: 'absolute', backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5, gap: 6 },
  aiTagText: { color: '#000', fontSize: 12, fontWeight: '500' },
  bottomSheet: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 30, paddingBottom: 40, marginTop: 40 },
  sheetTitle: { fontSize: 24, color: '#000', textAlign: 'center', marginBottom: 12 },
  sheetSub: { fontSize: 16, color: '#6b7280', textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  actionBtn: { backgroundColor: '#000', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 16 },
});
