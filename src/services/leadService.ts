import { addDoc, collection, getDocs, orderBy, query, serverTimestamp, where } from 'firebase/firestore';
import { db } from '@/src/services/firebaseClient';
import type { Lead } from '@/src/types/models';

const LEADS_COLLECTION = 'leads';

export async function captureLead(leadData: Omit<Lead, 'id' | 'capturedAt'>): Promise<string> {
  const payload = {
    ...leadData,
    capturedAt: serverTimestamp(),
  };
  
  const docRef = await addDoc(collection(db, LEADS_COLLECTION), payload);
  return docRef.id;
}

export async function getLeadsForUser(userId: string): Promise<Lead[]> {
  try {
    const q = query(
      collection(db, LEADS_COLLECTION),
      where('ownerUserId', '==', userId),
      orderBy('capturedAt', 'desc')
    );
    const snap = await getDocs(q);
    
    return snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        profileId: data.profileId,
        ownerUserId: data.ownerUserId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        note: data.note,
        capturedAt: data.capturedAt?.toDate?.().toISOString() || new Date().toISOString(),
      } as Lead;
    });
  } catch (err) {
    console.error('Failed to fetch leads:', err);
    return [];
  }
}
