import { db } from '@/src/services/firebaseClient';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

export type LeadIntent = 'services' | 'partnership' | 'hiring' | 'investment' | 'networking';

export interface QualifiedLead {
  id?: string;
  ownerId: string;
  name: string;
  contactInfo: string;
  intent: LeadIntent;
  intentLabel: string;
  note?: string;
  followedUp: boolean;
  createdAt?: any;
}

export const INTENT_OPTIONS: { id: LeadIntent; label: string; icon: string; prompt: string }[] = [
  { id: 'services', label: 'Services', icon: 'Briefcase', prompt: 'Interested in your services or products' },
  { id: 'partnership', label: 'Partnership', icon: 'Handshake', prompt: 'Exploring co-marketing or partnership' },
  { id: 'hiring', label: 'Hiring', icon: 'UserCheck', prompt: 'Interested in working together or hiring' },
  { id: 'investment', label: 'Investment', icon: 'TrendingUp', prompt: 'Discussing funding, equity or investment' },
  { id: 'networking', label: 'Just networking', icon: 'Users', prompt: 'Exchanging contacts and staying connected' },
];

export async function submitQualifiedLead(lead: Omit<QualifiedLead, 'id' | 'followedUp' | 'createdAt'>): Promise<string> {
  try {
    const colRef = collection(db, 'qualified_leads');
    const docRef = await addDoc(colRef, {
      ...lead,
      followedUp: false,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('[leadWorkflowService] submitQualifiedLead error:', error);
    throw error;
  }
}

export async function fetchOwnerLeads(ownerId: string, maxResults = 10): Promise<QualifiedLead[]> {
  try {
    const colRef = collection(db, 'qualified_leads');
    const q = query(
      colRef,
      where('ownerId', '==', ownerId),
      orderBy('createdAt', 'desc'),
      limit(maxResults)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<QualifiedLead, 'id'>),
    }));
  } catch (error) {
    console.error('[leadWorkflowService] fetchOwnerLeads error:', error);
    return [];
  }
}

export async function toggleLeadFollowedUp(leadId: string, currentStatus: boolean): Promise<void> {
  try {
    const docRef = doc(db, 'qualified_leads', leadId);
    await updateDoc(docRef, {
      followedUp: !currentStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('[leadWorkflowService] toggleLeadFollowedUp error:', error);
  }
}
