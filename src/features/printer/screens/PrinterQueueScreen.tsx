import { IosScrollView } from '@/src/components/IosScrollView';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { BrandImage } from '@/src/components/BrandImage';
import { CloudinaryImage } from '@/src/components/CloudinaryImage';
import { LinearGradient } from 'expo-linear-gradient';
import {
  getProductPhotoFallback,
  getProductPhotoUrl,
  productPhotoIds,
} from '@/src/constants/productPhotoCatalog';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { AppEmptyState } from '@/src/components/AppState';
import { SquircleIconTile } from '@/src/components/SquircleIconTile';
import { appRoutes } from '@/src/constants/navigation';
import { theme } from '@/src/constants/theme';
import { useNotifications } from '@/src/hooks/useNotifications';
import { useActiveBatch } from '@/src/hooks/useActiveBatch';
import { useAuth } from '@/src/hooks/useAuth';
import { usePrinterJobs } from '@/src/hooks/usePrinterJobs';
import { searchEmptyMessage, useSearchQuery } from '@/src/hooks/useSearchQuery';
import { listApprovedPhysicalOrdersForPrinter } from '@/src/services/productionService';
import { Order, PrinterJob } from '@/src/types/models';

const GREEN = '#34C759';
const BLUE = '#007AFF';
const SURFACE = '#FFFFFF';
const SURFACE_BORDER = '#E2E8F0';
const SURFACE_RADIUS = 20;

type TabFilter = 'all' | 'todo' | 'doing' | 'done';

const DOING_STAGES: PrinterJob['stage'][] = [
  'printing',
  'nfc_encoding',
  'quality_check',
  'ready_to_ship',
  'reprint',
];

function formatJobDateTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return { dateText: '-', timeText: '-' };
  }

  return {
    dateText: date.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', year: '2-digit' }),
    timeText: date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false }),
  };
}

// Stage status with icon — green fade palette, orange $, verified icon for QA
function compactStage(stage: PrinterJob['stage']) {
  if (stage === 'completed')     return { label: 'Completed',    color: '#248A3D', bg: 'rgba(52,199,89,0.12)',  icon: 'CircleCheck'  as const };
  if (stage === 'ready_to_ship') return { label: 'Ready to Ship',color: '#248A3D', bg: 'rgba(52,199,89,0.10)',  icon: 'Package'      as const };
  if (stage === 'quality_check') return { label: 'QA Verify',    color: '#2D6FD4', bg: 'rgba(0,122,255,0.10)',  icon: 'BadgeCheck'   as const };
  if (stage === 'nfc_encoding')  return { label: 'NFC Encoding', color: '#2D6FD4', bg: 'rgba(0,122,255,0.08)',  icon: 'Nfc'          as const };
  if (stage === 'printing')      return { label: 'Printing',     color: '#248A3D', bg: 'rgba(52,199,89,0.08)',  icon: 'Printer'      as const };
  if (stage === 'received')      return { label: 'Received',     color: '#C93400', bg: 'rgba(255,149,0,0.10)',  icon: 'ClipboardList' as const };
  if (stage === 'reprint')       return { label: 'Reprint',      color: '#C93400', bg: 'rgba(255,149,0,0.10)',  icon: 'RefreshCw'    as const };
  if (stage === 'failed')        return { label: 'Issue',        color: '#D70015', bg: 'rgba(255,59,48,0.10)',  icon: 'CircleAlert'  as const };
  return                                { label: 'Received',     color: '#C93400', bg: 'rgba(255,149,0,0.10)',  icon: 'ClipboardList' as const };
}

function JobCard({ job }: { job: PrinterJob }) {
  const wage = (job.cardsPrinted * job.perCardBonus + job.perOrderBonus).toFixed(2);
  const { dateText, timeText } = formatJobDateTime(job.createdAt);
  const stage = compactStage(job.stage);
  const orderLabel = job.orderId?.slice(0, 8) ?? '—';

  function openJob() {
    if (job.stage === 'quality_check') {
      router.push({ pathname: '/printer/qa/[jobId]', params: { jobId: job.id } });
      return;
    }
    router.push({ pathname: '/printer/nfc/[jobId]', params: { jobId: job.id } });
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.jobCard, pressed && styles.jobCardPressed]}
      onPress={openJob}
    >
      <View style={styles.compactCardRow}>
        <View style={styles.compactIconWrap}>
          <AppIcon name="ClipboardList" size={18} color="#4B5563" />
        </View>
        <View style={styles.compactMain}>
          <View style={styles.compactTop}>
            <View style={styles.compactTitleWrap}>
              <AppText style={styles.compactOverline}>JOB #{String(job.queueNumber).slice(-4)}</AppText>
              <AppText style={styles.compactTitle} numberOfLines={1}>
                Order {orderLabel}
              </AppText>
            </View>
            <View style={[styles.compactStagePill, { backgroundColor: stage.bg }]}>
              <AppIcon name={stage.icon} size={11} color={stage.color} />
              <AppText style={[styles.compactStageText, { color: stage.color }]}>{stage.label}</AppText>
            </View>
          </View>
          <View style={styles.compactBottom}>
            <AppText style={styles.compactMeta}>
              {dateText} {timeText}
            </AppText>
            {/* Orange $ — warm money color, easy to scan */}
            <AppText style={styles.compactAmount}>
              <AppText style={styles.compactAmountCurrency}>$</AppText>
              {wage}
            </AppText>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function PrinterQueueScreen() {
  const { user } = useAuth();
  const { batch, batchId, isLoading: batchLoading } = useActiveBatch();
  const { jobs, isLoading, error } = usePrinterJobs();
  const { unreadCount } = useNotifications();
  const [approvedOrders, setApprovedOrders] = useState<Order[]>([]);

  const loadApproved = useCallback(async () => {
    try {
      setApprovedOrders(await listApprovedPhysicalOrdersForPrinter(user?.branch));
    } catch {
      setApprovedOrders([]);
    }
  }, [user?.branch]);

  useEffect(() => {
    void loadApproved();
  }, [loadApproved, jobs.length]);

  const [tab, setTab] = useState<TabFilter>('all');
  const {
    input: searchInput,
    setInput: setSearchInput,
    query: searchQuery,
    submitSearch,
    clearSearch,
  } = useSearchQuery();

  const filtered = useMemo(() => {
    const base =
      tab === 'all'
        ? jobs.filter((job) => job.stage !== 'failed')
        : tab === 'todo'
          ? jobs.filter((job) => job.stage === 'received')
          : tab === 'doing'
            ? jobs.filter((job) => DOING_STAGES.includes(job.stage))
            : jobs.filter((job) => job.stage === 'completed');

    const q = searchQuery.trim().toLowerCase();
    if (!q) return base;

    return base.filter((job) => {
      const queue = String(job.queueNumber);
      const id = job.id.toLowerCase();
      const orderId = job.orderId.toLowerCase();
      return queue.includes(q) || id.includes(q) || orderId.includes(q);
    });
  }, [jobs, tab, searchQuery]);

  const tabs: { key: TabFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'todo', label: 'TODO' },
    { key: 'doing', label: 'Doing' },
    { key: 'done', label: 'Done' },
  ];
  const todayCount = jobs.length;
  const needVerificationCount = jobs.filter((job) => job.stage === 'quality_check').length;
  const quickPrintJob = jobs.find((job) => job.stage === 'received') ?? null;

  if (!batchLoading && !batchId) {
    return <Redirect href="/printer/batch-select" />;
  }

  const workshopPhotoUrl = getProductPhotoUrl(productPhotoIds.printerWorkshop, 960);
  const workshopFallback = getProductPhotoFallback(productPhotoIds.printerWorkshop);

  return (
    <View style={styles.safe}>
      <SafeAreaView edges={['top']} style={styles.heroSafe}>
        <View style={styles.hero}>
          {workshopPhotoUrl ? (
            <CloudinaryImage
              uri={workshopPhotoUrl}
              width={960}
              crop="cover"
              style={StyleSheet.absoluteFill}
            />
          ) : workshopFallback ? (
            <BrandImage
              source={workshopFallback}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              recyclingKey="printer-workshop-hero"
            />
          ) : null}
          <LinearGradient
            colors={['rgba(16, 24, 39, 0.88)', 'rgba(26, 26, 46, 0.82)', 'rgba(14, 58, 70, 0.78)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroContent}>
          <View style={styles.heroTop}>
            <View style={styles.workshopLbl}>
              <AppIcon name="Settings" size={13} color="rgba(255,255,255,0.45)" />
              <AppText style={styles.workshopTxt}>Workshop</AppText>
            </View>
            <Pressable
              style={styles.notifBtn}
              onPress={() => router.push(appRoutes.printer.notifications)}
              hitSlop={8}
            >
              <View>
                <SquircleIconTile name="Bell" sizeKey="sm" iconColor={BLUE} />
                {unreadCount > 0 ? <View style={styles.notifDot} /> : null}
              </View>
            </Pressable>
          </View>

          <AppText style={styles.pageTitle}>Job Queue</AppText>
          <Pressable onPress={() => router.push('/printer/batch-select')} hitSlop={8}>
            <AppText style={styles.batchLink}>
              Batch: {batch?.batchNumber ?? '—'} · tap to change
            </AppText>
          </Pressable>
          <View style={styles.heroStatsRow}>
            <AppText style={styles.heroSub}>Print, encode, and verify cards</AppText>
            <View style={styles.heroTodayWrap}>
              <AppText style={styles.heroTodayNum}>{todayCount}</AppText>
              <AppText style={styles.heroTodayLabel}>Today</AppText>
            </View>
          </View>

          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <AppIcon name="Search" size={16} color="rgba(255,255,255,0.45)" />
              <TextInput
                value={searchInput}
                onChangeText={setSearchInput}
                onSubmitEditing={submitSearch}
                placeholder="Search queue, job, order"
                placeholderTextColor="rgba(255,255,255,0.35)"
                returnKeyType="search"
                style={styles.searchInput}
              />
              {searchInput.length > 0 ? (
                <Pressable onPress={clearSearch} hitSlop={8}>
                  <AppIcon name="X" size={14} color="rgba(255,255,255,0.45)" />
                </Pressable>
              ) : null}
            </View>
            <Pressable
              style={styles.searchBtn}
              onPress={() => {
                if (quickPrintJob) {
                  router.push({
                    pathname: '/printer/nfc/[jobId]',
                    params: { jobId: quickPrintJob.id },
                  });
                  return;
                }
                router.push('/printer/scan');
              }}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="rgba(255,255,255,0.8)" />
              ) : (
                <>
                  <AppIcon name="ScanLine" size={17} color="rgba(255,255,255,0.94)" />
                  <AppText style={styles.searchBtnText}>{quickPrintJob ? 'Start' : 'Scan'}</AppText>
                </>
              )}
            </Pressable>
          </View>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.tabsWrap}>
        <IosScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {tabs.map((item) => {
            const active = tab === item.key;
            return (
              <Pressable
                key={item.key}
                style={[styles.tabItem, active && styles.tabItemActive]}
                onPress={() => setTab(item.key)}
              >
                <View style={[styles.tabItemInner, active && styles.tabItemInnerActive]}>
                  <AppText style={[styles.tabItemText, active && styles.tabItemTextOn]}>{item.label}</AppText>
                </View>
              </Pressable>
            );
          })}
        </IosScrollView>
      </View>

      <IosScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        {approvedOrders.length > 0 ? (
          <View style={styles.receiveSection}>
            <View style={styles.listHeader}>
              <View>
                <AppText style={styles.listTitle}>Ready for production</AppText>
                <AppText style={styles.listSubtitle}>Sales-approved orders ready to scan</AppText>
              </View>
            </View>
            {approvedOrders.map((order) => (
              <View key={order.id} style={styles.receiveCard}>
                <View style={styles.receiveCopy}>
                  <AppText style={styles.receiveOrderId}>{order.orderNumber ?? order.id.slice(0, 8)}</AppText>
                  <AppText style={styles.receiveMeta}>
                    {order.customerName} · {order.quantity} card{order.quantity === 1 ? '' : 's'}
                  </AppText>
                </View>
                <View style={styles.receiveActions}>
                  <Pressable
                    style={[styles.receiveBtn, styles.receiveLabelBtn]}
                    onPress={() => {
                      router.push({ pathname: '/production-label/[orderId]', params: { orderId: order.id } });
                    }}
                  >
                    <AppText style={[styles.receiveBtnText, styles.receiveLabelText]}>Label</AppText>
                  </Pressable>
                  <Pressable style={styles.receiveBtn} onPress={() => router.push('/printer/scan')}>
                    <AppText style={styles.receiveBtnText}>Scan</AppText>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {error ? (
          <View style={styles.stateWrap}>
            <AppText variant="body" style={styles.errorText}>
              {error}
            </AppText>
            <AppText variant="caption" tone="muted" style={styles.errorHint}>
              Role: {user?.role ?? '—'} · Branch: {user?.branch?.trim() || 'not set'} · Batch:{' '}
              {batch?.batchNumber ?? batchId ?? '—'}
            </AppText>
            <Pressable style={styles.errorAction} onPress={() => router.push('/printer/batch-select')}>
              <AppText style={styles.errorActionText}>Change batch</AppText>
            </Pressable>
          </View>
        ) : null}
        {isLoading && filtered.length === 0 ? (
          <View style={styles.stateWrap}>
            <AppText variant="body" tone="muted">
              Loading queue...
            </AppText>
          </View>
        ) : filtered.length === 0 ? (
          <AppEmptyState
            role="printer"
            iconName="ClipboardList"
            title="No jobs"
            description={searchEmptyMessage(
              false,
              Boolean(searchQuery),
              searchQuery,
              tab === 'all' ? 'Queue is clear right now.' : 'No jobs in this category right now.'
            )}
          />
        ) : (
          <>
            <View style={styles.listHeader}>
              <View>
                <AppText style={styles.listTitle}>Job Queue</AppText>
                <AppText style={styles.listSubtitle}>
                  {needVerificationCount} job{needVerificationCount === 1 ? '' : 's'} need verification
                </AppText>
              </View>
              <Pressable onPress={() => router.push('/printer/scan')} hitSlop={8}>
                <AppText style={styles.listLink}>See all</AppText>
              </Pressable>
            </View>
            {filtered.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </>
        )}
      </IosScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  heroSafe: {
    backgroundColor: theme.colors.background,
  },
  hero: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  heroContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 10,
    position: 'relative',
    zIndex: 1,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  workshopLbl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  workshopTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.68)',
  },
  notifBtn: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0,
    lineHeight: 34,
    marginBottom: 0,
  },
  batchLink: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.64)',
    marginTop: -4,
    marginBottom: 0,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  heroSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.58)',
  },
  heroTodayWrap: {
    alignItems: 'flex-end',
    gap: 1,
  },
  heroTodayNum: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 20,
  },
  heroTodayLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.20)',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
    padding: 0,
  },
  searchBtn: {
    width: 76,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  searchBtnText: {
    color: 'rgba(255,255,255,0.94)',
    fontSize: 12,
    fontWeight: '800',
  },
  tabsWrap: {
    backgroundColor: '#F4F6FA',
    paddingHorizontal: 14,
    paddingTop: 6,
  },
  tabs: {
    width: '100%',
    backgroundColor: '#EEF2F6',
    borderRadius: 15,
    padding: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SURFACE_BORDER,
  },
  tabItem: {
    flex: 1,
    minWidth: 70,
    alignItems: 'center',
    borderRadius: 11,
    marginHorizontal: 2,
    backgroundColor: 'transparent',
  },
  tabItemInner: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 9,
  },
  tabItemActive: {
    backgroundColor: '#001035',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
    shadowColor: '#001035',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 1,
  },
  tabItemInnerActive: {
    borderTopWidth: 0,
  },
  tabItemText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8EA0B8',
  },
  tabItemTextOn: {
    color: '#fff',
  },
  body: { flex: 1 },
  bodyContent: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 120,
    gap: 8,
  },
  jobCard: {
    backgroundColor: SURFACE,
    borderRadius: SURFACE_RADIUS,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SURFACE_BORDER,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
  },
  jobCardPressed: {
    opacity: 0.82,
  },
  compactCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  compactIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#F5F7FB',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E4EAF3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactMain: {
    flex: 1,
    minWidth: 0,
  },
  compactTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  compactTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  compactOverline: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  compactTitle: {
    marginTop: 1,
    fontSize: 16,
    lineHeight: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0,
  },
  compactStagePill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactStageText: {
    fontSize: 10,
    fontWeight: '700',
  },
  compactBottom: {
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactMeta: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  // Orange $ — warm, familiar money color (like Venmo, PayPal, etc.)
  compactAmount: {
    fontSize: 13,
    color: '#1D1D1F',
    fontWeight: '800',
  },
  compactAmountCurrency: {
    fontSize: 13,
    color: '#FF9500',
    fontWeight: '800',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
    paddingBottom: 6,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0,
  },
  listSubtitle: {
    marginTop: 1,
    fontSize: 11,
    color: 'rgba(60,60,67,0.45)',
    fontWeight: '500',
  },
  listLink: {
    fontSize: 14,
    fontWeight: '500',
    color: BLUE,
  },
  receiveSection: {
    marginBottom: 8,
  },
  receiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: SURFACE,
    borderRadius: SURFACE_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SURFACE_BORDER,
    padding: 14,
    marginBottom: 10,
  },
  receiveCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  receiveOrderId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D1D1F',
  },
  receiveMeta: {
    fontSize: 12,
    color: '#86868B',
  },
  receiveBtn: {
    backgroundColor: GREEN,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 76,
    alignItems: 'center',
  },
  receiveActions: {
    flexDirection: 'row',
    gap: 8,
  },
  receiveLabelBtn: {
    backgroundColor: '#EEF2F7',
  },
  receiveBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  receiveLabelText: {
    color: '#1D1D1F',
  },
  stateWrap: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  errorText: {
    color: theme.status.error,
    textAlign: 'center',
  },
  errorHint: {
    textAlign: 'center',
    marginTop: 6,
  },
  errorAction: {
    marginTop: 12,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: BLUE,
  },
  errorActionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
