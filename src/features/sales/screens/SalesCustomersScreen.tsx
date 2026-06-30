import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IosScrollView } from '@/src/components/IosScrollView';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { StatusBadge } from '@/src/components/StatusBadge';
import { FAB } from '@/src/components/FAB';
import { QuickActionModal } from '@/src/components/QuickActionModal';
import { useAuth } from '@/src/hooks/useAuth';
import { useOrders } from '@/src/hooks/useOrders';

const BG = '#F8FAFC';
const SURFACE = 'rgba(255, 255, 255, 0.86)';
const SURFACE_LIGHT = '#F1F5F9';
const BORDER = 'rgba(15,23,42,0.06)';
const INK = '#020617';
const MUTED = '#64748B';
const BLUE = '#0E7490';

interface LocalCustomer {
  id: string;
  name: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  joinedAt: number;
}

function CustomerCard({ customer, index }: { customer: LocalCustomer; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        s.customerCard,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={s.avatar}>
          <AppText style={{ fontSize: 16, fontWeight: '900', color: '#FFFFFF' }}>
            {customer.name.split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase()}
          </AppText>
        </View>
        <View style={{ flex: 1 }}>
          <AppText style={{ fontSize: 16, fontWeight: '900', color: INK }}>{customer.name}</AppText>
          <AppText style={{ fontSize: 12, fontWeight: '600', color: MUTED, marginTop: 1 }}>{customer.phone}</AppText>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <AppText style={{ fontSize: 16, fontWeight: '900', color: INK }}>${customer.totalSpent.toFixed(2)}</AppText>
          <StatusBadge status={customer.totalOrders > 3 ? 'active' : 'default'} label={`${customer.totalOrders} order${customer.totalOrders === 1 ? '' : 's'}`} />
        </View>
      </View>
    </Animated.View>
  );
}

export default function SalesCustomersScreen() {
  const { user } = useAuth();
  const { orders, isLoading, refresh } = useOrders('sales', user?.id ?? '');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [fabOpen, setFabOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSearchChange = useCallback((text: string) => {
    setSearch(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(text), 300);
  }, []);

  const customers = useMemo(() => {
    const map = new Map<string, LocalCustomer>();
    orders.forEach((o) => {
      const name = o.customerName || 'Guest';
      const phone = o.phone || 'No phone';
      const amt = o.amount || 0;
      const key = `${name}-${phone}`;

      const existing = map.get(key);
      if (existing) {
        existing.totalOrders += 1;
        existing.totalSpent += amt;
      } else {
        map.set(key, {
          id: o.id,
          name,
          phone,
          totalOrders: 1,
          totalSpent: amt,
          joinedAt: new Date(o.createdAt || Date.now()).getTime(),
        });
      }
    });
    return Array.from(map.values());
  }, [orders]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase().trim();
    if (!q) return customers.sort((a, b) => b.totalSpent - a.totalSpent);
    return customers
      .filter((c) => c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q))
      .sort((a, b) => b.totalSpent - a.totalSpent);
  }, [customers, debouncedSearch]);

  return (
    <View style={s.bg}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <IosScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingBottom: 16 }}>
            <Pressable
              onPress={() => {
                const { router } = require('expo-router');
                router.back();
              }}
              style={{
                width: 40, height: 40, borderRadius: 20, backgroundColor: SURFACE_LIGHT,
                alignItems: 'center', justifyContent: 'center', marginRight: 12
              }}
              hitSlop={8}
            >
              <AppIcon name="ChevronLeft" size={20} color={INK} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <AppText style={{ fontSize: 10, fontWeight: '900', color: BLUE, letterSpacing: 1 }}>NFC GLOBAL SALES</AppText>
              <AppText style={s.title}>Customers</AppText>
            </View>
            <View style={s.countBadge}>
              <AppText style={s.countText}>{filtered.length}</AppText>
            </View>
          </View>

          {/* Search bar */}
          <View style={s.glassCard}>
            <View style={s.searchInner}>
              <AppIcon name="Search" size={16} color={MUTED} />
              <TextInput
                value={search}
                onChangeText={handleSearchChange}
                placeholder="Search name, phone number..."
                placeholderTextColor={MUTED}
                style={s.searchInput}
              />
              {search.length > 0 && (
                <Pressable onPress={() => { setSearch(''); setDebouncedSearch(''); }} hitSlop={8}>
                  <AppIcon name="X" size={16} color={MUTED} />
                </Pressable>
              )}
            </View>
          </View>

          <AppText style={s.sectionLabel}>Customer History · {filtered.length} total</AppText>

          {isLoading && filtered.length === 0 ? (
            <ActivityIndicator color={BLUE} style={{ marginVertical: 32 }} />
          ) : filtered.length === 0 ? (
            <View style={s.glassCard}>
              <AppText style={{ fontSize: 14, fontWeight: '800', color: MUTED, textAlign: 'center', marginVertical: 20 }}>
                No customers found
              </AppText>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {filtered.map((c, idx) => (
                <CustomerCard key={c.id} customer={c} index={idx} />
              ))}
            </View>
          )}
        </IosScrollView>
      </SafeAreaView>
      <FAB onPress={() => setFabOpen(true)} />
      <QuickActionModal visible={fabOpen} onClose={() => setFabOpen(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: BG },
  scroll: { paddingHorizontal: 16, paddingBottom: 120 },
  title: { fontSize: 30, fontWeight: '900', color: INK, letterSpacing: -0.6 },
  countBadge: {
    minWidth: 36, height: 36, borderRadius: 18, backgroundColor: BLUE,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10,
  },
  countText: { fontSize: 14, fontWeight: '900', color: '#FFFFFF' },
  glassCard: {
    backgroundColor: SURFACE, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: BORDER,
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.04, shadowRadius: 25, elevation: 1,
    marginBottom: 16,
  },
  searchInner: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: SURFACE_LIGHT, borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 13, fontWeight: '700', color: INK, padding: 0 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: MUTED, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, paddingHorizontal: 4 },
  customerCard: {
    backgroundColor: SURFACE, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: BORDER,
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.03, shadowRadius: 16, elevation: 1,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
});
