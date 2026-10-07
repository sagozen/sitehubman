/**
 * Reorder Screen
 * 
 * One-tap reorder with cart preview
 * Monochrome brand-compliant design
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/src/services/firebaseClient';
import { useAuth } from '@/src/hooks/useAuth';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { AppText } from '@/src/components/AppText';
import { AppButton } from '@/src/components/AppButton';
import { AppIcon } from '@/src/components/AppIcon';
import { T } from '@/src/constants/theme';
import { HapticTap } from '@/src/utils/haptics';
import { OrderCardSkeleton } from '@/src/components/SkeletonLoader';

interface OrderItem {
  id: string;
  cardType: string;
  quantity: number;
  pricePerUnit: number;
  design?: {
    templateId: string;
    customizations: any;
  };
  preview?: string;
}

interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: string;
  createdAt: any;
  shippingAddress?: any;
}

export default function ReorderScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = useCallback(async () => {
    try {
      setLoading(true);
      const orderRef = doc(db, 'orders', orderId as string);
      const orderSnap = await getDoc(orderRef);

      if (orderSnap.exists()) {
        const orderData = { id: orderSnap.id, ...orderSnap.data() } as Order;
        setOrder(orderData);
        // Select all items by default
        setSelectedItems(new Set(orderData.items.map((item) => item.id)));
      }
    } catch (error) {
      console.error('[Reorder] Load failed', error);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  const toggleItemSelection = useCallback((itemId: string) => {
    HapticTap.light();
    setSelectedItems((prev) => {
      const updated = new Set(prev);
      if (updated.has(itemId)) {
        updated.delete(itemId);
      } else {
        updated.add(itemId);
      }
      return updated;
    });
  }, []);

  const handleReorder = useCallback(async () => {
    if (!order || selectedItems.size === 0) return;

    HapticTap.success();

    // Build cart from selected items
    const cartItems = order.items.filter((item) => selectedItems.has(item.id));

    // TODO: Add items to cart collection
    // For now, navigate to checkout with items
    const cartData = {
      items: cartItems,
      reorderFromId: order.id,
    };

    // Navigate to cart or checkout
    router.push('/(tabs)/share' as any);
  }, [order, selectedItems, router]);

  const selectedTotal = useCallback(() => {
    if (!order) return 0;
    return order.items
      .filter((item) => selectedItems.has(item.id))
      .reduce((sum, item) => sum + item.quantity * item.pricePerUnit, 0);
  }, [order, selectedItems]);

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.container}>
          <OrderCardSkeleton />
        </View>
      </ScreenContainer>
    );
  }

  if (!order) {
    return (
      <ScreenContainer>
        <View style={styles.emptyContainer}>
          <AppIcon name="AlertCircle" size={48} color={T.textMuted} />
          <AppText style={styles.emptyText}>Order not found</AppText>
          <AppButton
            title="Go Back"
            onPress={() => router.back()}
            variant="secondary"
            style={styles.emptyButton}
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
            Reorder
          </AppText>
          <AppText style={styles.subtitle}>
            Order #{order.id.slice(-8)}
          </AppText>
        </View>

        {/* Original Order Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <AppIcon name="Calendar" size={16} color={T.textSecondary} />
            <AppText style={styles.infoLabel}>Original Order Date:</AppText>
            <AppText style={styles.infoValue} weight="bold">
              {order.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
            </AppText>
          </View>
          <View style={styles.infoRow}>
            <AppIcon name="DollarSign" size={16} color={T.textSecondary} />
            <AppText style={styles.infoLabel}>Original Total:</AppText>
            <AppText style={styles.infoValue} weight="bold">
              ${order.total.toFixed(2)}
            </AppText>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionBox}>
          <AppText style={styles.instructionText}>
            Select items to reorder. Tap any item to toggle.
          </AppText>
        </View>

        {/* Items List */}
        <View style={styles.itemsList}>
          <AppText style={styles.sectionTitle} weight="bold">
            Items ({order.items.length})
          </AppText>
          {order.items.map((item) => {
            const isSelected = selectedItems.has(item.id);

            return (
              <View
                key={item.id}
                style={[styles.itemCard, isSelected && styles.itemCardSelected]}
                onTouchEnd={() => toggleItemSelection(item.id)}
              >
                {/* Selection Indicator */}
                <View style={styles.itemCheckbox}>
                  {isSelected ? (
                    <AppIcon name="CheckCircle" size={24} color={T.accent} />
                  ) : (
                    <View style={styles.itemCheckboxEmpty} />
                  )}
                </View>

                {/* Item Preview */}
                {item.preview && (
                  <Image
                    source={{ uri: item.preview }}
                    style={styles.itemPreview}
                    resizeMode="cover"
                  />
                )}

                {/* Item Details */}
                <View style={styles.itemDetails}>
                  <AppText style={styles.itemType} weight="bold">
                    {item.cardType}
                  </AppText>
                  <AppText style={styles.itemQuantity}>
                    Qty: {item.quantity}
                  </AppText>
                </View>

                {/* Price */}
                <View style={styles.itemPrice}>
                  <AppText style={styles.itemPriceValue} weight="bold">
                    ${(item.quantity * item.pricePerUnit).toFixed(2)}
                  </AppText>
                  <AppText style={styles.itemPriceUnit}>
                    ${item.pricePerUnit.toFixed(2)} each
                  </AppText>
                </View>
              </View>
            );
          })}
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <AppText style={styles.summaryLabel}>Selected Items:</AppText>
            <AppText style={styles.summaryValue} weight="bold">
              {selectedItems.size}
            </AppText>
          </View>
          <View style={styles.summaryRow}>
            <AppText style={styles.summaryLabel}>New Total:</AppText>
            <AppText style={styles.summaryTotal} weight="bold">
              ${selectedTotal().toFixed(2)}
            </AppText>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <AppButton
            title={`Add ${selectedItems.size} Item${selectedItems.size !== 1 ? 's' : ''} to Cart`}
            onPress={handleReorder}
            variant="primary"
            disabled={selectedItems.size === 0}
            leftIcon="ShoppingCart"
            style={styles.actionButton}
          />
          <AppButton
            title="Cancel"
            onPress={() => router.back()}
            variant="secondary"
            style={styles.actionButton}
          />
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
    paddingBottom: 100,
  },
  container: {
    padding: 20,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: T.fontSizeXL,
    color: T.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: T.fontSizeMD,
    color: T.textSecondary,
    fontFamily: 'monospace',
  },
  infoCard: {
    backgroundColor: T.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: T.fontSizeSM,
    color: T.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: T.fontSizeSM,
    color: T.textPrimary,
  },
  instructionBox: {
    backgroundColor: T.surfaceRaised,
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  instructionText: {
    fontSize: T.fontSizeSM,
    color: T.textSecondary,
    textAlign: 'center',
  },
  itemsList: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: T.fontSizeMD,
    color: T.textPrimary,
    marginBottom: 16,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  itemCardSelected: {
    borderColor: T.accent,
    backgroundColor: T.surfaceRaised,
  },
  itemCheckbox: {
    width: 24,
    height: 24,
  },
  itemCheckboxEmpty: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: T.border,
  },
  itemPreview: {
    width: 60,
    height: 40,
    borderRadius: 8,
    backgroundColor: T.surfaceRaised,
  },
  itemDetails: {
    flex: 1,
    gap: 4,
  },
  itemType: {
    fontSize: T.fontSizeMD,
    color: T.textPrimary,
  },
  itemQuantity: {
    fontSize: T.fontSizeSM,
    color: T.textSecondary,
  },
  itemPrice: {
    alignItems: 'flex-end',
    gap: 2,
  },
  itemPriceValue: {
    fontSize: T.fontSizeMD,
    color: T.textPrimary,
  },
  itemPriceUnit: {
    fontSize: T.fontSizeXS,
    color: T.textMuted,
  },
  summaryCard: {
    backgroundColor: T.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontSize: T.fontSizeXL,
    color: T.textPrimary,
  },
  actions: {
    gap: 12,
  },
  actionButton: {
    width: '100%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  emptyText: {
    fontSize: T.fontSizeLG,
    color: T.textMuted,
  },
  emptyButton: {
    marginTop: 16,
  },
});
