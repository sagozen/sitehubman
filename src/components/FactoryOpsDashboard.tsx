import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import * as Haptics from 'expo-haptics';
import { db } from '@/src/services/firebaseClient';
import { AppText } from '@/src/components/AppText';

// ==========================================
// 📦 ENTERPRISE PRODUCT ASSET MAPPING
// ==========================================
export interface ProductAssetSpec {
  name: string;
  material: string;
  badge: string;
  icon: string;
}

export const FACTORY_PRODUCT_SPECS: Record<string, ProductAssetSpec> = {
  // Core Production Catalog
  wood_card: { name: 'Eco Wood Card', material: 'FSC Certified Bamboo', badge: 'Eco', icon: '🪵' },
  metal_card: { name: 'Matte Steel Card', material: 'Stainless Steel (15g)', badge: 'Metal', icon: '⚙️' },
  pvc_card: { name: 'Poly Matte PVC', material: 'Recycled Polymer (0.76mm)', badge: 'Standard', icon: '💳' },
  ecard: { name: 'Digital Smart Card', material: 'Cloud Virtual NFC', badge: 'Digital', icon: '📱' },

  // Executive & Bespoke Finishes
  matte_black_metal: { name: 'Matte Black Metal', material: 'Anodized Steel Laser-Etched', badge: 'Executive', icon: '🖤' },
  bamboo_pvc: { name: 'Bamboo Hybrid PVC', material: 'Natural Bamboo Veneer', badge: 'Eco Luxe', icon: '🎋' },
  card_standard: { name: 'Standard PVC', material: 'PVC Plastic Core', badge: 'Standard', icon: '💳' },
  card_premium: { name: 'Premium Metal', material: 'Precision Milled Steel', badge: 'Premium', icon: '⚙️' },
  card_luxury: { name: 'Luxury Carbon Fiber', material: 'Aerospace Grade 3K Twill', badge: 'Luxury', icon: '💎' },
  gold_premium: { name: '24K Gold Mirror', material: 'Electroplated Brass Core', badge: 'Limited', icon: '✨' },
  rose_gold: { name: 'Rose Gold Metallic', material: 'Aircraft Aluminum Alloy', badge: 'Bespoke', icon: '🌸' },
  classic_black: { name: 'Classic Black Matte', material: 'Anti-Glare Polymer', badge: 'Classic', icon: '🕶️' },
  classic_white: { name: 'Classic Pure White', material: 'Ceramic Composite PVC', badge: 'Minimal', icon: '⚪' },
};

export function resolveProductSpec(rawKey?: string): ProductAssetSpec {
  if (!rawKey) {
    return { name: 'NFC Smart Card', material: 'Composite PVC', badge: 'Custom', icon: '💳' };
  }
  const normalizedKey = rawKey.toLowerCase().trim().replace(/[\s-]+/g, '_');
  if (FACTORY_PRODUCT_SPECS[normalizedKey]) {
    return FACTORY_PRODUCT_SPECS[normalizedKey];
  }
  // Fallback human readable formatting
  const formattedName = rawKey
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    name: formattedName,
    material: 'Production Substrate',
    badge: 'Hardware',
    icon: '🖨️',
  };
}

export interface FactoryPrintJob {
  id: string;
  orderNumber?: string;
  companyId?: string;
  customerName?: string;
  productType: string;
  quantity?: number;
  status: 'pending_print' | 'printing' | 'printed' | 'nfc_writing' | 'qa_pending' | 'ready_to_ship' | string;
  updatedAt?: any;
}

export interface FactoryOpsDashboardProps {
  embedded?: boolean;
}

export const FactoryOpsDashboard: React.FC<FactoryOpsDashboardProps> = ({ embedded = false }) => {
  const [jobs, setJobs] = useState<FactoryPrintJob[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  const prevJobCount = useRef<number>(0);

  // Smooth live radar pulse animation
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim]);

  useEffect(() => {
    // Real-time Firestore production stream
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('status', 'in', [
        'printing',
        'pending_print',
        'printed',
        'nfc_writing',
        'qa_pending',
        'ready_to_ship',
      ]),
      limit(20)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const activeJobs: FactoryPrintJob[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          activeJobs.push({
            id: docSnap.id,
            orderNumber: data.orderNumber || `ORD-${docSnap.id.slice(0, 6).toUpperCase()}`,
            companyId: data.companyId || 'PROD',
            customerName: data.customerName || 'Direct Client',
            productType: data.productType || 'pvc_card',
            quantity: Number(data.quantity || 1),
            status: data.status || 'printing',
            updatedAt: data.updatedAt,
          });
        });

        // Trigger native haptic feedback when new production batch arrives or shifts
        if (
          prevJobCount.current > 0 &&
          activeJobs.length !== prevJobCount.current &&
          Platform.OS !== 'web'
        ) {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        prevJobCount.current = activeJobs.length;

        setJobs(activeJobs);
        setLoading(false);
        setErrorState(null);
      },
      (err) => {
        console.warn('[FACTORY OPS DASHBOARD SNAPSHOT DEFERRED]', err);
        setErrorState('Offline or queue snapshot sync deferred.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const getStatusBadgeConfig = (status: string) => {
    switch (status) {
      case 'printing':
        return { label: 'PRINTING', bg: 'rgba(59, 130, 246, 0.15)', text: '#60A5FA', border: '#3B82F6' };
      case 'pending_print':
        return { label: 'QUEUED', bg: 'rgba(245, 158, 11, 0.15)', text: '#FBBF24', border: '#F59E0B' };
      case 'nfc_writing':
        return { label: 'NFC ENCODE', bg: 'rgba(168, 85, 247, 0.15)', text: '#C084FC', border: '#A855F7' };
      case 'qa_pending':
        return { label: 'QA INSPECT', bg: 'rgba(20, 184, 166, 0.15)', text: '#2DD4BF', border: '#14B8A6' };
      case 'printed':
      case 'ready_to_ship':
        return { label: 'READY', bg: 'rgba(16, 185, 129, 0.15)', text: '#34D399', border: '#10B981' };
      default:
        return { label: status.replace(/_/g, ' ').toUpperCase(), bg: 'rgba(255, 255, 255, 0.08)', text: '#A1A1AA', border: 'rgba(255, 255, 255, 0.15)' };
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color="#FFFFFF" />
        <AppText style={styles.loadingText}>Synchronizing Factory Telemetry...</AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Header telemetry row */}
        <View style={styles.headerRow}>
          <View>
            <AppText style={styles.sectionHeader}>Live Production Line</AppText>
            <AppText style={styles.sectionSub}>Hardware Assembly & NFC Encoding</AppText>
          </View>
          <View style={styles.pulseIndicator}>
            <Animated.View style={[styles.pulseDot, { opacity: pulseAnim }]} />
            <AppText style={styles.pulseText}>LIVE STREAM</AppText>
          </View>
        </View>

        {errorState && (
          <View style={styles.errorBanner}>
            <AppText style={styles.errorText}>{errorState}</AppText>
          </View>
        )}

        {jobs.length === 0 ? (
          <View style={styles.emptyCard}>
            <AppText style={styles.emptyIcon}>🛡️</AppText>
            <AppText style={styles.emptyTitle}>Assembly Line Clear</AppText>
            <AppText style={styles.emptyText}>All hardware orders have been packaged and deployed.</AppText>
          </View>
        ) : embedded ? (
          <View style={styles.listContent}>
            {jobs.map((item) => {
              const spec = resolveProductSpec(item.productType);
              const badge = getStatusBadgeConfig(item.status);

              return (
                <View key={item.id} style={styles.jobCard}>
                  {/* Top card strip */}
                  <View style={styles.cardHeader}>
                    <View style={styles.titleGroup}>
                      <AppText style={styles.productIcon}>{spec.icon}</AppText>
                      <View>
                        <AppText style={styles.jobTitle}>{spec.name}</AppText>
                        <AppText style={styles.jobSub}>{spec.material}</AppText>
                      </View>
                    </View>

                    <View style={[styles.badgeBase, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                      <AppText style={[styles.badgeText, { color: badge.text }]}>
                        {badge.label}
                      </AppText>
                    </View>
                  </View>

                  {/* Card divider */}
                  <View style={styles.cardDivider} />

                  {/* Operational telemetry metadata */}
                  <View style={styles.metaRow}>
                    <View style={styles.metaCol}>
                      <AppText style={styles.metaLabel}>BATCH TAG</AppText>
                      <AppText style={styles.metaValue}>{item.orderNumber}</AppText>
                    </View>

                    <View style={styles.metaCol}>
                      <AppText style={styles.metaLabel}>TIER</AppText>
                      <AppText style={styles.metaValue}>{spec.badge}</AppText>
                    </View>

                    <View style={styles.metaCol}>
                      <AppText style={styles.metaLabel}>UNITS</AppText>
                      <AppText style={styles.metaHighlight}>{item.quantity || 1} pcs</AppText>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <FlatList
            data={jobs}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const spec = resolveProductSpec(item.productType);
              const badge = getStatusBadgeConfig(item.status);

              return (
                <View style={styles.jobCard}>
                  {/* Top card strip */}
                  <View style={styles.cardHeader}>
                    <View style={styles.titleGroup}>
                      <AppText style={styles.productIcon}>{spec.icon}</AppText>
                      <View>
                        <AppText style={styles.jobTitle}>{spec.name}</AppText>
                        <AppText style={styles.jobSub}>{spec.material}</AppText>
                      </View>
                    </View>

                    <View style={[styles.badgeBase, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                      <AppText style={[styles.badgeText, { color: badge.text }]}>
                        {badge.label}
                      </AppText>
                    </View>
                  </View>

                  {/* Card divider */}
                  <View style={styles.cardDivider} />

                  {/* Operational telemetry metadata */}
                  <View style={styles.metaRow}>
                    <View style={styles.metaCol}>
                      <AppText style={styles.metaLabel}>BATCH TAG</AppText>
                      <AppText style={styles.metaValue}>{item.orderNumber}</AppText>
                    </View>

                    <View style={styles.metaCol}>
                      <AppText style={styles.metaLabel}>TIER</AppText>
                      <AppText style={styles.metaValue}>{spec.badge}</AppText>
                    </View>

                    <View style={styles.metaCol}>
                      <AppText style={styles.metaLabel}>UNITS</AppText>
                      <AppText style={styles.metaHighlight}>{item.quantity || 1} pcs</AppText>
                    </View>
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Unified Deep Dark Canvas & Responsive Constraints
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 24,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 13,
    color: '#8E8E93',
  },

  // Telemetry Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  sectionSub: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  pulseIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.25)',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34C759',
    marginRight: 6,
  },
  pulseText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#34C759',
    letterSpacing: 0.8,
  },

  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#F87171',
    textAlign: 'center',
  },

  // Empty State
  emptyCard: {
    backgroundColor: '#111114',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Bento Job Cards
  listContent: {
    paddingBottom: 24,
  },
  jobCard: {
    backgroundColor: '#111114',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  productIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  jobTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  jobSub: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },

  badgeBase: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 12,
  },

  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#636366',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#E5E5EA',
  },
  metaHighlight: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
