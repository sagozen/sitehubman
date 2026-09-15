import { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, Pressable, Share, StyleSheet, TextInput, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { IosScrollView } from '@/src/components/IosScrollView';
import { AuthGate } from '@/src/components/AuthGate';
import { useAuth } from '@/src/hooks/useAuth';
import { launchPlanStatusLabel, propertyAccessLaunchPlan } from '@/src/constants/propertyAccessLaunchPlan';
import { createInvestorDemoSetup, createResident, createVisitorPass, issueNfcCredential, listAccessCredentials, listAccessLogs, listPropertyResidents, listVisitorPasses, setCredentialStatus, setVisitorPassStatus, validatePropertyAccess } from '@/src/services/propertyAccessService';
import type { AccessCredential, AccessLog, PropertyResident, VisitorPass } from '@/src/types/propertyAccess';

function PropertyContent() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{ propertyId?: string }>();
  const propertyId = params.propertyId || user?.companyId || 'demo-property';
  const [residents, setResidents] = useState<PropertyResident[]>([]);
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [credentials, setCredentials] = useState<AccessCredential[]>([]);
  const [visitorPasses, setVisitorPasses] = useState<VisitorPass[]>([]);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [busy, setBusy] = useState(false);
  const [demoRun, setDemoRun] = useState<{ credentialId: string; visitorPassId: string; step: number } | null>(null);
  const [shownPass, setShownPass] = useState<VisitorPass | null>(null);
  const activeCredentials = credentials.filter((credential) => credential.status === 'active').length;
  const grantedCount = logs.filter((log) => log.decision === 'granted').length;
  const accessSuccessRate = logs.length ? Math.round((grantedCount / logs.length) * 100) : 0;

  const load = useCallback(async () => {
    try {
      const [nextResidents, nextLogs, nextCredentials, nextVisitorPasses] = await Promise.all([listPropertyResidents(propertyId), listAccessLogs(propertyId), listAccessCredentials(propertyId), listVisitorPasses(propertyId)]);
      setResidents(nextResidents);
      setLogs(nextLogs);
      setCredentials(nextCredentials);
      setVisitorPasses(nextVisitorPasses);
    } catch (error) {
      Alert.alert('Unable to load property access', error instanceof Error ? error.message : 'Check your Firebase permissions and indexes.');
    }
  }, [propertyId]);

  useEffect(() => { void load(); }, [load]);

  const addResident = async () => {
    if (!name.trim() || !unit.trim()) return Alert.alert('Resident details needed', 'Enter the resident name and unit.');
    setBusy(true);
    try { await createResident(propertyId, { fullName: name.trim(), unit: unit.trim() }); setName(''); setUnit(''); await load(); }
    catch (error) { Alert.alert('Could not add resident', error instanceof Error ? error.message : 'Try again.'); }
    finally { setBusy(false); }
  };

  const loadInvestorDemo = async () => {
    setBusy(true);
    try {
      const setup = await createInvestorDemoSetup(propertyId);
      await load();
      setDemoRun({ credentialId: setup.credential.id, visitorPassId: setup.visitorPass.id, step: 1 });
      Alert.alert(
        'Investor demo ready',
        `1. Tap Test entry on ${setup.credential.label} to show GRANTED.\n2. Tap Revoke on ${setup.visitorPass.visitorName}.\n3. Tap Test entry on that pass to show DENIED.`,
      );
    } catch (error) { Alert.alert('Could not prepare demo', error instanceof Error ? error.message : 'Check your property permissions and try again.'); }
    finally { setBusy(false); }
  };

  const issueNfc = async (resident: PropertyResident) => {
    setBusy(true);
    try { await issueNfcCredential(propertyId, resident.id, `${resident.fullName} · ${resident.unit}`, `AVIO-${Date.now().toString(36)}`); await load(); Alert.alert('NFC credential record created', 'This record can be tested only after a compatible controller is connected and deployed.'); }
    catch (error) { Alert.alert('Could not activate card', error instanceof Error ? error.message : 'Try again.'); }
    finally { setBusy(false); }
  };

  const showWalletPilotStatus = () => Alert.alert('Wallet issuance is not enabled', 'Apple Wallet and Google Wallet access passes require signed issuer credentials and a tested reader integration before they can be issued.');

  const block = async (credential: AccessCredential) => {
    setBusy(true);
    try { await setCredentialStatus(credential.id, 'blocked'); await load(); Alert.alert('Credential blocked', 'A deployed, connected controller will deny this credential on its next validation request.'); }
    catch (error) { Alert.alert('Could not block credential', error instanceof Error ? error.message : 'Try again.'); }
    finally { setBusy(false); }
  };

  const testCredential = async (credential: AccessCredential) => {
    if (!credential.nfcUid) return Alert.alert('No NFC UID', 'Wallet passes need a signed wallet issuer before they can be tested at a reader.');
    setBusy(true);
    try {
      const result = await validatePropertyAccess(propertyId, { nfcUid: credential.nfcUid });
      await load();
      if (demoRun?.credentialId === credential.id && result.decision === 'granted') setDemoRun({ ...demoRun, step: 2 });
      Alert.alert(result.decision === 'granted' ? 'Entry granted' : 'Entry denied', `${result.subjectName} · ${result.door}`);
    } catch (error) { Alert.alert('Test entry unavailable', error instanceof Error ? error.message : 'Deploy the controller function and try again.'); }
    finally { setBusy(false); }
  };

  const testVisitorPass = async (pass: VisitorPass) => {
    setBusy(true);
    try {
      const result = await validatePropertyAccess(propertyId, { visitorToken: pass.token });
      await load();
      if (demoRun?.visitorPassId === pass.id && result.decision === 'denied') setDemoRun({ ...demoRun, step: 4 });
      Alert.alert(result.decision === 'granted' ? 'Visitor entry granted' : 'Visitor entry denied', `${result.subjectName} · ${result.door}`);
    } catch (error) { Alert.alert('Test entry unavailable', error instanceof Error ? error.message : 'Deploy the controller function and try again.'); }
    finally { setBusy(false); }
  };

  const revokeVisitorPass = async (pass: VisitorPass) => {
    setBusy(true);
    try { await setVisitorPassStatus(pass.id, 'revoked'); await load(); if (demoRun?.visitorPassId === pass.id) setDemoRun({ ...demoRun, step: 3 }); Alert.alert('Visitor pass revoked', 'Future scans will be denied immediately.'); }
    catch (error) { Alert.alert('Could not revoke visitor pass', error instanceof Error ? error.message : 'Try again.'); }
    finally { setBusy(false); }
  };

  const createQr = async (resident: PropertyResident) => {
    setBusy(true);
    try {
      const pass = await createVisitorPass(propertyId, resident.id, `Guest of ${resident.fullName}`, new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());
      setShownPass(pass);
      await load();
    } catch (error) { Alert.alert('Could not create visitor pass', error instanceof Error ? error.message : 'Try again.'); }
    finally { setBusy(false); }
  };

  return <SafeAreaView style={styles.safe}><IosScrollView contentContainerStyle={styles.content}>
    <AppText style={styles.eyebrow} weight="bold">PROPERTY ACCESS</AppText>
    <View style={styles.titleRow}><AppText style={styles.title} weight="extrabold">{propertyId}</AppText><Pressable accessibilityLabel="Refresh access dashboard" disabled={busy} onPress={() => void load()} style={styles.refresh}><AppText style={styles.refreshText} weight="bold">Refresh</AppText></Pressable></View>
    <AppText style={styles.subtitle}>Manage residents, pilot NFC records, visitor QR passes, and access history from one workspace.</AppText>
    <View style={styles.demoPanel}><View style={styles.demoCopy}><AppText style={styles.demoTitle} weight="bold">PILOT DEMO WORKFLOW</AppText><AppText style={styles.demoText}>Create a grant → revoke → deny scenario for a connected-controller test.</AppText></View><Pressable disabled={busy} onPress={() => void loadInvestorDemo()} style={[styles.demoButton, busy && styles.disabled]}><AppText style={styles.demoButtonText} weight="bold">{busy ? 'Preparing…' : 'Load demo'}</AppText></Pressable></View>
    {demoRun && <View style={styles.storyPanel}><AppText style={styles.storyTitle} weight="bold">DEMO RUN</AppText><DemoStep number="1" label="Demo resident and visitor pass created" active={demoRun.step >= 1} /><DemoStep number="2" label="Credential validated by connected controller" active={demoRun.step >= 2} /><DemoStep number="3" label="Visitor pass revoked" active={demoRun.step >= 3} /><DemoStep number="4" label="Revoked visitor denied by connected controller" active={demoRun.step >= 4} /></View>}
    <View style={styles.summary}><Metric label="Residents" value={String(residents.length)} /><Metric label="Active passes" value={String(activeCredentials + visitorPasses.filter((pass) => pass.status === 'active').length)} /><Metric label="Entry success" value={logs.length ? `${accessSuccessRate}%` : '—'} /></View>
    <AppText style={styles.section} weight="bold">NEXT BUILD PLAN</AppText>
    <View style={styles.planPanel}>
      <AppText style={styles.planIntro}>Focus on property access. Complete each gate in order before expanding features or fundraising.</AppText>
      {propertyAccessLaunchPlan.map((step, index) => <View key={step.id} style={styles.planRow}>
        <View style={styles.planNumber}><AppText style={styles.planNumberText} weight="bold">{index + 1}</AppText></View>
        <View style={styles.planText}><AppText style={styles.planStatus} weight="bold">{launchPlanStatusLabel[step.status]}</AppText><AppText style={styles.name} weight="bold">{step.title}</AppText><AppText style={styles.muted}>{step.outcome}</AppText></View>
      </View>)}
    </View>
    <View style={styles.panel}><AppText style={styles.section} weight="bold">ADD RESIDENT</AppText><TextInput value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor="#777" style={styles.input}/><TextInput value={unit} onChangeText={setUnit} placeholder="Unit / apartment" placeholderTextColor="#777" style={styles.input}/><Action label={busy ? 'Working…' : 'Add resident'} onPress={() => void addResident()} /></View>
    <AppText style={styles.section} weight="bold">RESIDENTS & CREDENTIALS</AppText>
    {residents.map((resident) => <View style={styles.row} key={resident.id}><View style={styles.rowText}><AppText style={styles.name} weight="bold">{resident.fullName}</AppText><AppText style={styles.muted}>Unit {resident.unit} · {resident.status}</AppText></View><View style={styles.actions}><Small label="Create NFC record" onPress={() => void issueNfc(resident)} /><Small label="Visitor QR" onPress={() => void createQr(resident)} /><Small label="Wallet pilot" onPress={showWalletPilotStatus} /></View></View>)}
    {!residents.length && <AppText style={styles.muted}>No residents yet.</AppText>}
    <AppText style={styles.section} weight="bold">ACTIVE CREDENTIALS</AppText>
    {credentials.map((credential) => <View style={styles.row} key={credential.id}><View style={styles.rowText}><AppText style={styles.name} weight="bold">{credential.label}</AppText><AppText style={styles.muted}>{credential.kind.toUpperCase()} · {credential.status}</AppText></View><View style={styles.actions}>{credential.nfcUid && <Small label="Test entry" onPress={() => void testCredential(credential)} />}{credential.status === 'active' && <Small label="Block lost card" onPress={() => void block(credential)} />}</View></View>)}
    <AppText style={[styles.section, styles.logTitle]} weight="bold">VISITOR PASSES</AppText>
    {visitorPasses.map((pass) => { const expired = Date.parse(pass.validUntil) <= Date.now(); const canEnter = pass.status === 'active' && !expired; return <View style={styles.row} key={pass.id}><View style={styles.rowText}><AppText style={styles.name} weight="bold">{pass.visitorName}</AppText><AppText style={styles.muted}>Valid until {new Date(pass.validUntil).toLocaleString()} · {expired ? 'expired' : pass.status}</AppText></View><View style={styles.actions}><Small label="Test entry" onPress={() => void testVisitorPass(pass)} />{canEnter && <Small label="Revoke" onPress={() => void revokeVisitorPass(pass)} />}</View></View>; })}
    {!visitorPasses.length && <AppText style={styles.muted}>Create a visitor QR from a resident to begin the demo flow.</AppText>}
    <AppText style={[styles.section, styles.logTitle]} weight="bold">RECENT ACCESS LOGS</AppText>
    {logs.map((log) => <View style={styles.log} key={log.id}><View style={styles.logCopy}><AppText style={styles.name} weight="bold">{log.subjectName}</AppText><AppText style={styles.muted}>{log.door} · {log.method.toUpperCase()} · {new Date(log.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</AppText></View><AppText style={log.decision === 'granted' ? styles.granted : styles.denied} weight="bold">{log.decision.toUpperCase()}</AppText></View>)}
    {!logs.length && <AppText style={styles.muted}>Access decisions from connected readers will appear here.</AppText>}
    <AppText style={styles.note}>Wallet issuance is unavailable until Apple and Google issuer credentials, plus one tested controller integration, are live. QR and NFC records are pilot tools and require a connected controller to grant entry.</AppText>
    <VisitorPassModal pass={shownPass} onClose={() => setShownPass(null)} />
  </IosScrollView></SafeAreaView>;
}

const Metric = ({ label, value }: { label: string; value: string }) => <View><AppText style={styles.metric} weight="extrabold">{value}</AppText><AppText style={styles.muted}>{label}</AppText></View>;
const Action = ({ label, onPress }: { label: string; onPress: () => void }) => <Pressable onPress={onPress} style={styles.primary}><AppText style={styles.primaryText} weight="bold">{label}</AppText></Pressable>;
const Small = ({ label, onPress }: { label: string; onPress: () => void }) => <Pressable onPress={onPress} style={styles.small}><AppText style={styles.smallText} weight="bold">{label}</AppText></Pressable>;
const DemoStep = ({ number, label, active }: { number: string; label: string; active: boolean }) => <View style={styles.storyStep}><View style={[styles.storyNumber, active && styles.storyNumberActive]}><AppText style={[styles.storyNumberText, active && styles.storyNumberTextActive]} weight="bold">{active ? '✓' : number}</AppText></View><AppText style={[styles.storyLabel, active && styles.storyLabelActive]}>{label}</AppText></View>;
const VisitorPassModal = ({ pass, onClose }: { pass: VisitorPass | null; onClose: () => void }) => <Modal visible={Boolean(pass)} transparent animationType="fade" onRequestClose={onClose}><View style={styles.modalBackdrop}><View style={styles.passModal}><AppText style={styles.passEyebrow} weight="bold">AVIO VISITOR PASS</AppText><AppText style={styles.passName} weight="extrabold">{pass?.visitorName}</AppText><AppText style={styles.passExpiry}>Valid until {pass ? new Date(pass.validUntil).toLocaleString() : ''}</AppText><View style={styles.qrWrap}>{pass && <QRCode value={`AVIO|VISITOR|${pass.token}`} size={190} color="#111827" backgroundColor="#FFFFFF" />}</View><AppText style={styles.passHint}>Present this QR code at the lobby reader.</AppText><View style={styles.passActions}><Pressable onPress={() => pass && void Share.share({ title: 'Visitor access pass', message: `Visitor pass: https://pass.sitehub.app/visitor/${pass.token}` })} style={styles.sharePass}><AppText style={styles.sharePassText} weight="bold">Share pass</AppText></Pressable><Pressable onPress={onClose} style={styles.closePass}><AppText style={styles.closePassText} weight="bold">Done</AppText></Pressable></View></View></View></Modal>;
export default function PropertyAccessScreen() { return <AuthGate allowedRoles={['property_manager', 'admin', 'super_admin']}><PropertyContent /></AuthGate>; }

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#09090B' }, content: { padding: 20, gap: 12, paddingBottom: 48 }, eyebrow: { color: '#A3E635', fontSize: 12, letterSpacing: 1.5 }, titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, title: { color: '#FFF', fontSize: 30, flex: 1 }, refresh: { borderColor: '#3F3F46', borderWidth: 1, borderRadius: 9, minHeight: 36, paddingHorizontal: 11, alignItems: 'center', justifyContent: 'center' }, refreshText: { color: '#D4D4D8', fontSize: 12 }, subtitle: { color: '#A1A1AA', lineHeight: 20 }, demoPanel: { backgroundColor: '#25330C', borderColor: '#A3E635', borderWidth: 1, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }, demoCopy: { flex: 1, gap: 3 }, demoTitle: { color: '#D9F99D', fontSize: 12, letterSpacing: 1 }, demoText: { color: '#E4E4E7', fontSize: 12, lineHeight: 17 }, demoButton: { backgroundColor: '#A3E635', borderRadius: 9, minHeight: 40, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' }, demoButtonText: { color: '#182000', fontSize: 12 }, disabled: { opacity: .55 }, storyPanel: { backgroundColor: '#18181B', borderRadius: 16, padding: 14, gap: 10 }, storyTitle: { color: '#D4D4D8', fontSize: 11, letterSpacing: 1 }, storyStep: { flexDirection: 'row', alignItems: 'center', gap: 9 }, storyNumber: { width: 21, height: 21, borderRadius: 11, backgroundColor: '#3F3F46', alignItems: 'center', justifyContent: 'center' }, storyNumberActive: { backgroundColor: '#A3E635' }, storyNumberText: { color: '#D4D4D8', fontSize: 11 }, storyNumberTextActive: { color: '#182000' }, storyLabel: { color: '#71717A', fontSize: 13 }, storyLabelActive: { color: '#F4F4F5' }, summary: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#18181B', borderRadius: 16, padding: 18, marginVertical: 8 }, metric: { color: '#FFF', fontSize: 21 }, muted: { color: '#A1A1AA', fontSize: 12 }, panel: { backgroundColor: '#18181B', padding: 16, borderRadius: 16, gap: 10 }, section: { color: '#FFF', fontSize: 14, letterSpacing: .5, marginTop: 12 }, planPanel: { backgroundColor: '#18181B', borderRadius: 16, padding: 14, gap: 14 }, planIntro: { color: '#D4D4D8', fontSize: 13, lineHeight: 19 }, planRow: { flexDirection: 'row', gap: 10 }, planNumber: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#A3E635' }, planNumberText: { color: '#182000', fontSize: 12 }, planText: { flex: 1, gap: 2 }, planStatus: { color: '#A3E635', fontSize: 10, letterSpacing: 1 }, input: { color: '#FFF', backgroundColor: '#27272A', borderRadius: 10, paddingHorizontal: 12, height: 48 }, primary: { backgroundColor: '#A3E635', borderRadius: 10, minHeight: 48, alignItems: 'center', justifyContent: 'center' }, primaryText: { color: '#182000' }, row: { backgroundColor: '#18181B', padding: 14, borderRadius: 14, gap: 12 }, rowText: { gap: 3 }, name: { color: '#FFF', fontSize: 15 }, actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' }, small: { backgroundColor: '#27272A', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8 }, smallText: { color: '#FFF', fontSize: 12 }, logTitle: { marginTop: 16 }, log: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 12, borderBottomColor: '#27272A', borderBottomWidth: StyleSheet.hairlineWidth }, logCopy: { flex: 1 }, granted: { color: '#A3E635', fontSize: 11 }, denied: { color: '#FB7185', fontSize: 11 }, modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,.7)', alignItems: 'center', justifyContent: 'center', padding: 24 }, passModal: { width: '100%', maxWidth: 360, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, alignItems: 'center', gap: 10 }, passEyebrow: { color: '#65A30D', fontSize: 11, letterSpacing: 1.4 }, passName: { color: '#111827', fontSize: 22, textAlign: 'center' }, passExpiry: { color: '#6B7280', fontSize: 12, textAlign: 'center' }, qrWrap: { backgroundColor: '#FFFFFF', padding: 12, marginVertical: 4 }, passHint: { color: '#4B5563', fontSize: 13, textAlign: 'center' }, passActions: { flexDirection: 'row', gap: 10, marginTop: 8 }, sharePass: { backgroundColor: '#111827', borderRadius: 10, minHeight: 44, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' }, sharePassText: { color: '#FFFFFF', fontSize: 13 }, closePass: { borderColor: '#D1D5DB', borderWidth: 1, borderRadius: 10, minHeight: 44, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' }, closePassText: { color: '#111827', fontSize: 13 }, note: { color: '#71717A', fontSize: 12, lineHeight: 17, marginTop: 20 } });
