/**
 * audioFeedback.ts
 *
 * Singleton audio feedback manager for SiteHub NFC interactions.
 * Uses expo-av with lazy loading, caching, and graceful fallback.
 * Respects the user's device silent mode on iOS (playsInSilentModeIOS: false).
 *
 * Usage:
 *   import { AudioFeedback } from '@/src/utils/audioFeedback';
 *   AudioFeedback.nfcScan();
 */

import { AppState, type AppStateStatus } from 'react-native';

type SoundKey = 'nfcScan' | 'success' | 'error' | 'payment';

const SOUND_ASSETS: Record<SoundKey, number> = {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  nfcScan: require('../../assets/sounds/nfc_read.wav'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  success: require('../../assets/sounds/success_pop.wav'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  error: require('../../assets/sounds/nfc_error.wav'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  payment: require('../../assets/sounds/custom_payment_sound.wav'),
};

// Lazy-import expo-av to avoid crashing when not installed
let _Audio: typeof import('expo-av').Audio | null = null;

async function getAudio() {
  if (_Audio) return _Audio;
  try {
    const av = await import('expo-av');
    _Audio = av.Audio;
    return _Audio;
  } catch {
    return null;
  }
}

type SoundObject = import('expo-av').Audio.Sound;
const _cache: Partial<Record<SoundKey, SoundObject>> = {};
let _audioModeSet = false;
let _enabled = true; // Runtime override from useAudioPreference

async function ensureAudioMode() {
  if (_audioModeSet) return;
  try {
    const Audio = await getAudio();
    if (!Audio) return;
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: false,
      shouldDuckAndroid: true,
      staysActiveInBackground: false,
    });
    _audioModeSet = true;
  } catch {
    // Silent fallback — never crash the app
  }
}

async function loadSound(key: SoundKey): Promise<SoundObject | null> {
  if (_cache[key]) return _cache[key]!;
  try {
    const Audio = await getAudio();
    if (!Audio) return null;
    const { sound } = await Audio.Sound.createAsync(SOUND_ASSETS[key], {
      shouldPlay: false,
      volume: 0.7,
    });
    _cache[key] = sound;
    return sound;
  } catch {
    return null;
  }
}

async function play(key: SoundKey) {
  if (!_enabled) return;
  try {
    await ensureAudioMode();
    const sound = await loadSound(key);
    if (!sound) return;
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch {
    // Gracefully silent — never crash the app
  }
}

// Unload all cached sounds on app background to free memory
AppState.addEventListener('change', (state: AppStateStatus) => {
  if (state === 'background' || state === 'inactive') {
    for (const key of Object.keys(_cache) as SoundKey[]) {
      const sound = _cache[key];
      if (sound) {
        sound.unloadAsync().catch(() => {});
        delete _cache[key];
      }
    }
    _audioModeSet = false;
  }
});

/** Public API */
export const AudioFeedback = {
  /** Set by useAudioPreference to enable/disable all sounds */
  setEnabled(value: boolean) {
    _enabled = value;
  },
  getEnabled() {
    return _enabled;
  },
  /** Fired on successful NFC card scan */
  nfcScan() {
    void play('nfcScan');
  },
  /** Fired on any successful action (save, publish, share) */
  success() {
    void play('success');
  },
  /** Fired on error or failed scan */
  error() {
    void play('error');
  },
  /** Fired on payment completion */
  payment() {
    void play('payment');
  },
};

export default AudioFeedback;
