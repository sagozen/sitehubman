import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrinterBoldDuotone, CheckCircleBoldDuotone, Card2BoldDuotone, DangerCircleBoldDuotone } from '@solar-icons/react-native';
import { IosScrollView } from '@/src/components/IosScrollView';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { useAuth } from '@/src/hooks/useAuth';
import { useOrders } from '@/src/hooks/useOrders';
import { formatOrderTotal } from '@/src/utils/orderPricing';

// ─── Tokens ─────────────────────────────────────────────────────────────────
const BG = '#F8FAFC';
const SURFACE = 'rgba(255, 255, 255, 0.86)';
const SURFACE_LIGHT = '#F1F5F9';
const BORDER = 'rgba(0,0,0,0.06)';
const INK = '#020617';
const MUTED = '#64748B';
const BLUE = '#2563EB';
const PURPLE = '#7C3AED';

export default function SalesPrintJobsScreen() {
  const { user } = useAuth();
  const { orders, isLoading } = useOrders('sales', user?.id ?? '');

  // Filter only active print jobs
  const printJobs = useMemo(() => {
    return orders.filter(o => 
      ['printer_assigned', 'printing', 'nfc_writing', 'qa_pending'].includes(o.status)
    ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [orders]);

  function getStatusInfo(status: string) {
    switch (status) {
      case 'printer_assigned': return { label: 'Assigned', color: PURPLE, icon: <PrinterBoldDuotone size={18} color={PURPLE} /> };
      case 'printing': return { label: 'Printing', color: '#0891B2', icon: <PrinterBoldDuotone size={18} color="#0891B2" /> };
      case 'nfc_writing': return { label: 'NFC Writing', color: '#2563EB', icon: <Card2BoldDuotone size={18} color="#2563EB" /> };
      case 'qa_pending': return { label: 'QA Check', color: '#D97706', icon: <DangerCircleBoldDuotone size={18} color="#D97706" /> };
      default: return { label: 'Unknown', color: MUTED, icon: <CheckCircleBoldDuotone size={18} color={MUTED} /> };
    }
  }

  return (
    <View style={[s.bg, { overflow: 'hidden' }]}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <IosScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingBottom: 16, gap: 12 }}>
            <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
              <AppIcon name="ChevronLeft" size={24} color={INK} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <AppText style={{ fontSize: 10, fontWeight: '900', color: PURPLE, letterSpacing: 1 }}>ACTIVE JOBS</AppText>
              <AppText style={{ fontSize: 30, fontWeight: '900', color: INK, letterSpacing: -0.5 }}>Print Queue</AppText>
            </View>
            <View style={s.slidersBtn}>
              <PrinterBoldDuotone size={20} color={INK} />
            </View>
          </View>

          {/* Jobs List */}
          {isLoading && printJobs.length === 0 ? (
            <ActivityIndicator color={PURPLE} style={{ marginVertical: 32 }} />
          ) : printJobs.length === 0 ? (
            <View style={s.glassCard}>
              <AppText style={{ fontSize: 14, fontWeight: '800', color: MUTED, textAlign: 'center', marginVertical: 20 }}>
                No active print jobs.
              </AppText>
            </View>
          ) : (
            <View style={[s.glassCard, { padding: 0, overflow: 'hidden' }]}>
              {printJobs.map((o, idx) => {
                const info = getStatusInfo(o.status);
                const orderRef = o.orderNumber ?? o.id.slice(0, 8).toUpperCase();
                return (
                  <Pressable
                    key={o.id}
                    style={({ pressed }) => [
                      s.orderRow,
                      idx < printJobs.length - 1 && s.rowDivider,
                      pressed && { backgroundColor: '#F8FAFF' },
                    ]}
                    onPress={() => router.push(`/print-job/${o.id}` as any)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16 }}>
                      {/* Left icon */}
                      <View style={[s.cardIconBox, { backgroundColor: info.color + '1A' }]}>
                        {info.icon}
                      </View>

                      {/* Main info */}
                      <View style={{ flex: 1 }}>
                        <AppText style={{ fontSize: 14, fontWeight: '900', color: INK }} numberOfLines={1}>
                          {o.customerName ?? 'Guest'}
                        </AppText>
                        <AppText style={{ fontSize: 11, fontWeight: '600', color: MUTED, marginTop: 3 }}>
                          #{orderRef}
                        </AppText>
                      </View>

                      {/* Status badge */}
                      <View style={{ alignItems: 'flex-end', gap: 6 }}>
                        <View style={[s.badge, { backgroundColor: info.color + '1A' }]}>
                          <AppText style={{ fontSize: 9, fontWeight: '900', color: info.color, letterSpacing: 0.2 }}>
                            {info.label.toUpperCase()}
                          </AppText>
                        </View>
                        <AppIcon name="ChevronRight" size={14} color={MUTED} />
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

        </IosScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: BG },
  scroll: { paddingHorizontal: 16, paddingBottom: 120 },
  slidersBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: SURFACE,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER,
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 1,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: SURFACE,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER,
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 1,
  },
  glassCard: {
    backgroundColor: SURFACE, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: BORDER,
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.05, shadowRadius: 25, elevation: 1,
    marginBottom: 12,
  },
  orderRow: { backgroundColor: 'transparent' },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  cardIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: SURFACE_LIGHT, alignItems: 'center', justifyContent: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
});
