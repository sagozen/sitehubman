import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';

interface WalletPassProps {
  cardName?: string;
  cardType?: string;
  cardLink?: string;
}

export default function WalletPassScreen({
  cardName = 'Sokha Chan',
  cardType = 'Rectangular Card',
  cardLink = 'avio.link/sokha-chan',
}: WalletPassProps) {
  const router = useRouter();
  const [hasApplePass, setHasApplePass] = useState(false);
  const [hasGooglePass, setHasGooglePass] = useState(false);

  const handleAddAppleWallet = () => {
    // Simulated native PassKit .pkpass registration
    setHasApplePass(true);
    Alert.alert('Added to Apple Wallet', 'Your Avio Pass is now ready in your Apple Wallet app.');
  };

  const handleAddGoogleWallet = () => {
    // Simulated Google Pay Passes API
    setHasGooglePass(true);
    Alert.alert('Added to Google Wallet', 'Your Avio Pass is now ready in your Google Wallet app.');
  };

  const isPassAdded = hasApplePass || hasGooglePass;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Top Back Navigation */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        {/* Title Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {isPassAdded ? 'Wallet Passes' : 'Add to Phone Wallet'}
          </Text>
          <Text style={styles.subtitle}>
            {cardName} - {cardType}
          </Text>
        </View>

        {/* Pass Preview Card */}
        <View style={styles.passPreviewCard}>
          <View style={styles.passHeader}>
            <View style={styles.qrPlaceholder}>
              <Text style={styles.qrText}>QR</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={styles.passName}>{cardName.toUpperCase()}</Text>
              <Text style={styles.passTagline}>Avio - scan to open my page</Text>
              <Text style={styles.passLink}>{cardLink}</Text>
            </View>
          </View>
        </View>

        {/* Essential Warning Banner */}
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>(!) This pass is for scanning only</Text>
          <Text style={styles.warningText}>
            People scan the QR code to open your page. It does not replace the NFC tap of your real physical card.
          </Text>
        </View>

        {/* What this pass holds */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>What this pass holds</Text>
          <Text style={styles.infoBullet}>• A QR code leading to your live Avio Cloud page</Text>
          <Text style={styles.infoBullet}>• Your name at the time you add it</Text>
          <Text style={styles.infoBullet}>• Nothing else from your private profile</Text>
        </View>

        {/* Pass Actions */}
        <View style={styles.actions}>
          {Platform.OS === 'ios' || Platform.OS === 'web' ? (
            <TouchableOpacity
              style={[styles.walletButton, hasApplePass && styles.walletButtonDisabled]}
              onPress={handleAddAppleWallet}
              disabled={hasApplePass}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.walletButtonText}>
                {hasApplePass ? '✓ In Apple Wallet' : 'Add to Apple Wallet'}
              </Text>
            </TouchableOpacity>
          ) : null}

          {Platform.OS === 'android' || Platform.OS === 'web' ? (
            <TouchableOpacity
              style={[styles.walletButton, styles.googleButton, hasGooglePass && styles.walletButtonDisabled]}
              onPress={handleAddGoogleWallet}
              disabled={hasGooglePass}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.walletButtonText}>
                {hasGooglePass ? '✓ In Google Wallet' : 'Add to Google Wallet'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Paused Card Reminder */}
        <Text style={styles.footerNote}>
          If your card is paused, both the NFC tap and this QR code will open the same paused page.
        </Text>

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.cancelButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.cancelButtonText}>Not now</Text>
        </TouchableOpacity>
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
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
  },
  passPreviewCard: {
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  passHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qrPlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 16,
  },
  passName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  passTagline: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  passLink: {
    fontSize: 11,
    color: '#2997FF',
    marginTop: 2,
    fontWeight: '600',
  },
  warningBox: {
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.3)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FBBF24',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
  infoCard: {
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  infoBullet: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 20,
  },
  actions: {
    gap: 12,
    marginBottom: 16,
  },
  walletButton: {
    backgroundColor: '#ffffff',
    borderRadius: 999,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButton: {
    backgroundColor: '#1c1c22',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  walletButtonDisabled: {
    opacity: 0.5,
  },
  walletButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
  footerNote: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
  },
  cancelButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
  },
});
