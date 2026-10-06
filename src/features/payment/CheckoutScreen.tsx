/**
 * Unified Checkout Screen
 * 
 * Single payment flow consolidating guest-checkout + guest-post-login-choice
 * Brand-compliant monochrome design
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/src/services/firebaseClient';
import { useAuth } from '@/src/hooks/useAuth';
import { initiatePayment } from '@/src/services/paymentService';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { AppButton } from '@/src/components/AppButton';
import { T } from '@/src/constants/theme';
import { HapticTap } from '@/src/utils/haptics';

type PaymentMethod = 'aba_pay' | 'khqr' | 'cod' | 'card';

interface OrderSummary {
  cardId: string;
  productType: string;
  quantity: number;
  amount: number;
  currency: string;
  customerName: string;
  phone: string;
}

export default function CheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const cardId = params.cardId as string;

  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadOrderSummary();
  }, [cardId]);

  const loadOrderSummary = useCallback(async () => {
    try {
      setLoading(true);
      // Load order from Firestore
      const orderRef = doc(db, 'orders', cardId);
      const orderSnap = await getDoc(orderRef);
      
      if (!orderSnap.exists()) {
        setError('Order not found');
        return;
      }

      const orderData = orderSnap.data();
      setOrder({
        cardId: orderSnap.id,
        productType: orderData.productType || 'nfc_card',
        quantity: orderData.quantity || 1,
        amount: orderData.amount || 49,
        currency: orderData.currency || 'USD',
        customerName: orderData.customerName || user?.displayName || '',
        phone: orderData.phone || '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [cardId, user]);

  const handleMethodSelect = useCallback((method: PaymentMethod) => {
    HapticTap.light();
    setSelectedMethod(method);
  }, []);

  const handleCheckout = useCallback(async () => {
    if (!selectedMethod || !order) return;

    try {
      HapticTap.medium();
      setProcessing(true);
      setError('');

      // Create payment intent
      const intent = await initiatePayment(order.cardId, selectedMethod);

      // Navigate to payment status screen
      router.push(`/payment/${intent.intentId}` as any);
    } catch (err: any) {
      setError(err.message || 'Payment failed');
      HapticTap.error();
    } finally {
      setProcessing(false);
    }
  }, [selectedMethod, order, router]);

  const paymentMethods = useMemo(() => [
    {
      id: 'aba_pay' as PaymentMethod,
      name: 'ABA Pay',
      subtitle: 'Instant mobile banking',
      icon: 'Smartphone',
      available: true,
    },
    {
      id: 'khqr' as PaymentMethod,
      name: 'KHQR / Bakong',
      subtitle: 'Scan QR code to pay',
      icon: 'QrCode',
      available: true,
    },
    {
      id: 'cod' as PaymentMethod,
      name: 'Cash on Delivery',
      subtitle: 'Pay when you receive',
      icon: 'Wallet',
      available: true,
    },
    {
      id: 'card' as PaymentMethod,
      name: 'Credit / Debit Card',
      subtitle: 'Coming soon',
      icon: 'CreditCard',
      available: false,
    },
  ], []);

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <AppText style={styles.loadingText}>Loading checkout...</AppText>
        </View>
      </ScreenContainer>
    );
  }

  if (error && !order) {
    return (
      <ScreenContainer>
        <View style={styles.errorContainer}>
          <AppIcon name="AlertCircle" size={48} color={T.textMuted} />
          <AppText style={styles.errorTitle} weight="bold">
            Checkout Error
          </AppText>
          <AppText style={styles.errorText}>{error}</AppText>
          <AppButton
            title="Go Back"
            onPress={() => router.back()}
            variant="secondary"
            style={styles.errorButton}
          />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <AppText style={styles.title} weight="bold">
            Checkout
          </AppText>
          <AppText style={styles.subtitle}>
            Choose your payment method
          </AppText>
        </View>

        {/* Order Summary */}
        {order && (
          <View style={styles.summaryCard}>
            <AppText style={styles.summaryTitle} weight="bold">
              Order Summary
            </AppText>
            <View style={styles.summaryRow}>
              <AppText style={styles.summaryLabel}>Product</AppText>
              <AppText style={styles.summaryValue}>
                {order.productType.replace(/_/g, ' ')}
              </AppText>
            </View>
            <View style={styles.summaryRow}>
              <AppText style={styles.summaryLabel}>Quantity</AppText>
              <AppText style={styles.summaryValue}>{order.quantity}x</AppText>
            </View>
            <View style={styles.summaryRow}>
              <AppText style={styles.summaryLabel}>Customer</AppText>
              <AppText style={styles.summaryValue}>{order.customerName}</AppText>
            </View>
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <AppText style={styles.totalLabel} weight="bold">
                Total
              </AppText>
              <AppText style={styles.totalValue} weight="bold">
                {order.currency} {order.amount.toFixed(2)}
              </AppText>
            </View>
          </View>
        )}

        {/* Payment Methods */}
        <View style={styles.methodsSection}>
          <AppText style={styles.sectionTitle} weight="bold">
            Payment Method
          </AppText>
          {paymentMethods.map((method) => (
            <Pressable
              key={method.id}
              style={[
                styles.methodCard,
                selectedMethod === method.id && styles.methodCardSelected,
                !method.available && styles.methodCardDisabled,
              ]}
              onPress={() => method.available && handleMethodSelect(method.id)}
              disabled={!method.available}
            >
              <View style={styles.methodIcon}>
                <AppIcon
                  name={method.icon as any}
                  size={24}
                  color={
                    !method.available
                      ? T.textMuted
                      : selectedMethod === method.id
                      ? T.accent
                      : T.textPrimary
                  }
                />
              </View>
              <View style={styles.methodInfo}>
                <AppText
                  style={[
                    styles.methodName,
                    !method.available && styles.methodNameDisabled,
                  ]}
                  weight="bold"
                >
                  {method.name}
                </AppText>
                <AppText
                  style={[
                    styles.methodSubtitle,
                    !method.available && styles.methodSubtitleDisabled,
                  ]}
                >
                  {method.subtitle}
                </AppText>
              </View>
              {selectedMethod === method.id && (
                <View style={styles.selectedIndicator}>
                  <AppIcon name="CheckCircle" size={20} color={T.accent} />
                </View>
              )}
            </Pressable>
          ))}
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorBanner}>
            <AppIcon name="AlertTriangle" size={16} color={T.textPrimary} />
            <AppText style={styles.errorBannerText}>{error}</AppText>
          </View>
        )}

        {/* CTA */}
        <View style={styles.footer}>
          <AppButton
            title={processing ? 'Processing...' : 'Continue to Payment'}
            onPress={handleCheckout}
            variant="primary"
            disabled={!selectedMethod || processing}
            style={styles.checkoutButton}
            leftIcon={processing ? undefined : 'Lock'}
          />
          <AppText style={styles.secureText}>
            🔒 Secure encrypted payment
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
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 15,
    color: T.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    color: T.textPrimary,
    marginTop: 20,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: T.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    minWidth: 200,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: T.fontSizeXL,
    color: T.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: T.fontSizeMD,
    color: T.textSecondary,
  },
  summaryCard: {
    backgroundColor: T.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: T.fontSizeLG,
    color: T.textPrimary,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: T.fontSizeMD,
    color: T.textSecondary,
  },
  summaryValue: {
    fontSize: T.fontSizeMD,
    color: T.textPrimary,
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: T.border,
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: T.fontSizeLG,
    color: T.textPrimary,
  },
  totalValue: {
    fontSize: T.fontSizeLG,
    color: T.textPrimary,
  },
  methodsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: T.fontSizeLG,
    color: T.textPrimary,
    marginBottom: 16,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodCardSelected: {
    borderColor: T.accent,
    backgroundColor: T.surfaceRaised,
  },
  methodCardDisabled: {
    opacity: 0.5,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: T.surfaceRaised,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: T.fontSizeMD,
    color: T.textPrimary,
    marginBottom: 4,
  },
  methodNameDisabled: {
    color: T.textMuted,
  },
  methodSubtitle: {
    fontSize: T.fontSizeSM,
    color: T.textSecondary,
  },
  methodSubtitleDisabled: {
    color: T.textMuted,
  },
  selectedIndicator: {
    marginLeft: 12,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: T.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  errorBannerText: {
    flex: 1,
    fontSize: T.fontSizeSM,
    color: T.textPrimary,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 24,
  },
  checkoutButton: {
    width: '100%',
  },
  secureText: {
    fontSize: T.fontSizeSM,
    color: T.textSecondary,
    textAlign: 'center',
    marginTop: 12,
  },
});
