/**
 * useLiveTapStream — Phase 1: Real-Time NFC Presence & Live Beaconing
 *
 * Subscribes to `tap_events` Firestore collection filtered by profileId.
 * On each new tap document (after initial mount): fires haptic + toast.
 * Exposes a live tapCount that the home dashboard wires to its stats card.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/src/services/firebaseClient';
import { firebaseCollections } from '@/src/constants/collections';
import { SoundFeedback } from '@/src/utils/sounds';

export interface LiveTapEvent {
  id: string;
  profileId: string;
  cardId?: string;
  source: string;
  device: string;
  country?: string;
  createdAt: string;
}

export interface UseLiveTapStreamResult {
  /** Rolling count of all taps for this profile (live-updated). */
  tapCount: number;
  /** The most-recent tap event (null before first tap). */
  latestTap: LiveTapEvent | null;
  /** Whether the initial snapshot is still loading. */
  isLoading: boolean;
  /** Firestore error string, if any. */
  error: string | null;
}

/**
 * @param profileId  The profile/card owner's ID to watch. Pass `null` to skip.
 * @param onNewTap   Optional callback invoked with each new tap after mount.
 */
export function useLiveTapStream(
  profileId: string | null | undefined,
  onNewTap?: (tap: LiveTapEvent) => void,
): UseLiveTapStreamResult {
  const [tapCount, setTapCount] = useState(0);
  const [latestTap, setLatestTap] = useState<LiveTapEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track whether this is the initial snapshot so we don't false-fire on mount.
  const isFirstSnapshot = useRef(true);
  const onNewTapRef = useRef(onNewTap);
  onNewTapRef.current = onNewTap;

  const mapDoc = useCallback(
    (id: string, data: Record<string, unknown>): LiveTapEvent => ({
      id,
      profileId: String(data.profileId ?? ''),
      cardId: data.cardId ? String(data.cardId) : undefined,
      source: String(data.source ?? 'nfc'),
      device: String(data.device ?? 'unknown'),
      country: data.country ? String(data.country) : undefined,
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : typeof data.createdAt === 'string'
          ? data.createdAt
          : new Date().toISOString(),
    }),
    [],
  );

  useEffect(() => {
    if (!profileId) {
      setIsLoading(false);
      return;
    }

    isFirstSnapshot.current = true;

    const q = query(
      collection(db, firebaseCollections.tapEvents),
      where('profileId', '==', profileId),
      orderBy('createdAt', 'desc'),
      limit(500),
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const total = snapshot.size;
        setTapCount(total);
        setError(null);

        const docs = snapshot.docs;
        const newest = docs[0];
        if (newest) {
          setLatestTap(mapDoc(newest.id, newest.data() as Record<string, unknown>));
        }

        // On subsequent snapshots, fire effects for newly-added documents.
        if (!isFirstSnapshot.current) {
          const newDocs = snapshot.docChanges().filter((c) => c.type === 'added');
          if (newDocs.length > 0) {
            const tap = mapDoc(
              newDocs[0].doc.id,
              newDocs[0].doc.data() as Record<string, unknown>,
            );
            // Fire NFC tap sound + haptic
            SoundFeedback.playNfcTap();
            onNewTapRef.current?.(tap);
          }
        } else {
          isFirstSnapshot.current = false;
        }

        setIsLoading(false);
      },
      (err) => {
        // Gracefully degrade — Firestore permission errors are common for
        // unauthenticated or restricted profiles.
        setError(err.message);
        setIsLoading(false);
      },
    );

    return () => unsub();
  }, [profileId, mapDoc]);

  return { tapCount, latestTap, isLoading, error };
}
