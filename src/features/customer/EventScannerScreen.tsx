import { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Alert, Pressable, Animated } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { HapticTap, HapticPattern } from '@/src/utils/haptics';
import { captureLead } from '@/src/services/leadService';
import { useAuth } from '@/src/hooks/useAuth';
import { pageThemes } from '@/src/constants/pageThemes';
import { router } from 'expo-router';

const PAGE_THEME = pageThemes.leads;
const BRAND = PAGE_THEME.accent;

export function EventScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedCount, setScannedCount] = useState(0);
  const [lastScannedUrl, setLastScannedUrl] = useState<string | null>(null);
  
  const scanLockRef = useRef(false);
  const { user } = useAuth();
  const flashAnim = useRef(new Animated.Value(0)).current;

  // Keep screen active for high-speed scanning
  useEffect(() => {
    // In a real app we'd use `expo-keep-awake` here
  }, []);

  if (!permission) return <View style={styles.root} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <AppIcon name="Camera" size={48} color={BRAND} />
        <AppText style={styles.permissionTitle}>Camera Access Required</AppText>
        <AppText style={styles.permissionSub}>
          SiteHub needs your camera to scan event badges and QR codes.
        </AppText>
        <Pressable style={styles.permissionButton} onPress={requestPermission}>
          <AppText style={styles.permissionButtonText}>Grant Permission</AppText>
        </Pressable>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <AppText style={styles.backButtonText}>Cancel</AppText>
        </Pressable>
      </View>
    );
  }

  const triggerFlash = () => {
    Animated.sequence([
      Animated.timing(flashAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(flashAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanLockRef.current) return;
    
    // Simple debounce to prevent rapid duplicate scanning of the exact same code
    if (data === lastScannedUrl) return;

    scanLockRef.current = true;
    HapticPattern.tapSuccess();
    triggerFlash();
    setLastScannedUrl(data);
    setScannedCount(c => c + 1);

    try {
      // High-speed logging in the background without blocking the UI.
      if (user?.id) {
        // Attempt to parse standard vCard or URL from the QR
        const isUrl = data.startsWith('http');
        const capturedName = isUrl ? 'Event Lead (Scanned URL)' : 'Event Lead (Scanned Badge)';
        
        // Fire and forget
        captureLead({
          profileId: 'event_scan', // Mocked or active profile ID
          ownerUserId: user.id,
          name: capturedName,
          email: '',
          phone: '',
          note: `Scanned Data: ${data.substring(0, 50)}...`,
        }).catch(err => console.error('Silent capture failed', err));
      }
    } catch (e) {
      console.error(e);
    }

    // Unlock scanner very quickly for high-speed operation
    setTimeout(() => {
      scanLockRef.current = false;
    }, 1500); // 1.5 second cooldown between different badges
  };

  return (
    <View style={styles.root}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />
      
      {/* Scanner Overlay UI */}
      <View style={styles.overlay}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.closeBtn} onPress={() => router.back()}>
            <AppIcon name="X" size={24} color="#FFFFFF" />
          </Pressable>
          <View style={styles.badgeCounter}>
            <AppIcon name="Users" size={16} color="#FFFFFF" />
            <AppText style={styles.badgeText}>{scannedCount} Scanned</AppText>
          </View>
        </View>

        {/* Reticle */}
        <View style={styles.reticleContainer}>
          <View style={styles.reticleBorder} />
          <AppText style={styles.instructionText}>
            Align QR Code or Event Badge within frame
          </AppText>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerInfo}>
            <AppIcon name="Zap" size={18} color="#FFD60A" />
            <AppText style={styles.footerText}>
              High-Speed Mode Active. Leads are saved instantly in the background.
            </AppText>
          </View>
        </View>
      </View>

      {/* Success Flash Overlay */}
      <Animated.View 
        style={[
          StyleSheet.absoluteFillObject,
          styles.flashOverlay,
          { opacity: flashAnim }
        ]} 
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#000000',
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 8,
  },
  permissionSub: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: BRAND,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 99,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  backButton: {
    padding: 16,
  },
  backButtonText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Camera UI
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
  },
  closeBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  reticleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticleBorder: {
    width: 260,
    height: 260,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 32,
    marginBottom: 24,
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  footer: {
    paddingBottom: 20,
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  footerText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  flashOverlay: {
    backgroundColor: '#34C759', // Green flash on success
  },
});
