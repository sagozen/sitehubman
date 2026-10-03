import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AppText from '@/src/components/AppText';
import AppIcon, { type AppIconName } from '@/src/components/AppIcon';
import IosScrollView from '@/src/components/IosScrollView';
import { HapticTap } from '@/src/utils/haptics';

const ACCENT = '#2596BE';
const SURFACE = '#111114';
const BORDER = 'rgba(255,255,255,0.09)';
const TEXT = '#F5F5F7';
const MUTED = '#9A9AA0';

interface Product {
  id: string;
  name: string;
  price: string;
  icon: AppIconName;
}

interface Order {
  id: string;
  orderNumber: string;
  productName: string;
  status: 'processing' | 'production' | 'shipped' | 'delivered' | 'pending';
}

const PRODUCTS: Product[] = [
  { id: 'metal_card', name: 'Metal Card', price: 'From $49', icon: 'credit-card' },
  { id: 'pvc_card', name: 'PVC Card', price: 'From $19', icon: 'card' },
  { id: 'premium_card', name: 'Premium Card', price: 'From $79', icon: 'diamond' },
  { id: 'custom_card', name: 'Custom Card', price: 'From $99', icon: 'brush' },
];

const MOCK_ORDERS: Order[] = [
  { id: 'ord_1', orderNumber: '#10042', productName: 'Metal NFC Card', status: 'shipped' },
  { id: 'ord_2', orderNumber: '#10037', productName: 'PVC Card', status: 'delivered' },
  { id: 'ord_3', orderNumber: '#10031', productName: 'Premium Card', status: 'production' },
];

const STATUS_CONFIG: Record<Order['status'], { label: string; color: string; bg: string }> = {
  pending:    { label: 'Pending',    color: '#F5A623', bg: 'rgba(245,166,35,0.15)'   },
  processing: { label: 'Processing', color: '#9A9AA0', bg: 'rgba(154,154,160,0.15)' },
  production: { label: 'Production', color: ACCENT,    bg: 'rgba(37,150,190,0.15)'  },
  shipped:    { label: 'Shipped',    color: '#9B59F5', bg: 'rgba(155,89,245,0.15)'  },
  delivered:  { label: 'Delivered',  color: '#34C759', bg: 'rgba(52,199,89,0.15)'   },
};

function ProductCard({ product }: { product: Product }) {
  const handlePress = useCallback(() => {
    HapticTap.light();
    router.push(`/shop/${product.id}` as any);
  }, [product.id]);

  return (
    <Pressable
      style={styles.productCard}
      onPress={handlePress}
      hitSlop={4}
      android_ripple={{ color: 'rgba(255,255,255,0.06)' }}
    >
      <View style={styles.productIconWrap}>
        <AppIcon name={product.icon as AppIconName} size={28} color={ACCENT} />
      </View>
      <AppText style={styles.productName}>{product.name}</AppText>
      <AppText style={styles.productPrice}>{product.price}</AppText>
    </Pressable>
  );
}

function OrderRow({ order }: { order: Order }) {
  const cfg = STATUS_CONFIG[order.status];
  const handlePress = useCallback(() => {
    HapticTap.light();
    router.push(`/orders/detail/${order.id}` as any);
  }, [order.id]);

  return (
    <Pressable
      style={styles.orderRow}
      onPress={handlePress}
      hitSlop={4}
      android_ripple={{ color: 'rgba(255,255,255,0.06)' }}
    >
      <View style={styles.orderMeta}>
        <AppText style={styles.orderNumber}>{order.orderNumber}</AppText>
        <AppText style={styles.orderProduct}>{order.productName}</AppText>
      </View>
      <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
        <AppText style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</AppText>
      </View>
    </Pressable>
  );
}

function EmptyOrders() {
  return (
    <View style={styles.emptyState}>
      <AppIcon name="shopping-bag" size={48} color={MUTED} />
      <AppText style={styles.emptyTitle}>No orders yet.</AppText>
      <AppText style={styles.emptySubtitle}>Get your first NFC card.</AppText>
      <TouchableOpacity
        style={styles.shopNowBtn}
        onPress={() => { HapticTap.confidentClick(); router.push('/shop/pvc_card' as any); }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.82}
      >
        <AppText style={styles.shopNowText}>Shop Now</AppText>
      </TouchableOpacity>
    </View>
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
          <AppText style={styles.headerTitle}>Orders & Shop</AppText>
          <Pressable
            style={styles.cartIconBtn}
            onPress={() => {
              HapticTap.light();
              router.push('/shop/cart' as any);
            }}
            hitSlop={8}
          >
            <AppIcon name="ShoppingBag" size={20} color={TEXT} />
          </Pressable>
        </View>

        {/* Action Required: Design Proof Banner */}
        <Pressable
          style={styles.proofBanner}
          onPress={() => {
            HapticTap.medium();
            router.push('/orders/proof' as any);
          }}
        >
          <View style={styles.proofBannerLeft}>
            <View style={styles.proofIconCircle}>
              <AppIcon name="Sparkles" size={16} color="#FF9F0A" />
            </View>
            <View style={{ flex: 1 }}>
              <AppText style={styles.proofBannerTitle} weight="bold">
                Action Required: Review Proof
              </AppText>
              <AppText style={styles.proofBannerSub}>
                Order #10294 · Laser engraving ready
              </AppText>
            </View>
          </View>
          <View style={styles.proofReviewBtn}>
            <AppText style={styles.proofReviewText} weight="bold">
              Review →
            </AppText>
          </View>
        </Pressable>

        {/* Shop Section */}
        <View style={styles.section}>
          <AppText style={styles.sectionLabel}>Shop</AppText>
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

        {/* My Orders Section */}
        <View style={styles.section}>
          <AppText style={styles.sectionLabel}>My Orders</AppText>
          {hasOrders ? (
            <View style={styles.ordersCard}>
              {MOCK_ORDERS.map((order, idx) => (
                <React.Fragment key={order.id}>
                  <OrderRow order={order} />
                  {idx < MOCK_ORDERS.length - 1 && <View style={styles.divider} />}
                </React.Fragment>
              ))}
            </View>
          ) : (
            <EmptyOrders />
          )}
        </View>
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    paddingHorizontal: 20,
    gap: 20,
    paddingBottom: 130,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: TEXT,
    letterSpacing: -0.5,
  },
  cartIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proofBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 10, 0.35)',
  },
  proofBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  proofIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 159, 10, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proofBannerTitle: {
    fontSize: 14,
    color: TEXT,
  },
  proofBannerSub: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },
  proofReviewBtn: {
    backgroundColor: ACCENT,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginLeft: 8,
  },
  proofReviewText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  section: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: MUTED,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  shopScroll: {
    gap: 12,
    paddingRight: 4,
  },
  productCard: {
    width: 200,
    height: 130,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: ACCENT,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
  },
  productIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(37,150,190,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT,
  },
  productPrice: {
    fontSize: 13,
    color: MUTED,
  },
  ordersCard: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    overflow: 'hidden',
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  orderMeta: {
    gap: 2,
    flex: 1,
  },
  orderNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT,
  },
  orderProduct: {
    fontSize: 12,
    color: MUTED,
  },
  statusPill: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: TEXT,
  },
  emptySubtitle: {
    fontSize: 14,
    color: MUTED,
  },
  shopNowBtn: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  shopNowText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
});
