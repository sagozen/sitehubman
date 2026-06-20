import { IosScrollView } from '@/src/components/IosScrollView';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput, View, Modal } from 'react-native';
import { Redirect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { GlassSafeScreen } from '@/src/components/GlassSafeScreen';
import {
  PrinterSettingsRow,
  PrinterSurfaceCard,
  PrinterSegment,
  printerUi,
} from '@/src/features/printer/components/PrinterScreenUi';
import { AppEmptyState } from '@/src/components/AppState';
import { appRoutes } from '@/src/constants/navigation';
import { theme } from '@/src/constants/theme';
import { useNotifications } from '@/src/hooks/useNotifications';
import { useActiveBatch } from '@/src/hooks/useActiveBatch';
import { useAuth } from '@/src/hooks/useAuth';
import { usePrinterJobs } from '@/src/hooks/usePrinterJobs';
import { searchEmptyMessage, useSearchQuery } from '@/src/hooks/useSearchQuery';
import { listApprovedPhysicalOrdersForPrinter } from '@/src/services/productionService';
import { Order, PrinterJob } from '@/src/types/models';
import { getPrinterIp, setPrinterIp, clearPrinterIp, printHtmlToIp } from '@/src/services/printService';
import { findOrderForPrintLookup, getPrinterJobByOrderId } from '@/src/services/firestoreService';
import {
  buildProductionLabelData,
  buildProductionLabelHtml,
} from '@/src/services/labelService';

const GREEN = '#34C759';
const BLUE = '#007AFF';
const SURFACE = '#FFFFFF';
const SURFACE_BORDER = 'rgba(60,60,67,0.14)';
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
      <View style={[styles.jobAccentRail, { backgroundColor: stage.color }]} />
      <View style={styles.compactCardRow}>
        <View style={styles.compactIconWrap}>
          <AppIcon name={stage.icon} size={18} color={stage.color} />
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

  const [printerIp, setPrinterIpState] = useState<string | null>(null);
  const [ipModalVisible, setIpModalVisible] = useState(false);
  const [ipInput, setIpInput] = useState('');
  const [printLookupInput, setPrintLookupInput] = useState('');
  const [testPrintBusy, setTestPrintBusy] = useState(false);

  useEffect(() => {
    async function loadPrinterIp() {
      const ip = await getPrinterIp();
      setPrinterIpState(ip);
      setIpInput(ip || '');
    }
    void loadPrinterIp();
  }, []);

  const handleSaveIp = async () => {
    const trimmed = ipInput.trim();
    if (trimmed) {
      await setPrinterIp(trimmed);
      setPrinterIpState(trimmed);
    } else {
      await clearPrinterIp();
      setPrinterIpState(null);
    }
    setIpModalVisible(false);
  };

  const handleTestPrint = async () => {
    if (testPrintBusy) return;
    const targetIp = (ipInput.trim() || printerIp || '').trim();
    if (!targetIp) {
      Alert.alert('Printer IP required', 'Add your print relay IP address before running a test print.');
      return;
    }
    const lookup = printLookupInput.trim();
    const sampleOrder = lookup ? await findOrderForPrintLookup(lookup) : approvedOrders[0];
    if (!sampleOrder) {
      Alert.alert(
        'Card not found',
        lookup
          ? 'No printable order matched that customer, order, or card ID.'
          : 'Enter a customer/order/card ID, or wait for a sales-approved order.'
      );
      return;
    }

    setTestPrintBusy(true);
    try {
      if (targetIp !== printerIp) {
        await setPrinterIp(targetIp);
        setPrinterIpState(targetIp);
      }
      const sampleJob =
        jobs.find((job) => job.orderId === sampleOrder.id) ??
        (await getPrinterJobByOrderId(sampleOrder.id).catch(() => null));
      const label = await buildProductionLabelData(sampleOrder, sampleJob);
      await printHtmlToIp(targetIp, buildProductionLabelHtml(label), label.orderCode);
      Alert.alert('Test print sent', `${label.orderCode} for ${sampleOrder.customerName} was sent to ${targetIp}.`);
    } catch (error) {
      Alert.alert('Test print failed', error instanceof Error ? error.message : 'Unable to send test print.');
    } finally {
      setTestPrintBusy(false);
    }
  };

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
  const sampleOrder = approvedOrders[0] ?? null;
  if (!batchLoading && !batchId) {
    // Batch is required for printer job scope — redirect to select one
    return <Redirect href="/printer/batch-select" />;
  }

  const activeTabLabel = tab === 'all' ? 'All' : tab === 'todo' ? 'TODO' : tab === 'doing' ? 'Doing' : 'Done';

  return (
    <GlassSafeScreen>
      <IosScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.profileAvatar}>
              <AppIcon name="Printer" size={20} color={BLUE} />
            </View>
            <View style={styles.profileCopy}>
              <AppText style={styles.heroEyebrow}>Production Workspace</AppText>
              <AppText style={styles.pageTitle}>Queue</AppText>
              <AppText style={styles.heroSub} numberOfLines={1}>
                {todayCount} job{todayCount === 1 ? '' : 's'} today · {needVerificationCount} pending QA
              </AppText>
            </View>
          </View>
          <Pressable
            onPress={() => router.push(appRoutes.printer.notifications)}
            style={({ pressed }) => [styles.headerIcon, pressed && styles.pressed]}
          >
            <AppIcon name="Bell" size={20} color={BLUE} />
            {unreadCount > 0 ? <View style={styles.unreadDot} /> : null}
          </Pressable>
        </View>

        <PrinterSurfaceCard style={styles.settingsCard}>
          <PrinterSettingsRow
            icon="Archive"
            title="Active Batch"
            subtitle="Current workspace batch"
            value={batch?.batchNumber ?? 'Select Batch'}
            onPress={() => router.push('/printer/batch-select')}
          />
          <PrinterSettingsRow
            icon="Printer"
            title="Print Relay IP"
            subtitle="Label printer endpoint"
            value={printerIp ? printerIp.replace(/^https?:\/\//, '') : 'Tap to connect'}
            onPress={() => setIpModalVisible(true)}
            last
          />
        </PrinterSurfaceCard>

        <Pressable
          onPress={() => {
            if (quickPrintJob) {
              router.push({ pathname: '/printer/nfc/[jobId]', params: { jobId: quickPrintJob.id } });
              return;
            }
            router.push('/printer/scan');
          }}
          style={({ pressed }) => [styles.primaryScanBtn, pressed && styles.primaryScanBtnPressed]}
        >
          <AppIcon name="ScanLine" size={20} color="#FFFFFF" />
          <AppText style={styles.primaryScanBtnText}>
            {quickPrintJob ? 'Resume Active Job' : 'Scan & Program Card'}
          </AppText>
        </Pressable>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <AppIcon name="Search" size={16} color="#8E8E93" />
            <TextInput
              value={searchInput}
              onChangeText={setSearchInput}
              onSubmitEditing={submitSearch}
              placeholder="Search queue, job, order"
              placeholderTextColor="#8E8E93"
              returnKeyType="search"
              style={styles.searchInput}
            />
            {searchInput.length > 0 ? (
              <Pressable onPress={clearSearch} hitSlop={8}>
                <AppIcon name="X" size={14} color="#8E8E93" />
              </Pressable>
            ) : null}
          </View>
        </View>

        <PrinterSegment
          items={['All', 'TODO', 'Doing', 'Done']}
          active={activeTabLabel}
          onChange={(val) => {
            const key = val === 'All' ? 'all' : val === 'TODO' ? 'todo' : val === 'Doing' ? 'doing' : 'done';
            setTab(key);
          }}
        />

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

      <Modal
        visible={ipModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIpModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconBg}>
                <AppIcon name="Printer" size={20} color={BLUE} />
              </View>
              <View style={styles.modalHeaderTitleWrap}>
                <AppText style={styles.modalTitle}>Print Test</AppText>
                <AppText style={styles.modalSubtitle}>Connect IP printer and print by ID</AppText>
              </View>
            </View>

            <View style={styles.modalBody}>
              <AppText style={styles.inputLabel}>PRINTER IP / ENDPOINT</AppText>
              <View style={styles.modalInputWrap}>
                <AppIcon name="Link" size={16} color="#94A3B8" />
                <TextInput
                  value={ipInput}
                  onChangeText={setIpInput}
                  placeholder="e.g. 192.168.1.100 or 192.168.1.100:3000"
                  placeholderTextColor="#94A3B8"
                  style={styles.modalInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <AppText style={styles.modalInfoText}>
                Sends the production label to your relay at /print.
              </AppText>

              <View style={styles.testPrintCard}>
                <AppText style={styles.inputLabel}>CUSTOMER / ORDER / CARD ID</AppText>
                <View style={styles.modalInputWrap}>
                  <AppIcon name="CreditCard" size={16} color="#8E8E93" />
                  <TextInput
                    value={printLookupInput}
                    onChangeText={setPrintLookupInput}
                    placeholder="Paste customer id, order id, ORD-1001, or card code"
                    placeholderTextColor="#8E8E93"
                    style={styles.modalInput}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                </View>
                <AppText style={styles.testPrintSub} numberOfLines={2}>
                  Empty uses next approved order{sampleOrder ? `: ${sampleOrder.customerName}` : '.'}
                </AppText>
                <Pressable
                  style={({ pressed }) => [
                    styles.testPrintBtn,
                    pressed && !testPrintBusy && styles.modalPressed,
                    testPrintBusy && styles.modalDisabled,
                  ]}
                  onPress={() => void handleTestPrint()}
                  disabled={testPrintBusy}
                >
                  {testPrintBusy ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <AppIcon name="Printer" size={16} color="#FFFFFF" />
                  )}
                  <AppText style={styles.testPrintBtnText}>
                    {testPrintBusy ? 'Sending...' : 'Test Print'}
                  </AppText>
                </Pressable>
              </View>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => {
                  setIpInput(printerIp || '');
                  setIpModalVisible(false);
                }}
              >
                <AppText style={styles.modalBtnCancelText}>Cancel</AppText>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnSave]}
                onPress={handleSaveIp}
              >
                <AppText style={styles.modalBtnSaveText}>Save Connection</AppText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </GlassSafeScreen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  bodyContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 120,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    paddingBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EBF7FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E8E93',
    fontFamily: theme.typography.fontFamilyBold,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#000000',
    fontFamily: theme.typography.fontFamilyBlack,
    letterSpacing: -0.6,
  },
  heroSub: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    fontFamily: theme.typography.fontFamilyMedium,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SURFACE_BORDER,
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  pressed: {
    opacity: 0.75,
  },
  settingsCard: {
    marginTop: 4,
  },
  primaryScanBtn: {
    height: 52,
    borderRadius: 24,
    backgroundColor: BLUE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  primaryScanBtnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  primaryScanBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamilyBlack,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: SURFACE,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SURFACE_BORDER,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
    padding: 0,
    fontFamily: theme.typography.fontFamilyMedium,
  },
  jobCard: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SURFACE_BORDER,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  jobAccentRail: {
    position: 'absolute',
    left: 0,
    top: 14,
    bottom: 14,
    width: 4,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  jobCardPressed: {
    opacity: 0.88,
  },
  compactCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  compactIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F2F2F7',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SURFACE_BORDER,
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
    fontSize: 10,
    fontWeight: '800',
    color: '#8E8E93',
    fontFamily: theme.typography.fontFamilyBold,
  },
  compactTitle: {
    marginTop: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
    fontFamily: theme.typography.fontFamilyExtraBold,
  },
  compactStagePill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactStageText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: theme.typography.fontFamilyBold,
  },
  compactBottom: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactMeta: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '600',
    fontFamily: theme.typography.fontFamilyMedium,
  },
  compactAmount: {
    fontSize: 14,
    color: '#1D1D1F',
    fontWeight: '800',
    fontFamily: theme.typography.fontFamilyExtraBold,
  },
  compactAmountCurrency: {
    fontSize: 14,
    color: '#FF9500',
    fontWeight: '800',
    fontFamily: theme.typography.fontFamilyExtraBold,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
    marginTop: 6,
    marginBottom: 4,
  },
  listTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#000',
    fontFamily: theme.typography.fontFamilyExtraBold,
  },
  listSubtitle: {
    marginTop: 1,
    fontSize: 11,
    color: 'rgba(60,60,67,0.45)',
    fontWeight: '600',
    fontFamily: theme.typography.fontFamilySemiBold,
  },
  listLink: {
    fontSize: 13,
    fontWeight: '600',
    color: BLUE,
    fontFamily: theme.typography.fontFamilySemiBold,
  },
  receiveSection: {
    gap: 8,
  },
  receiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: SURFACE,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SURFACE_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1,
  },
  receiveCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  receiveOrderId: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1D1D1F',
    fontFamily: theme.typography.fontFamilyExtraBold,
  },
  receiveMeta: {
    fontSize: 12,
    color: '#86868B',
    fontWeight: '500',
    fontFamily: theme.typography.fontFamilyMedium,
  },
  receiveBtn: {
    backgroundColor: GREEN,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    minWidth: 70,
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
    fontSize: 12,
    fontWeight: '800',
    fontFamily: theme.typography.fontFamilyBold,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 12,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 18,
    paddingBottom: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 34,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  modalIconBg: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#EAF3FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeaderTitleWrap: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000000',
    fontFamily: theme.typography.fontFamilyBlack,
    letterSpacing: -0.4,
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    fontFamily: theme.typography.fontFamilySemiBold,
    marginTop: 1,
  },
  modalBody: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8E8E93',
    letterSpacing: 0.5,
    marginBottom: 6,
    fontFamily: theme.typography.fontFamilyBold,
  },
  modalInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F2F2F7',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SURFACE_BORDER,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  modalInput: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
    padding: 0,
    fontFamily: theme.typography.fontFamilyMedium,
  },
  modalInfoText: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '600',
    lineHeight: 16,
    fontFamily: theme.typography.fontFamilyMedium,
  },
  testPrintCard: {
    marginTop: 14,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SURFACE_BORDER,
    padding: 14,
    gap: 10,
  },
  testPrintSub: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    color: '#6E6E73',
    fontFamily: theme.typography.fontFamilyMedium,
  },
  testPrintBtn: {
    height: 46,
    borderRadius: 14,
    backgroundColor: BLUE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  testPrintBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamilyBold,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: {
    backgroundColor: '#F2F2F7',
  },
  modalBtnCancelText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1D1D1F',
    fontFamily: theme.typography.fontFamilyBold,
  },
  modalBtnSave: {
    backgroundColor: BLUE,
  },
  modalBtnSaveText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamilyBlack,
  },
  modalPressed: {
    opacity: 0.86,
  },
  modalDisabled: {
    opacity: 0.5,
  },
});
