/**
 * OrdersTabScreen — 08 Orders & NFC Shop
 * Luxury Minimalist (Apple Wallet × Stripe × Linear)
 * OPTIMIZED: useMemo, useCallback, pagination for 1M users
 */
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/src/services/firebaseClient';
import { useAuth } from '@/src/hooks/useAuth';
import { useBioPage } from '@/src/hooks/useBioPage';
import { useFirestorePagination } from '@/src/hooks/useFirestorePagination';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { IosScrollView } from '@/src/components/IosScrollView';
import { HapticTap, Haptics } from '@/src/utils/haptics';
import { PhysicalHardwareCardGraphic } from '@/src/components/PhysicalHardwareCardGraphic';
import { NfcBeamModal } from '@/src/components/NfcBeamModal';

const C = {
  canvas: '#000000',
  surface: '#0E0E11',
  surfaceSoft: '#141418',
  hairline: 'rgba(255, 255, 255, 0.06)',
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#52525B',
  accent: '#799A85',
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

// Memoized ProductCard to prevent unnecessary re-renders
const ProductCard = React.memo(({
  product,
  cardholderName,
  onPress,
}: {
  product: Product;
  cardholderName: string;
  onPress: (product: Product) => void;
}) => {
  const handlePress = useCallback(() => {
    HapticTap.light();
    onPress(product);
  }, [product, onPress]);

  return (
    <Pressable
      style={({ pressed }) => [styles.productCard, pressed && styles.productPressed]}
      onPress={handlePress}
    >
      <View style={styles.productVisual}>
        <PhysicalHardwareCardGraphic
          type={product.id}
          size="sm"
          cardholderName={cardholderName}
          companyName="NFC GLOBAL"
        />
      </View>
      <View style={styles.productMeta}>
        <AppText style={styles.productTag}>{product.tag}</AppText>
        <AppText style={styles.productName} weight="medium">{product.name}</AppText>
        <AppText style={styles.productPrice}>{product.price}</AppText>
      </View>
    </Pressable>
  );
});
ProductCard.displayName = 'ProductCard';

export default function OrdersTabScreen() {
  const { user } = useAuth();
  const isRealUser = Boolean(user && !user.isGuest && user.id !== 'guest');
  const { bioPage } = useBioPage(user?.id ?? '');
  const cardholderName = bioPage?.displayName || user?.displayName || 'Alexander Wright';
  const profileUrl = bioPage?.slug ? `https://nfcglobal.com/u/${bioPage.slug}` : `https://nfcglobal.com/u/${user?.id || 'demo'}`;

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showBeamModal, setShowBeamModal] = useState(false);
  const [simulatedTapActive, setSimulatedTapActive] = useState(false);
  
  // Paginated orders query (replaces MOCK_ORDERS for signed-in customer)
  const ordersQuery = useMemo(() => {
    if (!isRealUser || !user?.id) return null;
    return query(
      collection(db, 'orders'),
      where('userId', '==', user.id),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
  }, [isRealUser, user?.id]);

  const [{ data: pagedOrders, loading, hasMore, isLoadingMore }, { loadMore, refresh }] =
    useFirestorePagination<Order>(ordersQuery, { pageSize: 20 });

  const orders = useMemo(() => {
    if (isRealUser && pagedOrders.length > 0) return pagedOrders;
    if (isRealUser && !loading) return [];
    return MOCK_ORDERS;
  }, [isRealUser, pagedOrders, loading]);

  const hasOrders = orders.length > 0;

  // Memoized handlers
  const handleCartPress = useCallback(() => {
    HapticTap.light();
    router.push('/shop/cart' as any);
  }, []);

  const handleProofPress = useCallback(() => {
    HapticTap.medium();
    router.push('/orders/proof' as any);
  }, []);

  const handleOrderPress = useCallback((orderId: string) => {
    HapticTap.light();
    router.push(`/orders/detail/${orderId}` as any);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      loadMore();
    }
  }, [hasMore, isLoadingMore, loadMore]);

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
            onPress={handleCartPress}
            hitSlop={12}
          >
            <AppIcon name="shopping-bag" size={18} color={C.text} />
          </Pressable>
        </View>

        {/* Action Required: Design Proof Banner (Clean Monochrome Luxury) */}
        <Pressable
          style={({ pressed }) => [styles.proofBanner, pressed && styles.bannerPressed]}
          onPress={handleProofPress}
        >
          <View style={styles.proofLeft}>
            <AppText style={styles.proofTag} weight="bold">PROOF APPROVAL</AppText>
            <AppText style={styles.proofTitle} weight="medium">Order #10294 — Laser Engraving</AppText>
            <AppText style={styles.proofSub}>Review CNC vector alignment before production</AppText>
          </View>
          <AppIcon name="chevron-right" size={16} color={C.textSecondary} />
        </Pressable>

        {/* Instant Virtual NFC Banner — Addresses users without a physical card */}
        <View style={styles.virtualBanner}>
          <View style={styles.virtualTopRow}>
            <View style={styles.virtualPill}>
              <AppIcon name="wifi" size={11} color="#799A85" style={{ transform: [{ rotate: '90deg' }] }} />
              <AppText style={styles.virtualPillText} weight="bold">VIRTUAL NFC ACTIVE</AppText>
            </View>
            <AppText style={styles.virtualInstantBadge}>READY TO SHARE</AppText>
          </View>
          <AppText style={styles.virtualTitle} weight="bold">
            No physical card yet? Your phone is your NFC card.
          </AppText>
          <AppText style={styles.virtualDescription}>
            Share contactlessly right now. Beam via NFC, save your card to Apple or Google Wallet on your lock screen, or show your instant QR pass.
          </AppText>
          <View style={styles.virtualActionRow}>
            <Pressable
              style={({ pressed }) => [styles.virtualBtnPrimary, pressed && styles.btnPressed]}
              onPress={() => {
                HapticTap.medium();
                setShowBeamModal(true);
              }}
            >
              <AppIcon name="radio" size={14} color="#000000" />
              <AppText style={styles.virtualBtnPrimaryText} weight="bold">Beam Virtual NFC</AppText>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.virtualBtnSecondary, pressed && styles.btnPressed]}
              onPress={() => {
                HapticTap.light();
                router.push('/share-profile' as any);
              }}
            >
              <AppIcon name="wallet" size={14} color="#FFFFFF" />
              <AppText style={styles.virtualBtnSecondaryText} weight="medium">Wallet Pass</AppText>
            </Pressable>
          </View>
        </View>

        {/* Physical Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <AppText style={styles.sectionLabel}>NFC HARDWARE</AppText>
            <AppText style={styles.sectionHint}>Tap card to inspect 3D finish</AppText>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.shopScroll}
          >
            {PRODUCTS.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                cardholderName={cardholderName}
                onPress={setSelectedProduct}
              />
            ))}
          </ScrollView>
        </View>

        {/* Orders Tracking */}
        <View style={styles.section}>
          <AppText style={styles.sectionLabel}>RECENT ORDERS</AppText>
          {loading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="small" color={C.textSecondary} />
              <AppText style={styles.loadingText}>Loading orders...</AppText>
            </View>
          ) : hasOrders ? (
            <>
              <View style={styles.ordersList}>
                {orders.map((order, idx) => (
                  <React.Fragment key={order.id}>
                    <Pressable
                      style={({ pressed }) => [styles.orderRow, pressed && styles.rowPressed]}
                      onPress={() => handleOrderPress(order.id)}
                    >
                      <View style={styles.orderInfo}>
                        <View style={styles.orderTopRow}>
                          <AppText style={styles.orderNumber} weight="medium">
                            #{order.orderNumber || order.id.slice(-8)}
                          </AppText>
                          <AppText style={styles.statusLabel}>
                            {STATUS_LABELS[order.status] || 'PENDING'}
                          </AppText>
                        </View>
                        <AppText style={styles.orderProduct}>
                          {order.productName || 'NFC Card'}
                        </AppText>
                      </View>
                      <AppIcon name="chevron-right" size={16} color={C.textMuted} />
                    </Pressable>
                    {idx < orders.length - 1 && <View style={styles.divider} />}
                  </React.Fragment>
                ))}
              </View>
              {/* Load More Button */}
              {hasMore && (
                <Pressable
                  style={styles.loadMoreBtn}
                  onPress={handleLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <ActivityIndicator size="small" color={C.textSecondary} />
                  ) : (
                    <AppText style={styles.loadMoreText}>Load More Orders</AppText>
                  )}
                </Pressable>
              )}
            </>
          ) : (
            <View style={styles.emptyState}>
              <AppText style={styles.emptyTitle}>No orders yet</AppText>
              <AppText style={styles.emptySub}>Order a physical NFC card to begin.</AppText>
            </View>
          )}
        </View>

        <View style={{ height: 60 }} />
      </IosScrollView>

      {/* Interactive Physical Card Inspection & Simulation Modal */}
      <Modal
        visible={Boolean(selectedProduct)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedProduct(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSelectedProduct(null)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <AppText style={styles.modalTag}>{selectedProduct?.tag}</AppText>
                <AppText style={styles.modalTitle} weight="bold">{selectedProduct?.name} Card</AppText>
              </View>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => setSelectedProduct(null)}
                hitSlop={12}
              >
                <AppIcon name="close" size={18} color={C.textSecondary} />
              </Pressable>
            </View>

            {/* High-Resolution Physical Card Preview */}
            <View style={styles.modalCardWrap}>
              {selectedProduct && (
                <PhysicalHardwareCardGraphic
                  type={selectedProduct.id}
                  size="lg"
                  cardholderName={cardholderName}
                  companyName="NFC GLOBAL"
                />
              )}
            </View>

            {/* Hardware Specification Highlights */}
            <View style={styles.specsList}>
              <View style={styles.specRow}>
                <AppText style={styles.specLabel}>MATERIAL</AppText>
                <AppText style={styles.specValue} weight="medium">
                  {selectedProduct?.id === 'metal_card' ? '0.8mm 304 Stainless Steel' :
                   selectedProduct?.id === 'pvc_card' ? '0.76mm Recycled Polymer' :
                   selectedProduct?.id === 'premium_card' ? 'Solid Alloy Brushed Brass' :
                   '3K Carbon Fiber Twill Composite'}
                </AppText>
              </View>
              <View style={styles.specRow}>
                <AppText style={styles.specLabel}>NFC CHIP</AppText>
                <AppText style={styles.specValue} weight="medium">
                  {selectedProduct?.id === 'custom_card' ? 'Dual NTAG424 DNA Encrypted' : 'NTAG216 High Speed ISO 14443-A'}
                </AppText>
              </View>
              <View style={styles.specRow}>
                <AppText style={styles.specLabel}>FINISH</AppText>
                <AppText style={styles.specValue} weight="medium">Laser-Etched Double-Sided CNC</AppText>
              </View>
              <View style={styles.specRow}>
                <AppText style={styles.specLabel}>COMPATIBILITY</AppText>
                <AppText style={styles.specValue} weight="medium">Universal iOS (XS+) & NFC Androids</AppText>
              </View>
            </View>

            {/* Actions: Simulate NFC Tap OR Order */}
            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [styles.modalSimulateBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  Haptics.heavy();
                  setSimulatedTapActive(true);
                  setTimeout(() => {
                    Haptics.success();
                    setSimulatedTapActive(false);
                    setSelectedProduct(null);
                    setShowBeamModal(true);
                  }, 600);
                }}
              >
                <AppIcon name="wifi" size={15} color={C.text} style={{ transform: [{ rotate: '90deg' }] }} />
                <AppText style={styles.modalSimulateText} weight="bold">
                  {simulatedTapActive ? 'Simulating Tap...' : 'Simulate Physical Tap'}
                </AppText>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.modalOrderBtn, pressed && styles.btnPressed]}
                onPress={() => {
                  HapticTap.medium();
                  setSelectedProduct(null);
                  router.push('/pricing' as any);
                }}
              >
                <AppText style={styles.modalOrderText} weight="bold">
                  Order Card · {selectedProduct?.price}
                </AppText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* NameDrop-Style NFC Beam Modal */}
      <NfcBeamModal
        visible={showBeamModal}
        onClose={() => setShowBeamModal(false)}
        fullName={cardholderName}
        title="NFC Digital Profile"
        url={profileUrl}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.canvas,
  },
  content: {
    paddingHorizontal: 16,
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
  virtualBanner: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(121, 154, 133, 0.25)', // Subtle eucalyptus sage border
    gap: 10,
  },
  virtualTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  virtualPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(121, 154, 133, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  virtualPillText: {
    fontSize: 10,
    letterSpacing: 1.2,
    color: '#799A85',
  },
  virtualInstantBadge: {
    fontSize: 10,
    letterSpacing: 1.2,
    color: C.textSecondary,
    fontWeight: '600',
  },
  virtualTitle: {
    fontSize: 16,
    color: C.text,
    letterSpacing: -0.3,
  },
  virtualDescription: {
    fontSize: 12.5,
    lineHeight: 18,
    color: C.textSecondary,
  },
  virtualActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  virtualBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 10,
  },
  virtualBtnPrimaryText: {
    fontSize: 12,
    color: '#000000',
    letterSpacing: -0.1,
  },
  virtualBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: C.surfaceSoft,
    borderWidth: 1,
    borderColor: C.hairline,
    borderRadius: 10,
    paddingVertical: 10,
  },
  virtualBtnSecondaryText: {
    fontSize: 12,
    color: C.text,
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  section: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 0.8,
    color: C.textMuted,
    fontWeight: '600',
  },
  sectionHint: {
    fontSize: 11,
    color: C.accent,
    letterSpacing: 0.3,
  },
  shopScroll: {
    gap: 12,
  },
  productCard: {
    width: 154,
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 12,
    gap: 10,
  },
  productPressed: {
    backgroundColor: C.surfaceSoft,
  },
  productVisual: {
    height: 94,
    backgroundColor: C.cardBg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
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
  loadingState: {
    paddingVertical: 30,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: C.textMuted,
  },
  loadMoreBtn: {
    backgroundColor: C.surface,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  loadMoreText: {
    fontSize: 14,
    color: C.textSecondary,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  modalSheet: {
    backgroundColor: '#121215',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
    gap: 18,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTag: {
    fontSize: 10,
    letterSpacing: 1.5,
    color: '#799A85',
    fontWeight: '700',
  },
  modalTitle: {
    fontSize: 20,
    color: C.text,
    letterSpacing: -0.4,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCardWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  specsList: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: C.hairline,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  specLabel: {
    fontSize: 10,
    letterSpacing: 1,
    color: C.textMuted,
    fontWeight: '600',
  },
  specValue: {
    fontSize: 12.5,
    color: C.text,
  },
  modalActions: {
    gap: 10,
  },
  modalSimulateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.surfaceSoft,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalSimulateText: {
    fontSize: 14,
    color: C.text,
  },
  modalOrderBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOrderText: {
    fontSize: 14,
    color: '#000000',
    letterSpacing: -0.2,
  },
});
