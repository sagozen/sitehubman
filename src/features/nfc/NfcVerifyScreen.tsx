/**
 * NFC Verification Screen
 * 
 * Post-write quality control with retry mechanism
 * Ensures NFC tags are properly encoded before shipping
 */

import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { AppButton } from '@/src/components/AppButton';
import { theme } from '@/src/constants/theme';
import { HapticTap } from '@/src/utils/haptics';
import { verifyNfcUrl } from '@/src/services/nfcEncryptionService';
import { isNfcAvailable, startNfcManager, readNfcTag } from '@/src/services/nfcManagerService';

type VerificationStatus = 'idle' | 'scanning' | 'verifying' | 'success' | 'failed';

interface VerificationResult {
  urlRead: boolean;
  signatureValid: boolean;
  cardIdMatch: boolean;
  tagWritable: boolean;
}

export default function NfcVerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const expectedCardId = params.cardId as string | undefined;

  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [scaleAnim] = useState(new Animated.Value(1));
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (status === 'scanning') {
      // Pulse animation during scan
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [status, pulseAnim]);

  const animateIcon = useCallback((success: boolean) => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    if (success) {
      HapticTap.success();
    } else {
      HapticTap.error();
    }
  }, [scaleAnim]);

  const handleStartVerification = useCallback(async () => {
    try {
      const nfcSupported = await isNfcAvailable();
      if (!nfcSupported) {
        setErrorMessage('NFC is not available on this device');
        setStatus('failed');
        return;
      }

      HapticTap.medium();
      setStatus('scanning');
      setErrorMessage('');

      await startNfcManager();

      // Read NFC tag
      const tagData = await readNfcTag();
      if (!tagData) {
        setErrorMessage('Failed to read NFC tag');
        setStatus('failed');
        animateIcon(false);
        return;
      }

      setStatus('verifying');

      // Verify URL signature
      const anyTag = tagData as any;
      const url = anyTag.url || '';
      const cardId = await verifyNfcUrl(url);

      const verificationResult: VerificationResult = {
        urlRead: !!url,
        signatureValid: !!cardId,
        cardIdMatch: expectedCardId ? cardId === expectedCardId : true,
        tagWritable: !anyTag.isLocked,
      };

      setResult(verificationResult);

      // Check if all verifications passed
      const allPassed = Object.values(verificationResult).every((v) => v === true);

      if (allPassed) {
        setStatus('success');
        animateIcon(true);
      } else {
        setStatus('failed');
        animateIcon(false);

        // Generate error message
        if (!verificationResult.urlRead) {
          setErrorMessage('No URL found on tag');
        } else if (!verificationResult.signatureValid) {
          setErrorMessage('Invalid signature - possible clone');
        } else if (!verificationResult.cardIdMatch) {
          setErrorMessage(`Wrong card! Expected ${expectedCardId}, got ${cardId}`);
        } else if (!verificationResult.tagWritable) {
          setErrorMessage('Tag is locked (expected for production)');
        }
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Verification failed');
      setStatus('failed');
      animateIcon(false);
    }
  }, [expectedCardId, animateIcon]);

  const handleRetry = useCallback(() => {
    HapticTap.medium();
    setStatus('idle');
    setResult(null);
    setErrorMessage('');
  }, []);

  const handleRewrite = useCallback(() => {
    HapticTap.medium();
    router.replace('/nfc/write' as any);
  }, [router]);

  const handleMarkDefective = useCallback(() => {
    HapticTap.medium();
    // TODO: Mark tag as defective in Firestore
    router.back();
  }, [router]);

  const handleComplete = useCallback(() => {
    HapticTap.success();
    router.back();
  }, [router]);

  const getStatusIcon = () => {
    switch (status) {
      case 'idle':
        return 'Scan';
      case 'scanning':
        return 'Radio';
      case 'verifying':
        return 'Search';
      case 'success':
        return 'CheckCircle';
      case 'failed':
        return 'XCircle';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return '#FFFFFF'; // Monochrome success
      case 'failed':
        return theme.colors.textMuted; // Monochrome error
      case 'scanning':
      case 'verifying':
        return theme.colors.primary; // Use brand accent only
      default:
        return theme.colors.primary;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'idle':
        return 'Ready to Verify';
      case 'scanning':
        return 'Scanning NFC Tag...';
      case 'verifying':
        return 'Verifying Data...';
      case 'success':
        return 'Verification Passed!';
      case 'failed':
        return 'Verification Failed';
    }
  };

  const renderVerificationChecks = () => {
    if (!result) return null;

    const checks = [
      { label: 'URL readable', passed: result.urlRead },
      { label: 'Signature valid', passed: result.signatureValid },
      { label: 'Card ID match', passed: result.cardIdMatch },
      { label: 'Tag writable', passed: result.tagWritable },
    ];

    return (
      <View style={styles.checksContainer}>
        <AppText style={styles.checksTitle} weight="bold">
          Verification Checks:
        </AppText>
        {checks.map((check, index) => (
          <View key={index} style={styles.checkRow}>
            <AppIcon
              name={check.passed ? 'CheckCircle' : 'XCircle'}
              size={20}
              color={check.passed ? '#FFFFFF' : '#FF453A'}
            />
            <AppText style={styles.checkLabel}>{check.label}</AppText>
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [
                {
                  scale: status === 'scanning' ? pulseAnim : scaleAnim,
                },
              ],
            },
          ]}
        >
          <View style={[styles.iconCircle, { borderColor: getStatusColor() }]}>
            <AppIcon name={getStatusIcon() as any} size={64} color={getStatusColor()} />
          </View>
        </Animated.View>

        <AppText style={styles.title} weight="bold">
          {getStatusTitle()}
        </AppText>

        {status === 'idle' && (
          <AppText style={styles.subtitle}>
            Hold your phone near the NFC tag to verify it was written correctly
          </AppText>
        )}

        {status === 'scanning' && (
          <AppText style={styles.subtitle}>
            Keep your phone steady against the tag...
          </AppText>
        )}

        {status === 'verifying' && (
          <AppText style={styles.subtitle}>
            Checking signature and card data...
          </AppText>
        )}

        {status === 'success' && (
          <AppText style={styles.subtitle}>
            Tag verified successfully! Ready for shipping.
          </AppText>
        )}

        {status === 'failed' && errorMessage && (
          <AppText style={[styles.subtitle, styles.errorText]}>
            {errorMessage}
          </AppText>
        )}

        {renderVerificationChecks()}

        <View style={styles.actions}>
          {status === 'idle' && (
            <AppButton
              title="Start Verification"
              onPress={handleStartVerification}
              variant="primary"
              leftIcon="Scan"
              style={styles.actionButton}
            />
          )}

          {status === 'scanning' && (
            <AppText style={styles.scanningText}>Scanning...</AppText>
          )}

          {status === 'success' && (
            <>
              <AppButton
                title="Verify Another"
                onPress={handleRetry}
                variant="secondary"
                style={styles.actionButton}
              />
              <AppButton
                title="Complete"
                onPress={handleComplete}
                variant="primary"
                style={styles.actionButton}
              />
            </>
          )}

          {status === 'failed' && (
            <>
              <AppButton
                title="Try Again"
                onPress={handleRetry}
                variant="secondary"
                style={styles.actionButton}
              />
              <AppButton
                title="Rewrite Tag"
                onPress={handleRewrite}
                variant="primary"
                style={styles.actionButton}
              />
              <AppButton
                title="Mark as Defective"
                onPress={handleMarkDefective}
                variant="danger"
                style={styles.actionButton}
              />
            </>
          )}
        </View>

        {expectedCardId && (
          <View style={styles.infoBox}>
            <AppText style={styles.infoLabel}>Expected Card ID:</AppText>
            <AppText style={styles.infoValue}>{expectedCardId}</AppText>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 60,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0E0E11',
  },
  title: {
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#9A9AA0',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#FF453A',
  },
  checksContainer: {
    width: '100%',
    backgroundColor: '#0E0E11',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
  },
  checksTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  checkLabel: {
    fontSize: 14,
    color: '#9A9AA0',
  },
  actions: {
    width: '100%',
    gap: 12,
    marginTop: 'auto',
    paddingBottom: 40,
  },
  actionButton: {
    width: '100%',
  },
  scanningText: {
    fontSize: 16,
    color: '#9A9AA0',
    textAlign: 'center',
  },
  infoBox: {
    width: '100%',
    backgroundColor: '#0E0E11',
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
  },
  infoLabel: {
    fontSize: 12,
    color: '#9A9AA0',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
});
