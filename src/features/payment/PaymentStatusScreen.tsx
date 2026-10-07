/**
 * Payment Status Polling Screen
 * 
 * Real-time payment verification with QR display
 * Auto-refreshes until paid/expired
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, Linking, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { subscribePaymentIntent, type PaymentIntentStatus } from '@/src/services/paymentService';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { AppButton } from '@/src/components/AppButton';
import { T } from '@/src/constants/theme';
import { HapticTap } from '@/src/utils/haptics';

const POLL_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export default function PaymentStatusScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const intentId = params.intentId as string;

  const [status, setStatus] = useState<PaymentIntentStatus>('pending');
  const [qrPayload, setQrPayload] = useState<string>('');
  const [abaDeeplink, setAbaDeeplink] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [timeoutReached, setTimeoutReached] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!intentId) {
      setError('No payment intent ID provided');
      return;
    }

    // Start polling
    unsubscribeRef.current = subscribePaymentIntent(
      intentId,
      (intent) => {
        if (!intent) {
          setError('Payment intent not found');
          return;
        }

        setStatus(intent.status);
        setQrPayload(intent.qrPayload);
        setAbaDeeplink(intent.abaDeeplink || null);
        setExpiresAt(intent.expiresAt || '');

        // Handle status changes
        if (intent.status === 'paid') {
          HapticTap.success();
          // Redirect to receipt after short delay
          setTimeout(() => {
            router.replace(`/order-receipt/${intent.orderId}` as any);
          }, 2000);
        } else if (intent.status === 'failed') {
          HapticTap.error();
          setError(intent.failureReason || 'Payment failed');
        } else if (intent.status === 'expired') {
          setError('Payment QR code expired. Please try again.');
        }
      },
      (err) => {
        setError(err.message || 'Failed to load payment status');
      }
    );

    // Set timeout
    timeoutRef.current = setTimeout(() => {
      setTimeoutReached(true);
    }, POLL_TIMEOUT);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [intentId, router]);

  useEffect(() => {
    if (status === 'pending' || status === 'processing') {
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [status, pulseAnim]);

  const handleOpenAba = useCallback(async () => {
    if (!abaDeeplink) return;

    try {
      HapticTap.medium();
      const supported = await Linking.canOpenURL(abaDeeplink);
      if (supported) {
        await Linking.openURL(abaDeeplink);
      } else {
        setError('ABA Pay app not installed');
      }
    } catch (err: any) {
      setError('Failed to open ABA Pay');
    }
  }, [abaDeeplink]);

  const handleRetry = useCallback(() => {
    HapticTap.medium();
    router.back();
  }, [router]);

  const handleCancel = useCallback(() => {
    HapticTap.light();
    router.replace('/(tabs)/' as any);
  }, [router]);

  const getStatusIcon = () => {
    switch (status) {
      case 'paid':
        return 'CheckCircle';
      case 'failed':
      case 'expired':
        return 'XCircle';
      default:
        return 'Clock';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'paid':
        return T.textPrimary;
      case 'failed':
      case 'expired':
        return T.textMuted;
      default:
        return T.accent;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'paid':
        return 'Payment Successful!';
      case 'failed':
        return 'Payment Failed';
      case 'expired':
        return 'Payment Expired';
      case 'processing':
        return 'Processing Payment...';
      default:
        return 'Waiting for Payment';
    }
  };

  const getStatusSubtitle = () => {
    switch (status) {
      case 'paid':
        return 'Redirecting to your order...';
      case 'failed':
        return error || 'Please try again or choose another payment method';
      case 'expired':
        return 'This payment link has expired. Please create a new order.';
      case 'processing':
        return 'Confirming your payment...';
      default:
        return 'Scan QR code or tap button below to complete payment';
    }
  };

  return (
    <ScreenContainer>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Icon */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [
                {
                  scale:
                    status === 'pending' || status === 'processing'
                      ? pulseAnim
                      : 1,
                },
              ],
            },
          ]}
        >
          <View style={[styles.iconCircle, { borderColor: getStatusColor() }]}>
            <AppIcon
              name={getStatusIcon() as any}
              size={64}
              color={getStatusColor()}
            />
          </View>
        </Animated.View>

        {/* Status Text */}
        <AppText style={styles.statusTitle} weight="bold">
          {getStatusTitle()}
        </AppText>
        <AppText style={styles.statusSubtitle}>{getStatusSubtitle()}</AppText>

        {/* QR Code */}
        {(status === 'pending' || status === 'processing') && qrPayload && (
          <View style={styles.qrContainer}>
            <View style={styles.qrBox}>
              <QRCode value={qrPayload} size={200} backgroundColor={T.surface} color={T.textPrimary} />
            </View>
            <AppText style={styles.qrLabel}>
              Scan with your banking app
            </AppText>
          </View>
        )}

        {/* ABA Pay Button */}
        {abaDeeplink && (status === 'pending' || status === 'processing') && (
          <View style={styles.abaContainer}>
            <AppButton
              title="Open ABA Pay App"
              onPress={handleOpenAba}
              variant="primary"
              leftIcon="Smartphone"
              style={styles.abaButton}
            />
          </View>
        )}

        {/* Timer Warning */}
        {timeoutReached && status === 'pending' && (
          <View style={styles.warningBox}>
            <AppIcon name="Clock" size={16} color={T.textSecondary} />
            <AppText style={styles.warningText}>
              Still waiting? Payment link expires in {expiresAt ? new Date(expiresAt).toLocaleTimeString() : '30 minutes'}
            </AppText>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {status === 'failed' || status === 'expired' ? (
            <>
              <AppButton
                title="Try Again"
                onPress={handleRetry}
                variant="primary"
                style={styles.actionButton}
              />
              <AppButton
                title="Cancel"
                onPress={handleCancel}
                variant="secondary"
                style={styles.actionButton}
              />
            </>
          ) : status === 'pending' || status === 'processing' ? (
            <AppButton
              title="Cancel Payment"
              onPress={handleCancel}
              variant="secondary"
              style={styles.actionButton}
            />
          ) : null}
        </View>

        {/* Help Text */}
        <View style={styles.helpBox}>
          <AppText style={styles.helpText}>
            💡 Payment confirmation usually takes 5-30 seconds
          </AppText>
          <AppText style={styles.helpText}>
            🔒 Your payment is secure and encrypted
          </AppText>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 100,
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
    backgroundColor: T.surface,
  },
  statusTitle: {
    fontSize: 24,
    color: T.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  statusSubtitle: {
    fontSize: T.fontSizeMD,
    color: T.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  qrBox: {
    backgroundColor: T.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  qrLabel: {
    fontSize: T.fontSizeSM,
    color: T.textSecondary,
  },
  abaContainer: {
    width: '100%',
    marginBottom: 24,
  },
  abaButton: {
    width: '100%',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: T.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  warningText: {
    flex: 1,
    fontSize: T.fontSizeSM,
    color: T.textSecondary,
  },
  actions: {
    width: '100%',
    gap: 12,
    marginTop: 'auto',
  },
  actionButton: {
    width: '100%',
  },
  helpBox: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: T.border,
    width: '100%',
    gap: 12,
  },
  helpText: {
    fontSize: T.fontSizeSM,
    color: T.textMuted,
    textAlign: 'center',
  },
});
