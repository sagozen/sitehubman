/**
 * OrdersTabScreen — 08 Orders & NFC Shop
 * Luxury Minimalist (Apple Wallet × Stripe × Linear)
 */
import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { IosScrollView } from '@/src/components/IosScrollView';
import { HapticTap } from '@/src/utils/haptics';

const C = {
  canvas: '#000000',
  surface: '#0E0E11',
  surfaceSoft: '#141418',
  hairline: 'rgba(255, 255, 255, 0.06)',
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#52525B',
  accent: '#2596BE',
  cardBg: '#0B0B0E',
} as const;

interface Product {
  id: string;
  name: string;
  price: string;
  tag: string;
}

interface Order {
  id: string;
  orderNumber: string;
  productName: string;
  status: 'production' | 'shipped' | 'delivered';
  date: string;
}

const PRODUCTS: Product[] = [
  { id: 'metal_card', name: 'Black Metal', price: '$49', tag: 'AEROSPACE GRADE' },
  { id: 'pvc_card', name: 'Matte PVC', price: '$19', tag: 'RECYCLED POLYMER' },
  { id: 'premium_card', name: 'Raw Brass', price: '$79', tag: 'SOLID ALLOY' },
  { id: 'custom_card', name: 'CNC Custom', price: '$99', tag: 'BESPOKE' },
];

const MOCK_ORDERS: Order[] = [
  { id: 'ord_1', orderNumber: '#10294', productName: 'Black Metal NFC Card', status: 'production', date: 'Today' },
  { id: 'ord_2', orderNumber: '#10281', productName: 'Matte PVC Card', status: 'delivered', date: 'Sep 28' },
];

const STATUS_LABELS: Record<Order['status'], string> = {
  production: 'IN PRODUCTION',
  shipped: 'SHIPPED',
  delivered: 'DELIVERED',
};

function ProductCard({ product }: { product: Product }) {
  const handlePress = useCallback(() => {
    HapticTap.light();
    router.push(`/shop/${product.id}` as any);
  }, [product.id]);

  return (
    <Pressable
      style={({ pressed }) => [styles.productCard, pressed && styles.productPressed]}
      onPress={handlePress}
    >
      <View style={styles.productVisual}>
        <View style={styles.cardSilhouette} />
      </View>
      <View style={styles.productMeta}>
        <AppText style={styles.productTag}>{product.tag}</AppText>
        <AppText style={styles.productName} weight="medium">{product.name}</AppText>
        <AppText style={styles.productPrice}>{product.price}</AppText>
      </View>
    </Pressable>
  );
}

export default function OrdersTabScreen() {
  const hasOrders = MOCK_ORDERS.length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <IosScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <AppText style={styles.headerTitle} weight="bold">Store & Orders</AppText>
            <AppText style={styles.headerSubtitle}>Physical NFC cards & delivery tracking</AppText>
          </View>
          <Pressable
            style={styles.cartIconBtn}
            onPress={() => {
              HapticTap.light();
              router.push('/shop/cart' as any);
            }}
            hitSlop={12}
          >
            <AppIcon name="shopping-bag" size={18} color={C.text} />
          </Pressable>
        </View>

        {/* Action Required: Design Proof Banner (Clean Monochrome Luxury) */}
        <Pressable
          style={({ pressed }) => [styles.proofBanner, pressed && styles.bannerPressed]}
          onPress={() => {
            HapticTap.medium();
            router.push('/orders/proof' as any);
          }}
        >
          <View style={styles.proofLeft}>
            <AppText style={styles.proofTag} weight="bold">PROOF APPROVAL</AppText>
            <AppText style={styles.proofTitle} weight="medium">Order #10294 — Laser Engraving</AppText>
            <AppText style={styles.proofSub}>Review CNC vector alignment before production</AppText>
          </View>
          <AppIcon name="chevron-right" size={16} color={C.textSecondary} />
        </Pressable>

        {/* Physical Products */}
        <View style={styles.section}>
          <AppText style={styles.sectionLabel}>NFC HARDWARE</AppText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.shopScroll}
          >
            {PRODUCTS.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </ScrollView>
        </View>

        {/* Orders Tracking */}
        <View style={styles.section}>
          <AppText style={styles.sectionLabel}>RECENT ORDERS</AppText>
          {hasOrders ? (
            <View style={styles.ordersList}>
              {MOCK_ORDERS.map((order, idx) => (
                <React.Fragment key={order.id}>
                  <Pressable
                    style={({ pressed }) => [styles.orderRow, pressed && styles.rowPressed]}
                    onPress={() => {
                      HapticTap.light();
                      router.push('/orders/track' as any);
                    }}
                  >
                    <View style={styles.orderInfo}>
                      <View style={styles.orderTopRow}>
                        <AppText style={styles.orderNumber} weight="medium">{order.orderNumber}</AppText>
                        <AppText style={styles.statusLabel}>{STATUS_LABELS[order.status]}</AppText>
                      </View>
                      <AppText style={styles.orderProduct}>{order.productName}</AppText>
                    </View>
                    <AppIcon name="chevron-right" size={16} color={C.textMuted} />
                  </Pressable>
                  {idx < MOCK_ORDERS.length - 1 && <View style={styles.divider} />}
                </React.Fragment>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <AppText style={styles.emptyTitle}>No orders yet</AppText>
              <AppText style={styles.emptySub}>Order a physical NFC card to begin.</AppText>
            </View>
          )}
        </View>

        <View style={{ height: 60 }} />
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.canvas,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  headerTitle: {
    fontSize: 26,
    letterSpacing: -0.6,
    color: C.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: C.textSecondary,
    marginTop: 3,
  },
  cartIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proofBanner: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerPressed: {
    backgroundColor: C.surfaceSoft,
  },
  proofLeft: {
    flex: 1,
    gap: 4,
  },
  proofTag: {
    fontSize: 10,
    letterSpacing: 1.5,
    color: C.accent,
  },
  proofTitle: {
    fontSize: 15,
    color: C.text,
    letterSpacing: -0.2,
  },
  proofSub: {
    fontSize: 12,
    color: C.textMuted,
  },
  section: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 0.8,
    color: C.textMuted,
    fontWeight: '600',
  },
  shopScroll: {
    gap: 12,
  },
  productCard: {
    width: 150,
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  productPressed: {
    backgroundColor: C.surfaceSoft,
  },
  productVisual: {
    height: 90,
    backgroundColor: C.cardBg,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSilhouette: {
    width: 60,
    height: 38,
    borderRadius: 4,
    backgroundColor: '#1E1E24',
  },
  productMeta: {
    gap: 2,
  },
  productTag: {
    fontSize: 9,
    letterSpacing: 1.2,
    color: C.textMuted,
    fontWeight: '600',
  },
  productName: {
    fontSize: 14,
    color: C.text,
    letterSpacing: -0.2,
  },
  productPrice: {
    fontSize: 13,
    color: C.textSecondary,
    marginTop: 2,
  },
  ordersList: {
    backgroundColor: C.surface,
    borderRadius: 16,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  rowPressed: {
    backgroundColor: C.surfaceSoft,
  },
  orderInfo: {
    flex: 1,
    gap: 4,
  },
  orderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  orderNumber: {
    fontSize: 15,
    color: C.text,
  },
  statusLabel: {
    fontSize: 10,
    letterSpacing: 1.2,
    color: C.textSecondary,
    fontWeight: '700',
  },
  orderProduct: {
    fontSize: 12,
    color: C.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: C.hairline,
    marginLeft: 18,
  },
  emptyState: {
    paddingVertical: 30,
    alignItems: 'center',
    gap: 4,
  },
  emptyTitle: {
    fontSize: 15,
    color: C.text,
  },
  emptySub: {
    fontSize: 13,
    color: C.textMuted,
  },
});
