import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { AppButton } from '@/src/components/AppButton';
import { AppCard } from '@/src/components/AppCard';
import { AppIcon } from '@/src/components/AppIcon';
import { PageHeader } from '@/src/components/PageHeader';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { AppText } from '@/src/components/AppText';
import { pageThemes } from '@/src/constants/pageThemes';
import { theme } from '@/src/constants/theme';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';
import { parseScanPayloadToSlug } from '@/src/utils/guestScan';

export function GuestScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [lastScan, setLastScan] = useState<string | null>(null);
  const { requireAccount } = useRequireAccount();
  const radar = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(radar, {
        toValue: 1,
        duration: 1900,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [radar]);

  const openSlug = useCallback((slug: string) => {
    router.push(`/public/${slug}`);
  }, []);

  const onBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (data === lastScan) return;
      setLastScan(data);
      const slug = parseScanPayloadToSlug(data);
      if (slug) {
        openSlug(slug);
      }
    },
    [lastScan, openSlug]
  );

  return (
    <ScreenContainer isDark={true} contentStyle={styles.content}>
      <PageHeader
        theme={pageThemes.scan}
        eyebrow="Camera utility"
        title="Scan"
        subtitle="Read a QR identity and open its live profile."
        icon="ScanLine"
        showBack={router.canGoBack()}
        compact
      />

      {!permission?.granted ? (
        <AppCard style={styles.permissionCard}>
          <AppIcon name="ScanLine" size={32} color={theme.colors.primary} />
          <AppText variant="body" tone="muted">
            Camera access lets you scan real profile QR codes from Firebase.
          </AppText>
          <AppButton label="Enable Camera" onPress={() => void requestPermission()} />
        </AppCard>
      ) : (
        <View style={styles.cameraWrap}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={onBarcodeScanned}
          />
          <View style={styles.cameraOverlay}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.radarPulse,
                {
                  opacity: radar.interpolate({ inputRange: [0, 0.72, 1], outputRange: [0.34, 0.08, 0] }),
                  transform: [{ scale: radar.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1.35] }) }],
                },
              ]}
            />
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <AppText variant="caption" tone="inverse" style={styles.overlayText}>
              Point at a public profile QR code
            </AppText>
          </View>
        </View>
      )}

      <AppButton
        label="Generate my QR"
        variant="outline"
        iconName="QrCode"
        onPress={() =>
          requireAccount(undefined, {
            message: 'Create an account to generate your personal QR and NFC identity.',
          })
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { backgroundColor: pageThemes.scan.canvas },
  permissionCard: {
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.xl,
  },
  cameraWrap: {
    height: 280,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: pageThemes.scan.border,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  overlayText: {
    position: 'absolute',
    bottom: theme.spacing.md,
    textAlign: 'center',
    color: '#fff',
  },
  radarPulse: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  scanFrame: {
    width: 210,
    height: 210,
    borderRadius: 8,
  },
  corner: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderColor: 'rgba(255,255,255,0.86)',
    borderWidth: 3,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 14 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 14 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 14 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 14 },
});
