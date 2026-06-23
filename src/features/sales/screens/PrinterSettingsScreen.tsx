/**
 * PrinterSettingsScreen — manage printer configurations.
 *
 * Sales can add printers (name, IP, port, location),
 * test connections, set defaults, and delete printers.
 * Data stored in AsyncStorage via printerStorageService.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AltArrowLeftBoldDuotone,
  PrinterBoldDuotone,
  AddCircleBoldDuotone,
  CheckCircleBoldDuotone,
  CloseCircleBoldDuotone,
  TrashBinTrashBoldDuotone,
  Settings2BoldDuotone,
} from '@solar-icons/react-native';
import { AppText } from '@/src/components/AppText';
import {
  getAllPrinters,
  addPrinter,
  updatePrinter,
  deletePrinter,
  setDefaultPrinter,
  testPrinterConnection,
  type PrinterConfig,
} from '@/src/services/printerStorageService';

// ─── Tokens ──────────────────────────────────────────────────────────────────
const BG      = '#F7F8FC';
const SURFACE = '#FFFFFF';
const SURF2   = '#F1F5F9';
const BORDER  = 'rgba(15,23,42,0.07)';
const INK     = '#0F172A';
const MUTED   = '#64748B';
const DIM     = '#94A3B8';
const PURPLE  = '#7C3AED';
const PURPLED = 'rgba(124,58,237,0.10)';
const PURPLEL = 'rgba(124,58,237,0.22)';
const GREEN   = '#059669';
const GREEND  = 'rgba(5,150,105,0.10)';
const RED     = '#DC2626';
const REDD    = 'rgba(220,38,38,0.10)';
const AMBER   = '#D97706';
const AMBERD  = 'rgba(217,119,6,0.10)';

// ─── Add/Edit Printer Modal ──────────────────────────────────────────────────
function PrinterFormModal({
  visible,
  editPrinter,
  onClose,
  onSave,
}: {
  visible: boolean;
  editPrinter: PrinterConfig | null;
  onClose: () => void;
  onSave: (name: string, ip: string, port: string, location: string) => void;
}) {
  const [name, setName] = useState('');
  const [ip, setIp] = useState('');
  const [port, setPort] = useState('9100');
  const [location, setLocation] = useState('');

  useEffect(() => {
    if (editPrinter) {
      setName(editPrinter.name);
      setIp(editPrinter.ipAddress);
      setPort(editPrinter.port);
      setLocation(editPrinter.location);
    } else {
      setName('');
      setIp('');
      setPort('9100');
      setLocation('');
    }
  }, [editPrinter, visible]);

  const isValid = name.trim().length > 0 && ip.trim().length > 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={fm.overlay} onPress={onClose}>
        <Pressable style={fm.sheet} onPress={e => e.stopPropagation()}>
          <View style={fm.handle} />
          <AppText style={fm.title}>
            {editPrinter ? '✏️  Edit Printer' : '➕  Add Printer'}
          </AppText>

          <View style={fm.field}>
            <AppText style={fm.label}>Printer Name *</AppText>
            <TextInput
              style={fm.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Printer A — Main Shop"
              placeholderTextColor={DIM}
            />
          </View>

          <View style={fm.field}>
            <AppText style={fm.label}>IP Address *</AppText>
            <TextInput
              style={fm.input}
              value={ip}
              onChangeText={setIp}
              placeholder="e.g. 192.168.1.100"
              placeholderTextColor={DIM}
              keyboardType="decimal-pad"
              autoCapitalize="none"
            />
          </View>

          <View style={fm.row}>
            <View style={[fm.field, { flex: 1 }]}>
              <AppText style={fm.label}>Port</AppText>
              <TextInput
                style={fm.input}
                value={port}
                onChangeText={setPort}
                placeholder="9100"
                placeholderTextColor={DIM}
                keyboardType="number-pad"
              />
            </View>
            <View style={[fm.field, { flex: 2 }]}>
              <AppText style={fm.label}>Location</AppText>
              <TextInput
                style={fm.input}
                value={location}
                onChangeText={setLocation}
                placeholder="e.g. Phnom Penh Branch"
                placeholderTextColor={DIM}
              />
            </View>
          </View>

          <View style={fm.btnRow}>
            <Pressable style={fm.cancelBtn} onPress={onClose}>
              <AppText style={fm.cancelTxt}>Cancel</AppText>
            </Pressable>
            <Pressable
              style={[fm.saveBtn, !isValid && { opacity: 0.45 }]}
              onPress={() => { if (isValid) onSave(name, ip, port, location); }}
              disabled={!isValid}
            >
              <AppText style={fm.saveTxt}>
                {editPrinter ? 'Save Changes' : 'Add Printer'}
              </AppText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const fm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: SURFACE, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: BORDER, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '900', color: INK, marginBottom: 20 },
  field: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '800', color: MUTED, marginBottom: 6, letterSpacing: 0.3 },
  input: {
    backgroundColor: SURF2, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, fontWeight: '700', color: INK, borderWidth: 1, borderColor: BORDER,
  },
  row: { flexDirection: 'row', gap: 12 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: {
    flex: 1, borderRadius: 16, paddingVertical: 16, alignItems: 'center',
    backgroundColor: SURF2, borderWidth: 1, borderColor: BORDER,
  },
  cancelTxt: { fontSize: 15, fontWeight: '800', color: MUTED },
  saveBtn: {
    flex: 2, borderRadius: 16, paddingVertical: 16, alignItems: 'center',
    backgroundColor: PURPLE,
  },
  saveTxt: { fontSize: 15, fontWeight: '900', color: '#FFF' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PrinterSettingsScreen() {
  const [printers, setPrinters] = useState<PrinterConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editPrinter, setEditPrinter] = useState<PrinterConfig | null>(null);

  const loadPrinters = useCallback(async () => {
    setLoading(true);
    const all = await getAllPrinters();
    setPrinters(all);
    setLoading(false);
  }, []);

  useEffect(() => { void loadPrinters(); }, [loadPrinters]);

  async function handleAdd(name: string, ip: string, port: string, location: string) {
    await addPrinter(name, ip, port, location);
    setFormOpen(false);
    await loadPrinters();
  }

  async function handleEdit(name: string, ip: string, port: string, location: string) {
    if (!editPrinter) return;
    await updatePrinter(editPrinter.id, { name, ipAddress: ip, port, location });
    setEditPrinter(null);
    setFormOpen(false);
    await loadPrinters();
  }

  async function handleDelete(printer: PrinterConfig) {
    Alert.alert(
      'Delete Printer?',
      `Remove "${printer.name}" from your printer list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deletePrinter(printer.id);
            await loadPrinters();
          },
        },
      ],
    );
  }

  async function handleSetDefault(id: string) {
    await setDefaultPrinter(id);
    await loadPrinters();
  }

  async function handleTest(id: string) {
    setTestingId(id);
    const result = await testPrinterConnection(id);
    setTestingId(null);
    await loadPrinters();
    if (result === 'ok') {
      Alert.alert('✅ Connection OK', 'Printer responded successfully.');
    } else {
      Alert.alert('❌ Connection Failed', 'Check the IP address and make sure the printer is on the same network.');
    }
  }

  function statusColor(result: string) {
    if (result === 'ok') return GREEN;
    if (result === 'fail') return RED;
    return DIM;
  }

  function statusBg(result: string) {
    if (result === 'ok') return GREEND;
    if (result === 'fail') return REDD;
    return SURF2;
  }

  function statusLabel(result: string) {
    if (result === 'ok') return 'Online';
    if (result === 'fail') return 'Offline';
    return 'Not Tested';
  }

  return (
    <View style={s.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
            <AltArrowLeftBoldDuotone size={20} color={INK} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <AppText style={s.headerEye}>SETTINGS</AppText>
            <AppText style={s.headerTitle}>🖨️  My Printers</AppText>
          </View>
          <Pressable
            style={s.addBtn}
            onPress={() => { setEditPrinter(null); setFormOpen(true); }}
          >
            <AddCircleBoldDuotone size={22} color={PURPLE} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Info card */}
          <View style={s.infoCard}>
            <Settings2BoldDuotone size={20} color={PURPLE} />
            <View style={{ flex: 1 }}>
              <AppText style={s.infoTitle}>Configure your printers</AppText>
              <AppText style={s.infoSub}>
                Add your printers here with their IP address. When you process an order, you'll be able to select which printer to use.
              </AppText>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator color={PURPLE} style={{ marginVertical: 40 }} />
          ) : printers.length === 0 ? (
            <View style={s.emptyCard}>
              <PrinterBoldDuotone size={40} color={DIM} />
              <AppText style={s.emptyTitle}>No printers added</AppText>
              <AppText style={s.emptySub}>
                Tap the + button to add your first printer.
              </AppText>
              <Pressable
                style={s.emptyBtn}
                onPress={() => { setEditPrinter(null); setFormOpen(true); }}
              >
                <AddCircleBoldDuotone size={18} color="#FFF" />
                <AppText style={s.emptyBtnTxt}>Add Printer</AppText>
              </Pressable>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {printers.map((printer, idx) => {
                const defaultPrinter = printers.find(p => p.isDefault);
                const isDefault = defaultPrinter?.id === printer.id;
                const isTesting = testingId === printer.id;

                return (
                  <View key={printer.id} style={[s.printerCard, isDefault && s.printerCardDefault]}>
                    {/* Top row */}
                    <View style={s.printerTop}>
                      <View style={[s.printerIcon, { backgroundColor: isDefault ? PURPLED : SURF2 }]}>
                        <PrinterBoldDuotone size={22} color={isDefault ? PURPLE : MUTED} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <AppText style={s.printerName}>{printer.name}</AppText>
                          {isDefault && (
                            <View style={s.defaultBadge}>
                              <AppText style={s.defaultBadgeTxt}>DEFAULT</AppText>
                            </View>
                          )}
                        </View>
                        <AppText style={s.printerLoc}>
                          {printer.location || 'No location set'}
                        </AppText>
                      </View>
                      {/* Status dot */}
                      <View style={[s.statusBadge, { backgroundColor: statusBg(printer.lastTestResult) }]}>
                        <View style={[s.statusDot, { backgroundColor: statusColor(printer.lastTestResult) }]} />
                        <AppText style={[s.statusTxt, { color: statusColor(printer.lastTestResult) }]}>
                          {statusLabel(printer.lastTestResult)}
                        </AppText>
                      </View>
                    </View>

                    {/* IP info */}
                    <View style={s.ipRow}>
                      <AppText style={s.ipLabel}>IP</AppText>
                      <AppText style={s.ipVal}>{printer.ipAddress}:{printer.port}</AppText>
                    </View>

                    {/* Action buttons */}
                    <View style={s.actionRow}>
                      <Pressable
                        style={[s.actionBtn, s.testBtn, isTesting && { opacity: 0.5 }]}
                        onPress={() => handleTest(printer.id)}
                        disabled={isTesting}
                      >
                        {isTesting ? (
                          <ActivityIndicator color={PURPLE} size="small" />
                        ) : (
                          <CheckCircleBoldDuotone size={14} color={PURPLE} />
                        )}
                        <AppText style={s.testTxt}>
                          {isTesting ? 'Testing...' : 'Test'}
                        </AppText>
                      </Pressable>

                      {!isDefault && (
                        <Pressable
                          style={[s.actionBtn, s.defaultBtn]}
                          onPress={() => handleSetDefault(printer.id)}
                        >
                          <AppText style={s.defaultTxt}>Set Default</AppText>
                        </Pressable>
                      )}

                      <Pressable
                        style={[s.actionBtn, s.editBtn]}
                        onPress={() => { setEditPrinter(printer); setFormOpen(true); }}
                      >
                        <AppText style={s.editTxt}>Edit</AppText>
                      </Pressable>

                      <Pressable
                        style={[s.actionBtn, s.deleteBtn]}
                        onPress={() => handleDelete(printer)}
                      >
                        <TrashBinTrashBoldDuotone size={14} color={RED} />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      <PrinterFormModal
        visible={formOpen}
        editPrinter={editPrinter}
        onClose={() => { setFormOpen(false); setEditPrinter(null); }}
        onSave={editPrinter ? handleEdit : handleAdd}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8, gap: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: BORDER,
  },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: PURPLED, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: PURPLEL,
  },
  headerEye: { fontSize: 9, fontWeight: '800', color: DIM, letterSpacing: 2 },
  headerTitle: { fontSize: 15, fontWeight: '900', color: INK, marginTop: 2 },

  scroll: { paddingHorizontal: 20, paddingBottom: 120 },

  infoCard: {
    flexDirection: 'row', gap: 14, backgroundColor: PURPLED,
    borderRadius: 18, padding: 16, marginTop: 12, marginBottom: 16,
    borderWidth: 1, borderColor: PURPLEL, alignItems: 'flex-start',
  },
  infoTitle: { fontSize: 14, fontWeight: '800', color: PURPLE },
  infoSub: { fontSize: 12, fontWeight: '600', color: MUTED, marginTop: 4, lineHeight: 18 },

  emptyCard: {
    backgroundColor: SURFACE, borderRadius: 24, padding: 32, marginTop: 20,
    alignItems: 'center', gap: 10, borderWidth: 1, borderColor: BORDER,
  },
  emptyTitle: { fontSize: 17, fontWeight: '900', color: INK, marginTop: 8 },
  emptySub: { fontSize: 13, fontWeight: '600', color: MUTED, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: PURPLE,
    borderRadius: 14, paddingHorizontal: 20, paddingVertical: 14, marginTop: 8,
  },
  emptyBtnTxt: { fontSize: 15, fontWeight: '900', color: '#FFF' },

  printerCard: {
    backgroundColor: SURFACE, borderRadius: 20, padding: 18,
    borderWidth: 1.5, borderColor: BORDER, gap: 14,
    shadowColor: INK, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  printerCardDefault: { borderColor: PURPLEL },

  printerTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  printerIcon: {
    width: 48, height: 48, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  printerName: { fontSize: 16, fontWeight: '900', color: INK },
  printerLoc: { fontSize: 12, fontWeight: '600', color: MUTED, marginTop: 2 },
  defaultBadge: {
    backgroundColor: PURPLED, borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  defaultBadgeTxt: { fontSize: 8, fontWeight: '900', color: PURPLE, letterSpacing: 0.5 },

  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusTxt: { fontSize: 10, fontWeight: '800' },

  ipRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: SURF2, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
  },
  ipLabel: { fontSize: 11, fontWeight: '800', color: MUTED },
  ipVal: { fontSize: 14, fontWeight: '900', color: INK, fontFamily: 'monospace' },

  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  testBtn: { backgroundColor: PURPLED, borderWidth: 1, borderColor: PURPLEL },
  testTxt: { fontSize: 12, fontWeight: '800', color: PURPLE },
  defaultBtn: { backgroundColor: SURF2, borderWidth: 1, borderColor: BORDER },
  defaultTxt: { fontSize: 12, fontWeight: '800', color: MUTED },
  editBtn: { backgroundColor: AMBERD, borderWidth: 1, borderColor: 'rgba(217,119,6,0.2)' },
  editTxt: { fontSize: 12, fontWeight: '800', color: AMBER },
  deleteBtn: { backgroundColor: REDD, borderWidth: 1, borderColor: 'rgba(220,38,38,0.2)', paddingHorizontal: 10 },
});
