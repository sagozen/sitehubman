import React, { Fragment, useEffect, useMemo, useState } from 'react';
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

// ─── Tokens (Light Theme Pro) ───────────────────────────────────────────────
const BG = '#F8FAFC';
const SURFACE = 'rgba(255, 255, 255, 0.86)';
const SURFACE_LIGHT = '#F1F5F9';
const BORDER = 'rgba(255, 255, 255, 0.92)';
const INK = '#020617';
const MUTED = '#64748B';
const BLUE = '#2563EB';

type FilterType = 'all' | 'pending' | 'approved' | 'printer' | 'done';

function orderStatusKey(o: Order): FilterType {
  if (needsSalesApproval(o)) return 'pending';
  if (['payment_verified', 'production_approved'].includes(o.status)) return 'approved';
  if (['printing', 'nfc_writing', 'printer_assigned', 'qa_pending', 'nfc_verification'].includes(o.status)) return 'printer';
  if (['delivered', 'ready_to_ship', 'shipped'].includes(o.status)) return 'done';
  return 'all';
}

function statusStyle(status: string) {
  switch (status) {
    case 'pending': return { bg: '#fef3c7', text: '#b45309', label: 'Pending' };
    case 'approved': return { bg: '#dbeafe', text: '#1d4ed8', label: 'Approved' };
    case 'printer': return { bg: '#ede9fe', text: '#6d28d9', label: 'Printer' };
    case 'done': return { bg: '#d1fae5', text: '#047857', label: 'Done' };
    default: return { bg: '#f1f5f9', text: '#475569', label: 'Unknown' };
  }
}

export default function SalesOrdersScreen() {
  const { user } = useAuth();
  const { orders, isLoading, refresh } = useOrders('sales', user?.id ?? '');

  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => { refresh(); }, [refresh]);

  // Compute statistics
  const stats = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let printer = 0;
    let done = 0;
    orders.forEach(o => {
      const k = orderStatusKey(o);
      if (k === 'pending') pending++;
      else if (k === 'approved') approved++;
      else if (k === 'printer') printer++;
      else if (k === 'done') done++;
    });
    return { all: orders.length, pending, approved, printer, done };
  }, [orders]);

  // Filter & search orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const statusKey = orderStatusKey(o);
      const matchesFilter = filter === 'all' || statusKey === filter;
      
      const q = search.toLowerCase();
      const matchesSearch = !q || [
        o.customerName ?? '',
        o.phone ?? '',
        o.id,
        o.orderNumber ?? '',
        o.cardCode ?? '',
      ].some(val => val.toLowerCase().includes(q));

      return matchesFilter && matchesSearch;
    });
  }, [orders, filter, search]);

  // Pagination logic
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage]);



  return (
    <View style={[s.bg, { overflow: 'hidden' }]}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <IosScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 16 }}>
            <View>
              <AppText style={{ fontSize: 10, fontWeight: '900', color: BLUE, letterSpacing: 1 }}>NFC GLOBAL SALES</AppText>
              <AppText style={{ fontSize: 30, fontWeight: '900', color: INK, letterSpacing: -0.5 }}>Orders</AppText>
            </View>
            <View style={s.slidersBtn}>
              <AppIcon name="Sliders" size={20} color={INK} />
            </View>
          </View>

          {/* Search bar */}
          <View style={s.glassCard}>
            <View style={s.searchInner}>
              <AppIcon name="Search" size={16} color={MUTED} />
              <TextInput
                value={search}
                onChangeText={(val) => { setSearch(val); setPage(1); }}
                placeholder="Search customer, phone, order ID..."
                placeholderTextColor={MUTED}
                style={s.searchInput}
              />
            </View>
          </View>

          {/* Filters Pill Grid */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 12 }}
            contentContainerStyle={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: SURFACE,
              borderRadius: 22,
              padding: 6,
              borderWidth: 1,
              borderColor: BORDER,
              gap: 4,
            }}
          >
            {(['all', 'pending', 'approved', 'printer', 'done'] as FilterType[]).map((f, idx) => {
              const count = stats[f];
              return (
                <Fragment key={f}>
                  <Pressable onPress={() => { setFilter(f); setPage(1); }} style={[s.filterBtn, filter === f && s.filterBtnActive]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <AppText style={[s.filterLabel, filter === f && s.filterLabelActive]}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </AppText>
                      {count > 0 ? (
                        <View style={[s.pillBadge, filter === f && s.pillBadgeActive]}>
                          <AppText style={[s.pillBadgeText, filter === f && s.pillBadgeTextActive]}>
                            {count}
                          </AppText>
                        </View>
                      ) : null}
                    </View>
                  </Pressable>
                  {idx < 4 ? (
                    <View style={{ justifyContent: 'center', alignItems: 'center', paddingHorizontal: 2 }}>
                      <AppIcon name="ChevronRight" size={10} color={MUTED} />
                    </View>
                  ) : null}
                </Fragment>
              );
            })}
          </ScrollView>

          {/* Toolbar info */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 8, paddingHorizontal: 4 }}>
            <View>
              <AppText style={{ fontSize: 16, fontWeight: '900', color: INK }}>Order List</AppText>
              <AppText style={{ fontSize: 11, fontWeight: '600', color: MUTED, marginTop: 2 }}>
                Showing {filteredOrders.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredOrders.length)} of {filteredOrders.length} orders
              </AppText>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable onPress={() => { setSearch(''); setFilter('all'); setPage(1); }}>
                <AppText style={{ fontSize: 13, fontWeight: '900', color: BLUE }}>View All</AppText>
              </Pressable>
              <Pressable>
                <AppText style={{ fontSize: 13, fontWeight: '900', color: MUTED }}>Export</AppText>
              </Pressable>
            </View>
          </View>

          {/* Compact Order List Wrapper */}
          {isLoading && paginatedOrders.length === 0 ? (
            <ActivityIndicator color={BLUE} style={{ marginVertical: 32 }} />
          ) : paginatedOrders.length === 0 ? (
            <View style={s.glassCard}>
              <AppText style={{ fontSize: 14, fontWeight: '800', color: MUTED, textAlign: 'center', marginVertical: 20 }}>
                No orders found
              </AppText>
            </View>
          ) : (
            <View style={[s.glassCard, { padding: 0, overflow: 'hidden' }]}>
              {paginatedOrders.map((o, idx) => {
                const verified = isPaymentVerified(o);
                const sKey = orderStatusKey(o);
                const styling = statusStyle(sKey);
                const orderRef = o.orderNumber ?? o.id.slice(0, 8).toUpperCase();
                const productLabel = o.productType?.replace(/_/g, ' ') ?? 'NFC Card';
                return (
                  <Pressable
                    key={o.id}
                    style={({ pressed }) => [
                      s.orderRow,
                      idx < paginatedOrders.length - 1 && s.rowDivider,
                      pressed && { backgroundColor: '#F8FAFF' },
                    ]}
                    onPress={() => router.push(`/order-detail/${o.id}` as any)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16 }}>
                      {/* Rank Number */}
                      <AppText style={{ fontSize: 12, fontWeight: '900', color: MUTED, width: 20 }}>
                        {idx + 1 + (currentPage - 1) * pageSize}.
                      </AppText>

                      {/* Left icon */}
                      <View style={s.cardIconBox}>
                        <AppIcon name="CreditCard" size={18} color={MUTED} />
                      </View>

                      {/* Main info */}
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <AppText style={{ fontSize: 14, fontWeight: '900', color: INK }} numberOfLines={1}>
                            {o.customerName ?? 'Guest'}
                          </AppText>
                          {verified ? (
                            <View style={[s.badge, { backgroundColor: '#D1FAE5', paddingHorizontal: 4, paddingVertical: 2 }]}>
                              <AppText style={{ fontSize: 8, fontWeight: '900', color: '#065F46' }}>✓ PAID</AppText>
                            </View>
                          ) : null}
                        </View>
                        <AppText style={{ fontSize: 11, fontWeight: '600', color: MUTED, marginTop: 3 }}>
                          #{orderRef}  ·  {productLabel}
                        </AppText>
                      </View>

                      {/* Status badge & Price */}
                      <View style={{ alignItems: 'flex-end', gap: 6 }}>
                        <View style={[s.badge, { backgroundColor: styling.bg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }]}>
                          <AppText style={{ fontSize: 9, fontWeight: '900', color: styling.text, letterSpacing: 0.2 }}>
                            {styling.label.toUpperCase()}
                          </AppText>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                          <AppText style={{ fontSize: 13, fontWeight: '900', color: INK }}>
                            {formatOrderTotal(o)}
                          </AppText>
                          <AppIcon name="ChevronRight" size={14} color={MUTED} />
                        </View>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Pagination Controls */}
          <View style={[s.glassCard, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }]}>
            <Pressable
              disabled={currentPage <= 1}
              onPress={() => setPage(prev => Math.max(1, prev - 1))}
              style={[s.pageBtn, currentPage <= 1 && { opacity: 0.5 }]}
            >
              <AppIcon name="ChevronLeft" size={14} color={INK} />
              <AppText style={{ fontSize: 13, fontWeight: '900', color: INK }}>Prev</AppText>
            </Pressable>

            <AppText style={{ fontSize: 13, fontWeight: '900', color: MUTED }}>
              Page {currentPage} / {totalPages}
            </AppText>

            <Pressable
              disabled={currentPage >= totalPages}
              onPress={() => setPage(prev => Math.min(totalPages, prev + 1))}
              style={[s.pageBtn, { backgroundColor: '#0f172a' }, currentPage >= totalPages && { opacity: 0.5 }]}
            >
              <AppText style={{ fontSize: 13, fontWeight: '900', color: '#FFFFFF' }}>Next</AppText>
              <AppIcon name="ChevronRight" size={14} color="#FFFFFF" />
            </Pressable>
          </View>

        </IosScrollView>
      </SafeAreaView>


    </View>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: BG },
  scroll: { paddingHorizontal: 16, paddingBottom: 120 },
  blob: { position: 'absolute', opacity: 0.8 },
  slidersBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: SURFACE,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER,
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 1,
  },
  statsGrid: {
    flexDirection: 'row', gap: 8, marginBottom: 16,
  },
  glassStatCard: {
    flex: 1, backgroundColor: SURFACE, borderRadius: 16, paddingVertical: 12, alignItems: 'center',
    borderWidth: 1, borderColor: BORDER,
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.04, shadowRadius: 20, elevation: 1,
  },
  statNum: { fontSize: 20, fontWeight: '900', color: INK },
  statLabel: { fontSize: 10, fontWeight: '700', color: MUTED, marginTop: 2 },
  glassCard: {
    backgroundColor: SURFACE, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: BORDER,
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.05, shadowRadius: 25, elevation: 1,
    marginBottom: 12,
  },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0f172a', borderRadius: 999,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  searchInner: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: SURFACE_LIGHT, borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 13, fontWeight: '700', color: INK, padding: 0 },
  filtersContainer: {
    backgroundColor: SURFACE, borderRadius: 22, padding: 6, flexDirection: 'row', gap: 4, borderWidth: 1, borderColor: BORDER,
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.04, shadowRadius: 15, elevation: 1,
    marginBottom: 12,
  },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  filterBtnActive: {
    backgroundColor: '#FEE2E2',
  },
  filterLabel: { fontSize: 11, fontWeight: '900', color: MUTED },
  filterLabelActive: { color: '#EF4444' },
  pillBadge: { minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  pillBadgeActive: {},
  pillBadgeText: { fontSize: 9, fontWeight: '900', color: '#FFFFFF' },
  pillBadgeTextActive: { color: '#FFFFFF' },
  orderRow: { backgroundColor: 'transparent' },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  cardIconBox: { width: 36, height: 36, borderRadius: 12, backgroundColor: SURFACE_LIGHT, alignItems: 'center', justifyContent: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  pageBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f1f5f9', borderRadius: 999,
    paddingHorizontal: 14, paddingVertical: 10,
  },

});
