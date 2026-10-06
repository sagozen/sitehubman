/**
 * Payment Methods Screen
 * 
 * Standalone payment method management
 * Add, edit, remove payment methods
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/src/services/firebaseClient';
import { useAuth } from '@/src/hooks/useAuth';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { AppText } from '@/src/components/AppText';
import { AppButton } from '@/src/components/AppButton';
import { AppIcon } from '@/src/components/AppIcon';
import { EmptyState } from '@/src/components/EmptyState';
import { T } from '@/src/constants/theme';
import { HapticTap } from '@/src/utils/haptics';
import { CardListSkeleton } from '@/src/components/SkeletonLoader';

type PaymentMethodType = 'card' | 'aba' | 'khqr';

interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  isDefault: boolean;
  // Card
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  // Bank
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
}

const METHOD_ICONS: Record<PaymentMethodType, string> = {
  card: 'CreditCard',
  aba: 'Smartphone',
  khqr: 'QrCode',
};

const METHOD_LABELS: Record<PaymentMethodType, string> = {
  card: 'Credit/Debit Card',
  aba: 'ABA Bank',
  khqr: 'KHQR',
};

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = useCallback(async () => {
    try {
      setLoading(true);
      const methodsRef = collection(db, 'payment_methods');
      const methodsQuery = query(methodsRef, where('userId', '==', user?.id || ''));
      const methodsSnap = await getDocs(methodsQuery);

      const methodsData = methodsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PaymentMethod[];

      setMethods(methodsData);
    } catch (error) {
      console.error('[PaymentMethods] Load failed', error);
      // Mock data for demo
      setMethods([
        {
          id: 'pm_1',
          type: 'card',
          isDefault: true,
          last4: '4242',
          brand: 'Visa',
          expiryMonth: 12,
          expiryYear: 2026,
        },
        {
          id: 'pm_2',
          type: 'aba',
          isDefault: false,
          accountName: 'Thean Coc',
          accountNumber: '001234567',
          bankName: 'ABA Bank',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleAddMethod = useCallback(() => {
    HapticTap.medium();
    router.push('/payment/add-method' as any);
  }, [router]);

  const handleSetDefault = useCallback(async (methodId: string) => {
    HapticTap.light();
    setMethods((prev) =>
      prev.map((m) => ({ ...m, isDefault: m.id === methodId }))
    );
    // TODO: Update in Firestore
  }, []);

  const handleDeleteMethod = useCallback((method: PaymentMethod) => {
    HapticTap.error();
    Alert.alert(
      'Remove Payment Method',
      `Remove ${METHOD_LABELS[method.type]}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete from Firestore
              await deleteDoc(doc(db, 'payment_methods', method.id));
              setMethods((prev) => prev.filter((m) => m.id !== method.id));
              HapticTap.success();
            } catch (error) {
              console.error('[PaymentMethods] Delete failed', error);
            }
          },
        },
      ]
    );
  }, []);

  const renderMethod = useCallback(
    (method: PaymentMethod) => {
      const icon = METHOD_ICONS[method.type];
      const label = METHOD_LABELS[method.type];

      let displayText = '';
      if (method.type === 'card') {
        displayText = `${method.brand} •••• ${method.last4}`;
      } else if (method.type === 'aba') {
        displayText = `${method.bankName} •••• ${method.accountNumber?.slice(-4)}`;
      } else {
        displayText = 'KHQR Payment';
      }

      return (
        <View key={method.id} style={styles.methodCard}>
          <View style={styles.methodLeft}>
            <View style={styles.methodIcon}>
              <AppIcon name={icon as any} size={24} color={T.textPrimary} />
            </View>
            <View style={styles.methodInfo}>
              <AppText style={styles.methodLabel}>{label}</AppText>
              <AppText style={styles.methodDisplay}>{displayText}</AppText>
              {method.expiryMonth && method.expiryYear && (
                <AppText style={styles.methodExpiry}>
                  Exp. {method.expiryMonth}/{method.expiryYear}
                </AppText>
              )}
            </View>
          </View>

          <View style={styles.methodActions}>
            {method.isDefault ? (
              <View style={styles.defaultBadge}>
                <AppText style={styles.defaultText} weight="bold">
                  DEFAULT
                </AppText>
              </View>
            ) : (
              <Pressable
                style={styles.setDefaultBtn}
                onPress={() => handleSetDefault(method.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <AppText style={styles.setDefaultText}>Set Default</AppText>
              </Pressable>
            )}

            <Pressable
              onPress={() => handleDeleteMethod(method)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <AppIcon name="Trash2" size={18} color={T.textMuted} />
            </Pressable>
          </View>
        </View>
      );
    },
    [handleSetDefault, handleDeleteMethod]
  );

  const defaultMethod = useMemo(
    () => methods.find((m) => m.isDefault),
    [methods]
  );

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.container}>
          <CardListSkeleton />
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
            Payment Methods
          </AppText>
          <AppText style={styles.subtitle}>
            Manage your payment options
          </AppText>
        </View>

        {/* Default Method Highlight */}
        {defaultMethod && (
          <View style={styles.defaultSection}>
            <View style={styles.defaultHeader}>
              <AppIcon name="Star" size={20} color={T.accent} />
              <AppText style={styles.defaultTitle} weight="bold">
                Default Payment
              </AppText>
            </View>
            <AppText style={styles.defaultDesc}>
              This method will be used automatically for your purchases
            </AppText>
            <View style={styles.defaultMethodPreview}>
              <AppIcon
                name={METHOD_ICONS[defaultMethod.type] as any}
                size={28}
                color={T.textPrimary}
              />
              <View style={styles.defaultMethodInfo}>
                <AppText style={styles.defaultMethodLabel}>
                  {METHOD_LABELS[defaultMethod.type]}
                </AppText>
                <AppText style={styles.defaultMethodDisplay}>
                  {defaultMethod.type === 'card'
                    ? `${defaultMethod.brand} •••• ${defaultMethod.last4}`
                    : defaultMethod.type === 'aba'
                    ? `${defaultMethod.bankName} •••• ${defaultMethod.accountNumber?.slice(-4)}`
                    : 'KHQR Payment'}
                </AppText>
              </View>
            </View>
          </View>
        )}

        {/* All Methods List */}
        <View style={styles.section}>
          <AppText style={styles.sectionTitle} weight="bold">
            All Payment Methods ({methods.length})
          </AppText>

          {methods.length === 0 ? (
            <EmptyState
              icon="CreditCard"
              title="No payment methods"
              description="Add a payment method to start ordering"
              actionLabel="Add Payment Method"
              onAction={handleAddMethod}
            />
          ) : (
            <View style={styles.methodsList}>
              {methods.map(renderMethod)}
            </View>
          )}
        </View>

        {/* Add New Button */}
        {methods.length > 0 && (
          <AppButton
            title="Add Payment Method"
            onPress={handleAddMethod}
            variant="secondary"
            leftIcon="Plus"
            style={styles.addButton}
          />
        )}

        {/* Info Footer */}
        <View style={styles.infoBox}>
          <AppIcon name="Shield" size={16} color={T.textSecondary} />
          <AppText style={styles.infoText}>
            Your payment information is encrypted and stored securely
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
  container: {
    padding: 20,
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
  defaultSection: {
    backgroundColor: T.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  defaultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  defaultTitle: {
    fontSize: T.fontSizeMD,
    color: T.textPrimary,
  },
  defaultDesc: {
    fontSize: T.fontSizeSM,
    color: T.textSecondary,
    marginBottom: 16,
  },
  defaultMethodPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: T.surfaceRaised,
    borderRadius: 8,
    padding: 16,
  },
  defaultMethodInfo: {
    flex: 1,
  },
  defaultMethodLabel: {
    fontSize: T.fontSizeSM,
    color: T.textSecondary,
    marginBottom: 4,
  },
  defaultMethodDisplay: {
    fontSize: T.fontSizeMD,
    color: T.textPrimary,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: T.fontSizeMD,
    color: T.textPrimary,
    marginBottom: 16,
  },
  methodsList: {
    gap: 12,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: T.surface,
    borderRadius: 12,
    padding: 16,
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  methodIcon: {
    width: 48,
    height: 48,
    backgroundColor: T.surfaceRaised,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodInfo: {
    flex: 1,
    gap: 4,
  },
  methodLabel: {
    fontSize: T.fontSizeSM,
    color: T.textSecondary,
  },
  methodDisplay: {
    fontSize: T.fontSizeMD,
    color: T.textPrimary,
    fontWeight: '600',
  },
  methodExpiry: {
    fontSize: T.fontSizeXS,
    color: T.textMuted,
  },
  methodActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  defaultBadge: {
    backgroundColor: T.surfaceRaised,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  defaultText: {
    fontSize: T.fontSizeXS,
    color: T.accent,
    letterSpacing: 0.5,
  },
  setDefaultBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  setDefaultText: {
    fontSize: T.fontSizeSM,
    color: T.textSecondary,
  },
  addButton: {
    width: '100%',
    marginBottom: 24,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: T.surfaceRaised,
    borderRadius: 8,
    padding: 12,
  },
  infoText: {
    flex: 1,
    fontSize: T.fontSizeSM,
    color: T.textSecondary,
    lineHeight: 18,
  },
});
