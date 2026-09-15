import { addDoc, collection, doc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import * as Crypto from 'expo-crypto';
import { firebaseCollections } from '@/src/constants/collections';
import { db, auth } from '@/src/services/firebaseClient';
import type { AccessCredential, AccessLog, AccessValidationResult, CredentialKind, PropertyResident, VisitorPass } from '@/src/types/propertyAccess';

const now = () => new Date().toISOString();
// Visitor URLs are bearer credentials, so their entropy must come from the OS CSPRNG.
const token = () => Crypto.randomUUID().replace(/-/g, '') + Crypto.randomUUID().replace(/-/g, '');

function map<T extends { id: string }>(id: string, value: Record<string, unknown>): T {
  return { id, ...value } as T;
}

export async function listPropertyResidents(propertyId: string): Promise<PropertyResident[]> {
  const snapshot = await getDocs(query(collection(db, firebaseCollections.residents), where('propertyId', '==', propertyId), limit(200)));
  return snapshot.docs.map((entry) => map<PropertyResident>(entry.id, entry.data()));
}

export async function createResident(propertyId: string, input: Pick<PropertyResident, 'fullName' | 'unit' | 'email' | 'phone'>): Promise<string> {
  const reference = await addDoc(collection(db, firebaseCollections.residents), {
    propertyId, ...input, status: 'active', createdAt: now(), updatedAt: serverTimestamp(),
  });
  return reference.id;
}

export async function issueNfcCredential(propertyId: string, residentId: string, label: string, nfcUid: string): Promise<string> {
  const reference = await addDoc(collection(db, firebaseCollections.accessCredentials), {
    propertyId, residentId, label, nfcUid: nfcUid.trim().toUpperCase(), kind: 'nfc', status: 'active', createdAt: now(), updatedAt: serverTimestamp(),
  });
  return reference.id;
}

export async function setCredentialStatus(credentialId: string, status: AccessCredential['status']): Promise<void> {
  await updateDoc(doc(db, firebaseCollections.accessCredentials, credentialId), { status, updatedAt: serverTimestamp() });
}

export async function listAccessCredentials(propertyId: string): Promise<AccessCredential[]> {
  const snapshot = await getDocs(query(collection(db, firebaseCollections.accessCredentials), where('propertyId', '==', propertyId), limit(200)));
  return snapshot.docs.map((entry) => map<AccessCredential>(entry.id, entry.data()));
}

export async function createVisitorPass(propertyId: string, hostResidentId: string, visitorName: string, validUntil: string): Promise<VisitorPass> {
  const createdAt = now();
  const value = { propertyId, hostResidentId, visitorName: visitorName.trim(), token: token(), validFrom: createdAt, validUntil, status: 'active' as const, createdAt, updatedAt: serverTimestamp() };
  const reference = await addDoc(collection(db, firebaseCollections.visitorPasses), value);
  return { id: reference.id, ...value };
}

export async function listVisitorPasses(propertyId: string): Promise<VisitorPass[]> {
  const snapshot = await getDocs(query(collection(db, firebaseCollections.visitorPasses), where('propertyId', '==', propertyId), limit(100)));
  return snapshot.docs.map((entry) => map<VisitorPass>(entry.id, entry.data()));
}

export async function setVisitorPassStatus(passId: string, status: VisitorPass['status']): Promise<void> {
  await updateDoc(doc(db, firebaseCollections.visitorPasses, passId), { status, updatedAt: serverTimestamp() });
}

export async function createWalletCredential(propertyId: string, residentId: string, label: string): Promise<AccessCredential> {
  const createdAt = now();
  const value = { propertyId, residentId, label, kind: 'wallet' as const, status: 'active' as const, walletPassUrl: `https://pass.sitehub.app/access/${token()}`, createdAt, updatedAt: serverTimestamp() };
  const reference = await addDoc(collection(db, firebaseCollections.accessCredentials), value);
  return { id: reference.id, ...value };
}

export interface InvestorDemoSetup {
  resident: PropertyResident;
  credential: AccessCredential;
  visitorPass: VisitorPass;
}

/** Creates the minimum data set required for a repeatable grant → revoke → deny demo. */
export async function createInvestorDemoSetup(propertyId: string): Promise<InvestorDemoSetup> {
  const suffix = Date.now().toString(36).toUpperCase();
  const residentName = `Demo Resident ${suffix}`;
  const residentId = await createResident(propertyId, {
    fullName: residentName,
    unit: 'A-1208',
  });
  const credentialId = await issueNfcCredential(
    propertyId,
    residentId,
    `${residentName} · A-1208`,
    `DEMO-${suffix}`,
  );
  const visitorPass = await createVisitorPass(
    propertyId,
    residentId,
    `Investor guest ${suffix}`,
    new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  );

  return {
    resident: { id: residentId, propertyId, fullName: residentName, unit: 'A-1208', status: 'active', createdAt: now() },
    credential: { id: credentialId, propertyId, residentId, label: `${residentName} · A-1208`, nfcUid: `DEMO-${suffix}`, kind: 'nfc', status: 'active', createdAt: now() },
    visitorPass,
  };
}

export async function listAccessLogs(propertyId: string): Promise<AccessLog[]> {
  const snapshot = await getDocs(query(collection(db, firebaseCollections.accessLogs), where('propertyId', '==', propertyId), orderBy('occurredAt', 'desc'), limit(50)));
  return snapshot.docs.map((entry) => map<AccessLog>(entry.id, entry.data()));
}

/** Calls the secured controller endpoint so demo scans create the same audit log as a real door. */
export async function validatePropertyAccess(propertyId: string, input: { nfcUid?: string; visitorToken?: string; door?: string }): Promise<AccessValidationResult> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Sign in as a property manager to test entry.');

  const projectId = String((db.app.options as { projectId?: string }).projectId || '').trim();
  if (!projectId) throw new Error('Firebase project configuration is missing.');
  const idToken = await currentUser.getIdToken();
  const response = await fetch(`https://us-central1-${projectId}.cloudfunctions.net/propertyAccessApi/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ propertyId, door: input.door || 'Demo lobby reader', nfcUid: input.nfcUid, visitorToken: input.visitorToken }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof payload.error === 'string' ? payload.error : 'Door validation failed.');
  return payload as AccessValidationResult;
}
