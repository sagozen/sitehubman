/**
 * audioFeedback.ts
 *
 * Modern audio feedback manager for SiteHub NFC interactions.
 * Uses `expo-audio` (SDK 52+ / 57 compliant) with lazy loading, caching,
 * and graceful fallback.
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

type AudioModuleType = typeof import('expo-audio');
let _expoAudio: AudioModuleType | null = null;

async function getExpoAudio(): Promise<AudioModuleType | null> {
  if (_expoAudio) return _expoAudio;
  try {
    const mod = await import('expo-audio');
    _expoAudio = mod;
    return _expoAudio;
  } catch {
    return null;
  }
}

type AudioPlayerType = import('expo-audio').AudioPlayer;
const _players: Partial<Record<SoundKey, AudioPlayerType>> = {};
let _enabled = true; // Controlled by useAudioPreference

function getPlayer(key: SoundKey, mod: AudioModuleType): AudioPlayerType | null {
  if (_players[key]) return _players[key]!;
  try {
    const player = mod.createAudioPlayer(SOUND_ASSETS[key]);
    player.volume = 0.7;
    _players[key] = player;
    return player;
  } catch {
    return null;
  }
}

async function play(key: SoundKey) {
  if (!_enabled) return;
  try {
    const mod = await getExpoAudio();
    if (!mod) return;
    const player = getPlayer(key, mod);
    if (!player) return;
    await player.seekTo(0);
    player.play();
  } catch {
    // Graceful silent fallback
  }
}

// Release players when app goes to background
AppState.addEventListener('change', (state: AppStateStatus) => {
  if (state === 'background' || state === 'inactive') {
    for (const key of Object.keys(_players) as SoundKey[]) {
      const p = _players[key];
      if (p) {
        try {
          p.release();
        } catch {
          // Silent fallback
        }
        delete _players[key];
      }
    }
  }
});

export const AudioFeedback = {
  setEnabled(value: boolean) {
    _enabled = value;
  },
  getEnabled() {
    return _enabled;
  },
  nfcScan() {
    void play('nfcScan');
  },
  success() {
    void play('success');
  },
  error() {
    void play('error');
  },
  payment() {
    void play('payment');
  },
};

export default AudioFeedback;
