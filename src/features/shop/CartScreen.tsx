/**
 * CartScreen — 43 Cart & Bag Overview (Apple Wallet × Stripe × Linear)
 *
 * Implements:
 * 43 — Cart & Bag
 * - Item breakdown (Material, custom engraving name, quantity stepper)
 * - Pricing calculator
 * - One-tap Checkout & Apple Pay
 */
import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { IosScrollView } from '@/src/components/IosScrollView';
import { HapticTap } from '@/src/utils/haptics';

const C = {
  canvas: '#0D0D0E',
  surface: '#242424',
  surfaceRaised: '#2C2C2C',
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.15)',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  textMuted: '#636366',
  accent: '#799A85',
  danger: '#FF453A',
} as const;

interface CartItem {
  id: string;
  name: string;
  material: string;
  engravedName: string;
  price: number;
  qty: number;
}

export default function CartScreen() {
  const [items, setItems] = useState<CartItem[]>([
    {
      id: 'cart-1',
      name: 'Custom Metal NFC Card',
      material: 'Matte Black Stainless Steel',
      engravedName: 'THEAN COC',
      price: 69.0,
      qty: 1,
    },
    {
      id: 'cart-2',
      name: 'Backup PVC NFC Card',
      material: 'Recycled Matte Black PVC',
      engravedName: 'THEAN COC',
      price: 19.0,
      qty: 2,
    },
  ]);

  const handleQtyChange = useCallback((id: string, delta: number) => {
    HapticTap.light();
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.qty + delta;
            return nextQty > 0 ? { ...item, qty: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  }, []);

  const subtotal = items.reduce((acc, curr) => acc + curr.price * curr.qty, 0);
  const shipping = subtotal > 50 ? 0 : 5.0;
  const total = subtotal + shipping;

  const handleCheckout = useCallback(() => {
    HapticTap.confidentClick();
    router.push('/payments/checkout/new' as any);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            HapticTap.light();
            router.back();
          }}
          hitSlop={12}
          style={styles.backBtn}
        >
          <AppIcon name="ChevronLeft" size={24} color={C.text} />
        </Pressable>
        <AppText style={styles.headerTitle} weight="bold">
          Your Bag
        </AppText>
        <View style={{ width: 24 }} />
      </View>

      <IosScrollView contentContainerStyle={styles.scroll}>
        {items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <AppIcon name="ShoppingBag" size={48} color={C.textMuted} />
            <AppText style={styles.emptyTitle} weight="bold">
              Your bag is empty
            </AppText>
            <AppText style={styles.emptySub}>
              Explore our premium NFC hardware collection in the store.
            </AppText>
            <Pressable
              style={styles.exploreBtn}
              onPress={() => router.push('/(tabs)/orders' as any)}
            >
              <AppText style={styles.exploreText} weight="bold">
                Shop Cards
              </AppText>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Cart Items */}
            <View style={styles.itemsGroup}>
              {items.map((item) => (
                <View key={item.id} style={styles.cardItem}>
                  <View style={styles.itemThumb}>
                    <AppIcon name="CreditCard" size={24} color={C.accent} />
                  </View>
                  <View style={styles.itemContent}>
                    <AppText style={styles.itemName} weight="bold">
                      {item.name}
                    </AppText>
                    <AppText style={styles.itemMaterial}>{item.material}</AppText>
                    <AppText style={styles.itemEngraving}>
                      Laser: "{item.engravedName}"
                    </AppText>
                    <AppText style={styles.itemPrice} weight="bold">
                      ${item.price.toFixed(2)}
                    </AppText>
                  </View>

                  {/* Quantity Stepper */}
                  <View style={styles.stepper}>
                    <Pressable
                      style={styles.stepperBtn}
                      onPress={() => handleQtyChange(item.id, -1)}
                      hitSlop={6}
                    >
                      <AppIcon name="Minus" size={14} color={C.text} />
                    </Pressable>
                    <AppText style={styles.stepperQty} weight="bold">
                      {item.qty}
                    </AppText>
                    <Pressable
                      style={styles.stepperBtn}
                      onPress={() => handleQtyChange(item.id, 1)}
                      hitSlop={6}
                    >
                      <AppIcon name="Plus" size={14} color={C.text} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>

            {/* Summary Box */}
            <View style={styles.summaryCard}>
              <AppText style={styles.summaryHeader} weight="bold">
                Order Summary
              </AppText>

              <View style={styles.summaryRow}>
                <AppText style={styles.summaryLabel}>Subtotal</AppText>
                <AppText style={styles.summaryValue}>${subtotal.toFixed(2)}</AppText>
              </View>

              <View style={styles.summaryRow}>
                <AppText style={styles.summaryLabel}>Express Courier Delivery</AppText>
                <AppText style={styles.summaryValue}>
                  {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                </AppText>
              </View>

              <View style={styles.divider} />

              <View style={styles.summaryRow}>
                <AppText style={styles.totalLabel} weight="bold">
                  Total
                </AppText>
                <AppText style={styles.totalValue} weight="bold">
                  ${total.toFixed(2)}
                </AppText>
              </View>
            </View>

            {/* Apple Pay & Checkout */}
            <Pressable
              style={({ pressed }) => [styles.checkoutBtn, pressed && styles.btnPressed]}
              onPress={handleCheckout}
            >
              <AppIcon name="Lock" size={18} color="#FFFFFF" />
              <AppText style={styles.checkoutText} weight="bold">
                Proceed to Checkout • ${total.toFixed(2)}
              </AppText>
            </Pressable>
          </>
        )}
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    color: C.text,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 18,
  },
  itemsGroup: {
    gap: 12,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 16,
    borderColor: C.border,
  },
  itemThumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: C.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    color: C.text,
  },
  itemMaterial: {
    fontSize: 12,
    color: C.textSecondary,
    marginTop: 2,
  },
  itemEngraving: {
    fontSize: 11,
    color: C.textMuted,
    marginTop: 2,
    fontStyle: 'italic',
  },
  itemPrice: {
    fontSize: 14,
    color: C.accent,
    marginTop: 4,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surfaceRaised,
    borderRadius: 12,
    padding: 4,
    gap: 10,
    borderColor: C.border,
  },
  stepperBtn: {
    padding: 6,
  },
  stepperQty: {
    fontSize: 13,
    color: C.text,
  },
  summaryCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 18,
    borderColor: C.border,
  },
  summaryHeader: {
    fontSize: 15,
    color: C.text,
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  summaryLabel: {
    fontSize: 13,
    color: C.textSecondary,
  },
  summaryValue: {
    fontSize: 13,
    color: C.text,
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 15,
    color: C.text,
  },
  totalValue: {
    fontSize: 17,
    color: C.accent,
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.accent,
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  btnPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  checkoutText: {
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    color: C.text,
    marginTop: 16,
  },
  emptySub: {
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 260,
  },
  exploreBtn: {
    marginTop: 20,
    backgroundColor: C.accent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  exploreText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
});
