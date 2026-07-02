/**
 * useConnectionIntelligence — Phase 2 hook
 *
 * Provides:
 *  - nudges: list of overdue follow-up moments
 *  - tagsMap: momentId → ConnectionTagId[]
 *  - toggleTag / setTags helpers (optimistic updates)
 *  - dismissNudge
 *  - exportContact / openWhatsApp
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { TapMoment } from '@/src/components/TapMomentCard';
import {
  type ConnectionTagId,
  type FollowUpNudge,
  getAllTags,
  computeFollowUpNudges,
  toggleTag as svcToggleTag,
  setTags as svcSetTags,
  dismissNudge as svcDismissNudge,
  exportToContacts,
  openWhatsApp as svcOpenWhatsApp,
  shareContactText,
  momentToContact,
} from '@/src/services/connectionsIntelligenceService';

export type TagsMap = Record<string, ConnectionTagId[]>;

export function useConnectionIntelligence(moments: TapMoment[]) {
  const [nudges, setNudges] = useState<FollowUpNudge[]>([]);
  const [tagsMap, setTagsMap] = useState<TagsMap>({});
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── Load nudges + tags on mount / whenever moments list changes ────────────
  const refresh = useCallback(async () => {
    if (!moments.length) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [freshNudges, freshTags] = await Promise.all([
        computeFollowUpNudges(moments),
        getAllTags(),
      ]);
      if (mountedRef.current) {
        setNudges(freshNudges);
        setTagsMap(freshTags);
      }
    } catch {
      // non-critical — leave existing state intact
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [moments]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // ── Tag toggle (optimistic) ───────────────────────────────────────────────
  const toggleTagForMoment = useCallback(async (momentId: string, tagId: ConnectionTagId) => {
    // Optimistic update
    setTagsMap((prev) => {
      const current = new Set(prev[momentId] ?? []);
      if (current.has(tagId)) current.delete(tagId); else current.add(tagId);
      return { ...prev, [momentId]: [...current] as ConnectionTagId[] };
    });
    try {
      const next = await svcToggleTag(momentId, tagId);
      if (mountedRef.current) {
        setTagsMap((prev) => ({ ...prev, [momentId]: next }));
      }
    } catch {
      // revert on error
      void refresh();
    }
  }, [refresh]);

  const setTagsForMoment = useCallback(async (momentId: string, tagIds: ConnectionTagId[]) => {
    setTagsMap((prev) => ({ ...prev, [momentId]: tagIds }));
    try {
      await svcSetTags(momentId, tagIds);
    } catch {
      void refresh();
    }
  }, [refresh]);

  // ── Dismiss a follow-up nudge ─────────────────────────────────────────────
  const dismissNudge = useCallback(async (momentId: string) => {
    setNudges((prev) => prev.filter((n) => n.momentId !== momentId));
    await svcDismissNudge(momentId);
  }, []);

  // ── Contact export helpers ────────────────────────────────────────────────
  const exportMomentContact = useCallback(async (moment: TapMoment, profileUrl?: string) => {
    const contact = momentToContact(moment);
    return exportToContacts(contact);
  }, []);

  const whatsAppMoment = useCallback(async (moment: TapMoment, phone?: string) => {
    const contact = momentToContact(moment);
    if (phone) {
      return svcOpenWhatsApp(phone, `Hi ${contact.name}! Great connecting with you. I'd love to stay in touch.`);
    }
    // No phone — fall back to share text
    const slugUrl = undefined; // caller can pass this via profileUrl
    await shareContactText(contact, slugUrl);
    return 'opened' as const;
  }, []);

  const shareContact = useCallback(async (moment: TapMoment, profileUrl?: string) => {
    const contact = momentToContact(moment);
    await shareContactText(contact, profileUrl);
  }, []);

  return {
    nudges,
    tagsMap,
    loading,
    refresh,
    toggleTagForMoment,
    setTagsForMoment,
    dismissNudge,
    exportMomentContact,
    whatsAppMoment,
    shareContact,
  };
}
