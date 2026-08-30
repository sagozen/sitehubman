/**
 * SalesOrdersScreen — Order Pipeline (Apple Wallet × Nothing Edition).
 *
 * Architecture:
 *  - Solid black background (#000000)
 *  - Minimalist search bar and segmented status filter strip
 *  - Clean borderless order rows with customer monogram and live verification badge
 *  - 130px bottom padding for floating dock clearance
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IosScrollView } from '@/src/components/IosScrollView';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { useAuth } from '@/src/hooks/useAuth';
import { useOrders } from '@/src/hooks/useOrders';
import { isPaymentVerified } from '@/src/services/paymentVerificationService';
import { formatOrderTotal } from '@/src/utils/orderPricing';
import { needsSalesApproval } from '@/src/utils/orderProduction';
import type { Order } from '@/src/types/models';
import { appRoutes } from '@/src/constants/navigation';
import { HapticTap } from '@/src/utils/haptics';

type FilterType = 'all' | 'pending' | 'approved' | 'printer' | 'done';

function orderStatusKey(o: Order): FilterType {
  if (needsSalesApproval(o)) return 'pending';
  if (['payment_verified', 'production_approved'].includes(o.status)) return 'approved';
  if (['printing', 'nfc_writing', 'printer_assigned', 'qa_pending', 'nfc_verification'].includes(o.status)) return 'printer';
  if (['delivered', 'ready_to_ship', 'shipped'].includes(o.status)) return 'done';
  return 'all';
}

export default function SalesOrdersScreen() {
  const { user } = useAuth();
  const { orders, isLoading, refresh } = useOrders('sales', user?.id ?? '');

  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const stats = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let printer = 0;
    let done = 0;
    orders.forEach((o) => {
      const k = orderStatusKey(o);
      if (k === 'pending') pending++;
      else if (k === 'approved') approved++;
      else if (k === 'printer') printer++;
      else if (k === 'done') done++;
    });
    return { all: orders.length, pending, approved, printer, done };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const statusKey = orderStatusKey(o);
      const matchesFilter = filter === 'all' || statusKey === filter;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        [o.customerName ?? '', o.phone ?? '', o.id, o.orderNumber ?? '', o.cardCode ?? ''].some(
          (val) => val.toLowerCase().includes(q),
        );
      return matchesFilter && matchesSearch;
    });
  }, [orders, filter, search]);

  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <IosScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Top Bar ── */}
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={styles.navBtn}
            hitSlop={12}
            accessibilityLabel="Back"
          >
            <AppIcon name="ChevronLeft" size={20} color="#FFFFFF" />
          </Pressable>

          <AppText style={styles.navTitle} weight="bold">
            Order Pipeline
          </AppText>

          <Pressable
            onPress={() => {
              HapticTap.medium();
              router.push(appRoutes.sales.newOrder as any);
            }}
            style={styles.navBtn}
            hitSlop={12}
            accessibilityLabel="New Order"
          >
            <AppIcon name="Plus" size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* ── Search Bar ── */}
        <View style={styles.searchBar}>
          <AppIcon name="Search" size={16} color="rgba(255, 255, 255, 0.4)" />
          <TextInput
            value={search}
            onChangeText={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Search customer, phone, or order ID..."
            placeholderTextColor="rgba(255, 255, 255, 0.35)"
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search ? (
            <Pressable onPress={() => setSearch('')} hitSlop={10}>
              <AppIcon name="X" size={15} color="rgba(255, 255, 255, 0.5)" />
            </Pressable>
          ) : null}
        </View>

        {/* ── Filter Strip (Minimalist Nothing/Apple style) ── */}
        <View style={styles.filterStrip}>
          {[
            { key: 'all', label: 'All', count: stats.all },
            { key: 'pending', label: 'Pending', count: stats.pending },
            { key: 'approved', label: 'Approved', count: stats.approved },
            { key: 'printer', label: 'Production', count: stats.printer },
            { key: 'done', label: 'Delivered', count: stats.done },
          ].map((tab) => {
            const isSelected = filter === tab.key;
            return (
              <Pressable
                key={tab.key}
                style={[styles.filterButton, isSelected && styles.filterButtonActive]}
                onPress={() => {
                  HapticTap.selection();
                  setFilter(tab.key as FilterType);
                  setPage(1);
                }}
              >
                <AppText
                  style={[styles.filterButtonText, isSelected && styles.filterButtonTextActive]}
                  weight={isSelected ? 'bold' : 'medium'}
                >
                  {tab.label} {tab.count > 0 ? `(${tab.count})` : ''}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {/* ── Order List Header ── */}
        <View style={styles.listHeaderRow}>
          <AppText style={styles.listHeaderTitle} weight="bold">Orders List</AppText>
          <AppText style={styles.listHeaderCount}>
            {filteredOrders.length} deals in pipeline
          </AppText>
        </View>

        {/* ── Order Rows (Borderless) ── */}
        {isLoading && paginatedOrders.length === 0 ? (
          <ActivityIndicator color="#FFFFFF" style={{ marginVertical: 32 }} />
        ) : paginatedOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <AppIcon name="CreditCard" size={28} color="rgba(255, 255, 255, 0.3)" />
            <AppText style={styles.emptyTitle} weight="bold">No orders found</AppText>
            <AppText style={styles.emptySub}>Create a new customer order to get started.</AppText>
          </View>
        ) : (
          <View style={styles.orderList}>
            {paginatedOrders.map((o) => {
              const verified = isPaymentVerified(o);
              const initials = (o.customerName || 'C')
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();

              return (
                <Pressable
                  key={o.id}
                  style={({ pressed }) => [styles.orderRow, pressed && styles.rowPressed]}
                  onPress={() => router.push(`/orders/detail/${o.id}` as any)}
                >
                  <View style={styles.avatarCircle}>
                    <AppText style={styles.avatarText} weight="bold">{initials}</AppText>
                  </View>

                  <View style={styles.orderDetails}>
                    <View style={styles.orderTopRow}>
                      <AppText style={styles.customerName} weight="bold" numberOfLines={1}>
                        {o.customerName || 'Guest Customer'}
                      </AppText>
                      <AppText style={styles.orderAmount} weight="extrabold">
                        {formatOrderTotal(o)}
                      </AppText>
                    </View>

                    <View style={styles.orderBottomRow}>
                      <AppText style={styles.orderProduct} numberOfLines={1}>
                        {o.productType?.replace(/_/g, ' ') || 'AVIO NFC Smart Pass'}
                      </AppText>

                      <View style={styles.badgeRow}>
                        {verified && (
                          <View style={styles.paidBadge}>
                            <AppText style={styles.paidBadgeText} weight="bold">✓ PAID</AppText>
                          </View>
                        )}
                        <View style={styles.statusBadge}>
                          <AppText style={styles.statusBadgeText} weight="bold">
                            {(o.status || 'ACTIVE').toUpperCase()}
                          </AppText>
                        </View>
                      </View>
                    </View>
                  </View>

                  <AppIcon name="ChevronRight" size={14} color="rgba(255, 255, 255, 0.25)" />
                </Pressable>
              );
            })}
          </View>
        )}

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
    paddingTop: 10,
    paddingBottom: 130, // Clearance for floating dock
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
    gap: 14,
  },
  rowPressed: {
    opacity: 0.7,
  },

  // ── Top Bar ──
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    color: '#FFFFFF',
    fontSize: 17,
  },

  // ── Search Bar ──
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121214',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    padding: 0,
  },

  // ── Filter Strip ──
  filterStrip: {
    flexDirection: 'row',
    backgroundColor: '#121214',
    borderRadius: 12,
    padding: 3,
    gap: 2,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  filterButtonActive: {
    backgroundColor: '#242428',
  },
  filterButtonText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 11,
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },

  // ── List Header ──
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 4,
  },
  listHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  listHeaderCount: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 12,
  },

  // ── Order Rows (Borderless) ──
  orderList: {
    gap: 2,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    gap: 12,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#141418',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  orderDetails: {
    flex: 1,
    gap: 3,
  },
  orderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customerName: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  orderAmount: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  orderBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  orderProduct: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 12,
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paidBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  paidBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  statusBadge: {
    backgroundColor: '#18181C',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statusBadgeText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 9,
    letterSpacing: 0.5,
  },

  // ── Empty State ──
  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
    gap: 8,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  emptySub: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
  },
});
