import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IosScrollView } from '@/src/components/IosScrollView';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { useAuth } from '@/src/hooks/useAuth';
import { useOrders } from '@/src/hooks/useOrders';

const BG = '#F8FAFC';
const SURFACE = 'rgba(255, 255, 255, 0.86)';
const SURFACE_LIGHT = '#F1F5F9';
const BORDER = 'rgba(15,23,42,0.06)';
const INK = '#020617';
const MUTED = '#64748B';
const BLUE = '#0E7490'; // Dark Aqua Blue

interface LocalCustomer {
  id: string;
  name: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  joinedAt: number;
}

export default function SalesCustomersScreen() {
  const { user } = useAuth();
  const { orders, isLoading, refresh } = useOrders('sales', user?.id ?? '');
  const [search, setSearch] = useState('');

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Aggregate customer details from orders
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
    const q = search.toLowerCase().trim();
    if (!q) return customers.sort((a, b) => b.totalSpent - a.totalSpent);
    return customers
      .filter((c) => c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q))
      .sort((a, b) => b.totalSpent - a.totalSpent);
  }, [customers, search]);

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
            <View>
              <AppText style={{ fontSize: 10, fontWeight: '900', color: BLUE, letterSpacing: 1 }}>NFC GLOBAL SALES</AppText>
              <AppText style={s.title}>Customers</AppText>
            </View>
          </View>

          {/* Search bar */}
          <View style={s.glassCard}>
            <View style={s.searchInner}>
              <AppIcon name="Search" size={16} color={MUTED} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search name, phone number..."
                placeholderTextColor={MUTED}
                style={s.searchInput}
              />
            </View>
          </View>

          <AppText style={s.sectionLabel}>Customer History</AppText>

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
              {filtered.map((c) => (
                <View key={c.id} style={s.customerCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={s.avatar}>
                      <AppText style={{ fontSize: 16, fontWeight: '900', color: '#FFFFFF' }}>
                        {c.name.split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase()}
                      </AppText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText style={{ fontSize: 16, fontWeight: '900', color: INK }}>{c.name}</AppText>
                      <AppText style={{ fontSize: 12, fontWeight: '600', color: MUTED, marginTop: 1 }}>{c.phone}</AppText>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <AppText style={{ fontSize: 16, fontWeight: '900', color: INK }}>${c.totalSpent.toFixed(2)}</AppText>
                      <AppText style={{ fontSize: 10, fontWeight: '900', color: MUTED, marginTop: 1 }}>{c.totalOrders} order{c.totalOrders === 1 ? '' : 's'}</AppText>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </IosScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: BG },
  blob: { position: 'absolute', opacity: 0.8 },
  scroll: { paddingHorizontal: 16, paddingBottom: 120 },
  title: { fontSize: 30, fontWeight: '900', color: INK, letterSpacing: -0.6 },
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
