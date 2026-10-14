/**
 * useAudioPreference.ts
 *
 * Reads and writes the user's "Sound Effects" preference from AsyncStorage.
 * Syncs the runtime AudioFeedback manager on every change.
 *
 * Usage:
 *   const { audioEnabled, toggleAudio } = useAudioPreference();
 */

import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AudioFeedback } from '@/src/utils/audioFeedback';

const STORAGE_KEY = '@sitehub_audio_feedback_enabled';

export function useAudioPreference() {
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);

  // Load persisted preference on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        const enabled = value === null ? true : value === 'true';
        setAudioEnabled(enabled);
        AudioFeedback.setEnabled(enabled);
      })
      .catch(() => {
        // Default to enabled
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleAudio = useCallback(async () => {
    const next = !audioEnabled;
    setAudioEnabled(next);
    AudioFeedback.setEnabled(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // Silently fail — preference is still applied in-memory
    }
  }, [audioEnabled]);

  return { audioEnabled, toggleAudio, loading };
}
