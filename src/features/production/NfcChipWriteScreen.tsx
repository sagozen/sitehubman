import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';

type ChipState = 'idle' | 'writing' | 'verify_pass' | 'verify_fail' | 'discarded' | 'packed';

interface NfcChipWriteProps {
  orderId?: string;
  totalCards?: number;
}

export default function NfcChipWriteScreen({
  orderId = 'AVS-2608-4471',
  totalCards = 3,
}: NfcChipWriteProps) {
  const router = useRouter();
  const [currentChipIndex, setCurrentChipIndex] = useState(1);
  const [chipState, setChipState] = useState<ChipState>('idle');
  const [lockedChips, setLockedChips] = useState<string[]>([]);
  const [discardedCount, setDiscardedCount] = useState(0);

  const currentObjectCode = `AVO-4471A${currentChipIndex}`;

  const handleStartWriting = () => {
    setChipState('writing');
    setTimeout(() => {
      // Simulate NFC burn & verify cycle
      setChipState('verify_pass');
    }, 1800);
  };

  const handleSimulateFail = () => {
    setChipState('writing');
    setTimeout(() => {
      setChipState('verify_fail');
    }, 1500);
  };

  const handleLockAndNext = () => {
    const updatedLocked = [...lockedChips, currentObjectCode];
    setLockedChips(updatedLocked);

    if (currentChipIndex < totalCards) {
      setCurrentChipIndex(currentChipIndex + 1);
      setChipState('idle');
    } else {
      setChipState('packed');
    }
  };

  const handleDiscardDefective = () => {
    Alert.alert(
      'Discard Defective Chip',
      'This chip will be flagged in the scrap log and removed from the batch. A new replacement UID will be generated.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Discard',
          style: 'destructive',
          onPress: () => {
            setDiscardedCount(discardedCount + 1);
            setChipState('idle');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Top Header */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backButtonText}>← Job {orderId}</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>
            {chipState === 'packed'
              ? 'Batch Ready for Packaging'
              : `Write Chip ${currentChipIndex} of ${totalCards}`}
          </Text>
          <Text style={styles.targetCode}>{currentObjectCode}</Text>
        </View>

        {/* Device Capability Badge */}
        <View style={styles.deviceStatus}>
          <View style={styles.greenDot} />
          <Text style={styles.deviceStatusText}>NFC Antenna Ready (NTAG216 Compatible)</Text>
        </View>

        {/* Dynamic State Container */}
        {chipState === 'idle' && (
          <View style={styles.burnCard}>
            <View style={styles.nfcIconBox}>
              <Text style={styles.nfcSymbol}>)))</Text>
            </View>
            <Text style={styles.burnTitle}>Hold phone to physical chip</Text>
            <Text style={styles.burnSubtitle}>
              Keep the top edge of the device flat against the card NFC antenna until vibration.
            </Text>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleStartWriting}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.actionButtonText}>Write & Verify UID</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSimulateFail}
              style={{ marginTop: 12, padding: 8, alignItems: 'center' }}
            >
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                [Simulate Mismatch Verification Error]
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {chipState === 'writing' && (
          <View style={styles.burnCard}>
            <ActivityIndicator size="large" color="#2997FF" style={{ marginBottom: 16 }} />
            <Text style={styles.burnTitle}>Writing & Verifying Payload...</Text>
            <Text style={styles.burnSubtitle}>
              Do not move the card. Writing cryptographic UID and verifying checksum.
            </Text>
          </View>
        )}

        {chipState === 'verify_pass' && (
          <View style={[styles.burnCard, styles.passCardBorder]}>
            <View style={styles.successIconBox}>
              <Text style={styles.successIcon}>✓</Text>
            </View>
            <Text style={styles.passTitle}>Read Verification Passed</Text>
            <Text style={styles.burnSubtitle}>
              UID matches batch allocation. Ready to permanently lock write-access.
            </Text>

            <TouchableOpacity
              style={[styles.actionButton, styles.lockButton]}
              onPress={handleLockAndNext}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.lockButtonText}>
                Lock Chip & Proceed ({currentChipIndex}/{totalCards}) →
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {chipState === 'verify_fail' && (
          <View style={[styles.burnCard, styles.failCardBorder]}>
            <View style={styles.failIconBox}>
              <Text style={styles.failIcon}>✕</Text>
            </View>
            <Text style={styles.failTitle}>Verification Mismatch</Text>
            <Text style={styles.burnSubtitle}>
              The data read back from the chip does not match the allocated UID. Do not package this card.
            </Text>

            <View style={{ gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleStartWriting}
              >
                <Text style={styles.actionButtonText}>Retry Writing Chip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.discardButton}
                onPress={handleDiscardDefective}
              >
                <Text style={styles.discardButtonText}>Discard as Defective (Scrap)</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {chipState === 'packed' && (
          <View style={styles.burnCard}>
            <View style={styles.successIconBox}>
              <Text style={styles.successIcon}>✓</Text>
            </View>
            <Text style={styles.burnTitle}>All {totalCards} Chips Verified & Locked</Text>
            <Text style={styles.burnSubtitle}>
              Batch has passed QA. Proceed to packaging checklist.
            </Text>

            <View style={styles.checklistContainer}>
              {lockedChips.map((code, idx) => (
                <View key={idx} style={styles.checkRow}>
                  <Text style={styles.checkCode}>{code}</Text>
                  <Text style={styles.checkStatus}>✓ Locked & Verified</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.back()}
            >
              <Text style={styles.actionButtonText}>Complete Job & Seal Box</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Batch Status Footer */}
        <View style={styles.footerStats}>
          <Text style={styles.footerStatText}>
            Locked in batch: {lockedChips.length}/{totalCards}
          </Text>
          {discardedCount > 0 && (
            <Text style={[styles.footerStatText, { color: '#ff453a' }]}>
              Discarded (scrap): {discardedCount}
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  backButton: {
    marginBottom: 16,
    minHeight: 48,
    justifyContent: 'center',
  },
  backButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '500',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  targetCode: {
    fontSize: 15,
    fontFamily: 'Courier, monospace',
    color: '#2997FF',
    marginTop: 4,
    fontWeight: '700',
  },
  deviceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  deviceStatusText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  burnCard: {
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  passCardBorder: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  failCardBorder: {
    borderColor: 'rgba(255, 69, 58, 0.4)',
  },
  nfcIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(41, 151, 255, 0.15)',
    borderWidth: 1,
    borderColor: '#2997FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  nfcSymbol: {
    color: '#2997FF',
    fontSize: 22,
    fontWeight: '900',
  },
  successIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successIcon: {
    color: '#10B981',
    fontSize: 28,
    fontWeight: '900',
  },
  failIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
    borderWidth: 1,
    borderColor: '#ff453a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  failIcon: {
    color: '#ff453a',
    fontSize: 28,
    fontWeight: '900',
  },
  burnTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  passTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10B981',
    textAlign: 'center',
    marginBottom: 8,
  },
  failTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ff453a',
    textAlign: 'center',
    marginBottom: 8,
  },
  burnSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.65)',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#ffffff',
    borderRadius: 999,
    minHeight: 48,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '800',
  },
  lockButton: {
    backgroundColor: '#10B981',
  },
  lockButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  discardButton: {
    backgroundColor: '#1c1c22',
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.3)',
    borderRadius: 999,
    minHeight: 48,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discardButtonText: {
    color: '#ff453a',
    fontSize: 13,
    fontWeight: '700',
  },
  checklistContainer: {
    width: '100%',
    backgroundColor: '#18181c',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 20,
  },
  checkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  checkCode: {
    color: '#ffffff',
    fontFamily: 'Courier, monospace',
    fontSize: 13,
    fontWeight: '700',
  },
  checkStatus: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
  },
  footerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  footerStatText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '600',
  },
});
