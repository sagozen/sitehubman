/**
 * PrinterQueueScreen — dark canvas, white floating job cards.
 * Design: deep blue/black bg, white cards, blue accent #007AFF.
 */
import { IosScrollView } from '@/src/components/IosScrollView';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { AppEmptyState } from '@/src/components/AppState';
import { useNotifications } from '@/src/hooks/useNotifications';
import { useActiveBatch } from '@/src/hooks/useActiveBatch';
import { useAuth } from '@/src/hooks/useAuth';
import { usePrinterJobs } from '@/src/hooks/usePrinterJobs';
import { useSearchQuery } from '@/src/hooks/useSearchQuery';
import { listApprovedPhysicalOrdersForPrinter } from '@/src/services/productionService';
import { getPrinterIp, setPrinterIp, clearPrinterIp, printHtmlToIp } from '@/src/services/printService';
import { findOrderForPrintLookup, getPrinterJobByOrderId } from '@/src/services/firestoreService';
import { buildProductionLabelData, buildProductionLabelHtml } from '@/src/services/labelService';
import type { Order, PrinterJob } from '@/src/types/models';

// ─── Tokens ──────────────────────────────────────────────────────────────────

const C = {
  accent:    '#007AFF',
  accentDim: 'rgba(0,122,255,0.20)',
  bg1:       '#060B18',
  bg2:       '#0D1A2E',
  card:      '#FFFFFF',
  cardText:  '#111111',
  cardMuted: '#888888',
  white:     '#FFFFFF',
  whiteDim:  'rgba(255,255,255,0.55)',
  pill:      '#111C2E',
  pillBorder:'rgba(255,255,255,0.08)',
  green:     '#34C759',
  orange:    '#FF9500',
  red:       '#FF3B30',
};

type TabFilter = 'all' | 'todo' | 'doing' | 'done';

const DOING_STAGES: PrinterJob['stage'][] = ['printing','nfc_encoding','quality_check','ready_to_ship','reprint'];

function stageInfo(stage: PrinterJob['stage']): { label: string; color: string } {
  if (stage === 'completed')     return { label: 'Done',        color: C.green  };
  if (stage === 'ready_to_ship') return { label: 'Ready',       color: C.green  };
  if (stage === 'quality_check') return { label: 'QA',          color: C.accent };
  if (stage === 'nfc_encoding')  return { label: 'NFC',         color: C.accent };
  if (stage === 'printing')      return { label: 'Printing',    color: C.green  };
  if (stage === 'received')      return { label: 'Queued',      color: C.orange };
  if (stage === 'reprint')       return { label: 'Reprint',     color: C.orange };
  if (stage === 'failed')        return { label: 'Issue',       color: C.red    };
  return { label: 'Queued', color: C.orange };
}

// ─── JobCard ──────────────────────────────────────────────────────────────────

function JobCard({ job }: { job: PrinterJob }) {
  const info = stageInfo(job.stage);
  const wage = (job.cardsPrinted * job.perCardBonus + job.perOrderBonus).toFixed(2);
  const date = new Date(job.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  function openJob() {
    if (job.stage === 'quality_check') {
      router.push({ pathname: '/printer/qa/[jobId]', params: { jobId: job.id } });
    } else {
      router.push({ pathname: '/printer/nfc/[jobId]', params: { jobId: job.id } });
    }
  }

  return (
    <Pressable
      style={({ pressed }) => [jc.wrap, pressed && { opacity: 0.85 }]}
      onPress={openJob}
    >
      {/* Colored top bar */}
      <View style={[jc.topBar, { backgroundColor: info.color }]} />
      <View style={jc.body}>
        <View style={jc.row}>
          <View>
            <AppText style={jc.overline}>JOB #{String(job.queueNumber).slice(-4)}</AppText>
            <AppText style={jc.orderId} numberOfLines={1}>Order {job.orderId.slice(0, 8).toUpperCase()}</AppText>
          </View>
          <View style={[jc.stagePill, { backgroundColor: info.color + '18' }]}>
            <AppText style={[jc.stageText, { color: info.color }]}>{info.label}</AppText>
          </View>
        </View>
        <View style={jc.footer}>
          <AppText style={jc.date}>{date}</AppText>
          <AppText style={jc.wage}><AppText style={{ color: C.orange }}>$</AppText>{wage}</AppText>
        </View>
      </View>
    </Pressable>
  );
}

const jc = StyleSheet.create({
  wrap: { backgroundColor: C.card, borderRadius: 20, overflow: 'hidden', marginBottom: 10 },
  topBar: { height: 3 },
  body: { padding: 16, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  overline: { fontSize: 10, fontWeight: '700', color: C.cardMuted, letterSpacing: 0.5 },
  orderId: { fontSize: 17, fontWeight: '700', color: C.cardText, marginTop: 2 },
  stagePill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  stageText: { fontSize: 12, fontWeight: '800' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  date: { fontSize: 12, color: C.cardMuted },
  wage: { fontSize: 16, fontWeight: '800', color: C.cardText },
});

// ─── ReadyCard — orders waiting for receive ───────────────────────────────────

function ReadyCard({ order }: { order: Order }) {
  return (
    <View style={rc.wrap}>
      <View style={rc.left}>
        <AppText style={rc.num}>{order.orderNumber ?? order.id.slice(0, 8)}</AppText>
        <AppText style={rc.meta} numberOfLines={1}>
          {order.customerName} · {order.quantity} card{order.quantity === 1 ? '' : 's'}
        </AppText>
      </View>
      <Pressable style={({ pressed }) => [rc.btn, pressed && { opacity: 0.8 }]}
        onPress={() => router.push('/printer/scan')}>
        <AppText style={rc.btnText}>Scan</AppText>
      </Pressable>
    </View>
  );
}

const rc = StyleSheet.create({
  wrap: { backgroundColor: C.card, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  left: { flex: 1, gap: 3 },
  num: { fontSize: 15, fontWeight: '700', color: C.cardText },
  meta: { fontSize: 12, color: C.cardMuted },
  btn: { backgroundColor: C.accent, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  btnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PrinterQueueScreen() {
  const { user }                 = useAuth();
  const { batch, batchId, isLoading: batchLoading } = useActiveBatch();
  const { jobs, isLoading, error } = usePrinterJobs();
  const { unreadCount }          = useNotifications();
  const [approvedOrders, setApprovedOrders] = useState<Order[]>([]);
  const [printerIp, setPrinterIpState]      = useState<string | null>(null);
  const [ipModalVisible, setIpModalVisible] = useState(false);
  const [ipInput, setIpInput]               = useState('');
  const [printLookupInput, setPrintLookupInput] = useState('');
  const [testPrintBusy, setTestPrintBusy]   = useState(false);
  const [tab, setTab] = useState<TabFilter>('all');
  const { input: searchInput, setInput: setSearchInput, query: searchQuery, submitSearch, clearSearch } = useSearchQuery();

  useEffect(() => {
    getPrinterIp().then(ip => { setPrinterIpState(ip); setIpInput(ip || ''); });
  }, []);

  const loadApproved = useCallback(async () => {
    try { setApprovedOrders(await listApprovedPhysicalOrdersForPrinter(user?.branch)); }
    catch { setApprovedOrders([]); }
  }, [user?.branch]);

  useEffect(() => { void loadApproved(); }, [loadApproved, jobs.length]);

  const filtered = useMemo(() => {
    const base =
      tab === 'all'   ? jobs.filter(j => j.stage !== 'failed') :
      tab === 'todo'  ? jobs.filter(j => j.stage === 'received') :
      tab === 'doing' ? jobs.filter(j => DOING_STAGES.includes(j.stage)) :
                        jobs.filter(j => j.stage === 'completed');
    const q = searchQuery.trim().toLowerCase();
    if (!q) return base;
    return base.filter(j => String(j.queueNumber).includes(q) || j.id.toLowerCase().includes(q) || j.orderId.toLowerCase().includes(q));
  }, [jobs, tab, searchQuery]);

  const todayCount  = jobs.length;
  const qaCount     = jobs.filter(j => j.stage === 'quality_check').length;
  const quickPrintJob = jobs.find(j => j.stage === 'received') ?? null;

  if (!batchLoading && !batchId) return <Redirect href="/printer/batch-select" />;

  const TAB_LABELS: Record<TabFilter, string> = { all: 'All', todo: 'TODO', doing: 'Doing', done: 'Done' };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={[C.bg1, C.bg2, C.bg1]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }} edges={['top','left','right']}>
        <IosScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Top ── */}
          <View style={s.topRow}>
            <View style={s.topCircle}>
              <AppIcon name="Printer" size={20} color={C.accent} />
            </View>
            <View style={s.topCenter}>
              <AppText style={s.topSub}>Production Workspace</AppText>
              <AppText style={s.topTitle}>Queue</AppText>
            </View>
            <Pressable
              style={({ pressed }) => [s.iconCircle, pressed && { opacity: 0.7 }]}
              onPress={() => router.push('/printer/notifications')}
            >
              <AppIcon name="Bell" size={20} color={C.white} />
              {unreadCount > 0 ? <View style={s.bellDot} /> : null}
            </Pressable>
          </View>

          {/* ── Stats banner — white card ── */}
          <View style={s.statsBanner}>
            <View style={s.statItem}>
              <AppText style={s.statVal}>{todayCount}</AppText>
              <AppText style={s.statLabel}>Jobs today</AppText>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <AppText style={[s.statVal, qaCount > 0 && { color: C.accent }]}>{qaCount}</AppText>
              <AppText style={s.statLabel}>Pending QA</AppText>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <AppText style={s.statVal}>{approvedOrders.length}</AppText>
              <AppText style={s.statLabel}>Ready to scan</AppText>
            </View>
          </View>

          {/* ── Batch + IP row ── */}
          <View style={s.infoRow}>
            <Pressable style={s.infoPill} onPress={() => router.push('/printer/batch-select')}>
              <AppIcon name="Archive" size={14} color={C.whiteDim} />
              <AppText style={s.infoPillText} numberOfLines={1}>{batch?.batchNumber ?? 'Select batch'}</AppText>
            </Pressable>
            <Pressable style={s.infoPill} onPress={() => setIpModalVisible(true)}>
              <AppIcon name="Printer" size={14} color={C.whiteDim} />
              <AppText style={s.infoPillText} numberOfLines={1}>{printerIp ? printerIp.replace(/^https?:\/\//,'') : 'Connect printer'}</AppText>
            </Pressable>
          </View>

          {/* ── Primary scan button ── */}
          <Pressable
            style={({ pressed }) => [s.scanBtn, pressed && { opacity: 0.85 }]}
            onPress={() => quickPrintJob
              ? router.push({ pathname: '/printer/nfc/[jobId]', params: { jobId: quickPrintJob.id } })
              : router.push('/printer/scan')
            }
          >
            <AppIcon name="ScanLine" size={20} color="#fff" />
            <AppText style={s.scanBtnText}>{quickPrintJob ? 'Resume Active Job' : 'Scan & Program Card'}</AppText>
          </Pressable>

          {/* ── Ready orders ── */}
          {approvedOrders.length > 0 ? (
            <>
              <View style={s.sectionRow}>
                <AppText style={s.sectionTitle}>Ready for production</AppText>
              </View>
              {approvedOrders.map(o => <ReadyCard key={o.id} order={o} />)}
            </>
          ) : null}

          {/* ── Search ── */}
          <View style={s.searchWrap}>
            <AppIcon name="Search" size={15} color={C.whiteDim} />
            <TextInput
              value={searchInput} onChangeText={setSearchInput} onSubmitEditing={submitSearch}
              placeholder="Search queue…" placeholderTextColor={C.whiteDim}
              returnKeyType="search" style={s.searchInput}
            />
            {searchInput.length > 0 ? <Pressable onPress={clearSearch} hitSlop={8}><AppIcon name="X" size={14} color={C.whiteDim} /></Pressable> : null}
          </View>

          {/* ── Tabs ── */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabRow}>
            {(['all','todo','doing','done'] as TabFilter[]).map(t => (
              <Pressable key={t} style={[s.tabPill, tab === t && s.tabPillActive]} onPress={() => setTab(t)}>
                <AppText style={[s.tabText, tab === t && s.tabTextActive]}>{TAB_LABELS[t]}</AppText>
              </Pressable>
            ))}
          </ScrollView>

          {/* ── Job list ── */}
          {isLoading && filtered.length === 0 ? (
            <View style={{ paddingTop: 40, alignItems: 'center' }}><ActivityIndicator color={C.accent} /></View>
          ) : filtered.length === 0 ? (
            <AppEmptyState role="printer" iconName="ClipboardList" title="No jobs" description="Queue is clear." />
          ) : (
            filtered.map(job => <JobCard key={job.id} job={job} />)
          )}

        </IosScrollView>
      </SafeAreaView>

      {/* ── IP / Print modal ── */}
      <Modal visible={ipModalVisible} transparent animationType="slide" onRequestClose={() => setIpModalVisible(false)}>
        <View style={m.backdrop}>
          <View style={m.sheet}>
            <View style={m.handle} />
            <AppText style={m.title}>Printer connection</AppText>
            <View style={m.inputWrap}>
              <AppIcon name="Link" size={15} color={C.whiteDim} />
              <TextInput value={ipInput} onChangeText={setIpInput} placeholder="192.168.1.100 or :3000"
                placeholderTextColor={C.whiteDim} style={m.input} autoCapitalize="none" autoCorrect={false} />
            </View>
            <View style={m.inputWrap}>
              <AppIcon name="CreditCard" size={15} color={C.whiteDim} />
              <TextInput value={printLookupInput} onChangeText={setPrintLookupInput}
                placeholder="Customer / order / card ID" placeholderTextColor={C.whiteDim}
                style={m.input} autoCapitalize="characters" autoCorrect={false} />
            </View>
            <View style={m.btnRow}>
              <Pressable style={m.cancel} onPress={() => setIpModalVisible(false)}>
                <AppText style={m.cancelText}>Cancel</AppText>
              </Pressable>
              <Pressable style={m.save} onPress={async () => {
                const t = ipInput.trim();
                if (t) { await setPrinterIp(t); setPrinterIpState(t); }
                else { await clearPrinterIp(); setPrinterIpState(null); }
                setIpModalVisible(false);
              }}>
                <AppText style={m.saveText}>Save</AppText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120 },

  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22 },
  topCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.accentDim, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.accent + '40' },
  topCenter: { flex: 1 },
  topSub: { fontSize: 12, color: C.whiteDim },
  topTitle: { fontSize: 22, fontWeight: '800', color: C.white },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.pill, borderWidth: 1, borderColor: C.pillBorder, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  bellDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: C.red, borderWidth: 1.5, borderColor: C.bg1 },

  statsBanner: { backgroundColor: C.card, borderRadius: 22, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statVal: { fontSize: 24, fontWeight: '800', color: C.cardText, letterSpacing: -0.5 },
  statLabel: { fontSize: 11, color: C.cardMuted, fontWeight: '500' },
  statDivider: { width: StyleSheet.hairlineWidth, height: 32, backgroundColor: 'rgba(0,0,0,0.1)' },

  infoRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  infoPill: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: C.pill, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: C.pillBorder },
  infoPillText: { flex: 1, fontSize: 12, color: C.whiteDim, fontWeight: '500' },

  scanBtn: { height: 52, borderRadius: 999, backgroundColor: C.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 },
  scanBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  sectionRow: { marginBottom: 10 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: C.white },

  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.pill, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: C.pillBorder, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 15, color: C.white, padding: 0 },

  tabRow: { gap: 8, paddingBottom: 14 },
  tabPill: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 999, backgroundColor: C.pill, borderWidth: 1, borderColor: C.pillBorder },
  tabPillActive: { backgroundColor: C.white, borderColor: C.white },
  tabText: { fontSize: 13, fontWeight: '600', color: C.whiteDim },
  tabTextActive: { color: C.cardText },
});

const m = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#111C2E', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36, gap: 14 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '800', color: C.white },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.pill, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: C.pillBorder },
  input: { flex: 1, fontSize: 14, color: C.white, padding: 0 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancel: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: C.pill, alignItems: 'center', borderWidth: 1, borderColor: C.pillBorder },
  cancelText: { color: C.white, fontSize: 15, fontWeight: '700' },
  save: { flex: 2, paddingVertical: 14, borderRadius: 14, backgroundColor: C.accent, alignItems: 'center' },
  saveText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
